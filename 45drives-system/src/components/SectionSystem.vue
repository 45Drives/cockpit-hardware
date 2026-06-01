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
              <div
                class="bg-default px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium">BIOS Version</dt>
                <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2 flex items-center gap-2">
                  <span class="text-muted">{{ biosFirmware }}</span>
                  <span v-if="biosStatus === 'outdated'" class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Update Available ({{ biosLatest }})</span>
                  <span v-else-if="biosStatus === 'current'" class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Up to Date</span>
                </dd>
              </div>
              <div
                class="bg-accent px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium">BMC Version</dt>
                <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2 flex items-center gap-2">
                  <span class="text-muted">{{ bmcFirmware }}</span>
                  <span v-if="bmcStatus === 'outdated'" class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Update Available ({{ bmcLatest }})</span>
                  <span v-else-if="bmcStatus === 'current'" class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Up to Date</span>
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
import { server, Command, unwrap } from "@45drives/houston-common-lib";

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
    const biosFirmware = ref("-");
    const biosLatest = ref("");
    const biosStatus = ref("");
    const bmcFirmware = ref("-");
    const bmcLatest = ref("");
    const bmcStatus = ref("");
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
        /(Storinator|Stornado|HomeLab|Professional|Proxinator|Studio|Gateway).*(HL15_BEAST|HL15|HL4|HL8|X15|PRO4|PRO8|PRO15|AV15|Q30|S45|XL60|C8|MI4|NVME-F8X1|NVME-F8X2|NVME-F8X3|F8X1|F8X2|F8X3|F2|VM8|VM16|VM32|STUDIO8|F16|VM2|2UGW_REV2|1UGW|2U).*/;
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
          "F8X3": "img/F8X3.png",
          "NVME-F8X1": "img/45dlogo.png",
          "NVME-F8X2": "img/45dlogo.png",
          "NVME-F8X3": "img/45dlogo.png"
        },
        "Stornado": {
          "2U": "img/stornado2U.png",
          "AV15": "img/stornadoAV15.png",
          "F2": "img/stornadoF2.png",
          "F16": "img/stornadoF16.png",
        },
        "HomeLab": {
          "HL15": "img/homelabHL15.png",
          "X15": "img/homelabHL15.png",
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
        },
        "Gateway": {
          "2UGW_REV2": "img/gateway2U.png",
          "1UGW": "img/gateway1U.png"
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
        const proc = await unwrap(server.execute(
          new Command(["/usr/share/cockpit/45drives-system/scripts/server_info"], { superuser: "require" })
        ));
        let sysInfo = JSON.parse(proc.getStdout());
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
                const fixState = await unwrap(server.execute(
                  new Command(["/opt/45drives/tools/server_identifier"], { superuser: "require" })
                ));
                fatalError.value = false;
                fatalErrorMsg.value.length = 0;
                showFixButton.value = false;
                getSystemInfo();
              } catch (error) {
                console.log(error);
                fatalError.value = true;
                fatalErrorMsg.value.length = 0;
                if (error.message) fatalErrorMsg.value.push(error.message);
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
          if (error.message) fatalErrorMsg.value.push(error.message);
          fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/server_info");
          showFixButton.value = false;
        }
      }
    };

    const loadFirmwareStatus = async () => {
      let cacheData = null;
      try {
        const cacheProc = await unwrap(server.execute(
          new Command(["cat", "/var/cache/45drives/firmware.json"], { superuser: "require" })
        ));
        cacheData = JSON.parse(cacheProc.getStdout());
      } catch (e) {
        // Cache doesn't exist yet — generate it
        console.log("Firmware cache not found, running firmware-check...");
        try {
          await unwrap(server.execute(
            new Command(["python3", "/usr/share/cockpit/45drives-system/scripts/firmware-check"], { superuser: "require" })
          ));
          const retryProc = await unwrap(server.execute(
            new Command(["cat", "/var/cache/45drives/firmware.json"], { superuser: "require" })
          ));
          cacheData = JSON.parse(retryProc.getStdout());
        } catch (e2) {
          console.log("Firmware check failed:", e2);
          return;
        }
      }
      if (cacheData && cacheData.devices) {
        const bios = cacheData.devices.find(d => d.type === 'bios');
        const bmc = cacheData.devices.find(d => d.type === 'bmc');
        if (bios) {
          biosFirmware.value = bios.current_firmware || '-';
          biosLatest.value = bios.latest_firmware || '';
          biosStatus.value = bios.update_available || '';
        }
        if (bmc) {
          bmcFirmware.value = bmc.current_firmware || '-';
          bmcLatest.value = bmc.latest_firmware || '';
          bmcStatus.value = bmc.update_available || '';
        }
      }
    };

    // start by gathering system info
    getSystemInfo();
    loadFirmwareStatus();

    return {
      sysModel,
      sysChassis,
      sysSerial,
      moboModel,
      moboSerial,
      serverImgPath,
      biosFirmware,
      biosLatest,
      biosStatus,
      bmcFirmware,
      bmcLatest,
      bmcStatus,
      getSystemInfo,
      getSystemImgPath,
      loadFirmwareStatus,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler
    };
  },
};
</script>
