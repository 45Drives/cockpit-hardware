<template>
  <div id="canvas-card" class="card m-2 inline-flex flex-col flex-auto">
    <div
      class="card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"
    >
      <h3 class="text-lg leading-6 font-semibold">Disk Viewer</h3>
    </div>
    <div
      v-if="activeSketchStr"
      ref="canvasCardBody"
      class="card-body dark:bg-stone-700 flex-auto flex flex-col items-center content-center p-0"
    >
      <P5Stornado2U v-if="activeSketchStr === 'Stornado2U'" />
      <P5StorinatorQ30 v-else-if="activeSketchStr === 'StorinatorQ30'" />
      <P5Stornado v-else-if="activeSketchStr === 'StornadoAV15'" />
      <P5StorinatorXL60H16
        v-else-if="activeSketchStr === 'StorinatorXL60H16'"
      />
      <P5StorinatorS45 v-else-if="activeSketchStr === 'StorinatorS45'" />
      <P5StorinatorS45H16 v-else-if="activeSketchStr === 'StorinatorS45H16'" />
      <P5StorinatorQ30H16 v-else-if="activeSketchStr === 'StorinatorQ30H16'" />
      <P5StorinatorAV15 v-else-if="activeSketchStr === 'StorinatorAV15'" />
      <P5StorinatorQ30H32 v-else-if="activeSketchStr === 'StorinatorQ30H32'" />
      <P5StorinatorS45H32 v-else-if="activeSketchStr === 'StorinatorS45H32'" />
      <P5StorinatorXL60H32
        v-else-if="activeSketchStr === 'StorinatorXL60H32'"
      />
      <P5StorinatorXL60 v-else-if="activeSketchStr === 'StorinatorXL60'" />
      <P5StorinatorC8 v-else-if="activeSketchStr === 'StorinatorC8'" />
      <P5StorinatorMI4 v-else-if="activeSketchStr === 'StorinatorMI4'" />
    </div>
      <div v-else class="grow flex justify-center items-center">
        <div
          class="p-5 bg-stone-100 dark:bg-stone-600 rounded-lg text-stone-500 dark:text-stone-300"
        >
          Unknown/Unsupported server model encountered '{{ serverModel }}'
        </div>
      </div>
  </div>
</template>

<script>
import P5Stornado2U from "./P5Stornado2U.vue";
import P5StorinatorQ30 from "./P5StorinatorQ30.vue";
import P5Stornado from "./P5Stornado.vue";
import { ref } from "vue";
import P5StorinatorXL60H16 from "./P5StorinatorXL60H16.vue";
import P5StorinatorS45 from "./P5StorinatorS45.vue";
import P5StorinatorS45H16 from "./P5StorinatorS45H16.vue";
import P5StorinatorS45H32 from "./P5StorinatorS45H32.vue";
import P5StorinatorQ30H16 from "./P5StorinatorQ30H16.vue";
import P5StorinatorAV15 from "./P5StorinatorAV15.vue";
import P5StorinatorQ30H32 from "./P5StorinatorQ30H32.vue";
import P5StorinatorXL60H32 from "./P5StorinatorXL60H32.vue";
import P5StorinatorXL60 from "./P5StorinatorXL60.vue";
import P5StorinatorC8 from "./P5StorinatorC8.vue";
import P5StorinatorMI4 from "./P5StorinatorMI4.vue";

export default {
  components: {
    P5Stornado2U,
    P5StorinatorQ30,
    P5Stornado,
    P5StorinatorXL60H16,
    P5StorinatorS45,
    P5StorinatorS45H16,
    P5StorinatorQ30H16,
    P5StorinatorAV15,
    P5StorinatorQ30H32,
    P5StorinatorS45H32,
    P5StorinatorXL60H32,
    P5StorinatorXL60,
    P5StorinatorC8,
    P5StorinatorMI4,
  },
  props: {
    serverInfo: Object,
  },
  setup(props) {
    const serverModel = ref(props.serverInfo.Model);
    const enableSketch = (modelString) => {
      let testString =
        /(Storinator|Stornado)-(H8)?(H16|H32)?-?(AV15|Q30|S45|XL60|2U|MI4|C8)/m.exec(
          modelString
        );
      let enableString = testString
        ? testString[1] + testString[4] + (testString[3] ? testString[3] : "")
        : "";
      return enableString;
    };

    const canvasCardBody = ref();
    const activeSketchStr = enableSketch(serverModel.value);

    return {
      serverModel,
      canvasCardBody,
      activeSketchStr,
    };
  },
};
</script>
