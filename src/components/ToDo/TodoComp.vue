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
            'deleted-task-row': task.deleted, // Стиль для удаленных (можно добавить в CSS)
            'completed-task': task.status === completedStatus && !task.deleted, // Только для не удаленных
            'status-completed': task.status === completedStatus,
            'status-in-progress': task.status === inProgressStatus,
            'status-not-started': task.status === notStartedStatus
          }">
        <td class="task-title" @dblclick="!isTaskCompleted(task) && !task.deleted && startEditing(task, 'title')">
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
          <td @dblclick="!isTaskCompleted(task) && !task.deleted && startEditing(task, 'description')">
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
          <td @dblclick="!isTaskCompleted(task) && !task.deleted && startEditing(task, 'object')">
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
         <td class="privacy-cell" :class="privacyClass(task.privacy)">
          <select v-model="task.privacy" @change="updateTask(task)" :disabled="isTaskCompleted(task) || task.deleted">
            <option :value="homePrivacy">{{ homePrivacyText }}</option>
            <option :value="workPrivacy">{{ workPrivacyText }}</option>
            <option :value="otherPrivacy">{{ otherPrivacyText }}</option>
          </select>
        </td>
        <td class="complexity-cell" :class="complexityClass(task.complexity)">
          <select v-model="task.complexity" @change="updateTask(task)" :disabled="isTaskCompleted(task) || task.deleted">
            <option :value="highComplexity">{{ highComplexityText }}</option>
            <option :value="mediumComplexity">{{ mediumComplexityText }}</option>
            <option :value="lowComplexity">{{ lowComplexityText }}</option>
          </select>
        </td>
        <td class="status-cell" :class="statusClass(task.status)">
          <select v-model="task.status" @change="updateTask(task)" :disabled="task.deleted && task.status === completedStatus">
            <option :value="notStartedStatus">{{ notStartedText }}</option>
            <option :value="completedStatus">{{ completedText }}</option>
            <option :value="inProgressStatus">{{ inProgressText }}</option>
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
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'; // Добавили nextTick
import { supabase } from '@/clients/supabase.js';

