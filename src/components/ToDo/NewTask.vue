<template>
  <div class="input-group">
    <input v-model="newTask.title" placeholder="Название задачи" />
    <input v-model="newTask.description" placeholder="Описание задачи" />
    <input v-model="newTask.object" placeholder="Объект" />


    <select
        v-model="newTask.privacy"
        title="Приватность"
    >
      <option value="домашнее">Домашнее</option>
      <option value="рабочее" selected>Рабочее</option>
      <option value="иное">Иное</option>
    </select>
    <select
        v-model="newTask.project"
        title="Project"
    >
      <option value="" selected>Проект</option>
      <option
        v-for="project in uniqueProjects"
        :key="project"
        :value="project"
      >
        {{ project }}
      </option>
      <option value="new-project">+newProject</option>
    </select>
    <input
      v-if="showNewProjectInput"
      v-model="newProjectName"
      @blur="addNewProject"
      placeholder="newProject"
      class="new-project-input"
    />

    <select
        v-model="newTask.importance_tag"
        title="Важность"
    >
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
import { ref, onMounted, watch } from 'vue';
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
      object: '',
      importance_tag: 'средняя',
      due_date: '', // Это будет 'дд.мм.гггг' или ''
      status: 'в очереди',
      privacy: 'рабочее',
      project: ''
    });

    const internalDate = ref(null);
    const uniqueProjects = ref([]);
    const showNewProjectInput = ref(false);
    const newProjectName = ref('');

    // Устанавливаем текущую дату при монтировании компонента
    onMounted(() => {
      setDefaultDate();
      fetchUniqueProjects();
    });

    function setDefaultDate() {
      const today = new Date();
      internalDate.value = today.toISOString().split('T')[0];
      handleDateChange(); // Обновляем форматированную дату
    }

    function getCurrentDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
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

    const fetchUniqueProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('todolist')
          .select('project')
          .not('project', 'is', null)
          .order('project', { ascending: true });

        if (error) throw error;

        // Убираем дубликаты и пустые значения
        const projects = [...new Set(data.map(item => item.project).filter(Boolean))];
        uniqueProjects.value = projects;
      } catch (error) {
        console.error('Ошибка при загрузке проектов:', error);
      }
    };

    watch(() => newTask.value.project, (newValue) => {
      if (newValue === 'new-project') {
        showNewProjectInput.value = true;
        newTask.value.project = '';
      } else {
        showNewProjectInput.value = false;
      }
    });

    const addNewProject = async () => {
      if (!newProjectName.value.trim()) {
        showNewProjectInput.value = false;
        return;
      }

      try {
        // Добавляем проект в список
        if (!uniqueProjects.value.includes(newProjectName.value)) {
          uniqueProjects.value.push(newProjectName.value);
          uniqueProjects.value.sort();
        }

        newTask.value.project = newProjectName.value;
        newProjectName.value = '';
        showNewProjectInput.value = false;

        // Можно опционально сохранить новый проект в базу данных
        context.emit('project-added', newTask.value.project);
      } catch (error) {
        console.error('Ошибка при добавлении проекта:', error);
      }
    };

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
          object: newTask.value.object,
          importance_tag: newTask.value.importance_tag,
          due_date: dueDateForSupabase, // Отправляем 'гггг-мм-дд' или null
          status: newTask.value.status,
          privacy: newTask.value.privacy,
          project: newTask.value.project,
          created_at: new Date().toISOString(),
          user_id: user.id // Добавляем ID пользователя
        };

        const { error } = await supabase
            .from('todolist')
            .insert([taskToAdd]);

        if (error) throw error;

        // Сбрасываем форму
        newTask.value = {
          importance_tag: 'средняя',
          status: 'в очереди',
          privacy: 'рабочее',
          title: '',
          description: '',
          object: '',
          due_date: '', // Это будет 'дд.мм.гггг' или ''
          project: ''
        };
        setDefaultDate(); // Сбрасываем на текущую дату после добавления

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
      uniqueProjects,
      showNewProjectInput,
      newProjectName,
      getCurrentDate,
      handleDateChange,
      addTask,
      addNewProject
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
  cursor: pointer;
}

.input-group select:hover {
  box-shadow: 0 0 5px rgba(0,0,0,0.2);
  backrgound: rgba(9, 178, 17, 0.9);
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

.new-project-input {
  width: 150px;
  transition: width 0.3s ease;
}
</style>