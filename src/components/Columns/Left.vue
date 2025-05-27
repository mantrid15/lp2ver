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
                <span class="items-counter">
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

    const columnSize = computed(() => {
      const widthValue = parseFloat(props.width);
      if (widthValue > 22) return 4;
      if (widthValue > 14) return 6;
      return 12;
    });

    const getItemsCount = async (dirHash) => {
      try {
        const { count: foldersCount } = await supabase
            .from('dir')
            .select('*', { count: 'exact' })
            .eq('parent_hash', dirHash);

        const { count: linksCount } = await supabase
            .from('links')
            .select('*', { count: 'exact' })
            .eq('dir_hash', dirHash);

        return (foldersCount || 0) + (linksCount || 0);
      } catch (error) {
        console.error('Error counting items:', error);
        return 0;
      }
    };

    const updateChildFoldersWithCounts = async () => {
      const parentHash = props.rightFolder?.dir_hash || props.selectedFolderHash;
      if (!parentHash) {
        childFoldersWithCounts.value = [];
        return;
      }

      const children = folders.value.filter(f => f.parent_hash === parentHash);
      const childrenWithCounts = await Promise.all(
          children.map(async folder => ({
            ...folder,
            itemsCount: await getItemsCount(folder.dir_hash)
          }))
      );

      childFoldersWithCounts.value = childrenWithCounts;
    };

    const fetchFolders = async () => {
      const { data, error } = await supabase
          .from('dir')
          .select('*')
          .eq('user_id', userId.value);

      if (error) {
        console.error('Ошибка при получении папок:', error);
      } else {
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
      return folder.itemsCount > 0
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
/* Все стили остаются без изменений */
</style>