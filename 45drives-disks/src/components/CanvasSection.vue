<template>
  <div id="canvas-card" class="card inline-flex flex-col flex-auto">
    <div class="card-header flex flex-row items-center">
      <h3 class="text-header text-default">Disk Viewer</h3>
      <div class="grow"></div>
      <SwitchGroup v-if="zfsInfo.zfs_installed" as="div" class="flex items-center">
        <Switch v-model="enableZfsAnimations.flag" :class="[
            enableZfsAnimations.flag ? '!bg-red-700 dark:!bg-red-800' : '!bg-neutral-200 dark:!bg-neutral-900',
            'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none',
          ]">
          <span aria-hidden="true" :class="[
              enableZfsAnimations.flag ? 'translate-x-5' : 'translate-x-0',
              'pointer-events-none inline-block h-5 w-5 rounded-full shadow bg-default transform ring-0 transition ease-in-out duration-200',
            ]" />
        </Switch>
        <SwitchLabel as="span" class="ml-3">
          <span class="text-sm font-medium text-default">Show ZFS Animations</span>
        </SwitchLabel>
      </SwitchGroup>
    </div>
    <div v-if="activeSketchStr" ref="canvasCardBody"
      class="card-body flex-auto flex flex-col items-center content-center p-0 overflow-visible">
      <P5StornadoF2 v-if="activeSketchStr === 'StornadoF2'" />
      <P5F8X1 v-if="activeSketchStr === 'StorinatorF8X1'" />
      <P5F8X2 v-if="activeSketchStr === 'StorinatorF8X2'" />
      <P5F8X3 v-if="activeSketchStr === 'StorinatorF8X3'" />
      <P5Stornado2U v-if="activeSketchStr === 'Stornado2U'" />
      <P5StorinatorQ30 v-else-if="activeSketchStr === 'StorinatorQ30'" />
      <P5Stornado v-else-if="activeSketchStr === 'StornadoAV15'" />
      <P5StorinatorXL60H16 v-else-if="activeSketchStr === 'StorinatorXL60H16'" />
      <P5StorinatorS45 v-else-if="activeSketchStr === 'StorinatorS45'" />
      <P5StorinatorS45H16 v-else-if="activeSketchStr === 'StorinatorS45H16'" />
      <P5StorinatorQ30H16 v-else-if="activeSketchStr === 'StorinatorQ30H16'" />
      <P5StorinatorAV15 v-else-if="activeSketchStr === 'StorinatorAV15'" />
      <P5HomeLabHL15BEAST v-else-if="activeSketchStr === 'HomeLabHL15_BEAST'" />
      <P5HomeLabHL15 v-else-if="activeSketchStr === 'HomeLabHL15'" />
      <P5HomeLabHL4 v-else-if="activeSketchStr === 'HomeLabHL4'" />
      <P5HomeLabHL8 v-else-if="activeSketchStr === 'HomeLabHL8'" />
      <P5ProfessionalPRO15 v-else-if="activeSketchStr === 'ProfessionalPRO15'" />
      <P5ProfessionalPRO4 v-else-if="activeSketchStr === 'ProfessionalPRO4'" />
      <P5ProfessionalPRO8 v-else-if="activeSketchStr === 'ProfessionalPRO8'" />
      <P5StorinatorQ30H32 v-else-if="activeSketchStr === 'StorinatorQ30H32'" />
      <P5StorinatorS45H32 v-else-if="activeSketchStr === 'StorinatorS45H32'" />
      <P5StorinatorXL60H32 v-else-if="activeSketchStr === 'StorinatorXL60H32'" />
      <P5StorinatorXL60 v-else-if="activeSketchStr === 'StorinatorXL60'" />
      <P5StorinatorC8 v-else-if="activeSketchStr === 'StorinatorC8'" />
      <P5StorinatorMI4 v-else-if="activeSketchStr === 'StorinatorMI4'" />
      <P5ProxinatorVM8 v-else-if="activeSketchStr === 'ProxinatorVM8'" />
      <P5ProxinatorVM16 v-else-if="activeSketchStr === 'ProxinatorVM16'" />
      <P5ProxinatorVM32 v-else-if="activeSketchStr === 'ProxinatorVM32'" />
      <P5ProxinatorVM2 v-else-if="activeSketchStr === 'ProxinatorVM2'" />
      <P5StornadoF16 v-if="activeSketchStr === 'StornadoF16'" />
      <P5StudioSTUDIO8 v-else-if="activeSketchStr === 'StudioSTUDIO8'" />
    </div>
    <div v-else class="grow flex justify-center items-center">
      <div class="p-5 bg-accent rounded-lg text-muted">
        Unknown/Unsupported server model encountered '{{ serverModel }}'
      </div>
    </div>
  </div>
