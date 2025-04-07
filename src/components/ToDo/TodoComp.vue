<template>
  <div class="todo-container">
    <table class="todo-table">
      <thead>
      <tr class="table-header">
        <th style="width: 15%;" :class="{ 'active-sort': isActiveSort('title') }">
          <div style="display: flex; align-items: center; padding-left: 5px;">
            <input
                type="checkbox"
                v-model="showDeletedTasks"
                @change="handleShowDeletedChange"
                style="margin-right: 8px;"
            >
            <span class="header-label-container" @click="(e) => handleClick(e, 'title')" style="cursor: pointer;">
              {{ taskTitleText }}
              <span class="sort-icon">{{ getSortIcon('title') || SORT_DEFAULT_ICON }}</span>
            </span>
          </div>
        </th>
        <th style="width: 30%;" :class="{ 'active-sort': isActiveSort('description') }">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; flex-grow: 1;">
              <div style="position: relative; display: flex; align-items: center;">
                <input
                    v-model="filterText"
                    @input="applyFilter"
                    placeholder="Фильтр..."
                    class="filter-input"
                    maxlength="10"
                    style="margin-right: 8px; padding-right: 20px;"
                />
                <i
                    v-if="filterText"
                    @click="clearFilter"
                    class="fas fa-times clear-filter-icon"
                    title="Очистить фильтр"
                ></i>
              </div>
              <span class="header-label-container" @click="(e) => handleClick(e, 'description')" style="cursor: pointer; padding-left: 5px;">
                  {{ descriptionText }}
                  <span class="sort-icon">{{ getSortIcon('description') || SORT_DEFAULT_ICON }}</span>
                </span>
              <!-- Фильтр по проекту -->
              <div class="project-filter-container">
                <select
                    v-model="selectedProjectFilter"
                    @change="applyProjectFilter"
                    class="project-filter-select"
                >
                  <option value="">Project</option>
                  <option v-for="project in uniqueProjects" :key="project" :value="project">
                    {{ project || '(без проекта)' }}
                  </option>
                </select>
                <i
                    v-if="selectedProjectFilter"
                    @click="clearProjectFilter"
                    class="fas fa-times clear-project-filter-icon"
                    title="Очистить фильтр по проекту"
                ></i>
              </div>
            </div>
            <button
                @click="applyDefaultSort"
                class="default-sort-btn"
                title="Сортировка по умолчанию"
                style="margin-right: 5px;"
            >
              Default
            </button>
          </div>
        </th>
        <th style="width: 5%; " :class="{ 'active-sort': isActiveSort('project') }">
          <span class="header-label-container" @click="(e) => handleClick(e, 'project')" style="cursor: pointer; padding-left: 5px;">
            {{ project }}
            <span class="sort-icon">{{ getSortIcon('project') || SORT_DEFAULT_ICON }}</span>
          </span>
        </th>
        <th style="width: 10%;" :class="{ 'active-sort': isActiveSort('object') }">
          <span class="header-label-container" @click="(e) => handleClick(e, 'object')" style="cursor: pointer; padding-left: 5px;">
            {{ objectText }}
            <span class="sort-icon">{{ getSortIcon('object') || SORT_DEFAULT_ICON }}</span>
          </span>
        </th>
        <th style="width: 6%; " :class="{ 'active-sort': isActiveSort('status') }">
          <span class="header-label-container" @click="(e) => handleClick(e, 'status')" style="cursor: pointer; padding-left: 5px;">
            {{ statusText }}
            <span class="sort-icon">{{ getSortIcon('status') || SORT_DEFAULT_ICON }}</span>
          </span>
        </th>
        <th style="width: 6%; " :class="{ 'active-sort': isActiveSort('importance_tag') }">
          <span class="header-label-container" @click="(e) => handleClick(e, 'importance_tag')" style="cursor: pointer; padding-left: 5px;">
            {{ importanceTagText }}
            <span class="sort-icon">{{ getSortIcon('importance_tag') || SORT_DEFAULT_ICON }}</span>
          </span>
        </th>
        <th style="width: 6%; " :class="{ 'active-sort': isActiveSort('privacy') }">
          <span class="header-label-container" @click="(e) => handleClick(e, 'privacy')" style="cursor: pointer; padding-left: 5px;">
            {{ privacy }}
            <span class="sort-icon">{{ getSortIcon('privacy') || SORT_DEFAULT_ICON }}</span>
          </span>
        </th>
        <th style="width: 6%; " :class="{ 'active-sort': isActiveSort('created_at') }">
          <span class="header-label-container" @click="(e) => handleClick(e, 'created_at')" style="cursor: pointer; padding-left: 5px;">
            {{ creationDateText }}
            <span class="sort-icon">{{ getSortIcon('created_at') || SORT_DEFAULT_ICON }}</span>
          </span>
        </th>
        <th style="width: 6%; " :class="{ 'active-sort': isActiveSort('due_date') }">
          <span class="header-label-container" @click="(e) => handleClick(e, 'due_date')" style="cursor: pointer; padding-left: 5px;">
            {{ completionDateText }}
            <span class="sort-icon">{{ getSortIcon('due_date') || SORT_DEFAULT_ICON }}</span>
          </span>
        </th>
        <th style="width: 5%; padding-left: 5px;">{{ deleteText }}</th>
      </tr>
      </thead>
      <tbody>
        <tr v-for="task in filteredTasks"
          :key="task.id"
          :data-deleted="task.deleted"
          :class="{
            'deleted-task-row': task.deleted, // Стиль для удаленных (можно добавить в CSS)
            'completed-task': task.status === completedStatus && !task.deleted, // Только для не удаленных
            'status-completed': task.status === completedStatus,
            'status-in-progress': task.status === inProgressStatus,
            'status-not-started': task.status === notStartedStatus
          }">
        <td class="task-title" :title="task.title"
            @dblclick="!isTaskCompleted(task) && !task.deleted && startEditing(task, 'title')"
            @mousemove="(e) => showTooltip(e, task.title)"
            @mouseleave="removeTooltip()">
          <input
              v-if="task.editing && task.editingField === 'title'"
              v-model="task.title"
              @keyup.enter="finishEditing(task)"
              @blur="finishEditing(task)"
              v-focus
              class="task-input"
              :disabled="isTaskCompleted(task) || task.deleted"
            />
            <span v-else>{{ task.title }}</span>
          </td>
        <td :title="task.description"
            @dblclick="!isTaskCompleted(task) && !task.deleted && startEditing(task, 'description')"
            @mousemove="(e) => showTooltip(e, task.description)"
            @mouseleave="removeTooltip()">
            <input
              v-if="task.editing && task.editingField === 'description'"
              v-model="task.description"
              @keyup.enter="finishEditing(task)"
              @blur="finishEditing(task)"
              v-focus
              class="task-input"
              :disabled="isTaskCompleted(task) || task.deleted"
            />
            <span v-else>{{ task.description }}</span>
          </td>
        <td @dblclick="!isTaskCompleted(task) && !task.deleted && startEditing(task, 'project')">
          <input
              v-if="task.editing && task.editingField === 'project'"
              v-model="task.project"
              @keyup.enter="finishEditing(task)"
              @blur="finishEditing(task)"
              v-focus
              class="task-input"
              :disabled="isTaskCompleted(task) || task.deleted"
          />
          <span v-else>{{ task.project || '-' }}</span>
        </td>
        <td :title="task.object"
            @dblclick="!isTaskCompleted(task) && !task.deleted && startEditing(task, 'object')"
            @mousemove="(e) => showTooltip(e, task.object)"
            @mouseleave="removeTooltip()">
            <input
              v-if="task.editing && task.editingField === 'object'"
              v-model="task.object"
              @keyup.enter="finishEditing(task)"
              @blur="finishEditing(task)"
              v-focus
              class="task-input"
              :disabled="isTaskCompleted(task) || task.deleted"
          />
          <span v-else>{{ task.object }}</span>
        </td>
        <td class="status-cell" :class="statusClass(task.status)">
          <select v-model="task.status" @change="updateTask(task)" :disabled="task.deleted && task.status === completedStatus">
            <option :value="inProgressStatus">{{ inProgressText }}</option>
            <option :value="completedStatus">{{ completedText }}</option>
            <option :value="notStartedStatus">{{ notStartedText }}</option>
            <option :value="waitedStatus">{{ waitedText }}</option>
          </select>
        </td>
        <td class="importance-cell" :class="importanceClass(task.importance_tag)">
          <select v-model="task.importance_tag" @change="updateTask(task)" :disabled="isTaskCompleted(task) || task.deleted">
            <option :value="highImportance">{{ highImportanceText }}</option>
            <option :value="mediumImportance">{{ mediumImportanceText }}</option>
            <option :value="lowImportance">{{ lowImportanceText }}</option>
          </select>
        </td>
        <td class="privacy-cell" :class="privacyClass(task.privacy)">
          <select v-model="task.privacy" @change="updateTask(task)" :disabled="isTaskCompleted(task) || task.deleted">
            <option :value="workPrivacy">{{ workPrivacyText }}</option>
            <option :value="homePrivacy">{{ homePrivacyText }}</option>
            <option :value="otherPrivacy">{{ otherPrivacyText }}</option>
          </select>
        </td>
        <td class="date-cell">{{ formatDate(task.created_at) }}</td>
        <td class="date-cell" @dblclick="!isTaskCompleted(task) && !task.deleted && startEditing(task, 'due_date')">
          <input
              v-if="task.editing && task.editingField === 'due_date'"
              :value="task.due_date_edit"
              @input="updateDueDateValue(task, $event.target.value)"
              @blur="finishEditing(task)"
              type="date"
              :min="formatDateForInput(task.created_at)"
              class="date-input"
              v-focus
          />
          <span v-else>
            {{ formatDateForDisplay(task.due_date) }}
            <i class="fas fa-calendar-alt" @click="!isTaskCompleted(task) && !task.deleted && startEditing(task, 'due_date')" title="Редактировать дату" style="cursor: pointer; margin-left: 5px;"></i>
          </span>
        </td>
        <td class="delete-cell">
          <template v-if="task.deleted">
            <button
                @click="restoreTask(task.id)"
                class="restore-btn"
                title="Восстановить"
            >
              <i class="fas fa-undo-alt"></i>
            </button>
            <button
                @click="permanentlyDeleteTask(task.id)"
                class="permanent-delete-btn"
                title="Удалить окончательно"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
          </template>
          <button
              v-else
              @click="deleteTask(task.id)"
              class="delete-btn"
              title="Удалить"
          >
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { supabase } from '@/clients/supabase.js';

