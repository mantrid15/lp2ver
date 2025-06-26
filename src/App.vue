<template>
  <v-app>
    <header>
      <v-toolbar density="default" dark color="primary" app class="fixed-toolbar">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
          <v-navigation-drawer v-model="drawer" temporary>
            <v-list>
              <!-- Главная -->
              <v-list-item to="/" title="Home" prepend-icon="mdi-home"></v-list-item>
              <!-- Linzer -->
              <v-list-item to="/linzer" title="LinZer" prepend-icon="mdi-cookie"></v-list-item>
              <!-- Todo -->
              <v-list-item to="/todo" title="ToDo" prepend-icon="mdi-format-list-checks"></v-list-item>
              <!-- Login/Logout -->
              <v-list-item to="/note" title="LiNote" prepend-icon="mdi-format-list-checks"></v-list-item>
              <v-list-item to="/dgantt" title="DGantt" prepend-icon="mdi-format-list-checks"></v-list-item>

              <v-list-item
                to="/login"
                :title="loginButtonText"
                :prepend-icon="isLoggedIn ? 'mdi-logout' : 'mdi-login'"
                @click="isLoggedIn ? handleLoginStateChange(false) : null"
                :class="isLoggedIn ? 'bg-purple' : 'bg-red'"
              ></v-list-item>
            </v-list>
          </v-navigation-drawer>
         <v-toolbar-title>
          <RouterLink to="/">Home</RouterLink>
<!--          <RouterLink to="/linzer">About</RouterLink>-->
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <div class="row-tool-container">
          <NewTask v-if="$route.path === '/todo'" />
          <NewNote v-else-if="$route.path === '/note'"
                   @note-created="triggerNotesRefresh"/>
          <RowTool v-else
                   :buttonColor="buttonColor"
                   @change-button-color="changeButtonColorHandler"
                   :userId="userId"></RowTool>
        </div>
      </v-toolbar>
    </header>
    <v-main class="main-with-margin">
      <div class="content">
        <router-view v-slot="{ Component }">
          <v-fade-transition>
            <component
                :is="Component"
                :key="refreshNotes"
                :refresh-trigger="refreshNotes"
                @note-created="triggerNotesRefresh"
                v-bind="{
                  ...($route.meta.requiresAuth ? { buttonColor } : {}),
                  ...($route.meta.requiresAuth ? { onChangeButtonColor: changeButtonColorHandler } : {})
                }"
            />
          </v-fade-transition>
        </router-view>
      </div>
    </v-main>
    <v-footer class="custom-footer" dark color="primary" app>
      <v-row justify="center" no-gutters>
        <v-col class="text-center" cols="12">
          2024 - <strong>LinkParserVerTwo / LinZerVerOne</strong> - 2025
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>
<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router'; // Добавленный импорт
import { supabase } from "@/clients/supabase";
import { useStore } from 'vuex';
import RowTool from "@/components/MainRowTool.vue";
import NewTask from '@/components/ToDo/NewTask.vue';
import NewNote from "@/components/LiNote/NewNote.vue";

const route = useRoute();
const drawer = ref(false);
const store = useStore();
const userId = computed(() => store.state.userId);
const buttonColor = ref('red');
const loginButtonText = ref('Login');
const isLoggedIn = ref(false);
const tasks = ref([]);
const refreshNotes = ref(false);
const refreshTrigger = ref(0); // Добавить реактивный триггер

const triggerNotesRefresh = () => {
  refreshNotes.value = Date.now(); // Используем timestamp вместо переключения
  console.log("Событие 'note-created' обработано в App, refreshNotes:", refreshNotes.value);
};

supabase.auth.onAuthStateChange((event, session) => {
  isLoggedIn.value = !!session;
  handleLoginStateChange(isLoggedIn.value);
});

const changeButtonColorHandler = (color) => {
  buttonColor.value = color;
};

const handleLoginStateChange = (loggedIn) => { // Переименовали для ясности
  isLoggedIn.value = loggedIn; // Обновляем состояние isLoggedIn
  loginButtonText.value = loggedIn ? 'Logout' : 'Login';
  buttonColor.value = loggedIn ? 'purple' : 'red';
};
// Добавили функцию выхода
const handleLogout = async () => {
  try {
    const {data, error} = await supabase
        .from('todolist')
        .select('*')
        .order('created_at', {ascending: true});

    if (error) throw error;

    tasks.value = (data || []).map(task => ({
      ...task,
      due_date_edit: formatDateForInput(task.due_date) || '',
      due_date: formatDateForDisplay(task.due_date) || '',
      editing: false,
      editingField: null,
      originalValue: ''
    }));
  } catch (error) {
    console.error('Ошибка при загрузке задач:', error);
  }
};

function formatDateForDisplay(dateString) {
  if (!dateString) return '';
  if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) return dateString;

  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatDateForInput(dateString) {
  if (!dateString) return '';
  if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    const [day, month, year] = dateString.split('.');
    return `${year}-${month}-${day}`;
  }

  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}
</script>
<style scoped>
.text-decoration-none {
  text-decoration: none;
}
.fixed-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
}
.main-with-margin {
  height: calc(100vh - 85px); /* Высота v-main с учетом header и отступа */
  overflow: hidden; /* Убираем прокрутку */
}
.content {
  padding-top: 20px;
}
.row-tool-container {
  /*
  width: 80%;
  */
  display: flex;
  align-items: center;
  justify-content: flex-end; /* Выравнивание содержимого по правому краю */
  margin-right: 10px;
}
.bg-red {
    background-color: rgba(255, 0, 0, 0.2) !important;
}
.bg-red:hover {
    background-color: rgba(255, 0, 0) !important;
}
.bg-purple {
  background-color: rgba(128, 0, 128, 0.2) !important;
}
.bg-purple:hover {
  background-color: rgba(100, 4, 100, 0.4) !important;
}
.bg-red {
  background-color: rgba(255, 0, 0, 0.2) !important;
}
.bg-red:hover {
  background-color: rgba(255, 0, 0, 0.4) !important;
}
</style>