<template>
  <div class="new-note-container">
    <h2>Создание заметки</h2>

    <!-- Кнопки управления - теперь над редактором -->
    <div class="button-group">
      <button @click="showPreview" class="preview-button">
        Предпросмотр
      </button>
      <button @click="saveNote" class="save-button">
        Сохранить заметку
      </button>
    </div>

    <!-- Редактор -->
    <div
      ref="editableArea"
      contenteditable="true"
      class="note-editable-area"
      placeholder="Введите текст заметки..."
      @paste="handlePaste"
    ></div>

    <!-- Окно предпросмотра с улучшенной прокруткой -->
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
import { ref, onMounted } from 'vue';
import { supabase } from '@/clients/supabase.js';

export default {
  name: "NewNote",
  setup() {
    const editableArea = ref(null);
    const noteContent = ref('');
    const logMessages = ref([]);
    const isPreviewVisible = ref(false);
    const previewContent = ref('');

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

      // Если есть HTML (например, при копировании из Word или веб-страницы)
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

      // Обработка текста
      const text1 = event.clipboardData.getData('text/plain');
      if (text) {
        document.execCommand('insertText', false, text1);
        addLog('Текст добавлен из буфера');
      }

      // Обработка изображений
      for (const item of clipboardData.items) {
        if (item.type.startsWith('image/')) {
          addLog(`Обнаружено изображение: ${item.type}`);
          const blob = item.getAsFile();

          try {
            const imageUrl = await uploadImage(blob);
            addLog(`Изображение загружено: ${imageUrl}`);

            // Вставляем изображение в редактор
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
      // Упрощенная очистка HTML (можно расширить по необходимости)
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

    const saveNote = () => {
      if (!editableArea.value) return;

      noteContent.value = editableArea.value.innerHTML;
      addLog('Заметка сохранена', 'success');

      // Здесь можно добавить сохранение в базу данных
    };

    return {
      editableArea,
      noteContent,
      logMessages,
      isPreviewVisible,
      previewContent,
      handlePaste,
      showPreview,
      closePreview,
      saveNote
    };
  }
};
</script>

<style scoped>
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

.preview-button {
  padding: 10px 15px;
  background-color: #ff4444; /* Красный цвет */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: bold;
}

.preview-button:hover {
  background-color: #cc0000; /* Темнее красный при наведении */
}

.save-button {
  padding: 10px 15px;
  background-color: #00C851; /* Зеленый цвет */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: bold;
}

.save-button:hover {
  background-color: #007E33; /* Темнее зеленый при наведении */
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

/* Улучшенное окно предпросмотра */
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
  padding-right: 10px; /* Для компенсации скроллбара */
}

.preview-html {
  padding: 10px;
}

/* Стили полосы прокрутки */
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

</style>