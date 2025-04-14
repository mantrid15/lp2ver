<template>
  <div class="note-content">
    <div v-if="note">
      <h2>{{ note.title }}</h2>
      <div v-html="renderedMarkdown"></div>
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
}
.empty-note {
  color: #999;
  font-style: italic;
}
</style>
