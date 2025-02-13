
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
            <div style="position: relative; width: '80%';">
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
                  :style="{ width: '100%', height: '30px', padding: '1px', borderRadius: '5px', border: '1px solid #ccc' }"
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
          <v-col
              v-for="(folder, index) in filteredFolders"
              :key="index"
              :cols="columnSize"
              class="folder-column"
              @dragover.prevent
              @drop="onDrop(folder.dir_hash)"
          >
            <v-card
                class="folder-card"
                @click="handleFolderClick(folder)"
                draggable="true"
                @dragstart="handleDragStart($event, folder)"
                @dragover.prevent="handleDragOver($event, folder)"
                @drop="handleDrop($event, folder)"
                @dragleave="handleDragLeave"
            >
              <v-card-title class="folder-title">
                <v-icon
                    class="folder-icon"
                    :style="{ background: getFolderColor(folder), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }"
                >
                  mdi-folder
                </v-icon>
                <span class="folder-name">{{ folder.dir_name }}</span>
                <span class="link-counter">
                  {{ linkCounts[folder.dir_hash] > 0 ? linkCounts[folder.dir_hash] : 0 }}
</span>
              </v-card-title>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <!-- Диалоговое окно для создания новой директории -->
    <v-dialog v-model="dialog" max-width="400px">
      <v-card>
        <v-card-title class="headline">Создание новой директории</v-card-title>
        <v-card-text>
          <v-text-field v-model="newFolderName" label="Название директории" required></v-text-field>
          <v-alert v-if="errorMessage" type="error" class="mt-4">{{ errorMessage }}</v-alert>
          <v-alert v-if="successMessage" type="success" class="mt-4">{{ successMessage }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="closeDialog">Отмена</v-btn>
          <v-btn color="green darken-1" text @click="createDirectory">Создать директорию</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Диалоговое окно для отображения списка папок -->
    <v-dialog v-model="folderListDialog" max-width="300px">
      <v-card>
        <v-card-title class="headline">Список папок</v-card-title>
        <v-btn
            icon
            @click="clearDirHash"
            style="position: absolute; top: 0px; right: 0px; cursor: pointer; color: red;">
          <v-icon style="font-size: 18px;">mdi-delete</v-icon>
        </v-btn>
        <v-card-text>
          <v-list>
            <v-list-item v-for="(folder, index) in folders" :key="index"
                         style="margin: 0; min-height: 20px;  align-items: center;">
              <v-list-item-title
                  :style="{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: linkCounts[folder.dir_hash] > 0 ? 'green' : 'red',
      width: '100%',
      padding: '1px'
    }"
              >
                <div style="flex-grow: 1; display: flex; align-items: center; max-width: calc(100% - 50px);">
                  <v-radio
                      :value="folder.id"
                      v-model="selectedFolderId"
                      color="primary"
                      @change="setSelectedFolder(folder.id)"
                      @click.stop="toggleFolder(folder.id)"
                  ></v-radio>
                  <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ folder.dir_name }}</span>
                </div>

                <!-- Прижимаем количество ссылок к правому краю -->
                <span style="color: white;">
      {{ linkCounts[folder.dir_hash] > 0 ? linkCounts[folder.dir_hash] : 0 }}
    </span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="folderListDialog = false">Закрыть</v-btn>
          <v-btn color="red darken-1" text @click="deleteSelectedFolder" :disabled="!selectedFolderId">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>
<script>
import { computed, ref, onMounted, onUnmounted, watch, watchEffect } from 'vue';
import { useStore } from 'vuex';
import { supabase } from '@/clients/supabase.js';
import { VList, VListItem,VListItemTitle, VRadio } from 'vuetify/components';

const SORT_ASC_ICON = '↑';
const SORT_DESC_ICON = '↓';
const SORT_DEFAULT_ICON = '⇅';


