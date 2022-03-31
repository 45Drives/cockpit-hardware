<template>
  <div class="card m-2 flex-auto">
    <div
      class="card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"
    >
      <h3 class="text-lg leading-6 font-semibold">Disk Viewer</h3>
    </div>
    <div class="card-body dark:bg-stone-700 flex-auto flex flex-col items-center content-center p-0">
      <P5Stornado2U v-if="serverModel.split('-')[0] === 'Stornado' && serverModel.split('-')[1] === '2U'" />
      <P5StorinatorQ30 v-else-if="serverModel.split('-')[0] === 'Storinator' && serverModel.split('-')[1] === 'Q30'" />
    </div>
  </div>
</template>

<script>
import P5Stornado2U from "./P5Stornado2U.vue";
import P5StorinatorQ30 from "./P5StorinatorQ30.vue";
import {ref} from "vue";

export default {
  components: {
    P5Stornado2U,
    P5StorinatorQ30,
  },
  props:{
    serverInfo: Object
  },
  setup(props){
    const serverModel = ref(props.serverInfo.Model);
    console.log(serverModel);
    return {
      serverModel
    }
  }
};
</script>
