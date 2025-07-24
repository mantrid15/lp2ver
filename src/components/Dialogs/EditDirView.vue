<template>
  <v-dialog v-model="internalVisible" max-width="400px">
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
                style="margin-right: 0; min-height: 30%; align-items: center;"
            >
              <v-list-item-title
                  :style="{
                    display: 'flex',
                    height: '30px',
                    padding: '0 2px',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: editingFolderId === folder.id
                      ? 'pink'
                      : (linkCounts[folder.dir_hash] > 0 ? 'lightgreen' : 'red'),
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
                      style="margin-right: 20px; padding: 0; min-width: 20px; min-height: 20px;"
                  ></v-radio>
                  <v-text-field
                      v-if="editingFolderId === folder.id"
                      v-model="editingFolderName"
                      hide-details
                      solo
                      style="font-size: 0.8em; padding: 0; margin-left: 10px;"
                  ></v-text-field>
                  <span v-else style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 1em;">
                    {{ getFolderPath(folder) }}
                  </span>
                </div>
                <div v-if="editingFolderId === folder.id">
                  <v-btn icon @click.stop="handleCancelEdit" style="color: red; background: transparent;">
                    <v-icon style="font-size: 34px;">mdi-close</v-icon>
                  </v-btn>
                  <v-btn icon @click.stop="handleConfirmEdit" style="color: green; background: transparent;">
                    <v-icon style="font-size: 34px;">mdi-check</v-icon>
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

<script>
import { supabase } from '@/clients/supabase.js';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

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

const checkHashUniqueness = async (dirHash, userId, currentFolderId = null) => {
  try {
    let query = supabase
        .from('dir')
        .select('*')
        .eq('dir_hash', dirHash)
        .eq('user_id', userId);
    if (currentFolderId) {
      query = query.neq('id', currentFolderId);
    }
    const {data, error} = await query;
    if (error) throw error;
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
  setup(props, {emit}) {
    const store = useStore();
    const editingFolderId = ref(null);
    const editingFolderName = ref('');
    const errorMessage = ref('');
    const successMessage = ref('');

    const localSelectedFolderId = computed({
      get() {
        return props.selectedFolderId;
      },
      set(value) {
        emit('update:selectedFolderId', value);
      }
    });

    const internalVisible = computed({
      get() {
        return props.visible;
      },
      set(value) {
        emit('update:visible', value);
        if (!value) {
          handleResetRadio();
          editingFolderId.value = null;
        }
      }
    });

    const userId = computed(() => store.state.userId);

    const getFolderPath = (folder) => {
      if (!folder.parent_hash) return folder.dir_name;

      const parentFolder = props.folders.find(f => f.dir_hash === folder.parent_hash);
      if (!parentFolder) return folder.dir_name;

      return `${parentFolder.dir_name}/${folder.dir_name}`;
    };

    const handleEditDirHash = () => {
      const selectedFolder = props.folders.find(f => f.id === localSelectedFolderId.value);
      if (selectedFolder) {
        editingFolderId.value = selectedFolder.id;
        editingFolderName.value = selectedFolder.dir_name;
        emit('editDirHash');
      }
    };

    const handleClearDirHash = () => {
      emit('clearDirHash');
    };

    const handleDeleteFolder = () => {
      emit('deleteFolder');
    };

    const handleSetSelectedFolder = (folderId) => {
      emit('update:selectedFolderId', folderId);
    };

    const handleToggleFolder = (folderId) => {
      emit('toggleFolder', folderId);
    };

    const handleResetRadio = () => {
      emit('resetRadio');
    };

    const handleCancelEdit = () => {
      editingFolderId.value = null;
      editingFolderName.value = '';
    };

    const handleConfirmEdit = async () => {
      const folder = props.folders.find(f => f.id === editingFolderId.value);
      if (!folder) return;

      if (folder.dir_name === editingFolderName.value) {
        editingFolderId.value = null;
        editingFolderName.value = '';
        return;
      }

      try {
        const newName = editingFolderName.value.trim();
        if (!newName) return;

        const upperCaseFolderName = newName.toUpperCase();
        const newDirHash = await hashString(upperCaseFolderName);
        const isUnique = await checkHashUniqueness(newDirHash, userId.value, editingFolderId.value);
        if (!isUnique) {
          errorMessage.value = 'Директория с таким именем уже существует!';
          setTimeout(() => {
            errorMessage.value = '';
          }, 2000);
          return;
        }

        const {data, error} = await supabase
            .from('dir')
            .update({
              dir_name: upperCaseFolderName,
              dir_hash: newDirHash
            })
            .eq('id', editingFolderId.value);

        if (error) {
          errorMessage.value = 'Ошибка при обновлении директории!';
          setTimeout(() => {
            errorMessage.value = '';
          }, 2000);
          return;
        }

        const oldDirHash = folder.dir_hash;
        const {data: linkData, error: linkError} = await supabase
            .from('links')
            .update({dir_hash: newDirHash})
            .eq('dir_hash', oldDirHash);

        if (linkError) {
          errorMessage.value = 'Ошибка при обновлении ссылок!';
          setTimeout(() => {
            errorMessage.value = '';
          }, 2000);
          return;
        }

        successMessage.value = 'Директория обновлена!';
        setTimeout(() => {
          successMessage.value = '';
        }, 1000);

        editingFolderId.value = null;
        editingFolderName.value = '';
        emit('saveFolderEdit', {id: folder.id, newDirName: upperCaseFolderName, newDirHash});
      } catch (error) {
        console.error('Необработанная ошибка при обновлении директории:', error);
        errorMessage.value = 'Произошла неизвестная ошибка при обновлении директории!';
        setTimeout(() => {
          errorMessage.value = '';
        }, 2000);
      }
    };

    return {
      editingFolderId,
      editingFolderName,
      errorMessage,
      successMessage,
      localSelectedFolderId,
      internalVisible,
      getFolderPath,
      handleEditDirHash,
      handleClearDirHash,
      handleDeleteFolder,
      handleSetSelectedFolder,
      handleToggleFolder,
      handleResetRadio,
      handleCancelEdit,
      handleConfirmEdit,
    };
  }
};
</script>

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