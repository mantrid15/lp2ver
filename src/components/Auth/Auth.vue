vue
<template>
  <v-container>
    <div class="content">
      <h1> Test Form </h1>
      <div class="inputContainer">
        <label for="email"> Email: </label>
        <input type="email" id="email" v-model="email">
      </div>
      <div class="inputContainer">
        <label for="password"> Password: </label>
        <input type="password" id="password" v-model="password">
      </div>

<!--      <div class="inputContainer">-->
<!--        <label for="firstName"> First Name </label>-->
<!--        <input type="text" id="firstName" v-model="firstName">-->
<!--      </div>-->

      <div class="buttonContainer">
        <button @click="createAccount"> Create </button>
        <button @click="login"> Login </button>
<!--        <button @click="seeUser"> See user </button>-->
        <button @click="logout"> Logout </button>
      </div>
    </div>
  </v-container>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router"; // Импортируем useRouter
import { supabase } from "@/clients/supabase";
// import { defineEmits } from 'vue'; // Импортируем defineEmits для событий

export default {
  name: "Auth",
  setup(_, { emit }) {
    const email = ref("");
    const password = ref("");
    const firstName = ref("");
    const router = useRouter(); // Инициализируем router
    // const emit = defineEmits(); // Определяем emit

    async function createAccount() {
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        // options: {
        //   data: {
        //     first_name: firstName.value,
        //   },
        // },
      });
      if (error) {
        console.log(error);
      } else {
        console.log(data);
        router.push('/inforeg'); // Переход на страницу /inforeg
      }
    }

    async function login() {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (error) {
        console.log('Login error:',error);
        // return;// Возврат, если произошла ошибка
      } else {
        console.log(data);
        router.push('/linzer');
        // await router.push('/linzer');
        emit('changeButtonColor', 'purple'); // Отправляем событие с новым цветом
        console.log('purple')
        emit('toggleLoginLogout', 'Logout'); // Отправляем событие для изменения текста кнопки
        console.log('logout')
      }
    }

    async function seeUser() {
      const localUser = await supabase.auth.getSession();
      console.log(localUser.data.session);
    }

    async function logout() {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log(error);
      } else {
        console.log("Sign out success");
        await router.push('/');
      }
    }

    return {
      email,
      password,
      firstName,
      createAccount,
      login,
      seeUser,
      logout,
    };
  },
};
</script>

<style scoped>
.inputContainer {
  display: flex;

  flex-direction: column;
}
.content {
  height: 300px;
  width: 500px;
  background: aqua;
}
input {
  font-size: 1.5em;
}
.buttonContainer {
  display: flex;
  flex-direction: column;
  margin-top: 1em;
  background: greenyellow;
}
button {
  margin-bottom: 1em;
  padding: 1em 2em;
  background: blueviolet;
}
</style>
