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
  emits: ['note-created'], // Добавляем здесь декларацию emits
  setup(props, { emit }) { // Получаем emit через контекст
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
        ALLOWED_TAGS: ['p', 'br', 'img', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'div', 'span', 'a'],
        ALLOWED_ATTR: ['src', 'style', 'class', 'href', 'target']
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

    // Извлекаем ID видео из URL Rutube
    const extractVideoId = (url) => {
      const match = url.match(/rutube\.ru\/video\/([a-f0-9]+)/);
      return match ? match[1] : null;
    };

    // Функция для очистки HTML
    const sanitizePastedHtml = (html) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Удаляем нежелательные элементы
      const unwanted = tempDiv.querySelectorAll('script, iframe, link, meta, style');
      unwanted.forEach(el => el.remove());

      // Очищаем атрибуты
      const allElements = tempDiv.getElementsByTagName('*');
      for (let el of allElements) {
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('on') || attr.name === 'style') {
            el.removeAttribute(attr.name);
          }
        });
      }

      return tempDiv.innerHTML;
    };

    const handlePaste = async (e) => {
      e.preventDefault();
// Получаем URL источника из буфера обмена
      const sourceUrl = e.clipboardData.getData('text/plain').match(/(https?:\/\/[^\s]+)/)?.[0] || '';

      const html = e.clipboardData.getData('text/html');
      if (html) {
        // Очищаем HTML
        const cleanHtml = await sanitizePastedHtml(html);

        const selection = window.getSelection();
        if (selection.rangeCount) {
          const range = selection.getRangeAt(0);
          range.deleteContents();

          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = cleanHtml;
// Добавляем блок с URL источника (если есть)
          if (sourceUrl) {
            const sourceBlock = document.createElement('div');
            sourceBlock.className = 'source-url-block';

            const sourceText = document.createElement('p');
            sourceText.textContent = 'Источник:';
            sourceText.style.margin = '0 0 5px 0';
            sourceText.style.color = 'white';

            const sourceLink = document.createElement('a');
            sourceLink.href = sourceUrl;
            sourceLink.textContent = sourceUrl;
            sourceLink.target = '_blank';
            sourceLink.style.color = 'white';
            sourceLink.style.textDecoration = 'underline';
            sourceLink.style.wordBreak = 'break-all';

            sourceBlock.appendChild(sourceText);
            sourceBlock.appendChild(sourceLink);
            tempDiv.insertBefore(sourceBlock, tempDiv.firstChild);
          }
          // Обрабатываем видео-превью
          const videoEmbeds = tempDiv.querySelectorAll('iframe, script');
          videoEmbeds.forEach(embed => {
            if (embed.tagName === 'IFRAME' && embed.src) {
              // Создаем красный блок вместо iframe
              const videoBlock = document.createElement('div');
              videoBlock.className = 'video-placeholder';

              // Создаем ссылку
              const link = document.createElement('a');
              link.href = embed.src;
              link.textContent = 'Перейти к видео';
              link.target = '_blank';
              link.style.color = 'white';
              link.style.textDecoration = 'underline';

              // Добавляем текст
              const text = document.createElement('p');
              text.textContent = 'Видео контент';
              text.style.margin = '0 0 10px 0';
              text.style.color = 'white';

              videoBlock.appendChild(text);
              videoBlock.appendChild(link);
              embed.replaceWith(videoBlock);
            }

            if (embed.tagName === 'SCRIPT') {
              embed.remove();
            }
          });

          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          range.insertNode(fragment);
          range.collapse(false);
        }
      } else {
        // Обычная обработка текста
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
        // Проверка заполненности
        if (!editableArea.value?.textContent?.trim()) {
          alert("Заметка не может быть пустой!");
          return;
        }
        // Создаем копию контента для обработки
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = editableArea.value.innerHTML;
        // Удаляем оставшиеся скрипты
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        // Обрабатываем видео-блоки
        const videoBlocks = tempDiv.querySelectorAll('.video-placeholder');
        videoBlocks.forEach(block => {
          // Сохраняем только ссылку внутри блока
          const link = block.querySelector('a');
          if (link) {
            block.innerHTML = `<a href="${link.href}" target="_blank" style="color: white; text-decoration: underline;">Видео контент (перейти)</a>`;
            block.style.backgroundColor = '#ff4444';
            block.style.padding = '10px';
            block.style.textAlign = 'center';
            block.style.margin = '15px 0';
            block.style.width = '100%';
            block.style.display = 'block';
          }
        });
        // Обрабатываем изображения
        const images = tempDiv.querySelectorAll('img');
        const imageUrls = [];
        images.forEach(img => {
          if (img.src) {
            imageUrls.push(img.src);
            // Добавляем базовые стили
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.margin = '15px auto';
          }
        });
        // Добавляем отступы между элементами
        const elements = tempDiv.children;
        for (let i = 0; i < elements.length; i++) {
          elements[i].style.marginBottom = '15px';
          if (i === 0) {
            elements[i].style.marginTop = '0';
          }
        }
        // Санитизация HTML
        const cleanHtml = DOMPurify.sanitize(tempDiv.innerHTML, {
          ALLOWED_TAGS: ['p', 'br', 'img', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'div', 'a'],
          ALLOWED_ATTR: ['src', 'style', 'class', 'href', 'target']
        });
        // Проверка авторизации
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Необходимо авторизоваться");
        // Подготовка тегов
        const tagsArray = keywords.value.split(',').map(tag => tag.trim()).filter(Boolean);
        // Обрезаем заголовок до 255 символов
        const trimmedTitle = title.value.substring(0, 255);
        // Запрос к Supabase
        const { error: dbError } = await supabase
            .from('linote')
            .insert([{
          title: trimmedTitle,
          content: cleanHtml,
          image_url: imageUrls.join(','),
          user_id: user.id,
          tags: tagsArray,
          visibility: 'private'
        }]);

        if (dbError) throw dbError;
        // Добавляем эмит события
        alert("Заметка сохранена!");
        clearAll();
        emit('note-created');
        // Успешное сохранение
        isPreviewVisible.value = false;
      } catch (error) {
        console.error("Ошибка сохранения:", error);
        alert(`Ошибка сохранения: ${error.message}`);
      }
    };

    onMounted(() =>
        window.addEventListener('keydown', handleKeyDown));
    onUnmounted(() =>
        window.removeEventListener('keydown', handleKeyDown));

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
/*
* Стили для блока с URL источника *!
*/

