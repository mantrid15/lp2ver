<template>
  <v-app :style="{ width: width, margin: '0 auto' }">
    <v-app-bar app color="red" dark>
      <div class="app-bar-container">
        <!-- Желтый модуль -->
        <div
            v-if="columnSize <= 4"
            class="yellow-box"
            @click="handleYellowBoxClick"
            @dragover.prevent
            @drop="handleDropOnYellowBox"
        >
          <div v-if="userId && account?.data?.session?.user?.email" class="user-info">
            Account: {{ maskedEmail }}
          </div>
        </div>
        <!-- Синий модуль с фильтром и сортировкой -->
        <div :class="['blue-box', { 'blue-box-small': columnSize === 1, 'blue-box-margin': columnSize === 6 }]">
          <div class="blue-content">
            <div style="position: relative; width: 80%;">
              <v-icon
                  v-if="filter"
                  @click="filter = ''"
                  class="clear-icon"
                  style="position: absolute; right: 0; cursor: pointer; color: black; top: 3px"
              >
                mdi-close-circle
              </v-icon>
              <input
                  v-model="filter"
                  placeholder="Фильтр"
                  class="filter-input"
                  :class="{ 'thick-cursor': isFocused }"
                  @focus="isFocused = true"
                  @blur="isFocused = false"
                  :style="{
                  width: '100%',
                  height: '30px',
                  padding: '1px',
                  borderRadius: '5px',
                  border: '1px solid #ccc'
                }"
              />
            </div>
            <div class="sort-icons" style="width: 20%;">
              <v-btn @click="cycleSort" icon>
                <v-icon color="white">{{ currentSortIcon }}</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
        <!-- Зеленый модуль -->
        <div :class="['green-box', { 'green-box-small': columnSize === 1 }]">
          <v-btn icon color="white" @click="openDialog" style="display: flex; justify-content: right; align-items: center; height: 100%; margin-left: 40px">
            <v-icon style="font-size: 36px;">mdi-folder-plus</v-icon>
          </v-btn>
          <v-btn icon color="white" @click="openFolderListDialog" style="position: relative; margin-left: auto;">
            <v-icon class="delete-icon" style="font-size: 18px; color: black; cursor: pointer;">mdi-delete</v-icon>
          </v-btn>
        </div>
      </div>
    </v-app-bar>
    <v-main>
      <v-container class="brown-background folders-container">
        <v-row>
          <v-col v-for="(folder, index) in filteredFolders"
                 :key="index"
                 :cols="columnSize"
                 class="folder-column"
                 @dragover.prevent @drop="onDrop(folder.dir_hash)">
            <v-card class="folder-card"
                    @click="handleFolderClick(folder)"
                    draggable="true"
                    @dragstart="handleDragStart($event, folder)"
                    @dragover.prevent="handleDragOver($event, folder)"
                    @drop="handleDrop($event, folder)"
                    @dragleave="handleDragLeave">
              <v-card-title class="folder-title">
                <div class="icon-container">
                  <v-icon class="folder-icon"
                          :style="{ background: getFolderColor(folder), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }">
                    mdi-folder
                  </v-icon>
                </div>
                <span class="folder-name" :style="{ fontSize: getFontSize(folder.dir_name) }">
                  {{ folder.dir_name }}
                </span>
                <span class="link-counter">
                  {{ linkCounts[folder.dir_hash] > 0 ? linkCounts[folder.dir_hash] : 0 }}
                </span>
                <span class="range-counter">
                  {{ folder.range }}
                </span>
              </v-card-title>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <CreateDirView :visible="dialog"
                   @update:visible="dialog = $event"
                   :newFolderName="newFolderName"
                   :errorMessage="errorMessage"
                   :successMessage="successMessage"
                   @close="closeDialog"
                   @create="createDirectory"
                   @update:newFolderName="newFolderName = $event" />
    <EditDirView :visible="folderListDialog"
                 :folders="folders"
                 :linkCounts="linkCounts"
                 :selectedFolderId="selectedFolderId"
                 @close="folderListDialog = false"
                 @editDirHash="editDirHash"
                 @clearDirHash="clearDirHash"
                 @update:selectedFolderId="selectedFolderId = $event"
                 @deleteFolder="deleteSelectedFolder"
                 @toggleFolder="toggleFolder"
                 @resetRadio="resetRadio"
                 @update:visible="folderListDialog = $event" />
  </v-app>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch, watchEffect } from 'vue';
