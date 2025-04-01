<template>
  <div class="todo-container">
    <table class="todo-table">
      <thead>
      <tr class="table-header">
        <th style="width: 15%;">
          <div style="display: flex; align-items: center;">
            <input
                type="checkbox"
                v-model="showDeletedTasks"
                @change="handleShowDeletedChange"
                style="margin-right: 8px;"
            >
            {{ taskTitleText }}
          </div>
        </th>
        <th style="width: 30%;">{{ descriptionText }}</th>
        <th style="width: 10%;">{{ objectText }}</th>
        <th style="width: 6%;">{{ privacy }}</th>
        <th style="width: 6%;">{{ complexity }}</th>
        <th style="width: 6%;">{{ statusText }}</th>
        <th style="width: 6%;">{{ importanceTagText }}</th>
        <th style="width: 6%;">{{ creationDateText }}</th>
        <th style="width: 6%;">{{ completionDateText }}</th>
        <th style="width: 6%;">{{ deleteText }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="task in displayedTasks"
          :key="task.id"
          :data-deleted="task.deleted"
          :class="{
            'completed-task': task.status === completedStatus,
            'status-completed': task.status === completedStatus,
            'status-in-progress': task.status === inProgressStatus,
            'status-not-started': task.status === notStartedStatus
          }">
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
        <td @dblclick="!isTaskCompleted(task) && startEditing(task, 'object')">
          <input
              v-if="task.editing && task.editingField === 'object'"
              v-model="task.object"
              @keyup.enter="finishEditing(task)"
              @blur="finishEditing(task)"
              v-focus
              class="task-input"
              :disabled="isTaskCompleted(task)"
          />
          <span v-else>{{ task.object }}</span>
        </td>
        <td class="privacy-cell" :class="privacyClass(task.privacy)">
          <select v-model="task.privacy" @change="updateTask(task)" :disabled="isTaskCompleted(task)">
            <option :value="homePrivacy">{{ homePrivacyText }}</option>
            <option :value="workPrivacy">{{ workPrivacyText }}</option>
            <option :value="otherPrivacy">{{ otherPrivacyText }}</option>
          </select>
        </td>
        <td class="complexity-cell" :class="complexityClass(task.complexity)">
          <select v-model="task.complexity" @change="updateTask(task)" :disabled="isTaskCompleted(task)">
            <option :value="highComplexity">{{ highComplexityText }}</option>
            <option :value="mediumComplexity">{{ mediumComplexityText }}</option>
            <option :value="lowComplexity">{{ lowComplexityText }}</option>
          </select>
        </td>
        <td class="status-cell" :class="statusClass(task.status)">
          <select v-model="task.status" @change="updateTask(task)">
            <option :value="notStartedStatus">{{ notStartedText }}</option>
            <option :value="completedStatus">{{ completedText }}</option>
            <option :value="inProgressStatus">{{ inProgressText }}</option>
            <option :value="waitedStatus">{{ waitedText }}</option>
          </select>
        </td>
        <td class="importance-cell" :class="importanceClass(task.importance_tag)">
          <select v-model="task.importance_tag" @change="updateTask(task)" :disabled="isTaskCompleted(task)">
            <option :value="highImportance">{{ highImportanceText }}</option>
            <option :value="mediumImportance">{{ mediumImportanceText }}</option>
            <option :value="lowImportance">{{ lowImportanceText }}</option>
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { supabase } from '@/clients/supabase.js';
import NewTask from './NewTask.vue';

