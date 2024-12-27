<template>
  <div class="about">
    <h1>This is protected content</h1>
    <div>сюда попадает пользователь который зарегистрировался и аутентифицировался.
      Здесь будет либо основаная база linZer либо маршрутизартор в прочие сервисы.</div>
	<p id="account"> Account: {{  account.data.session.user.email  }}</p>
	<p> Protect the secret password: **TMX$$ </p>

    <iframe width="1125" height="703" src="https://www.youtube.com/embed/S8v8q8IKvMc?list=PL5aATh0iaBQaTEowQR_HCwGJZuoR0Z_y4" title="myLinkParser" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    <div class="row-tool-container">
      <RowTool></RowTool>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { supabase } from '@/clients/supabase.js';
import RowTool from "@/components/MainRowTool.vue";



const account = ref();
getSession();

async function getSession() {
	account.value = await supabase.auth.getSession();
	console.log(account.value)
}
</script>

<style>
#account {
	color: green;
}
</style>
