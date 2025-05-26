<template>
  <div v-if="account?.data?.session" class="container">
    <Left :width="leftColumnWidth" />
    <div class="resizer" @mousedown="(e) => startResize(e, 1)"></div>
    <Gate
        :width="middleColumnWidth"
        :links="links"
        :favicons="favicons"
        :sort-key="sortKey"
        :sort-order="sortOrder"
        :selected-folder-hash="selectedFolderHash"
        @handle-url-click="handleUrlClick"
        @sort="sort"
        :draggedLink="draggedLink"
        @update-dragged-link="updateDraggedLink"
    />
    <div class="resizer" @mousedown="(e) => startResize(e, 2)"></div>
    <Right
        :width="rightColumnWidth"
        :draggedLink="draggedLink"
        :links="links"
        @folder-selected="handleFolderSelected"
        @reset-folder-selection="handleResetFolderSelection"
        @update-dragged-link="updateDraggedLink"
    />
  </div>
  <div v-else class="auth-message">
    Пожалуйста, войдите в систему
  </div>
</template>
<script>
import {ref, computed, onMounted, onUnmounted} from 'vue';
import { supabase } from '@/clients/supabase.js';
import Left from '@/components/Columns/Left.vue';
import Right from '@/components/Columns/Right.vue';
import Gate from '@/components/Columns/Gate.vue';
import { useStore } from 'vuex';


export default {
  name: 'LinzerTwo',
  components: {
    Left,
    Gate,
    Right
  },

  setup() {
    const store = useStore();
    const userId = computed(() => store.state.userId); // Получите userId из Vuex
    const account = ref(null);

    const selectedFolderHash = ref(null); // Состояние для хранения dir_hash выбранной папки
    const handleFolderSelected = (dirHash) => {
      selectedFolderHash.value = dirHash;

    };
    const handleResetFolderSelection = () => {
      selectedFolderHash.value = null; // Сбрасываем состояние выбранной папки

    };
    // Управление сессией
    const draggedLink = ref(null); // Объявляем draggedLink
    const favicons = ref([]); // Реактивная переменная для хранения данных из favicons
    // Data and sorting
    const links = ref([]);

    const sortKey = ref('date');
    const sortOrder = ref('asc');
    async function getSession() {
      try {
        account.value = await supabase.auth.getSession();
        console.log('Current session:', account.value);
      } catch (error) {
        console.error('Ошибка при получении сессии:', error);
        account.value = null; // Убедитесь, что account сбрасывается в случае ошибки
      }
    }

    // Column widths с localStorage
    const leftColumnWidth = ref(localStorage.getItem('leftColumnWidth') || '30%');
    const middleColumnWidth = ref(localStorage.getItem('middleColumnWidth') || '40%');
    const rightColumnWidth = ref(localStorage.getItem('rightColumnWidth') || '30%');
    // Resize state
    const isResizing = ref(false);
    let initialMouseX = 0;
    let containerWidth = 0;
    let currentColumn = 0;
    let ctrlPressed = false;
    // Column width constraints
    const MIN_SIDE_COLUMN_WIDTH = 10;
    const MAX_SIDE_COLUMN_WIDTH = 30;
    const MIN_MIDDLE_COLUMN_WIDTH = 40;
    const MAX_MIDDLE_COLUMN_WIDTH = 80;
    let realtimeChannel;
    // Methods
    const fetchLinks = async () => {
      try {
        const { data, error } = await supabase
            .from("links")
            .select("id, date, url, title, description, keywords, favicon_name, favicon_hash, url_hash, dir_hash, parent_hash");
        if (error) {
          console.error("Error fetching links:", error);
        } else {
          links.value = data || []; // Убедитесь, что links всегда инициализируется
          console.log("Fetched links:", links.value);
        }
      } catch (err) {
        console.error("Unexpected error in fetchLinks:", err);
      }
    };

    const fetchFavicons = async () => {
      try {
        const { data, error } = await supabase
          .from('favicons')
          .select('favicon_hash, fav_url, storage_path');
        if (error) {
          console.error('Error fetching favicons:', error);
        } else {
          return data || [];
        }
      } catch (err) {
        console.error('Unexpected error in fetchFavicons:', err);
        return [];
      }
    };

    const getFaviconUrl = (faviconHash) => {
      const favicon = favicons.value.find((f) => f.favicon_hash === faviconHash);
      return favicon ? favicon.fav_url : '/lpicon.png';
    };

    const sort = (key) => {
      if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey.value = key;
        sortOrder.value = 'asc';
      }
    };

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

        if (newRightWidth >= MIN_SIDE_COLUMN_WIDTH && newRightWidth <= MAX_SIDE_COLUMN_WIDTH) {
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

    const handleUrlClick = (event, key) => {
      if (key === 'url') {
        logout();
      } else {
        sort(key);
      }
    };

    const logout = () => {
      localStorage.removeItem('leftColumnWidth');
      localStorage.removeItem('middleColumnWidth');
      localStorage.removeItem('rightColumnWidth');

      leftColumnWidth.value = '30%';
      middleColumnWidth.value = '40%';
      rightColumnWidth.value = '30%';
    };
    // Обновление draggedLink
    const updateDraggedLink = (link) => {
      draggedLink.value = link;
    };
    // Realtime subscription
    const subscribeToRealtimeChanges = () => {
      realtimeChannel = supabase
        .channel('realtime-links')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'links' },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              links.value.push(payload.new);
            } else if (payload.eventType === 'UPDATE') {
              const index = links.value.findIndex((link) => link.id === payload.new.id);
              if (index !== -1) {
                links.value[index] = payload.new;
              }
            } else if (payload.eventType === 'DELETE') {
              links.value = links.value.filter((link) => link.id !== payload.old.id);
            }
            // Обновляем данные из favicons при изменении links
            favicons.value = await fetchFavicons();
          }
        )
          .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'favicons' },
              (payload) => {
                if (payload.eventType === 'INSERT') {
                  if (payload.new.user_id === userId.value) {
                    favicons.value.push(payload.new);
                  }
                } else if (payload.eventType === 'UPDATE') {
                  const index = favicons.value.findIndex(favicons => favicons.id === payload.new.id);
                  if (index !== -1) {
                    favicons.value[index] = payload.new;
                  }
                } else if (payload.eventType === 'DELETE') {
                  favicons.value = favicons.value.filter(favicons => favicons.id !== payload.old.id);
                }
              }
          )
        .subscribe();
    };

    const unsubscribeFromRealtimeChanges = () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
    // Keyboard event handlers
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
    // Lifecycle hooks
    onMounted(async () => {
      await getSession();
      // console.log('Account after session fetch:', account.value);
      // Подписка на изменения авторизации
      supabase.auth.onAuthStateChange((event, session) => {
        account.value = { data: { session } };
        console.log('Auth state changed:', event, session);
      });

      await fetchLinks();
      favicons.value = await fetchFavicons(); // Загружаем данные из favicons
      subscribeToRealtimeChanges();
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
    });

    onUnmounted(() => {
      unsubscribeFromRealtimeChanges();
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    });

    return {
      selectedFolderHash,
      handleFolderSelected,
      handleResetFolderSelection,
      account,
      leftColumnWidth,
      middleColumnWidth,
      rightColumnWidth,
      links,
      favicons,
      sortKey,
      sortOrder,
      startResize,
      handleUrlClick,
      sort,
      draggedLink,
      updateDraggedLink,
      getFaviconUrl,
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

.resizer {
  cursor: ew-resize;
  width: 10px;
  background: red;
  z-index: 3;
  position: relative; /* Добавьте позиционирование */
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