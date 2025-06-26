<template>
  <div class="gantt-component">
    <div class="header">
      <h2>Диаграмма Ганта</h2>
      <div v-if="task" class="task-info">
        <span class="task-label">Задача:</span>
        <span class="task-name">{{ task.name }}</span>
        <span class="date-range">
          ({{ formatDate(task.start_date) }} - {{ formatDate(task.end_date) }})
        </span>
      </div>
    </div>

    <div v-if="!task" class="no-selection">
      <p>Выберите задачу для отображения диаграммы Ганта</p>
    </div>

    <div v-else-if="subTasks.length === 0" class="no-subtasks">
      <p>У выбранной задачи нет подзадач для отображения</p>
    </div>

    <div v-else class="gantt-chart">
      <!-- Остальная часть template без изменений -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { supabase } from '@/clients/supabase.js';
import {useStore} from "vuex";

const props = defineProps({
  taskId: {
    type: [String, Number],
    default: null
  }
});
const store = useStore();

const userId = computed(() => store.state.userId);
// Состояние компонента
const task = ref(null);
const subTasks = ref([]);
const loading = ref(false);
const error = ref(null);

// Получение данных задачи
const fetchTask = async () => {
  if (!props.taskId) {
    task.value = null;
    return;
  }

  try {
    loading.value = true;
    const { data, error: fetchError } = await supabase
        .from('gantt')
        .select('*')
        .eq('user_id', props.userId) // Добавьте эту строку
        .is('parent_task', null); // Для получения только родительских задач

    if (fetchError) throw fetchError;
    task.value = data;
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching task:', err);
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
        .order('start_date');

    if (fetchError) throw fetchError;
    subTasks.value = data;
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching subtasks:', err);
  } finally {
    loading.value = false;
  }
};

// Вычисление временной шкалы
const timelineDates = computed(() => {
  if (!task.value) return [];

  const startDate = new Date(task.value.start_date);
  const endDate = new Date(task.value.end_date);
  const dates = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
});

// Остальные вычисляемые свойства и методы
const totalDays = computed(() => timelineDates.value.length);

const getBarStyle = (subTask) => {
  if (!task.value) return {};

  const taskStart = new Date(task.value.start_date);
  const subStart = new Date(subTask.start_date);
  const subEnd = new Date(subTask.end_date);

  const startOffset = Math.floor((subStart - taskStart) / (1000 * 60 * 60 * 24));
  const duration = Math.floor((subEnd - subStart) / (1000 * 60 * 60 * 24)) + 1;

  return {
    left: `${(startOffset / totalDays.value) * 100}%`,
    width: `${(duration / totalDays.value) * 100}%`
  };
};

const getBarClass = (progress) => {
  if (progress >= 80) return 'bar-high';
  if (progress >= 50) return 'bar-medium';
  if (progress >= 20) return 'bar-low';
  return 'bar-none';
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

const formatDateShort = (date) => {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};

// Отслеживание изменения taskId
watch(() => props.taskId, () => {
  fetchTask();
  fetchSubTasks();
}, { immediate: true });
</script>

<style scoped>
.task-component {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #333;
}

.task-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.task-form h3 {
  margin-top: 0;
  color: #495057;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-actions {
  display: flex;
  gap: 10px;
}

.task-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

tbody tr {
  cursor: pointer;
  transition: background-color 0.2s;
}

tbody tr:hover {
  background-color: #f8f9fa;
}

tbody tr.selected {
  background-color: #e3f2fd;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #1e7e34;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
}

.btn-info:hover {
  background-color: #117a8b;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background-color: #d39e00;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}
</style>