</template>

<script>
import P5StornadoF2 from "./P5StornadoF2.vue";
import P5F8X1 from "./P5F8X1.vue";
import P5F8X2 from "./P5F8X2.vue";
import P5F8X3 from "./P5F8X3.vue";
import P5Stornado2U from "./P5Stornado2U.vue";
import P5StorinatorQ30 from "./P5StorinatorQ30.vue";
import P5Stornado from "./P5Stornado.vue";
import { ref,inject,watch } from "vue";
import P5StorinatorXL60H16 from "./P5StorinatorXL60H16.vue";
import P5StorinatorS45 from "./P5StorinatorS45.vue";
import P5StorinatorS45H16 from "./P5StorinatorS45H16.vue";
import P5StorinatorS45H32 from "./P5StorinatorS45H32.vue";
import P5StorinatorQ30H16 from "./P5StorinatorQ30H16.vue";
import P5StorinatorAV15 from "./P5StorinatorAV15.vue";
import P5HomeLabHL15BEAST from "./P5HomeLabHL15BEAST.vue";
import P5HomeLabHL15 from "./P5HomeLabHL15.vue";
import P5HomeLabHL4 from "./P5HomeLabHL4.vue";
import P5HomeLabHL8 from "./P5HomeLabHL8.vue";
import P5ProfessionalPRO15 from "./P5ProfessionalPRO15.vue";
import P5ProfessionalPRO4 from "./P5ProfessionalPRO4.vue";
import P5ProfessionalPRO8 from "./P5ProfessionalPRO8.vue";
import P5StorinatorQ30H32 from "./P5StorinatorQ30H32.vue";
import P5StorinatorXL60H32 from "./P5StorinatorXL60H32.vue";
import P5StorinatorXL60 from "./P5StorinatorXL60.vue";
import P5StorinatorC8 from "./P5StorinatorC8.vue";
import P5StorinatorMI4 from "./P5StorinatorMI4.vue";
import P5ProxinatorVM8 from "./P5ProxinatorVM8.vue";
import P5ProxinatorVM16 from "./P5ProxinatorVM16.vue";
import P5ProxinatorVM32 from "./P5ProxinatorVM32.vue";
import P5ProxinatorVM2 from "./P5ProxinatorVM2.vue";
import P5StornadoF16 from "./P5StornadoF16.vue";
import P5StudioSTUDIO8 from "./P5StudioSTUDIO8.vue";
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue'

export default {
  components: {
    P5StornadoF2,
    P5F8X1,
    P5F8X2,
    P5F8X3,
    P5Stornado2U,
    P5StorinatorQ30,
    P5Stornado,
    P5StorinatorXL60H16,
    P5StorinatorS45,
    P5StorinatorS45H16,
    P5StorinatorQ30H16,
    P5StorinatorAV15,
    P5HomeLabHL15BEAST,
    P5HomeLabHL15,
    P5HomeLabHL4,
    P5HomeLabHL8,
    P5ProfessionalPRO15,
    P5ProfessionalPRO4,
    P5ProfessionalPRO8,
    P5StorinatorQ30H32,
    P5StorinatorS45H32,
    P5StorinatorXL60H32,
    P5StorinatorXL60,
    P5StorinatorC8,
    P5StorinatorMI4,
    P5ProxinatorVM8,
    P5ProxinatorVM16,
    P5ProxinatorVM32,
    P5ProxinatorVM2,
    P5StornadoF16,
    P5StudioSTUDIO8,
    Switch,
    SwitchGroup,
    SwitchLabel,
  },
  props: {
    serverInfo: Object,
  },
  setup(props) {
    const serverModel = ref(props.serverInfo.Model);
    const enableZfsAnimations = inject("enableZfsAnimations");
    const zfsInfo = inject("zfsInfo");

    const enableSketch = (modelString) => {
      let testString =
        /(Storinator|Stornado|HomeLab|Professional|Proxinator|Studio)-(H8)?(H16|H32)?-?(HL15_BEAST|HL15|HL4|HL8|PRO15|PRO4|PRO8|AV15|Q30|S45|XL60|F2|2U|MI4|C8|F8X1|F8X2|F8X3|VM8|VM16|VM32|STUDIO8|F16|VM2)/m.exec(
          modelString
        );
      let enableString = testString
        ? testString[1] + testString[4] + (testString[3] ? testString[3] : "")
        : "";

      return enableString;
    };

    const canvasCardBody = ref();
    const activeSketchStr = enableSketch(serverModel.value);
    watch(enableZfsAnimations,()=>{});


    return {
      serverModel,
      canvasCardBody,
      activeSketchStr,
      zfsInfo,
      enableZfsAnimations
    };
  },
};
</script>
