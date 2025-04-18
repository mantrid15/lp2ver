<template>
  <div class="sidebar">
    <div class="management-module">
      <div class="management-buttons">
        <button
          class="delete-btn"
          @click="handleDeleteClick"
          :disabled="!selectedId"
          :title="showDeleted && selectedNote?.is_deleted ? 'Удалить навсегда' : 'Удалить'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
        <button
          class="restore-btn"
          @click="toggleDeleteStatus(false)"
          :disabled="!selectedId || !showDeleted || !selectedNote?.is_deleted"
          title="Восстановить"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
        </button>
        <label class="show-deleted">
          <input type="checkbox" v-model="showDeleted" @change="fetchNotes" />
          <span>Удаленные</span>
        </label>
      </div>
    </div>

    <div v-if="loading" class="loading-message">Загрузка заметок...</div>
    <div v-else-if="error" class="error-message">Ошибка загрузки: {{ error }}</div>
    <div v-else-if="!filteredNotes.length" class="empty-message">
      {{ showDeleted ? 'Нет удаленных заметок' : 'Нет заметок' }}
    </div>
    <ul v-else>
      <li
          v-for="note in filteredNotes"
          :key="note.id"
          @click="!disabled && selectNote(note)"
          :class="{
            active: note.id === selectedId,
            disabled: disabled,
            deleted: note.is_deleted
          }"
          class="note-item"
          :title="note.title"
      >
        <span class="note-title">{{ note.title || 'Без названия' }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { supabase } from '@/clients/supabase';
import { useStore } from 'vuex';

const store = useStore();
const props = defineProps({
  userId: String,
  selectedId: String,
  disabled: Boolean
});

const emit = defineEmits(['select']);

// Состояния компонента
const notes = ref([]);
const loading = ref(false);
const error = ref(null);
const showDeleted = ref(false);
let subscription = null;

// Вычисляемые свойства
const filteredNotes = computed(() => {
  return showDeleted.value
    ? notes.value
    : notes.value.filter(note => !note.is_deleted);
});

const selectedNote = computed(() => {
  return notes.value.find(note => note.id === props.selectedId);
});

// Методы
const setupRealtimeSubscription = () => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }

  subscription = supabase
    .channel('custom-linote-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'linote',
        filter: `user_id=eq.${props.userId}`
      },
      async (payload) => {
        console.log('Change received:', payload);
        await fetchNotes();

        // Особый случай: если удаляем текущую выбранную заметку
        if (payload.eventType === 'DELETE' && payload.old?.id === props.selectedId) {
          emit('select', null);
        }
        // Если обновляем текущую выбранную заметку
        else if (payload.eventType === 'UPDATE' && payload.new?.id === props.selectedId) {
          const updatedNote = notes.value.find(n => n.id === props.selectedId);
          if (updatedNote) {
            emit('select', updatedNote);
          }
        }
      }
    )
    .subscribe();
};

const fetchNotes = async () => {
  try {
    loading.value = true;
    error.value = null;

    const { data, error: supabaseError } = await supabase
      .from('linote')
      .select('id, title, created_at, is_deleted')
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

const toggleDeleteStatus = async (isDeleted) => {
  if (!props.selectedId) return;

  try {
    loading.value = true;
    const { error: supabaseError } = await supabase
      .from('linote')
      .update({ is_deleted: isDeleted })
      .eq('id', props.selectedId);

    if (supabaseError) throw supabaseError;

    // Явно обновляем список после изменения статуса
    await fetchNotes();
  } catch (err) {
    console.error('Ошибка изменения статуса заметки:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const deleteNotePermanently = async () => {
  if (!props.selectedId) return;

  try {
    loading.value = true;
    const { error: supabaseError } = await supabase
      .from('linote')
      .delete()
      .eq('id', props.selectedId);

    if (supabaseError) throw supabaseError;

    // Явно сбрасываем выделение и обновляем список
    emit('select', null);
    await fetchNotes();
  } catch (err) {
    console.error('Ошибка удаления заметки:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleDeleteClick = async () => {
  if (!props.selectedId) return;

  if (showDeleted.value && selectedNote.value?.is_deleted) {
    if (confirm('Вы уверены, что хотите удалить заметку навсегда? Это действие нельзя отменить.')) {
      await deleteNotePermanently();
    }
  } else {
    await toggleDeleteStatus(true);
  }
};

// Хуки жизненного цикла
onMounted(async () => {
  await fetchNotes();
  setupRealtimeSubscription();
});

onUnmounted(() => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
});

// Обновление при изменении пользователя
watch(() => props.userId, (newUserId) => {
  if (newUserId) {
    fetchNotes();
    setupRealtimeSubscription();
  }
});

defineExpose({
  refreshNotes: fetchNotes
});
</script>

<style scoped>
.sidebar {
  width: 25%;
  background: rgba(141, 178, 9, 0.9);
  overflow-y: auto;
  padding: 10px;
  border-right: 3px solid blue;
  min-height: 100%;
}

.management-module {
  padding: 10px;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
}

.management-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.management-buttons button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.delete-btn {
  background-color: #d32f2f;
  color: white;
}

.delete-btn:disabled {
  background-color: #f5b0b0;
  cursor: not-allowed;
}

.restore-btn {
  background-color: #2196f3;
  color: white;
}

.restore-btn:disabled {
  background-color: #90caf9;
  cursor: not-allowed;
}

.show-deleted {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  cursor: pointer;
}

.show-deleted span {
  white-space: nowrap;
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
  white-space: nowrap;
  overflow: hidden;
}

.note-title {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.note-item:hover:not(.disabled) {
  background-color: #ff6200;
}

.note-item.active {
  background-color: #2196f3;
  color: white;
}

.note-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.note-item.disabled:hover {
  background-color: inherit;
}

.note-item.deleted {
  background-color: #ffcdd2;
  color: #d32f2f;
}

.note-item.deleted.active {
  background-color: #d32f2f;
  color: white;
}
</style>