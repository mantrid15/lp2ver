<template>
  <v-app>
    <header>
      <v-toolbar density="default" dark color="primary" app class="fixed-toolbar">
        <v-app-bar-nav-icon></v-app-bar-nav-icon>
        <v-toolbar-title>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/linzer">About</RouterLink>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <div class="row-tool-container">
          <RowTool :buttonColor="buttonColor"
                   @change-button-color="changeButtonColorHandler"
                   :userId="userId"></RowTool>
        </div>
        <v-btn to="/login"
               variant="flat"
               :color="loginButtonColor"
               class="fixed-size-button"
               style="padding: 5px;"
               @click="isLoggedIn ? handleLoginStateChange(false) : null"
        ><span style="margin-right: 10px">
{{ loginButtonText }}
</span>
          <v-img
              src="/lpicon.png"
              alt="Login Icon"
              width="20"
              height="20"
              class="mr-2 ml-2"
              :color="loginButtonColor" />
        </v-btn>
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
  padding-top: 20px; /* Отступ для содержимого */
}
.fixed-size-button {
  width: 120px;
  height: 20px;
  min-width: 120px;
  min-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-tool-container {
  display: flex;
  align-items: center;
  margin-right: 10px;
}
.red-button {
  background-color: red;
  color: white;
}
.purple-button {
  background-color: purple;
  color: white;
}
</style>