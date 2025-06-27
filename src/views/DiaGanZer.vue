<template>
  <div v-if="isAuthenticated" class="container">
    <div class="tasks-section" :style="{ width: leftColumnWidth }">
      <DTask
          @task-selected="handleTaskSelected"
          :userId="userId"
      />
    </div>
    <div class="resizer" @mousedown="(e) => startResize(e, 1)"></div>

    <div class="subtasks-section" :style="{ width: middleColumnWidth }">
      <DSub
          :task-id="selectedTaskId"
          :userId="userId"
          v-if="selectedTaskId"
      />
      <div v-else class="no-task-selected">
        <p>Выберите задачу для просмотра подзадач</p>
      </div>
    </div>
    <div class="resizer" @mousedown="(e) => startResize(e, 2)"></div>

    <div class="gantt-section" :style="{ width: rightColumnWidth }">
      <DGantt
          :task-id="selectedTaskId"
          :userId="userId"
          v-if="selectedTaskId"
      />
      <div v-else class="no-task-selected">
        <p>Выберите задачу для отображения диаграммы Ганта</p>
      </div>

    </div>
    <button
        @click="testSupabaseConnection"
        class="test-connection-btn"
    >
      Test Supabase Connection
    </button>
    <!-- Кнопка для тестирования подключения (можно удалить после проверки) -->

  </div>

  <div v-else class="auth-message">
    <p>Пожалуйста, войдите в систему для доступа к диаграмме Ганта</p>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useStore } from 'vuex';
import { supabase } from '@/clients/supabase.js';
import DTask from '../components/DGantt/DTask.vue';
import DSub from '../components/DGantt/DSub.vue';
import DGantt from '../components/DGantt/DGantt.vue';

const isAuthenticated = ref(false);

const store = useStore();
const userId = computed(() => {
  console.log('DiaGanZer - userId:', store.state.userId);
  return store.state.userId;
});

const testSupabaseConnection = async () => {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase
        .from('gantt')
        .select('*');
        // .limit(1);

    if (error) throw error;
    console.log('Supabase test successful, data:', data);
  } catch (err) {
    console.error('Supabase test failed:', err);
  }
};
// Проверяем аутентификацию при загрузке компонента
onMounted(async () => {
  console.log('DiaGanZer - Checking authentication');
  const { data: { session } } = await supabase.auth.getSession();
  isAuthenticated.value = !!session;

  // Подписываемся на изменения состояния аутентификации
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('DiaGanZer - Auth state changed:', event, session);
    isAuthenticated.value = !!session;
  });

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
});

const selectedTaskId = ref(null);

const handleTaskSelected = (taskId) => {
  selectedTaskId.value = taskId;
};
// Column widths with localStorage
const leftColumnWidth = ref(localStorage.getItem('leftColumnWidth') || '20%');
const middleColumnWidth = ref(localStorage.getItem('middleColumnWidth') || '20%');
const rightColumnWidth = ref(localStorage.getItem('rightColumnWidth') || '60%');

// Resize state
const isResizing = ref(false);
let initialMouseX = 0;
let containerWidth = 0;
let currentColumn = 0;
let ctrlPressed = false;

// Column width constraints
const MIN_SIDE_COLUMN_WIDTH = 15;
const MAX_SIDE_COLUMN_WIDTH = 30;
const MIN_MIDDLE_COLUMN_WIDTH = 15;
const MAX_MIDDLE_COLUMN_WIDTH = 30;

const startResize = (e, column) => {
  if (!ctrlPressed) {
    console.log('Ctrl key is not pressed. Resizing is disabled.');
    return;
  }

  isResizing.value = true;
  initialMouseX = e.clientX;
  currentColumn = column;
  containerWidth = document.querySelector('.container').offsetWidth;

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
};

const handleResize = (e) => {
  if (!isResizing.value) return;

  const delta = e.clientX - initialMouseX;
  const deltaPercent = (delta / containerWidth) * 100;

  if (currentColumn === 1) {
    let newLeftWidth = parseFloat(leftColumnWidth.value) + deltaPercent;
    let newMiddleWidth = parseFloat(middleColumnWidth.value) - deltaPercent;

    newLeftWidth = Math.min(Math.max(newLeftWidth, MIN_SIDE_COLUMN_WIDTH), MAX_SIDE_COLUMN_WIDTH);
    newMiddleWidth = 100 - newLeftWidth - parseFloat(rightColumnWidth.value);

    if (newMiddleWidth >= MIN_MIDDLE_COLUMN_WIDTH && newMiddleWidth <= MAX_MIDDLE_COLUMN_WIDTH) {
      leftColumnWidth.value = `${newLeftWidth}%`;
      middleColumnWidth.value = `${newMiddleWidth}%`;
      localStorage.setItem("leftColumnWidth", leftColumnWidth.value);
      localStorage.setItem("middleColumnWidth", middleColumnWidth.value);
    }
  } else if (currentColumn === 2) {
    let newMiddleWidth = parseFloat(middleColumnWidth.value) + deltaPercent;
    let newRightWidth = parseFloat(rightColumnWidth.value) - deltaPercent;

    newMiddleWidth = Math.min(Math.max(newMiddleWidth, MIN_MIDDLE_COLUMN_WIDTH), MAX_MIDDLE_COLUMN_WIDTH);
    newRightWidth = 100 - parseFloat(leftColumnWidth.value) - newMiddleWidth;

    if (newRightWidth >= 40) { // Минимальная ширина для диаграммы Ганта
      middleColumnWidth.value = `${newMiddleWidth}%`;
      rightColumnWidth.value = `${newRightWidth}%`;
      localStorage.setItem("middleColumnWidth", middleColumnWidth.value);
      localStorage.setItem("rightColumnWidth", rightColumnWidth.value);
    }
  }
  initialMouseX = e.clientX;
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
};

const handleKeyDown = (e) => {
  if (e.ctrlKey) {
    ctrlPressed = true;
  }
};

const handleKeyUp = (e) => {
  if (e.key === 'Control') {
    ctrlPressed = false;
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("keyup", handleKeyUp);
});
</script>

<style scoped>

.no-task-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
  font-size: 1.1em;
}

.auth-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: #d32f2f;
  font-size: 1.2em;
}

.test-connection-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 8px 16px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;
}

.test-connection-btn:hover {
  background-color: #1565c0;
}
/* Оставьте стили без изменений */
.container {
  display: flex;
  height: calc(100vh - 120px);
  overflow: hidden;
  margin-top: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.resizer {
  cursor: ew-resize;
  width: 5px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 3;
  transition: background 0.2s ease;
}

.resizer:hover {
  background: rgba(255, 255, 255, 0.5);
}

.tasks-section,
.subtasks-section,
.gantt-section {
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tasks-section:hover,
.subtasks-section:hover,
.gantt-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.tasks-section {
  animation: fadeInLeft 0.6s ease-out;
}

.subtasks-section {
  animation: fadeInUp 0.6s ease-out 0.1s both;
}

.gantt-section {
  animation: fadeInRight 0.6s ease-out 0.2s both;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность для мобильных устройств */
@media (max-width: 1024px) {
  .container {
    flex-direction: column;
    height: auto;
    margin-top: 20px;
  }

  .resizer {
    width: 100%;
    height: 5px;
    margin: 5px 0;
  }

  .tasks-section,
  .subtasks-section,
  .gantt-section {
    width: 100% !important;
    height: auto;
    min-height: 300px;
    margin-bottom: 10px;
  }
}

@media (max-width: 768px) {
  .container {
    margin-top: 15px;
  }
}
</style>