.source-url-block {
  width: 100% !important;
  background-color: #ff4444 !important;
  padding: 15px !important;
  margin-bottom: 20px !important;
  border-radius: 4px !important;
  box-sizing: border-box !important;
  display: block !important;
}

.source-url-block p {
  color: white !important;
  margin: 0 0 5px 0 !important;
  font-size: 14px !important;
}

.source-url-block a {
  color: white !important;
  text-decoration: underline !important;
  font-size: 14px !important;
  word-break: break-all !important;
  display: inline-block !important;
  max-width: 100% !important;
}

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

/* Стили для изображений */
.note-editable-area img,
.preview-html img,
.preview-editable-area img {
  max-width: 100% !important;
  height: auto !important;
  display: block !important;
  margin: 15px auto !important;
}

/* Стили для видео-блоков */
.video-placeholder {
  width: 100% !important;
  background-color: #ff4444 !important;
  padding: 20px !important;
  margin: 15px 0 !important;
  border-radius: 4px !important;
  text-align: center !important;
  box-sizing: border-box !important;
  display: block !important;
}

.video-placeholder a {
  color: white !important;
  text-decoration: underline !important;
  font-weight: bold !important;
}

.video-placeholder p {
  color: white !important;
  margin: 0 0 10px 0 !important;
}

.video-placeholder::before {
  content: '▶';
  margin-right: 8px;
  font-size: 1.2em;
  color: white;
}

/* Отступы между элементами */
.note-editable-area > *,
.preview-html > *,
.preview-editable-area > * {
  margin-bottom: 15px !important;
  margin-top: 0 !important;
}

.note-editable-area > *:first-child,
.preview-html > *:first-child,
.preview-editable-area > *:first-child {
  margin-top: 0 !important;
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