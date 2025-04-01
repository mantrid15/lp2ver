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
// Убираем defineEmits из импорта
import { ref } from 'vue';
import { supabase } from '@/clients/supabase.js';

export default {
  name: 'NewTask',
  // Добавляем emits на уровне опций компонента для декларации событий
  emits: ['task-added'],
  // setup теперь принимает props и context (нам нужен context)
  setup(props, context) { // <--- Изменено здесь

    // Убрали: const emit = defineEmits(['task-added']);

    const newTask = ref({
      title: '',
      description: '',
      importance_tag: 'средняя',
      due_date: '', // Это будет 'дд.мм.гггг' или ''
      status: 'в очереди'
    });
    const internalDate = ref(null); // Для v-model input type="date" ('гггг-мм-дд')

    function getCurrentDate() {
      const today = new Date();
      return today.toISOString().split('T')[0]; // Формат 'гггг-мм-дд'
    }

    // Вызывается при изменении значения в input type="date"
    function handleDateChange() {
      if (!internalDate.value) {
        newTask.value.due_date = '';
        return;
      }
      const date = new Date(internalDate.value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы с 0
      const year = date.getFullYear();
      newTask.value.due_date = `${day}.${month}.${year}`;
    }

    async function addTask() {
      try {
        if (!newTask.value.title) {
          alert('Название задачи обязательно');
          return;
        }

        let dueDateForSupabase = null;
        if (newTask.value.due_date) {
            const [day, month, year] = newTask.value.due_date.split('.');
            const dateObj = new Date(year, month - 1, day);
            if (!isNaN(dateObj.getTime())) {
                 dueDateForSupabase = dateObj.toISOString().split('T')[0];
            } else {
                console.warn("Невалидная дата:", newTask.value.due_date);
                // Можно установить null или показать ошибку
                dueDateForSupabase = null;
            }
        }

        const sessionResult = await supabase.auth.getSession();
        const user = sessionResult?.data?.session?.user;

        if (!user) {
          alert('Пожалуйста, войдите в систему для добавления задачи.');
          return;
        }

        const taskToAdd = {
          title: newTask.value.title,
          description: newTask.value.description,
          importance_tag: newTask.value.importance_tag,
          due_date: dueDateForSupabase, // Отправляем 'гггг-мм-дд' или null
          status: newTask.value.status,
          created_at: new Date().toISOString(),
          user_id: user.id // Добавляем ID пользователя
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

        // Используем context.emit вместо emit
        context.emit('task-added'); // <--- Изменено здесь

      } catch (error) {
        // Логируем полную ошибку
        console.error('Ошибка при добавлении задачи:', error);
      }
    }

    // Возвращаем все необходимое для шаблона
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