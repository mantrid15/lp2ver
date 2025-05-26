<template>
  <div class="column column-1" :style="{ backgroundColor: 'brown', width: width }">
    <v-container class="folders-container">
      <v-row>
        <template v-if="isDefaultState">
          <v-col cols="12" class="text-center start-working-message">
            Начать работать.
          </v-col>
        </template>
        <template v-else-if="shouldShowNoFoldersMessage">
          <v-col cols="12" class="text-center no-folders-message">
            Папок нет!!!
          </v-col>
        </template>
        <template v-else>
          <v-col
              v-for="folder in childFolders"
              :key="folder.dir_hash"
              :cols="columnSize"
              class="folder-column"
              @dragover.prevent
              @drop="onDrop(folder.dir_hash)"
          >
            <v-card
                class="folder-card"
                @click="selectFolder(folder)"
                draggable="true"
                @dragstart="handleDragStart($event, folder)"
                @dragover.prevent="handleDragOver($event, folder)"
                @drop="handleDrop($event, folder)"
                @dragleave="handleDragLeave"
            >
              <v-card-title class="folder-title">
                <div class="icon-container">
                  <v-icon
                      class="folder-icon"
                      :style="{
                      background: getFolderColor(folder),
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }"
                  >
                    mdi-folder
                  </v-icon>
                </div>
                <span class="folder-name" :style="{ fontSize: getFontSize(folder.dir_name) }">
                  {{ folder.dir_name }}
                </span>
                <span class="link-counter">
                  {{ getChildItemsCount(folder.dir_hash) }}
                </span>
                <span class="range-counter">
                  {{ folder.range }}
                </span>
              </v-card-title>
            </v-card>
          </v-col>
        </template>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { computed, ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { supabase } from "@/clients/supabase.js";

export default {
  name: 'Left',
  props: {
    width: {
      type: String,
      required: true
    },
    selectedFolderHash: {
      type: String,
      default: null
    },
    draggedLink: {
      type: Object,
      default: null
    },
    rightFolder: {  // Добавляем пропс для текущей папки из Right
      type: Object,
      default: null
    }
  },
  setup(props, { emit }) {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const folders = ref([]);
    const linkCounts = ref({});
    const childCounts = ref({}); // Для хранения количества дочерних элементов
    const draggedFolder = ref(null);


    // Получаем количество дочерних элементов (папок и ссылок)
    const getChildItemsCount = (dirHash) => {
      const linksCount = linkCounts.value[dirHash] || 0;
      const foldersCount = childCounts.value[dirHash] || 0;
      return linksCount + foldersCount;
    };

// Функция для получения количества дочерних папок
    const fetchChildFoldersCount = async (parentHash) => {
      try {
        const { count, error } = await supabase
            .from('dir')
            .select('*', { count: 'exact' })
            .eq('parent_hash', parentHash);

        if (error) throw error;
        return count || 0;
      } catch (error) {
        console.error('Error fetching child folders count:', error);
        return 0;
      }
    };

// Обновляем счетчики дочерних элементов
    const updateChildCounts = async () => {
      const newCounts = {};

      // Для всех папок получаем количество дочерних папок
      for (const folder of folders.value) {
        if (folder.parent_hash) {
          if (!newCounts[folder.parent_hash]) {
            newCounts[folder.parent_hash] = 0;
          }
          newCounts[folder.parent_hash]++;
        }
      }

      // Дополнительно запрашиваем точное количество из базы
      for (const folder of folders.value) {
        const count = await fetchChildFoldersCount(folder.dir_hash);
        newCounts[folder.dir_hash] = count;
      }

      childCounts.value = newCounts;
    };
    // Определяем childFolders с учетом иерархии
    const childFolders = computed(() => {
      let children = [];

      // Если есть rightFolder, показываем его дочерние папки
      if (props.rightFolder) {
        children = folders.value.filter(folder =>
            folder.parent_hash === props.rightFolder.dir_hash
        );
      }
      // Если есть selectedFolderHash, показываем его дочерние папки
      else if (props.selectedFolderHash) {
        children = folders.value.filter(folder =>
            folder.parent_hash === props.selectedFolderHash
        );
      }
      // Иначе показываем папки верхнего уровня
      else {
        children = folders.value.filter(folder =>
            folder.parent_hash === null
        );
      }

      // Сортируем по range
      children.sort((a, b) => a.range - b.range);
      return children;
    });
    // Добавляем вычисляемое свойство для определения состояния по умолчанию
    const isDefaultState = computed(() => {
      // Если rightFolder не передан (null) и selectedFolderHash тоже null
      return !props.rightFolder && !props.selectedFolderHash;
    });
    // Определяем количество столбцов в зависимости от ширины
    const columnSize = computed(() => {
      const widthValue = parseFloat(props.width);
      if (widthValue > 22) {
        return 4; // 3 столбца (12/4=3)
      } else if (widthValue > 14) {
        return 6; // 2 столбца (12/6=2)
      } else {
        return 12; // 1 столбец
      }
    });

    const shouldShowNoFoldersMessage = computed(() => {
      // Показываем "Папок нет!!!" только если есть rightFolder или selectedFolderHash,
      // но при этом нет дочерних папок
      return (props.rightFolder || props.selectedFolderHash) && childFolders.value.length === 0;
    });
    // Остальной код остается без изменений...
    const getFontSize = (folderName) => {
      const words = folderName.split(' ');
      const hasMultipleWords = words.length > 1;
      const isLong = folderName.length > 13;

      if (hasMultipleWords && isLong) {
        if (folderName.length > 27) {
          return '80%';
        } else {
          return '90%';
        }
      }
      return '100%';
    };

    const fetchFolders = async () => {
      const {data, error} = await supabase
          .from('dir')
          .select('*')
          .eq('user_id', userId.value);
      if (error) {
        console.error('Ошибка при получении директорий:', error);
      } else {
        folders.value = data || [];
      }
    };

    const getLinkCount = async (dirHash) => {
      try {
        if (!dirHash) {
          linkCounts.value[dirHash] = 0;
          return 0;
        }
        const { data, error, count } = await supabase
            .from('links')
            .select('*', { count: 'exact' })
            .eq('dir_hash', dirHash);
        if (error) {
          console.error('Ошибка при выполнении запроса:', error);
          return 0;
        }
        const linkCount = count || (data ? data.length : 0);
        linkCounts.value = { ...linkCounts.value, [dirHash]: linkCount };
        return linkCount;
      } catch (error) {
        console.error('Ошибка при получении количества ссылок:', error);
        return 0;
      }
    };

    const getFolderColor = (folder) => {
      const count = linkCounts.value[folder.dir_hash] || 0;
      return count > 0
          ? 'linear-gradient(to bottom, #76c7c0, #4caf50)'
          : 'linear-gradient(to bottom, #ff7f7f, #ff4c4c)';
    };

    const selectFolder = (folder) => {
      emit('folder-selected', folder.dir_hash);
    };

    const handleDragStart = (event, folder) => {
      draggedFolder.value = folder;
      event.dataTransfer.setData('text/plain', folder.dir_hash);
    };

    const handleDragLeave = (event) => {
      event.currentTarget.style.opacity = '1';
    };

    const handleDragOver = (event, folder) => {
      event.preventDefault();
      if (draggedFolder.value && draggedFolder.value.dir_hash !== folder.dir_hash) {
        event.currentTarget.style.opacity = '0.3';
      }
    };

    const handleDrop = async (event, targetFolder) => {
      event.preventDefault();
      event.currentTarget.style.opacity = '1';
      if (!event.ctrlKey) {
        console.log('Перетаскивание отменено, удерживайте Ctrl для выполнения операции.');
        return;
      }
      if (draggedFolder.value && draggedFolder.value.dir_hash !== targetFolder.dir_hash) {
        const updatedFolders = [...folders.value];
        const draggedIndex = updatedFolders.findIndex(f => f.dir_hash === draggedFolder.value.dir_hash);
        const targetIndex = updatedFolders.findIndex(f => f.dir_hash === targetFolder.dir_hash);
        if (draggedIndex === -1 || targetIndex === -1) return;

        const draggedFolderRange = updatedFolders[draggedIndex].range;
        const targetFolderRange = updatedFolders[targetIndex].range;
        updatedFolders[draggedIndex].range = targetFolderRange;
        updatedFolders[targetIndex].range = draggedFolderRange;

        await updateFolderRanges([
          { dir_hash: updatedFolders[draggedIndex].dir_hash, range: updatedFolders[draggedIndex].range },
          { dir_hash: updatedFolders[targetIndex].dir_hash, range: updatedFolders[targetIndex].range }
        ]);

        folders.value = updatedFolders;
      }
    };

    const updateFolderRanges = async (updates) => {
      try {
        for (const update of updates) {
          const { error } = await supabase
              .from('dir')
              .update({ range: update.range })
              .eq('dir_hash', update.dir_hash);
          if (error) {
            console.error('Ошибка при обновлении папки:', update.dir_hash, error);
          }
        }
        await fetchFolders();
      } catch (error) {
        console.error('Ошибка при обновлении папок:', error);
      }
    };

    const onDrop = async (dirHash) => {
      if (props.draggedLink) {
        const linkToUpdate = props.draggedLink;
        try {
          const { error } = await supabase
              .from('links')
              .update({ dir_hash: dirHash })
              .eq('id', linkToUpdate.id);
          if (error) throw error;
          await getLinkCount(dirHash);
          if (linkToUpdate.dir_hash) {
            await getLinkCount(linkToUpdate.dir_hash);
          }
          emit('update-dragged-link', null);
        } catch (error) {
          console.error('Ошибка при обновлении ссылки:', error);
        }
      }
    };

    onMounted(() => {
      fetchFolders();
    });

    watch(folders, (newFolders) => {
      newFolders.forEach(folder => {
        getLinkCount(folder.dir_hash);
      });
    }, { immediate: true });

    // Следим за изменениями rightFolder и обновляем данные
    watch(() => props.rightFolder, async (newVal) => {
      await fetchFolders();
    });

    return {
      getChildItemsCount,
      isDefaultState,
      childFolders,
      selectFolder,
      getFolderColor,
      getFontSize,
      linkCounts,
      handleDragStart,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      onDrop,
      shouldShowNoFoldersMessage,
      columnSize
    };
  }
};
</script>

<style scoped>
.start-working-message {
  color: white;
  font-size: 1.5rem;
  padding: 40px 20px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}
.column {
  flex-shrink: 0;
  overflow: hidden;
  height: 100%;
}

.folders-container {
  height: 100%;
  padding: 10px;
  overflow-y: auto;
}

.folder-column {
  padding: 8px;
}

.folder-card {
  background-color: #fff;
  border: 2px solid #000000;
  border-radius: 4px;
  padding: 5px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.folder-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.folder-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  position: relative;
  width: 100%;
  height: 100%;
}

.icon-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: -20px;
}

.folder-icon {
  font-size: 5rem;
  color: transparent;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.folder-name {
  font-size: 1rem;
  margin-bottom: 15px;
  word-break: break-word;
  text-align: center;
  white-space: pre-line;
  line-height: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
}

.link-counter {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 16px;
  color: black;
}

.range-counter {
  position: absolute;
  bottom: 5px;
  left: 5px;
  font-size: 10px;
  color: black;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 2px 5px;
  border-radius: 3px;
}

.no-folders-message {
  color: white;
  font-size: 1.2rem;
  padding: 20px;
  font-weight: bold;
}

/* Стили для скроллбара */
.folders-container::-webkit-scrollbar {
  width: 8px;
}

.folders-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.folders-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.folders-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}
</style>