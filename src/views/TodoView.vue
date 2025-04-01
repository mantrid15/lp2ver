<template>
  <div v-if="account?.data?.session" class="container">
    <TodoList />
  </div>
  <div v-else class="auth-message">
    Пожалуйста, войдите в систему
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'; // Убрали computed
import TodoList from '@/components/ToDo/TodoComp.vue';
import { supabase } from '@/clients/supabase.js';
// import { useStore } from 'vuex'; // Если userId здесь не используется напрямую, можно убрать

export default {
  name: 'TodoView',
  components: {
    TodoList,
  },
  setup() {
    // const store = useStore();
    // const userId = computed(() => store.state.userId); // Если не используется, убрать
    const account = ref(null); // Для проверки авторизации
    // const tasks = ref([]); // Убрали tasks

    // Убрали fetchTasks, formatDateForDisplay, formatDateForInput

    async function getSession() {
      try {
        account.value = await supabase.auth.getSession();
        console.log('Current session:', account.value);
      } catch (error) {
        console.error('Ошибка при получении сессии:', error);
        account.value = null;
      }
    };

    onMounted(async () => {
      await getSession(); // Проверяем сессию при загрузке

      // Подписываемся на изменения состояния аутентификации
      supabase.auth.onAuthStateChange((event, session) => {
        // console.log('Auth state changed in TodoView:', event, session);
        // Просто обновляем информацию о сессии, чтобы v-if сработал
        account.value = { data: { session } };
        // fetchTasks(); // Убрали вызов fetchTasks
      });
    });

    return {
      account, // Передаем account для v-if в шаблоне
      // tasks, // Убрали tasks
    };
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 107px);
  overflow: hidden;
  margin-top: 15px;
  gap: 20px; /* Добавляем промежуток между компонентами */
}

.auth-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 100px);
  font-size: 1.5rem;
  color: #666;
  margin-top: 50px;
}
</style>