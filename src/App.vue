vue
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
      <v-fade-transition>
        <RouterView />
      </v-fade-transition>
    </v-main>

    <v-footer class="custom-footer" dark color="primary" app>
      <v-row justify="center" no-gutters>
        <v-col class="text-center" cols="12">
          2024 — <strong>LinkParserVerTwo</strong>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import RowTool from "@/components/MainRowTool.vue";
// import { useRouter } from 'vue-router';
</script>

<style scoped>
.row-tool-container {
  display: flex;
  align-items: center;

  margin-right: 50px; /* Отступ в 50 пикселей от кнопки */
}
</style>