export default {
  name: 'TodoComp',

  setup(props, { emit }) {

    const selectedProjectFilter = ref('');
    const uniqueProjects = ref([]);


    const currentSortKey = ref('created_at');
    const currentSortOrder = ref('desc');

    const tasks = ref([]);
    const filterText = ref('');

    // Константы для сортировки
    const SORT_ASC_ICON = '↑';
    const SORT_DESC_ICON = '↓';
    const SORT_DEFAULT_ICON = '⇅';

    // Статусы задач
    const completedStatus = 'выполнено';
    const inProgressStatus = 'выполняется';
    const notStartedStatus = 'в очереди';
    const waitedStatus = 'отложено';
    const completedText = 'Выполнено';
    const inProgressText = 'Выполняется';
    const notStartedText = 'В очереди';
    const waitedText = 'Отложено';

    // Уровни важности
    const highImportance = 'высокая';
    const mediumImportance = 'средняя';
    const lowImportance = 'низкая';
    const highImportanceText = 'Высокая';
    const mediumImportanceText = 'Средняя';
    const lowImportanceText = 'Низкая';

    // Типы приватности
    const homePrivacy = 'домашнее';
    const workPrivacy = 'рабочее';
    const otherPrivacy = 'иное';
    const homePrivacyText = 'Домашнее';
    const workPrivacyText = 'Рабочее';
    const otherPrivacyText = 'Иное';

    // Уровни сложности
    const highComplexity = 'высокая';
    const mediumComplexity = 'средняя';
    const lowComplexity = 'низкая';
    const highComplexityText = 'Высокая';
    const mediumComplexityText = 'Средняя';
    const lowComplexityText = 'Низкая';

    // Текстовые константы
    const taskTitleText = 'Задача';
    const descriptionText = 'Описание';
    const privacy = 'Локаль';
    const project = 'Проект';
    const objectText = 'Объект';
    const statusText = 'Статус';
    const importanceTagText = 'Важность';
    const creationDateText = 'Создано';
    const completionDateText = 'Сделать';
    const deleteText = 'Удалить';
    const deleteButtonText = 'Удалить';
    const restoreButtonText = 'Восстановить';
    const permanentDeleteButtonText = 'Удалить окончательно';
    const projectText = 'Проект'; // Новая текстовая константа

    const removeTooltip = () => {
      const tooltips = document.querySelectorAll('.custom-tooltip');
      tooltips.forEach(tooltip => {
        if (tooltip.parentNode === document.body) {
          document.body.removeChild(tooltip);
        }
      });
    };

    const isActiveSort = (key) => {
      return currentSortKey.value === key;
    };
    // Сообщения об ошибках
    const errorMessages = {
      loadTasks: 'Ошибка при загрузке задач:',
      updateTask: 'Ошибка при обновлении задачи:',
      updateDate: 'Ошибка при обновлении даты выполнения:',
      deleteTask: 'Ошибка при пометке задачи как удаленной:',
      permanentlyDeleteTask: 'Ошибка при окончательном удалении задачи:',
      restoreTask: 'Ошибка при восстановлении задачи:',
      dateValidation: 'Дата выполнения не может быть раньше даты создания',
      fetchUser: 'Не удалось получить ID пользователя для загрузки задач.',
      updateUserMismatch: 'Попытка обновить задачу другого пользователя.'
    };
    // Состояние компонента
    const subscription = ref(null);
    const showDeletedTasks = ref(false);
    const currentUserId = ref(null);

    // Метод для загрузки уникальных проектов
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
    // Метод для применения фильтра по проекту
    const applyProjectFilter = () => {
      // Фильтрация будет обработана в computed свойстве filteredTasks
    };
    // Метод для очистки фильтра по проекту
    const clearProjectFilter = () => {
      selectedProjectFilter.value = '';
    };
    const applyDefaultSort = () => {
      // Определяем порядок сортировки для каждого поля
      const statusOrder = {
        [inProgressStatus]: 1,
        [notStartedStatus]: 2,
        [waitedStatus]: 3,
        [completedStatus]: 4
      };

      const privacyOrder = {
        [workPrivacy]: 1,
        [homePrivacy]: 2,
        [otherPrivacy]: 3
      };

      const importanceOrder = {
        [highImportance]: 1,
        [mediumImportance]: 2,
        [lowImportance]: 3
      };
            // Создаем копию массива для сортировки
      const tasksToSort = [...tasks.value];

      // Сортируем задачи по указанным критериям
      tasksToSort.sort((a, b) => {
        // Сначала по статусу
        const statusCompare = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
        if (statusCompare !== 0) return statusCompare;

        // Затем по приватности
        const privacyCompare = (privacyOrder[a.privacy] || 4) - (privacyOrder[b.privacy] || 4);
        if (privacyCompare !== 0) return privacyCompare;

        // Затем по важности
        const importanceCompare = (importanceOrder[a.importance_tag] || 4) - (importanceOrder[b.importance_tag] || 4);
        if (importanceCompare !== 0) return importanceCompare;

        try {
          const aDate = a.created_at ? new Date(a.created_at) : new Date(0);
          const bDate = b.created_at ? new Date(b.created_at) : new Date(0);
          currentSortKey.value = '';
          currentSortOrder.value = 'asc';
          return bDate - aDate;
        } catch (e) {
          return 0;
        }
      });

      // Обновляем массив задач
      tasks.value = tasksToSort;

      // Сбрасываем текущую сортировку (если была)
      currentSortKey.value = '';
      currentSortOrder.value = 'asc';
    };

    const showTooltip = (event, text) => {
      // Удаляем старые подсказки, если они есть
      removeTooltip();

      // Показываем подсказку только если:
      // 1) нажат Ctrl
      // 2) текст не помещается в ячейке
      if (event.ctrlKey && text) {
        const target = event.currentTarget;
        const isTextOverflowing = target.scrollWidth > target.clientWidth;

        if (isTextOverflowing) {
          const tooltip = document.createElement('div');
          tooltip.className = 'custom-tooltip';
          tooltip.textContent = text;
          document.body.appendChild(tooltip);

          // Позиционируем подсказку рядом с ячейкой
          const rect = target.getBoundingClientRect();
          tooltip.style.left = `${rect.left}px`;
          tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        }
      }
    };

    const clearFilter = () => {
      filterText.value = '';
    };
    // Computed свойства
    const displayedTasks = computed(() => {
      let tasksToDisplay = showDeletedTasks.value
        ? tasks.value
        : tasks.value.filter(task => !task.deleted);

      return [...tasksToDisplay].sort((a, b) =>
        sortByKey(a, b, currentSortKey.value, currentSortOrder.value)
      );
    });

    // Computed свойство для фильтрации и сортировки задач
    const filteredTasks = computed(() => {
      let filtered = [...displayedTasks.value]; // Используем displayedTasks вместо tasks.value

      if (filterText.value.trim()) {
        const searchText = filterText.value.toLowerCase().trim();
        filtered = filtered.filter(task =>
            (task.title?.toLowerCase().includes(searchText)) ||
            (task.description?.toLowerCase().includes(searchText))
        );
      }
      if (selectedProjectFilter.value) {
        filtered = filtered.filter(task =>
            selectedProjectFilter.value === '(без проекта)'
                ? !task.project
                : task.project === selectedProjectFilter.value
        );
      }

      if (currentSortKey.value) {
        filtered.sort((a, b) => {
          const modifier = currentSortOrder.value === 'asc' ? 1 : -1;
          const aValue = a[currentSortKey.value] ?? '';
          const bValue = b[currentSortKey.value] ?? '';

          if (['created_at', 'due_date'].includes(currentSortKey.value)) {
            try {
              const aDate = aValue ? new Date(aValue) : new Date(0);
              const bDate = bValue ? new Date(bValue) : new Date(0);
              return (aDate - bDate) * modifier;
            } catch (e) {
              return 0;
            }
          }
          return String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase()) * modifier;
        });
      }
      return filtered;
    });
    // Методы
    const applyFilter = () => {
      // Фильтрация происходит автоматически через computed свойство filteredTasks
    };

    const formatDateForDisplay = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      } catch (e) {
        console.error("Ошибка форматирования даты для отображения:", dateString, e);
        return dateString;
      }
    };

    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      if (!/\d{4}-\d{2}-\d{2}/.test(dateString)) {
        console.warn("formatDateForInput: Неверный формат даты для инпута:", dateString);
        if (/\d{2}\.\d{2}\.\d{4}/.test(dateString)) {
          const [day, month, year] = dateString.split('.');
          return `${year}-${month}-${day}`;
        }
        return '';
      }
      return dateString;
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
      } catch (e) {
        console.error("Ошибка форматирования даты создания:", dateString, e);
        return dateString;
      }
    };
    // --- Конец функций форматирования дат ---
    const importanceClass = (importance) => ({
      'importance-high': importance === highImportance,
      'importance-medium': importance === mediumImportance,
      'importance-low': importance === lowImportance
    });

    const statusClass = (status) => ({
      'status-completed': status === completedStatus,
      'status-in-progress': status === inProgressStatus,
      'status-not-started': status === notStartedStatus,
      'status-waited': status === waitedStatus
    });

    const privacyClass = (privacy) => ({
      'privacy-home': privacy === homePrivacy,
      'privacy-work': privacy === workPrivacy,
      'privacy-other': privacy === otherPrivacy
    });

    const complexityClass = (complexity) => ({
      'complexity-high': complexity === highComplexity,
      'complexity-medium': complexity === mediumComplexity,
      'complexity-low': complexity === lowComplexity
    });

    // Функции для сортировки
    const handleClick = (event, key) => {
      event.stopPropagation();
      if (currentSortKey.value === key) {
        currentSortOrder.value = currentSortOrder.value === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortOrder.value = 'asc';
      }
      currentSortKey.value = key;
      emit('sort', key, currentSortOrder.value); // Эмитим событие сортировки
    };


    const getSortIcon = (key) => {
      if (currentSortKey.value === key) {
        return currentSortOrder.value === 'asc' ? SORT_ASC_ICON : SORT_DESC_ICON;
      }
      return SORT_DEFAULT_ICON;
    };


    const sortByKey = (a, b, key, order) => {
      const modifier = order === 'asc' ? 1 : -1;

      // Получаем значения с проверкой на undefined/null
      const aValue = a[key] !== undefined && a[key] !== null ? a[key] : '';
      const bValue = b[key] !== undefined && b[key] !== null ? b[key] : '';

      // Для дат
      if (key === 'created_at' || key === 'due_date') {
        try {
          const aDate = aValue ? new Date(aValue) : new Date(0);
          const bDate = bValue ? new Date(bValue) : new Date(0);
          return (aDate - bDate) * modifier;
        } catch (e) {
          return 0;
        }
      }

      // Для выпадающих списков
      if (key === 'privacy' || key === 'complexity' || key === 'status' || key === 'importance_tag') {
        return aValue.toString().localeCompare(bValue.toString()) * modifier;
      }

      // Для текстовых полей
      return aValue.toString().toLowerCase().localeCompare(bValue.toString().toLowerCase()) * modifier;
    };

    const isTaskCompleted = (task) => task.status === completedStatus;

    const startEditing = (task, field) => {
      if (isTaskCompleted(task) || task.deleted) return;
      tasks.value.forEach(t => { if (t.editing) finishEditing(t, false); });
      task.originalValue = task[field];
      task.editing = true;
      task.editingField = field;
      nextTick(() => {
        const inputElement = document.querySelector(`tr[data-task-id="${task.id}"] input.task-input`);
        if (inputElement) {
          inputElement.focus();
        }
      });
    };

    const finishEditing = (task, shouldUpdateDB = true) => {
      if (task.editing) {
        task.editing = false;
        task.editingField = null;
        if (shouldUpdateDB && task[task.editingField] !== task.originalValue) {
          updateTask(task);
        } else if (!shouldUpdateDB) {
          task[task.editingField] = task.originalValue;
        }
        task.originalValue = '';
      }
    };

    const updateTask = async (task) => {
      if (task.user_id !== currentUserId.value) {
        console.error(errorMessages.updateUserMismatch, `Task ID: ${task.id}, Task User: ${task.user_id}, Current User: ${currentUserId.value}`);
        fetchAllTasks();
        return;
      }
      try {
        const taskToUpdate = {
          title: task.title,
          description: task.description,
          object: task.object,
          privacy: task.privacy,
          project: task.project,
          status: task.status,
          importance_tag: task.importance_tag,
        };

         const { error } = await supabase
           .from('todolist')
           .update(taskToUpdate)
           .match({ id: task.id, user_id: currentUserId.value }); // Обновляем только свою задачу

        if (error) throw error;
      } catch (error) {
        console.error(errorMessages.updateTask, error);
        fetchAllTasks();
      }
    };
    // ИЗМЕНЕНО: Обновление даты
    // Нужна промежуточная функция, чтобы поймать значение из @input
     const updateDueDateValue = (task, newDateValue_YYYYMMDD) => {
         if (isTaskCompleted(task) || task.deleted) return;

         const createdDate = new Date(task.created_at);
         createdDate.setHours(0,0,0,0); // Убираем время для сравнения
         const dueDate = new Date(newDateValue_YYYYMMDD);
         dueDate.setHours(0,0,0,0); // Убираем время для сравнения

      if (dueDate < createdDate) {
        alert(errorMessages.dateValidation);
        fetchAllTasks();
        return;
      }
      updateDueDate(task, newDateValue_YYYYMMDD);
    };

    const updateDueDate = async (task, newDate_YYYYMMDD) => {
      if (task.user_id !== currentUserId.value) {
        console.error(errorMessages.updateUserMismatch, `Task ID: ${task.id}`);
        fetchAllTasks();
        return;
      }
      try {
        const { error } = await supabase
          .from('todolist')
          .update({ due_date: newDate_YYYYMMDD || null })
          .match({ id: task.id, user_id: currentUserId.value });

             if (error) throw error;

        task.due_date = newDate_YYYYMMDD;
        task.due_date_edit = newDate_YYYYMMDD;
      } catch (error) {
        console.error(errorMessages.updateDate, error);
        fetchAllTasks();
      }
    };

    const deleteTask = async (id) => {
      const task = tasks.value.find(t => t.id === id);
      if (!task || task.user_id !== currentUserId.value) {
        console.error("Попытка удалить чужую или несуществующую задачу.");
        return;
      }
      try {
        const { error } = await supabase
          .from('todolist')
          .update({ deleted: true })
          .match({ id: id, user_id: currentUserId.value });

        if (error) throw error;
         // Обновляем локальное состояние (real-time тоже сработает)
         const taskIndex = tasks.value.findIndex(t => t.id === id);
         if (taskIndex !== -1) {
           tasks.value[taskIndex].deleted = true;
         }
       } catch (error) {
         console.error(errorMessages.deleteTask, error);
       }
     };
    // ИЗМЕНЕНО: Восстановление
    const restoreTask = async (id) => {
         const task = tasks.value.find(t => t.id === id);
         if (!task || task.user_id !== currentUserId.value) {
             console.error("Попытка восстановить чужую или несуществующую задачу.");
             return;
         }
       try {
         const { error } = await supabase
           .from('todolist')
           .update({ deleted: false }) // Снимаем пометку
           .match({ id: id, user_id: currentUserId.value });

         if (error) throw error;
         // Обновляем локальное состояние (real-time тоже сработает)
          const taskIndex = tasks.value.findIndex(t => t.id === id);
         if (taskIndex !== -1) {
           tasks.value[taskIndex].deleted = false;
         }
       } catch (error) {
         console.error(errorMessages.restoreTask, error);
       }
     };
    // ИЗМЕНЕНО: Окончательное удаление
    const permanentlyDeleteTask = async (id) => {
         const task = tasks.value.find(t => t.id === id);
         if (!task || task.user_id !== currentUserId.value) {
             console.error("Попытка окончательно удалить чужую или несуществующую задачу.");
             return;
         }
        // Добавим подтверждение
        if (!confirm(`Вы уверены, что хотите навсегда удалить задачу "${task.title}"? Это действие необратимо.`)) {
             return;
         }
       try {
         const { error } = await supabase
           .from('todolist')
           .delete() // Физическое удаление
           .match({ id: id, user_id: currentUserId.value });

        if (error) throw error;
        tasks.value = tasks.value.filter(t => t.id !== id);
      } catch (error) {
        console.error(errorMessages.permanentlyDeleteTask, error);
      }
    };

    const fetchAllTasks = async () => {
      if (!currentUserId.value) {
        console.warn(errorMessages.fetchUser);
        tasks.value = [];
        return;
      }
      try {
        const { data, error } = await supabase
            .from('todolist')
            .select('*')
            .eq('user_id', currentUserId.value)
            .order('created_at', { ascending: true }); // Исходная сортировка по дате

        if (error) throw error;

        tasks.value = (data || []).map(task => ({
          ...task,
          due_date_edit: formatDateForInput(task.due_date) || '',
          editing: false,
          editingField: null,
          originalValue: ''
        }));

        // Сразу применяем сортировку Default при загрузке
        applyDefaultSort();

      } catch (error) {
        console.error(errorMessages.loadTasks, error);
        tasks.value = [];
      }
    };

    const setupRealtimeUpdates = () => {
      unsubscribeFromRealtimeChanges();
      console.log('Setting up realtime subscription...');
      try {
        subscription.value = supabase
          .channel('todolist_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'todolist',
          },
          (payload) => {
            console.log('Realtime change received:', payload);
            fetchAllTasks();
          })
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('Realtime subscription active.');
            }
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error('Realtime subscription error:', status, err);
            }
            if (status === 'CLOSED') {
              console.log('Realtime subscription closed.');
            }
          });
      } catch (error) {
        console.error("Ошибка при создании realtime подписки:", error);
      }
    };

     const unsubscribeFromRealtimeChanges = () => {
       if (subscription.value) {
         console.log('Removing realtime subscription...');
         supabase.removeChannel(subscription.value)
            .then(() => console.log("Subscription removed."))
            .catch(err => console.error("Error removing subscription:", err));
         subscription.value = null;
       }
     };
    // --- Конец Real-time ---


    // --- Хуки жизненного цикла ---
    onMounted(async () => {
      await fetchUniqueProjects();
      document.addEventListener('keyup', (e) => {
        if (e.key === 'Control') {
          removeTooltip();
        }
        });
       // Получаем ID текущего пользователя при монтировании
       const session = await supabase.auth.getSession();
       currentUserId.value = session?.data?.session?.user?.id || null;
       console.log("TodoComp Mounted. User ID:", currentUserId.value);

       if (currentUserId.value) {
         await fetchAllTasks(); // Загружаем задачи, если пользователь есть
         setupRealtimeUpdates(); // Настраиваем подписку
       } else {
           console.warn("Нет пользователя при монтировании TodoComp, задачи не загружены.");
       }
        // Слушаем изменения аутентификации ЗДЕСЬ, чтобы обновлять задачи
        supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log("Auth state changed in TodoComp:", _event);
            const newUserId = session?.user?.id || null;
            if (newUserId !== currentUserId.value) {
                console.log("User ID changed:", newUserId);
                currentUserId.value = newUserId;
                 unsubscribeFromRealtimeChanges(); // Отписываемся от старого канала
                 if (currentUserId.value) {
                     await fetchAllTasks(); // Загружаем задачи нового пользователя
                     setupRealtimeUpdates(); // Подписываемся на нового пользователя
                 } else {
                     tasks.value = []; // Очищаем задачи при выходе
                 }
            }
        });
     });

     onUnmounted(() => {
       document.removeEventListener('keyup', removeTooltip);
       console.log("TodoComp Unmounted.");
       unsubscribeFromRealtimeChanges(); // Отписываемся при размонтировании
        // Также отписываемся от onAuthStateChange, если нужно
        // (но обычно основной слушатель в App.vue достаточен)
     });
    // --- Конец хуков ---
    return {

      uniqueProjects,
      applyProjectFilter,
      clearProjectFilter,
      removeTooltip,
      isActiveSort,
      applyDefaultSort,
      showTooltip,
      clearFilter,
      filterText, // Добавляем эту строку
      applyFilter,
      tasks,
      showDeletedTasks,
      filteredTasks,
      isTaskCompleted,
      startEditing,
      finishEditing,
      updateTask,
      restoreTask,
      updateDueDateValue,
      deleteTask,
      formatDate, // Для created_at
      formatDateForDisplay, // Используется внутри? Если нет, убрать
      formatDateForInput, // Для due_date_edit / min атрибута
      permanentlyDeleteTask,
      importanceClass,
      statusClass,
      privacyClass,
      complexityClass,
      handleClick,
      getSortIcon,
      selectedProjectFilter,

      currentSortKey,
      currentSortOrder,
      SORT_ASC_ICON,
      SORT_DESC_ICON,
      SORT_DEFAULT_ICON,
      taskTitleText, descriptionText, privacy, project, objectText, statusText,
      importanceTagText, creationDateText, completionDateText, deleteText, deleteButtonText,
      completedStatus, inProgressStatus, notStartedStatus, waitedStatus,
      completedText, inProgressText, notStartedText, waitedText, projectText,
      highImportance, mediumImportance, lowImportance, highImportanceText, mediumImportanceText, lowImportanceText,
      homePrivacy, workPrivacy, otherPrivacy, homePrivacyText, workPrivacyText, otherPrivacyText,
      highComplexity, mediumComplexity, lowComplexity, highComplexityText, mediumComplexityText, lowComplexityText,
      restoreButtonText, permanentDeleteButtonText
      // --- Конец текстовых переменных ---
    };
  }
};
</script>

