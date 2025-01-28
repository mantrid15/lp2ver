<template>
  <div class="column column-2" :style="{ width }">
    <div class="table-container">
    <table>
      <thead>
      <tr>
        <th @click="(e) => handleClick(e, 'url')" style="cursor: pointer;">
              <span class="header-label">URL
                <span v-if="sortKey === 'url' && sortOrder === 'asc'">↑</span>
                <span v-if="sortKey === 'url' && sortOrder === 'desc'">↓</span>
              </span>
        </th>
        <th @click="(e) => handleClick(e, 'title')" style="cursor: pointer;">
          Title
          <span v-if="sortKey === 'title' && sortOrder === 'asc'">↑</span>
          <span v-if="sortKey === 'title' && sortOrder === 'desc'">↓</span>
        </th>
        <th @click="(e) => handleClick(e, 'description')" style="cursor: pointer;">
          Description
          <span v-if="sortKey === 'description' && sortOrder === 'asc'">↑</span>
          <span v-if="sortKey === 'description' && sortOrder === 'desc'">↓</span>
        </th>
        <th @click="(e) => handleClick(e, 'date')" style="cursor: pointer;">
              <span class="header-label">Date
                <span v-if="sortKey === 'date' && sortOrder === 'asc'">↑</span>
                <span v-if="sortKey === 'date' && sortOrder === 'desc'">↓</span>
              </span>
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
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'Gate',

  props: {
    width: {
      type: String,
      required: true
    },
    links: {
      type: Array,
      required: true
    },
    sortKey: {
      type: String,
      required: true,
      default: 'date' // Устанавливаем сортировку по умолчанию по столбцу 'date'
    },
    sortOrder: {
      type: String,
      required: true,
      default: 'desc' // Устанавливаем порядок сортировки по умолчанию 'desc'
    }
  },

  emits: ['handle-url-click', 'sort'],

  setup(props, { emit }) {
    const store = useStore();
    const userId = computed(() => store.state.userId);

    // Инициализация сортировки по умолчанию
    /*1.1. Избыточная логика в onMounted
В onMounted вы проверяете, переданы ли sortKey и sortOrder, и если нет, то вызываете emit('sort', 'date', 'desc').

Однако, вы уже установили значения по умолчанию для этих пропсов (sortKey: 'date', sortOrder: 'desc'). Это делает проверку в onMounted избыточной.

Если родительский компонент не передает sortKey и sortOrder, то значения по умолчанию уже будут использованы.

Рекомендация:
Удалите onMounted, так как он не нужен. Значения по умолчанию уже решают эту задачу.*/
    // onMounted(() => {
    //   if (!props.sortKey || !props.sortOrder) {
    //     emit('sort', 'date', 'desc'); // Устанавливаем сортировку по 'date' и 'desc'
    //   }
    // });

    const handleClick = (event, key) => {
      if (key === 'url' && event.ctrlKey) {
        emit('handle-url-click', event, key); // Обработка события для URL
      } else {
        emit('sort', key); // Сортировка по другим столбцам
      }
    };

    const sortedLinks = computed(() => {
      return [...props.links].sort((a, b) => {
        const modifier = props.sortOrder === 'asc' ? 1 : -1;

        // Проверка на null и использование пустой строки для безопасного сравнения
        const aValue = a[props.sortKey] !== null ? a[props.sortKey].toString() : '';
        const bValue = b[props.sortKey] !== null ? b[props.sortKey].toString() : '';

        if (props.sortKey === 'date') {
          return (new Date(b.date) - new Date(a.date)) * modifier; // Обратный порядок для 'date'
        } else {
          return (aValue > bValue ? 1 : -1) * modifier;
        }
      });
    });

/*
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    };
*/

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ru-RU').format(date); // Формат для русской локали
    };

    const getDomain = (url) => {
      try {
        const { hostname } = new URL(url);
        return hostname;
      } catch (e) {
        return url; // Возвращаем исходный URL в случае ошибки
      }
    };

    /*1.4. Логика getDomain
В getDomain вы используете регулярное выражение и разбиение строки для извлечения домена. Это может быть неэффективно для большого количества URL.

Также, если URL содержит нестандартные символы или порт, логика может сломаться.

Рекомендация:

Используйте встроенный объект URL для извлечения домена. Это более надежно и читаемо:*/

/*
    const getDomain = (url) => {
      const domain = url.replace(/^https?:\/\//, '').split('/')[0];
      const parts = domain.split('.');
      return parts.length > 2 ? `${parts[parts.length - 2]}.${parts[parts.length - 1]}` : domain;
    };
*/

    return {
      // emit,
      userId,
      sortedLinks,
      handleClick,
      formatDate,
      getDomain
    };
  }
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

td {
  border: 1px solid gray;
  text-align: left;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

th {
  background-color: darkgrey;
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

thead, tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

th:nth-child(1), td:nth-child(1) {
  width: 15ch;
}
th:nth-child(4), td:nth-child(4) {
  width: 10ch;
}
th:nth-child(2), td:nth-child(2),
th:nth-child(3), td:nth-child(3) {
  min-width: 20ch;
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
</style>