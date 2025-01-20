<template>
  <div class="container">
    <div class="column column-1" :style="{ backgroundColor: 'green', width: leftColumnWidth }"></div>
    <div
        class="resizer"
        @mousedown="(e) => startResize(e, 1)"
    ></div>
    <div class="column column-2" :style="{ width: middleColumnWidth }">
      <table>
        <thead>
        <tr>
          <th>Date</th>
          <th @click="logout" style="cursor: pointer;">URL</th>
          <th>Title</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="link in sortedLinks" :key="link.id">
          <td>{{ formatDate(link.date) }}</td>
          <td class="truncate">
            <a :href="link.url" target="_blank" rel="noopener noreferrer">
              {{ getDomain(link.url) }}
            </a>
          </td>
          <td class="truncate">{{ link.title }}</td>
        </tr>
        </tbody>
      </table>
    </div>
    <div
        class="resizer"
        @mousedown="(e) => startResize(e, 2)"
    ></div>
    <div class="column column-3" :style="{ backgroundColor: 'blue', width: rightColumnWidth }"></div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { supabase } from "@/clients/supabase";

export default {
  setup() {
    const links = ref([]);
    const leftColumnWidth = ref(localStorage.getItem('leftColumnWidth') || '30%');
    const middleColumnWidth = ref(localStorage.getItem('middleColumnWidth') || '40%');
    const rightColumnWidth = ref(localStorage.getItem('rightColumnWidth') || '30%');
    let isResizing = ref(false);
    let initialMouseX = 0;
    let containerWidth = 0;
    let currentColumn = 0;
    let ctrlPressed = false;

    const MIN_SIDE_COLUMN_WIDTH = 10; // 10%
    const MAX_SIDE_COLUMN_WIDTH = 30; // 35%
    const MIN_MIDDLE_COLUMN_WIDTH = 40; // 40%
    const MAX_MIDDLE_COLUMN_WIDTH = 80; // 80%

    let realtimeChannel;

    const fetchLinks = async () => {
      try {
        const { data, error } = await supabase
            .from("links")
            .select("id, date, url, title");
        if (error) {
          console.error("Error fetching links:", error);
        } else {
          links.value = data;
          console.log("Fetched links:", links.value);
        }
      } catch (err) {
        console.error("Unexpected error in fetchLinks:", err);
      }
    };


    const subscribeToRealtimeChanges = () => {
      realtimeChannel = supabase
          .channel("realtime-links")
          .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "links" },
              (payload) => {
                console.log("Realtime payload received:", payload);
                if (payload.eventType === "INSERT") {
                  console.log("New row inserted:", payload.new);
                } else if (payload.eventType === "UPDATE") {
                  console.log("Row updated:", payload.new);
                } else if (payload.eventType === "DELETE") {
                  console.log("Row deleted:", payload.old);
                }
                fetchLinks(); // Обновляем таблицу
              }
          )
          .subscribe((status) => {
            console.log("Subscription status:", status);
          });
    };

    const unsubscribeFromRealtimeChanges = () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        console.log("Unsubscribed from realtime changes.");
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    };

    const getDomain = (url) => {
      const domain = url.replace(/^https?:\/\//, '').split('/')[0];
      const parts = domain.split('.');
      return parts.length > 2 ? `${parts[parts.length - 2]}.${parts[parts.length - 1]}` : domain;
    };

    // Вычисляемое свойство для сортировки ссылок по дате
    const sortedLinks = computed(() => {
      return [...links.value].sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    const startResize = (e, column) => {
      if (!ctrlPressed) {
        console.log('Ctrl key is not pressed. Resizing is disabled.');
        return; // Не начинаем изменение размера, если Ctrl не нажат
      }

      isResizing.value = true;
      initialMouseX = e.clientX;
      currentColumn = column;
      containerWidth = document.querySelector('.container').offsetWidth;

      console.log(`Start resizing column ${column}. Initial mouse X: ${initialMouseX}, Container width: ${containerWidth}`);

      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
    };

    const handleResize = (e) => {
      if (!isResizing.value) return;

      const delta = e.clientX - initialMouseX;
      const deltaPercent = (delta / containerWidth) * 100;

      if (currentColumn === 1) {
        let newLeftWidth = parseFloat(leftColumnWidth.value) + deltaPercent;
        let newMiddleWidth = parseFloat(middleColumnWidth.value);
        if (
            newLeftWidth >= MIN_SIDE_COLUMN_WIDTH &&
            newLeftWidth <= MAX_SIDE_COLUMN_WIDTH &&
            newMiddleWidth >= MIN_MIDDLE_COLUMN_WIDTH &&
            newMiddleWidth <= MAX_MIDDLE_COLUMN_WIDTH &&
            newLeftWidth + newMiddleWidth <= 100
        ) {
          leftColumnWidth.value = `${newLeftWidth}%`;
          middleColumnWidth.value = `${100 - newLeftWidth - parseFloat(rightColumnWidth.value)}%`;
          localStorage.setItem("leftColumnWidth", leftColumnWidth.value);
          localStorage.setItem("middleColumnWidth", middleColumnWidth.value);
        }
      } else if (currentColumn === 2) {
        let newMiddleWidth = parseFloat(middleColumnWidth.value) + deltaPercent;
        let newRightWidth = parseFloat(rightColumnWidth.value);
        if (
            newMiddleWidth >= MIN_MIDDLE_COLUMN_WIDTH &&
            newMiddleWidth <= MAX_MIDDLE_COLUMN_WIDTH &&
            newRightWidth >= MIN_SIDE_COLUMN_WIDTH &&
            newRightWidth <= MAX_SIDE_COLUMN_WIDTH &&
            newMiddleWidth + newRightWidth <= 100
        ) {
          middleColumnWidth.value = `${newMiddleWidth}%`;
          rightColumnWidth.value = `${100 - parseFloat(leftColumnWidth.value) - newMiddleWidth}%`;
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
      console.log('Stopped resizing.');
    };


    const logout = () => {
      localStorage.removeItem('leftColumnWidth');
      localStorage.removeItem('middleColumnWidth');
      localStorage.removeItem('rightColumnWidth');

      leftColumnWidth.value = '30%';
      middleColumnWidth.value = '40%';
      rightColumnWidth.value = '30%';

      console.log('Профиль по умолчанию');
    };

    onMounted(() => {
      fetchLinks();
      subscribeToRealtimeChanges();
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
    });

    onUnmounted(() => {
      unsubscribeFromRealtimeChanges();
      // document.removeEventListener("keydown", handleKeyDown);
      // document.removeEventListener("keyup", handleKeyUp);
    });

    // Обработчики событий для клавиши Ctrl
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        ctrlPressed = true;
        console.log('Ctrl key is pressed.');
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Control') {
        ctrlPressed = false;
        console.log('Ctrl key is released.');
      }
    };

    return {
      links,
      leftColumnWidth,
      middleColumnWidth,
      rightColumnWidth,
      sortedLinks,
      formatDate,
      getDomain,
      startResize,
      logout,
    };
  },
};
</script>

<style>
.container {
  display: flex;
  height: 100vh;
}

.column {
  overflow: auto;
}

.resizer {
  cursor: ew-resize;
  width: 10px;
  background: gray;
}

.truncate {
  max-width: 150px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
