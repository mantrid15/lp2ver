<template>
  <div class="todo-container">
<!--    <NewTask @task-added="fetchTasks" />-->

    <table class="todo-table">
      <thead>
      <tr class="table-header">
        <th style="width: 20%;">Задача</th>
        <th style="width: 40%;">Описание</th>
        <th style="width: 6%;">Статус</th>
        <th style="width: 6%;">Тег важности</th>
        <th style="width: 5%;">Дата создания</th>
        <th style="width: 6%;">Дата выполнения</th>
        <th style="width: 5%;">Удалить</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="task in tasks" :key="task.id" :class="{'completed-task': task.status === 'выполнено'}">
        <td class="task-title" @dblclick="!isTaskCompleted(task) && startEditing(task, 'title')">
          <input
              v-if="task.editing && task.editingField === 'title'"
              v-model="task.title"
              @keyup.enter="finishEditing(task)"
              @blur="finishEditing(task)"
              v-focus
              class="task-input"
              :disabled="isTaskCompleted(task)"
          />
          <span v-else>{{ task.title }}</span>
        </td>
        <td @dblclick="!isTaskCompleted(task) && startEditing(task, 'description')">
          <input
              v-if="task.editing && task.editingField === 'description'"
              v-model="task.description"
              @keyup.enter="finishEditing(task)"
              @blur="finishEditing(task)"
              v-focus
              class="task-input"
              :disabled="isTaskCompleted(task)"
          />
          <span v-else>{{ task.description }}</span>
        </td>
        <td class="status-cell">
          <select v-model="task.status" @change="updateTask(task)">
            <option value="не выполнено">Не выполнено</option>
            <option value="выполнено">Выполнено</option>
            <option value="выполняется">Выполняется</option>
          </select>
        </td>
        <td>
          <select v-model="task.importance_tag" @change="updateTask(task)" :disabled="isTaskCompleted(task)">
            <option value="высокая">Высокая</option>
            <option value="средняя">Средняя</option>
            <option value="низкая">Низкая</option>
          </select>
        </td>
        <td class="date-cell">{{ formatDate(task.created_at) }}</td>
        <td class="date-cell">
          <input
              v-model="task.due_date_edit"
              @change="updateDueDate(task)"
              type="date"
              :min="formatDateForInput(task.created_at)"
              class="date-input"
              :disabled="isTaskCompleted(task)"
          />
        </td>
        <td class="delete-cell">
          <button @click="deleteTask(task.id)">Удалить</button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '@/clients/supabase.js';
import NewTask from './NewTask.vue';

