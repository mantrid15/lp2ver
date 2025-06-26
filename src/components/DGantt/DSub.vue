<template>
  <div class="subtask-component">
    <div class="header">
      <h2>
        Подзадачи
        <span v-if="selectedTask" class="task-name">
          для "{{ selectedTask.name }}"
        </span>
      </h2>
      <button
          v-if="selectedTask"
          @click="showForm = !showForm"
          class="btn btn-primary"
      >
        {{ showForm ? 'Скрыть форму' : 'Добавить подзадачу' }}
      </button>
    </div>

    <div v-if="!selectedTask" class="no-selection">
      <p>Выберите задачу для просмотра подзадач</p>
    </div>

    <!-- Форма создания подзадачи -->
    <div v-if="showForm && selectedTask" class="subtask-form">
      <h3>Создать новую подзадачу</h3>
      <form @submit.prevent="createSubTask">
        <div class="form-group">
          <label>Наименование подзадачи:</label>
          <input
              v-model="newSubTask.name"
              type="text"
              required
              placeholder="Введите название подзадачи"
          />
        </div>
        <div class="form-group">
          <label>Дата начала:</label>
          <input
              v-model="newSubTask.startDate"
              type="date"
              required
              :min="selectedTask.startDate"
              :max="selectedTask.endDate"
          />
        </div>
        <div class="form-group">
          <label>Дата окончания:</label>
          <input
              v-model="newSubTask.endDate"
              type="date"
              required
              :min="selectedTask.startDate"
              :max="selectedTask.endDate"
          />
        </div>
        <div class="form-group">
          <label>Прогресс (%):</label>
          <input
              v-model.number="newSubTask.progress"
              type="number"
              min="0"
              max="100"
              required
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success">Создать подзадачу</button>
          <button type="button" @click="resetForm" class="btn btn-secondary">Очистить</button>
        </div>
      </form>
    </div>

    <!-- Список подзадач -->
    <div v-if="selectedTask && selectedSubTasks.length > 0" class="subtask-list">
      <div class="subtask-grid">
        <div
            v-for="subTask in selectedSubTasks"
            :key="subTask.id"
            class="subtask-card"
        >
          <div class="subtask-header">
            <h4>{{ subTask.name }}</h4>
            <div class="progress-badge" :class="getProgressClass(subTask.progress)">
              {{ subTask.progress }}%
            </div>
          </div>
          <div class="subtask-info">
            <div class="date-range">
              <span class="date-label">Начало:</span>
              <span class="date-value">{{ formatDate(subTask.startDate) }}</span>
            </div>
            <div class="date-range">
              <span class="date-label">Окончание:</span>
              <span class="date-value">{{ formatDate(subTask.endDate) }}</span>
            </div>
            <div class="duration">
              <span class="date-label">Длительность:</span>
              <span class="date-value">{{ calculateDuration(subTask.startDate, subTask.endDate) }} дн.</span>
            </div>
          </div>
          <div class="progress-bar">
            <div
                class="progress-fill"
                :style="{ width: subTask.progress + '%' }"
                :class="getProgressClass(subTask.progress)"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="selectedTask && selectedSubTasks.length === 0" class="no-subtasks">
      <p>У выбранной задачи пока нет подзадач</p>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch} from 'vue';
import { supabase } from '@/clients/supabase.js';
import {useStore} from "vuex";

// Получаем taskId из props
const props = defineProps({
  taskId: {
    type: [String, Number],
    default: null
  }
});

// Состояние компонента
const store = useStore();

const subTasks = ref([]);
const loading = ref(false);
const error = ref(null);
const showForm = ref(false);
const newSubTask = ref({
  name: '',
  startDate: '',
  endDate: '',
  progress: 0
});
const userId = computed(() => store.state.userId);
// Получаем подзадачи
const fetchSubTasks = async () => {
  if (!props.taskId) return;

  try {
    loading.value = true;
    const { data, error: fetchError } = await supabase
        .from('gantt')
        .select('*')
        .eq('user_id', props.userId) // Добавьте эту строку
        .is('parent_task', null); // Для получения только родительских задач

    if (fetchError) throw fetchError;
    subTasks.value = data;
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching subtasks:', err);
  } finally {
    loading.value = false;
  }
};

// Получаем данные родительской задачи
const selectedTask = ref(null);
const fetchTask = async () => {
  if (!props.taskId) return;

  try {
    loading.value = true;
    const { data, error: fetchError } = await supabase
        .from('gantt')
        .select('*')
        .eq('id', props.taskId)
        .single();

    if (fetchError) throw fetchError;
    selectedTask.value = data;
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching task:', err);
  } finally {
    loading.value = false;
  }
};

// Вычисляемое свойство для подзадач
const selectedSubTasks = computed(() => subTasks.value);

// Добавление подзадачи
const addSubTask = async (subTaskData) => {
  try {
    const { data, error: insertError } = await supabase
        .from('gantt')
        .insert([{
          name: subTaskData.name,
          start_date: subTaskData.startDate,
          end_date: subTaskData.endDate,
          progress: subTaskData.progress,
          parent_task: subTaskData.taskId
        }])
        .select();

    if (insertError) throw insertError;
    await fetchSubTasks();
    return data[0].id;
  } catch (err) {
    console.error('Error adding subtask:', err);
    throw err;
  }
};

// Инициализация
watch(() => props.taskId, (newVal) => {
  if (newVal) {
    fetchTask();
    fetchSubTasks();
  } else {
    selectedTask.value = null;
    subTasks.value = [];
  }
}, { immediate: true });

// Локальные методы
const createSubTask = async () => {
  if (!selectedTask.value) return;

  if (newSubTask.value.name && newSubTask.value.startDate && newSubTask.value.endDate) {
    if (new Date(newSubTask.value.startDate) > new Date(newSubTask.value.endDate)) {
      alert('Дата начала не может быть позже даты окончания');
      return;
    }

    try {
      await addSubTask({
        ...newSubTask.value,
        taskId: selectedTask.value.id
      });
      resetForm();
      showForm.value = false;
    } catch (error) {
      alert('Ошибка при создании подзадачи: ' + error.message);
    }
  }
};

const resetForm = () => {
  newSubTask.value = { name: '', startDate: '', endDate: '', progress: 0 };
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

const getProgressClass = (progress) => {
  if (progress >= 80) return 'progress-high';
  if (progress >= 50) return 'progress-medium';
  if (progress >= 20) return 'progress-low';
  return 'progress-none';
};


</script>

<style scoped>
.subtask-component {
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

.task-name {
  color: #007bff;
  font-weight: normal;
  font-size: 0.8em;
}

.no-selection, .no-subtasks {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.subtask-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.subtask-form h3 {
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

.subtask-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.subtask-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s;
}

.subtask-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.subtask-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.subtask-header h4 {
  margin: 0;
  color: #333;
  flex: 1;
  margin-right: 10px;
}

.progress-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.subtask-info {
  margin-bottom: 12px;
}

.date-range, .duration {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.date-label {
  color: #6c757d;
  font-size: 14px;
}

.date-value {
  color: #495057;
  font-weight: 500;
  font-size: 14px;
}

.progress-bar {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-high {
  background-color: #28a745;
}

.progress-medium {
  background-color: #ffc107;
}

.progress-low {
  background-color: #fd7e14;
}

.progress-none {
  background-color: #dc3545;
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
</style>