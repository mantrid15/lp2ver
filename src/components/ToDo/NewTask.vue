<template>
  <div class="input-group">
    <input v-model="newTask.title" placeholder="Название задачи" />
    <input v-model="newTask.description" placeholder="Описание задачи" />
    <!-- Поле проекта с переключением между select и input -->
    <select
        v-if="!showNewProjectInput"
        v-model="newTask.project"
        title="Project"
        @change="handleProjectChange"
    >
      <option value="" selected>Проект</option>
      <option
          v-for="project in uniqueProjects"
          :key="project"
          :value="project"
      >
        {{ project }}
      </option>
      <option value="new-project">Project</option>
    </select>
    <input
        v-else
        v-model="newProjectName"
        @blur="addNewProject"
        @keyup.enter="addNewProject"
        placeholder="Новый проект"
        ref="newProjectInput"
        autofocus
    />

    <!-- Поле объекта с переключением между select и input -->
    <select
        v-if="!showNewObjectInput"
        v-model="newTask.object"
        title="Объект"
        @change="handleObjectChange"
    >
      <option value="" selected>Объект</option>
      <option
        v-for="obj in uniqueObjects"
        :key="obj"
        :value="obj"
      >
        {{ obj }}
      </option>
      <option value="new-object">Object</option>
    </select>
    <input
      v-else
      v-model="newObjectName"
      @blur="addNewObject"
      @keyup.enter="addNewObject"
      placeholder="Введите новый объект"
      class="transform-input"
      ref="newObjectInput"
      autofocus
    />

    <!-- Поле приватности -->
    <select
        v-model="newTask.privacy"
        title="Приватность"
    >
      <option value="домашнее">Домашнее</option>
      <option value="рабочее" selected>Рабочее</option>
      <option value="иное">Иное</option>
    </select>

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
    <button @click="addTask">Добавить</button>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import { supabase } from '@/clients/supabase.js';