export default {
  name: 'TodoComp',

  setup() {
    // --- Текстовые константы ---
    const taskTitleText = 'Задача';
    const descriptionText = 'Описание';
    const privacy = 'Приватность';
    const complexity = 'Сложность';
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
      permanentlyDeleteTask: 'Ошибка при окончательном удалении задачи:',
      restoreTask: 'Ошибка при восстановлении задачи:',
      dateValidation: 'Дата выполнения не может быть раньше даты создания',
      fetchUser: 'Не удалось получить ID пользователя для загрузки задач.',
      updateUserMismatch: 'Попытка обновить задачу другого пользователя.'
    };

    const restoreButtonText = 'Восстановить';
    const permanentDeleteButtonText = 'Удалить окончательно';
    // --- Конец текстовых констант ---

    const tasks = ref([]); // Внутреннее состояние компонента
    const subscription = ref(null);
    const showDeletedTasks = ref(false); // Состояние для чекбокса
    const currentUserId = ref(null); // Для хранения ID текущего пользователя

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


    // Реактивное свойство для отображаемых задач (теперь зависит только от внутреннего tasks и showDeletedTasks)
    const displayedTasks = computed(() => {
      return showDeletedTasks.value
        ? tasks.value
        : tasks.value.filter(task => !task.deleted);
    });

    // ИЗМЕНЕНО: Загрузка задач ТОЛЬКО для текущего пользователя
    const fetchAllTasks = async () => {
      if (!currentUserId.value) {
        console.warn(errorMessages.fetchUser);
        tasks.value = []; // Очищаем список, если нет пользователя
        return;
      }
      try {
        const { data, error } = await supabase
          .from('todolist')
          .select('*')
          .eq('user_id', currentUserId.value) // Фильтруем по ID пользователя
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Обновляем внутреннюю переменную tasks
        tasks.value = (data || []).map(task => ({
          ...task,
          // due_date_edit хранит 'гггг-мм-дд' для input[type=date]
          due_date_edit: formatDateForInput(task.due_date) || '',
          // due_date оставляем как пришло из базы ('гггг-мм-дд' или null)
          // но можно и отформатировать для каких-то других нужд, если потребуется
          // due_date_display: formatDateForDisplay(task.due_date) || '', // Пример
          editing: false,
          editingField: null,
          originalValue: ''
        }));
      } catch (error) {
        console.error(errorMessages.loadTasks, error);
        tasks.value = []; // Очищаем при ошибке
      }
    };

    // --- Функции редактирования, обновления, удаления (добавлена проверка user_id) ---
     const isTaskCompleted = (task) => task.status === completedStatus;

     const startEditing = (task, field) => {
        if (isTaskCompleted(task) || task.deleted) return;
        // Закрываем редактирование других задач, если они есть
        tasks.value.forEach(t => { if (t.editing) finishEditing(t, false); }); // Не обновлять в базе при закрытии других
        task.originalValue = task[field];
        task.editing = true;
        task.editingField = field;
        // Фокусировка на инпуте после того, как Vue обновит DOM
        nextTick(() => {
            const inputElement = document.querySelector(`tr[data-task-id="${task.id}"] input.task-input`); // TODO: Добавить data-task-id к tr
             if (inputElement) {
                 inputElement.focus();
             }
        });
     };

     // Добавили параметр shouldUpdateDB
     const finishEditing = (task, shouldUpdateDB = true) => {
       if (task.editing) {
         task.editing = false;
         task.editingField = null;
         // Обновляем в базе только если нужно и значение изменилось
         if (shouldUpdateDB && task[task.editingField] !== task.originalValue) {
            updateTask(task);
         } else if (!shouldUpdateDB) {
             // Если отмена (blur без Enter), возвращаем оригинальное значение
             task[task.editingField] = task.originalValue;
         }
         task.originalValue = '';
       }
     };

    // ИЗМЕНЕНО: Добавлена проверка user_id перед обновлением
     const updateTask = async (task) => {
        if (task.user_id !== currentUserId.value) {
             console.error(errorMessages.updateUserMismatch, `Task ID: ${task.id}, Task User: ${task.user_id}, Current User: ${currentUserId.value}`);
             // Можно откатить изменение локально или показать ошибку
             fetchAllTasks(); // Перезагрузить данные как самый простой вариант отката
             return;
         }
       try {
         const taskToUpdate = { // Собираем только обновляемые поля
           title: task.title,
           description: task.description,
           object: task.object,
           privacy: task.privacy,
           complexity: task.complexity,
           status: task.status,
           importance_tag: task.importance_tag,
           // due_date обновляется отдельной функцией updateDueDate
         };

         const { error } = await supabase
           .from('todolist')
           .update(taskToUpdate)
           .match({ id: task.id, user_id: currentUserId.value }); // Обновляем только свою задачу

         if (error) throw error;
         // Данные обновятся через real-time, но можно и локально для скорости
         // console.log('Задача обновлена локально/realtime');

       } catch (error) {
         console.error(errorMessages.updateTask, error);
         // Попытка отката локальных изменений при ошибке
          fetchAllTasks();
         // if (task.editingField && task.originalValue) {
         //   task[task.editingField] = task.originalValue; // Это не сработает для селектов
         // }
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

         // Проверка, чтобы дата выполнения была не раньше даты создания
         if (dueDate < createdDate) {
           alert(errorMessages.dateValidation);
           // Нужно как-то откатить значение в инпуте, если он не v-model
           // Самый простой способ - перезапросить данные
            // TODO: Найти способ лучше откатить инпут без перезапроса
            // например, хранить предыдущее значение task.due_date_edit
           fetchAllTasks();
           return;
         }

         // Если валидация прошла, обновляем в базе
         updateDueDate(task, newDateValue_YYYYMMDD);
     };
     // Обновляет дату в базе данных
     const updateDueDate = async (task, newDate_YYYYMMDD) => {
        if (task.user_id !== currentUserId.value) {
             console.error(errorMessages.updateUserMismatch, `Task ID: ${task.id}`);
             fetchAllTasks();
             return;
         }
         try {
             const { error } = await supabase
             .from('todolist')
             .update({ due_date: newDate_YYYYMMDD || null }) // Отправляем 'гггг-мм-дд' или null
             .match({ id: task.id, user_id: currentUserId.value });

             if (error) throw error;

             // Обновляем локальное состояние (хотя real-time тоже сработает)
             task.due_date = newDate_YYYYMMDD; // Обновляем основное поле даты
             task.due_date_edit = newDate_YYYYMMDD; // Обновляем поле для инпута

         } catch (error) {
             console.error(errorMessages.updateDate, error);
             fetchAllTasks(); // Откат при ошибке
         }
     };

    // ИЗМЕНЕНО: Пометка на удаление
     const deleteTask = async (id) => {
        const task = tasks.value.find(t => t.id === id);
         if (!task || task.user_id !== currentUserId.value) {
             console.error("Попытка удалить чужую или несуществующую задачу.");
             return;
         }
       try {
         const { error } = await supabase
           .from('todolist')
           .update({ deleted: true }) // Помечаем как удаленную
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

         // Обновляем локальное состояние (real-time тоже сработает, удалив запись)
         tasks.value = tasks.value.filter(t => t.id !== id);

       } catch (error) {
         console.error(errorMessages.permanentlyDeleteTask, error);
       }
     };
    // --- Конец функций CRUD ---


    // --- Real-time подписка (без изменений, но теперь она - главный источник обновлений) ---
    const setupRealtimeUpdates = () => {
       // Убедимся, что нет старых подписок
       unsubscribeFromRealtimeChanges();
       console.log('Setting up realtime subscription...');
       try {
           subscription.value = supabase
             .channel('todolist_changes')
             .on('postgres_changes', {
               event: '*', // Слушаем все события (INSERT, UPDATE, DELETE)
               schema: 'public',
               table: 'todolist',
               // filter: `user_id=eq.${currentUserId.value}` // Фильтр на стороне Supabase!
             },
             (payload) => { // Получаем payload с информацией об изменении
               console.log('Realtime change received:', payload);
               // Просто перезагружаем все задачи пользователя
               // Это проще, чем обрабатывать каждый тип события (new, old)
               // Особенно с учетом фильтрации по deleted на клиенте
               fetchAllTasks();
             })
             .subscribe((status, err) => {
                 if (status === 'SUBSCRIBED') {
                     console.log('Realtime subscription active.');
                 }
                 if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                     console.error('Realtime subscription error:', status, err);
                     // Можно попробовать переподписаться через некоторое время
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
       console.log("TodoComp Unmounted.");
       unsubscribeFromRealtimeChanges(); // Отписываемся при размонтировании
        // Также отписываемся от onAuthStateChange, если нужно
        // (но обычно основной слушатель в App.vue достаточен)
     });
    // --- Конец хуков ---

    return {
      tasks, // Внутреннее состояние
      showDeletedTasks,
      displayedTasks, // Computed свойство для отображения
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
      // --- Текстовые переменные для шаблона ---
      taskTitleText, descriptionText, privacy, complexity, objectText, statusText,
      importanceTagText, creationDateText, completionDateText, deleteText, deleteButtonText,
      completedStatus, inProgressStatus, notStartedStatus, waitedStatus,
      completedText, inProgressText, notStartedText, waitedText,
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