<template>
  <div class="todo-container">
<!--
    <h1>TODO List</h1>
-->
    <div class="input-group">
      <input v-model="newTask.title" placeholder="Название задачи" />
      <input v-model="newTask.description" placeholder="Описание задачи" />
      <select v-model="newTask.importance_tag">
        <option value="высокая">Высокая</option>
        <option value="средняя" selected>Средняя</option>
        <option value="низкая">Низкая</option>
      </select>
      <input
          v-model="internalDate"
          @change="handleDateChange"
          type="date"
          :min="getCurrentDate()"
      />
      <button @click="addTask">Добавить задачу</button>
    </div>

    <table class="todo-table">
      <thead>
      <tr>
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
      <tr v-for="task in tasks" :key="task.id">
        <td class="task-title" @dblclick="startEditing(task, 'title')">
          <input
            v-if="task.editing && task.editingField === 'title'"
            v-model="task.title"
            @keyup.enter="finishEditing(task)"
            @blur="finishEditing(task)"
            v-focus
            class="task-input"
          />
          <span v-else>{{ task.title }}</span>
        </td>
        <td @dblclick="startEditing(task, 'description')">
          <input
            v-if="task.editing && task.editingField === 'description'"
            v-model="task.description"
            @keyup.enter="finishEditing(task)"
            @blur="finishEditing(task)"
            v-focus
            class="task-input"
          />
          <span v-else>{{ task.description }}</span>
        </td>
        <td>
          <select v-model="task.status" @change="updateTask(task)">
            <option value="не выполнено">Не выполнено</option>
            <option value="выполнено">Выполнено</option>
            <option value="выполняется">Выполняется</option>
          </select>
        </td>
        <td>
          <select v-model="task.importance_tag" @change="updateTask(task)">
            <option value="высокая">Высокая</option>
            <option value="средняя">Средняя</option>
            <option value="низкая">Низкая</option>
          </select>
        </td>
        <td>{{ formatDate(task.created_at) }}</td>
        <td>
          <input
            v-model="task.due_date_edit"
            @change="updateDueDate(task)"
            type="date"
            :min="formatDateForInput(task.created_at)"
            class="date-input"
          />
        </td>
        <td>
          <button @click="deleteTask(task.id)">Удалить</button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { supabase } from '@/clients/supabase.js';
import { useStore } from 'vuex';

