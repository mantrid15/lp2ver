<template>
  <div v-if="account?.data?.session" class="container">
    <TodoList />
  </div>
  <div v-else class="auth-message">
    Пожалуйста, войдите в систему
  </div>
</template>
<script>
import {ref, computed, onMounted} from 'vue';
import TodoList from '@/components/ToDo/TodoComp.vue';
import { supabase } from '@/clients/supabase.js';
import { useStore } from 'vuex';


export default {
  name: 'TodoView',

  components: {
    TodoList
  },

  setup() {
    const store = useStore();
    const userId = computed(() => store.state.userId); // Получите userId из Vuex
    const account = ref(null);

    async function getSession() {
      try {
        account.value = await supabase.auth.getSession();
        console.log('Current session:', account.value);
      } catch (error) {
        console.error('Ошибка при получении сессии:', error);
        account.value = null; // Убедитесь, что account сбрасывается в случае ошибки
      }
    };
    onMounted(async () => {
      await getSession();
      // Подписка на изменения авторизации
      supabase.auth.onAuthStateChange((event, session) => {
        account.value = { data: { session } };
        console.log('Auth state changed:', event, session);
      });

    });

    return {
      account,
    };
  }
};
</script>
<style scoped>
.container {
  display: flex;
  height: calc(100vh - 107px); /* Уменьшаем высоту на 100 пикселей (50px для футера и 50px для других элементов) */
  overflow: hidden;
  margin-top: 45px; /* Добавляем отступ сверху */
}
.auth-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 100px); /* Уменьшаем высоту на 100 пикселей */
  font-size: 1.5rem;
  color: #666;
  margin-top: 50px; /* Добавляем отступ сверху */
}
</style>