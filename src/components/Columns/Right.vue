<template>
  <v-app :style="{ width: width, margin: '0 auto' }">
    <v-app-bar app color="red" dark>
      <div class="app-bar-container">
        <div class="yellow-box">
          <div v-if="userId" class="user-info">
            ID пользователя: {{ userId }}
          </div>
        </div>
        <div class="green-box">
          <v-btn icon color="white" @click="openDialog">
            <v-icon>mdi-folder-plus</v-icon>
          </v-btn>
        </div>
      </div>
    </v-app-bar>
    <v-main>
      <v-container class="bg-surface-variant fill-height pa-0">
        <v-row no-gutters class="fill-height">
          <v-col
              v-for="(folder, index) in visibleFolders"
              :key="index"
              cols="12"
              sm="6"
              md="4"
              class="d-flex align-start"
          >
            <v-card class="folder-card ma-2">
              <v-card-title>{{ folder.dir_name }}</v-card-title>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <!-- Диалоговое окно -->
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
          <v-btn color="green darken-1" text @click="createDirectory">Create Dir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { supabase } from '@/clients/supabase.js'; // Импорт Supabase из указанного файла

export default {
  name: 'Right',
  props: {
    width: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const dialog = ref(false);
    const newFolderName = ref('');
    const folders = ref([]);
    const errorMessage = ref('');
    const successMessage = ref('');
    let realtimeChannel = null;

    // Функция для вычисления хеша
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

    const createDirectory = async () => {
      try {
        if (newFolderName.value.trim()) {
          const upperCaseFolderName = newFolderName.value.toUpperCase();
          const dirHash = await hashString(upperCaseFolderName); // Вычисление хеша

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
          // Закрываем диалоговое окно и показываем сообщение об успешном создании
          successMessage.value = 'Dir Is Created!!!';
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
        .channel('realtime-dirs')
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

    onMounted(() => {
      fetchFolders();
      subscribeToRealtimeChanges();
    });

    onUnmounted(() => {
      unsubscribeFromRealtimeChanges();
    });

    const visibleFolders = computed(() => {
      return folders.value.slice(0, 12);
    });

    return {
      userId,
      dialog,
      newFolderName,
      folders,
      createDirectory,
      visibleFolders,
      errorMessage,
      successMessage,
      openDialog,
      closeDialog
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
.user-info {
  padding: 2px; /* Паддинг в 2 пикселя */
  color: black;
  font-size: 0.7rem; /* Меньший размер текста */
  margin-top: 0; /* Прижатие к верхней части */
}
.app-bar-container {
  display: flex;
  align-items: center;
  width: 100%;
}
.yellow-box {
  flex: 1;
  height: 40px;
  background-color: yellow;
  margin-right: 5px;
  margin-left: 5px;
  display: flex;
  align-items: flex-start; /* Прижатие содержимого к верхней части */
}
.green-box {
  flex: 1;
  height: 40px;
  background-color: green;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 5px;
}
.folder-card {
  width: 100%;
  max-width: 250px; /* Максимальная ширина каждой карточки */
}
.v-main {
  overflow-y: auto; /* Добавление вертикальной прокрутки */
  max-height: calc(100vh - 64px); /* Вычитаем высоту app-bar */
}
.v-container {
  padding: 0; /* Убираем внутренние отступы контейнера */
}
</style>