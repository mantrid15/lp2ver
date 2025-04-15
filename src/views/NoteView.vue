<template>
  <div v-if="account?.data?.session && userId" class="container">
    <Sidebar
        :user-id="userId"
        :selected-id="selectedNoteId"
        @select="note => selectedNoteId = note.id"
        :style="{ width: sidebarWidth + 'px' }"
    />
    <div
      class="resizer"
      @mousedown="startResize"
      :style="{ left: sidebarWidth + 'px' }"
    ></div>
    <Note
      :note-id="selectedNoteId"
      :style="{ marginLeft: sidebarWidth + 5 + 'px' }"
    />
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
import { computed, onMounted, ref, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';

export default {
  name: "NoteView",
  components: { Sidebar, Note },
  setup() {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const account = ref(null);
    const selectedNoteId = ref(null);

    // Получаем сохраненную ширину для текущего пользователя или устанавливаем по умолчанию
    const getInitialWidth = () => {
      if (!userId.value) return Math.min(300, Math.max(100, window.innerWidth * 0.25));

      const savedWidth = localStorage.getItem(`sidebarWidth_${userId.value}`);
      return savedWidth
        ? parseInt(savedWidth, 10)
        : Math.min(300, Math.max(100, window.innerWidth * 0.25));
    };

    const sidebarWidth = ref(getInitialWidth());
    const isResizing = ref(false);

    // Сохраняем ширину при изменении
    watch([sidebarWidth, userId], ([newWidth, newUserId]) => {
      if (newUserId) {
        localStorage.setItem(`sidebarWidth_${newUserId}`, newWidth.toString());
      }
    });

    const startResize = (e) => {
      if (!e.ctrlKey) return; // Разрешаем ресайз только при нажатом Ctrl
      e.preventDefault();
      isResizing.value = true;
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const handleResize = (e) => {
      if (!isResizing.value) return;

      const container = document.querySelector('.container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const minWidth = window.innerWidth * 0.1;
      const maxWidth = window.innerWidth * 0.3;

      sidebarWidth.value = Math.min(maxWidth, Math.max(minWidth, newWidth));
    };

    const stopResize = () => {
      isResizing.value = false;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    let authSubscription = null;

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

      // Загружаем сохраненную ширину после аутентификации
      if (userId.value) {
        const savedWidth = localStorage.getItem(`sidebarWidth_${userId.value}`);
        if (savedWidth) {
          sidebarWidth.value = parseInt(savedWidth, 10);
        }
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
      authSubscription = subscription;

      // Обработчик изменения размера окна
      const handleWindowResize = () => {
        const minWidth = window.innerWidth * 0.1;
        const maxWidth = window.innerWidth * 0.3;
        sidebarWidth.value = Math.min(maxWidth, Math.max(minWidth, sidebarWidth.value));
      };

      window.addEventListener('resize', handleWindowResize);

      onUnmounted(() => {
        if (authSubscription) {
          authSubscription.unsubscribe();
        }
        window.removeEventListener('resize', handleWindowResize);
      });
    });

    onUnmounted(() => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    });

    return {
      account,
      userId,
      selectedNoteId,
      sidebarWidth,
      startResize
    };
  }
};
</script>

<style scoped>
/* Стили остаются без изменений */
.auth-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 100px);
  font-size: 1.5rem;
  color: #666;
  margin-top: 45px;
}

.container {
  display: flex;
  position: relative;
  height: calc(100vh - 107px);
  /*
  border-left: 2px solid blue; !* добавим синюю границу слева (если надо) *!
  */
  overflow: hidden;
  margin-top: 45px;
}

.resizer {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 5px;
  background-color: blue;
  cursor: col-resize;
  z-index: 10;
}

.resizer:hover {
  background-color: darkblue;
}
</style>