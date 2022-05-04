<script>
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
import FfdHeader from "./components/FfdHeader.vue";
import P5Motherboard from "./components/P5Motherboard.vue";
import { ref, reactive, provide } from "vue";
import { useSpawn } from "@45drives/cockpit-helpers/src/useSpawn";

export default {
  name: "App",
  components: {
    FfdHeader,
    P5Motherboard
  },
  setup() {
    const darkMode = ref(false);
    provide("darkModeInjectionKey",darkMode);
    const mobo_info = reactive({});
    provide("mobo_info", mobo_info);
    const mobo_json_path = ref("");
    provide("mobo_json_path", mobo_json_path);
    const pci_info = reactive({});
    provide("pci_info", pci_info);
    const sata_info = reactive({});
    provide("sata_info", sata_info);
    const ram_info = reactive({});
    provide("ram_info", ram_info);
    const network_info = reactive({});
    provide("network_info", network_info);
    const scriptsComplete = ref(false);
    const scriptsValid = ref(false);
    const supportedMotherboards = reactive(["X11DPL-i","X11SPL-F","H11SSL-i","X11SSH-CTF","X11SSM-F","X11SPi-TF"]);

    const preloadChecks = reactive({
      mobo_info: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
      },
      pci_info: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
      },
      sata_info: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
      },
      ram_info: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
      },
      network_info: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
      },
    });

    const getMoboInfo = async () => {
      try {
        const state = await useSpawn(
          [
            "/usr/share/cockpit/45drives-motherboard/helper_scripts/motherboard",
          ],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(mobo_info, result);
        console.log("mobo_info",result);
        preloadChecks.mobo_info.content = result;
        preloadChecks.mobo_info.finished = true;
        preloadChecks.mobo_info.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.mobo_info.content = null;
        preloadChecks.mobo_info.finished = true;
        preloadChecks.mobo_info.failed = true;
      }
    };

    const getPciInfo = async () => {
      try {
        const state = await useSpawn(
          [
            "/usr/share/cockpit/45drives-motherboard/helper_scripts/pci",
          ],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(pci_info, result);
        console.log("pci_info",result);
        preloadChecks.pci_info.content = result;
        preloadChecks.pci_info.finished = true;
        preloadChecks.pci_info.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.pci_info.content = null;
        preloadChecks.pci_info.finished = true;
        preloadChecks.pci_info.failed = true;
      }
    };

    const getSataInfo = async () => {
      try {
        const state = await useSpawn(
          [
            "/usr/share/cockpit/45drives-motherboard/helper_scripts/sata",
          ],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(sata_info, result);
        console.log("sata_info",result);
        preloadChecks.sata_info.content = result;
        preloadChecks.sata_info.finished = true;
        preloadChecks.sata_info.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.sata_info.content = null;
        preloadChecks.sata_info.finished = true;
        preloadChecks.sata_info.failed = true;
      }
    };

    const getRamInfo = async () => {
      try {
        const state = await useSpawn(
          [
            "/usr/share/cockpit/45drives-motherboard/helper_scripts/ram",
          ],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(ram_info, result);
        console.log("ram_info",result);
        preloadChecks.ram_info.content = result;
        preloadChecks.ram_info.finished = true;
        preloadChecks.ram_info.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.ram_info.content = null;
        preloadChecks.ram_info.finished = true;
        preloadChecks.ram_info.failed = true;
      }
    };

    const getNetworkInfo = async () => {
      try {
        const state = await useSpawn(
          [
            "/usr/share/cockpit/45drives-motherboard/helper_scripts/network",
          ],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(network_info, result);
        console.log("network_info",result);
        preloadChecks.network_info.content = result;
        preloadChecks.network_info.finished = true;
        preloadChecks.network_info.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.network_info.content = null;
        preloadChecks.network_info.finished = true;
        preloadChecks.network_info.failed = true;
      }
    };

    const init = async () => {
      await getMoboInfo();
      await getPciInfo();
      await getSataInfo();
      await getRamInfo();
      await getNetworkInfo();
      scriptsComplete.value = Boolean(
        preloadChecks.mobo_info.finished &&
          preloadChecks.pci_info.finished &&
          preloadChecks.sata_info.finished &&
          preloadChecks.ram_info.finished &&
          preloadChecks.network_info.finished
      );
      scriptsValid.value = Boolean(
        !preloadChecks.mobo_info.failed &&
          !preloadChecks.pci_info.failed &&
          !preloadChecks.sata_info.failed &&
          !preloadChecks.ram_info.failed &&
          !preloadChecks.network_info.failed
      );
      console.log(mobo_info['Motherboard Info'][0]['Motherboard'][0]['Product Name'])
      console.log(        supportedMotherboards.includes(
          mobo_info['Motherboard Info'][0]['Motherboard'][0]['Product Name']
        ))
      console.log(        scriptsComplete.value &&
        scriptsValid.value &&
        supportedMotherboards.includes(
          mobo_info['Motherboard Info'][0]['Motherboard'][0]['Product Name']
        ))
      
    };

    init();

    return {
      scriptsComplete,
      scriptsValid,
      preloadChecks,
      mobo_info,
      mobo_json_path,
      pci_info,
      sata_info,
      ram_info,
      network_info,
      supportedMotherboards,
    };
  },
};
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <FfdHeader moduleName="Motherboard" centerName />
    <div
      v-if="
        scriptsComplete &&
        scriptsValid &&
        supportedMotherboards.includes(
          mobo_info['Motherboard Info'][0]['Motherboard'][0]['Product Name']
        )
      " class="well flex flex-col items-center h-full"
    >
      <P5Motherboard></P5Motherboard>
    </div>
    <div v-else-if="!scriptsComplete">
      <div>SCRIPTS INCOMPLETE</div>
      <div>mobo_info {{ preloadChecks.mobo_info.finished }}  {{ preloadChecks.mobo_info.failed }}</div>
      <div>pci_info  {{ preloadChecks.pci_info.finished }}   {{ preloadChecks.pci_info.failed }}</div>
      <div>sata_info {{ preloadChecks.sata_info.finished }}  {{ preloadChecks.sata_info.failed }}</div>
      <div>ram_info  {{ preloadChecks.ram_info.finished }}   {{ preloadChecks.ram_info.failed }}</div>
      <div>network_info {{ preloadChecks.network_info.finished }} {{ preloadChecks.network_info.failed }}</div>
    </div>
    <div v-else>
      <div>ONE OR MORE SCRIPTS FAILED BRO</div>
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
