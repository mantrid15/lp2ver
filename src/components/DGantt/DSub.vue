<template>
  <div class="subtask-component">
    <div class="header">
      <h2>Подзадачи</h2>
      <button
          v-if="selectedTask"
          @click="showForm = !showForm"
          class="btn btn-primary btn-sm"
      >
        {{ showForm ? '×' : '+' }}
      </button>
    </div>

    <!-- Форма создания/редактирования -->
    <div v-if="showForm && selectedTask" class="subtask-form">
      <form @submit.prevent="createSubTask">
        <div class="form-row">
          <input v-model="newSubTask.name" placeholder="Название" required class="form-input"/>
          <input
              v-model="newSubTask.startDate"
              type="date"
              required
              :min="selectedTask.start_date"
              :max="selectedTask.end_date"
              class="form-input date-input"
          />
          <input
              v-model="newSubTask.endDate"
              type="date"
              required
              :min="selectedTask.start_date"
              :max="selectedTask.end_date"
              class="form-input date-input"
          />
          <input
              v-model.number="newSubTask.progress"
              type="number"
              min="0"
              max="100"
              placeholder="%"
              class="form-input progress-input"
          />
          <button type="submit" class="btn btn-success btn-sm">
            {{ editingSubTask ? '✓' : '+' }}
          </button>
          <button type="button" @click="resetForm" class="btn btn-secondary btn-sm">
            ×
          </button>
        </div>
      </form>
    </div>

    <!-- Таблица подзадач -->
    <div class="subtask-table">
      <table>
        <thead>
        <tr>
          <th class="name-col">Название</th>
          <th class="date-col">Начало</th>
          <th class="date-col">Конец</th>
          <th class="progress-col">%</th>
          <th class="actions-col">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="subTask in subTasks" :key="subTask.id">
          <td class="name-col">{{ subTask.name }}</td>
          <td class="date-col">{{ formatDateShort(subTask.start_date) }}</td>
          <td class="date-col">{{ formatDateShort(subTask.end_date) }}</td>
          <td class="progress-col">
            <div class="progress-cell" :class="getProgressClass(subTask.progress)">
              {{ subTask.progress }}
            </div>
          </td>
          <td class="actions-col">
            <button @click.stop="editSubTask(subTask)" class="btn-icon" title="Редактировать">
              ✎
            </button>
            <button @click.stop="deleteSubTask(subTask.id)" class="btn-icon" title="Удалить">
              ×
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Сообщения о состоянии -->
    <div v-if="!selectedTask" class="status-message">
      Выберите задачу
    </div>
    <div v-else-if="loading" class="status-message">Загрузка...</div>
    <div v-else-if="error" class="status-message error">{{ error }}</div>
    <div v-else-if="subTasks.length === 0" class="status-message">Нет подзадач</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { supabase } from '@/clients/supabase.js';

const props = defineProps({
  taskId: {
    type: [String, Number],
    default: null
  },
  userId: {
    type: [String, Number],
    required: true
  }
});

// Состояние компонента
// Состояние компонента
const subTasks = ref([]);
const selectedTask = ref(null);
const loading = ref(false);
const error = ref(null);
const showForm = ref(false);
const editingSubTask = ref(null);

const newSubTask = ref({
  name: '',
  startDate: '',
  endDate: '',
  progress: 0
});

