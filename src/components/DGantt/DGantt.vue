<template>
  <div class="gantt-component">
    <div class="header">
      <h2>Диаграмма Ганта</h2>
      <div v-if="task" class="task-info">
        <span class="task-label">Задача:</span>
        <span class="task-name">{{ task.name }}</span>
        <span class="date-range">
          ({{ formatDate(task.start_date) }} - {{ formatDate(task.end_date) }})
        </span>
      </div>
    </div>

    <div v-if="!task" class="no-selection">
      <p>Выберите задачу для отображения диаграммы Ганта</p>
    </div>

    <div v-else-if="subTasks.length === 0" class="no-subtasks">
      <p>У выбранной задачи нет подзадач для отображения</p>
    </div>

    <div v-else class="gantt-chart">
      <div class="gantt-header">
        <div class="task-column">Подзадача</div>
        <div class="timeline-column">
          <div class="timeline-grid">
            <div
                v-for="date in timelineDates"
                :key="date.getTime()"
                class="timeline-date"
            >
              {{ formatDateShort(date) }}
            </div>
          </div>
        </div>
      </div>

      <div class="gantt-body">
        <div
            v-for="subTask in subTasks"
            :key="subTask.id"
            class="gantt-row"
        >
          <div class="task-info-cell">
            <div class="task-name">{{ subTask.name }}</div>
            <div class="task-progress">{{ subTask.progress }}% выполнено</div>
          </div>
          <div class="timeline-cell">
            <div class="timeline-grid">
              <div
                  class="gantt-bar"
                  :style="getBarStyle(subTask)"
                  :class="getBarClass(subTask.progress)"
              >
                <div class="bar-content">
                  <span class="start-date">{{ formatDateShort(new Date(subTask.start_date)) }}</span>
                  <span class="end-date">{{ formatDateShort(new Date(subTask.end_date)) }}</span>
                </div>
                <div
                    class="progress-overlay"
                    :style="{ width: subTask.progress + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { supabase } from '@/clients/supabase.js';

const props = defineProps({
  taskId: {
    type: [String, Number],
    default: null
  },
  userId: {
    type: [String, Number],
    required: true
  }
});

// Состояние компонента
const task = ref(null);
const subTasks = ref([]);
const loading = ref(false);
const error = ref(null);

// Получение данных задачи
const fetchTask = async () => {
  if (!props.taskId) {
    task.value = null;
    return;
  }

  try {
    loading.value = true;
    const { data, error: fetchError } = await supabase
        .from('gantt')
        .select('*')
        .eq('id', props.taskId)
        .eq('user_id', props.userId)
        .single();

    if (fetchError) throw fetchError;
    task.value = data;
  } catch (err) {
    error.value = err.message;
    console.error('Ошибка при получении задачи:', err);
  } finally {
    loading.value = false;
  }
};

// Получение подзадач
const fetchSubTasks = async () => {
  if (!props.taskId) {
    subTasks.value = [];
    return;
  }

  try {
    loading.value = true;
    const {data, error: fetchError} = await supabase
        .from('gantt')
        .select('*')
        .eq('parent_task', props.taskId)
        .eq('user_id', props.userId)
        .order('start_date');

    if (fetchError) throw fetchError;
    subTasks.value = data;
  } catch (err) {
    error.value = err.message;
    console.error('Ошибка при получении подзадач:', err);
  } finally {
    loading.value = false;
  }
};

// Вычисление временной шкалы
const timelineDates = computed(() => {
  if (!task.value) return [];

  const startDate = new Date(task.value.start_date);
  const endDate = new Date(task.value.end_date);
  const dates = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
});

// Вычисление общего количества дней
const totalDays = computed(() => timelineDates.value.length);