export default {
  components: {
    VList,
    VListItem,
    VListItemTitle,
    VRadio
  },
  name: 'Right',
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
    const draggedFolder = ref(null); // Переменная для хранения перетаскиваемой папки

    const handleDragStart = (event, folder) => {
      draggedFolder.value = folder; // Сохраняем перетаскиваемую папку
      event.dataTransfer.setData('text/plain', folder.dir_hash); // Устанавливаем данные для перетаскивания
    };
    const handleDragLeave = (event) => {
      event.currentTarget.style.opacity = '1'; // Восстанавливаем прозрачность при выходе курсора
    };

    const handleDragOver = (event, folder) => {
      event.preventDefault(); // Разрешаем перетаскивание
      if (draggedFolder.value && draggedFolder.value.dir_hash !== folder.dir_hash) {
        // Подсветка или другие визуальные эффекты при наведении
        event.currentTarget.style.opacity = '0.5';
      }
    };

    const handleDrop = async (event, targetFolder) => {
      event.preventDefault();

      // Сбрасываем стили (возвращаем opacity к исходному значению)
      event.currentTarget.style.opacity = '1';
      // Проверяем, удерживается ли клавиша Ctrl
      if (!event.ctrlKey) {
        console.log('Перетаскивание отменено, удерживайте Ctrl для выполнения операции.');
        return; // Отменяем действие, если Ctrl не нажата
      }

      if (draggedFolder.value && draggedFolder.value.dir_hash !== targetFolder.dir_hash) {
        const updatedFolders = [...folders.value];

        // Находим индексы перетаскиваемой и целевой папок
        const draggedIndex = updatedFolders.findIndex(f => f.dir_hash === draggedFolder.value.dir_hash);
        const targetIndex = updatedFolders.findIndex(f => f.dir_hash === targetFolder.dir_hash);

        if (draggedIndex === -1 || targetIndex === -1) return; // Проверка на ошибки

        // Сохраняем старый диапазон
        const draggedFolderRange = updatedFolders[draggedIndex].range;
        const targetFolderRange = updatedFolders[targetIndex].range;

        // Обновляем диапазоны
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

        // Обновляем только измененные диапазоны в базе данных
        await updateFolderRanges([
          { dir_hash: updatedFolders[draggedIndex].dir_hash, range: updatedFolders[draggedIndex].range },
          { dir_hash: updatedFolders[targetIndex].dir_hash, range: updatedFolders[targetIndex].range }
        ]);

        // Обновляем локальное состояние
        folders.value = updatedFolders;
      }
    };

// Метод для обновления только целевых диапазонов
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
      } catch (error) {
        console.error('Ошибка при обновлении папок:', error);
      }
    };


    const handleYellowBoxClick = () => {
      console.log('Yellow box clicked'); // Добавьте лог для проверки
      selectedFolderHash.value = null; // Сбрасываем выбранную папку
      emit('reset-folder-selection'); // Эмитим событие для сброса выбранной папки
    };

    const sortedLinks = ref([...props.links]); // Создаем реактивное состояние на основе переданных ссылок

    const store = useStore();
    const userId = computed(() => store.state.userId);
    const userEmail = computed(() => store.state.user.email);
    const dialog = ref(false);
    const folderListDialog = ref(false);
    const newFolderName = ref('');
    const folders = ref([]);
    const errorMessage = ref('');
    const successMessage = ref('');
    let realtimeChannel = null;

    const account = ref();

    const filter = ref('');
    const currentSortOrder = ref(0);
    const sortOrderIcons = [SORT_DEFAULT_ICON, SORT_ASC_ICON, SORT_DESC_ICON];
    const sortOrderValues = ['default', 'asc', 'desc'];
    const selectedFolderId = ref(null);
    // const linkCounts = ref({}); // Хранит количество ссылок для каждой папки
    const linkCounts = ref({}); // Инициализация
    const selectedFolder = ref(null); // Добавляем состояние для выбранной папки
    const selectedFolderHash = ref(null); // Храним dir_hash выбранной папки

    const getFolderColor = (folder) => {
      const count = linkCounts.value[folder.dir_hash] || 0; // Получаем количество ссылок для папки
      if (selectedFolderHash.value === folder.dir_hash) {
        return count > 0
            ? 'linear-gradient(to bottom, #76c7c0, #4caf50)' // Зеленый градиент
            : 'linear-gradient(to bottom, #ff7f7f, #ff4c4c)'; // Красный градиент
      } else {
        return 'linear-gradient(to bottom, #f0e68c, #d2b48c)'; // Исходный градиент
      }
    };

    const handleFolderClick = (folder) => {
      if (selectedFolderHash.value === folder.dir_hash) {
        // Если папка уже выбрана, сбрасываем выбор
        selectedFolderHash.value = null;
      } else {
        // Иначе выбираем новую папку
        selectedFolderHash.value = folder.dir_hash;
      }
      emit('folder-selected', folder.dir_hash); // Эмитим событие с dir_hash выбранной папки
    };
    // const draggedLink = ref(null); // Объявляем draggedLink здесь
    const onDrop = async (dirHash) => {
      if (props.draggedLink) {
        const linkToUpdate = props.draggedLink;
        try {
          const { error } = await supabase
              .from('links')
              .update({ dir_hash: dirHash })
              .eq('id', linkToUpdate.id);
          if (error) throw error;
          // Обновляем количество ссылок для целевой папки
          await getLinkCount(dirHash);
// Также обновляем количество ссылок для исходной папки
          if (linkToUpdate.dir_hash) {
            await getLinkCount(linkToUpdate.dir_hash);
          }
          // Удалите ссылку из sortedLinks
          sortedLinks.value = sortedLinks.value.filter(link => link.id !== linkToUpdate.id);
        } catch (error) {
          console.error('Ошибка при обновлении ссылки:', error);
        }
      }
    };

    const handleKeydown = (event) => {
      if (event.key === 'Escape' && filter.value.trim() !== '') {
        filter.value = ''; // Очищаем поле ввода
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
        getLinkCount(folder.dir_hash); // Вызываем getLinkCount для каждой новой папки
      });
    }, { immediate: true }); // immediate: true вызывает коллбэк сразу при монтировании

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

    const checkHashUniqueness = async (dirHash) => {
      try {
        const { data, error } = await supabase
            .from('dir')
            .select('*')
            .eq('dir_hash', dirHash)
            .eq('user_id', userId.value);
        if (error) throw error;
        console.log('Результат проверки уникальности:', data);
        return data.length === 0;
      } catch (error) {
        console.error('Ошибка при проверке уникальности хеша:', error);
        return false;
      }
    };

    const filteredFolders = computed(() => {
      let result = folders.value.filter(folder =>
          folder.dir_name.toLowerCase().includes(filter.value.toLowerCase())
      );

      // Сортировка по умолчанию по полю range в порядке asc
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
        if (newFolderName.value.trim()) {
          const upperCaseFolderName = newFolderName.value.toUpperCase();
          const dirHash = await hashString(upperCaseFolderName);
          const isUnique = await checkHashUniqueness(dirHash);
          if (!isUnique) {
            errorMessage.value = 'Директория с таким именем уже существует!';
            setTimeout(() => {
              errorMessage.value = '';
            }, 2000);
            return;
          }
          const { data, error } = await supabase
              .from('dir')
              .insert([
                {
                  dir_name: upperCaseFolderName,
                  dir_hash: dirHash,
                  user_id: userId.value
                }
              ]);
          if (error) {
            errorMessage.value = 'Ошибка при создании директории!';
            setTimeout(() => {
              errorMessage.value = '';
            }, 2000);
            console.error('Ошибка при создании директории:', error);
            return;
          }
          console.log('Ответ от Supabase:', data);
          successMessage.value = 'Директория создана!';
          setTimeout(() => {
            closeDialog();
          }, 1000);
        }
      } catch (error) {
        console.error('Необработанная ошибка при создании директории:', error);
        errorMessage.value = 'Произошла неизвестная ошибка при создании директории!';
        setTimeout(() => {
          errorMessage.value = '';
        }, 2000);
      }
    };

    const deleteFolderByDirHash = async (dirHash) => {
      try {
        // Сначала обновляем ссылки в таблице links, устанавливая dir_hash в NULL
        const { error: updateLinksError } = await supabase
            .from('links')
            .update({ dir_hash: null }) // Устанавливаем dir_hash в NULL
            .eq('dir_hash', dirHash); // Удаляем по dir_hash

        if (updateLinksError) {
          throw updateLinksError;
        }

        // Затем удаляем папку из таблицы dir по dir_hash
        const { error: deleteFolderError } = await supabase
            .from('dir')
            .delete()
            .eq('dir_hash', dirHash); // Удаляем по dir_hash

        if (deleteFolderError) {
          throw deleteFolderError;
        }

        // Обновляем список папок после удаления
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
        // Находим dir_hash выбранной папки
        const folderToDelete = folders.value.find(folder => folder.id === selectedFolderId.value);
        if (folderToDelete) {
          await deleteFolderByDirHash(folderToDelete.dir_hash); // Обновляем ссылки и удаляем папку
          selectedFolderId.value = null;
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

    const openFolderListDialog = () => {
      folderListDialog.value = true;
    };

    const setSelectedFolder = (folderId) => {
      selectedFolderId.value = folderId;
    };

    const toggleFolder = (folderId) => {
      if (selectedFolderId.value === folderId) {
        selectedFolderId.value = null; // Снять выбор, если уже выбран
      } else {
        selectedFolderId.value = folderId; // Установить выбор
      }
    };

    async function getSession() {
      account.value = await supabase.auth.getSession();
      console.log(account.value);
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
            if (updateLinksError) {
              throw updateLinksError;
            }
            // Обновляем количество ссылок для всех папок
            for (const folder of folders.value) {
              await getLinkCount(folder.dir_hash);
            }
            // Сбрасываем выбранную папку
            selectedFolderId.value = null; // Это должно снять выделение
          }
        } else {
          const { error } = await supabase
              .from('links')
              .update({ dir_hash: null })
              .neq('dir_hash', null);
          if (error) throw error;
        }
      } catch (error) {
        console.error('Ошибка при очистке dir_hash:', error);
      }
    };

    const getLinkCount = async (dirHash) => {
      try {
        if (!dirHash) {
          console.warn('dirHash не указан');
          linkCounts.value[dirHash] = 0; // Устанавливаем количество ссылок в 0, если dirHash не указан
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
        linkCounts.value[dirHash] = linkCount; // Обновляем количество ссылок в linkCounts
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
          // Обновляем ссылку, устанавливая dir_hash в null
          const { error } = await supabase
              .from('links')
              .update({ dir_hash: null })
              .eq('id', linkToUpdate.id);

          if (error) throw error;

          // Обновляем количество ссылок для исходной папки (если она была)
          if (linkToUpdate.dir_hash) {
            await getLinkCount(linkToUpdate.dir_hash);
          }

          // Удаляем ссылку из sortedLinks
          sortedLinks.value = sortedLinks.value.filter(link => link.id !== linkToUpdate.id);

          // Эмитим событие для обновления draggedLink
          emit('update-dragged-link', null);
        } catch (error) {
          console.error('Ошибка при обновлении ссылки:', error);
        }
      }
    };

    onMounted(() => {
      fetchFolders();
      subscribeToRealtimeChanges();
      getSession(); // Вызываем при монтировании компонента
      window.addEventListener('keydown', handleKeydown); // Добавляем обработчик события
      folders.value.forEach(folder => {
        getLinkCount(folder.dir_hash);
      });
    });
    onUnmounted(() => {
      unsubscribeFromRealtimeChanges();
      window.removeEventListener('keydown', handleKeydown); // Удаляем обработчик события
    });
    watchEffect(() => {
      folders.value.forEach(folder => {
        getLinkCount(folder.dir_hash);
      });
    });
    return {
      draggedFolder,
      handleDragLeave,
      handleDragStart,
      handleDragOver,
      handleDrop,
      updateFolderRanges,
      getFolderColor,
      selectedFolder,
      handleFolderClick,
      handleDropOnYellowBox,
      sortedLinks, // Возвращаем sortedLinks
      onDrop,
      userId,
      dialog,
      folderListDialog,
      newFolderName,
      folders,
      filter,
      filteredFolders,
      createDirectory,
      errorMessage,
      successMessage,
      openDialog,
      closeDialog,
      columnSize,
      hasFilter,
      currentSortIcon,
      cycleSort,
      openFolderListDialog,
      selectedFolderId,
      deleteSelectedFolder,
      setSelectedFolder,
      toggleFolder,
      clearDirHash,
      userEmail,
      maskedEmail, // Возвращаем вычисляемое свойство
      account, // Возвращаем account, чтобы он был доступен в шаблоне
      isFocused: false, // Переменная для отслеживания состояния фокуса
      linkCounts, // Возвращаем linkCounts
      handleYellowBoxClick,
      getLinkCount // Возвращаем функцию getLinkCount
    };
  }
};
</script>
<style scoped>
.user-info {
  padding: 2px;
  color: black;
  font-size: 0.7rem;
  margin-top: 0;
  pointer-events: none; /* Отключаем события мыши для user-info */
}
.yellow-box {
  flex: 1;
  height: 40px;
  background-color: yellow; /* Основной цвет */
  margin-right: 5px;
  margin-left: 5px;
  display: flex;
  align-items: flex-start;
  border-radius: 5px;
  cursor: pointer; /* Делаем элемент кликабельным */
  transition: background-color 0.3s ease; /* Плавное изменение цвета */
}
.yellow-box:hover {
  background-color: #d8bfd8; /* Светло-фиолетовый цвет при наведении */
}
.filter-input {
  margin-left: 5px;
  background-color: white;
  padding: 0;
  border: 1px solid #ccc;
  border-radius: 5px;
  transition: border-color 0.3s;
}
/* Стиль для увеличенного курсора */
.thick-caret {
  position: absolute;
  width: 4px; /* Ширина курсора */
  height: 1em; /* Высота курсора */
  background-color: black; /* Цвет курсора */
  left: 10px; /* Позиция курсора */
  top: 50%; /* Центрируем по вертикали */
  transform: translateY(-50%); /* Центрируем по вертикали */
  animation: blink 1s step-end infinite; /* Мигающий эффект */
}
@keyframes blink {
  50% {
    opacity: 0; /* Прозрачность в 50% для мигания */
  }
}

/*.thick-cursor::selection {
  background: transparent; !* Убираем выделение текста *!
}*/



.filter-input:focus {
  border-color: black;
  background-color: #ffae00;
  outline: none;
}
.user-info {
  padding: 2px;
  color: black;
  font-size: 0.7rem;
  margin-top: 0;
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
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
  /*
  transition: opacity 0.3s ease;
  */
  transition: all 0.3s ease;
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
}
.folder-icon {
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
  font-size: 12px;
  color: black;
}

@media (max-width: 768px) {
  .folder-card {
    height: 150px;
  }
  .folder-name {
    font-size: calc(0.8rem + (100% - 150px) * 0.5 / 300);
  }
  .folder-icon {
    font-size: calc(4rem + (100% - 150px) * 5 / 300);
  }
}
.brown-background::-webkit-scrollbar {
  width: 12px;
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
</style>