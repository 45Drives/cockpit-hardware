<script setup>
import ffdHeader from './components/ffdHeader.vue';
import SectionContainer from './components/SectionContainer.vue'
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
</script>

<template>
<div class="h-full flex flex-col overflow-hidden">
  <ffdHeader moduleName="System" centerName/>
  <SectionContainer/>
</div>
</template>

<style>
#app {
  font-family: "Red Hat Text";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin:0;
  @apply bg-white dark:bg-stone-800 h-full;
}
</style>