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
        <RowTool></RowTool>
      </div>
      <v-btn to="/login" variant="outlined" dark color="pink-darken-4" size="large">
        Login
        <v-img
            src="/lpicon.png"
            alt="Login Icon"
            width="20"
            height="20"
            class="mr-2 ml-2"
            color="white"
        />
      </v-btn>
    </v-toolbar>

    <v-main>
      <router-view v-slot="{ Component }">
        <v-fade-transition>
          <component :is="Component" @changeButtonColor="changeButtonColorHandler" :buttonColor="buttonColor"/>
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
const buttonColor = ref('red'); // Начальный цвет кнопки

const changeButtonColorHandler = (color) => {
  buttonColor.value = color; // Изменяем цвет кнопки
};
</script>

<style scoped>
.row-tool-container {
  display: flex;
  align-items: center;
  margin-right: 10px; /* Отступ в 50 пикселей от кнопки */
}
</style>
