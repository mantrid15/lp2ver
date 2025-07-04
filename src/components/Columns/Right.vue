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
                    :class="{
              'updating': folder.updating,
              'added': folder.added,
              'dragging-to-right': dragTargetFolder?.dir_hash === folder.dir_hash}"
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
                <!-- Счетчик 1: Количество подпапок (левый верхний угол) -->
                <span v-if="subfolderCounts[folder.dir_hash] > 0" class="subfolder-counter gradient-bg">
                  <v-icon small class="gradient-icon">mdi-folder</v-icon>
                  {{ subfolderCounts[folder.dir_hash] }}
                </span>
                <!-- Счетчик 2: Комбинированный счетчик ссылок (правый верхний угол) -->
                <span class="combined-link-counter">
                  {{ combinedLinkCounts[folder.dir_hash] > 0 ? combinedLinkCounts[folder.dir_hash] : 0 }}
                </span>
<!--                <span v-if="subfolderCounts[folder.dir_hash] > 0" class="subfolder-counter">-->
<!--                  <v-icon small color="#d2b48c">mdi-folder</v-icon>-->
<!--                  {{ subfolderCounts[folder.dir_hash] }}-->
<!--                </span>-->
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
  <v-snackbar
      v-model="snackbar.show"
      :timeout="3000"
      :color="snackbar.color"
      top
  >
    {{ snackbar.message }}
  </v-snackbar>
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
    debugMode: {
      type: Boolean,
      default: false
    },
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
  emits: ['folder-selected', 'reset-folder-selection', 'update-dragged-link'],
  setup(props, { emit }) {
    const logEnabled = props.debugMode ? 1 : 0;

    let realtimeChannel = null;
    let draggedFolder = ref(null);
    const subfolderCounts = ref({});
    const store = useStore();
    let isProcessing = ref(false);
    // Добавляем состояние для snackbar
    const snackbar = ref({
      show: false,
      message: '',
      color: 'success' // или 'error' для ошибок
    });
    // Функция для показа сообщений
    const showSnackbar = (message, type = 'success') => {
      snackbar.value = {
        show: true,
        message,
        color: type === 'success' ? 'success' : 'error'
      };
    };

    const isAltPressed = ref(false);
    const dragTargetFolder = ref(null);
    let dragSourceFolder = ref(null);


    const sortedLinks = ref([...props.links]);
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
    const combinedLinkCounts = ref({});

    // Добавляем в setup() новую реактивную переменную
    const hasMovedDuringAlt = ref(false); // Флаг: была ли уже перемещена папка в текущем удержании Alt
     // Новая функция для обработки отпускания Alt
    const handleKeyUp = (event) => {
      if (event.key === 'Alt') {
        isAltPressed.value = false;
        dragSourceFolder.value = null;
        dragTargetFolder.value = null;
        console.log('Alt key released, reset drag state and hasMovedDuringAlt');
      }
    }

    const getSubfolderCount = async (dirHash) => {
      try {
        const { count, error } = await supabase
            .from('dir')
            .select('*', { count: 'exact' })
            .eq('parent_hash', dirHash);

        if (error) throw error;

        subfolderCounts.value = {
          ...subfolderCounts.value,
          [dirHash]: count || 0
        };
        return count || 0;
      } catch (error) {
        console.error('Ошибка при получении количества подпапок:', error);
        return 0;
      }
    };

    const getFontSize = (folderName) => {
      const words = folderName.split(' ');
      const hasMultipleWords = words.length > 1;
      const isLong = folderName.length > 12;
      if (hasMultipleWords && isLong) {
        return folderName.length > 25 ? '80%' : '90%';
      }
      return '100%';
    };

    const handleDragStart = (event, folder) => {
      // Инициализация если не определена
      if (!draggedFolder.value) draggedFolder.value = {};

      dragSourceFolder.value = folder; // Устанавливаем источник перетаскивания
      event.dataTransfer.effectAllowed = 'move';

      if (isAltPressed.value) {
        event.dataTransfer.setData('application/x-folder-nesting', JSON.stringify(folder));
      } else {
        event.dataTransfer.setData('text/plain', folder.dir_hash);
        draggedFolder.value = folder;
      }
    };
    // Новая функция для проверки существования папки с таким же именем
    const checkDuplicateFolderName = async (parentHash, folderName) => {
      try {
        const { data, error } = await supabase
            .from('dir')
            .select('dir_name')
            .eq('parent_hash', parentHash)
            .eq('dir_name', folderName);

        if (error) throw error;
        return data.length > 0;
      } catch (error) {
        console.error('Ошибка при проверке дубликатов папок:', error);
        return false;
      }
    };

    const resetAllFolderStyles = () => {
      // console.log('Resetting all folder styles...');
      const folders = document.querySelectorAll('.folder-card');
      folders.forEach(folder => {
        folder.style.border = '2px solid #000000';
        folder.style.backgroundColor = '';
        folder.style.opacity = '1';
        folder.classList.remove(
            'nesting-target',
            'dragging-to-right',
            'dragging-from-left'
        );
      });
      // logFolderState('After resetAllFolderStyles');
    };
    // Новая функция для вложения папки
    /**
     * Вложить папку в целевую папку (Alt + перетаскивание)
     * @param {Object} sourceFolder - Исходная папка { dir_hash, dir_name }
     * @param {Object} targetFolder - Целевая папка { dir_hash, dir_name }
     * @throws {Error} При ошибках валидации или запросов к БД
     * @returns {Promise<void>}
     */

    const updateLinksParentHash = async (sourceDirHash, targetDirHash) => {
      try {
        // Находим ссылки, где dir_hash = sourceDirHash и parent_hash IS NULL
        const { data: linksToUpdate, error: findError } = await supabase
            .from('links')
            .select('id')
            .eq('dir_hash', sourceDirHash)
            .is('parent_hash', null);

        if (findError) throw findError;
        if (!linksToUpdate || linksToUpdate.length === 0) return;

        // Обновляем parent_hash для найденных ссылок
        const { error: updateError } = await supabase
            .from('links')
            .update({ parent_hash: targetDirHash })
            .in('id', linksToUpdate.map(link => link.id));

        if (updateError) throw updateError;

        console.log(`Updated ${linksToUpdate.length} links with new parent_hash`);
      } catch (error) {
        console.error('Error updating links parent_hash:', error);
        throw error;
      }
    };
// В методе nestFolder (внутри setup()) добавим обновление ссылок:
    const nestFolder = async (sourceFolder, targetFolder) => {
      try {
        if (sourceFolder.dir_hash === targetFolder.dir_hash) {
          showSnackbar('Нельзя вложить папку в саму себя!', 'error');
          return;
        }

        if (await checkCircularNesting(sourceFolder.dir_hash, targetFolder.dir_hash)) {
          showSnackbar('Циклическое вложение папок!', 'error');
          return;
        }

        const isDuplicate = await checkDuplicateFolderName(targetFolder.dir_hash, sourceFolder.dir_name);
        if (isDuplicate) {
          await mergeFolders(sourceFolder, targetFolder);
          showSnackbar(`Папки "${sourceFolder.dir_name}" объединены`, 'success');
        } else {
          // Перед вложением обновляем ссылки
          await updateLinksParentHash(sourceFolder.dir_hash, targetFolder.dir_hash);
          await performNesting(sourceFolder, targetFolder);
          // showSnackbar(`"${sourceFolder.dir_name}" → "${targetFolder.dir_name}"`, 'success');
        }
      } catch (error) {
        console.error('Ошибка вложения папки:', error);
        showSnackbar('Ошибка вложения папки', 'error');
      }
    };
    const mergeSubfolders = async (sourceFolderHash, targetFolderHash) => {
      try {
        // Получаем подпапки исходной папки
        const { data: sourceSubfolders, error: sourceError } = await supabase
            .from('dir')
            .select('*')
            .eq('parent_hash', sourceFolderHash);

        if (sourceError) throw sourceError;

        // Получаем подпапки целевой папки
        const { data: targetSubfolders, error: targetError } = await supabase
            .from('dir')
            .select('*')
            .eq('parent_hash', targetFolderHash);

        if (targetError) throw targetError;

        // Создаем карту подпапок целевой папки по именам
        const targetSubfoldersMap = new Map();
        targetSubfolders.forEach(folder => {
          targetSubfoldersMap.set(folder.dir_name, folder);
        });

        // Обрабатываем каждую подпапку исходной папки
        for (const subfolder of sourceSubfolders) {
          const existingFolder = targetSubfoldersMap.get(subfolder.dir_name);

          if (existingFolder) {
            // Если подпапка с таким именем уже существует - сливаем
            await mergeFolders(subfolder, existingFolder);
          } else {
            // Если подпапки нет - перемещаем
            const { error } = await supabase
                .from('dir')
                .update({ parent_hash: targetFolderHash })
                .eq('dir_hash', subfolder.dir_hash);

            if (error) throw error;
          }
        }

        console.log('Subfolders merged successfully');
      } catch (error) {
        console.error('Error merging subfolders:', error);
        throw error;
      }
    };


    const performNesting = async (sourceFolder, targetFolder) => {
      // 1. Обновляем ссылки в child folder (теперь это делается в nestFolder)
      // 2. Обновляем саму папку
      const { error: updateFolderError } = await supabase
          .from('dir')
          .update({
            parent_hash: targetFolder.dir_hash,
            range: null
          })
          .eq('dir_hash', sourceFolder.dir_hash);

      if (updateFolderError) throw updateFolderError;
      // 3. Пересчет range для оставшихся папок
      await reindexRootFolders();
      // 4. Обновляем UI
      await Promise.all([
        fetchFolders(),
        getSubfolderCount(targetFolder.dir_hash),
        getCombinedLinkCount(targetFolder.dir_hash),
        getCombinedLinkCount(sourceFolder.dir_hash)
      ]);
    };// Новый метод для слияния папок
    const mergeFolders = async (sourceFolder, targetFolder) => {
      // 1. Находим существующую папку
      const { data: existingFolders, error: fetchError } = await supabase
          .from('dir')
          .select('*')
          .eq('parent_hash', targetFolder.dir_hash)
          .eq('dir_name', sourceFolder.dir_name);

      if (fetchError) throw fetchError;
      if (!existingFolders?.length) throw new Error('Folder not found for merging');

      const existingFolder = existingFolders[0];
      // 2. Переносим ссылки
      const { error: updateLinksError } = await supabase
          .from('links')
          .update({
            dir_hash: existingFolder.dir_hash,
            parent_hash: targetFolder.dir_hash
          })
          .eq('dir_hash', sourceFolder.dir_hash);

      if (updateLinksError) throw updateLinksError;

      // 3. Переносим подпапки
      const { error: updateSubfoldersError } = await supabase
          .from('dir')
          .update({ parent_hash: existingFolder.dir_hash })
          .eq('parent_hash', sourceFolder.dir_hash);

      if (updateSubfoldersError) throw updateSubfoldersError;
      // 4. Удаляем sourceFolder
      const { error: deleteError } = await supabase
          .from('dir')
          .delete()
          .eq('dir_hash', sourceFolder.dir_hash);

      if (deleteError) throw deleteError;
      // 5. Переиндексация
      await reindexRootFolders();
    };
    // Новый метод для переиндексации корневых папок
    const reindexRootFolders = async () => {
      const { data: rootFolders, error } = await supabase
          .from('dir')
          .select('*')
          .is('parent_hash', null)
          .order('range', { ascending: true });

      if (error) throw error;

      const updates = rootFolders.map((folder, index) => ({
        dir_hash: folder.dir_hash,
        range: index + 1
      }));

      for (const update of updates) {
        const { error: updateError } = await supabase
            .from('dir')
            .update({ range: update.range })
            .eq('dir_hash', update.dir_hash);
        if (updateError) throw updateError;
      }
    };
    // Вспомогательные функции
    /**
     * Логирование операций с возможностью отключения
     * @param {string} message - Сообщение для лога
     * @param {Object} [data={}] - Дополнительные данные
     * @param {number} [logEnabled=1] - Флаг логирования (1 - включено, 0 - выключено)
     */
    const logOperation = (message, data = {}, logEnabled = 1) => {
      if (!logEnabled) return;

      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString();
        const groupLabel = `[${timestamp}] ${message}`;

        if (Object.keys(data).length > 0) {
          console.groupCollapsed(groupLabel);
          console.log('Данные:', data);
          console.groupEnd();
        } else {
          console.log(groupLabel);
        }
      }
    };

    /**
     * Логирование состояния папок с возможностью отключения
     * @param {string} context - Контекст для лога
     * @param {number} [logEnabled=1] - Флаг логирования (1 - включено, 0 - выключено)
     */
    const logFolderState = (context, logEnabled = 1) => {
      if (!logEnabled) return;

      if (process.env.NODE_ENV === 'development') {
        console.groupCollapsed(`Состояние папок (${context})`);
        document.querySelectorAll('.folder-card').forEach((el, index) => {
          console.log(`Папка #${index + 1}:`, {
            name: el.querySelector('.folder-name')?.textContent?.trim(),
            hash: el.dataset.folderHash,
            classes: el.className,
            styles: {
              border: el.style.border,
              background: el.style.backgroundColor,
              opacity: el.style.opacity
            }
          });
        });
        console.groupEnd();
      }
    };
    // Вспомогательная функция для проверки циклического вложения
    const checkCircularNesting = async (sourceHash, targetHash) => {
      try {
        let currentHash = targetHash;
        while (currentHash) {
          if (currentHash === sourceHash) return true;
          const { data: folder, error } = await supabase
              .from('dir')
              .select('parent_hash')
              .eq('dir_hash', currentHash)
              .single();

          if (error) throw error;
          currentHash = folder?.parent_hash;
        }
        return false;
      } catch (error) {
        console.error('Ошибка при проверке циклического вложения:', error);
        return true; // В случае ошибки блокируем операцию
      }
    };

    const handleDragLeave = (event) => {
      // Не сбрасываем полностью, чтобы сохранить плавность
      event.currentTarget.style.border = '2px solid #000000';
      event.currentTarget.style.backgroundColor = '';
    };

    const handleDragOver = (event, folder) => {
      event.preventDefault();
      // console.log('DragOver started', {
      //   isAltPressed: isAltPressed.value,
      //   dataTypes: [...event.dataTransfer.types]
      // });
      resetAllFolderStyles(); // Сначала сбрасываем все стили
      // Для перетаскивания из Left в Right
      const folderData = event.dataTransfer.types.includes('application/x-folder-move');
      if (folderData) {
        console.log('Left to Right drag detected');
        event.currentTarget.classList.add('dragging-to-right');
        dragTargetFolder.value = folder;
        logFolderState('Left to Right drag', event.currentTarget);
        return;
      }
      if (isAltPressed.value) {
        // console.log('Alt nesting drag detected');
        event.currentTarget.classList.add('nesting-target');
        event.currentTarget.style.border = '2px dashed blue';
        // logFolderState('Alt drag over', event.currentTarget);
      } else {
        // console.log('Normal drag detected');
        event.currentTarget.classList.add('dragging-to-right');
        // logFolderState('Normal drag over', event.currentTarget);
      }
    };

    const syncFoldersState = async () => {
      try {
        const { data, error } = await supabase
            .from('dir')
            .select('*')
            .order('range', { ascending: true });

        if (error) throw error;

        folders.value = data || [];

        // Обновляем счетчики для всех папок
        for (const folder of folders.value) {
          await getLinkCount(folder.dir_hash);
          await getSubfolderCount(folder.dir_hash);
          await getCombinedLinkCount(folder.dir_hash);
        }
      } catch (error) {
        console.error('Ошибка синхронизации состояния папок:', error);
      }
    };

    const handleDrop = async (event, targetFolder) => {
      if (isProcessing.value) {
        console.warn('Drop operation already in progress');
        return;
      }

      isProcessing.value = true;

      try {
        event.preventDefault();
        resetAllFolderStyles();

        // 1. Обработка перемещения из Left в Right
        const folderData = event.dataTransfer?.getData('application/x-folder-move');
        if (folderData) {
          const folderToMove = JSON.parse(folderData);
          await performLeftToRightMove(folderToMove);
          return;
        }

        // 2. Обработка вложения папки (Alt)
        if (isAltPressed.value && dragSourceFolder.value?.dir_hash) {
          await nestFolder(dragSourceFolder.value, targetFolder);
          return;
        }

        // 3. Стандартное перетаскивание внутри Right (Ctrl)
        if (event.ctrlKey && draggedFolder.value?.dir_hash && draggedFolder.value.dir_hash !== targetFolder.dir_hash) {
          await swapFolders(draggedFolder.value, targetFolder);
        }

      } catch (error) {
        console.error('Unexpected error in handleDrop:', error);
        showSnackbar('Неожиданная ошибка при обработке', 'error');
      } finally {
        isProcessing.value = false;
        dragSourceFolder.value = null;
        dragTargetFolder.value = null;
        draggedFolder.value = null;
      }
    };

    const swapFolders = async (source, target) => {
      const updates = [
        { dir_hash: source.dir_hash, range: target.range },
        { dir_hash: target.dir_hash, range: source.range }
      ];

      for (const update of updates) {
        await supabase
            .from('dir')
            .update({ range: update.range })
            .eq('dir_hash', update.dir_hash);
      }

      showSnackbar('Папки переставлены', 'success');
      fetchFolders();
    };

    const performLeftToRightMove = async (folder) => {
      const { data: maxRangeData } = await supabase
          .from('dir')
          .select('range')
          .is('parent_hash', null)
          .order('range', { ascending: false })
          .limit(1);

      const newRange = (maxRangeData?.[0]?.range ?? 0) + 1;

      await supabase
          .from('dir')
          .update({ parent_hash: null, range: newRange })
          .eq('dir_hash', folder.dir_hash);

      await supabase
          .from('links')
          .update({ parent_hash: null, dir_hash: folder.dir_hash })
          .eq('dir_hash', folder.dir_hash);

      showSnackbar(`Папка "${folder.dir_name}" перемещена в Right`, 'success');
      fetchFolders();
    };

    const resetDragState = () => {
      // isAltPressed.value = false;
      hasMovedDuringAlt.value = false; // Добавляем сброс флага
      dragSourceFolder.value = null;
      dragTargetFolder.value = null;
      resetAllFolderStyles();
    };

    const updateFolderRanges = async (updates) => {
      try {
        for (const update of updates) {
          // console.log(`Отправка обновления на Supabase для dir_hash: ${update.dir_hash}, range: ${update.range}`);
          const { error } = await supabase
              .from('dir')
              .update({ range: update.range })
              .eq('dir_hash', update.dir_hash);
          if (error) {
            // console.error('Ошибка при обновлении папки:', update.dir_hash, error);
          } else {
            // console.log('Обновлена папка:', update.dir_hash, 'с новым range:', update.range);
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
// Метод для получения комбинированного количества ссылок
    const getCombinedLinkCount = async (dirHash) => {
      try {
        // 1. Ссылки в корне папки (dir_hash = dirHash AND parent_hash IS NULL)
        const { count: rootLinksCount, error: rootError } = await supabase
            .from('links')
            .select('*', { count: 'exact' })
            .eq('dir_hash', dirHash)
            .is('parent_hash', null);

        if (rootError) throw rootError;

        // 2. Ссылки с parent_hash = dirHash (непосредственно в этой папке)
        const { count: directChildLinksCount, error: directChildError } = await supabase
            .from('links')
            .select('*', { count: 'exact' })
            .eq('parent_hash', dirHash);

        if (directChildError) throw directChildError;

        const totalCount = (rootLinksCount || 0) + (directChildLinksCount || 0);

        // Обновляем значение в reactive-переменной
        combinedLinkCounts.value = {
          ...combinedLinkCounts.value,
          [dirHash]: totalCount
        };

        return totalCount;
      } catch (error) {
        console.error('Ошибка в getCombinedLinkCount:', error);
        return 0;
      }
    };  // Добавляем вычисляемое свойство для текущей выбранной папки

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

    const logCombinedLinkDetails = async (folder) => {
      try {
        const folderName = folder.dir_name;
        const dirHash = folder.dir_hash;

        console.groupCollapsed(`Детали ссылок для "${folderName}" (${dirHash})`);
        let counter = 1;

        // 1. КОРНЕВЫЕ ССЫЛКИ ПАПКИ
        const { data: rootLinks, error: rootError } = await supabase
            .from('links')
            .select('id, title, date')
            .eq('dir_hash', dirHash)
            .is('parent_hash', null)
            .order('date', { ascending: true });

        if (rootError) throw rootError;

        console.group(`1. Корневые ссылки папки (dir_hash=${dirHash})`);
        console.log(`Найдено: ${rootLinks.length} ссылок`);
        rootLinks.forEach(link => {
          console.log(`  ${counter++}. [ID:${link.id}] "${link.title}" (${link.date ? new Date(link.date).toLocaleString() : 'без даты'})`);
        });
        console.groupEnd();

        // 2. ССЫЛКИ В ПОДПАПКАХ (разбивка по подпапкам)
        const { data: subfolders, error: subfoldersError } = await supabase
            .from('dir')
            .select('dir_hash, dir_name')
            .eq('parent_hash', dirHash);

        if (subfoldersError) throw subfoldersError;

        console.group(`2. Ссылки в подпапках (parent_hash=${dirHash})`);

        if (subfolders.length === 0) {
          console.log('Подпапки отсутствуют');
        } else {
          for (const subfolder of subfolders) {
            const { data: subfolderLinks, error: subfolderLinksError } = await supabase
                .from('links')
                .select('id, title, date')
                .eq('parent_hash', dirHash)
                .eq('dir_hash', subfolder.dir_hash)
                .order('date', { ascending: true });

            if (subfolderLinksError) throw subfolderLinksError;

            console.group(`Подпапка "${subfolder.dir_name}" (${subfolder.dir_hash})`);
            console.log(`Найдено: ${subfolderLinks.length} ссылок`);

            subfolderLinks.forEach(link => {
              console.log(`  ${counter++}. [ID:${link.id}] "${link.title}" (${link.date ? new Date(link.date).toLocaleString() : 'без даты'})`);
            });

            console.groupEnd();
          }
        }

        console.groupEnd();
        console.log(`═ ИТОГО: ${counter - 1} ссылок ═`);
        console.groupEnd();
      } catch (error) {
        console.error('Ошибка при логировании деталей ссылок:', error);
      }
    };   // Метод для получения количества подпапок

    const handleFolderClick = async (folder) => {
      // Всегда устанавливаем выбранную папку, даже если это повторный клик
      selectedFolderHash.value = folder.dir_hash;

      await getCombinedLinkCount(folder.dir_hash); // Всегда обновляем счетчик
      // await logCombinedLinkDetails(folder); // Логируем только при клике

      emit('folder-selected', folder.dir_hash);
    };

    const onDrop = async (dirHash) => {
      if (props.draggedLink) {
        const linkToUpdate = props.draggedLink;
        try {
          const updateData = {
            dir_hash: dirHash,
            parent_hash: null // Всегда сбрасываем parent_hash при перетаскивании на папку
          };

          const { error } = await supabase
              .from('links')
              .update(updateData)
              .eq('id', linkToUpdate.id);

          if (error) throw error;

          // Обновляем счетчики для старой и новой папки
          await getLinkCount(dirHash);
          if (linkToUpdate.dir_hash) {
            await getLinkCount(linkToUpdate.dir_hash);
          }
          if (linkToUpdate.parent_hash) {
            await getCombinedLinkCount(linkToUpdate.parent_hash);
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

    const handleKeyDown = (event) => {
      if (event.key === 'Alt') {
        if (!isAltPressed.value) {
          isAltPressed.value = true;
          hasMovedDuringAlt.value = false;  // Новый цикл, сбрасываем флаг
          console.log('Alt key pressed, reset hasMovedDuringAlt');
        }
      }
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
        // Добавляем класс обновления ко всем папкам
        folders.value.forEach(f => {
          f.updating = true;
        });

        const { data, error } = await supabase
            .from('dir')
            .select('*')
            .eq('user_id', userId.value)
            .order('range', { ascending: true });

        if (error) throw error;

        // Добавляем класс added для новых папок
        const newFolders = data || [];
        newFolders.forEach(f => {
          f.added = !folders.value.some(existing => existing.id === f.id);
        });

        folders.value = newFolders;

        // Удаляем классы через короткое время
        setTimeout(() => {
          folders.value.forEach(f => {
            f.updating = false;
            f.added = false;
          });
        }, 1000);

      } catch (error) {
        console.error('Ошибка при получении директорий:', error);
        folders.value.forEach(f => {
          f.updating = false;
        });
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

        // 1. Проверяем существование папки с таким же именем и parent_hash = NULL
        const { data: existingNullParent, error: nullParentError } = await supabase
            .from('dir')
            .select('*')
            .eq('dir_name', upperCaseFolderName)
            .is('parent_hash', null);

        if (nullParentError) throw nullParentError;

        if (existingNullParent && existingNullParent.length > 0) {
          errorMessage.value = 'Нельзя создать: папка с таким именем уже существует в корне.';
          setTimeout(() => errorMessage.value = '', 3000);
          return;
        }

        // 2. Проверяем существование папки с таким же именем и parent_hash != NULL
        const { data: existingWithParent, error: withParentError } = await supabase
            .from('dir')
            .select('*')
            .eq('dir_name', upperCaseFolderName)
            .not('parent_hash', 'is', null);

        if (withParentError) throw withParentError;

        // 3. Если папка существует с parent_hash != NULL - разрешаем создание
        if (existingWithParent && existingWithParent.length > 0) {
          console.log('Папка существует, но имеет parent_hash - разрешаем создание');
        }

        // 4. Создаём новую запись
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
        if (!dirHash) return 0;

        const { count, error } = await supabase
            .from('links')
            .select('*', { count: 'exact' })
            .eq('dir_hash', dirHash)
            .is('parent_hash', null); // Добавляем условие parent_hash IS NULL
        if (error) throw error;

        linkCounts.value = {
          ...linkCounts.value,
          [dirHash]: count || 0
        };
        return count || 0;
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
              .update({
                dir_hash: null,
                parent_hash: null // Добавляем очистку parent_hash
              })
              .eq('id', linkToUpdate.id);

          if (error) throw error;

          // Обновляем счетчики для старой папки, если она была
          if (linkToUpdate.dir_hash) {
            await getLinkCount(linkToUpdate.dir_hash);
            await getCombinedLinkCount(linkToUpdate.dir_hash);
          }
          if (linkToUpdate.parent_hash) {
            await getCombinedLinkCount(linkToUpdate.parent_hash);
          }

          // Удаляем ссылку из локального списка
          sortedLinks.value = sortedLinks.value.filter(link => link.id !== linkToUpdate.id);
          emit('update-dragged-link', null);

          // Показываем уведомление об успехе
          showSnackbar('Ссылка перемещена в корень', 'success');
        } catch (error) {
          console.error('Ошибка при обновлении ссылки:', error);
          showSnackbar('Ошибка при перемещении ссылки', 'error');
        }
      }
    };

    const editDirHash = () => {
      // Если требуется дополнительная логика для редактирования, реализуйте здесь
      console.log('editDirHash triggered');
    };

    const subscribeToRealtimeChanges = () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }

      realtimeChannel = supabase
          .channel('realtime-right-folders')
          .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'dir',
                filter: `user_id=eq.${userId.value}`
              },
              async (payload) => {
                // console.log('Изменение в dir:', payload);

                // Обработка разных типов событий
                switch (payload.eventType) {
                  case 'INSERT':
                    // Добавляем новую папку и обновляем счетчики
                    folders.value.push(payload.new);
                    await getCombinedLinkCount(payload.new.dir_hash);
                    await getSubfolderCount(payload.new.dir_hash);
                    break;

                  case 'UPDATE':
                    // Обновляем существующую папку
                    const updateIndex = folders.value.findIndex(f => f.id === payload.new.id);
                    if (updateIndex !== -1) {
                      folders.value[updateIndex] = payload.new;

                      // Если изменился parent_hash, обновляем счетчики для старого и нового родителя
                      if (payload.old.parent_hash !== payload.new.parent_hash) {
                        if (payload.old.parent_hash) {
                          await getSubfolderCount(payload.old.parent_hash);
                        }
                        if (payload.new.parent_hash) {
                          await getSubfolderCount(payload.new.parent_hash);
                        }
                      }
                    }
                    break;

                  case 'DELETE':
                    // Удаляем папку и обновляем счетчики родителя
                    folders.value = folders.value.filter(f => f.id !== payload.old.id);
                    if (payload.old.parent_hash) {
                      await getSubfolderCount(payload.old.parent_hash);
                    }
                    break;
                }

                // Сортируем папки по range после изменений
                folders.value.sort((a, b) => (a.range || 0) - (b.range || 0));
              }
          )
          .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'links'
              },
              async (payload) => {
                console.log('Изменение в links:', payload);

                // Обновляем счетчики для затронутых папок
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                  if (payload.new.dir_hash) {
                    await getLinkCount(payload.new.dir_hash);
                    await getCombinedLinkCount(payload.new.dir_hash);
                  }
                  if (payload.new.parent_hash) {
                    await getCombinedLinkCount(payload.new.parent_hash);
                  }
                }

                if (payload.eventType === 'DELETE') {
                  if (payload.old.dir_hash) {
                    await getLinkCount(payload.old.dir_hash);
                    await getCombinedLinkCount(payload.old.dir_hash);
                  }
                  if (payload.old.parent_hash) {
                    await getCombinedLinkCount(payload.old.parent_hash);
                  }
                }
              }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('Подписка на изменения Right активна');
            }
            if (err) {
              console.error('Ошибка подписки Right:', err);
            }
          });

      return realtimeChannel;
    };

    const unsubscribeFromRealtimeChanges = () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
