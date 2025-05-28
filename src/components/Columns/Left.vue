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
              v-for="folder in childFoldersWithCounts"
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
                  {{ folder.itemsCount }}
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
    rightFolder: {
      type: Object,
      default: null
    }
  },
  setup(props, { emit }) {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const folders = ref([]);
    const childFoldersWithCounts = ref([]);
    const draggedFolder = ref(null);
    const selectedFolderHash = ref(null);

    const columnSize = computed(() => {
      const widthValue = parseFloat(props.width);
      if (widthValue > 22) return 4;
      if (widthValue > 14) return 6;
      return 12;
    });

    // Отображаемые папки - либо дочерние, либо корневые
    const displayedFolders = computed(() => {
      if (!currentParentHash.value) {
        return folders.value.filter(f => f.parent_hash === null);
      }
      return childFoldersWithCounts.value;
    });

    const getItemsCount = async (dirHash) => {
      try {
        const { count, error } = await supabase
            .from('links')
            .select('*', { count: 'exact' })
            .eq('dir_hash', dirHash);

        if (error) {
          console.error('Ошибка при подсчете элементов:', error);
          return 0;
        }
        return count || 0;
      } catch (error) {
        console.error('Неожиданная ошибка в getItemsCount:', error);
        return 0;
      }
    };


    // Обновление списка дочерних папок с подсчетом элементов
    const updateChildFoldersWithCounts = async () => {
      // Используем props.selectedFolderHash вместо локального состояния
      const parentHash = props.selectedFolderHash || props.rightFolder?.dir_hash;

      if (!parentHash) {
        childFoldersWithCounts.value = [];
        return;
      }

      // Шаг 1: Получаем все ссылки, где parent_hash равен dir_hash корневой папки
      const { data: links, error: linksError } = await supabase
          .from('links')
          .select('id, dir_hash')
          .eq('parent_hash', parentHash);

      if (linksError) {
        console.error('Ошибка при получении ссылок:', linksError);
        childFoldersWithCounts.value = [];
        return;
      }

      const children = folders.value.filter(f => f.parent_hash === parentHash);

      // Шаг 3: Подсчитываем количество элементов для каждой дочерней папки
      const childrenWithCounts = children.map(folder => {
        const itemsCount = links.filter(link => link.dir_hash === folder.dir_hash).length;
        return {
          ...folder,
          itemsCount
        };
      });

      childFoldersWithCounts.value = childrenWithCounts;
    };

    // Загрузка дочерних папок на основе selectedFolderHash
    const fetchFolders = async () => {
      console.log('Запрос папок для userId:', userId.value);
      const { data, error } = await supabase
          .from('dir')
          .select('*')
          .eq('user_id', userId.value);
      if (error) {
        console.error('Ошибка при запросе папок:', error);
      } else {
        console.log('Полученные папки:', data);
        folders.value = data || [];
        await updateChildFoldersWithCounts();
      }
    };
    const isDefaultState = computed(() => {
      return !props.rightFolder && !props.selectedFolderHash;
    });

    const shouldShowNoFoldersMessage = computed(() => {
      return (props.rightFolder || props.selectedFolderHash) &&
          childFoldersWithCounts.value.length === 0;
    });

    const getFontSize = (folderName) => {
      const words = folderName.split(' ');
      const hasMultipleWords = words.length > 1;
      const isLong = folderName.length > 13;

      if (hasMultipleWords && isLong) {
        return folderName.length > 27 ? '80%' : '90%';
      }
      return '100%';
    };

    const getFolderColor = (folder) => {
      // Используем props.selectedFolderHash для определения выделенной папки
      if (props.selectedFolderHash === folder.dir_hash) {
        return folder.itemsCount > 0
            ? 'linear-gradient(to bottom, #76c7c0, #4caf50)'
            : 'linear-gradient(to bottom, #ff7f7f, #ff4c4c)';
      } else {
        return 'linear-gradient(to bottom, #f0e68c, #d2b48c)';
      }
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
      if (!event.ctrlKey) return;

      if (draggedFolder.value && draggedFolder.value.dir_hash !== targetFolder.dir_hash) {
        const [dragged, target] = [draggedFolder.value, targetFolder];
        await Promise.all([
          supabase.from('dir').update({ parent_hash: target.parent_hash }).eq('dir_hash', dragged.dir_hash),
          supabase.from('dir').update({ parent_hash: dragged.parent_hash }).eq('dir_hash', target.dir_hash)
        ]);
        await fetchFolders();
      }
    };

    const onDrop = async (dirHash) => {
      if (props.draggedLink) {
        await supabase
            .from('links')
            .update({ dir_hash: dirHash })
            .eq('id', props.draggedLink.id);
        emit('update-dragged-link', null);
        await fetchFolders();
      }
    };

    onMounted(fetchFolders);
    watch(() => props.rightFolder, fetchFolders);
    watch(() => props.selectedFolderHash, fetchFolders);
    watch([() => props.selectedFolderHash, () => props.rightFolder], updateChildFoldersWithCounts, { immediate: true });

    return {
      columnSize,
      childFoldersWithCounts,
      isDefaultState,
      shouldShowNoFoldersMessage,
      getFontSize,
      getFolderColor,
      selectFolder,
      handleDragStart,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      onDrop
    };
  }
};
</script>

<style scoped>
.column {
  flex-shrink: 0;
  overflow: hidden;
  height: 100%;
}

.folders-container {
  height: 100%;
  padding: 3% 10px 5%;
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
}

.folder-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.folder-name {
  font-size: calc(1rem + (100% - 200px) * 0.5 / 300);
  margin-bottom: 15px;
  transition: font-size 0.3s ease;
  word-break: break-word;
  text-align: center;
  white-space: pre-line;
  line-height: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 150%;
  flex-grow: 1;
}

.folder-icon {
  margin-top: 0;
  font-size: calc(5rem + (100% - 200px) * 5 / 300);
  color: transparent;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: font-size 0.3s ease;
}

.icon-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: -20px;
}

.link-counter {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 16px;
  color: black;
}

.column {
  flex-shrink: 0;
  overflow: hidden;
  height: 100%;
}

.text-center {
  text-align: center;
}

.start-working-message,
.no-folders-message {
  color: white;
  font-size: 1.2rem;
  padding: 20px;
}

@media (max-width: 768px) {
  .folder-card {
    height: 150px;
    padding-top: 5px;
    padding-left: 10px;
    padding-right: 10px;
  }

  .folder-name {
    font-size: calc(0.8rem + (100% - 150px) * 0.5 / 300);
  }

  .folder-icon {
    font-size: calc(4rem + (100% - 150px) * 5 / 300);
  }
}
</style>