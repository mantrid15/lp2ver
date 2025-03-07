<template>
  <div class="column column-2" :style="{ width }">
    <div class="table-container">
      <table>
        <thead>
        <tr>
          <th>
            <span class="row-count-button">{{ rowCount.toString().padStart(3, '0') }}</span>
            <!--
                        <span class="header-label">{{ FAVORITE_ICON }}</span>
            -->
          </th>
          <th style="width: 15ch;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
    <span class="header-label-container" @click="(e) => handleClick(e, 'url')" style="cursor: pointer; text-align: left;">
      <span class="header-label">{{ URL_LABEL }}</span>
      <span class="sort-icon">{{ getSortIcon('url') || SORT_DEFAULT_ICON }}</span>
    </span>
              <!-- Чекбокс с правым отступом 3 пикселя -->
              <input type="checkbox" v-model="showAllDirs" style="margin-right: 5px;" />
            </div>
          </th>

          <th>
            <div style="display: flex; align-items: center;">
              <span class="header-label-container" @click="(e) => handleClick(e, 'title')" data-sort-key="title" style="cursor: pointer;">
                <span class="header-label">{{ TITLE_LABEL }}</span>
                <span class="sort-icon">{{ getSortIcon('title') || SORT_DEFAULT_ICON }}</span>
              </span>
              <!-- Модуль фильтрации -->
              <div style="position: relative; width: 100px; left: 0; top: 0;">
                <input
                    v-model="filter"
                    placeholder="Фильтр"
                    maxlength="8"
                    class="filter-input"
                    :class="{ 'thick-cursor': isFocused }"
                    @focus="isFocused = true"
                    @blur="isFocused = false"
                    style="width: 100px;
                    margin-left: 10px;
                    height: 30px;
                    padding: 1px 30px 1px 5px;
                    border-radius: 5px;
                    border: 1px solid #ccc;
                    box-sizing: border-box;
                    overflow: hidden;
                    background-color: orange;
                     white-space: nowrap;
                     text-overflow: ellipsis; min-width: 100px; max-width: 100px;"
                />
                <v-icon
                    v-if="filter"
                    @click="filter = ''"
                    class="clear-icon"
                    style="position: absolute; right: 5px; cursor: pointer; color: black; top: 50%; transform: translateY(-50%);"
                >
                  mdi-close-circle
                </v-icon>
                <v-icon
                    v-else
                    style="position: absolute; right: 5px; cursor: pointer; color: white; opacity: 0; top: 50%; transform: translateY(-50%);"
                >
                  mdi-close-circle
                </v-icon>
              </div>
            </div>
          </th>
          <th >
  <span class="header-label-container" @click="(e) => handleClick(e, 'description')" data-sort-key="description" style="cursor: pointer;">
    <span class="header-label">{{ DESCRIPTION_LABEL }}</span>
    <span class="sort-icon">{{ getSortIcon('description') || SORT_DEFAULT_ICON }}</span>
  </span>
          </th>
          <th >
  <span class="header-label-container" @click="(e) => handleClick(e, 'keywords')" data-sort-key="keywords" style="cursor: pointer;">
    <span class="header-label">{{ KEYWORDS_LABEL }}</span>
    <span class="sort-icon">{{ getSortIcon('keywords') || SORT_DEFAULT_ICON }}</span>
  </span>
          </th>
          <th>
            <span class="header-label-container" @click="(e) => handleClick(e, 'date')" data-sort-key="date" style="cursor: pointer;">
              <span class="header-label">{{ dateColumnLabel }}</span>
              <span class="sort-icon">{{ getSortIcon('date') || SORT_DEFAULT_ICON }}</span>
            </span>
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="link in sortedLinks"
            :key="link.id"
            :class="{
              'strike-through': link.id === activeLinkId,
              'dragging': draggedLink && link.id === draggedLink.id }"
            draggable="true"
            @dragstart="onDragStart(link)"
            @dragend="onDragEnd"
        >
          <td class="content-padding fav-column" @click="handleFavClick(link)">
            <!--            <img
                            v-if="link.favicon_name"
                            :src="getFaviconUrl(link.favicon_name)"
                            alt="Favicon"
                            class="favicon"
                        />-->
            <span v-if="link.id === activeLinkId" class="delete-icon" @click.stop="deleteLink(link)">{{ DELETE_ICON }}</span>
          </td>
          <td class="truncate content-padding"
              :class="{ 'highlighted': isHighlighted(link.url) }"
              style="width: 15ch;">
            <a :href="link.url" target="_blank" rel="noopener noreferrer">
              {{ getDomain(link.url) }}
            </a>
          </td>
          <td
              class="truncate content-padding right-align"
              :class="{ 'highlighted': isHighlighted(link.title) }"
              @mouseenter="handleMouseEnter($event, link.title)"
              @mouseleave="handleMouseLeave"
          >
            <span class="text-ellipsis">{{ truncateText(link.title, 100).truncated }}</span>
            <div v-if="showTooltip && isCtrlPressed && tooltipContent" class="custom-tooltip" :style="tooltipStyle" v-html="tooltipContent"></div>
          </td>
          <td
              class="truncate content-padding right-align"
              :class="{ 'highlighted': isHighlighted(link.description) }"
              @mouseenter="handleMouseEnter($event, link.description)"
              @mouseleave="handleMouseLeave"
          >
            <span class="text-ellipsis">{{ truncateText(link.description, 100).truncated }}</span>
            <div v-if="showTooltip && isCtrlPressed && tooltipContent" class="custom-tooltip" :style="tooltipStyle" v-html="tooltipContent"></div>
          </td>
          <td
              class="truncate content-padding right-align"
              :class="{ 'highlighted': isHighlighted(link.keywords) }"
              @mouseenter="handleMouseEnter($event, link.keywords ? link.keywords.join(', ') : '')"
              @mouseleave="handleMouseLeave"
          >
            <span class="text-ellipsis">{{ truncateText(link.keywords, 100).truncated }}</span>
            <div v-if="showTooltip && isCtrlPressed && tooltipContent" class="custom-tooltip" :style="tooltipStyle" v-html="tooltipContent"></div>
          </td>



          <td class="content-padding">
            <span v-if="!showAllDirs">{{ formatDate(link.date) }}</span>
            <span v-else>{{ getFolderNameByHash(link.dir_hash) }}</span>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script>
