<template>
  <div v-if="account?.data?.session && userId" class="container">    <Sidebar
        :user-id="userId"
        :selected-id="selectedNoteId"
        @select="note => selectedNoteId = note.id"
    />
    <Note :note-id="selectedNoteId" />
  </div>
  <div v-else class="auth-message">
    Пожалуйста, войдите в систему
  </div>
</template>

<script>
/*
import NewNote from "@/components/LiNote/NewNote.vue";
*/
import Sidebar from "@/components/LiNote/Sidebar.vue";
import Note from "@/components/LiNote/Note.vue";
import { supabase } from '@/clients/supabase.js';
import { computed, onMounted, ref, onUnmounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: "NoteView", // Изменил имя компонента, так как NoteView - это дочерний компонент
  components: { Sidebar, Note},
  setup() {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const account = ref(null);
    const selectedNoteId = ref(null); // добавляем отслеживание выбранной заметки

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

    onMounted(async () => {
      await store.dispatch('restoreSession'); // ⬅️ ВОТ ЭТО ОБЯЗАТЕЛЬНО
      await getSession();
      console.log('NoteView: userId из Vuex =', userId.value);
      // Подписываемся на изменения аутентификации
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
      authSubscription = subscription; // Сохраняем подписку
      console.log('NoteView: userId =', userId.value);
    });

    onUnmounted(() => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    });




    return {
      account,
      userId,
      selectedNoteId, // возвращаем, чтобы Vue знал об этом в шаблоне
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
  border-left: 2px solid blue; /* добавим синюю границу слева (если надо) */
  overflow: hidden;
  margin-top: 50px;
}
</style>