// Добавим обработку ошибок подписки
    const setupRealtime = () => {
      try {
        subscribeToRealtimeChanges();
      } catch (error) {
        console.error('Ошибка инициализации realtime:', error);
        // Пытаемся переподключиться через 5 секунд
        setTimeout(setupRealtime, 5000);
      }
    };

    const handleDragEnd = (event) => {
      console.log('DragEnd event');
      resetAllFolderStyles();
      logFolderState('After dragend');
    };

    onMounted(() => {
      setupRealtime();
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('dragend', handleDragEnd);

      // fetchFolders();
      fetchFolders().then(syncFoldersState);
      subscribeToRealtimeChanges();
      getSession();
      folders.value.forEach(folder => {
        getLinkCount(folder.dir_hash);
      });
    });

    onUnmounted(() => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
      unsubscribeFromRealtimeChanges();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('dragend', handleDragEnd);
    });

    watchEffect(() => {
      folders.value.forEach(folder => {
        getLinkCount(folder.dir_hash);
        getCombinedLinkCount(folder.dir_hash);
      });
    });

    watch(folders, (newFolders) => {
      newFolders.forEach(folder => {
        // getLinkCount(folder.dir_hash);
        getSubfolderCount(folder.dir_hash);
        getCombinedLinkCount(folder.dir_hash);
      });
    }, { immediate: true });

    watch(dialog, (newVal) => {
      console.log('dialog changed:', newVal);
    });
    // Добавим watch для переподписки при изменении userId
    watch(userId, (newVal) => {
      if (newVal) {
        setupRealtime();
      }
    });

    watch(isAltPressed, (newVal) => {
      console.log(`Alt key state changed: ${newVal}`);
      if (!newVal) {
        console.log('Alt key released, resetting styles');
        resetAllFolderStyles();
        logFolderState('After Alt key release');
      }
    });

    return {
      updateLinksParentHash,
      isProcessing,
      hasMovedDuringAlt,
      resetDragState,
      performNesting,
      mergeFolders,
      reindexRootFolders,
      handleDragEnd,
      syncFoldersState,
      snackbar,
      showSnackbar,
      isAltPressed,
      dragTargetFolder,
      dragSourceFolder,
      handleKeyDown,
      handleKeyUp,
      nestFolder,
      checkDuplicateFolderName,
      combinedLinkCounts,
      getCombinedLinkCount,
      subfolderCounts,
      getSubfolderCount,
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
.folder-card.nesting-success {
  animation: pulse-success 1s;
}

@keyframes pulse-success {
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

.folder-card.default-state {
  border: 2px solid #000000 !important;
  background: transparent !important;
  opacity: 1 !important;
}

/* Заменим все inline-стили на классы */
.folder-card.nesting-target {
  border: 2px dashed blue !important;
  background-color: rgba(0, 0, 255, 0.1) !important;
}
.folder-card.updating {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

.folder-card.added {
  animation: highlight 2s;
}

@keyframes highlight {
  0% {
    background-color: rgba(76, 175, 80, 0.3);
  }
  100% {
    background-color: transparent;
  }
}

.folder-card.removed {
  animation: fadeOut 0.5s;
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.folder-card.dragging-to-right {
  border: 2px dashed green !important;
  background-color: rgba(0, 128, 0, 0.1) !important;
}

.folder-card.dragging-from-left {
  border: 2px dashed purple !important;
  background-color: rgba(128, 0, 128, 0.1) !important;
}
.folder-card.nesting-source {
  background-color: rgba(128, 0, 128, 0.3) !important; /* Фиолетовый для исходной папки */
  border: 2px dashed purple !important;
}

.folder-card.nesting-target {
  border: 2px dashed blue !important;
  background-color: rgba(0, 0, 255, 0.1) !important;
}
.combined-link-counter {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 16px;
  color: black;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 2px 5px;
  border-radius: 3px;
  display: flex;
  align-items: center;
}

.combined-link-counter::before {
  content: "🔗";
  margin-right: 2px;
  font-size: 12px;
}

.gradient-icon {
  background: linear-gradient(to bottom, #f0e68c, #d2b48c);
  -webkit-background-clip: text; /* Для поддержки градиента на тексте */
  -webkit-text-fill-color: transparent; /* Делаем цвет текста прозрачным */
}
.subfolder-counter {
  position: absolute;
  top: 5px;
  left: 5px;
  font-size: 16px;
  color: black;
  display: flex;
  align-items: center;
  gap: 2px;
}
.icon-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: -20px; /* Поднимаем иконку еще выше */
  align-items: flex-start; /* Выравнивание по верхнему краю */
  .icon-container {
    margin-top: 0; /* Уберите отрицательный margin */

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
  transition: all 0.3s ease; /* Добавляем плавный переход для всех изменений */
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
  margin-top: 10px; /* Уберите лишние отступы */

  font-size: calc(5rem + (100% - 200px) * 5 / 300);
  color: transparent;
  background: linear-gradient(to bottom, #f0e68c, #d2b48c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: font-size 0.3s ease;
}
.link-counter {
  position: absolute;
  bottom: 5px;
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
.brown-background::-webkit-scrollbar-track az{
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