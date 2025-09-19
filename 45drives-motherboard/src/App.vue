<script>
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
import FfdHeader from "./components/FfdHeader.vue";
import P5Motherboard from "./components/P5Motherboard.vue";
import { ref, reactive, provide, onMounted } from "vue";
import { useSpawn } from "@45drives/cockpit-helpers/src/useSpawn";
import {
  CheckIcon,
  ExclamationIcon,
  DotsHorizontalIcon,
} from "@heroicons/vue/outline";
import ErrorMessage from "./components/ErrorMessage.vue";

export default {
  name: "App",
  components: {
    FfdHeader,
    P5Motherboard,
    CheckIcon,
    ExclamationIcon,
    DotsHorizontalIcon,
    ErrorMessage,
  },
  setup() {
    const darkMode = ref(false);
    provide("darkModeInjectionKey", darkMode);
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
    const server_info = reactive({});
    provide("server_info", server_info);
    const scriptsComplete = ref(false);
    const scriptsValid = ref(false);
    const supportedMotherboards = reactive([
      "X11SPL-F",
      "X11DPL-i",
      "H11SSL-i",
      "X11SSH-CTF",
      "X11SSM-F",
      "X11SPi-TF",
      "EPC621D8A",
      "X12SPL-F",
      "X12DPi-N6",
      "H12SSL-i",
      "X11SPH-nCTF",
      "X11SPH-nCTPF",
      "ME03-CE0-000",
      "MS03-6L0-000",
      "MS73-HB0-000",
      "MZ73-LM0-000",
      "MC13-LE1-000",
      "B550I AORUS PRO AX",
      "EC266D2I-2T/AQC",
      "ROMED8-2T/BCM",
      "ROMED8-2T",
      "ProArt X870E-CREATOR WIFI"
    ]);

    const adminCheck = ref(false);
    const adminFlag = ref(false);

    const delay_ms = (ms) => new Promise((res) => setTimeout(res, ms));

    const preloadChecks = reactive({
      mobo_info: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
        errorHeader: "Failed to obtain Motherboard & CPU Information",
      },
      pci_info: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
        errorHeader: "Failed to obtain PCI Information",
      },
      sata_info: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
        errorHeader: "Failed to obtain SATA Information",
      },
      ram_info: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
        errorHeader: "Failed to obtain RAM Information",
      },
      network_info: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
        errorHeader: "Failed to obtain Network Information",
      },
      server_info: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
        errorHeader: "Failed to obtain Server Information",
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
        preloadChecks.mobo_info.content = result;
        // Need to find a more elegant fix for this:
        // Not all H12SSL- boards show with expected lowercase 'i'. 
        // If motherboard script/dmidecode shows 'I', will force a change to lowercase so motherboard detection/drawing functions as intended
        if (preloadChecks.mobo_info.content["Motherboard Info"][0]["Motherboard"][0]["Product Name"] === 'H12SSL-I') {
          preloadChecks.mobo_info.content["Motherboard Info"][0]["Motherboard"][0]["Product Name"] = 'H12SSL-i';
        }
        preloadChecks.mobo_info.finished = true;
        preloadChecks.mobo_info.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.mobo_info.content = null;
        preloadChecks.mobo_info.finished = true;
        preloadChecks.mobo_info.failed = true;
        if (error.stdout)
          preloadChecks.mobo_info.errorMessage.push(error.stdout);
        if (error.stderr)
          preloadChecks.mobo_info.errorMessage.push(error.stderr);
      }
    };

    const getPciInfo = async () => {
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-motherboard/helper_scripts/pci"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(pci_info, result);
        preloadChecks.pci_info.content = result;
        preloadChecks.pci_info.finished = true;
        preloadChecks.pci_info.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.pci_info.content = null;
        preloadChecks.pci_info.finished = true;
        preloadChecks.pci_info.failed = true;
        if (error.stdout)
          preloadChecks.pci_info.errorMessage.push(error.stdout);
        if (error.stderr)
          preloadChecks.pci_info.errorMessage.push(error.stderr);
      }
    };

    const getSataInfo = async () => {
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-motherboard/helper_scripts/sata"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(sata_info, result);
        preloadChecks.sata_info.content = result;
        preloadChecks.sata_info.finished = true;
        preloadChecks.sata_info.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.sata_info.content = null;
        preloadChecks.sata_info.finished = true;
        preloadChecks.sata_info.failed = true;
        if (error.stdout)
          preloadChecks.sata_info.errorMessage.push(error.stdout);
        if (error.stderr)
          preloadChecks.sata_info.errorMessage.push(error.stderr);
      }
    };

    const getRamInfo = async () => {
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-motherboard/helper_scripts/ram"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(ram_info, result);
        preloadChecks.ram_info.content = result;
        preloadChecks.ram_info.finished = true;
        preloadChecks.ram_info.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.ram_info.content = null;
        preloadChecks.ram_info.finished = true;
        preloadChecks.ram_info.failed = true;
        if (error.stdout)
          preloadChecks.ram_info.errorMessage.push(error.stdout);
        if (error.stderr)
          preloadChecks.ram_info.errorMessage.push(error.stderr);
      }
    };

    const getNetworkInfo = async () => {
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-motherboard/helper_scripts/network"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(network_info, result);
        preloadChecks.network_info.content = result;
        preloadChecks.network_info.finished = true;
        preloadChecks.network_info.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.network_info.content = null;
        preloadChecks.network_info.finished = true;
        preloadChecks.network_info.failed = true;
        if (error.stdout)
          preloadChecks.network_info.errorMessage.push(error.stdout);
        if (error.stderr)
          preloadChecks.network_info.errorMessage.push(error.stderr);
      }
    };

    const getServerInfo = async () => {
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-motherboard/helper_scripts/server_info"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(server_info, result);
        preloadChecks.server_info.content = result;
        preloadChecks.server_info.finished = true;
        preloadChecks.server_info.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.server_info.content = null;
        preloadChecks.server_info.finished = true;
        preloadChecks.server_info.failed = true;
        if (error.stdout)
          preloadChecks.server_info.errorMessage.push(error.stdout);
        if (error.stderr)
          preloadChecks.server_info.errorMessage.push(error.stderr);
      }
    }

    const verifyPreload = async () => {
      while (
        !Boolean(
          preloadChecks.mobo_info.finished &&
            preloadChecks.pci_info.finished &&
            preloadChecks.sata_info.finished &&
            preloadChecks.ram_info.finished &&
            preloadChecks.network_info.finished
        )
      ) {
        await delay_ms(300);
      }
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
    };

    const init = async () => {
      getMoboInfo();
      getPciInfo();
      getSataInfo();
      getRamInfo();
      getNetworkInfo();
      getServerInfo();
      await verifyPreload();
    };

    const rootCheck = async () => {
      let root_check = cockpit.permission({ admin: true });
      root_check.addEventListener("changed", function () {
        if (root_check.allowed) {
          //user is an administrator, start the module as normal
          //setup on-click listeners for buttons as required.
          adminCheck.value = true;
          adminFlag.value = true;
          init();
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

    return {
      adminCheck,
      adminFlag,
      scriptsComplete,
      scriptsValid,
      preloadChecks,
      mobo_info,
      mobo_json_path,
      pci_info,
      sata_info,
      ram_info,
      network_info,
      server_info,
      supportedMotherboards,
    };
  },
};
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <FfdHeader moduleName="Motherboard" centerName />
    <div v-if="adminCheck && adminFlag" class="h-full bg-well">
      <div
        id="MotherboardContainer"
        v-if="
          scriptsComplete &&
          scriptsValid &&
          supportedMotherboards.includes(
            mobo_info['Motherboard Info'][0]['Motherboard'][0]['Product Name']
          )
        "
        class="well flex flex-col items-center h-full overflow-y-auto"
      >
        <P5Motherboard></P5Motherboard>
      </div>
      <div
        v-else-if="
          scriptsComplete &&
          scriptsValid &&
          !supportedMotherboards.includes(
            mobo_info['Motherboard Info'][0]['Motherboard'][0]['Product Name']
          )
        "
        class="well flex flex-col items-center h-full"
      >
        <div class="card">
          <div class="card-header">
            <h3 class="text-header text-default">
              Unsupported Motherboard Model Detected
            </h3>
          </div>
          <div class="card-body flex flex-col gap-4">
            <div class="flex flex-row gap-8">
              <div>Motherboard Detected:</div>
              <div class="text-muted">
                {{
                  mobo_info["Motherboard Info"][0]["Motherboard"][0][
                    "Product Name"
                  ]
                }}
              </div>
            </div>
            <div>
              <div
                class="bg-accent rounded-md p-5 flex flex-col items-center gap-4"
              >
                <div>
                  Support for
                  <span class="text-muted">{{
                    mobo_info["Motherboard Info"][0]["Motherboard"][0][
                      "Product Name"
                    ]
                  }}</span>
                  is not available at this time.
                </div>
                <a
                  href="https://github.com/45Drives/cockpit-hardware/issues"
                  class="text-blue-500"
                  target="_blank"
                >
                  Submit a feature request
                </a>
              </div>
            </div>
            <div class="grid grid-cols-2">
              <div class="col-span-1">Supported Motherboards:</div>
              <ul
                role="list"
                class="col-span-1 list-none pl-8 space-y-1 whitespace-pre text-muted"
              >
                <li v-for="entry in supportedMotherboards">{{ entry }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else-if="!scriptsComplete"
        class="card w-96 mx-auto z-10 my-10 flex flex-col"
      >
        <div class="card-header flex flex-row items-center">
          <h3 class="text-header text-default">Gathering Information</h3>
        </div>
        <div class="card-body">
          <div class="flex">
            <span
              :class="[
                preloadChecks.mobo_info.finished ? 'line-through' : '',
                'text-muted basis-1/2',
              ]"
              >Motherboard & CPU</span
            >
            <DotsHorizontalIcon
              v-if="!preloadChecks.mobo_info.finished"
              class="size-icon-lg icon-default basis-1/2"
            />
            <ExclamationIcon
              v-else-if="preloadChecks.mobo_info.failed"
              class="size-icon-lg icon-warning basis-1/2"
            />
            <CheckIcon v-else class="size-icon-lg icon-success basis-1/2" />
          </div>
          <div class="flex">
            <span
              :class="[
                preloadChecks.pci_info.finished ? 'line-through' : '',
                'text-muted basis-1/2',
              ]"
              >PCI</span
            >
            <DotsHorizontalIcon
              v-if="!preloadChecks.pci_info.finished"
              class="size-icon-lg icon-default basis-1/2"
            />
            <ExclamationIcon
              v-else-if="preloadChecks.pci_info.failed"
              class="size-icon-lg icon-warning basis-1/2"
            />
            <CheckIcon v-else class="size-icon-lg icon-success basis-1/2" />
          </div>
          <div class="flex">
            <span
              :class="[
                preloadChecks.sata_info.finished ? 'line-through' : '',
                'text-muted basis-1/2',
              ]"
              >SATA</span
            >
            <DotsHorizontalIcon
              v-if="!preloadChecks.sata_info.finished"
              class="size-icon-lg icon-default basis-1/2"
            />
            <ExclamationIcon
              v-else-if="preloadChecks.sata_info.failed"
              class="size-icon-lg icon-warning basis-1/2"
            />
            <CheckIcon v-else class="size-icon-lg icon-success basis-1/2" />
          </div>
          <div class="flex">
            <span
              :class="[
                preloadChecks.ram_info.finished ? 'line-through' : '',
                'text-muted basis-1/2',
              ]"
              >RAM</span
            >
            <DotsHorizontalIcon
              v-if="!preloadChecks.ram_info.finished"
              class="size-icon-lg icon-default basis-1/2"
            />
            <ExclamationIcon
              v-else-if="preloadChecks.ram_info.failed"
              class="size-icon-lg icon-warning basis-1/2"
            />
            <CheckIcon v-else class="size-icon-lg icon-success basis-1/2" />
          </div>
          <div class="flex">
            <span
              :class="[
                preloadChecks.network_info.finished ? 'line-through' : '',
                'text-muted basis-1/2',
              ]"
              >Network Devices</span
            >
            <DotsHorizontalIcon
              v-if="!preloadChecks.network_info.finished"
              class="size-icon-lg icon-default basis-1/2"
            />
            <ExclamationIcon
              v-else-if="preloadChecks.network_info.failed"
              class="size-icon-lg icon-warning basis-1/2"
            />
            <CheckIcon v-else class="size-icon-lg icon-success basis-1/2" />
          </div>
        </div>
      </div>
      <div v-else class="card-body">
        <div v-if="preloadChecks.mobo_info.failed">
          <ErrorMessage
            :errorMsg="preloadChecks.mobo_info.errorMessage"
            :errorHeader="preloadChecks.mobo_info.errorHeader"
          ></ErrorMessage>
        </div>
        <div v-if="preloadChecks.pci_info.failed">
          <ErrorMessage
            :errorMsg="preloadChecks.pci_info.errorMessage"
            :errorHeader="preloadChecks.pci_info.errorHeader"
          ></ErrorMessage>
        </div>
        <div v-if="preloadChecks.sata_info.failed">
          <ErrorMessage
            :errorMsg="preloadChecks.sata_info.errorMessage"
            :errorHeader="preloadChecks.sata_info.errorHeader"
          ></ErrorMessage>
        </div>
        <div v-if="preloadChecks.ram_info.failed">
          <ErrorMessage
            :errorMsg="preloadChecks.ram_info.errorMessage"
            :errorHeader="preloadChecks.ram_info.errorHeader"
          ></ErrorMessage>
        </div>
        <div v-if="preloadChecks.network_info.failed">
          <ErrorMessage
            :errorMsg="preloadChecks.network_info.errorMessage"
            :errorHeader="preloadChecks.network_info.errorHeader"
          ></ErrorMessage>
        </div>
      </div>
    </div>
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
            45Drives Motherboard requires administrative access to proceed.
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
