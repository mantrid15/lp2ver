md
<script>
// Функция для вычисления SHA‑256 хеша строки
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

// Функция для проверки уникальности хеша на новом названии
// Если currentFolderId передан, то исключаем его из запроса
const checkHashUniqueness = async (dirHash, currentFolderId = null) => {
  try {
    let query = supabase
        .from('dir')
        .select('*')
        .eq('dir_hash', dirHash)
        .eq('user_id', userId.value);
    if (currentFolderId) {
      query = query.neq('id', currentFolderId);
    }
    const { data, error } = await query;
    if (error) throw error;
    console.log('Результат проверки уникальности:', data);
    return data.length === 0;
  } catch (error) {
    console.error('Ошибка при проверке уникальности хеша:', error);
    return false;
  }
};

export default {
  name: 'EditDirView',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    folders: {
      type: Array,
      required: true
    },
    linkCounts: {
      type: Object,
      required: true
    },
    selectedFolderId: {
      type: [Number, String, null],
      default: null
    }
  },
  emits: [
    'update:selectedFolderId',
    'close',
    'editDirHash',
    'clearDirHash',
    'deleteFolder',
    'toggleFolder',
    'resetRadio',
    'update:visible',
    'saveFolderEdit'
  ],
  data() {
    return {
      editingFolderId: null,
      editingFolderName: '',
      errorMessage: '',
      successMessage: ''
    };
  },
  computed: {
    localSelectedFolderId: {
      get() {
        return this.selectedFolderId;
      },
      set(value) {
        this.$emit('update:selectedFolderId', value);
      }
    },
    internalVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit('update:visible', value);
        if (!value) {
          this.handleResetRadio();
          this.editingFolderId = null;
        }
      }
    }
  },
  methods: {
    handleEditDirHash() {
      // Если выбрана папка, переводим её в режим редактирования
      const selectedFolder = this.folders.find(f => f.id === this.localSelectedFolderId);
      if (selectedFolder) {
        this.editingFolderId = selectedFolder.id;
        this.editingFolderName = selectedFolder.dir_name;
        this.$emit('editDirHash');
      }
    },
    handleClearDirHash() {
      this.$emit('clearDirHash');
    },
    handleDeleteFolder() {
      this.$emit('deleteFolder');
    },
    handleSetSelectedFolder(folderId) {
      this.$emit('update:selectedFolderId', folderId);
    },
    handleToggleFolder(folderId) {
      this.$emit('toggleFolder', folderId);
    },
    handleResetRadio() {
      this.$emit('resetRadio');
    },
    handleCancelEdit() {
      // Выход из режима редактирования без сохранения
      this.editingFolderId = null;
      this.editingFolderName = '';
    },
    async handleConfirmEdit() {
      // Находим редактируемую папку
      const folder = this.folders.find(f => f.id === this.editingFolderId);
      if (!folder) return;

      // Если имя не изменилось — выходим из режима редактирования
      if (folder.dir_name === this.editingFolderName) {
        this.editingFolderId = null;
        this.editingFolderName = '';
        return;
      }

      try {
        const newName = this.editingFolderName.trim();
        if (!newName) return;

        const upperCaseFolderName = newName.toUpperCase();
        // Пересчет нового хеша с использованием hashString
        const newDirHash = await hashString(upperCaseFolderName);

        // Проверка уникальности нового хеша (на основе нового названия)
        const isUnique = await checkHashUniqueness(newDirHash, this.editingFolderId);
        if (!isUnique) {
          this.errorMessage = 'Директория с таким именем уже существует!';
          setTimeout(() => {
            this.errorMessage = '';
          }, 2000);
          return;
        }

        // Обновляем таблицу dir: меняем имя и хеш
        const { data, error } = await supabase
            .from('dir')
            .update({
              dir_name: upperCaseFolderName,
              dir_hash: newDirHash
            })
            .eq('id', this.editingFolderId);

        if (error) {
          this.errorMessage = 'Ошибка при обновлении директории!';
          setTimeout(() => {
            this.errorMessage = '';
          }, 2000);
          console.error('Ошибка при обновлении директории:', error);
          return;
        }

        // Обновляем таблицу links:
        // Для всех записей, где dir_hash равен старому значению, заменяем его на новый
        const oldDirHash = folder.dir_hash;
        const { data: linkData, error: linkError } = await supabase
            .from('links')
            .update({ dir_hash: newDirHash })
            .eq('dir_hash', oldDirHash);

        if (linkError) {
          this.errorMessage = 'Ошибка при обновлении ссылок!';
          setTimeout(() => {
            this.errorMessage = '';
          }, 2000);
          console.error('Ошибка при обновлении ссылок:', linkError);
          return;
        }

        this.successMessage = 'Директория обновлена!';
        setTimeout(() => {
          this.successMessage = '';
        }, 1000);

        // Завершаем режим редактирования
        this.editingFolderId = null;
        this.editingFolderName = '';
        // Передаем обновленные данные родительскому компоненту, если необходимо
        this.$emit('saveFolderEdit', { id: folder.id, newDirName: upperCaseFolderName, newDirHash });
      } catch (error) {
        console.error('Необработанная ошибка при обновлении директории:', error);
        this.errorMessage = 'Произошла неизвестная ошибка при обновлении директории!';
        setTimeout(() => {
          this.errorMessage = '';
        }, 2000);
      }
    }
  }
};
</script>