import { computed, ref, watchEffect, onMounted, onUnmounted, watch} from 'vue';
import { useStore } from 'vuex';
import { supabase } from '@/clients/supabase.js';
import { debounce } from 'lodash';


const FAVORITE_ICON = 'F';
const URL_LABEL = 'URL';
const TITLE_LABEL = 'Title';
const DESCRIPTION_LABEL = 'Description';
const KEYWORDS_LABEL = 'Keywords';
const DATE_LABEL = 'Date';
const SORT_ASC_ICON = '↑';
const SORT_DESC_ICON = '↓';
// const SORT_DEFAULT_ICON = '�?�';
const SORT_DEFAULT_ICON =  '⇅';
const DELETE_ICON = '❌';
const DELETE_ICON_TIMEOUT = 3000; // 3 секунды
export default {
  name: 'Gate',
  props: {
    selectedFolderHash: {
      type: String,
      default: null,
    },
    width: {
      type: String,
      required: true,
    },
    links: {
      type: Array,
      required: true,
    },
    sortKey: {
      type: String,
      required: true,
      default: 'date',
    },
    sortOrder: {
      type: String,
      required: true,
      default: 'desc',
    },
    draggedLink: {
      type: Object,
      default: null,
    },
  },
  emits: ['handle-url-click', 'sort', 'update-dragged-link'],
  setup(props, { emit }) {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const sortedLinks = ref([]);
    const currentSortKey = ref(props.sortKey);
    const currentSortOrder = ref(props.sortOrder);
    const deleteIconTimer = ref(null);
    const activeLinkId = ref(null);
    const draggedLink = ref(null); // Объявляем draggedLink здесь

    const isCtrlPressed = ref(false); // Состояние клавиши Ctrl
    const showTooltip = ref(false); // Видимость tooltip
    const tooltipContent = ref(''); // Содержимое tooltip
    const tooltipStyle = ref({}); // Стили для позиционирования tooltip

    const filter = ref(''); // Фильтр для поиска по заголовку
    const isFocused = ref(false); // Состояние фокуса на фильтре
    const folders = ref([]);
    const showAllDirs = ref(false);

    const dateColumnLabel = computed(() => {
      return showAllDirs.value ? 'Folder' : 'Date';
    });
    const debouncedFilter = debounce(() => {
      if (!filteredLinks.value || !filteredLinks.value.length) {
        sortedLinks.value = [];
        return;
      }
      sortedLinks.value = [...filteredLinks.value].sort((a, b) =>
          sortByKey(a, b, currentSortKey.value, currentSortOrder.value)
      );
    }, 300);
    const getFolderName = async (dirHash) => {
      if (!dirHash) return '';
      try {
        const { data, error } = await supabase
            .from('dir')
            .select('dir_name')
            .eq('dir_hash', dirHash)
            .single();
        if (error) throw error;
        return data?.dir_name || '';
      } catch (error) {
        console.error('Ошибка при получении названия папки:', error);
        return '';
      }
    };
    const subscribeToRealtimeChanges = () => {
      const channel = supabase
          .channel('realtime-dir')
          .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'dir' },
              (payload) => {
                // Добавляем новую папку в список
                folders.value.push(payload.new);
              }
          )
          .subscribe();

      return channel;
    };
    const getFolderNameByHash = computed(() => (dirHash) => {
      const folder = folders.value.find(f => f.dir_hash === dirHash);
      return folder ? folder.dir_name : '';
    });
    const isHighlighted = (value) => {
      // Если фильтр пуст, не выделяем
      if (!filter.value) return false;
      // Преобразуем значение в строку, если оно не строка
      const text = Array.isArray(value) ? value.join(', ') : value?.toString() || '';
      const searchTerm = filter.value.toLowerCase();
      return text.toLowerCase().includes(searchTerm);
    };
    const filteredLinks = computed(() => {
      const searchTerm = filter.value.toLowerCase();
      const matchesSearchTerm = (link) => {
        const titleMatch = link.title ? link.title.toLowerCase().includes(searchTerm) : false;
        const descriptionMatch = link.description ? link.description.toLowerCase().includes(searchTerm) : false;
        const keywordsMatch = link.keywords ? link.keywords.toString().toLowerCase().includes(searchTerm) : false;
        const urlMatch = link.url ? link.url.toLowerCase().includes(searchTerm) : false;
        return titleMatch || descriptionMatch || keywordsMatch || urlMatch;
      };
      const allFilteredLinks = props.links.filter(matchesSearchTerm);
      // Если checkbox включён, возвращаем все элементы, без фильтрации по dir_hash
      if (showAllDirs.value) {
        return allFilteredLinks;
      }
      // Иначе фильтруем по folder (dir_hash)
      return props.selectedFolderHash
          ? allFilteredLinks.filter(link => link.dir_hash === props.selectedFolderHash)
          : allFilteredLinks.filter(link => !link.dir_hash);
    });
    // Функция для разбиения текста на строки по 200 символов
    const splitTextIntoLines = (text) => {
      if (!text) return '';
      const chunkSize = 100; // Количество символов в строке
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      return chunks.join('<br>'); // Добавляем <br> для переноса строк
    };
    // Обработчик наведения на ячейку
    const handleMouseEnter = (event, content) => {
      if (isCtrlPressed.value && content) { // Проверяем, что содержимое не пустое
        tooltipContent.value = splitTextIntoLines(content); // Разбиваем текст на строки
        showTooltip.value = true;

        // Позиционируем tooltip относительно ячейки
        const rect = event.target.getBoundingClientRect();
        tooltipStyle.value = {
          top: `${rect.top + window.scrollY}px`,
          left: `${rect.left + window.scrollX}px`,
          maxWidth: `${window.innerWidth - rect.left - 20}px`, // Ограничиваем ширину tooltip
        };
      }
    };
    // Обработчик ухода мыши с ячейки
    const handleMouseLeave = () => {
      showTooltip.value = false;
    };
    // Обработчик нажатия клавиши Ctrl
    const handleKeyDown = (event) => {
      if (event.ctrlKey) {
        isCtrlPressed.value = true;
      }
    };
    // Обработчик отпускания клавиши Ctrl
    const handleKeyUp = (event) => {
      if (!event.ctrlKey) {
        isCtrlPressed.value = false;
        showTooltip.value = false; // Скрываем tooltip при отпускании Ctrl

      }
    };
    const truncateText = (text, length = 50) => {
      // Если text равен null, undefined или пуст, возвращаем пустые строки
      if (!text) {
        return { truncated: '', remainder: '' };
      }
      // Если text является массивом, преобразуем его в строку через запятую
      if (Array.isArray(text)) {
        text = text.join(', ');
      }
      // Если длина строки меньше или равна заданной, возвращаем оригинальный текст и пустой остаток
      if (text.length <= length) {
        return { truncated: text, remainder: '' };
      }
      // Обрезаем строку и добавляем многоточие, а остаток сохраняем отдельно
      const truncated = text.slice(0, length) + '...';
      const remainder = text.slice(length);
      return { truncated, remainder };
    };
    const onDragStart = (link) => {
      draggedLink.value = link; // Устанавливаем перетаскиваемую ссылку
      emit('update-dragged-link', link);
    };
    const onDragEnd = () => {
      draggedLink.value = null; // Сбрасываем перетаскиваемую ссылку
    };

    const rowCount = computed(() => filteredLinks.value.length); // Обновлено для использования filteredLinks
    const sortByKey = (a, b, key, order) => {
      const modifier = order === 'asc' ? 1 : -1;

      // Если ключ сортировки — 'dir_name', сортируем по названию папки
      if (key === 'dir_name') {
        const aFolder = folders.value.find(f => f.dir_hash === a.dir_hash);
        const bFolder = folders.value.find(f => f.dir_hash === b.dir_hash);
        const aValue = aFolder ? aFolder.dir_name : '';
        const bValue = bFolder ? bFolder.dir_name : '';

        // Пустые значения идут после непустых
        if (aValue === '' && bValue !== '') return 1; // a идет после b
        if (bValue === '' && aValue !== '') return -1; // a идет перед b
        if (aValue === '' && bValue === '') return 0; // a и b равны

        // Сортировка по значению
        return (aValue > bValue ? 1 : -1) * modifier;
      }

      // Для остальных ключей сортировки (включая 'date')
      const aValue = a[key] !== null ? a[key].toString() : '';
      const bValue = b[key] !== null ? b[key].toString() : '';
      if (key === 'date') {
        return (new Date(b.date) - new Date(a.date)) * modifier;
      }
      return (aValue > bValue ? 1 : -1) * modifier;
    };
    watchEffect(() => {
      if (!filteredLinks.value || !filteredLinks.value.length) {
        sortedLinks.value = [];
        return;
      }
      sortedLinks.value = [...filteredLinks.value].sort((a, b) =>
          sortByKey(a, b, currentSortKey.value, currentSortOrder.value)
      );
    });
    watch(filter, debouncedFilter);
    const handleClick = (event, key) => {
      if (key === 'url' && event.ctrlKey) {
        emit('handle-url-click', event, key);
      } else {
        // Если чекбокс включен и ключ сортировки — 'date', меняем его на 'dir_name'
        const sortKey = showAllDirs.value && key === 'date' ? 'dir_name' : key;

        if (currentSortKey.value === sortKey) {
          currentSortOrder.value = currentSortOrder.value === 'asc' ? 'desc' : 'asc';
        } else {
          currentSortOrder.value = 'asc';
        }

        currentSortKey.value = sortKey;
        emit('sort', sortKey, currentSortOrder.value);
      }
    };
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ru-RU').format(date);
    };
    const getDomain = (url) => {
      try {
        const { hostname } = new URL(url);
        return hostname.replace(/^www\./, ''); // Удаляем www. в начале
      } catch (e) {
        return url;
      }
    };
    const getSortIcon = (key) => {
      // Если чекбокс включен и ключ — 'date', используем 'dir_name' для проверки
      const sortKey = showAllDirs.value && key === 'date' ? 'dir_name' : key;

      if (currentSortKey.value === sortKey) {
        return currentSortOrder.value === 'asc' ? SORT_ASC_ICON : SORT_DESC_ICON;
      }
      return '';
    };
    const getFaviconUrl = (faviconName) => {
      return '';
      // return `https://your-supabase-url.com/storage/v1/object/public/favicons/${faviconName}`;
    };
    const handleFavClick = (link) => {
      // Сбрасываем предыдущую активную ссылку
      if (activeLinkId.value === link.id) {
        activeLinkId.value = null;
        if (deleteIconTimer.value) {
          clearTimeout(deleteIconTimer.value);
          deleteIconTimer.value = null;
        }
        return;
      }
      // Устанавливаем новую активную ссылку
      activeLinkId.value = link.id;
      // Очистка предыдущего таймера, если он существует
      if (deleteIconTimer.value) {
        clearTimeout(deleteIconTimer.value);
      }
      // Установка нового таймера для скрытия иконки удаления через 3 секунды
      deleteIconTimer.value = setTimeout(() => {
        activeLinkId.value = null;
        deleteIconTimer.value = null; // Сброс таймера
      }, DELETE_ICON_TIMEOUT);
    };
    const deleteLink = async (link) => {
      try {
        if (!link.url_hash) {
          console.error('URL hash ссылки отсутствует');
          alert('Ошибка: URL hash ссылки отсутствует.');
          return;
        }
        const urlHash = link.url_hash.toString();
        console.log(urlHash);
        const { error } = await supabase.rpc('del_link', { link_hash: urlHash });
        if (error) {
          throw new Error(`Ошибка при удалении: ${error.message}`);
        }
        sortedLinks.value = sortedLinks.value.filter((l) => l.url_hash !== link.url_hash);
        activeLinkId.value = null; // Скрываем иконку удаления после удаления ссылки
      } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
      }
    };
    const formatKeywords = (keywords) => {
      if (Array.isArray(keywords)) {
        return keywords.join(', ');
      }
      return ''; // Возвращаем пустую строку, если keywords не массив
    };
    const fetchFolders = async () => {
      try {
        const { data, error } = await supabase
            .from('dir')
            .select('*')
            .eq('user_id', userId.value);
        if (error) throw error;
        folders.value = data || [];
      } catch (error) {
        console.error('Ошибка при получении директорий:', error);
      }
    };
    onMounted(() => {
      const channel = subscribeToRealtimeChanges();
      fetchFolders().then(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
      });
    });

    onUnmounted(() => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    });
    return {
      dateColumnLabel,
      showAllDirs,
      getFolderNameByHash,
      filter,
      isFocused,
      isCtrlPressed,
      showTooltip,
      tooltipContent,
      tooltipStyle,
      handleMouseEnter,
      handleMouseLeave,
      truncateText,
      filteredLinks,
      onDragStart,
      onDragEnd,
      draggedLink,
      userId,
      sortedLinks,
      rowCount,
      handleClick,
      formatDate,
      getDomain,
      getSortIcon,
      getFaviconUrl,
      handleFavClick,
      deleteLink,
      formatKeywords,
      currentSortKey,
      currentSortOrder,
      FAVORITE_ICON,
      URL_LABEL,
      TITLE_LABEL,
      DESCRIPTION_LABEL,
      KEYWORDS_LABEL,
      DATE_LABEL,
      SORT_ASC_ICON,
      SORT_DESC_ICON,
      SORT_DEFAULT_ICON,
      DELETE_ICON,
      activeLinkId,
      isHighlighted,
      // isDragging, // Возвращаем состояние перетаскивания
    };
  },
};
</script>
<style scoped>
.highlighted {
  background-color: lightblue; /* Голубой цвет фона */
}
.custom-tooltip {
  position: absolute;
  background-color: rgba(9, 178, 17, 0.9); /* Фон tooltip */
  color: white; /* Цвет текста */
  /*
  padding: 8px 12px; !* Отступы внутри tooltip *!
  */
  border-radius: 2px; /* Скругление углов */
  font-size: 14px; /* Размер шрифта */
  white-space: nowrap; /* Текст не переносится */
  z-index: 1000; /* Tooltip поверх других элементов */
  pointer-events: none; /* Чтобы tooltip не перехватывал события мыши */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* Тень для tooltip */
  /*
  display: inline-block; !* Tooltip растягивается под содержимым *!
  */
  max-width: none; /* Убираем ограничение по ширине */
}