<style scoped>
/* Остальные стили остаются без изменений */
/*
@import url('@/styles/all.min.css');
*/
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

@media screen and (max-width: 1200px) {
  .todo-table th {
    font-size: 0.8em;
    padding: 8px 4px;
  }

  .sort-icon {
    font-size: 0.8em;
  }

  .header-label-container {
    font-size: 0.9em;
  }
}

@media screen and (max-width: 992px) {
  .todo-table th {
    font-size: 0.75em;
  }

  .sort-icon {
    font-size: 0.75em;
  }

  .todo-table td {
    font-size: 0.8em;
  }
}

@media screen and (max-width: 768px) {
  .todo-container {
    padding: 10px 2px;
  }

  .todo-table th {
    font-size: 0.7em;
    padding: 6px 2px;
  }

  .sort-icon {
    font-size: 0.7em;
  }

  .todo-table td {
    font-size: 0.75em;
    padding: 4px 2px;
  }

  .delete-btn, .restore-btn, .permanent-delete-btn {
    width: 20px;
    height: 20px;
  }

  .delete-btn i, .restore-btn i, .permanent-delete-btn i {
    font-size: 12px;
  }
}

@media screen and (max-width: 576px) {
  .todo-table th {
    font-size: 0.65em;
  }

  .sort-icon {
    font-size: 0.65em;
  }

  .todo-table td {
    font-size: 0.7em;
  }

  .filter-input {
    max-width: 70px;
    font-size: 0.7em;
  }

  .default-sort-btn {
    width: 60px;
    font-size: 0.7em;
  }
}


