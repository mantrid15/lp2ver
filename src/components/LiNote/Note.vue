<template>
  <div class="note-content">
    <div v-if="note" class="note-container">
      <h2>{{ note.title }}</h2>
      <div class="markdown-content" v-html="renderedMarkdown"></div>
    </div>
    <div v-else class="empty-note">Выберите заметку из списка</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';
import { supabase } from '@/clients/supabase';

const props = defineProps({
  noteId: String,
});

const note = ref(null);

// Настраиваем marked для обработки изображений
marked.use({
  renderer: {
    image(href, title, text) {
      return `
        <div class="image-container">
          <img
            src="${href}"
            alt="${text}"
            title="${title || ''}"
            class="markdown-image"
            loading="lazy"
            onload="this.style.opacity = 1"
          >
        </div>
      `;
    },
    paragraph(text) {
      return `<div class="text-container"><p class="markdown-paragraph">${text}</p></div>`;
    },
    heading(text, level) {
      return `<div class="text-container"><h${level} class="markdown-heading">${text}</h${level}></div>`;
    },
    list(body, ordered) {
      const tag = ordered ? 'ol' : 'ul';
      return `<div class="text-container"><${tag} class="markdown-list">${body}</${tag}></div>`;
    },
    code(code, infostring, escaped) {
      return `<div class="text-container"><pre class="markdown-code"><code>${code}</code></pre></div>`;
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
.note-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

.note-container {
  width: 60%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 12px; /* Отступ между блоками */
}

.markdown-content {
  width: 100%;
  padding-left: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px; /* Отступ между элементами */
}

/* Контейнеры для текстовых блоков */
.text-container {
  width: 100%;
  margin: 0;
  padding: 0;
}

/* Стили для изображений */
.image-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 12px 0;
  padding: 0;
}

.markdown-image {
  max-width: 100%;
  max-width: min(100%, 800px);
  height: auto;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
  display: block;
}

/* Стили для текстовых элементов */
.markdown-paragraph {
  line-height: 1.6;
  margin: 0;
  padding: 0;
}

.markdown-heading {
  margin: 18px 0 12px 0;
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
}

.empty-note {
  color: #999;
  font-style: italic;
  width: 100%;
  text-align: center;
}
</style>