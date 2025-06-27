<template>
  <div class="task-component">
    <div class="header">
      <h2>Задачи</h2>
      <button @click="showForm = !showForm" class="btn btn-primary btn-sm">
        {{ showForm ? '×' : '+' }}
      </button>
    </div>

    <!-- Форма создания/редактирования -->
    <div v-if="showForm" class="task-form">
      <form @submit.prevent="submitTask">
        <div class="form-row">
          <input v-model="taskForm.name" placeholder="Название" required class="form-input"/>
          <input v-model="taskForm.startDate" type="date" required class="form-input date-input"/>
          <input v-model="taskForm.endDate" type="date" required class="form-input date-input"/>
          <button type="submit" class="btn btn-success btn-sm">
            {{ editingTask ? '✓' : '+' }}
          </button>
          <button type="button" @click="resetForm" class="btn btn-secondary btn-sm">
            ×
          </button>
        </div>
      </form>
    </div>

    <!-- Таблица задач -->
    <div class="task-table">
      <table>
        <thead>
        <tr>
          <th class="name-col">Название</th>
          <th class="date-col">Начало</th>
          <th class="date-col">Конец</th>
          <th class="actions-col">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="task in tasks"
            :key="task.id"
            :class="{ selected: selectedTaskId === task.id }"
            @click="selectTask(task.id)"
        >
          <td class="name-col">{{ task.name }}</td>
          <td class="date-col">{{ formatDateShort(task.start_date) }}</td>
          <td class="date-col">{{ formatDateShort(task.end_date) }}</td>
          <td class="actions-col">
            <button @click.stop="editTask(task)" class="btn-icon" title="Редактировать">
              ✎
            </button>
            <button @click.stop="deleteTask(task.id)" class="btn-icon" title="Удалить">
              ×
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Сообщения о состоянии -->
    <div v-if="loading" class="status-message">Загрузка...</div>
    <div v-else-if="error" class="status-message error">{{ error }}</div>
    <div v-else-if="tasks.length === 0" class="status-message">Нет задач</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '@/clients/supabase.js';
import { useStore } from 'vuex';

const props = defineProps({
  userId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['task-selected']);

// Состояния компонента
const tasks = ref([]);
const loading = ref(false);
const error = ref(null);
const showForm = ref(false);
const editingTask = ref(null);
const selectedTaskId = ref(null);

const taskForm = ref({
  name: '',
  startDate: '',
  endDate: ''
});

// Получение задач из Supabase
const fetchTasks = async () => {
  console.log('[DTask] Запуск fetchTasks для user_id:', props.userId);
  try {
    loading.value = true;
    error.value = null;

    const { data, error: fetchError } = await supabase
        .from('gantt')
        .select('*')
        .eq('user_id', props.userId)
        .is('parent_task', null)
        .order('start_date', { ascending: true });

    if (fetchError) {
      console.error('[DTask] Ошибка при получении задач:', fetchError);
      throw fetchError;
    }

    console.log('[DTask] Получены задачи:', data);
    tasks.value = data;
  } catch (err) {
    console.error('[DTask] Ошибка:', err);
    error.value = err.message || 'Не удалось загрузить задачи';
  } finally {
    loading.value = false;
  }
};

const formatDateShort = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getDate()}.${date.getMonth() + 1}`;
};
// Создание/обновление задачи
const submitTask = async () => {
  console.log('[DTask] Отправка формы задачи:', taskForm.value);
  try {
    loading.value = true;

    const taskData = {
      name: taskForm.value.name,
      start_date: taskForm.value.startDate,
      end_date: taskForm.value.endDate,
      user_id: props.userId,
      progress: 0
    };

    if (editingTask.value) {
      console.log('[DTask] Обновление задачи ID:', editingTask.value.id);
      const { error: updateError } = await supabase
          .from('gantt')
          .update(taskData)
          .eq('id', editingTask.value.id);

      if (updateError) throw updateError;
    } else {
      console.log('[DTask] Создание новой задачи');
      const { error: insertError } = await supabase
          .from('gantt')
          .insert(taskData);

      if (insertError) throw insertError;
    }

    await fetchTasks();
    resetForm();
    showForm.value = false;
  } catch (err) {
    console.error('[DTask] Ошибка при сохранении задачи:', err);
    error.value = err.message || 'Ошибка при сохранении задачи';
  } finally {
    loading.value = false;
  }
};

// Удаление задачи
const deleteTask = async (taskId) => {
  console.log('[DTask] Удаление задачи ID:', taskId);
  if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

  try {
    loading.value = true;
    const { error: deleteError } = await supabase
        .from('gantt')
        .delete()
        .eq('id', taskId);

    if (deleteError) throw deleteError;

    // Если удаляем выбранную задачу - сбрасываем выбор
    if (selectedTaskId.value === taskId) {
      selectedTaskId.value = null;
      emit('task-selected', null);
    }

    await fetchTasks();
  } catch (err) {
    console.error('[DTask] Ошибка при удалении задачи:', err);
    error.value = err.message || 'Ошибка при удалении задачи';
  } finally {
    loading.value = false;
  }
};

// Выбор задачи
const selectTask = (taskId) => {
  console.log('[DTask] Выбрана задача ID:', taskId);
  selectedTaskId.value = taskId;
  emit('task-selected', taskId);
};

// Редактирование задачи
const editTask = (task) => {
  console.log('[DTask] Редактирование задачи:', task);
  editingTask.value = task;
  taskForm.value = {
    name: task.name,
    startDate: task.start_date,
    endDate: task.end_date
  };
  showForm.value = true;
};

// Сброс формы
const resetForm = () => {
  console.log('[DTask] Сброс формы');
  taskForm.value = {
    name: '',
    startDate: '',
    endDate: ''
  };
  editingTask.value = null;
};

// Форматирование даты
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

// Проверка валидности дат
const validateDates = () => {
  if (new Date(taskForm.value.startDate) > new Date(taskForm.value.endDate)) {
    error.value = 'Дата начала не может быть позже даты окончания';
    return false;
  }
  return true;
};

// Загрузка данных при монтировании
onMounted(() => {
  console.log('[DTask] Компонент смонтирован, user_id:', props.userId);
  fetchTasks();
});

// Отслеживание изменения userId
watch(() => props.userId, (newVal) => {
  console.log('[DTask] Изменился user_id:', newVal);
  fetchTasks();
});
</script>

<style scoped>
.task-component {
  padding: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 13px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 0 4px;
}

.header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.task-form {
  margin-bottom: 8px;
}

.form-row {
  display: flex;
  gap: 4px;
}

.form-input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 12px;
}

.date-input {
  max-width: 80px;
}

.task-table {
  flex: 1;
  overflow-y: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 6px 4px;
  text-align: left;
  border-bottom: 1px solid #eee;
  line-height: 1.2;
}

th {
  font-weight: 500;
  color: #555;
  background-color: #f9f9f9;
  position: sticky;
  top: 0;
}

.name-col {
  width: 45%;
  padding-left: 8px;
}

.date-col {
  width: 20%;
}

.actions-col {
  width: 15%;
  text-align: right;
  padding-right: 8px;
}

tr.selected {
  background-color: #f0f7ff;
}

tr:hover {
  background-color: #f5f5f5;
}

.btn {
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
}

.btn-sm {
  padding: 2px 6px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  margin-left: 2px;
  color: #666;
}

.btn-icon:hover {
  color: #333;
}

.status-message {
  padding: 8px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

.error {
  color: #d32f2f;
}

@media (max-width: 768px) {
  .date-col {
    display: none;
  }

  .name-col {
    width: 70%;
  }
}
</style>