.project-filter-container {
  position: relative;
  margin-left: 30px;

}

.project-filter-select {
  padding: 2px 5px;
  width: 90px;
  border-radius: 2px;
  border: 1px solid #000000;
  background-color: pink;
  cursor: pointer;
}

.clear-project-filter-icon {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #999;
  font-size: 12px;
}

.clear-project-filter-icon:hover {
  color: #666;
}
.active-sort {
  background-color: #9c27b0 !important; /* Фиолетовый цвет */
  color: white !important;
}

/* Для кнопки Default */
.default-sort-btn {
  background-color: #9c27b0; /* Фиолетовый цвет */
  color: white;
}

.default-sort-btn:hover {
  background-color: #7b1fa2; /* Темнее фиолетовый при наведении */
}

.default-sort-btn {
  height: 100%;
  width: 80px;
  background-color: #ff4444; /* Красный цвет */
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8em;
  /*
  padding: 0 5px;
  */
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  /*
  margin-left: 5px; !* Отступ 5px от соседних элементов *!
  */
}

.default-sort-btn:hover {
  background-color: #cc0000; /* Темнее красный при наведении */
}

.custom-tooltip {
  position: absolute;
  background: #333;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  z-index: 1000;
  pointer-events: none;
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Добавляем стили для иконки очистки */
.clear-filter-icon {
  position: absolute;
  right: 12px;
  cursor: pointer;
  color: #999;
  font-size: 12px;
}

.clear-filter-icon:hover {
  color: #666;
}

.filter-input {
  background-color: pink;
  border-radius: 2px;
  border: 1px solid #ccc;
  padding: 2px 5px;
  width: 80px;
}
/* Добавляем стиль для поля фильтрации */
.filter-input {
  background-color: pink;
  border-radius: 2px;
  border: 1px solid #000000;
  padding: 2px 5px;
  margin: 2px 5px;
  width: calc(100% - 10px);
  max-width: 100px;
}

.table-header {
  border-bottom: 3px solid #000; /* Добавляем более толстую нижнюю границу для всей строки заголовка */
}

.todo-table td:first-child, /* Первый столбец (Задача) */
.todo-table td:nth-child(2), /* Второй столбец (Описание) */
.todo-table td:nth-child(3) { /* Третий столбец (Объект) */
  padding-left: 5px !important;
}
/* Для инпутов в этих ячейках */
.todo-table td:first-child .task-input,
.todo-table td:nth-child(2) .task-input,
.todo-table td:nth-child(3) .task-input {
  padding-left: 5px;
}

.todo-table td:nth-child(8), /* created_at */
.todo-table td:nth-child(9) { /* due_date */
  padding-left: 5px !important;
}
/* Для инпутов в ячейке due_date */
.todo-table td:nth-child(9) .date-input {
  padding-left: 5px;
}
/* Для текстового содержимого в ячейках с датами */
.todo-table td:nth-child(8) > span,
.todo-table td:nth-child(9) > span {
  padding-left: 5px;
  display: inline-block;
}

.header-label-container {
  display: flex;
  align-items: center;
  gap: 5px;
}

.sort-icon {
  /*
  font-size: 0.9em;
  */
  opacity: 0.7;
  font-size: 0.85em; /* Базовый размер */
  transition: all 0.3s ease;
}

.header-label-container:hover .sort-icon {
  opacity: 1;
}

.task-title {
  font-weight: bold;
  margin-left: 5px;
  color: black;
  font-size: 1.2em;
  cursor: pointer;
}

.task-input {
  /*
  font-size: 0.9em;
  */
  max-width: 100%;
  width: 100%;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 1em;
}

.todo-container {
  background-color: #e6e6fa;
  padding-top: 30px;
  padding-left: 5px; /* Отступы по краям */
  padding-right: 5px; /* Отступы по краям */
  min-height: 100vh;
  margin: 0;
  width: 100%;
  overflow-x: auto;
}

.todo-table {
  font-size: calc(12px + 0.3vw); /* Адаптивный базовый размер */

  border-collapse: collapse;
  width: 100%;
  margin: 0;
  table-layout: fixed;
}

.todo-table th {
  font-size: 0.85em; /* Базовый размер */
  transition: all 0.3s ease; /* Плавное изменение размеров */
  padding: 10px 8px; /* Адаптивный padding */
  background-color: #4CAF50;
  font-weight: bold;
  /*
  padding: 4px;
  */
  text-align: center;
  border: 1px solid #000; /* Убираем задвоенные границы */
  /*
  font-size: 0.9em;
  */
  height: 36px;
}

.todo-table td {

  transition: all 0.3s ease;
  border: 1px solid #000; /* Убираем задвоенные границы */
  font-size: 0.9em;
  /*
  height: 23px; !* Установите фиксированную высоту для всех ячеек *!
  */
  height: 80%; /* Установите фиксированную высоту для всех ячеек */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative; /* Добавляем для корректного позиционирования */
}

.todo-table tr:hover td {
  background-color: #e1cb07;
}
/* Стиль для удаленных задач */
.todo-table tr[data-deleted="true"] {
  background-color: #808080; /* Темно-серая заливка для удаленных задач */
}

.date-input {
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  font-size: 0.9em;
}

.date-input:disabled {
  background-color: transparent;
  cursor: not-allowed;
}
/* Стили для ячейки удаления */
.delete-cell {
  border: 1px solid #000 !important; /* Такая же граница, как у других ячеек */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1px;
  /*
  height: 100%;
  */
  width: 100%; /* Фиксированная ширина для столбца удаления */
  height: 40px; /* Установите фиксированную высоту */
  border-left-style: none !important;
  border-top-style: none !important;
  box-sizing: border-box; /* Учитываем границы в высоте */
}

.delete-cell button {
  border: none !important;
  margin: 0 2px;

}

.delete-btn, .restore-btn, .permanent-delete-btn {
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  margin: 2px;
  border-radius: 4px;
}

.delete-btn i, .restore-btn i, .permanent-delete-btn i {
  font-size: 14px;
}

.delete-btn {
  background: #ff4444;
  color: #fff;
}

.delete-btn:hover {
  background: #cc0000;
}

.restore-btn {
  background: #09B211E5;
  color: white;
}

.restore-btn:hover {
  background: #016b07;
}

.permanent-delete-btn {
  background: #9c27b0;
  color: white;
}

.permanent-delete-btn:hover {
  background: #7b1fa2;
}

.completed-task td:not(.status-cell):not(.delete-cell) {
  position: relative;
}

.completed-task td:not(.status-cell):not(.delete-cell)::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: red;
  transform: translateY(-50%);
  z-index: 1;
}