.dragging {
  background-color: violet; /* Цвет фона для перетаскиваемой строки */
}
th:nth-child(1){
  width: 24px; /* FAV column */
  background-color: green;
}
td:nth-child(1) {
  width: 24px; /* FAV column */
}
th:nth-child(2),
td:nth-child(2) {
  width: 15%; /* URL column */
}
th:nth-child(3),
td:nth-child(3) {
  width: 50%; /* Title column */
}
th:nth-child(4),
td:nth-child(4) {
  width: 30%; /* Description column */
}
th:nth-child(5),
td:nth-child(5) {
  width: 20%; /* Keywords column */
}
th:nth-child(6),
td:nth-child(6) {
  width: 11ch; /* Date column */
}
th:nth-child(2) .header-label-container {
  font-size: 1em; /* Уменьшите размер шрифта заголовка */
}
th:nth-child(2) {
  text-align: left; /* Выравнивание заголовка по правому краю */
  padding-left: 5px; /* Отступ слева на 5 пикселей */
}
.row-count-button {
  font-size: 14px;
  /* Минимальный размер шрифта – можно подбирать в зависимости от размера ячейки */
  /*
  display: inline-flex; !* �?спользуем inline-flex для выравнивания по одной линии *!
  */
  margin-top: 5px;
  align-items: center; /* Центрируем содержимое по вертикали */
  writing-mode: vertical-lr; /* Вертикальное направление текста */
  /* transform: rotate(180deg); Поворачиваем текст на 180 градусов */
  /*margin-left: 10px;  Отступ слева для отделения от заголовка */
  /* cursor: pointer; Курсор при наведении */
  color: black; /* Цвет текста (можно изменить) */
  /*
  background-color: green; !* Цвет фона (можно изменить) *!
  */
  padding: 0 ; /* Отступы по горизонтали для создания заливки вокруг текста */
  /* border-radius: 5px; Скругление углов */
  width: fit-content; /* Заливка по содержимому */
  min-width: 60px; /* Минимальная ширина для удобства нажатия */
}
.table-container {
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}
.header-label-container {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  background-color: red;
  border-radius: 5px;
  padding: 5px 10px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: fit-content;
  max-width: 100%;
}
.header-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sort-icon {
  margin-left: 5px;
  min-width: 15px; /* Установите минимальную ширину для иконки сортировки */
}
td {
  border: 1px solid gray;
  text-align: left;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
th {
  background-color: darkgrey;
  position: relative;
}
thead {
  background: white;
  position: sticky;
  top: 0;
  z-index: 2;
}
thead th {
  text-align: left;
  padding-left: 5px;
  border-bottom: 1px solid gray; /* Одиночная граница внизу заголовков */
}
tbody {
  overflow-x: hidden; /* Скрыть горизонтальную прокрутку */
  max-height: calc(100vh - 50px);
  overflow-y: auto;
  /*
  display: block; !* Убедитесь, что tbody ведет себя как блок *!
  */
}
thead,
tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}
.fav-column {
  position: relative;
  cursor: pointer;
  text-align: center;
}
.favicon {
  width: 18px;
  height: 18px;
}
.delete-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  cursor: pointer;
  display: block; /* �?конка всегда видна, если активна */
}
.strike-through {
  text-decoration: line-through;
  text-decoration-color: red;
  text-decoration-thickness: 3px;
}
/* Удаление сдвоенной границы между ячейками */
table {
  border-collapse: collapse;
  width: 100%; /* Ширина таблицы равна ширине контейнера */
  table-layout: fixed; /* Фиксированная ширина столбцов */
}
th, td {
  border: 1px solid gray;
}


</style>