<template>
  <div class="note-content-wrapper">
    <button
        v-if="note && isEditing"
        class="save-button"
        @click="saveChanges"
    >
      Сохранить
    </button>

    <div class="note-content">
      <div v-if="note" class="note-container">
        <h2>{{ note.title }}</h2>
        <div
            class="markdown-content"
            v-html="renderedMarkdown"
            v-if="!isEditing"
            @dblclick="startEditing"
        ></div>
        <textarea
            v-else
            class="edit-textarea"
            v-model="editableContent"
            ref="textarea"
        ></textarea>
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
            onload="this.style.opacity = 1; this.parentElement.dataset.originalWidth = this.naturalWidth; this.parentElement.dataset.originalHeight = this.naturalHeight;"
            draggable="false"
          >
          <div class="resize-handle" draggable="false"></div>
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
  editableContent.value = note.value.content;
  nextTick(() => {
    textarea.value.focus();
  });
};

const saveChanges = async () => {
  isEditing.value = false;
  emit('editing-change', false);
  note.value.content = editableContent.value;

  const { error } = await supabase
      .from('linote')
      .update({
        content: editableContent.value,
        updated_at: new Date().toISOString()
      })
      .eq('id', props.noteId);

  if (error) {
    console.error('Ошибка при сохранении заметки:', error);
  }
};

const setupImageResizing = () => {
  nextTick(() => {
    document.querySelectorAll('.resizable').forEach(img => {
      const container = img.parentElement;
      const resizeHandle = container.querySelector('.resize-handle');

      if (!resizeHandle || resizeHandle.classList.contains('initialized')) return;

      resizeHandle.classList.add('initialized');

      let startX, startY, startWidth, startHeight;

      const initResize = (e) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(img).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(img).height, 10);
        document.documentElement.addEventListener('mousemove', doResize, false);
        document.documentElement.addEventListener('mouseup', stopResize, false);
      };

      const doResize = (e) => {
        const newWidth = startWidth + e.clientX - startX;
        const newHeight = startHeight + e.clientY - startY;
        img.style.width = `${Math.max(50, newWidth)}px`;
        img.style.height = 'auto';
        container.dataset.resized = 'true';
      };

      const stopResize = () => {
        document.documentElement.removeEventListener('mousemove', doResize, false);
        document.documentElement.removeEventListener('mouseup', stopResize, false);
      };

      resizeHandle.addEventListener('mousedown', initResize, false);
    });
  });
};

watch(renderedMarkdown, setupImageResizing);
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
.note-content-wrapper {
  position: relative;
  /*
  margin-left: 50px;
  */
  flex: 1;
  /*
  height: 100%;
  */
  overflow-y: auto;
}

.note-content {
  padding: 60px 20px 20px;
  display: flex;
  justify-content: center;
  min-height: 100%;
}

.save-button {
  position: fixed;
  top: 20px;
  left: 20px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.save-button:hover {
  background-color: #45a049;
  transform: scale(1.05);
}

.save-button:active {
  background-color: #cc0000;
  transform: scale(0.98);
}

.note-container {
  width: 90%;
  /*
  max-width: 800px;
  */
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.markdown-content {
  width: 100%;
  /*
  padding-left: 40px;
  */
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: text;
  user-select: text;
}

.edit-textarea {
  width: 100%;
  min-height: 500px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  white-space: pre;
}

.image-container {
  width: fit-content;
  max-width: 100%;
  display: inline-flex;
  justify-content: center;
  margin: 12px 0;
  padding: 0;
  position: relative;
  background-color: #000000;
  border-radius: 4px;
}

.markdown-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
  display: block;
}

.resize-handle {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  background-color: #4285f4;
  border: 2px solid white;
  cursor: nwse-resize;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.image-container:hover .resize-handle,
.image-container:active .resize-handle {
  opacity: 1;
}

.markdown-paragraph {
  line-height: 1.6;
  margin: 0;
  padding: 0;
}

.markdown-heading {
  margin: 24px 0 16px 0;
  padding: 0;
}

.markdown-list {
  padding-left: 24px;
  margin: 8px 0;
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

.markdown-content >>> .markdown-paragraph {
  line-height: 1.6;
  margin: 0;
}

.markdown-content >>> .markdown-heading {
  margin: 1em 0 0.5em 0;
}

.markdown-content >>> .markdown-list {
  padding-left: 24px;
  margin: 8px 0;
}

.markdown-content >>> .markdown-code {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content >>> .image-container:hover .resize-handle {
  opacity: 1;
}
</style>