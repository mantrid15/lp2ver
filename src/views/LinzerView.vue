<template>
<!--  <div class="about" v-bind="$attrs">-->
<!--    <div class="inforow">
      <p id="account" v-if="account && account.data && account.data.session">
        Account: {{ account.data.session.user.email }}
      </p>
      <p> Protect the secret password: **TMX$$ </p>
    </div>-->
<!--    <div class="row-container">-->
      <Gate style="margin-top: 50px"></Gate>
<!--    </div>-->
<!--  </div>-->
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

<style scoped>
/*.about {
  margin-top: 60px; !* Отступ сверху *!
}*/

/*.inforow {
  height: var(--inforow-height);
  z-index: 10;
  display: flex;
  align-items: center;
  position: fixed; !* Фиксированное позиционирование *!
  padding: 10px;
  background-color: yellow;
  box-sizing: border-box;
  width: 100%;
}*/

/*.inforow p {
  margin-right: 50px;
}*/

/*.inforow p:last-child {
  margin-right: 0;
}*/

.row-container {
 /* margin-top: var(--inforow-height); !* Отступ равный высоте inforow *!*/
  padding: 20px;
  background-color: #f9f9f9;
  /*
  min-height: calc(100vh - var(--inforow-height)); !* Высота без высоты inforow *!
  */
  overflow: hidden; /* Скрыть вертикальную прокрутку */
  position: relative; /* Чтобы избежать недопонимания по высоте в родительском элементе */
}

/*!* Добавляем стиль для содержимого Gate *!
.row-container > * {
  !*max-height: calc(100% - 40px); !* Устанавливаем максимальную высоту для содержимого внутри row-container *!*!
  overflow: auto; !* Позволяем прокрутку только внутри компонента Gate, если нужно *!
}

#account {
  background-color: green;
}*/

/*
:root {
  --inforow-height: 60px; !* Переменная для высоты *!
}
*/


/*.row-container {
  margin-top: var(--inforow-height); !* Используем переменную для высоты *!
  padding: 20px;
  background-color: #f9f9f9;
  min-height: calc(100vh - var(--inforow-height));
}*/
</style>
