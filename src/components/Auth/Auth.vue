<template>
  <v-sheet class="bg-deep-purple pa-12" rounded>
    <v-card class="mx-auto px-6 py-8" max-width="344">
      <h1 class="text-center">Test Form</h1>
      <v-form v-model="form" @submit.prevent="onSubmit">
        <v-text-field
            v-model="email"
            :rules="[required]"
            class="mb-2"
            label="Email"
            clearable
        ></v-text-field>

        <v-text-field
            v-model="password"
            :rules="[required]"
            label="Password"
            placeholder="Enter your password"
            clearable
        ></v-text-field>

        <div class="buttonContainer">
          <v-btn @click="isLogin ? login() : createAccount()" color="blue" block>
            {{ isLogin ? 'Войти' : 'Создать' }}
          </v-btn>
          <v-btn @click="toggleForm" color="green" block>
            {{ isLogin ? 'Создать аккаунт' : 'Уже есть аккаунт?' }}
          </v-btn>
          <v-btn @click="logout" color="red" block>Выйти</v-btn>
        </div>
      </v-form>
    </v-card>
  </v-sheet>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/clients/supabase";

export default {
  name: "Auth",
  setup(_, { emit }) {
    const email = ref("");
    const password = ref("");
    const form = ref(false);
    const loading = ref(false);
    const router = useRouter();
    const isLogin = ref(true); // Переменная для отслеживания состояния формы

    const required = (value) => !!value || 'Обязательное поле';

    async function createAccount() {
      console.log("Создание аккаунта начато...");
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      });
      if (error) {
        console.error("Ошибка создания аккаунта:", error);
      } else {
        console.log("Аккаунт создан:", data);
        router.push('/inforeg');
      }
    }

    async function login() {
      console.log("Вход в систему начат...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (error) {
        console.error('Ошибка входа:', error);
        return;
      } else {
        console.log("Вход выполнен:", data);
        router.push('/linzer');
        emit('changeButtonColor', 'purple');
        console.log('Сигнал отправлен: changeButtonColor с цветом purple');
        emit('toggleLoginLogout', 'Logout');
        console.log('Сигнал отправлен: toggleLoginLogout с текстом Logout');
      }
    }

    async function logout() {
      console.log("Выход из системы начат...");
      const {error} = await supabase.auth.signOut();
      if (error) {
        console.error("Ошибка выхода:", error);
      } else {
        console.log("Выход выполнен успешно");
        await router.push('/');
      }
    }

    function toggleForm() {
      isLogin.value = !isLogin.value; // Переключение состояния формы
    }

    function onSubmit() {
      loading.value = true; // Установка состояния загрузки
      console.log(isLogin.value ? "Обработка входа..." : "Обработка создания аккаунта...");
      if (isLogin.value) {
        login().finally(() => (loading.value = false)); // Вход в систему
      } else {
        createAccount().finally(() => (loading.value = false)); // Создание аккаунта
      }
    }

    return {
      email,
      password,
      form,
      loading,
      createAccount,
      login,
      logout,
      required,
      toggleForm,
      onSubmit,
      isLogin,
    };
  },
};
</script>

<style scoped>
.buttonContainer {
  display: flex;
  flex-direction: column;
  margin-top: 1em;
}
</style>