export default {
  name: 'NewTask',
  // Добавляем emits на уровне опций компонента для декларации событий
  emits: ['task-added'],
  setup(props, context) {
    const newTask = ref({
      title: '',
      description: '',
      object: '',
      importance_tag: 'средняя',
      due_date: '',
      status: 'в очереди',
      privacy: 'рабочее',
      project: '',
      deleted: false // Добавлено поле deleted с значением false по умолчанию
    });

    const internalDate = ref(null);
    const uniqueProjects = ref([]);
    const uniqueObjects = ref([]);
    const showNewProjectInput = ref(false);
    const newProjectName = ref('');
    const showNewObjectInput = ref(false);
    const newObjectName = ref('');
    const newProjectInput = ref(null);
    const newObjectInput = ref(null);

    // Загрузка последних значений из localStorage при инициализации
    const loadLastValues = () => {
      const lastProject = localStorage.getItem('lastProject');
      const lastObject = localStorage.getItem('lastObject');

      if (lastProject) {
        newTask.value.project = lastProject;
      }
      if (lastObject) {
        newTask.value.object = lastObject;
      }
    };

    // Сохранение значений в localStorage
    const saveLastValues = () => {
      if (newTask.value.project) {
        localStorage.setItem('lastProject', newTask.value.project);
      }
      if (newTask.value.object) {
        localStorage.setItem('lastObject', newTask.value.object);
      }
    };

    onMounted(() => {
      setDefaultDate();
      fetchUniqueProjects();
      fetchUniqueObjects();
      loadLastValues(); // Загружаем последние значения при монтировании
    });

    function setDefaultDate() {
      const today = new Date();
      // Получаем дату в локальном времени
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      internalDate.value = `${year}-${month}-${day}`;
      newTask.value.due_date = `${day}.${month}.${year}`;
    }

    function getCurrentDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function handleDateChange() {
      if (!internalDate.value) {
        newTask.value.due_date = '';
        return;
      }
      // Разбиваем дату на компоненты
      const [year, month, day] = internalDate.value.split('-');
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

        const projects = [...new Set(data.map(item => item.project).filter(Boolean))];
        uniqueProjects.value = projects;
      } catch (error) {
        console.error('Ошибка при загрузке проектов:', error);
      }
    };

    // Загрузка уникальных объектов
    const fetchUniqueObjects = async () => {
      try {
        const { data, error } = await supabase
          .from('todolist')
          .select('object')
          .not('object', 'is', null)
          .order('object', { ascending: true });

        if (error) throw error;

        const objects = [...new Set(data.map(item => item.object).filter(Boolean))];
        uniqueObjects.value = objects;
      } catch (error) {
        console.error('Ошибка при загрузке объектов:', error);
      }
    };

    const handleProjectChange = async (event) => {
      if (event.target.value === 'new-project') {
        showNewProjectInput.value = true;
        await nextTick();
        newProjectInput.value?.focus();
      } else {
        // Сохраняем новое значение проекта в localStorage
        localStorage.setItem('lastProject', event.target.value);
      }
    };

    const handleObjectChange = async (event) => {
      if (event.target.value === 'new-object') {
        showNewObjectInput.value = true;
        await nextTick();
        newObjectInput.value?.focus();
      } else {
        // Сохраняем новое значение объекта в localStorage
        localStorage.setItem('lastObject', event.target.value);
      }
    };

    // Добавление нового проекта
    const addNewProject = async () => {
      if (!newProjectName.value.trim()) {
        showNewProjectInput.value = false;
        return;
      }

      try {
        if (!uniqueProjects.value.includes(newProjectName.value)) {
          uniqueProjects.value.push(newProjectName.value);
          uniqueProjects.value.sort();
        }

        newTask.value.project = newProjectName.value;
        // Сохраняем новый проект в localStorage
        localStorage.setItem('lastProject', newTask.value.project);
        newProjectName.value = '';
        showNewProjectInput.value = false;
      } catch (error) {
        console.error('Ошибка при добавлении проекта:', error);
      }
    };

    // Добавление нового объекта
    const addNewObject = async () => {
      if (!newObjectName.value.trim()) {
        showNewObjectInput.value = false;
        return;
      }

      try {
        if (!uniqueObjects.value.includes(newObjectName.value)) {
          uniqueObjects.value.push(newObjectName.value);
          uniqueObjects.value.sort();
        }

        newTask.value.object = newObjectName.value;
        // Сохраняем новый объект в localStorage
        localStorage.setItem('lastObject', newTask.value.object);
        newObjectName.value = '';
        showNewObjectInput.value = false;
      } catch (error) {
        console.error('Ошибка при добавлении объекта:', error);
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
            // Форматируем для Supabase в формате YYYY-MM-DD
            const formattedYear = dateObj.getFullYear();
            const formattedMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
            const formattedDay = String(dateObj.getDate()).padStart(2, '0');
            dueDateForSupabase = `${formattedYear}-${formattedMonth}-${formattedDay}`;
          } else {
            console.warn("Невалидная дата:", newTask.value.due_date);
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
          deleted: false, // Добавлено поле deleted со значением false
          created_at: new Date().toISOString(),
          user_id: user.id // Добавляем ID пользователя
        };

        const { error } = await supabase
            .from('todolist')
            .insert([taskToAdd]);

        if (error) throw error;

        // Сохраняем текущие значения project и object в localStorage
        saveLastValues();

        // Сбрасываем форму, но сохраняем последние значения project и object
        newTask.value = {
          importance_tag: 'средняя',
          status: 'в очереди',
          privacy: 'рабочее',
          title: '',
          description: '',
          object: localStorage.getItem('lastObject') || '',
          due_date: '',
          project: localStorage.getItem('lastProject') || '',
          deleted: false // Добавлено поле deleted при сбросе формы
        };
        setDefaultDate();

        // Вызываем событие task-added
        context.emit('task-added');

      } catch (error) {
        // Логируем полную ошибку
        console.error('Ошибка при добавлении задачи:', error);
      }
    }

    return {
      newTask,
      internalDate,
      uniqueProjects,
      uniqueObjects,
      showNewProjectInput,
      newProjectName,
      showNewObjectInput,
      newObjectName,
      newProjectInput,
      newObjectInput,
      getCurrentDate,
      handleDateChange,
      handleProjectChange,
      handleObjectChange,
      addTask,
      addNewProject,
      addNewObject
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

/* Специфичные стили для каждого типа полей */
.input-group input[placeholder="Название задачи"],
.input-group input[placeholder="Описание задачи"],
.input-group input[type="date"] {
  width: 150px; /* Ширина 150px для title, description и даты */
}

.input-group select[title="Объект"],
.input-group input[placeholder="Новый объект"],
.input-group select[title="Project"],
.input-group input[placeholder="Новый проект"] {
  width: 100px; /* Ширина 100px для object и project */
}

.input-group select[title="Приватность"],
.input-group select[title="Важность"] {
  width: 100px; /* Ширина 75px для privacy и importance_tag */
}

.input-group select:hover {
  box-shadow: 0 0 5px rgba(0,0,0,0.2);
}

.input-group button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex: none;
  width: auto; /* Для кнопки оставляем автоматическую ширину */
}

.input-group button:hover {
  background-color: #45a049;
}

.transform-input {
  padding: 8px;
  border: 1px solid black;
  border-radius: 4px;
  width: 100px; /* Установлена ширина 50px */
  transition: all 0.3s ease;
}
</style>