import { useStore } from 'vuex';
import { supabase } from '@/clients/supabase.js';
import { VList, VListItem, VListItemTitle, VRadio } from 'vuetify/components';
import CreateDirView from '@/components/Dialogs/CreateDirView.vue';
import EditDirView from '@/components/Dialogs/EditDirView.vue';

const SORT_ASC_ICON = '↑';
const SORT_DESC_ICON = '↓';
const SORT_DEFAULT_ICON = '⇅';

export default {
  name: 'Right',
  components: {
    CreateDirView,
    EditDirView,
    VList,
    VListItem,
    VListItemTitle,
    VRadio
  },
  props: {
    width: {
      type: String,
      required: true
    },
    draggedLink: { // Принимаем draggedLink как пропс
      type: Object,
      default: null
    },
    links: {
      type: Array,
      required: true
    },
  },
  setup(props, { emit }) {
    let realtimeChannel = null;
    const draggedFolder = ref(null);

    const getFontSize = (folderName) => {
      const words = folderName.split(' ');
      const hasMultipleWords = words.length > 1;
      const isLong = folderName.length > 13;

      if (hasMultipleWords && isLong) {
        if (folderName.length > 27) { // Если очень длинное - уменьшаем на 20%
          return '80%';
        } else { // Если просто длинное - уменьшаем на 10%
          return '90%';
        }
      }
      return '100%'; // Стандартный размер
    };

    const handleDragStart = (event, folder) => {
      draggedFolder.value = folder;
      event.dataTransfer.setData('text/plain', folder.dir_hash);
      fetchFolders();
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
        console.log('Обновленные диапазоны перед отправкой в Supabase:', {
          dragged: {
            dir_hash: updatedFolders[draggedIndex].dir_hash,
            new_range: updatedFolders[draggedIndex].range
          },
          target: {
            dir_hash: updatedFolders[targetIndex].dir_hash,
            new_range: updatedFolders[targetIndex].range
          }
        });
        await updateFolderRanges([
          { dir_hash: updatedFolders[draggedIndex].dir_hash, range: updatedFolders[draggedIndex].range },
          { dir_hash: updatedFolders[targetIndex].dir_hash, range: updatedFolders[targetIndex].range }
        ]);
        folders.value = updatedFolders;
        await getLinkCount(targetFolder.dir_hash);
        selectedFolderHash.value = null;
        await fetchFolders();
      }
    };
    const updateFolderRanges = async (updates) => {
      try {
        for (const update of updates) {
          console.log(`Отправка обновления на Supabase для dir_hash: ${update.dir_hash}, range: ${update.range}`);
          const { error } = await supabase
              .from('dir')
              .update({ range: update.range })
              .eq('dir_hash', update.dir_hash);
          if (error) {
            console.error('Ошибка при обновлении папки:', update.dir_hash, error);
          } else {
            console.log('Обновлена папка:', update.dir_hash, 'с новым range:', update.range);
          }
        }
        await fetchFolders();
      } catch (error) {
        console.error('Ошибка при обновлении папок:', error);
      }
    };
    const handleYellowBoxClick = () => {
      console.log('Yellow box clicked');
      selectedFolderHash.value = null;
      emit('reset-folder-selection');
    };

    const sortedLinks = ref([...props.links]);
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const userEmail = computed(() => store.state.user.email);
    const dialog = ref(false);
    const folderListDialog = ref(false);
    const newFolderName = ref('');
    const folders = ref([]);
    const errorMessage = ref('');
    const successMessage = ref('');
    const account = ref();
    const filter = ref('');
    const currentSortOrder = ref(0);
    const sortOrderIcons = [SORT_DEFAULT_ICON, SORT_ASC_ICON, SORT_DESC_ICON];
    const sortOrderValues = ['default', 'asc', 'desc'];
    const selectedFolderId = ref(null);
    const linkCounts = ref({});
    const selectedFolder = ref(null);
    const selectedFolderHash = ref(null);

    // Добавляем вычисляемое свойство для текущей выбранной папки
    const currentFolder = computed(() => {
      if (selectedFolderHash.value) {
        return folders.value.find(folder => folder.dir_hash === selectedFolderHash.value) || null;
      }
      return null;
    });

    const getFolderColor = (folder) => {
      const count = linkCounts.value[folder.dir_hash] || 0;
      if (selectedFolderHash.value === folder.dir_hash) {
        return count > 0
            ? 'linear-gradient(to bottom, #76c7c0, #4caf50)'
            : 'linear-gradient(to bottom, #ff7f7f, #ff4c4c)';
      } else {
        return 'linear-gradient(to bottom, #f0e68c, #d2b48c)';
      }
    };

    const handleFolderClick = (folder) => {
      if (selectedFolderHash.value === folder.dir_hash) {
        selectedFolderHash.value = null;
      } else {
        selectedFolderHash.value = folder.dir_hash;
      }
      emit('folder-selected', folder.dir_hash);
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
          sortedLinks.value = sortedLinks.value.filter(link => link.id !== linkToUpdate.id);
          emit('update-dragged-link', null);
        } catch (error) {
          console.error('Ошибка при обновлении ссылки:', error);
        }
      }
    };

    const resetRadio = () => {
      selectedFolderId.value = null;
    };

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        folderListDialog.value = false;
        resetRadio();
      }
      if (event.key === 'Escape' && filter.value.trim() !== '') {
        filter.value = '';
      }
    };

    const columnSize = computed(() => {
      const widthValue = parseFloat(props.width);
      if (widthValue > 22) {
        return 4;
      } else if (widthValue > 14) {
        return 6;
      } else {
        return 12;
      }
    });

    const maskedEmail = computed(() => {
      const email = account.value?.data?.session?.user?.email;
      if (!email) return '';
      const [localPart, domainPart] = email.split('@');
      const firstTwoChars = localPart.slice(0, 2);
      const lastCharBeforeAt = localPart.slice(-1);
      const lastTwoCharsOfDomain = domainPart.slice(-2);
      return `${firstTwoChars}***${lastCharBeforeAt}@***${lastTwoCharsOfDomain}`;
    });

    const hasFilter = computed(() => {
      return filter.value.trim() !== '';
    });

    const currentSortIcon = computed(() => {
      return sortOrderIcons[currentSortOrder.value];
    });

    watch(folders, (newFolders) => {
      newFolders.forEach(folder => {
        getLinkCount(folder.dir_hash);
      });
    }, { immediate: true });

    const hashString = async (inputString) => {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(inputString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
        return hashHex;
      } catch (error) {
        console.error('Ошибка при вычислении хеша:', error);
        throw error;
      }
    };

    const fetchFolders = async () => {
      try {
        const { data, error } = await supabase
            .from('dir')
            .select('*')
            .eq('user_id', userId.value);
        if (error) throw error;
        folders.value = data || [];
        console.log('Полученные директории:', folders.value);
      } catch (error) {
        console.error('Ошибка при получении директорий:', error);
      }
    };

    const filteredFolders = computed(() => {
      let result = folders.value.filter(folder =>
          // folder.dir_name.toLowerCase().includes(filter.value.toLowerCase())
      folder.dir_name.toLowerCase().includes(filter.value.toLowerCase()) && folder.parent_hash === null
      );
      result.sort((a, b) => a.range - b.range);
      if (sortOrderValues[currentSortOrder.value] === 'asc') {
        result.sort((a, b) => a.id - b.id);
      } else if (sortOrderValues[currentSortOrder.value] === 'desc') {
        result.sort((a, b) => b.id - a.id);
      }
      return result;
    });

    const cycleSort = () => {
      currentSortOrder.value = (currentSortOrder.value + 1) % sortOrderIcons.length;
    };

    const createDirectory = async () => {
      try {
        if (!newFolderName.value.trim()) return;

        const upperCaseFolderName = newFolderName.value.toUpperCase();
        const dirHash = await hashString(upperCaseFolderName);

        // Шаг 1: Проверяем, есть ли запись с parent_hash = NULL и таким же dir_hash
        const hasNullParentHash = await checkParentHashForDir(dirHash);
        if (hasNullParentHash) {
          errorMessage.value = 'Нельзя создать: уже есть запись с таким именем и пустым parent_hash.';
          setTimeout(() => errorMessage.value = '', 3000);
          return;
        }

        // Шаг 2: Проверяем, есть ли вообще запись с таким dir_hash и dir_name
        const { data: existingRecords, error } = await supabase
            .from('dir')
            .select('*')
            .eq('dir_hash', dirHash)
            .eq('dir_name', upperCaseFolderName);

        if (error) throw error;

        if (existingRecords.length > 0) {
          errorMessage.value = 'Нельзя создать: запись с таким именем уже существует.';
          setTimeout(() => errorMessage.value = '', 3000);
          return;
        }

        // Шаг 3: Создаём новую запись
        const { data, error: insertError } = await supabase
            .from('dir')
            .insert([
              {
                dir_name: upperCaseFolderName,
                dir_hash: dirHash,
                user_id: userId.value,
                range: await getNewRange()
              }
            ])
            .select();

        if (insertError) throw insertError;

        successMessage.value = 'Директория успешно создана!';
        setTimeout(closeDialog, 1000);

      } catch (error) {
        console.error('Ошибка при создании директории:', error);
        errorMessage.value = 'Произошла ошибка при создании директории.';
        setTimeout(() => errorMessage.value = '', 3000);
      }
    };

    const checkExistingDirWithParentHash = async (dirHash) => {
      try {
        const { data, error } = await supabase
            .from('dir')
            .select('*')
            .eq('dir_hash', dirHash)
            .neq('parent_hash', null); // Проверяем наличие записи с ненулевым parent_hash
        if (error) throw error;
        return data.length > 0; // Если есть записи с ненулевым parent_hash
      } catch (error) {
        console.error('Ошибка при проверке существующего dir_hash с ненулевым parent_hash:', error);
        return false;
      }
    };

    const checkParentHashForDir = async (dirHash) => {
      try {
        const { data, error } = await supabase
            .from('dir')
            .select('*')
            .eq('parent_hash', null)
            .eq('dir_hash', dirHash);
        if (error) throw error;
        return data.length > 0;
      } catch (error) {
        console.error('Ошибка при проверке parent_hash:', error);
        return false;
      }
    };

    const getNewRange = async () => {
      try {
        const { data, error } = await supabase
            .from('dir')
            .select('range') // Получаем текущие значения range
            .is('parent_hash', null) // Фильтруем по parent_hash NULL
            .order('range', { ascending: true }); // Сортируем по возрастанию

        if (error) throw error;

        // Получаем максимальный диапазон и добавляем 1
        const maxRange = data.length > 0 ? Math.max(...data.map(folder => folder.range)) : 0;
        return maxRange + 1; // Возвращаем новый диапазон
      } catch (error) {
        console.error('Ошибка при получении нового диапазона:', error);
        return 1; // Возвращаем 1, если произошла ошибка
      }
    };

    const deleteFolderByDirHash = async (dirHash) => {
      try {
        const { error: updateLinksError } = await supabase
            .from('links')
            .update({ dir_hash: null })
            .eq('dir_hash', dirHash);
        if (updateLinksError) {
          throw updateLinksError;
        }
        const { error: deleteFolderError } = await supabase
            .from('dir')
            .delete()
            .eq('dir_hash', dirHash);
        if (deleteFolderError) {
          throw deleteFolderError;
        }
        const { data: remainingFolders, error: fetchFoldersError } = await supabase
            .from('dir')
            .select('*')
            .order('range', { ascending: true });
        if (fetchFoldersError) {
          throw fetchFoldersError;
        }
        const updates = remainingFolders.map((folder, index) => ({
          dir_hash: folder.dir_hash,
          range: index + 1
        }));
        for (const update of updates) {
          const { error: updateRangeError } = await supabase
              .from('dir')
              .update({ range: update.range })
              .eq('dir_hash', update.dir_hash);
          if (updateRangeError) {
            throw updateRangeError;
          }
        }
        await fetchFolders();
        successMessage.value = 'Папка и связанные ссылки успешно обновлены!';
        setTimeout(() => {
          successMessage.value = '';
        }, 2000);
      } catch (error) {
        console.error('Ошибка при обновлении ссылок или удалении папки:', error);
        errorMessage.value = 'Ошибка при обновлении ссылок или удалении папки!';
        setTimeout(() => {
          errorMessage.value = '';
        }, 2000);
      }
    };
    const deleteSelectedFolder = async () => {
      if (selectedFolderId.value) {
        const folderToDelete = folders.value.find(folder => folder.id === selectedFolderId.value);
        if (folderToDelete) {
          await deleteFolderByDirHash(folderToDelete.dir_hash);
          selectedFolderId.value = null;
          resetRadio();
        }
      }
    };
    const openDialog = () => {
      console.log('Открываем диалоговое окно');
      dialog.value = true;
      errorMessage.value = '';

      successMessage.value = '';
    };
    const closeDialog = () => {
      dialog.value = false;
      newFolderName.value = '';
      errorMessage.value = '';
      successMessage.value = '';
    };
    const openFolderListDialog = () => {
      resetRadio();
      folderListDialog.value = true;
    };
    const setSelectedFolder = (folderId) => {
      selectedFolderId.value = folderId;
    };
    const toggleFolder = (folderId) => {
      if (selectedFolderId.value === folderId) {
        selectedFolderId.value = null;
      } else {
        selectedFolderId.value = folderId;
      }
    };
    async function getSession() {
      account.value = await supabase.auth.getSession();
      // console.log(account.value);
    }
    const clearDirHash = async () => {
      try {
        if (selectedFolderId.value) {
          const folderToClear = folders.value.find(folder => folder.id === selectedFolderId.value);
          if (folderToClear) {
            const { error: updateLinksError } = await supabase
                .from('links')
                .update({ dir_hash: null })
                .eq('dir_hash', folderToClear.dir_hash);
            if (updateLinksError) throw updateLinksError;
            for (const folder of folders.value) {
              await getLinkCount(folder.dir_hash);
            }
            selectedFolderId.value = null;
            resetRadio();
          }
        } else {
          const { error } = await supabase
              .from('links')
              .update({ dir_hash: null })
              .neq('dir_hash', null);
          if (error) throw error;
          for (const folder of folders.value) {
            await getLinkCount(folder.dir_hash);
          }
        }
      } catch (error) {
        console.error('Ошибка при очистке dir_hash:', error);
      }
    };
    const getLinkCount = async (dirHash) => {
      try {
        if (!dirHash) {
          console.warn('dirHash не указан');
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
    const handleDropOnYellowBox = async (event) => {
      if (props.draggedLink) {
        const linkToUpdate = props.draggedLink;
        try {
          const { error } = await supabase
              .from('links')
              .update({ dir_hash: null })
              .eq('id', linkToUpdate.id);
          if (error) throw error;
          if (linkToUpdate.dir_hash) {
            await getLinkCount(linkToUpdate.dir_hash);
          }
          sortedLinks.value = sortedLinks.value.filter(link => link.id !== linkToUpdate.id);
          emit('update-dragged-link', null);
        } catch (error) {
          console.error('Ошибка при обновлении ссылки:', error);
        }
      }
    };
    const editDirHash = () => {
      // Если требуется дополнительная логика для редактирования, реализуйте здесь
      console.log('editDirHash triggered');
    };

    onMounted(() => {
      fetchFolders();
      subscribeToRealtimeChanges();
      getSession();
      window.addEventListener('keydown', handleKeydown);
      folders.value.forEach(folder => {
        getLinkCount(folder.dir_hash);
      });
    });
    onUnmounted(() => {
      unsubscribeFromRealtimeChanges();
      window.removeEventListener('keydown', handleKeydown);
    });
    watchEffect(() => {
      folders.value.forEach(folder => {
        getLinkCount(folder.dir_hash);
      });
    });
    watch(dialog, (newVal) => {
      console.log('dialog changed:', newVal);
    });
    const subscribeToRealtimeChanges = () => {
      realtimeChannel = supabase
          .channel('realtime-changes')
          .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'links' },
              (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                  if (payload.new.dir_hash) {
                    getLinkCount(payload.new.dir_hash);
                  }
                } else if (payload.eventType === 'DELETE') {
                  if (payload.old.dir_hash) {
                    getLinkCount(payload.old.dir_hash);
                  }
                }
              }
          )
          .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'dir' },
              (payload) => {
                if (payload.eventType === 'INSERT') {
                  if (payload.new.user_id === userId.value) {
                    folders.value.push(payload.new);
                  }
                } else if (payload.eventType === 'UPDATE') {
                  const index = folders.value.findIndex(folder => folder.id === payload.new.id);
                  if (index !== -1) {
                    folders.value[index] = payload.new;
                  }
                } else if (payload.eventType === 'DELETE') {
                  folders.value = folders.value.filter(folder => folder.id !== payload.old.id);
                }
              }
          )
          .subscribe();
    };
    const unsubscribeFromRealtimeChanges = () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };

    return {
      getFontSize,
      draggedFolder,
      openDialog,
      handleDragLeave,
      handleDragStart,
      handleDragOver,
      handleDrop,
      updateFolderRanges,
      getFolderColor,
      selectedFolder,
      handleFolderClick,
      handleDropOnYellowBox,
      sortedLinks,
      onDrop,
      userId,
      dialog,
      folderListDialog,
      newFolderName,
      folders,
      errorMessage,
      successMessage,
      filter,
      filteredFolders,

      currentFolder,

      createDirectory,
      checkExistingDirWithParentHash,
      checkParentHashForDir,
      getNewRange,

      closeDialog,
      openFolderListDialog,
      columnSize,
      hasFilter,
      currentSortIcon,
      cycleSort,
      selectedFolderId,
      deleteSelectedFolder,
      setSelectedFolder,
      toggleFolder,
      clearDirHash,
      userEmail,
      maskedEmail,
      account,
      isFocused: false,
      linkCounts,
      handleYellowBoxClick,
      getLinkCount,
      editDirHash,
      resetRadio,
      subscribeToRealtimeChanges,
      unsubscribeFromRealtimeChanges
    };
  }
};
</script>

