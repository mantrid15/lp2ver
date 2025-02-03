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
      <v-container class="brown-background folders-container" >
        <v-row >
          <v-col v-for="(folder, index) in folders"
              :key="index"
              :cols="columnSize">
            <v-sheet class="pa-12"
                color="grey"
                :key="index"
            >{{ folder.dir_name }}
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>

<!--      <v-container class="brown-background fill-height mb-0" >
        <v-row no-gutters class="fill-height folders-container">
          <v-col
              v-for="(folder, index) in folders"
              :key="index"
              :cols="columnSize"
              class="d-flex align-start folder-column"
          >

            <v-sheet class="folder-card">
              {{ folder.dir_name }}
            </v-sheet>
&lt;!&ndash;            <v-card class="folder-card">
              <v-card-title>{{ folder.dir_name }}</v-card-title>
            </v-card>&ndash;&gt;
          </v-col>
        </v-row>
      </v-container>-->

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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { supabase } from '@/clients/supabase.js';

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

    // Вычисляемое свойство для определения количества столбцов
    const columnSize = computed(() => {
      const widthValue = parseFloat(props.width);
      if (widthValue > 22) {
        return 4; // 3 столбца (12 / 4 = 3)
      } else if (widthValue > 14) {
        return 6; // 2 столбца (12 / 6 = 2)
      } else {
        return 12; // 1 столбец (12 / 12 = 1)
      }
    });

    // Отслеживание изменения значения width
    watch(
        () => props.width,
        (newWidth) => {
          console.log('Новое значение width:', newWidth);
        }
    );

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

    return {
      userId,
      dialog,
      newFolderName,
      folders,
      createDirectory,
      errorMessage,
      successMessage,
      openDialog,
      closeDialog,
      columnSize // Возвращаем вычисляемое свойство
    };
  }
};
</script>

<style scoped>
/*.column {
  flex-shrink: 0;
  overflow: hidden;
  height: 100%;
}*/

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

.yellow-box {
  flex: 1;
  height: 40px;
  background-color: yellow;
  margin-right: 5px;
  margin-left: 5px;
  display: flex;
  align-items: flex-start;
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
  width: 90%;
  height: 100%;
  margin-bottom: 8px;
  /*
  flex-shrink: 0;
  */
}

.v-main {
  /*
  overflow: hidden;
  */
  height: calc(100vh - 64px);
}

.brown-background {
  background-color: brown;
  height: 100%;
  padding: 0;
  overflow-y: auto;
  max-height: calc(100vh - 64px);
}

.folders-container {
  height: auto;
  /*
  min-height: 200%;
  */
  display: flex;
  flex-wrap: wrap;
  padding: 16px 16px 10px;
  /*
  padding-bottom: 20px;
  */
}

.folder-column {

  min-height: fit-content;
  height: 120px;
  flex-grow: 1; /* Растягиваем элементы на всю доступную ширину */
}

/* Добавляем стили для скроллбара */
.brown-background::-webkit-scrollbar {
  width: 20px;
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
</style>