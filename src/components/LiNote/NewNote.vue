<template>
  <div class="new-note-container">
    <!-- Кнопки управления и поля ввода -->
    <div class="controls-row">
      <input
        v-model="title"
        placeholder="Заголовок"
        class="title-field"
      >
      <input
        v-model="keywords"
        placeholder="Ключевые слова"
        class="keywords-field"
      >
      <div
        ref="editableArea"
        contenteditable="true"
        class="note-editable-area"
        placeholder="Текст заметки..."
        @paste="handlePaste"
        @input="updateTitleFromContentAndCheckEmpty"
      ></div>
      <div class="button-group">
        <button @click="clearAll" class="clear-button" :disabled="isEditableAreaEmpty">
          Очистить
        </button>
        <button @click="showPreview" class="preview-button" :disabled="isEditableAreaEmpty">
          Просмотр
        </button>
        <button @click="saveNote" class="save-button" :disabled="isEditableAreaEmpty">
          Сохранить
        </button>
      </div>
    </div>

    <!-- Модальное окно предпросмотра -->
    <div v-if="isPreviewVisible" class="preview-modal" @keydown.esc="closePreview" tabindex="0">
      <div class="preview-content" :class="{ 'edit-mode': isEditMode }">
        <div class="preview-header">
          <h3>{{ title || 'Без названия' }}</h3>
          <div class="preview-actions">
            <button
              @click="toggleEditMode"
              class="edit-button"
              :class="{ 'active': isEditMode }"
            >
              {{ isEditMode ? 'Просмотр' : 'Редактировать' }}
            </button>
            <button @click="saveNote" class="save-button">
              Сохранить
            </button>
            <button @click="closePreview" class="close-button-top" title="Закрыть (Esc)">
              &times;
            </button>
          </div>
        </div>
        <div class="preview-scroll-container">
          <!-- Режим редактирования -->
          <div
            v-if="isEditMode"
            ref="previewEditableArea"
            contenteditable="true"
            class="preview-editable-area"
            v-html="previewContent"
            @input="updatePreviewContent"
          ></div>

          <!-- Режим просмотра -->
          <div
            v-else
            class="preview-html"
            v-html="safePreviewContent"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { supabase } from '@/clients/supabase.js';
import DOMPurify from 'dompurify';