.status-cell, .privacy-cell, .complexity-cell, .importance-cell {
  padding: 0 !important;
}

.status-cell select, .privacy-cell select,
.complexity-cell select, .importance-cell select {
  width: 100%;
  height: 100%;
  padding: 2px;
  border: none;
  font-size: 0.9em;
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: transparent;
}

.status-cell.status-completed {
  background-color: #ff4444 !important;
  color: white;
}

.status-cell.status-in-progress {
  background-color: #4CAF50 !important;
  color: black;
}

.status-cell.status-not-started {
  background-color: #add8e6 !important;
  color: black;
}

.status-cell.status-waited {
  background-color: rgba(150, 2, 150, 0.4) !important;
  color: black;
}

.privacy-cell.privacy-home {
  background-color: #4CAF50 !important;
}

.privacy-cell.privacy-work {
  background-color: #ff4444 !important;
  color: white;
}

.privacy-cell.privacy-other {
  background-color: #2196F3 !important;
  color: white;
}

.complexity-cell.complexity-high {
  background-color: #ff4444 !important;
  color: white;
}

.complexity-cell.complexity-medium {
  background-color: #4CAF50 !important;
}

.complexity-cell.complexity-low {
  background-color: #2196F3 !important;
  color: white;
}

.importance-cell.importance-high {
  background-color: #ff4444 !important;
  color: white;
}

.importance-cell.importance-medium {
  background-color: #4CAF50 !important;
}

.importance-cell.importance-low {
  background-color: #2196F3 !important;
  color: white;
}

.todo-table select:disabled {
  cursor: not-allowed;
}
/* Добавьте эти стили в секцию <style scoped> */
.todo-table td:first-child, /* Первый столбец (Задача) */
.todo-table td:nth-child(2), /* Второй столбец (Описание) */
.todo-table td:nth-child(3) { /* Третий столбец (Объект) */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 0; /* Это важно для правильной работы text-overflow */
}
/* Для ячеек в режиме редактирования */
.todo-table td:first-child .task-input,
.todo-table td:nth-child(2) .task-input,
.todo-table td:nth-child(3) .task-input {
  white-space: normal; /* Разрешаем перенос строк в input при редактировании */
}

.completed-task .privacy-cell select:disabled,
.completed-task .complexity-cell select:disabled,
.completed-task .importance-cell select:disabled {
  pointer-events: none;
}

.completed-task .importance-cell.importance-high select:disabled,
.completed-task .complexity-cell.complexity-high select:disabled {
  color: white !important;
}
</style>