// Форматирование даты (краткая версия)
const formatDateShort = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getDate()}.${date.getMonth() + 1}`;
};
// Класс для прогресса
const getProgressClass = (progress) => {
  if (progress >= 80) return 'progress-high';
  if (progress >= 50) return 'progress-medium';
  if (progress >= 20) return 'progress-low';
  return 'progress-none';
};
// Получение родительской задачи
const fetchTask = async () => {
  if (!props.taskId) return;

  try {
    loading.value = true;
    const { data, error: fetchError } = await supabase
        .from('gantt')
        .select('*')
        .eq('id', props.taskId)
        .eq('user_id', props.userId)
        .single();

    if (fetchError) throw fetchError;
    selectedTask.value = data;
  } catch (err) {
    error.value = err.message;
    console.error('Ошибка при получении задачи:', err);
  } finally {
    loading.value = false;
  }
};

// Получение подзадач
const fetchSubTasks = async () => {
  if (!props.taskId) {
    subTasks.value = [];
    return;
  }

  try {
    loading.value = true;
    const { data, error: fetchError } = await supabase
        .from('gantt')
        .select('*')
        .eq('parent_task', props.taskId)
        .eq('user_id', props.userId)
        .order('start_date');

    if (fetchError) throw fetchError;
    subTasks.value = data;
  } catch (err) {
    error.value = err.message;
    console.error('Ошибка при получении подзадач:', err);
  } finally {
    loading.value = false;
  }
};

// Создание подзадачи
const createSubTask = async () => {
  if (!selectedTask.value) return;

  try {
    loading.value = true;
    const taskData = {
      name: newSubTask.value.name,
      start_date: newSubTask.value.startDate,
      end_date: newSubTask.value.endDate,
      progress: newSubTask.value.progress,
      parent_task: props.taskId,
      user_id: props.userId,
      priority: newSubTask.value.priority
    };

    if (editingSubTask.value) {
      const { error: updateError } = await supabase
          .from('gantt')
          .update(taskData)
          .eq('id', editingSubTask.value.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
          .from('gantt')
          .insert(taskData);

      if (insertError) throw insertError;
    }

    await fetchSubTasks();
    resetForm();
    showForm.value = false;
  } catch (err) {
    error.value = err.message || 'Ошибка при создании подзадачи';
    console.error('Ошибка:', err);
  } finally {
    loading.value = false;
  }
};

// Редактирование подзадачи
const editSubTask = (subTask) => {
  editingSubTask.value = subTask;
  newSubTask.value = {
    name: subTask.name,
    startDate: subTask.start_date,
    endDate: subTask.end_date,
    progress: subTask.progress,
    priority: subTask.priority || 'medium'
  };
  showForm.value = true;
};

// Удаление подзадачи
const deleteSubTask = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить эту подзадачу?')) return;

  try {
    loading.value = true;
    const { error: deleteError } = await supabase
        .from('gantt')
        .delete()
        .eq('id', id);

    if (deleteError) throw deleteError;
    await fetchSubTasks();
  } catch (err) {
    error.value = err.message || 'Ошибка при удалении подзадачи';
    console.error('Ошибка:', err);
  } finally {
    loading.value = false;
  }
};

// Сброс формы
const resetForm = () => {
  newSubTask.value = {
    name: '',
    startDate: '',
    endDate: '',
    progress: 0,
    priority: 'medium'
  };
  editingSubTask.value = null;
};

// Вспомогательные функции
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};



// Отслеживание изменений taskId
watch(() => props.taskId, (newVal) => {
  if (newVal) {
    fetchTask();
    fetchSubTasks();
  } else {
    selectedTask.value = null;
    subTasks.value = [];
  }
}, { immediate: true });
</script>

<style scoped>
.subtask-component {
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

.subtask-form {
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

.progress-input {
  max-width: 50px;
}

.subtask-table {
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
  width: 40%;
  padding-left: 8px;
}

.date-col {
  width: 15%;
}

.progress-col {
  width: 10%;
}

.actions-col {
  width: 20%;
  text-align: right;
  padding-right: 8px;
}

.progress-cell {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  min-width: 30px;
}

.progress-high {
  background-color: #e6f4ea;
  color: #34a853;
}

.progress-medium {
  background-color: #fef7e0;
  color: #fbbc05;
}

.progress-low {
  background-color: #feefe3;
  color: #f29900;
}

.progress-none {
  background-color: #fce8e6;
  color: #d93025;
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
    width: 60%;
  }

  .progress-col {
    width: 15%;
  }
}
</style>