export default {
  name: "NewNote",
  setup() {
    const editableArea = ref(null);
    const previewEditableArea = ref(null);
    const noteContent = ref('');
    const logMessages = ref([]);
    const isPreviewVisible = ref(false);
    const isEditMode = ref(false);
    const previewContent = ref('');
    const keywords = ref('');
    const title = ref('');
    const isEditableAreaEmpty = ref(true);

    // Безопасное отображение HTML
    const safePreviewContent = computed(() => {
      return DOMPurify.sanitize(previewContent.value, {
        ALLOWED_TAGS: ['p', 'br', 'img', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'div', 'span'],
        ALLOWED_ATTR: ['src', 'style', 'class']
      });
    });

    const checkEditableAreaEmpty = () => {
      const hasTitle = title.value.trim() !== '';
      const hasKeywords = keywords.value.trim() !== '';
      let hasContent = false;

      if (editableArea.value) {
        hasContent = editableArea.value.textContent.trim() !== '' ||
                    editableArea.value.innerHTML.trim() !== '';
      }

      isEditableAreaEmpty.value = !(hasTitle || hasKeywords || hasContent);
    };

    const updateTitleFromContent = () => {
      if (!editableArea.value) return;
      const textContent = editableArea.value.textContent || '';
      const firstParagraph = textContent.split('\n')[0] || '';
      if (!title.value || title.value === '') {
        title.value = firstParagraph.substring(0, 255);
      }
    };

    const updateTitleFromContentAndCheckEmpty = () => {
      updateTitleFromContent();
      checkEditableAreaEmpty();
    };

    const handlePaste = async (e) => {
      e.preventDefault();

      // Проверяем, есть ли в буфере HTML или изображения
      const clipboardItems = e.clipboardData.items;
      let hasImage = false;
      let hasHtml = false;

      // Проверяем на наличие изображений
      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.indexOf('image') !== -1) {
          hasImage = true;
          const blob = clipboardItems[i].getAsFile();

          try {
            // Загружаем изображение в storage
            const fileExt = blob.name.split('.').pop() || 'png';
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
                .from('linknote')
                .upload(filePath, blob);

            if (error) throw error;

            // Получаем публичный URL
            const { data: { publicUrl } } = supabase.storage
                .from('linknote')
                .getPublicUrl(filePath);

            // Вставляем изображение в редактор
            const img = document.createElement('img');
            img.src = publicUrl;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.margin = '10px auto';
            img.style.display = 'block';

            const selection = window.getSelection();
            if (selection.rangeCount) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(img);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }

            // Обновляем содержимое
            updateTitleFromContentAndCheckEmpty();

          } catch (error) {
            console.error('Ошибка загрузки изображения:', error);
            // Вставляем как обычный текст, если не удалось загрузить изображение
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }
          break;
        }
      }

      // Если нет изображений, проверяем HTML
      if (!hasImage) {
        for (let i = 0; i < clipboardItems.length; i++) {
          if (clipboardItems[i].type === 'text/html') {
            hasHtml = true;
            const html = e.clipboardData.getData('text/html');

            // Создаем временный div для обработки HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Обрабатываем изображения в HTML
            const images = tempDiv.getElementsByTagName('img');
            for (let img of images) {
              if (img.src && !img.src.includes(supabase.storage.url)) {
                img.setAttribute('data-external-image', 'true');
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.margin = '10px auto';
                img.style.display = 'block';
              }
            }

            // Вставляем обработанный HTML
            const selection = window.getSelection();
            if (selection.rangeCount) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(tempDiv);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
            break;
          }
        }
      }

      // Если нет ни изображений, ни HTML, вставляем как текст
      if (!hasImage && !hasHtml) {
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
      }

      updateTitleFromContentAndCheckEmpty();
    };
    watch(editableArea, (newVal) => {
      if (newVal) checkEditableAreaEmpty();
    }, { immediate: true });

    watch([title, keywords], () => {
      checkEditableAreaEmpty();
    }, { deep: true });

    const clearAll = () => {
      if (editableArea.value) editableArea.value.innerHTML = '';
      title.value = '';
      keywords.value = '';
      isEditableAreaEmpty.value = true;
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isPreviewVisible.value) {
        closePreview();
      }
    };

    const showPreview = () => {
      if (!editableArea.value) return;
      updateTitleFromContent();
      previewContent.value = editableArea.value.innerHTML;
      isPreviewVisible.value = true;
      isEditMode.value = false;
    };

    const toggleEditMode = async () => {
      isEditMode.value = !isEditMode.value;
      if (isEditMode.value) {
        await nextTick();
        if (previewEditableArea.value) {
          previewEditableArea.value.focus();
        }
      } else {
        previewContent.value = previewEditableArea.value.innerHTML;
      }
    };

    const updatePreviewContent = () => {
      if (previewEditableArea.value) {
        previewContent.value = previewEditableArea.value.innerHTML;
      }
    };

    const closePreview = () => {
      if (isEditMode.value && previewEditableArea.value && editableArea.value) {
        editableArea.value.innerHTML = previewEditableArea.value.innerHTML;
      }
      isPreviewVisible.value = false;
      isEditMode.value = false;
    };

    const saveNote = async (event) => {
      event?.preventDefault();

      try {
        // Синхронизация данных из preview
        if (isPreviewVisible.value && isEditMode.value && previewEditableArea.value && editableArea.value) {
          editableArea.value.innerHTML = previewEditableArea.value.innerHTML;
        }

        if (!editableArea.value?.textContent?.trim()) {
          alert("Заметка не может быть пустой!");
          return;
        }

        // Создаем временный контейнер для обработки
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = editableArea.value.innerHTML;

        // Обрабатываем все элементы
        const allElements = tempDiv.children;
        const imageUrls = [];
        let previousWasImage = false;

        // Обрабатываем каждый элемент отдельно
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];

          // Обработка изображений
          if (el.tagName === 'IMG') {
            const imgSrc = el.src;
            if (imgSrc) {
              imageUrls.push(imgSrc);
              if (!imgSrc.includes(supabase.storage.url)) {
                el.setAttribute('data-external-image', 'true');
              }

              // Создаем контейнер для изображения
              const imgContainer = document.createElement('div');
              imgContainer.style.margin = '20px 0';
              imgContainer.style.padding = '10px 0';
              imgContainer.style.borderTop = '1px solid #eee';
              imgContainer.style.borderBottom = '1px solid #eee';
              imgContainer.style.textAlign = 'center';

              // Копируем изображение в контейнер
              const newImg = el.cloneNode(true);
              newImg.style.maxWidth = '100%';
              newImg.style.height = 'auto';
              newImg.style.display = 'block';
              imgContainer.appendChild(newImg);

              // Заменяем оригинальный элемент
              el.parentNode.replaceChild(imgContainer, el);
              previousWasImage = true;
            }
          }
          // Обработка текстовых блоков
          else {
            // Добавляем отступы перед текстом после изображения
            if (previousWasImage) {
              el.style.marginTop = '20px';
            }
            // Добавляем отступы перед текстом перед изображением
            if (i < allElements.length - 1 && allElements[i+1].tagName === 'IMG') {
              el.style.marginBottom = '20px';
            }

            // Удаляем пустые элементы
            if (!el.textContent.trim() && !el.querySelector('img, br')) {
              el.remove();
              i--; // Уменьшаем счетчик, так как элемент удален
            } else {
              previousWasImage = false;
            }
          }
        }

        // Получаем обработанный HTML
        let contentHtml = tempDiv.innerHTML;

        // Санитизация HTML
        const cleanHtml = DOMPurify.sanitize(contentHtml, {
          ALLOWED_TAGS: ['p', 'br', 'img', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'div'],
          ALLOWED_ATTR: ['src', 'style', 'class', 'data-external-image']
        });

        // Проверка авторизации и сохранение (остается без изменений)
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Необходимо авторизоваться");

        const tagsArray = keywords.value.split(',').map(tag => tag.trim()).filter(Boolean);
        const trimmedTitle = title.value.substring(0, 255);

        const { error: dbError } = await supabase.from('linote').insert([{
          title: trimmedTitle,
          content: cleanHtml,
          image_url: imageUrls.join(','),
          user_id: user.id,
          tags: tagsArray,
          visibility: 'private'
        }]);

        if (dbError) throw dbError;

        alert("Заметка сохранена!");
        clearAll();
        isPreviewVisible.value = false;
      } catch (error) {
        console.error("Ошибка сохранения:", error);
        alert(`Ошибка сохранения: ${error.message}`);
      }
    };


    onMounted(() => window.addEventListener('keydown', handleKeyDown));
    onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));

    return {
      editableArea,
      previewEditableArea,
      noteContent,
      isPreviewVisible,
      isEditMode,
      previewContent,
      safePreviewContent,
      keywords,
      title,
      isEditableAreaEmpty,
      showPreview,
      closePreview,
      saveNote,
      updateTitleFromContentAndCheckEmpty,
      clearAll,
      toggleEditMode,
      updatePreviewContent,
      handlePaste
    };
  }
};
</script>

