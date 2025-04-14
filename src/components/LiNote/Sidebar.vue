<template>
  <div class="sidebar">
    <div v-if="loading" class="loading-message">Загрузка заметок...</div>
    <div v-else-if="error" class="error-message">Ошибка загрузки: {{ error }}</div>
    <div v-else-if="!notes.length" class="empty-message">Нет заметок</div>
    <ul v-else>
      <li
          v-for="note in notes"
          :key="note.id"
          @click="selectNote(note)"
          :class="{ active: note.id === selectedId }"
          class="note-item"
      >
        {{ note.title || 'Без названия' }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { supabase } from '@/clients/supabase';
import { useStore } from 'vuex';

const store = useStore();
const props = defineProps({
  userId: String,
  selectedId: String,
});
const emit = defineEmits(['select']);

const notes = ref([]);
const loading = ref(false);
const error = ref(null);

const fetchNotes = async () => {
  try {
    loading.value = true;
    error.value = null;

    console.log('Загрузка заметок для пользователя:', props.userId);

    const { data, error: supabaseError } = await supabase
        .from('linote')
        .select('id, title, created_at')
        .eq('user_id', props.userId)
        .order('created_at', { ascending: false });

    if (supabaseError) throw supabaseError;

    notes.value = data || [];
    console.log('Заметки успешно загружены:', notes.value);
  } catch (err) {
    console.error('Ошибка загрузки заметок:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const selectNote = (note) => {
  emit('select', note);
};

// Загружаем заметки при монтировании и при изменении userId
onMounted(fetchNotes);
watch(() => props.userId, fetchNotes);
</script>


<style scoped>
.sidebar {
  width: 250px;
  background: #e1cb07; /* красный фон */
  overflow-y: auto;
  padding: 10px;
  border-right: 2px solid blue; /* синяя граница справа */
}
li {
  padding: 8px;
  cursor: pointer;
}
li.active {
  background-color: #ccc;
}
</style>
