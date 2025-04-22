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
          <i class="fas fa-trash-alt"></i>
        </button>
        <button
          class="restore-btn"
          @click="toggleDeleteStatus(false)"
          :disabled="!selectedId || !showDeleted || !selectedNote?.is_deleted"
          title="Восстановить"
        >
          <i class="fas fa-undo-alt"></i>
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

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { supabase } from '@/clients/supabase';
import { useStore } from 'vuex';

export default {
  name: "Sidebar",
  props: {
    userId: String,
    selectedId: String,
    disabled: Boolean,
/*
    refreshTrigger: Boolean
*/
  },
  setup(props, { emit }) {
    const notes = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const showDeleted = ref(false);
    const subscription = ref(null);

    // let subscription = null;

    const refreshNotes = async () => {
      await fetchNotes();
      // Принудительно обновляем selectedId, если заметка была удалена
      if (props.selectedId && !notes.value.some(note => note.id === props.selectedId)) {
        emit('select', null);
      }
    };

    const filteredNotes = computed(() => {
      return showDeleted.value
          ? notes.value
          : notes.value.filter(note => !note.is_deleted);
    });

    const selectedNote = computed(() => {
      return notes.value.find(note => note.id === props.selectedId);
    });

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

    const setupRealtimeSubscription = () => {
      // Отписываемся от предыдущей подписки, если она существует
      // unsubscribeFromRealtimeChanges();

      console.log('Setting up realtime subscription for notes...');

      try {
        subscription.value = supabase
            .channel('linote_changes')
            .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'linote',
                  filter: `user_id=eq.${props.userId}` // Добавляем фильтр по пользователю
                },
                (payload) => {
                  console.log('Realtime change received:', payload);

                  // Обрабатываем разные типы событий
                  switch (payload.eventType) {
                    case 'INSERT':
                      // Добавляем новую заметку
                      if (!notes.value.some(note => note.id === payload.new.id)) {
                        notes.value = [payload.new, ...notes.value];
                      }
                      break;

                    case 'UPDATE':
                      // Обновляем существующую заметку
                      notes.value = notes.value.map(note =>
                          note.id === payload.new.id ? { ...note, ...payload.new } : note
                      );
                      break;

                    case 'DELETE':
                      // Удаляем заметку
                      notes.value = notes.value.filter(note => note.id !== payload.old.id);
                      if (props.selectedId === payload.old.id) {
                        emit('select', null); // Сбрасываем выбор, если удалена выбранная заметка
                      }
                      break;
                  }
                }
            )
/*            .subscribe((status, err) => {
              if (status === 'SUBSCRIBED') {
                console.log('Realtime notes subscription active.');
              }
              if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('Realtime subscription error:', status, err);
                error.value = 'Ошибка подключения к реальным обновлениям';
              }
              if (status === 'CLOSED') {
                console.log('Realtime subscription closed.');
              }*/

            // });
            .subscribe();

        return subscription

      } catch (error) {
        console.error("Ошибка при создании realtime подписки:", error);
        error.value = "Не удалось подключиться к реальным обновлениям";
      }
    };

// Функция для отписки
    const unsubscribeFromRealtimeChanges = () => {
      if (subscription.value) {
        supabase.removeChannel(subscription.value);
        console.log('Unsubscribed from previous realtime changes');
        subscription.value = null;
      }
    };

    onMounted(async () => {
      await fetchNotes();
      setupRealtimeSubscription();

    });

    onUnmounted(() => {
      if (subscription) {
        supabase.removeChannel(subscription);
        console.log("Sidebar Unmounted.");
        unsubscribeFromRealtimeChanges(); // Отписываемся при размонтировании
      }
    });
    watch(() => props.userId, async () => {
      await fetchNotes();
      setupRealtimeSubscription();
    });

    return {
      refreshNotes,
      notes,
      loading,
      error,
      showDeleted,
      filteredNotes,
      selectedNote,
      fetchNotes,
      selectNote,
      toggleDeleteStatus,
      deleteNotePermanently,
      handleDeleteClick
    };
  }
};
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