<style scoped>

.new-note-container {
  height: 50px;
  width: 100%;
  background-color: orange;
  padding: 0;
  box-sizing: border-box;
  display: flex;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 100%;
  width: 100%;
  background-color: orange;
  padding: 0 5px;
}

.note-editable-area {
  resize: none;
  width: 200px;
  height: 40px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #000000;
  border-radius: 4px;
  font-family: inherit;
  outline: none;
  white-space: pre-wrap;
  background: pink;
  line-height: 1.5;
}

.title-field,
.keywords-field,
.note-editable-area {
  flex: 1;
  height: 40px;
  padding-left: 5px;
  border: 1px solid #000;
  border-radius: 3px;
  color: black;
  background-color: #ffffff;
  font-size: 14px;
  box-sizing: border-box;
}

.button-group {
  display: flex;
  gap: 5px;
  height: 40px;
}

.clear-button {
  background-color: #9c27b0;
  color: white;
}

.clear-button:hover {
  background-color: #7b1fa2;
}

.preview-button {
  background-color: #ff4444;
  color: white;
}

.preview-button:hover {
  background-color: #cc0000;
}

.save-button {
  background-color: #00C851;
  color: white;
}

.save-button:hover {
  background-color: #007E33;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.preview-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  color: black;
  flex-direction: column;
  border: 5px solid #a5d6a7; /* Светло-зеленый цвет по умолчанию */
}

.preview-content.edit-mode {
  border: 5px solid #ef9a9a; /* Светло-красный цвет в режиме редактирования */
}

.preview-scroll-container {
  overflow-y: auto;
  flex-grow: 1;
  padding-right: 10px;
}

.preview-html {
  padding: 10px;
}

.preview-editable-area {
  min-height: 300px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  background: white;
}

.preview-html img,
.preview-editable-area img,
.note-editable-area img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 20px auto !important;
  padding: 10px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.preview-html p,
.preview-editable-area p,
.note-editable-area p {
  margin: 20px 0 !important;
  line-height: 1.6;
}

.preview-html div,
.preview-editable-area div,
.note-editable-area div {
  margin: 20px 0 !important;
}

.preview-html br,
.preview-editable-area br,
.note-editable-area br {
  content: "";
  display: block;
  margin: 10px 0;
}

.edit-button {
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 8px 15px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.edit-button:hover {
  background-color: #f57c00;
}

.edit-button.active {
  background-color: #4caf50;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-button-top {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 30px;
  height: 30px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: all 0.2s ease;
}
</style>