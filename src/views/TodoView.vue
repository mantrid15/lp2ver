<template>
  <div v-if="account?.data?.session" class="container">
<!--
    <NewTask @task-added="fetchTasks" />
-->
    <TodoList />
  </div>
  <div v-else class="auth-message">
    Пожалуйста, войдите в систему
  </div>
</template>

<script>
import {ref, computed, onMounted} from 'vue';
import TodoList from '@/components/ToDo/TodoComp.vue';
import {supabase} from '@/clients/supabase.js';
import {useStore} from 'vuex';
import NewTask from '@/components/ToDo/NewTask.vue';

export default {
  name: 'TodoView',

  components: {
    TodoList,
    NewTask
  },

  setup() {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const account = ref(null);

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
    };

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
      supabase.auth.onAuthStateChange((event, session) => {
        account.value = {data: {session}};
        console.log('Auth state changed:', event, session);
      });
    });

    return {
      account,
      fetchTasks
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