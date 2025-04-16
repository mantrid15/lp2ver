<template>
  <div class="note-content-wrapper">
    <div class="edit-buttons">
      <button class="save-button" @click="saveChanges">
        Сохранить
      </button>
      <button class="cancel-button" @click="cancelEditing" v-if="isEditing">
        Отменить
      </button>
      <button class="edit-button" @click="startEditing" v-else>
        Редактировать
      </button>
    </div>

    <div class="note-content">
      <div v-if="note" class="note-container">
        <h2>{{ note.title }}</h2>
        <div
          class="markdown-content"
          v-html="renderedMarkdown"
          v-if="!isEditing"
        ></div>
        <div v-else class="editable-content" ref="editableDiv" contenteditable="true"></div>
      </div>
      <div v-else class="empty-note">Выберите заметку из списка</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { marked } from 'marked';
import { supabase } from '@/clients/supabase';

const props = defineProps({
  noteId: String,
});

const emit = defineEmits(['editing-change']);

const note = ref(null);
const isEditing = ref(false);
const editableDiv = ref(null);
const originalHtml = ref('');

marked.use({
  renderer: {
    image(href, title, text) {
      return `
        <div class="image-container" draggable="false">
          <img
            src="${href}"
            alt="${text}"
            title="${title || ''}"
            class="markdown-image resizable"
            loading="lazy"
            draggable="false"
          >
        </div>
      `;
    },
    paragraph(text) {
      return `<p class="markdown-paragraph">${text}</p>`;
    },
    heading(text, level) {
      return `<h${level} class="markdown-heading">${text}</h${level}>`;
    },
    list(body, ordered) {
      const tag = ordered ? 'ol' : 'ul';
      return `<${tag} class="markdown-list">${body}</${tag}>`;
    },
    code(code, infostring, escaped) {
      return `<pre class="markdown-code"><code>${code}</code></pre>`;
    }
  }
});

const loadNote = async (id) => {
  const { data, error } = await supabase
    .from('linote')
    .select('title, content')
    .eq('id', props.noteId)
    .single();

  if (!error) {
    note.value = data;
    originalHtml.value = marked(data.content || '');
  } else {
    console.error('Ошибка при загрузке заметки:', error);
  }
};

const renderedMarkdown = computed(() => {
  return note.value ? marked(note.value.content || '') : '';
});

const startEditing = () => {
  isEditing.value = true;
  emit('editing-change', true);

  nextTick(() => {
    editableDiv.value.innerHTML = originalHtml.value;
    // Устанавливаем курсор в начало редактируемого блока
    const range = document.createRange();
    range.selectNodeContents(editableDiv.value);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
};

const saveChanges = async () => {
  isEditing.value = false;
  emit('editing-change', false);

  // Сохраняем отредактированный HTML
  originalHtml.value = editableDiv.value.innerHTML;

  // Преобразуем HTML обратно в Markdown (упрощенный вариант)
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = originalHtml.value;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';

  note.value.content = plainText;

  const { error } = await supabase
    .from('linote')
    .update({
      content: plainText,
      updated_at: new Date().toISOString()
    })
    .eq('id', props.noteId);

  if (error) {
    console.error('Ошибка при сохранении заметки:', error);
  }
};

const cancelEditing = () => {
  isEditing.value = false;
  emit('editing-change', false);
};

watch(
  () => props.noteId,
  (newId) => {
    if (newId) {
      loadNote(newId);
    } else {
      note.value = null;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.editable-content {
  width: 100%;
  min-height: 500px;
  padding: 12px;
  border: 1px solid #000000;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  outline: none;
}

.markdown-code {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 8px 0;
  font-family: monospace;
}

.empty-note {
  color: #999;
  font-style: italic;
  width: 100%;
  text-align: center;
  padding: 20px;
}

/* Глобальные стили для markdown-контента */
:deep(.markdown-paragraph) {
  line-height: 1.6;
  margin: 0;
}

:deep(.markdown-heading) {
  margin: 1em 0 0.5em 0;
}

:deep(.markdown-list) {
  padding-left: 24px;
  margin: 8px 0;
}

:deep(.markdown-code) {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

:deep(.image-container) {
  position: relative;
  display: inline-block;
}

:deep(.markdown-image) {
  cursor: move;
  user-select: none;
}

:deep(.markdown-image:hover) {
  outline: 2px dashed #4285f4;
}
</style>