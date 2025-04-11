<template>
  <div class="new-note-container">
    <h2>Создание заметки</h2>

    <!-- Кнопки управления и поле keywords -->
    <div class="controls-row">
      <div class="keywords-input">
        <input
          v-model="keywords"
          placeholder="Ключевые слова (через запятую)"
          class="keywords-field"
        >
      </div>
      <div class="button-group">
        <button @click="showPreview" class="preview-button">
          Предпросмотр
        </button>
        <button @click="saveNote" class="save-button">
          Сохранить заметку
        </button>
      </div>
    </div>

    <!-- Редактор с отступом -->
    <div class="editor-container">
      <div
        ref="editableArea"
        contenteditable="true"
        class="note-editable-area"
        placeholder="Введите текст заметки..."
        @paste="handlePaste"
      ></div>
    </div>

    <!-- Окно предпросмотра -->
    <div v-if="isPreviewVisible" class="preview-modal">
      <div class="preview-content">
        <div class="preview-header">
          <h3>Предпросмотр заметки</h3>
          <button @click="closePreview" class="close-preview">&times;</button>
        </div>
        <div class="preview-scroll-container">
          <div class="preview-html" v-html="previewContent"></div>
        </div>
      </div>
    </div>

    <!-- Логи -->
    <div v-if="logMessages.length" class="log-console">
      <h3>Лог выполнения:</h3>
      <div v-for="(log, index) in logMessages"
           :key="index"
           class="log-message"
           :class="log.type">
        [{{ log.timestamp }}] {{ log.message }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
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

      previewContent.value = editableArea.value.innerHTML;
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
      const text = clipboardData.getData('text/plain');
      const html = clipboardData.getData('text/html');

      if (html) {
        try {
          const cleanHtml = await cleanPastedHtml(html);
          document.execCommand('insertHTML', false, cleanHtml);
          addLog('HTML-контент добавлен из буфера');
          return;
        } catch (error) {
          addLog(`Ошибка обработки HTML: ${error.message}`, 'error');
        }
      }

      if (text) {
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
            editableArea.value.appendChild(img);

            addLog(`Публичная ссылка: ${imageUrl}`);
          } catch (error) {
            addLog(`Ошибка загрузки изображения: ${error.message}`, 'error');
          }
        }
      }
    };

    const cleanPastedHtml = (html) => {
      return html
        .replace(/<meta[^>]*>/g, '')
        .replace(/<style[^>]*>.*?<\/style>/g, '')
        .replace(/<script[^>]*>.*?<\/script>/g, '')
        .replace(/<font[^>]*>/g, '<span>')
        .replace(/<\/font>/g, '</span>');
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

        // Извлекаем первый абзац как заголовок
        const firstParagraph = editableArea.value.textContent.split('\n')[0] || 'Без названия';
        title.value = firstParagraph.substring(0, 255);

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
        noteContent.value = '';

      } catch (error) {
        addLog(`Ошибка сохранения заметки: ${error.message}`, 'error');
      }
    };

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
      saveNote
    };
  }
};
</script>

<style scoped>
.new-note-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
}

/* Фиксированный блок управления */
.controls-row {
  position: sticky;
  top: 0;
  background: white;
  padding: 15px 0;
  z-index: 100;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
  align-items: center;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
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
  gap: 10px;
}

.preview-button {
  padding: 10px 15px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.preview-button:hover {
  background-color: #cc0000;
}

.save-button {
  padding: 10px 15px;
  background-color: #00C851;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.save-button:hover {
  background-color: #007E33;
}

/* Остальные стили остаются без изменений */
.note-editable-area {
  width: 100%;
  min-height: 200px;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #000000;
  border-radius: 4px;
  font-family: inherit;
  outline: none;
  white-space: pre-wrap;
  background: white;
  line-height: 1.5;
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