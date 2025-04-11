<template>
  <div class="new-note-container">
    <!-- Кнопки управления и поле keywords -->
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
          @input="updateTitleFromContent"
      ></div>
      <div class="button-group">
        <button @click="clearAll" class="clear-button">
          Очистить
        </button>
        <button @click="showPreview" class="preview-button">
          Просмотр
        </button>
        <button @click="saveNote" class="save-button">
          Сохранить
        </button>
      </div>
    </div>
    <!-- Окно предпросмотра -->
    <div v-if="isPreviewVisible" class="preview-modal" @keydown.esc="closePreview" tabindex="0">
      <div class="preview-content">
        <div class="preview-header">
          <h3>Предпросмотр заметки</h3>
          <div class="preview-actions">
            <button @click="saveNote" class="save-button">
              Сохранить
            </button>
            <button @click="closePreview" class="close-button-top" title="Закрыть (Esc)">
              &times;
            </button>
          </div>
        </div>
        <div class="preview-scroll-container">
          <div class="preview-html" v-html="previewContent"></div>
        </div>
      </div>
    </div>

    <!-- Логи -->
<!--
    <div v-if="logMessages.length" class="log-console">
      <h3>Лог выполнения:</h3>
      <div v-for="(log, index) in logMessages"
           :key="index"
           class="log-message"
           :class="log.type">
        [{{ log.timestamp }}] {{ log.message }}
      </div>
    </div>
-->
  </div>
</template>

<script>
import { ref, nextTick , onMounted, onUnmounted } from 'vue';
import { supabase } from '@/clients/supabase.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default {
  name: "NewNote",
  setup() {
    const editableArea = ref(null);
    const noteContent = ref('');
    const logMessages = ref([]);
    const isPreviewVisible = ref(false);
    const previewContent = ref('');
    const keywords = ref('');
    const title = ref('');

    const clearAll = () => {
      if (editableArea.value) {
        editableArea.value.innerHTML = '';
      }
      title.value = '';
      keywords.value = '';
      addLog('Все поля очищены', 'info');
    };


    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isPreviewVisible.value) {
        closePreview();
      }
    };

    // Автоматическое определение заголовка из первого абзаца
    const updateTitleFromContent = () => {
      if (!editableArea.value) return;

      const textContent = editableArea.value.textContent || '';
      const firstParagraph = textContent.split('\n')[0] || '';

      // Если заголовок еще не задан вручную или пуст, обновляем его
      if (!title.value || title.value === '') {
        title.value = firstParagraph.substring(0, 255);
      }
    };

    const addLog = (message, type = 'info') => {
      logMessages.value.unshift({
        message,
        type,
        timestamp: new Date().toLocaleTimeString()
      });
      console.log(`[${type}] ${message}`);
    };

    const showPreview = () => {
      if (!editableArea.value) return;

      // Обновляем заголовок перед показом предпросмотра
      updateTitleFromContent();

      previewContent.value = `
        <h1>${title.value}</h1>
        ${editableArea.value.innerHTML}
      `;
      isPreviewVisible.value = true;
      addLog('Открыт предпросмотр заметки');
    };

    const closePreview = () => {
      isPreviewVisible.value = false;
      addLog('Предпросмотр закрыт');
    };

    const handlePaste = async (event) => {
      event.preventDefault();
      addLog('Начало обработки вставки');

      const clipboardData = event.clipboardData || window.clipboardData;
      let text = clipboardData.getData('text/plain');
      const html = clipboardData.getData('text/html');

      // Функция для очистки текста от начальных пробелов и непечатаемых символов
      const cleanText = (str) => {
        return str.replace(/^[\s\uFEFF\xA0]+/, '').replace(/[\s\uFEFF\xA0]+$/, '');
      };

      if (html) {
        try {
          const cleanHtml = await cleanPastedHtml(html);
          document.execCommand('insertHTML', false, cleanHtml);
          addLog('HTML-контент добавлен из буфера');

          // Прокрутка после вставки
          await nextTick();
          if (editableArea.value) {
            editableArea.value.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
          return;
        } catch (error) {
          addLog(`Ошибка обработки HTML: ${error.message}`, 'error');
        }
      }

      if (text) {
        // Очищаем текст перед вставкой
        text = cleanText(text);
        document.execCommand('insertText', false, text);
        addLog('Текст добавлен из буфера');
      }

      for (const item of clipboardData.items) {
        if (item.type.startsWith('image/')) {
          addLog(`Обнаружено изображение: ${item.type}`);
          const blob = item.getAsFile();

          try {
            const imageUrl = await uploadImage(blob);
            addLog(`Изображение загружено: ${imageUrl}`);

            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.margin = '10px auto';
            editableArea.value.appendChild(img);

            // Прокрутка после вставки изображения
            await nextTick();
            if (editableArea.value) {
              editableArea.value.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }

            addLog(`Публичная ссылка: ${imageUrl}`);
          } catch (error) {
            addLog(`Ошибка загрузки изображения: ${error.message}`, 'error');
          }
        }
      }
    };

    const cleanPastedHtml = (html) => {
      // Обработка изображений в HTML
      const processedHtml = html
          .replace(/<img([^>]*)>/g, (match, attrs) => {
            return `<img${attrs} style="max-width:100%; height:auto; display:block; margin:10px auto;">`;
          })
          .replace(/width="[^"]*"/g, '')
          .replace(/height="[^"]*"/g, '')
          .replace(/<meta[^>]*>/g, '')
          .replace(/<style[^>]*>.*?<\/style>/g, '')
          .replace(/<script[^>]*>.*?<\/script>/g, '')
          .replace(/<font[^>]*>/g, '<span>')
          .replace(/<\/font>/g, '</span>');

      return processedHtml;
    };

    const uploadImage = async (blob) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Требуется авторизация');

        const fileExt = blob.type.split('/')[1] || 'png';
        const fileName = `image-${Date.now()}.${fileExt}`;
        const filePath = `user_${user.id}/${fileName}`;

        const { error } = await supabase.storage
          .from('linknote')
          .upload(filePath, blob);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('linknote')
          .getPublicUrl(filePath);

        return publicUrl;
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    };

    const saveNote = async () => {
      if (!editableArea.value || !editableArea.value.textContent.trim()) {
        addLog('Заметка пуста, сохранение отменено', 'warning');
        return;
      }

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw userError || new Error('Требуется авторизация');

        // Обновляем заголовок перед сохранением
        updateTitleFromContent();

        // Очищаем HTML перед сохранением
        const cleanContent = DOMPurify.sanitize(editableArea.value.innerHTML);

        // Подготовка тегов из keywords
        const tagsArray = keywords.value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        // Извлекаем первое изображение для image_url
        const firstImg = editableArea.value.querySelector('img');
        const imageUrl = firstImg ? firstImg.src : null;

        const { error } = await supabase
            .from('linote')
            .insert([{
              title: title.value,
              content: cleanContent,
              image_url: imageUrl,
              user_id: user.id,
              tags: tagsArray,
              visibility: 'private' // или другой статус по умолчанию
            }]);

        if (error) throw error;

        addLog('Заметка успешно сохранена в базе данных', 'success');

        // Очищаем поля после сохранения
        editableArea.value.innerHTML = '';
        keywords.value = '';
        title.value = '';
        noteContent.value = '';

        // Закрываем окно предпросмотра после сохранения
        isPreviewVisible.value = false;

      } catch (error) {
        addLog(`Ошибка сохранения заметки: ${error.message}`, 'error');
      }
    };

    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });

    return {
      editableArea,
      noteContent,
      logMessages,
      isPreviewVisible,
      previewContent,
      keywords,
      title,
      handlePaste,
      showPreview,
      closePreview,
      saveNote,
      updateTitleFromContent,
      clearAll
    };
  }
};
</script>

