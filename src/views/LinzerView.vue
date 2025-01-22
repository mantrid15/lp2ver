<template>
  <div class="about" v-bind="$attrs">
    <div class="inforow">
      <p id="account" v-if="account && account.data && account.data.session">
        Account: {{ account.data.session.user.email }}
      </p>
      <p> Protect the secret password: **TMX$$ </p>
    </div>
    <div class="row-container">
      <Gate></Gate>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted  } from "vue";
import { supabase } from '@/clients/supabase.js';
import Gate from  "@/components/Gate.vue";

const account = ref();
onMounted(async () => {
  await getSession();
});

async function getSession() {
  account.value = await supabase.auth.getSession();
  console.log(account.value);
}
</script>

<style>
.about {
  margin-top: 60px; /* Отступ сверху на 50 пикселей */
}

.inforow {
  display: flex; /* Используем Flexbox для выравнивания элементов в строку */
  align-items: center; /* Выравнивание по центру по вертикали */
  position: fixed; /* Закрепляем элемент */
  /*
  z-index: 10; !* Убедитесь, что элемент ниже других с более высоким z-index *!
  */
  padding: 10px; /* Отступы внутри элемента (опционально) */
  background-color: yellow; /* Жёлтая заливка */
  box-sizing: border-box; /* Учитываем отступы в ширине */
  width: 100%; /* Занимаем всю ширину экрана */
}
.inforow p {
  margin-right: 50px; /* Отступ между элементами в 50 пикселей */
}
/* Убираем отступ для последнего элемента, чтобы избежать лишнего пространства */
.inforow p:last-child {
  margin-right: 0;
}
.row-container {
  /*
  top: 55px;
  */
  margin-top: 30px; /* Установите отступ сверху, чтобы они примыкали */
  padding: 20px; /* Добавьте отступы по желанию */
  background-color: #f9f9f9; /* Фон для контейнера */
}

#account {
	color: green;
}
</style>
