<template>
  <div class="note-content-wrapper">
    <div class="note-actions" v-if="note">
      <button
          v-if="isEditing"
          class="save-button"
          @click="saveChanges"
      >
        Сохранить
      </button>
<!--      <button
          class="delete-button"
          @click="deleteNote"
          v-if="!isEditing"
      >
        Удалить
      </button>-->
    </div>

    <div class="note-content">
      <div v-if="note" class="note-container">
        <h2>{{ note.title }}</h2>
        <div
            class="markdown-content"
            v-html="renderedContent"
            v-if="!isEditing"
            @dblclick="startEditing"
        ></div>
        <div
            v-else
            ref="editableDiv"
            contenteditable="true"
            class="edit-content"
            @input="updateEditableContent"
        ></div>
      </div>
      <div v-else class="empty-note">Выберите заметку из списка</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { supabase } from '@/clients/supabase';
import DOMPurify from 'dompurify';

const props = defineProps({
  noteId: String,
});

const emit = defineEmits(['editing-change', 'note-deleted']);

const note = ref(null);
const isEditing = ref(false);
const editableDiv = ref(null);
const editableContent = ref('');

const loadNote = async (id) => {
  if (!id) {
    note.value = null;
    return;
  }

  const { data, error } = await supabase
      .from('linote')
      .select('id, title, content, is_deleted')
      .eq('id', id)
      .single();

  if (!error) {
    note.value = data;
    // Убедимся, что content - это строка
    if (note.value.content && typeof note.value.content !== 'string') {
      note.value.content = JSON.stringify(note.value.content);
    }
  } else {
    console.error('Ошибка при загрузке заметки:', error);
    note.value = null;
  }
};

const renderedContent = computed(() => {
  if (!note.value?.content) return '';

  // Очищаем HTML перед отображением
  return DOMPurify.sanitize(note.value.content, {
    ALLOWED_TAGS: ['p', 'br', 'img', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'div'],
    ALLOWED_ATTR: ['src', 'style', 'class']
  });
});

const startEditing = () => {
  isEditing.value = true;
  emit('editing-change', true);
  editableContent.value = note.value.content;
  nextTick(() => {
    if (editableDiv.value) {
      editableDiv.value.innerHTML = note.value.content;
      editableDiv.value.focus();
    }
  });
};

const updateEditableContent = () => {
  if (editableDiv.value) {
    editableContent.value = editableDiv.value.innerHTML;
  }
};

const saveChanges = async () => {
  isEditing.value = false;
  emit('editing-change', false);

  // Сохраняем очищенный HTML
  const cleanHtml = DOMPurify.sanitize(editableContent.value, {
    ALLOWED_TAGS: ['p', 'br', 'img', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'div'],
    ALLOWED_ATTR: ['src', 'style', 'class']
  });

  note.value.content = cleanHtml;

  const { error } = await supabase
      .from('linote')
      .update({
        content: cleanHtml,
        updated_at: new Date().toISOString()
      })
      .eq('id', props.noteId);

  if (error) {
    console.error('Ошибка при сохранении заметки:', error);
  }
};

watch(
    () => props.noteId,
    (newId) => {
      loadNote(newId);
    },
    { immediate: true }
);
</script>

<style scoped>
.note-content-wrapper {
  position: relative;
  flex: 1;
  overflow-y: auto;
}

.note-actions {
  position: fixed;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  z-index: 1000;
}

.save-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.save-button:hover {
  background-color: #45a049;
  transform: scale(1.05);
}

.note-content {
  padding: 80px 20px 20px;
  display: flex;
  justify-content: center;
  min-height: 100%;
}

.note-container {
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.markdown-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: text;
  user-select: text;
}

.edit-content {
  width: 100%;
  min-height: 500px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  white-space: pre-wrap;
}

.empty-note {
  color: #999;
  font-style: italic;
  width: 100%;
  text-align: center;
  padding: 20px;
}

/* Стили для контента */
.markdown-content >>> p {
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.markdown-content >>> img {
  max-width: 100%;
  height: auto;
  margin: 10px 0;
  border-radius: 4px;
}

.markdown-content >>> h1,
.markdown-content >>> h2,
.markdown-content >>> h3 {
  margin: 24px 0 16px 0;
}

.markdown-content >>> ul,
.markdown-content >>> ol {
  padding-left: 24px;
  margin: 8px 0;
}

.markdown-content >>> pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>