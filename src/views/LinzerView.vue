<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <Gate class="gate-content"></Gate>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from '@/clients/supabase.js';
import Gate from "@/components/Gate.vue";

const account = ref();
onMounted(async () => {
  await getSession();
});

async function getSession() {
  account.value = await supabase.auth.getSession();
  console.log(account.value);
}
</script>

<style scoped>
.gate-content {
  top: 39px;
  max-height: calc(100vh - 50px); /* Высота без учета inforow */
  overflow: hidden; /* Отключает вертикальную прокрутку */
  position: relative; /* Сохраняет относительное позиционирование */
}
</style>