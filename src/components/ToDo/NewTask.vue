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
import { ref } from 'vue';
import { supabase } from '@/clients/supabase.js';

export default {
  name: 'NewTask',

  setup(props, { emit }) {
    const newTask = ref({
      title: '',
      description: '',
      importance_tag: 'средняя',
      due_date: '',
      status: 'в очереди'
    });

    const internalDate = ref(null);

    function getCurrentDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }

    function handleDateChange() {
      if (!internalDate.value) {
        newTask.value.due_date = '';
        return;
      }
      const date = new Date(internalDate.value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      newTask.value.due_date = `${day}.${month}.${year}`;
    }

    async function addTask() {
      try {
        if (!newTask.value.title) {
          alert('Название задачи обязательно');
          return;
        }

        let dueDateISO = null;
        if (newTask.value.due_date) {
          const [day, month, year] = newTask.value.due_date.split('.');
          dueDateISO = `${year}-${month}-${day}`;
        }

        const taskToAdd = {
          title: newTask.value.title,
          description: newTask.value.description,
          importance_tag: newTask.value.importance_tag,
          due_date: dueDateISO,
          status: newTask.value.status,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('todolist')
            .insert([taskToAdd]);

        if (error) throw error;

        // Сбрасываем форму
        newTask.value = {
          title: '',
          description: '',
          importance_tag: 'средняя',
          due_date: '',
          status: 'в очереди'
        };
        internalDate.value = null;

        emit('task-added');

      } catch (error) {
        console.error('Ошибка при добавлении задачи:', error);
      }
    }

    return {
      newTask,
      internalDate,
      getCurrentDate,
      handleDateChange,
      addTask
    };
  }
};
</script>

<style scoped>
.input-group {
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
  background: white;
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