<template>
  <div class="gantt-component">
    <div class="header">
      <h2>Диаграмма Ганта</h2>
      <div v-if="selectedTask" class="task-info">
        <span class="task-label">Задача:</span>
        <span class="task-name">{{ selectedTask.name }}</span>
        <span class="date-range">
          ({{ formatDate(selectedTask.startDate) }} - {{ formatDate(selectedTask.endDate) }})
        </span>
      </div>
    </div>

    <div v-if="!selectedTask" class="no-selection">
      <p>Выберите задачу для отображения диаграммы Ганта</p>
    </div>

    <div v-else-if="selectedSubTasks.length === 0" class="no-subtasks">
      <p>У выбранной задачи нет подзадач для отображения</p>
    </div>

    <div v-else class="gantt-chart">
      <div class="gantt-header">
        <div class="task-column">Подзадачи</div>
        <div class="timeline-column">
          <div class="timeline-grid">
            <div
                v-for="date in timelineDates"
                :key="date.toString()"
                class="timeline-date"
            >
              {{ formatDateShort(date) }}
            </div>
          </div>
        </div>
      </div>

      <div class="gantt-body">
        <div
            v-for="subTask in selectedSubTasks"
            :key="subTask.id"
            class="gantt-row"
        >
          <div class="task-info-cell">
            <div class="task-name">{{ subTask.name }}</div>
            <div class="task-progress">{{ subTask.progress }}%</div>
          </div>
          <div class="timeline-cell">
            <div class="timeline-grid">
              <div
                  class="gantt-bar"
                  :style="getBarStyle(subTask)"
                  :class="getBarClass(subTask.progress)"
              >
                <div class="bar-content">
                  <span class="start-date">{{ formatDateShort(new Date(subTask.startDate)) }}</span>
                  <span class="end-date">{{ formatDateShort(new Date(subTask.endDate)) }}</span>
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

<script setup lang="ts">
import { computed } from 'vue';
import { useTaskStore } from '../../composables/useTaskStore';
import type { SubTask } from '../../types';

const { selectedTask, selectedSubTasks } = useTaskStore();

// Вычисляем временной диапазон для диаграммы
const timelineDates = computed(() => {
  if (!selectedTask.value) return [];

  const startDate = new Date(selectedTask.value.startDate);
  const endDate = new Date(selectedTask.value.endDate);
  const dates = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
});

const totalDays = computed(() => timelineDates.value.length);

const getBarStyle = (subTask: SubTask) => {
  if (!selectedTask.value) return {};

  const taskStart = new Date(selectedTask.value.startDate);
  const subStart = new Date(subTask.startDate);
  const subEnd = new Date(subTask.endDate);

  const startOffset = Math.floor((subStart.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
  const duration = Math.floor((subEnd.getTime() - subStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const leftPercent = (startOffset / totalDays.value) * 100;
  const widthPercent = (duration / totalDays.value) * 100;

  return {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`
  };
};

const getBarClass = (progress: number) => {
  if (progress >= 80) return 'bar-high';
  if (progress >= 50) return 'bar-medium';
  if (progress >= 20) return 'bar-low';
  return 'bar-none';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

const formatDateShort = (date: Date) => {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};
</script>

<style scoped>
:root {
  --days: 7; /* Пример значения */
}

.gantt-component {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-label {
  color: #6c757d;
  font-weight: 500;
}

.task-name {
  color: #007bff;
  font-weight: 600;
}

.date-range {
  color: #6c757d;
  font-size: 14px;
}

.no-selection, .no-subtasks {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.gantt-chart {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  overflow: hidden;
}

.gantt-header {
  display: flex;
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.task-column {
  width: 250px;
  padding: 12px;
  font-weight: 600;
  color: #495057;
  border-right: 1px solid #dee2e6;
  display: flex;
  align-items: center;
}

.timeline-column {
  flex: 1;
  position: relative;
}

.timeline-grid {
  display: flex;
  height: 100%;
  position: relative;
}

.timeline-date {
  flex: 1;
  padding: 8px 4px;
  text-align: center;
  font-size: 12px;
  color: #6c757d;
  border-right: 1px solid #e9ecef;
  min-width: 40px;
}

.timeline-date:last-child {
  border-right: none;
}

.gantt-body {
  max-height: 500px;
  overflow-y: auto;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid #e9ecef;
  min-height: 60px;
}

.gantt-row:last-child {
  border-bottom: none;
}

.task-info-cell {
  width: 250px;
  padding: 12px;
  border-right: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.task-info-cell .task-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.task-info-cell .task-progress {
  font-size: 12px;
  color: #6c757d;
}

.timeline-cell {
  flex: 1;
  position: relative;
  padding: 8px 0;
}

.timeline-cell .timeline-grid {
  height: 100%;
  border: none;
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
      #e9ecef calc(100% / var(--days) - 1px),
      #e9ecef calc(100% / var(--days))
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
  cursor: pointer;
  transition: all 0.2s;
}

.gantt-bar:hover {
  transform: translateY(-50%) scale(1.02);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.bar-content {
  display: flex;
  justify-content: space-between;
  width: 100%;
  z-index: 2;
  position: relative;
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
  background: linear-gradient(135deg, #28a745, #20c997);
}

.bar-medium {
  background: linear-gradient(135deg, #ffc107, #fd7e14);
}

.bar-low {
  background: linear-gradient(135deg, #fd7e14, #dc3545);
}

.bar-none {
  background: linear-gradient(135deg, #dc3545, #c82333);
}

.start-date, .end-date {
  font-weight: 600;
}

@media (max-width: 768px) {
  .task-column, .task-info-cell {
    width: 200px;
  }

  .timeline-date {
    min-width: 30px;
    font-size: 10px;
  }

  .gantt-bar {
    font-size: 9px;
    padding: 0 4px;
  }
}
</style>