export default {
  name: 'TodoComp',

  components: {
    NewTask
  },

  setup() {
    const tasks = ref([]);
    const subscription = ref(null);

    function isTaskCompleted(task) {
      return task.status === 'выполнено';
    }

    function startEditing(task, field) {
      if (isTaskCompleted(task)) return;
      task.editing = true;
      task.editingField = field;
      task.originalValue = task[field];
    }

    function finishEditing(task) {
      if (task.editing) {
        task.editing = false;
        task.editingField = null;
        updateTask(task);
      }
    }

    async function fetchTasks() {
      try {
        const { data, error } = await supabase
            .from('todolist')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        tasks.value = (data || []).map(task => ({
          ...task,
          due_date_edit: formatDateForInput(task.due_date) || '',
          due_date: formatDateForDisplay(task.due_date) || '',
          editing: false,
          editingField: null,
          originalValue: ''
        }));
      } catch (error) {
        console.error('Ошибка при загрузке задач:', error);
      }
    }

    async function updateTask(task) {
      try {
        const taskToUpdate = {
          title: task.title,
          description: task.description,
          importance_tag: task.importance_tag,
          status: task.status
        };

        const { error } = await supabase
            .from('todolist')
            .update(taskToUpdate)
            .match({ id: task.id });

        if (error) throw error;
      } catch (error) {
        console.error('Ошибка при обновлении задачи:', error);
        if (task.editingField && task.originalValue) {
          task[task.editingField] = task.originalValue;
        }
      }
    }

    async function updateDueDate(task) {
      try {
        if (!task.due_date_edit || isTaskCompleted(task)) {
          return;
        }

        const createdDate = new Date(task.created_at);
        const dueDate = new Date(task.due_date_edit);

        if (dueDate < createdDate) {
          alert('Дата выполнения не может быть раньше даты создания');
          task.due_date_edit = formatDateForInput(task.due_date);
          return;
        }

        const formattedDueDate = formatDateForDisplay(task.due_date_edit);

        const { error } = await supabase
            .from('todolist')
            .update({ due_date: formattedDueDate })
            .match({ id: task.id });

        if (error) throw error;

        task.due_date = formattedDueDate;
      } catch (error) {
        console.error('Ошибка при обновлении даты выполнения:', error);
      }
    }

    function formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    }

    function formatDateForDisplay(dateString) {
      if (!dateString) return '';

      if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        return dateString;
      }

      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }

    function formatDateForInput(dateString) {
      if (!dateString) return '';

      if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const [day, month, year] = dateString.split('.');
        return `${year}-${month}-${day}`;
      }

      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    }

    async function deleteTask(id) {
      try {
        const { error } = await supabase
            .from('todolist')
            .delete()
            .match({ id });

        if (error) throw error;

        tasks.value = tasks.value.filter(task => task.id !== id);
      } catch (error) {
        console.error('Ошибка при удалении задачи:', error);
      }
    }

    function setupRealtimeUpdates() {
      subscription.value = supabase
          .channel('todolist_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'todolist'
          }, () => {
            fetchTasks();
          })
          .subscribe();
    }

    function unsubscribeFromRealtimeChanges() {
      if (subscription.value) {
        supabase.removeChannel(subscription.value);
      }
    }

    onMounted(() => {
      fetchTasks();
      setupRealtimeUpdates();
    });

    onUnmounted(() => {
      unsubscribeFromRealtimeChanges();
    });

    return {
      tasks,
      isTaskCompleted,
      startEditing,
      finishEditing,
      updateTask,
      updateDueDate,
      deleteTask,
      formatDate,
      formatDateForDisplay,
      formatDateForInput
    };
  }
};
</script>

<style scoped>
.todo-container {
  background-color: #e6e6fa;
  padding: 10px;
  min-height: 100vh;
  /*
  margin-top: 4px; !* Добавляем отступ сверху *!
  */
}

.task-title {
  font-weight: bold;
  color: black;
  font-size: 1.2em;
  cursor: pointer;
}

.task-input {
  width: 100%;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 1em;
}

.task-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.date-input {
  width: 100%;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 0.8em;
}

.date-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.todo-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  border-spacing: 0;
  margin-top: 20px;
}

.todo-table th {
  background-color: #4CAF50;
  color: white;
  font-weight: bold;
  padding: 8px;
  text-align: left;
  border: 1px solid #ddd;
  font-size: 0.9em;
  height: 30px;
}

.todo-table td {
  padding: 4px;
  border: 1px solid #ddd;
  background-color: #fffacd;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
  height: 20px;
}

.todo-table tr:hover td {
  background-color: #ffe4b5;
}

.todo-table select {
  width: 100%;
  padding: 4px;
  border: 1px solid black;
  border-radius: 3px;
  font-size: 0.9em;
}

.todo-table select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.todo-table button {
  padding: 4px 8px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9em;
}

.todo-table button:hover {
  background-color: #cc0000;
}

.date-cell {
  font-size: 0.8em;
  white-space: nowrap;
  padding: 2px 4px !important;
}

.completed-task td {
  position: relative;
}

.completed-task td:not(.status-cell):not(.delete-cell)::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: red;
  transform: translateY(-50%);
}

.status-cell, .delete-cell {
  position: relative;
  z-index: 1;
  background-color: #fffacd !important;
}
</style>