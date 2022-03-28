<template>
  <div class="card m-2 flex-auto">
    <div
      class="card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"
    >
      <h3 class="text-lg leading-6 font-semibold">Disk Viewer</h3>
      <!-- <div class="mt-3 sm:mt-0 sm:ml-4"> -->
        <!-- <button type="button" class="card-refresh-btn"> -->
          <!-- <RefreshIconOutline class="h-5 w-5" aria-hidden="true" /> -->
        <!-- </button> -->
      <!-- </div> -->
    </div>
    <div class="card-body dark:bg-stone-700 flex-auto flex flex-col items-center content-center p-0">
      <P5Stornado2U :diskInfo="diskInfo"/>
    </div>
  </div>
</template>

<script>
import { RefreshIcon as RefreshIconOutline } from "@heroicons/vue/outline";
import P5Stornado2U from "./P5Stornado2U.vue";
import {ref} from "vue";

export default {
  components: {
    RefreshIconOutline,
    P5Stornado2U,
  },
  props:{
    diskInfo: Object
  },
  setup(props){
    const diskInfo = ref(props.diskInfo);

    return {
      diskInfo
    }
  }
};
</script>
