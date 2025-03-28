<template>
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
</template>

<script>
import { supabase } from '@/clients/supabase.js';

export default {
  data() {
    return {
      newTask: {
        title: '',
        description: '',
        importance_tag: 'средняя',
        due_date: '',
        status: 'не выполнено'
      },
      internalDate: null
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
      const date = new Date(this.internalDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      this.newTask.due_date = `${day}.${month}.${year}`;
    },

    async addTask() {
      try {
        if (!this.newTask.title) {
          alert('Название задачи обязательно');
          return;
        }

        let dueDateISO = null;
        if (this.newTask.due_date) {
          const [day, month, year] = this.newTask.due_date.split('.');
          dueDateISO = `${year}-${month}-${day}`;
        }

        const taskToAdd = {
          title: this.newTask.title,
          description: this.newTask.description,
          importance_tag: this.newTask.importance_tag,
          due_date: dueDateISO,
          status: this.newTask.status,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('todolist')
            .insert([taskToAdd]);

        if (error) throw error;

        // Сбрасываем форму
        this.newTask = {
          title: '',
          description: '',
          importance_tag: 'средняя',
          due_date: '',
          status: 'не выполнено'
        };
        this.internalDate = null;

        // Генерируем событие о добавлении новой задачи
        this.$emit('task-added');

      } catch (error) {
        console.error('Ошибка при добавлении задачи:', error);
      }
    }
  }
};
</script>

<style scoped>
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
</style>