<template>
  <div class="diaganzer-app">
    <header class="app-header">
      <h1>DiaGanZer</h1>
      <p class="app-subtitle">Система управления проектами и диаграмм Ганта</p>
    </header>

    <main class="app-main">
      <div class="horizontal-layout">
        <!-- Компонент задач -->
        <div class="layout-section tasks-section">
          <DTask />
        </div>

        <!-- Разделитель -->
        <div class="layout-divider"></div>

        <!-- Компонент подзадач -->
        <div class="layout-section subtasks-section">
          <DSub />
        </div>

        <!-- Разделитель -->
        <div class="layout-divider"></div>

        <!-- Компонент диаграммы Ганта -->
        <div class="layout-section gantt-section">
          <DGantt />
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <p>&copy; 2024 DiaGanZer - Управление проектами</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import DTask from '../components/DGantt/DTask.vue';
import DSub from '../components/DGantt/DSub.vue';
import DGantt from '../components/DGantt/DGantt.vue';
</script>

<style scoped>
.diaganzer-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
}

.app-header {
  text-align: center;
  padding: 20px;
  color: white;
  flex-shrink: 0;
}

.app-header h1 {
  font-size: 2.5rem;
  margin: 0;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: -1px;
}

.app-subtitle {
  font-size: 1rem;
  margin: 8px 0 0 0;
  opacity: 0.9;
  font-weight: 300;
}

.app-main {
  flex: 1;
  padding: 0 20px 20px;
  overflow: hidden;
}

.horizontal-layout {
  display: flex;
  height: 100%;
  min-height: calc(100vh - 200px);
  gap: 0;
}

.layout-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.layout-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.tasks-section {
  width: 20%;
  flex-shrink: 0;
}

.subtasks-section {
  width: 20%;
  flex-shrink: 0;
}

.gantt-section {
  flex: 1;
  min-width: 0; /* Позволяет flex элементу сжиматься */
}

.layout-divider {
  width: 5px;
  background-color: #dc3545;
  flex-shrink: 0;
  border-radius: 2px;
  margin: 10px 0;
}

.app-footer {
  text-align: center;
  padding: 15px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  flex-shrink: 0;
}

/* Анимации загрузки */
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

.tasks-section {
  animation: fadeInLeft 0.6s ease-out;
}

.subtasks-section {
  animation: fadeInUp 0.6s ease-out 0.1s both;
}

.gantt-section {
  animation: fadeInRight 0.6s ease-out 0.2s both;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 1024px) {
  .horizontal-layout {
    flex-direction: column;
    gap: 10px;
  }

  .layout-divider {
    width: 100%;
    height: 5px;
    margin: 0;
  }

  .tasks-section,
  .subtasks-section {
    width: 100%;
  }

  .gantt-section {
    flex: 1;
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .app-main {
    padding: 0 10px 10px;
  }

  .app-header {
    padding: 15px;
  }

  .app-header h1 {
    font-size: 2rem;
  }

  .app-subtitle {
    font-size: 0.9rem;
  }
}
</style>