<template>
  <v-dialog v-model="internalVisible" max-width="300px">
    <v-card>
      <v-card-title class="headline" style="display: flex; align-items: center; justify-content: space-between;">
        <v-btn icon @click="handleEditDirHash" style="color: orange;">
          <v-icon style="font-size: 18px;">mdi-pencil</v-icon>
        </v-btn>
        <span style="flex-grow: 1; text-align: center;">Список папок</span>
        <v-btn icon @click="handleClearDirHash" style="color: red;">
          <v-icon style="font-size: 18px;">mdi-delete</v-icon>
        </v-btn>
      </v-card-title>
      <div class="scrollable-content">
        <v-card-text>
          <v-alert v-if="errorMessage" type="error" dense text>{{ errorMessage }}</v-alert>
          <v-alert v-if="successMessage" type="success" dense text>{{ successMessage }}</v-alert>
          <v-list>
            <v-list-item
                v-for="(folder, index) in folders"
                :key="index"
                style="margin: 0; min-height: 30%; align-items: center;"
            >
              <v-list-item-title
                  :style="{
                  display: 'flex',
                  height: '22px',
                  padding: '0 8px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: editingFolderId === folder.id
                                    ? 'pink'
                                    : (linkCounts[folder.dir_hash] > 0 ? 'green' : 'red'),
                  width: '100%'
                }"
              >
                <div style="flex-grow: 1; display: flex; align-items: center; max-width: calc(100% - 50px);">
                  <v-radio
                      :value="folder.id"
                      v-model="localSelectedFolderId"
                      color="primary"
                      @change="handleSetSelectedFolder(folder.id)"
                      @click.stop="handleToggleFolder(folder.id)"
                  ></v-radio>
                  <div v-if="editingFolderId === folder.id" style="width: 100%;">
                    <v-text-field
                        v-model="editingFolderName"
                        dense
                        hide-details
                        solo
                        style="font-size: 0.8em; padding: 0;"
                    ></v-text-field>
                  </div>
                  <span v-else style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.8em;">
                    {{ folder.dir_name }}
                  </span>
                </div>
                <div v-if="editingFolderId === folder.id">
                  <v-btn icon @click.stop="handleCancelEdit" style="color: red;">
                    <v-icon style="font-size: 18px;">mdi-close</v-icon>
                  </v-btn>
                  <v-btn icon @click.stop="handleConfirmEdit" style="color: green;">
                    <v-icon style="font-size: 18px;">mdi-check</v-icon>
                  </v-btn>
                </div>
                <span v-else style="color: white;">
                  {{ linkCounts[folder.dir_hash] > 0 ? linkCounts[folder.dir_hash] : 0 }}
                </span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </div>
      <v-card-actions class="fixed-actions">
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="$emit('close')">Закрыть</v-btn>
        <v-btn color="red darken-1" text @click="handleDeleteFolder" :disabled="!localSelectedFolderId">
          Удалить
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
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
</style>