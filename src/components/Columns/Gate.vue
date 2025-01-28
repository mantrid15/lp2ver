<template>
  <div class="column column-2" :style="{ width }">
    <div class="table-container">
      <table>
        <thead>
        <tr>
          <th @click="(e) => handleClick(e, 'url')" style="cursor: pointer;">
            <span class="header-label">URL</span>
            <span class="sort-icon">{{ getSortIcon('url') }}</span>
          </th>
          <th @click="(e) => handleClick(e, 'title')" style="cursor: pointer;">
            <span class="header-label">Title</span>
            <span class="sort-icon">{{ getSortIcon('title') }}</span>
          </th>
          <th @click="(e) => handleClick(e, 'description')" style="cursor: pointer;">
            <span class="header-label">Description</span>
            <span class="sort-icon">{{ getSortIcon('description') }}</span>
          </th>
          <th @click="(e) => handleClick(e, 'date')" style="cursor: pointer;">
            <span class="header-label">Date</span>
            <span class="sort-icon">{{ getSortIcon('date') }}</span>
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="link in sortedLinks" :key="link.id">
          <td class="truncate content-padding">
            <a :href="link.url" target="_blank" rel="noopener noreferrer">
              {{ getDomain(link.url) }}
            </a>
          </td>
          <td class="truncate content-padding">{{ link.title }}</td>
          <td class="truncate content-padding">{{ link.description }}</td>
          <td class="content-padding">{{ formatDate(link.date) }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { computed, ref, watchEffect } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'Gate',

  props: {
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
      default: 'date', // Сортировка по умолчанию по столбцу 'date'
    },
    sortOrder: {
      type: String,
      required: true,
      default: 'desc', // Порядок сортировки по умолчанию 'desc'
    },
  },

  emits: ['handle-url-click', 'sort'],

  setup(props, { emit }) {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const sortedLinks = ref([]);

    // Логика сортировки
    const sortByKey = (a, b, key, order) => {
      const modifier = order === 'asc' ? 1 : -1;
      const aValue = a[key] !== null ? a[key].toString() : '';
      const bValue = b[key] !== null ? b[key].toString() : '';

      if (key === 'date') {
        return (new Date(b.date) - new Date(a.date)) * modifier;
      }
      return (aValue > bValue ? 1 : -1) * modifier;
    };

    // Обновление sortedLinks при изменении props.links, sortKey или sortOrder
    watchEffect(() => {
      if (!props.links || !props.links.length) {
        sortedLinks.value = [];
        return;
      }
      sortedLinks.value = [...props.links].sort((a, b) =>
        sortByKey(a, b, props.sortKey, props.sortOrder)
      );
    });

    // Обработка клика по заголовку
    const handleClick = (event, key) => {
      if (key === 'url' && event.ctrlKey) {
        emit('handle-url-click', event, key); // Обработка события для URL
      } else {
        emit('sort', key); // Сортировка по другим столбцам
      }
    };

    // Форматирование даты
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ru-RU').format(date); // Формат для русской локали
    };

    // Извлечение домена из URL
    const getDomain = (url) => {
      try {
        const { hostname } = new URL(url);
        return hostname;
      } catch (e) {
        return url; // Возвращаем исходный URL в случае ошибки
      }
    };

    // Получение иконки сортировки
    const getSortIcon = (key) => {
      if (props.sortKey === key) {
        return props.sortOrder === 'asc' ? '↑' : '↓';
      }
      return '';
    };

    return {
      userId,
      sortedLinks,
      handleClick,
      formatDate,
      getDomain,
      getSortIcon,
    };
  },
};
</script>

<style scoped>
.table-container {
  max-height: calc(100vh - 100px); /* Установите максимальную высоту для контейнера */
  overflow-y: auto; /* Включите вертикальную прокрутку */
}

.header-label {
  background-color: red;
  border-radius: 5px;
  padding: 5px 10px;
  color: white;
  display: inline-block;
}

.sort-icon {
  margin-left: 5px; /* Отступ для стрелки */
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
  position: relative; /* Для позиционирования стрелок */
}

thead {
  background: white;
  position: sticky; /* Закрепляем заголовок */
  top: 0; /* Положение заголовка */
  z-index: 2; /* Убедитесь, что заголовок выше содержимого */
}

thead th {
  text-align: center;
}

tbody {
  max-height: calc(100vh - 50px);
  overflow-y: auto;
}

thead,
tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

th:nth-child(1),
td:nth-child(1) {
  width: 15%;
}

th:nth-child(4),
td:nth-child(4) {
  width: 10ch; /* Ширина столбца Date в 10 символов */
}

th:nth-child(2),
td:nth-child(2),
th:nth-child(3),
td:nth-child(3) {
  min-width: 20%;
}

.truncate {
  max-width: 350px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

table {
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;
}

.content-padding {
  padding-left: 5px;
}

@media (max-width: 768px) {
  th:nth-child(1),
  td:nth-child(1),
  th:nth-child(4),
  td:nth-child(4),
  th:nth-child(2),
  td:nth-child(2),
  th:nth-child(3),
  td:nth-child(3) {
    width: auto;
    min-width: unset;
  }

  .sort-icon {
    display: none; /* Скрываем стрелки на маленьких экранах */
  }
}
</style>