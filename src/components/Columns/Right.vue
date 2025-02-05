vue
<template>
  <v-app :style="{ width: width, margin: '0 auto' }">
    <v-app-bar app color="red" dark>
      <div class="app-bar-container">
        <!-- Желтый модуль -->
        <div v-if="columnSize <= 4" class="yellow-box">
          <div v-if="userId" class="user-info">
            User ID: {{ userId }}
          </div>
        </div>
        <!-- Синий модуль с фильтром и сортировкой -->
        <div :class="['blue-box', { 'blue-box-small': columnSize === 1, 'blue-box-margin': columnSize === 6 }]">
          <div class="blue-content">
            <input
                v-model="filter"
                placeholder="Фильтр"
                class="filter-input"
                :style="{ width: '80%', height: '30px', padding: '0', borderRadius: '5px', border: '1px solid #ccc' }"
            />
            <div class="sort-icons" style="width: 20%;">
              <v-btn @click="cycleSort" icon>
                <v-icon color="white">{{ currentSortIcon }}</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
        <!-- Зеленый модуль -->
        <div :class="['green-box', { 'green-box-small': columnSize === 1 }]">
          <v-btn icon color="white" @click="openDialog">
            <v-icon>mdi-folder-plus</v-icon>
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
              :cols="columnSize" class="folder-column"
          >
            <v-card class="folder-card">
              <v-card-title class="folder-title">
                <v-icon class="folder-icon">mdi-folder</v-icon>
                <span class="folder-name">{{ folder.dir_name }}</span>
              </v-card-title>
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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { supabase } from '@/clients/supabase.js';
const SORT_ASC_ICON = '↑';
const SORT_DESC_ICON = '↓';
const SORT_DEFAULT_ICON = '⇅';

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
    const filter = ref('');
    const currentSortOrder = ref(0); // 0 - default, 1 - asc, 2 - desc
    const sortOrderIcons = [SORT_DEFAULT_ICON, SORT_ASC_ICON, SORT_DESC_ICON];
    const sortOrderValues = ['default', 'asc', 'desc'];
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

    // Вычисляемое свойство для проверки наличия фильтра
    const hasFilter = computed(() => {
      return filter.value.trim() !== ''; // Проверяем, есть ли введенный фильтр
    });

    // Вычисляемое свойство для текущей иконки сортировки
    const currentSortIcon = computed(() => {
      return sortOrderIcons[currentSortOrder.value];
    });

    // Отслеживание изменения значения width
    watch(
        () => props.width,
        (newWidth) => {
          console.log('Новое значение width:', newWidth);
        }
    );

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
        folder.dir_name.toLowerCase().includes(filter.value.toLowerCase())
      );
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

    onMounted(() => {
      fetchFolders();
    });

    onUnmounted(() => {
      // Очистка ресурсов, если необходимо
    });

    return {
      userId,
      dialog,
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
      cycleSort
    };
  }
};
</script>

<style scoped>
.filter-input {
  margin-left: 5px; /* Отступ между полем ввода и кнопками сортировки */
  background-color: white; /* Устанавливаем белый цвет фона */
  padding: 0; /* Убираем отступы */
  border: 1px solid #ccc; /* Убедитесь, что граница установлена */
  border-radius: 5px; /* Закругление углов */
}
.filter-input:focus {
  border-color: #ff8c00; /* Цвет границы при фокусе */
  background-color: #ffe5b4; /* Оранжевый фон при фокусе */
  outline: none; /* Убираем стандартное обводка при фокусе */
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
.yellow-box {
  flex: 1;
  height: 40px;
  background-color: yellow;
  margin-right: 5px;
  margin-left: 5px;
  display: flex;
  align-items: flex-start;
  border-radius: 5px; /* Закругление углов */
}
.blue-box {
  flex: 1;
  height: 40px;
  background-color: blue;
  margin-right: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px; /* Закругление углов */
}
.blue-box-small {
  flex: 0.67; /* Уменьшаем ширину на 1/3 */
}
.blue-box-margin {
  margin-left: 5px; /* Отступ слева для blue-box при 2 столбцах */
}
.blue-content {
  display: flex;
  align-items: center; /* Выравниваем элементы по центру по вертикали */
  justify-content: center; /* Выравниваем элементы по центру по горизонтали */
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
  border-radius: 5px; /* Закругление углов */
}
.green-box-small {
  flex: 0.33; /* Уменьшаем ширину в 3 раза */
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
  background-color: #fff; /* Белый фон для карточки */
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 130px; /* Увеличенная высота карточки */
  transition: all 0.3s ease; /* Добавляем плавный переход */
}
.folder-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
}
.folder-name {
  font-size: calc(1rem + (100% - 200px) * 0.5 / 300); /* Адаптивный размер шрифта */
  margin-bottom: 15px; /* Отступ между названием и иконкой */
  transition: font-size 0.3s ease; /* Плавное изменение размера шрифта */
}
.folder-icon {
  font-size: calc(5rem + (100% - 200px) * 5 / 300); /* Адаптивный размер иконки */
  color: transparent;
  background: linear-gradient(to bottom, #f0e68c, #d2b48c); /* Градиентный цвет иконки */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: font-size 0.3s ease; /* Плавное изменение размера иконки */
}
@media (max-width: 768px) {
  .folder-card {
    height: 150px; /* Уменьшаем высоту карточки на маленьких экранах */
  }
  .folder-name {
    font-size: calc(0.8rem + (100% - 150px) * 0.5 / 300); /* Меньший начальный размер шрифта */
  }
  .folder-icon {
    font-size: calc(4rem + (100% - 150px) * 5 / 300); /* Меньший начальный размер иконки */
  }
}
/* Добавляем стили для скроллбара */
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
  margin-right: 10px; /* Отступ между иконками сортировки и полем ввода */
  color: white;
}
</style>