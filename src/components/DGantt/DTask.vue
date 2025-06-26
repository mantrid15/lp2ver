<template>
  <div class="task-component">
    <div class="header">
      <h2>Задачи</h2>
      <button @click="showForm = !showForm" class="btn btn-primary">
        {{ showForm ? 'Скрыть форму' : 'Добавить задачу' }}
      </button>
    </div>

    <!-- Форма создания задачи -->
    <div v-if="showForm" class="task-form">
      <h3>Создать новую задачу</h3>
      <form @submit.prevent="createTask">
        <div class="form-group">
          <label>Наименование задачи:</label>
          <input
              v-model="newTask.name"
              type="text"
              required
              placeholder="Введите название задачи"
          />
        </div>
        <div class="form-group">
          <label>Дата начала:</label>
          <input
              v-model="newTask.startDate"
              type="date"
              required
          />
        </div>
        <div class="form-group">
          <label>Дата окончания:</label>
          <input
              v-model="newTask.endDate"
              type="date"
              required
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success">Создать задачу</button>
          <button type="button" @click="resetForm" class="btn btn-secondary">Очистить</button>
        </div>
      </form>
    </div>

    <!-- Таблица задач -->
    <div class="task-table">
      <table>
        <thead>
        <tr>
          <th>Наименование задачи</th>
          <th>Дата начала</th>
          <th>Дата окончания</th>
          <th>Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="task in tasks"
            :key="task.id"
            :class="{ 'selected': selectedTaskId === task.id }"
            @click="selectTask(task.id)"
        >
          <td>{{ task.name }}</td>
          <td>{{ formatDate(task.startDate) }}</td>
          <td>{{ formatDate(task.endDate) }}</td>
          <td>
            <button
                @click.stop="selectTask(selectedTaskId === task.id ? null : task.id)"
                class="btn btn-sm"
                :class="selectedTaskId === task.id ? 'btn-warning' : 'btn-info'"
            >
              {{ selectedTaskId === task.id ? 'Отменить' : 'Выбрать' }}
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue';
import { supabase } from '../../supabase';

// Состояние хранилища
const tasks = ref([]);
const subTasks = ref([]);
const selectedTaskId = ref(null);
const loading = ref(false);
const error = ref(null);

// Получаем все задачи (где parent_task IS NULL)
const fetchTasks = async () => {
  try {
    loading.value = true;
    const { data, error: fetchError } = await supabase
      .from('gantt')
      .select('*')
      .is('parent_task', null)
      .order('start_date', { ascending: true });

    if (fetchError) throw fetchError;
    tasks.value = data;
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching tasks:', err);
  } finally {
    loading.value = false;
  }
};

// Получаем подзадачи для выбранной задачи
const fetchSubTasks = async (taskId) => {
  try {
    loading.value = true;
    const { data, error: fetchError } = await supabase
      .from('gantt')
      .select('*')
      .eq('parent_task', taskId)
      .order('start_date', { ascending: true });

    if (fetchError) throw fetchError;
    subTasks.value = data;
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching subtasks:', err);
  } finally {
    loading.value = false;
  }
};

// Добавляем новую задачу
const addTask = async (task) => {
  try {
    const { data, error: insertError } = await supabase
      .from('gantt')
      .insert([
        {
          name: task.name,
          start_date: task.startDate,
          end_date: task.endDate,
          progress: 0
        }
      ])
      .select();

    if (insertError) throw insertError;
    await fetchTasks();
    return data[0].id;
  } catch (err) {
    error.value = err.message;
    console.error('Error adding task:', err);
    throw err;
  }
};

// Добавляем новую подзадачу
const addSubTask = async (subTask) => {
  try {
    const { data, error: insertError } = await supabase
      .from('gantt')
      .insert([
        {
          name: subTask.name,
          start_date: subTask.startDate,
          end_date: subTask.endDate,
          progress: subTask.progress,
          parent_task: subTask.taskId
        }
      ])
      .select();

    if (insertError) throw insertError;
    await fetchSubTasks(subTask.taskId);
    return data[0].id;
  } catch (err) {
    error.value = err.message;
    console.error('Error adding subtask:', err);
    throw err;
  }
};

// Выбираем задачу и загружаем её подзадачи
const selectTask = async (taskId) => {
  selectedTaskId.value = taskId;
  if (taskId) {
    await fetchSubTasks(taskId);
  } else {
    subTasks.value = [];
  }
};

// Вычисляемое свойство для выбранной задачи
const selectedTask = computed(() => {
  return tasks.value.find(task => task.id === selectedTaskId.value) || null;
});

// Вычисляемое свойство для подзадач выбранной задачи
const selectedSubTasks = computed(() => {
  return subTasks.value.filter(subTask => subTask.parent_task === selectedTaskId.value);
});

// Предоставляем состояние дочерним компонентам
provide('taskStore', {
  tasks,
  subTasks,
  selectedTaskId,
  selectedTask,
  selectedSubTasks,
  loading,
  error,
  addTask,
  addSubTask,
  selectTask,
  fetchTasks,
  fetchSubTasks
});

// Инициализация - загружаем задачи при создании
fetchTasks();

// Локальное состояние компонента
const showForm = ref(false);
const newTask = ref({
  name: '',
  startDate: '',
  endDate: ''
});

const createTask = async () => {
  if (newTask.value.name && newTask.value.startDate && newTask.value.endDate) {
    if (new Date(newTask.value.startDate) > new Date(newTask.value.endDate)) {
      alert('Дата начала не может быть позже даты окончания');
      return;
    }

    try {
      await addTask(newTask.value);
      resetForm();
      showForm.value = false;
    } catch (error) {
      alert('Ошибка при создании задачи: ' + error.message);
    }
  }
};

const resetForm = () => {
  newTask.value = {
    name: '',
    startDate: '',
    endDate: ''
  };
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU');
};
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