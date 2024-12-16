<template>
  <v-app>
  <v-toolbar density="compact" dark color="primary" >
    <v-app-bar-nav-icon></v-app-bar-nav-icon>
    <v-toolbar-title >
      <RouterLink to="/about">
        About
      </RouterLink>
      <RouterLink to="/">
        UshaMihaBot
      </RouterLink>
    </v-toolbar-title>
    <v-spacer></v-spacer>

    <v-btn to="/login" variant="outlined" dark color="pink-darken-4" size="large">
      Lo
      <v-img src="/lpicon.png"
             alt="Login Icon"
             width="20"
             height="20"
             class="mr-2 ml-2"
             color="white"
      />
      gin
    </v-btn>
  </v-toolbar>
  <v-main>
    <v-fade-transition>
      <RouterView />
    </v-fade-transition>
  </v-main>
    <v-footer
        class="custom-footer"
        dark
        color="primary"
        app
    >
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
// import { useRouter } from 'vue-router';

</script>

<style scoped>

</style>