// Стиль для полосы Ганта
const getBarStyle = (subTask) => {
  if (!task.value) return {};

  const taskStart = new Date(task.value.start_date);
  const subStart = new Date(subTask.start_date);
  const subEnd = new Date(subTask.end_date);

  const startOffset = Math.floor((subStart - taskStart) / (1000 * 60 * 60 * 24));
  const duration = Math.floor((subEnd - subStart) / (1000 * 60 * 60 * 24)) + 1;

  return {
    left: `${(startOffset / totalDays.value) * 100}%`,
    width: `${(duration / totalDays.value) * 100}%`
  };
};

// Класс для полосы Ганта в зависимости от прогресса
const getBarClass = (progress) => {
  if (progress >= 80) return 'bar-high';
  if (progress >= 50) return 'bar-medium';
  if (progress >= 20) return 'bar-low';
  return 'bar-none';
};

// Форматирование дат
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

const formatDateShort = (date) => {
  return date.getDate();
};

// Отслеживание изменения taskId
watch(() => props.taskId, () => {
  fetchTask();
  fetchSubTasks();
}, {immediate: true});
</script>

<style scoped>
.gantt-component {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 10px;
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.95rem;
}

.task-label {
  color: #5f6368;
}

.task-name {
  color: #4285f4;
  font-weight: 500;
}

.date-range {
  color: #5f6368;
}

.no-selection,
.no-subtasks {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gantt-chart {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.gantt-header {
  display: flex;
  background-color: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
  font-weight: 500;
  color: #202124;
}

.task-column {
  width: 200px;
  padding: 12px 16px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
}

.timeline-column {
  flex: 1;
  overflow: hidden;
}

.timeline-grid {
  display: flex;
  height: 100%;
  min-width: 100%;
}

.timeline-date {
  flex: 1;
  min-width: 40px;
  padding: 12px 4px;
  text-align: center;
  font-size: 0.85rem;
  color: #5f6368;
  border-right: 1px solid #e0e0e0;
}

.timeline-date:last-child {
  border-right: none;
}

.gantt-body {
  flex: 1;
  overflow-y: auto;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid #f1f3f4;
  min-height: 60px;
}

.gantt-row:last-child {
  border-bottom: none;
}

.task-info-cell {
  width: 200px;
  padding: 12px 16px;
  border-right: 1px solid #f1f3f4;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.task-info-cell .task-name {
  font-weight: 500;
  color: #202124;
  margin-bottom: 4px;
}

.task-info-cell .task-progress {
  font-size: 0.8rem;
  color: #5f6368;
}

.timeline-cell {
  flex: 1;
  position: relative;
  padding: 8px 0;
}

.timeline-cell .timeline-grid {
  height: 100%;
  position: relative;
}

.timeline-cell .timeline-grid::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(
      to right,
      transparent,
      transparent calc(100% / var(--days) - 1px),
      #f1f3f4 calc(100% / var(--days) - 1px),
      #f1f3f4 calc(100% / var(--days))
  );
  pointer-events: none;
}

.gantt-bar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  color: white;
  font-size: 10px;
  font-weight: 500;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bar-content {
  display: flex;
  justify-content: space-between;
  width: 100%;
  z-index: 2;
}

.progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  z-index: 1;
}

.bar-high {
  background: linear-gradient(135deg, #34a853, #2d9248);
}

.bar-medium {
  background: linear-gradient(135deg, #fbbc05, #f29900);
}

.bar-low {
  background: linear-gradient(135deg, #f29900, #ea4335);
}

.bar-none {
  background: linear-gradient(135deg, #ea4335, #d93025);
}

.start-date,
.end-date {
  font-weight: 600;
}

@media (max-width: 1024px) {
  .task-column,
  .task-info-cell {
    width: 160px;
  }
}

@media (max-width: 768px) {
  .gantt-header {
    display: none;
  }

  .gantt-row {
    flex-direction: column;
    padding: 15px;
    border-bottom: 1px solid #e0e0e0;
  }

  .task-info-cell {
    width: 100%;
    border-right: none;
    padding: 0 0 10px 0;
  }

  .timeline-cell {
    padding: 0;
  }

  .gantt-bar {
    position: relative;
    transform: none;
    margin-top: 10px;
  }
}
</style>