<template>
  <div class="column column-1" :style="{ width: width }">
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
              v-for="folder in displayedFolders"
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
    <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
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
    },
    linkCounts: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, { emit }) {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const folders = ref([]);
    const childFoldersWithCounts = ref([]);
    const draggedFolder = ref(null);
    const selectedFolderHash = ref(null);

    const snackbar = ref({
      show: false,
      message: '',
      color: 'error'
    });

    const showSnackbar = (message, color = 'error') => {
      snackbar.value = { show: true, message, color };
      setTimeout(() => {
        snackbar.value.show = false;
      }, 3000);
    };

    const columnSize = computed(() => {
      const widthValue = parseFloat(props.width);
      if (widthValue > 22) return 4;
      if (widthValue > 14) return 6;
      return 12;
    });
    // Отображаемые папки - либо дочерние, либо корневые
    const displayedFolders = computed(() => {
      if (props.rightFolder) {
        // Показываем дочерние папки корневой папки с количеством элементов из linkCounts
        return folders.value
            .filter(f => f.parent_hash === props.rightFolder.dir_hash)
            .map(folder => ({
              ...folder,
              itemsCount: props.linkCounts[folder.dir_hash] || 0
            }));
      }

      // if (!props.selectedFolderHash) {
      //   return folders.value.filter(f => f.parent_hash === null);
      // }

      return [];
    });

    const selectFolder = (folder) => {
      // Передаем и dir_hash выбранной папки и parent_hash (который равен dir_hash из Right)
      emit('folder-selected', {
        dir_hash: folder.dir_hash,
        parent_hash: props.rightFolder?.dir_hash
      });
    };


    const getFolderColor = (folder) => {
      // Если выбрана корневая папка из Right
      if (props.rightFolder) {
        // Зеленый цвет только для выбранной дочерней папки
        if (props.selectedFolderHash === folder.dir_hash) {
          return 'linear-gradient(to bottom, #76c7c0, #4caf50)';
        }
        // Желтый цвет для остальных дочерних папок корневой папки
        if (folder.parent_hash === props.rightFolder.dir_hash) {
          return 'linear-gradient(to bottom, #f0e68c, #d2b48c)';
        }
      }

      // Зеленый цвет для выбранной папки (если не в режиме Right)
      if (props.selectedFolderHash === folder.dir_hash) {
        return 'linear-gradient(to bottom, #76c7c0, #4caf50)';
      }

      // Стандартный желтый цвет для остальных папок
      return 'linear-gradient(to bottom, #f0e68c, #d2b48c)';
    };
    // Обновление списка дочерних папок с подсчетом элементов
    const updateChildFoldersWithCounts = async () => {
      // Используем props.selectedFolderHash вместо локального состояния
      const parentHash = props.selectedFolderHash || props.rightFolder?.dir_hash;
    };

    const onDrop = async (dirHash) => {
      if (props.draggedLink) {
        const link = props.draggedLink;

        if (link.parent_hash === props.rightFolder?.dir_hash &&
            link.dir_hash === dirHash) {
          showSnackbar("Ссылка уже лежит где надо! Тысяча чертей!!!");
          return;
        }

        try {
          const { error } = await supabase
            .from('links')
            .update({
              parent_hash: props.rightFolder?.dir_hash || null,
              dir_hash: dirHash
            })
            .eq('id', link.id);

          if (error) throw error;

          emit('update-dragged-link', null);
        } catch (error) {
          console.error('Ошибка при обновлении ссылки:', error);
          showSnackbar("Ошибка при перемещении ссылки");
        }
      }
    };

    const fetchFolders = async () => {
      // console.log('Запрос папок для userId:', userId.value);
      const { data, error } = await supabase
          .from('dir')
          .select('*')
          .eq('user_id', userId.value);
      if (error) {
        console.error('Ошибка при запросе папок:', error);
      } else {
        // console.log('Полученные папки:', data);
        folders.value = data || [];
        await updateChildFoldersWithCounts();
      }
    };

    const isDefaultState = computed(() => {
      return !props.rightFolder && !props.selectedFolderHash;
    });

    const shouldShowNoFoldersMessage = computed(() => {
      return (props.rightFolder || props.selectedFolderHash) &&
        displayedFolders.value.length === 0;
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

    onMounted(fetchFolders);
    watch(() => props.rightFolder, fetchFolders);
    watch(() => props.selectedFolderHash, fetchFolders);

    return {
      columnSize,
      displayedFolders,
      isDefaultState,
      shouldShowNoFoldersMessage,
      getFontSize,
      getFolderColor,
      selectFolder,
      handleDragStart,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      onDrop,
      snackbar
    };
  }
};
</script>

<style scoped>
.column {
  flex-shrink: 0;
  overflow: hidden;
  height: 100%;
  background: #b8c8f1;
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