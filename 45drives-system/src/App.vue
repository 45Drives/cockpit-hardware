<script setup>
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
import FfdHeader from './components/FfdHeader.vue';
import SectionContainer from './components/SectionContainer.vue'
</script>

<template>
<div class="h-full flex flex-col overflow-hidden">
  <FfdHeader moduleName="System" centerName/>
  <SectionContainer/>
</div>
</template>

<style>
@import "@45drives/cockpit-css/src/index.css";
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin:0;
  @apply bg-default h-full text-default;
}
</style>