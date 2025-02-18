<template>
  <v-dialog :value="visible" max-width="300px" @input="$emit('update:visible', $event)" @close="handleResetRadio">
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
                  backgroundColor: linkCounts[folder.dir_hash] > 0 ? 'green' : 'red',
                  width: '100%',
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
                  <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.8em;">
                    {{ folder.dir_name }}
                  </span>
                </div>
                <span style="color: white;">
                  {{ linkCounts[folder.dir_hash] > 0 ? linkCounts[folder.dir_hash] : 0 }}
                </span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </div>
      <v-card-actions class="fixed-actions">
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="$emit('close')">
          Закрыть
        </v-btn>
        <v-btn
            color="red darken-1"
            text
            @click="handleDeleteFolder"
            :disabled="!localSelectedFolderId"
        >
          Удалить
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
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
  emits: ['update:selectedFolderId', 'close', 'editDirHash', 'clearDirHash', 'deleteFolder', 'toggleFolder', 'resetRadio', 'update:visible'],
  computed: {
    localSelectedFolderId: {
      get() {
        return this.selectedFolderId;
      },
      set(value) {
        this.$emit('update:selectedFolderId', value);
      }
    }
  },
  methods: {
    handleEditDirHash() {
      this.$emit('editDirHash');
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
    }
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