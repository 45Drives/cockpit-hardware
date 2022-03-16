<!-- This example requires Tailwind CSS v2.0+ -->
<template>
  <div class="card">
    <div
      class="card-header p-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between"
    >
      <h3 class="text-lg leading-6 font-semibold">System</h3>
      <div class="mt-3 sm:mt-0 sm:ml-4">
        <button type="button" class="card-refresh-btn" @click="getSystemInfo()">
          <RefreshIconOutline class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div v-if="!fatalError" class="flex flex-row justify-evenly">
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="border-b border-gray-200">
            <dl>
              <div
                class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium text-gray-500">Model</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ sysModel }}
                </dd>
              </div>
              <div
                class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium text-gray-500">Chassis Size</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ sysChassis }}
                </dd>
              </div>
              <div
                class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium text-gray-500">Serial</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ sysSerial }}
                </dd>
              </div>
              <div
                class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium text-gray-500">Motherboard</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ moboModel }}
                </dd>
              </div>
              <div
                class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium text-gray-500">
                  Motherboard Serial
                </dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ moboSerial }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <img
          :src="serverImgPath"
          class="object-contain h-72 rounded-none justify-self-center"
        />
      </div>
      <div v-if="fatalError">
        <ErrorMessage
          :errorMsg="fatalErrorMsg"
          :FixButton="showFixButton"
          :FixButtonHandler="fixButtonHandler"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { RefreshIcon as RefreshIconOutline } from "@heroicons/vue/outline";
import { ref } from "vue";
import useSpawn from "./cockpitSpawn.js";
import ErrorMessage from "./ErrorMessage.vue";

export default {
  components: {
    RefreshIconOutline,
    ErrorMessage,
  },
  setup() {
    const sysModel = ref("");
    const sysChassis = ref("");
    const sysSerial = ref("");
    const moboModel = ref("");
    const moboSerial = ref("");
    const serverImgPath = ref("img/45dlogo.png");
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });

    const getSystemImgPath = (model) => {
      if (model == "" || model == "?") {
        return "img/45dlogo.png";
      }

      const regExpModel =
        /(Storinator|Stornado).*(AV15|Q30|S45|XL60|2U|C8|MI4).*/;
      const match = model.match(regExpModel);
      const imgPathLookup = {
        "Storinator": {
          "AV15": "img/storinatorAV15.jpg",
          "Q30": "img/storinatorQ30.jpg",
          "S45": "img/storinatorS45.jpg",
          "XL60": "img/storinatorXL60.jpg",
          "C8": "img/storinatorC8.jpg",
          "MI4": "img/storinatorMI4.jpg",
        },
        "Stornado": {
          "2U": "img/stornado2U.jpg",
          "AV15": "img/stornadoAV15.jpg",
        },
      };

      if(!match) return "img/45dlogo.png";
      return imgPathLookup[match[1]][match[2]];
    };

    const getSystemInfo = async () => {
      sysModel.value = "Loading...";
      sysChassis.value = "Loading...";
      sysSerial.value = "Loading...";
      moboModel.value = "Loading...";
      moboSerial.value = "Loading...";
      serverImgPath.value = "img/45dlogo.png";
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-system-vue/scripts/server_info"],
          {
            err: "out",
            superuser: "require",
            promise: true,
          }
        );
        let sysInfo = JSON.parse(state.stdout);
        sysModel.value = sysInfo["Model"];
        sysChassis.value = sysInfo["Chassis Size"];
        sysSerial.value = sysInfo["Serial"];
        moboModel.value =
          sysInfo["Motherboard"]["Manufacturer"] +
          " " +
          sysInfo["Motherboard"]["Product Name"];
        moboSerial.value = sysInfo["Motherboard"]["Serial Number"];
        serverImgPath.value = getSystemImgPath(sysInfo["Model"]);
      } catch (err) {
        console.log(err);
        try {
          let errorJson = JSON.parse(err.stderr);
          fatalErrorMsg.value.length = 0;
          fatalErrorMsg.value.push(errorJson["error_msg"]);
          fatalErrorMsg.value.push("Click \"Fix\" to run /opt/45drives/tools/server_identifier");
          fatalError.value = true;
          if (
            errorJson["error_msg"] ==
            "/etc/45drives/server_info/server_info.json does not exist"
          ) {
            showFixButton.value = true;
            fixButtonHandler.value = async () => {
              try {
                const fixState = await useSpawn(
                ["/opt/45drives/tools/server_identifier"],
                {
                  err: "out",
                  superuser: "require",
                  promise: true,
                }
              );
                fatalError.value = false;
                fatalErrorMsg.value.length = 0;
                showFixButton.value = false;
                getSystemInfo();
              } catch (error) {
                console.log(error);
                fatalError.value = true;
                fatalErrorMsg.value.length = 0;
                fatalErrorMsg.value.push(error.stderr);
                fatalErrorMsg.value.push("An error occurred when running /opt/45drives/tools/server_identifier");
                showFixButton.value = false;
                console.log(showFixButton.value);
              }
            };
          }else{

          }
        } catch (error) {
          console.log(error);
          fatalError.value = true;
          fatalErrorMsg.value.length = 0;
          fatalErrorMsg.value.push(error.stderr);
          fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/server_info");
          showFixButton.value = false;
          console.log(showFixButton.value);
        }
      }
    };

    // start by gathering system info
    getSystemInfo();

    return {
      sysModel,
      sysChassis,
      sysSerial,
      moboModel,
      moboSerial,
      serverImgPath,
      getSystemInfo,
      getSystemImgPath,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler
    };
  },
};
</script>
