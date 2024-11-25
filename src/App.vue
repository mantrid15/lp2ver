<script setup>
import HelloWorld from './components/HelloWorld.vue'
// import TheWelcome from './components/TheWelcome.vue'

import LinkInput from "@/components/LinkInput_old.vue";


// import LinkInput from "@/components/LinkInput.vue";
// import LinkInputUrl from "@/components/LinkInputUrl.vue";
// import LinkInfo from "@/components/LinkInfoList.vue";
// import LinkInput from "@/components/LinkInput_minimal_work_script.vue";
// import LinkInput_l from "@/components/LinkInput_last.vue";
// import LinkInput_ from "@/components/LinkInput_old.vue";
// import LinkMod from './components/LinkMod.vue'
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />
    <div class="wrapper">
<!--      <HelloWorld msg="You did it!" />-->
    </div>
  </header>

  <main>
<!--    <TheWelcome />-->
<!--    <LinkInputUrl clear-fields=""/>-->
<!--    <LinkInfo clear-fields=""/>-->
    <LinkInput/>
<!--        <LinkInput_l/>-->
<!--            <LinkInput_ />-->
    <!--    <LinkMod />-->
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
