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
          <RowTool :buttonColor="buttonColor"
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
                @changeButtonColor="changeButtonColorHandler"
                :buttonColor="buttonColor"
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
import RowTool from "@/components/MainRowTool.vue";
import { supabase } from "@/clients/supabase";
import { useStore } from 'vuex';

const drawer = ref(false); // Управляет открытием/закрытием меню
const store = useStore();
const userId = computed(() => store.state.userId);
const buttonColor = ref('red');
const loginButtonText = ref('Login');
const loginButtonColor = ref('red');
const isLoggedIn = ref(false);
supabase.auth.onAuthStateChange((event, session) => {
  isLoggedIn.value = !!session;
  handleLoginStateChange(isLoggedIn.value);
});
const changeButtonColorHandler = (color) => {
  buttonColor.value = color;
};
const handleLoginStateChange = (isLoggedIn) => {
  if (isLoggedIn) {
    loginButtonText.value = 'Logout';
    loginButtonColor.value = 'purple';
    buttonColor.value = 'purple';
  } else {
    loginButtonText.value = 'Login';
    loginButtonColor.value = 'red';
    buttonColor.value = 'red';
  }
};
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
}
.main-with-margin {
  height: calc(100vh - 85px); /* Высота v-main с учетом header и отступа */
  overflow: hidden; /* Убираем прокрутку */
}
.content {
  padding-top: 20px;
}
.row-tool-container {
  display: flex;
  align-items: center;
  margin-right: 10px;
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