export default {
  name: 'TodoComp',

  components: {
    NewTask
  },
  props: {
    tasks: {
      type: Array,
      required: true
    }
  },

  setup(props) {
    // Текстовые константы
    const taskTitleText = 'Задача';
    const descriptionText = 'Описание';
    const privacy = 'Приватность'
    const complexity = 'Сложность'
    const objectText = 'Объект';
    const statusText = 'Статус';
    const importanceTagText = 'Тег важности';
    const creationDateText = 'Дата создания';
    const completionDateText = 'Дата выполнения';
    const deleteText = 'Удалить';
    const deleteButtonText = 'Удалить';

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

    // Сообщения об ошибках
    const errorMessages = {
      loadTasks: 'Ошибка при загрузке задач:',
      updateTask: 'Ошибка при обновлении задачи:',
      updateDate: 'Ошибка при обновлении даты выполнения:',
      deleteTask: 'Ошибка при пометке задачи как удаленной:',
      dateValidation: 'Дата выполнения не может быть раньше даты создания'
    };
    // Добавляем новую текстовую константу
    const restoreButtonText = 'Восстановить';
    const permanentDeleteButtonText = 'Удалить окончательно';

    const tasks = ref([]);
    const subscription = ref(null);
    const showDeletedTasks = ref(false);

    const importanceClass = (importance) => {
      return {
        'importance-high': importance === highImportance,
        'importance-medium': importance === mediumImportance,
        'importance-low': importance === lowImportance
      };
    };
    // Функция для определения класса статуса
    const statusClass = (status) => {
      return {
        'status-completed': status === completedStatus,
        'status-in-progress': status === inProgressStatus,
        'status-not-started': status === notStartedStatus,
        'status-waited': status === waitedStatus
      };
    };

    const privacyClass = (privacy) => {
      return {
        'privacy-home': privacy === homePrivacy,
        'privacy-work': privacy === workPrivacy,
        'privacy-other': privacy === otherPrivacy
      };
    };

    const complexityClass = (complexity) => {
      return {
        'complexity-high': complexity === highComplexity,
        'complexity-medium': complexity === mediumComplexity,
        'complexity-low': complexity === lowComplexity
      };
    };

    // Реактивное свойство для отображаемых задач
    const displayedTasks = computed(() => {
      return showDeletedTasks.value
          ? props.tasks
          : props.tasks.filter(task => !task.deleted);
    });

    // Загрузка всех задач без фильтрации
    const fetchAllTasks = async () => {
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
        console.error(errorMessages.loadTasks, error);
      }
    };

    // Проверка статуса задачи
    const isTaskCompleted = (task) => {
      return task.status === completedStatus;
    };

    // Редактирование задачи
    const startEditing = (task, field) => {
      if (isTaskCompleted(task)) return;
      task.editing = true;
      task.editingField = field;
      task.originalValue = task[field];
    };

    const finishEditing = (task) => {
      if (task.editing) {
        task.editing = false;
        task.editingField = null;
        updateTask(task);
      }
    };

    // Обновление задачи
    const updateTask = async (task) => {
      try {
        const taskToUpdate = {
          title: task.title,
          description: task.description,
          importance_tag: task.importance_tag,
          status: task.status,
          object: task.object,
          privacy: task.privacy,
          complexity: task.complexity
        };

        const { error } = await supabase
          .from('todolist')
          .update(taskToUpdate)
          .match({ id: task.id });

        if (error) throw error;
      } catch (error) {
        console.error(errorMessages.updateTask, error);
        if (task.editingField && task.originalValue) {
          task[task.editingField] = task.originalValue;
        }
      }
    };

    // Обновление даты выполнения
    const updateDueDate = async (task) => {
      try {
        if (!task.due_date_edit || isTaskCompleted(task)) return;

        const createdDate = new Date(task.created_at);
        const dueDate = new Date(task.due_date_edit);

        if (dueDate < createdDate) {
          alert(errorMessages.dateValidation);
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
        console.error(errorMessages.updateDate, error);
      }
    };

    // Восстановление задачи
    const restoreTask = async (id) => {
      try {
        const { error } = await supabase
            .from('todolist')
            .update({ deleted: false })
            .match({ id });

        if (error) throw error;

        // Обновляем локальное состояние
        tasks.value = tasks.value.map(task =>
            task.id === id ? { ...task, deleted: false } : task
        );
      } catch (error) {
        console.error('Ошибка при восстановлении задачи:', error);
      }
    };
    // Добавляем новую функцию для полного удаления задачи
    const permanentlyDeleteTask = async (id) => {
      try {
        const { error } = await supabase
            .from('todolist')
            .delete()
            .match({ id });

        if (error) throw error;

        // Удаляем задачу из локального состояния
        tasks.value = tasks.value.filter(task => task.id !== id);
      } catch (error) {
        console.error('Ошибка при полном удалении задачи:', error);
      }
    };

    // Модифицируем функцию deleteTask (теперь только помечает как удаленную)
    const deleteTask = async (id) => {
      try {
        const { error } = await supabase
            .from('todolist')
            .update({ deleted: true })
            .match({ id });

        if (error) throw error;

        // Обновляем локальное состояние
        tasks.value = tasks.value.map(task =>
            task.id === id ? { ...task, deleted: true } : task
        );
      } catch (error) {
        console.error(errorMessages.deleteTask, error);
      }
    };


    // Форматирование дат
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    const formatDateForDisplay = (dateString) => {
      if (!dateString) return '';
      if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) return dateString;

      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const [day, month, year] = dateString.split('.');
        return `${year}-${month}-${day}`;
      }

      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    // Real-time подписка
    const setupRealtimeUpdates = () => {
      subscription.value = supabase
        .channel('todolist_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'todolist'
        }, () => {
          fetchAllTasks();
        })
        .subscribe();
    };

    const unsubscribeFromRealtimeChanges = () => {
      if (subscription.value) {
        supabase.removeChannel(subscription.value);
      }
    };

    // Хуки жизненного цикла
    onMounted(() => {
      fetchAllTasks();
      setupRealtimeUpdates();
    });

    onUnmounted(() => {
      unsubscribeFromRealtimeChanges();
    });

    return {
      tasks,
      showDeletedTasks,
      displayedTasks,
      isTaskCompleted,
      startEditing,
      finishEditing,
      updateTask,
      restoreTask,
      updateDueDate,
      deleteTask,
      formatDate,
      formatDateForDisplay,
      formatDateForInput,
      permanentlyDeleteTask,
      // Текстовые переменные
      taskTitleText,
      descriptionText,
      privacy,
      complexity,
      objectText,
      statusText,
      importanceClass,
      importanceTagText,
      creationDateText,
      completionDateText,
      deleteText,
      deleteButtonText,
      // Статусы
      completedStatus,
      inProgressStatus,
      notStartedStatus,
      waitedStatus,
      completedText,
      inProgressText,
      notStartedText,
      waitedText,
      statusClass,
      // Уровни важности
      highImportance,
      mediumImportance,
      lowImportance,
      highImportanceText,
      mediumImportanceText,
      lowImportanceText,
      // Приватность
      homePrivacy,
      workPrivacy,
      otherPrivacy,
      homePrivacyText,
      workPrivacyText,
      otherPrivacyText,
      privacyClass,
      // Сложность
      highComplexity,
      mediumComplexity,
      lowComplexity,
      highComplexityText,
      mediumComplexityText,
      lowComplexityText,
      complexityClass,
      // Восстановление/удаление
      restoreButtonText,
      permanentDeleteButtonText
    };
  }
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

