<template>
  <v-app>
    <v-toolbar density="compact" dark color="primary">
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
      <v-toolbar-title>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/linzer">About</RouterLink>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <div class="row-tool-container">
        <RowTool :buttonColor="buttonColor"
                 @change-button-color="changeButtonColorHandler"></RowTool>
      </div>
      <v-btn to="/login"
             variant="flat"
             :color="loginButtonColor"
             class="fixed-size-button"

             style="padding: 5px;"
             @click="isLoggedIn ? handleLoginStateChange(false) : null"

      ><span style="margin-left: 10px">
        {{ loginButtonText }}
                      </span>

        <v-img
            src="/lpicon.png"
            alt="Login Icon"
            width="20"
            height="20"
            class="mr-2 ml-2"
            :color="loginButtonColor"        />
      </v-btn>
    </v-toolbar>

    <v-main>
      <router-view v-slot="{ Component }">
        <v-fade-transition>
          <component
              :is="Component"
              @changeButtonColor="changeButtonColorHandler"
              :buttonColor="buttonColor"
          />
        </v-fade-transition>
      </router-view>
    </v-main>
    <v-footer class="custom-footer" dark color="primary" app>
      <v-row justify="center" no-gutters>
        <v-col class="text-center" cols="12">
          2024 — <strong>LinkParserVerTwo / LinZerVerFirst</strong> - 2025
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import RowTool from "@/components/MainRowTool.vue";
import { supabase } from "@/clients/supabase";

const buttonColor = ref('red'); // Начальный цвет кнопки
const loginButtonText = ref('Login'); // Текст кнопки логина
// const loginButtonColor = ref('green'); // Цвет кнопки логина
const loginButtonColor = ref('red'); // Цвет кнопки логина
const isLoggedIn = ref(false);
// Добавляем слушатель состояния аутентификации при монтировании
supabase.auth.onAuthStateChange((event, session) => {
  isLoggedIn.value = !!session;
  handleLoginStateChange(isLoggedIn.value);
});

const changeButtonColorHandler = (color) => {
  buttonColor.value = color; // Изменяем цвет кнопки
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
.fixed-size-button {
  width: 120px;
  height: 20px;
  min-width: 120px;
  min-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
/*  margin-bottom: 5px;
  margin-top: 5px;*/
}
.row-tool-container {
  display: flex;
  align-items: center;
  margin-right: 10px; /* Отступ в 50 пикселей от кнопки */
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