export default {
  directives: {
    focus: {
      inserted(el) {
        el.focus();
      }
    }
  },
  data() {
    return {
      newTask: {
        title: '',
        description: '',
        importance_tag: 'средняя',
        due_date: '',
        status: 'не выполнено'
      },
      internalDate: null,
      tasks: []
    };
  },
  methods: {
    getCurrentDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    },

    handleDateChange() {
      if (!this.internalDate) {
        this.newTask.due_date = '';
        return;
      }
      // Сохраняем дату в формате DD.MM.YYYY для отображения
      const date = new Date(this.internalDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      this.newTask.due_date = `${day}.${month}.${year}`;
    },

    startEditing(task, field) {
      task.editing = true;
      task.editingField = field;
      // Сохраняем исходное значение на случай отмены
      task.originalValue = task[field];
    },

    finishEditing(task) {
      if (task.editing) {
        task.editing = false;
        task.editingField = null;
        this.updateTask(task);
      }
    },

    async fetchTasks() {
      try {
        const { data, error } = await supabase
            .from('todolist')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        this.tasks = (data || []).map(task => ({
          ...task,
          due_date_edit: this.formatDateForInput(task.due_date) || '',
          due_date: this.formatDateForDisplay(task.due_date) || '',
          editing: false,
          editingField: null,
          originalValue: ''
        }));
      } catch (error) {
        console.error('Ошибка при загрузке задач:', error);
      }
    },



    async addTask() {
      try {
        if (!this.newTask.title) {
          alert('Название задачи обязательно');
          return;
        }


        // Преобразуем дату в ISO формат перед отправкой
        let dueDateISO = null;
        if (this.newTask.due_date) {
          const [day, month, year] = this.newTask.due_date.split('.');
          dueDateISO = `${year}-${month}-${day}`;
        }
        const taskToAdd = {
          title: this.newTask.title,
          description: this.newTask.description,
          importance_tag: this.newTask.importance_tag,
          due_date: dueDateISO, // Используем преобразованную дату
          status: this.newTask.status,
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('todolist')
            .insert([taskToAdd])
            .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const newTask = data[0];
          this.tasks.push({
            ...newTask,
            due_date_edit: this.formatDateForInput(newTask.due_date) || '',
            due_date: this.formatDateForDisplay(newTask.due_date) || '',
            editing: false,
            editingField: null,
            originalValue: ''
          });

          // Сбрасываем форму
          this.newTask = {
            title: '',
            description: '',
            importance_tag: 'средняя',
            due_date: '',
            status: 'не выполнено'
          };
          this.internalDate = null;
        }
      } catch (error) {
        console.error('Ошибка при добавлении задачи:', error);
      }
    },

    async updateTask(task) {
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
        // Восстанавливаем исходное значение при ошибке
        if (task.editingField && task.originalValue) {
          task[task.editingField] = task.originalValue;
        }
      }
    },

    async updateDueDate(task) {
      try {
        if (!task.due_date_edit) {
          return;
        }

        // Проверка, что дата выполнения не раньше даты создания
        const createdDate = new Date(task.created_at);
        const dueDate = new Date(task.due_date_edit);

        if (dueDate < createdDate) {
          alert('Дата выполнения не может быть раньше даты создания');
          task.due_date_edit = this.formatDateForInput(task.due_date);
          return;
        }

        const formattedDueDate = this.formatDateForDisplay(task.due_date_edit);

        const { error } = await supabase
            .from('todolist')
            .update({ due_date: formattedDueDate })
            .match({ id: task.id });

        if (error) throw error;

        // Обновляем отображаемую дату
        task.due_date = formattedDueDate;
      } catch (error) {
        console.error('Ошибка при обновлении даты выполнения:', error);
      }
    },

    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },

    formatDateForDisplay(dateString) {
      if (!dateString) return '';

      // Если дата уже в формате DD.MM.YYYY, просто возвращаем
      if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        return dateString;
      }

      // Если дата в ISO формате, преобразуем
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    },

    formatDateForInput(dateString) {
      if (!dateString) return '';

      // Если дата в формате DD.MM.YYYY
      if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const [day, month, year] = dateString.split('.');
        return `${year}-${month}-${day}`;
      }

      // Если дата в ISO формате
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    },

    async deleteTask(id) {
      try {
        const { error } = await supabase
          .from('todolist')
          .delete()
          .match({ id });

        if (error) throw error;

        this.tasks = this.tasks.filter(task => task.id !== id);
      } catch (error) {
        console.error('Ошибка при удалении задачи:', error);
      }
    }
  },

  mounted() {
    this.fetchTasks();
  }
};
</script>

<style>
.todo-container {
  background-color: #e6e6fa;
  padding: 20px;
  min-height: 100vh;
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

.date-input {
  width: 100%;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 3px;
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
  padding: 12px;
  text-align: left;
  border: 1px solid #ddd;
}

.todo-table td {
  padding: 8px;
  border: 1px solid #ddd;
  background-color: #fffacd; /* Желтый цвет строк */
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}

.todo-table tr:hover td {
  background-color: #ffe4b5; /* Более темный желтый при наведении */
}

.todo-table select {
  width: 100%;
  padding: 4px;
  border: 1px solid black;
  border-radius: 3px;
}

.todo-table button {
  padding: 4px 8px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.todo-table button:hover {
  background-color: #cc0000;
}

.input-group {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.input-group input,
.input-group select {
  padding: 8px;
  margin-right: 10px;
  border: 1px solid black;
  border-radius: 4px;
}

.input-group button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex: none;
}

.input-group button:hover {
  background-color: #45a049;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}
</style>
