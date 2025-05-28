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

// Метод для подсчета элементов в таблице links для конкретной дочерней папки
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
      if (!props.selectedFolderHash) {
        childFoldersWithCounts.value = [];
        return;
      }

      // Шаг 1: Получаем все ссылки, где parent_hash равен dir_hash корневой папки
      const { data: links, error: linksError } = await supabase
          .from('links')
          .select('id, dir_hash')
          .eq('parent_hash', props.selectedFolderHash);

      if (linksError) {
        console.error('Ошибка при получении ссылок:', linksError);
        childFoldersWithCounts.value = [];
        return;
      }

      // Шаг 2: Получаем дочерние папки, где parent_hash равен selectedFolderHash
      const children = folders.value.filter(f => f.parent_hash === props.selectedFolderHash);

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
    // /Следим за изменениями selectedFolderHash и обновляем список
    watch(() => props.selectedFolderHash, updateChildFoldersWithCounts, { immediate: true });


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