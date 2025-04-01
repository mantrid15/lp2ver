<template>
  <div v-if="account?.data?.session" class="container">
    <TodoList :tasks="tasks" />
  </div>
  <div v-else class="auth-message">
    Пожалуйста, войдите в систему
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import TodoList from '@/components/ToDo/TodoComp.vue';
import { supabase } from '@/clients/supabase.js';
import { useStore } from 'vuex';

export default {
  name: 'TodoView',
  components: {
    TodoList,
  },
  setup() {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const account = ref(null);
    const tasks = ref([]);

    async function fetchTasks() {
      try {
        const {data, error} = await supabase
            .from('todolist')
            .select('*')
            .order('created_at', {ascending: true});

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
        console.error('Ошибка при загрузке задач:', error);
      }
    }

    function formatDateForDisplay(dateString) {
      if (!dateString) return '';
      if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        return dateString;
      }

      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }

    function formatDateForInput(dateString) {
      if (!dateString) return '';

      if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const [day, month, year] = dateString.split('.');
        return `${year}-${month}-${day}`;
      }

      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    }

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
      await getSession();
      await fetchTasks();
      supabase.auth.onAuthStateChange((event, session) => {
        account.value = { data: { session } };
        fetchTasks(); // Обновляем задачи при изменении состояния
        console.log('Auth state changed:', event, session);
      });
    });

    return {
      account,
      tasks,
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