<style scoped>
/* Добавляем стиль для кнопки Очистить */
.clear-button {
  background-color: #9c27b0;
  color: white;
}
.clear-button:hover {
  background-color: #7b1fa2;
}

.clear-button,
.preview-button,
.save-button {
  height: 100%;
  padding: 0 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;
  transition: background-color 0.2s;
}
/* Обновляем стили для заголовка предпросмотра */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  position: relative;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.note-editable-area {
  width: 100%;
  min-height: 30px;
  max-height: 30px;
  overflow-y: auto;
  padding: 10px;
  /*
  margin-bottom: 15px;
  */
  border: 1px solid #000000;
  border-radius: 4px;
  font-family: inherit;
  outline: none;
  white-space: pre-wrap;
  background: white;
  line-height: 1.5;
}

.note-editable-area img {
  max-width: 100% !important;
  height: auto !important;
  display: block !important;
  margin: 10px auto !important;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  position: relative;
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

.close-button-top:hover {
  background-color: #cc0000;
  transform: scale(1.1);
}

.close-button-top:active {
  transform: scale(0.95);
}

.close-preview {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #555;
  padding: 0 8px;
  transition: color 0.2s;
}

.close-preview:hover {
  color: #000;
}
/* Добавляем стили для поля заголовка */
.title-input {
  flex-grow: 1;
  min-width: 200px;
  border: 1px solid #000;
}

.title-field {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-weight: bold;
  font-size: 1.1em;
}

.new-note-container {
  height: 50px; /* Общая высота компонента */
  background-color: orange;
  padding: 0;
  box-sizing: border-box;
  display: flex;
}
/* Фиксированный блок управления */
.controls-row {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 100%;
  width: 100%;
  background-color: orange;
  padding: 0 5px;
}
/* Контейнер редактора с отступом */
.editor-container {
  margin-top: 70px; /* Отступ под фиксированный блок */
}

.keywords-input {
  flex-grow: 1;
  min-width: 200px;
  border: 1px solid #000000;
}

.keywords-field {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

.button-group {
  display: flex;
  gap: 5px;
  height: 30px;
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
/* Остальные стили остаются без изменений */
.note-editable-area {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 18px;
}

.title-field,
.keywords-field,
.note-editable-area {
  flex: 1;
  height: 30px; /* Чуть меньше общей высоты для визуального комфорта */
  padding: 5px 8px;
  border: 1px solid #000;
  border-radius: 3px;
  background-color: white;
  font-size: 12px;
  box-sizing: border-box;
}

.note-editable-area:empty::before {
  content: attr(placeholder);
  color: gray;
  display: block;
}

.note-editable-area img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
  border: 1px solid #eee;
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
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.preview-scroll-container {
  overflow-y: auto;
  flex-grow: 1;
  padding-right: 10px;
}

.preview-html {
  padding: 10px;
}

.close-preview {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #555;
}

.preview-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.preview-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.preview-scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.preview-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.log-console {
  margin-top: 20px;
  padding: 15px;
  background: #f0f0f0;
  border-radius: 4px;
  border: 1px solid #ddd;
  max-height: 200px;
  overflow-y: auto;
}

.log-message {
  padding: 5px 0;
  border-bottom: 1px solid #e0e0e0;
  font-family: monospace;
  font-size: 0.9em;
}

.log-message.info {
  color: #31708f;
  background-color: #d9edf7;
}

.log-message.success {
  color: #3c763d;
  background-color: #dff0d8;
}

.log-message.warning {
  color: #8a6d3b;
  background-color: #fcf8e3;
}

.log-message.error {
  color: #a94442;
  background-color: #f2dede;
}
</style>