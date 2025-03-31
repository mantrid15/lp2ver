<template>
  <div class="column column-1" :style="{ backgroundColor: 'green', width: width }">
    <div v-if="userId && account?.data?.session?.user?.email" class="user-info">
      Account: {{ maskedEmail }}
    </div>
    <div>Правила использования:</div>
    <div>Drag&Drop - перетаскивание строки на карточку папки.</div>
    <div>Ctrl + перетягивание границы красного цвета</div>
    <div>Ctrl + перетаскивание папок с правой стороны для изменения порядка</div>
    <div>Клик на желтом поле - возврат в базовую папку - LIMBO </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { supabase } from "@/clients/supabase.js";

export default {
  name: 'Left',

  props: {
    width: {
      type: String,
      required: true
    }
  },

  setup() {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const userEmail = computed(() => store.state.user.email);
    const account = ref();

    async function getSession() {
      account.value = await supabase.auth.getSession();
      // console.log(account.value);
    }

    onMounted(() => {
      getSession(); // Вызываем при монтировании компонента
    });

    // Вычисляемое свойство для маскировки email
    const maskedEmail = computed(() => {
      const email = account.value?.data?.session?.user?.email;
      if (!email) return '';

      const [localPart, domainPart] = email.split('@');
      const firstTwoChars = localPart.slice(0, 2);
      const lastCharBeforeAt = localPart.slice(-1);
      const lastTwoCharsOfDomain = domainPart.slice(-2);

      return `${firstTwoChars}***${lastCharBeforeAt}@***${lastTwoCharsOfDomain}`;
    });

    return {
      userId,
      userEmail,
      account,
      maskedEmail, // Возвращаем вычисляемое свойство
    };
  }
};
</script>

<style scoped>
.column {
  flex-shrink: 0;
  overflow: hidden;
  height: 100%;
}
</style>