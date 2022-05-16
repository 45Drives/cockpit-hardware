<script setup>
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
import FfdHeader from "./components/FfdHeader.vue";
import SectionContainer from "./components/SectionContainer.vue";
import { ref , onMounted} from "vue";

const adminCheck = ref(false);
const adminFlag = ref(false);

const rootCheck = async () => {
  let root_check = cockpit.permission({ admin: true });
  root_check.addEventListener("changed", function () {
    if (root_check.allowed) {
      //user is an administrator, start the module as normal
      //setup on-click listeners for buttons as required.
      adminCheck.value = true;
      adminFlag.value = true;
    } else {
      //user is not an administrator, block the page content.
      adminCheck.value = true;
      adminFlag.value = false;
    }
  });
};

onMounted(()=>{
  rootCheck();
});

</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <FfdHeader moduleName="System" centerName />
    <SectionContainer v-if="adminCheck && adminFlag" />
    <div
      v-else-if="adminCheck && !adminFlag"
      class="grow flex flex-col well overflow-y-auto p-4 justify-center items-center"
    >
      <div class="card">
        <div class="card-header">
          <h3 class="text-header text-default">
            Administrative Access Required
          </h3>
        </div>
        <div class="card-body flex flex-col gap-4">
          <div
            class="bg-accent rounded-md p-5 flex flex-col items-center gap-4"
          >
            45Drives System requires administrative access to proceed.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import "@45drives/cockpit-css/src/index.css";
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  @apply bg-default h-full text-default;
}
</style>
