<!-- This example requires Tailwind CSS v2.0+ -->
<template>
  <div class="card mt-2">
    <div
      class="card-header card-header flex flex-row items-center justify-between"
    >
      <h3 class="text-header text-default">System</h3>
      <div class="mt-3 sm:mt-0 sm:ml-4">
        <button type="button" class="card-refresh-btn" @click="getSystemInfo()">
          <RefreshIconOutline class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div v-if="!fatalError" class="flex flex-col md:flex-row justify-evenly">
        <div class="bg-default shadow overflow-hidden sm:rounded-lg">
          <div class="border-b border-default">
            <dl>
              <div
                class="bg-accent px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium ">Model</dt>
                <dd class="mt-1 text-sm text-muted sm:mt-0 sm:col-span-2">
                  {{ sysModel }}
                </dd>
              </div>
              <div
                class="bg-default px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium">Chassis Size</dt>
                <dd class="mt-1 text-sm text-muted sm:mt-0 sm:col-span-2">
                  {{ sysChassis }}
                </dd>
              </div>
              <div
                class="bg-accent px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium ">Serial</dt>
                <dd class="mt-1 text-sm text-muted sm:mt-0 sm:col-span-2">
                  {{ sysSerial }}
                </dd>
              </div>
              <div
                class="bg-default px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium ">Motherboard</dt>
                <dd class="mt-1 text-sm text-muted sm:mt-0 sm:col-span-2">
                  {{ moboModel }}
                </dd>
              </div>
              <div
                class="bg-accent px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium">
                  Motherboard Serial
                </dt>
                <dd class="mt-1 text-sm text-muted sm:mt-0 sm:col-span-2">
                  {{ moboSerial }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <img
          :src="serverImgPath"
          class="object-contain md:h-72 h-48 rounded-none justify-self-center"
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
import ErrorMessage from "./ErrorMessage.vue";
import { useSpawn } from "@45drives/cockpit-helpers/src/useSpawn";

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
      console.log('[Debug]: MODEL ->', model)
      const regExpModel =
        /(Storinator|Stornado|HomeLab|Professional|Proxinator|Studio).*(HL15_BEAST|HL15|HL4|HL8|PRO4|PRO8|PRO15|AV15|Q30|S45|XL60|2U|C8|MI4|F8X1|F8X2|F8X3|F2|VM8|VM16|VM32|STUDIO8|F16|VM2).*/;
      const match = model.match(regExpModel);
      const imgPathLookup = {
        "Storinator": {
          "AV15": "img/storinatorAV15.png",
          "Q30": "img/storinatorQ30.png",
          "S45": "img/storinatorS45.png",
          "XL60": "img/storinatorXL60.png",
          "C8": "img/storinatorC8.png",
          "MI4": "img/storinatorMI4.png",
          "F8X1": "img/F8X1.png",
          "F8X2": "img/F8X2.png",
          "F8X3": "img/F8X3.png"
        },
        "Stornado": {
          "2U": "img/stornado2U.png",
          "AV15": "img/stornadoAV15.png",
          "F2": "img/stornadoF2.png",
          "F16": "img/stornadoF16.png",
        },
        "HomeLab": {
          "HL15": "img/homelabHL15.png",
          "HL4": "img/homelabHL4.png",
          "HL8": "img/homelabHL8.png",
          "HL15_BEAST": "img/homelabHL15BEAST.png"
        },
        "Professional": {
          "PRO15": "img/professionalPRO15.png",
          "PRO4": "img/professionalPRO4.png",
          "PRO8": "img/professionalPRO8.png",
        },
        "Proxinator":{
          "VM2": "img/proxinatorVM2.png",
          "VM8": "img/proxinator.png",
          "VM16": "img/proxinator.png",
          "VM32": "img/proxinator.png",
        },
        "Studio":{
          "STUDIO8": "img/studioSTUDIO8.png"
        }
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
          ["/usr/share/cockpit/45drives-system/scripts/server_info"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let sysInfo = JSON.parse(state.stdout);
        sysModel.value = sysInfo["Model"];
        sysChassis.value = sysInfo["Chassis Size"];
        sysSerial.value = sysInfo["Serial"];
        moboModel.value =
        //  sysInfo["Motherboard"]["Manufacturer"] +
        //  " " +
          sysInfo["Motherboard"]["Product Name"];
        moboSerial.value = sysInfo["Motherboard"]["Serial Number"];
        serverImgPath.value = getSystemImgPath(sysInfo["Model"]);
      } catch (err) {
        console.log(err);
        try {
          console.log(err.stdout);
          let errorJson = JSON.parse(err.stdout);
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
                if (error.stderr) fatalErrorMsg.value.push(error.stderr);
                fatalErrorMsg.value.push("An error occurred when running /opt/45drives/tools/server_identifier");
                showFixButton.value = false;
              }
            };
          }else{

          }
        } catch (error) {
          console.log(error);
          fatalError.value = true;
          fatalErrorMsg.value.length = 0;
          if (error.stderr) fatalErrorMsg.value.push(error.stderr);
          fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/server_info");
          showFixButton.value = false;
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
