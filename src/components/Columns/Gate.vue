<template>
  <div class="column column-2" :style="{ width }">
    <div class="table-container">
      <table>
        <thead>
        <tr>
          <th>
            <span class="header-label">FAV</span>
          </th>
          <th @click="(e) => handleClick(e, 'url')" style="cursor: pointer;">
            <span class="header-label">URL</span>
            <span class="sort-icon">{{ getSortIcon('url') }}</span>
            <button class="row-count-button" @click.stop="toggleRowCount">{{ rowCount.toString().padStart(4, '0') }}</button>
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
          <td class="content-padding fav-column" @click="handleFavClick(link)">
            <img
                v-if="link.favicon_name"
                :src="getFaviconUrl(link.favicon_name)"
                alt="Favicon"
                class="favicon"
            />
            <span v-if="link.showDeleteIcon" class="delete-icon" @click.stop="deleteLink(link)">🗑️</span>
          </td>
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
import { supabase } from '@/clients/supabase.js';

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
      default: 'date',
    },
    sortOrder: {
      type: String,
      required: true,
      default: 'desc',
    },
  },

  emits: ['handle-url-click', 'sort'],

  setup(props, { emit }) {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const sortedLinks = ref([]);

    const rowCount = computed(() => props.links.length);

    const sortByKey = (a, b, key, order) => {
      const modifier = order === 'asc' ? 1 : -1;
      const aValue = a[key] !== null ? a[key].toString() : '';
      const bValue = b[key] !== null ? b[key].toString() : '';

      if (key === 'date') {
        return (new Date(b.date) - new Date(a.date)) * modifier;
      }
      return (aValue > bValue ? 1 : -1) * modifier;
    };

    watchEffect(() => {
      if (!props.links || !props.links.length) {
        sortedLinks.value = [];
        return;
      }
      sortedLinks.value = [...props.links].sort((a, b) =>
          sortByKey(a, b, props.sortKey, props.sortOrder)
      );
    });

    const handleClick = (event, key) => {
      if (key === 'url' && event.ctrlKey) {
        emit('handle-url-click', event, key);
      } else {
        emit('sort', key);
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ru-RU').format(date);
    };

    const getDomain = (url) => {
      try {
        const { hostname } = new URL(url);
        return hostname;
      } catch (e) {
        return url;
      }
    };

    const getSortIcon = (key) => {
      if (props.sortKey === key) {
        return props.sortOrder === 'asc' ? '↑' : '↓';
      }
      return '';
    };

    const getFaviconUrl = (faviconName) => {
      return '';
      // return `https://your-supabase-url.com/storage/v1/object/public/favicons/${faviconName}`;
    };

    const handleFavClick = (link) => {
      sortedLinks.value = sortedLinks.value.map((l) => ({
        ...l,
        showDeleteIcon: l.id === link.id ? !l.showDeleteIcon : false,
      }));
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

        const {error} = await supabase.rpc('del_link', {link_hash: urlHash});
        // const {error} = await supabase.rpc('move_to_del_links', {url_hash: urlHash});

        if (error) {
          throw new Error(`Ошибка при удалении: ${error.message}`);
        }

        sortedLinks.value = sortedLinks.value.filter((l) => l.url_hash !== link.url_hash);
      } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
      }
    };

    return {
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
    };
  },
};
</script>

<style scoped>

th:nth-child(2) .header-label {
  font-size: 0.75em; /* Уменьшите размер шрифта заголовка */
}

th:nth-child(2) {
  text-align: left; /* Выравнивание заголовка по правому краю */
  padding-left: 5px; /* Отступ слева на 5 пикселей */
  background-color: green;

}

.row-count-button {
  background-color: green;
  color: white;
  border: none;
  border-radius: 5px;
  height: 50%; /* Половина высоты заголовка */
  float: right; /* Выравнивание кнопки счетчика по левому краю */
  margin-right: 5px; /* Убедитесь, что у кнопки нет отступов слева */  cursor: pointer;
  font-size: 0.75em;
}
.table-container {
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.header-label {
  background-color: red;
  border-radius: 5px;
  padding: 5px 10px;
  color: white;
  display: inline-block;
}

.sort-icon {
  margin-left: 5px;
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
  width: 24px;
}

th:nth-child(2),
td:nth-child(2) {
  width: 15%;
}

th:nth-child(5),
td:nth-child(5) {
  width: 10ch;
}

th:nth-child(3),
td:nth-child(3),
th:nth-child(4),
td:nth-child(4) {
  width: 10ch;
}

th:nth-child(2),
td:nth-child(2),
th:nth-child(3),
td:nth-child(3) {
  min-width: 20%;
}

th:nth-child(5),
td:nth-child(5) {
  width: 50px;
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
  display: none;
}

.fav-column:hover .delete-icon {
  display: block;
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
  th:nth-child(5),
  td:nth-child(5),
  th:nth-child(3),
  td:nth-child(3) {
    width: auto;
    min-width: unset;
  }

  .sort-icon {
    display: none;
  }
}
</style>
