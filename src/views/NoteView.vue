<template>
  <div v-if="account?.data?.session" class="container">
<!--    <div>
      LiNote - инструмент для создания заметок
    </div>-->
<!--
    <NewNote width="80%"/>
-->
  </div>
  <div v-else class="auth-message">
    Пожалуйста, войдите в систему
  </div>
</template>

<script>
import NewNote from "@/components/LiNote/NewNote.vue";
import { supabase } from '@/clients/supabase.js';
import { computed, onMounted, ref, onUnmounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: "NoteView", // Изменил имя компонента, так как NoteView - это дочерний компонент
  components: {NewNote},
  setup() {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const account = ref(null);
    let authSubscription = null; // Храним подписку здесь


    // Функция для обработки изменений аутентификации
    const handleAuthChange = (event, session) => {
      console.log('Auth state changed:', event, session);
      account.value = { data: { session } };
    };

    async function getSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        account.value = { data };
        console.log('Current session:', data);
      } catch (error) {
        console.error('Ошибка при получении сессии:', error);
        account.value = null;
      }
    }

    onUnmounted(() => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    });

    onMounted(async () => {
      await getSession();

      // Подписываемся на изменения аутентификации
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
      authSubscription = subscription; // Сохраняем подписку
    });


    return {
      account,
    };
  }
};
</script>

<style scoped>
.auth-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 100px);
  font-size: 1.5rem;
  color: #666;
  margin-top: 50px;
}
.container {
  display: flex;
  height: calc(100vh - 107px);
  /*
  max-width: 1200px;
  */

  overflow: hidden;
  margin-top: 50px;
}
</style>