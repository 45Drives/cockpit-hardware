<script setup>
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
import FfdHeader from './components/FfdHeader.vue';
import P5Canvas from "./components/p5Canvas.vue";
</script>

<template>
<div class="h-full flex flex-col overflow-hidden">
  <FfdHeader moduleName="Disks" centerName/>
  <P5Canvas></P5Canvas>
</div>
</template>

<style>
#app {
  font-family: "Red Hat Text";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin:0;
  @apply bg-white dark:bg-stone-800 h-full;
}
</style>