<template>
  <v-dialog v-model="localVisible" max-width="400px">
    <v-card>
      <v-card-title class="headline">Создание новой директории</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="localNewFolderName"
          label="Название директории"
          required
        ></v-text-field>
        <v-alert v-if="errorMessage" type="error" class="mt-4">
          {{ errorMessage }}
        </v-alert>
        <v-alert v-if="successMessage" type="success" class="mt-4">
          {{ successMessage }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="handleClose">
          Отмена
        </v-btn>
        <v-btn color="green darken-1" text @click="handleCreate">
          Создать директорию
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'CreateDirView',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    newFolderName: {
      type: String,
      required: true
    },
    errorMessage: {
      type: String,
      default: ''
    },
    successMessage: {
      type: String,
      default: ''
    }
  },
  emits: ['update:newFolderName', 'close', 'create', 'update:visible'],
  computed: {
    // Используем вычисляемое свойство для v-model привязки visible
    localVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit('update:visible', value);
      }
    },
    localNewFolderName: {
      get() {
        return this.newFolderName;
      },
      set(value) {
        this.$emit('update:newFolderName', value);
      }
    }
  },
  methods: {
    handleClose() {
      this.$emit('close');
    },
    handleCreate() {
      this.$emit('create');
    }
  }
};
</script>

<style scoped>
.mt-4 {
  margin-top: 16px;
}
</style>