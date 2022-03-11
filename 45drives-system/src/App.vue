<script setup>
import ffdHeader from './components/ffdHeader.vue'
import SectionHeading from './components/SectionHeading.vue';
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
</script>

<template>
  <ffdHeader moduleName="System"/>
  <SectionHeading/>
</template>

<style>
#app {
  font-family: "Red Hat Text";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin:0;
  padding:0;
  @apply bg-white dark:bg-stone-800 h-screen w-screen;
}
</style>