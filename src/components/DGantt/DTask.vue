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

<script setup lang="ts">
import { ref } from 'vue';
import { useTaskStore } from '../../composables/useTaskStore';

const { tasks, selectedTaskId, addTask, selectTask } = useTaskStore();

const showForm = ref(false);
const newTask = ref({
  name: '',
  startDate: '',
  endDate: ''
});

const createTask = () => {
  if (newTask.value.name && newTask.value.startDate && newTask.value.endDate) {
    if (new Date(newTask.value.startDate) > new Date(newTask.value.endDate)) {
      alert('Дата начала не может быть позже даты окончания');
      return;
    }

    addTask(newTask.value);
    resetForm();
    showForm.value = false;
  }
};

const resetForm = () => {
  newTask.value = {
    name: '',
    startDate: '',
    endDate: ''
  };
};

const formatDate = (dateStr: string) => {
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