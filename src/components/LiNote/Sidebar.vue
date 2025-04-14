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
        :title="note.title"
      >
        <span class="note-title">{{ note.title || 'Без названия' }}</span>
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

    const { data, error: supabaseError } = await supabase
      .from('linote')
      .select('id, title, created_at')
      .eq('user_id', props.userId)
      .order('created_at', { ascending: false });

    if (supabaseError) throw supabaseError;

    notes.value = data || [];
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
  width: 25%;
  background: rgba(141, 178, 9, 0.9); /* красный фон */
  overflow-y: auto;
  padding: 10px;
  border-right: 3px solid blue; /* синяя граница справа */
  min-height: 100%;
}

.loading-message,
.error-message,
.empty-message {
  padding: 15px;
  text-align: center;
  color: #666;
}

.error-message {
  color: #d32f2f;
}

.note-item {
  padding: 5px 10px;
  margin-bottom: 2px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #000000;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  white-space: nowrap; /* Запрещаем перенос строк */
  overflow: hidden; /* Скрываем выходящий за пределы текст */
}

.note-title {
  overflow: hidden;
  text-overflow: ellipsis; /* Добавляем многоточие */
  max-width: 100%; /* Ограничиваем ширину */
}

.note-item:hover {
  background-color: #ff6200;
}

.note-item.active {
  background-color: #2196f3;
  color: white;
}
</style>
