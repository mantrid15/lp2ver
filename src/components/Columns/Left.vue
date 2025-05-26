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
                <span class="items-counter">
                  {{ getItemsCount(folder.dir_hash) }}
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
    const itemsCounts = ref({});
    const draggedFolder = ref(null);

    const columnSize = computed(() => {
      const widthValue = parseFloat(props.width);
      if (widthValue > 22) return 4;
      if (widthValue > 14) return 6;
      return 12;
    });

    const getItemsCount = async (dirHash) => {
      if (!itemsCounts.value[dirHash]) {
        await updateItemsCount(dirHash);
      }
      return itemsCounts.value[dirHash] || 0;
    };

    const updateItemsCount = async (dirHash) => {
      try {
        const { count: foldersCount } = await supabase
          .from('dir')
          .select('*', { count: 'exact' })
          .eq('parent_hash', dirHash);

        const { count: linksCount } = await supabase
          .from('links')
          .select('*', { count: 'exact' })
          .eq('dir_hash', dirHash);

        itemsCounts.value[dirHash] = (foldersCount || 0) + (linksCount || 0);
      } catch (error) {
        console.error('Error counting items:', error);
        itemsCounts.value[dirHash] = 0;
      }
    };

    const childFolders = computed(() => {
      const parentHash = props.rightFolder?.dir_hash || props.selectedFolderHash;
      if (!parentHash) return [];
      return folders.value.filter(folder => folder.parent_hash === parentHash);
    });

    const fetchFolders = async () => {
      const { data, error } = await supabase
        .from('dir')
        .select('*')
        .eq('user_id', userId.value);

      if (error) {
        console.error('Ошибка при получении папок:', error);
      } else {
        folders.value = data || [];

        if (props.rightFolder?.dir_hash || props.selectedFolderHash) {
          const parentHash = props.rightFolder?.dir_hash || props.selectedFolderHash;
          const children = folders.value.filter(f => f.parent_hash === parentHash);

          for (const folder of children) {
            await updateItemsCount(folder.dir_hash);
          }
        }
      }
    };

    const isDefaultState = computed(() => {
      // Если rightFolder не передан (null) и selectedFolderHash тоже null
      return !props.rightFolder && !props.selectedFolderHash;
    });

    const shouldShowNoFoldersMessage = computed(() => {
      return (props.rightFolder || props.selectedFolderHash) &&
             childFolders.value.length === 0;
    });
    // Остальной код остается без изменений...
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
      const count = itemsCounts.value[folder.dir_hash] || 0;
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

    return {
      columnSize,
      childFolders,
      getItemsCount,
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

.items-counter {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 16px;
  color: black;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 2px 5px;
  border-radius: 3px;
}

.start-working-message {
  color: white;
  font-size: 1.5rem;
  padding: 40px 20px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
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