.task-title {
  font-weight: bold;
  margin-left: 5px;
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
  border-collapse: collapse;
  width: 100%;
  margin: 0;
  table-layout: fixed;
}

.todo-table th {
  background-color: #4CAF50;
  font-weight: bold;
  /*
  padding: 4px;
  */
  text-align: center;
  border: 1px solid #000; /* Убираем задвоенные границы */
  font-size: 0.9em;
  height: 24px;
}

.todo-table td {
  /*
  border-collapse: collapse;
  */
  /*
  padding: 4px;
  */
  border: 1px solid #000; /* Убираем задвоенные границы */
  font-size: 0.9em;
  /*
  height: 23px; !* Установите фиксированную высоту для всех ячеек *!
  */
  height: 100%; /* Установите фиксированную высоту для всех ячеек */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-table tr:hover td {
  background-color: #e1cb07;
}

/* Стиль для удаленных задач */
.todo-table tr[data-deleted="true"] {
  background-color: #808080; /* Темно-серая заливка для удаленных задач */
}

/*
.todo-table tr[data-deleted="true"]:nth-child(even) {
  background-color: #a9a9a9; !* Светло-серая заливка для удаленных задач *!
}
*/

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
  box-sizing: border-box; /* Учитываем границы в высоте */
}

.delete-btn, .restore-btn, .permanent-delete-btn {
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