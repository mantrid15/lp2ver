<template>
    <div>Login Union страница проекта с регистрацией и маршрутизацией по прочим разделам - в зависимости от результат регистрации или аутентификации</div>
  <Auth></Auth>
</template>
<script>
// import LoginView from "@/components/Login.vue";
import {defineComponent} from "vue";
import Auth from "@/components/Auth/Auth.vue";

export default defineComponent({
  components: {Auth}
})


</script>