<style scoped>
.icon-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: -20px; /* Поднимаем иконку еще выше */
  .icon-container {
    margin-top: 0; /* Уберите отрицательный margin */
    align-items: flex-start; /* Выравнивание по верхнему краю */
  }
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
.scrollable-content {
  max-height: 400px;
  overflow-y: auto;
}
.fixed-actions {
  position: sticky;
  bottom: 0;
  background-color: white;
  z-index: 1;
}
.user-info {
  padding: 2px;
  color: black;
  font-size: 0.7rem;
  margin-top: 0;
  pointer-events: none;
}
.yellow-box {
  flex: 1;
  height: 40px;
  background-color: yellow;
  margin-right: 5px;
  margin-left: 5px;
  display: flex;
  align-items: flex-start;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.yellow-box:hover {
  background-color: #d8bfd8;
}
.filter-input {
  margin-left: 5px;
  background-color: white;
  padding: 0;
  border: 1px solid #883030;
  border-radius: 5px;
  transition: border-color 0.3s;
}
.thick-caret {
  position: absolute;
  width: 4px;
  height: 1em;
  background-color: black;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
.filter-input:focus {
  border-color: black;
  background-color: #ffae00;
  outline: none;
}
.app-bar-container {
  display: flex;
  align-items: center;
  width: 100%;
}
.blue-box {
  flex: 1;
  height: 40px;
  background-color: blue;
  margin-right: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
}
.blue-box-small {
  flex: 0.67;
}
.blue-box-margin {
  margin-left: 5px;
}
.blue-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.green-box {
  flex: 1;
  height: 40px;
  background-color: green;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 5px;
  border-radius: 5px;
}
.green-box-small {
  flex: 0.33;
}
.brown-background {
  background-color: brown;
  height: 100%;
  padding: 0;
  overflow-y: auto;
  max-height: calc(100vh - 64px);
}
.folders-container {
  height: 90%;
  padding: 3% 10px 5%;
}
.folder-card {
  background-color: #fff;
  border: 2px solid #000000;
  border-radius: 4px;
  padding: 5px; /* Уменьшенный padding */
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
  /*
  align-items: flex-start; !* Выравнивание по верхнему краю *!
  */
  /*
  padding-top: 0; !* Уберите верхний padding *!
  */
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
  flex-grow: 1; /* Позволяет названию занимать доступное пространство */
}
.folder-icon {
  margin-top: 0; /* Уберите лишние отступы */

  font-size: calc(5rem + (100% - 200px) * 5 / 300);
  color: transparent;
  background: linear-gradient(to bottom, #f0e68c, #d2b48c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: font-size 0.3s ease;
}
.link-counter {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 16px;
  color: black;
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
.brown-background::-webkit-scrollbar {
  width: 15px;
}
.brown-background::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}
.brown-background::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}
.brown-background::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}
.sort-icons {
  margin-right: 10px;
  color: white;
}
.truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>