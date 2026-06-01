<!-- This example requires Tailwind CSS v2.0+ -->
<template>
<div class="card">
  <div
    class="card-header card-header flex flex-row items-center justify-between"
  >
    <h3 class="text-header text-default">PCI</h3>
    <div class="mt-3 sm:mt-0 sm:ml-4">
        <button type="button" class="card-refresh-btn" :disabled="isFlashing" @click="getPciInfo(true)">
          <RefreshIconOutline class="h-5 w-5" aria-hidden="true" />
        </button>
    </div>
  </div>
  <div class="card-body">
    <div v-if="!fatalError" class="mt-2 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-default">
              <thead class="bg-accent">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold  sm:pl-6">Slot</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Type</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Availability</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Bus Address</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Card Type</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Card Model</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Firmware Version</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Latest FW</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="pci in pcis" :key="pci.socket">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">{{ pci.slot }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.type }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.availibility }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.busAddress }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.cardType }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.cardModel }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.firmwareVersion }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.latestFirmware || '-' }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                    <div v-if="pci.rebootRequired" class="flex items-center gap-2">
                      <span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Reboot Required</span>
                      <button @click="showRebootDialog()" class="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700">Reboot Now</button>
                    </div>
                    <div v-else-if="pci.updateStatus === 'outdated'" class="flex items-center gap-2">
                      <span class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Update Available</span>
                      <button @click="showUpdateModal(pci)" class="inline-flex items-center rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700">Info</button>
                      <button v-if="pci.flashable" :disabled="pci.flashing" @click="flashDevice(pci)" class="inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">{{ pci.flashing ? 'Flashing...' : 'Update Now' }}</button>
                    </div>
                    <span v-else-if="pci.updateStatus === 'current'" class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Up to Date</span>
                    <span v-else-if="pci.firmwareVersion && pci.firmwareVersion !== '-' && pci.firmwareVersion !== 'Loading...'" class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Unknown</span>
                    <span v-else class="text-muted">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
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

<!-- Update Info Modal -->
<div v-if="modalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="modalVisible = false">
  <div class="bg-default rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
    <div class="px-6 py-4 border-b border-default flex justify-between items-center">
      <h3 class="text-lg font-semibold">Firmware Update Instructions</h3>
      <button @click="modalVisible = false" class="text-muted hover:text-default text-xl">&times;</button>
    </div>
    <div class="px-6 py-4 space-y-3">
      <div>
        <span class="text-sm font-medium">Device:</span>
        <span class="text-sm text-muted ml-2">{{ modalData.model }}</span>
      </div>
      <div>
        <span class="text-sm font-medium">Current Version:</span>
        <span class="text-sm text-muted ml-2">{{ modalData.currentFw }}</span>
      </div>
      <div>
        <span class="text-sm font-medium">Latest Version:</span>
        <span class="text-sm text-muted ml-2">{{ modalData.latestFw }}</span>
      </div>
      <div>
        <span class="text-sm font-medium">Flash Tool:</span>
        <span class="text-sm text-muted ml-2">{{ modalData.flashTool || 'N/A' }}</span>
      </div>
      <div>
        <span class="text-sm font-medium">Command:</span>
        <code class="block mt-1 bg-accent rounded px-3 py-2 text-sm font-mono break-all">{{ modalData.flashCommand || 'N/A' }}</code>
      </div>
      <div v-if="modalData.firmwareFile">
        <span class="text-sm font-medium">Firmware File:</span>
        <span class="text-sm text-muted ml-2">{{ modalData.firmwareFile }}</span>
      </div>
      <div v-if="modalData.requiresReboot">
        <span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Requires Reboot</span>
      </div>
      <div v-if="modalData.releaseNotes">
        <span class="text-sm font-medium">Notes:</span>
        <p class="text-sm text-muted mt-1">{{ modalData.releaseNotes }}</p>
      </div>
    </div>
    <div class="px-6 py-3 border-t border-default flex justify-end">
      <button @click="modalVisible = false" class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">Close</button>
    </div>
  </div>
</div>

<!-- Reboot Confirmation Modal -->
<div v-if="rebootModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-default rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
    <div class="px-6 py-4 border-b border-default">
      <h3 class="text-lg font-semibold text-red-600">Reboot Required</h3>
    </div>
    <div class="px-6 py-4">
      <p class="text-sm">Firmware has been flashed successfully. A reboot is required to activate the new firmware.</p>
      <p class="text-sm text-muted mt-2">Would you like to reboot now or later?</p>
    </div>
    <div class="px-6 py-3 border-t border-default flex justify-end gap-3">
      <button @click="rebootLater()" class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">Later</button>
      <button @click="rebootNow()" class="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Reboot Now</button>
    </div>
  </div>
</div>
</template>

<script>
import { RefreshIcon as RefreshIconOutline } from "@heroicons/vue/outline";
import { ref, onBeforeUnmount } from "vue";
import { server, Command, unwrap } from "@45drives/houston-common-lib";
import ErrorMessage from "./ErrorMessage.vue";

export default {
  setup() {
    const pcis = ref([
      { slot: 'Loading...', type: 'Loading...', availibility: 'Loading...', busAddress: 'Loading...', cardType: 'Loading...', cardModel: 'Loading...', firmwareVersion: 'Loading...' }
    ]);
    const isFlashing = ref(false);
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const loadFirmwareCache = async () => {
      try {
        const cacheProc = await unwrap(server.execute(
          new Command(["cat", "/var/cache/45drives/firmware.json"], { superuser: "require" })
        ));
        return JSON.parse(cacheProc.getStdout());
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
          return JSON.parse(retryProc.getStdout());
        } catch (e2) {
          console.log("Firmware check failed:", e2);
          return null;
        }
      }
    };

    const modalVisible = ref(false);
    const modalData = ref({});

    const showUpdateModal = (pci) => {
      modalData.value = {
        model: pci.cardModel || pci.busAddress,
        currentFw: pci.firmwareVersion,
        latestFw: pci.latestFirmware,
        flashTool: pci.flashTool,
        flashCommand: pci.flashCommand,
        firmwareFile: pci.firmwareFile,
        requiresReboot: pci.requiresReboot,
        releaseNotes: pci.releaseNotes
      };
      modalVisible.value = true;
    };

    const mergeFirmwareStatus = (pciList, cache) => {
      if (!cache || !cache.devices) return;
      cache.devices.forEach(device => {
        if (device.type !== 'hba' && device.type !== 'nic') return;
        const match = pciList.find(pci => pci.busAddress === device.device_path);
        if (match) {
          match.latestFirmware = device.latest_firmware || null;
          match.updateStatus = device.update_available || 'unknown';
          match.flashTool = device.flash_tool || null;
          match.flashCommand = device.flash_command || null;
          match.firmwareFile = device.firmware_file || null;
          match.requiresReboot = device.requires_reboot || false;
          match.releaseNotes = device.release_notes || null;
          match.flashable = device.flashable || false;
          match.deviceType = device.type;
          match.flashing = false;
        }
      });
    };

    const rebootModalVisible = ref(false);
    const REBOOT_PENDING_FILE = '/var/cache/45drives/reboot-pending.json';

    const saveRebootPending = async (busAddress) => {
      try {
        // Read existing pending list
        let pending = [];
        try {
          const proc = await unwrap(server.execute(
            new Command(["cat", REBOOT_PENDING_FILE], { superuser: "require" })
          ));
          pending = JSON.parse(proc.getStdout());
        } catch (e) { /* file doesn't exist yet */ }
        if (!pending.includes(busAddress)) {
          pending.push(busAddress);
        }
        await unwrap(server.execute(
          new Command(["bash", "-c", `echo '${JSON.stringify(pending)}' > ${REBOOT_PENDING_FILE}`], { superuser: "require" })
        ));
      } catch (e) {
        console.log("Failed to save reboot-pending state:", e);
      }
    };

    const loadRebootPending = async () => {
      try {
        const proc = await unwrap(server.execute(
          new Command(["cat", REBOOT_PENDING_FILE], { superuser: "require" })
        ));
        return JSON.parse(proc.getStdout());
      } catch (e) {
        return [];
      }
    };

    const clearRebootPending = async () => {
      try {
        await unwrap(server.execute(
          new Command(["rm", "-f", REBOOT_PENDING_FILE], { superuser: "require" })
        ));
      } catch (e) { /* ignore */ }
    };

    const showRebootDialog = () => {
      rebootModalVisible.value = true;
    };

    const rebootLater = () => {
      rebootModalVisible.value = false;
    };

    const rebootNow = async () => {
      rebootModalVisible.value = false;
      await clearRebootPending();
      try {
        cockpit.spawn(["shutdown", "-r", "now"], { superuser: "require" });
      } catch (e) {
        console.log("Reboot command sent");
      }
    };

    const preventUnload = (e) => {
      if (isFlashing.value) {
        e.preventDefault();
        e.returnValue = 'Firmware update in progress. Leaving may cause issues.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', preventUnload);
    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', preventUnload);
    });

    const flashDevice = async (pci) => {
      pci.flashing = true;
      isFlashing.value = true;
      try {
        const proc = await unwrap(server.execute(
          new Command(["python3", "/usr/share/cockpit/45drives-system/scripts/firmware-flash",
            "--type", pci.deviceType,
            "--model", pci.cardModel || "",
            "--device-path", pci.busAddress
          ], { superuser: "require" })
        ));
        const result = JSON.parse(proc.getStdout());
        if (result.success) {
          pci.flashing = false;
          isFlashing.value = false;
          if (result.reboot_needed) {
            pci.rebootRequired = true;
            await saveRebootPending(pci.busAddress);
            rebootModalVisible.value = true;
          } else {
            pci.updateStatus = 'current';
            await getPciInfo(true);
          }
        } else {
          pci.flashing = false;
          isFlashing.value = false;
          alert('Firmware update failed: ' + (result.error || 'Unknown error'));
        }
      } catch (e) {
        pci.flashing = false;
        isFlashing.value = false;
        alert('Firmware update failed: ' + (e.message || e));
      }
    };

    const getPciInfo = async (runFirmwareCheck = false) => {
      pcis.value.length = 0;
      pcis.value.push({ slot: 'Loading...', type: 'Loading...', availibility: 'Loading...', busAddress: 'Loading...', cardType: 'Loading...', cardModel: 'Loading...', firmwareVersion: 'Loading...' });
      // Only run firmware-check on manual refresh, not on initial load
      if (runFirmwareCheck) {
        try {
          await unwrap(server.execute(
            new Command(["python3", "/usr/share/cockpit/45drives-system/scripts/firmware-check"], { superuser: "require" })
          ));
        } catch (e) {
          console.log("Firmware check failed (non-fatal):", e);
        }
      }
      try {
        const proc = await unwrap(server.execute(
          new Command(["/usr/share/cockpit/45drives-system/scripts/pci"], { superuser: "require" })
        ));
        let pciInfo = JSON.parse(proc.getStdout());
        const cache = await loadFirmwareCache();
        if (cache) {
          mergeFirmwareStatus(pciInfo, cache);
        }
        // Restore reboot-pending state from disk
        const pendingList = await loadRebootPending();
        pendingList.forEach(addr => {
          const match = pciInfo.find(pci => pci.busAddress === addr);
          if (match) match.rebootRequired = true;
        });
        pcis.value.length = 0;
        pciInfo.forEach(pci => {
          pcis.value.push(pci);
        });
          fatalError.value = false;
          fatalErrorMsg.value.length = 0;
          showFixButton.value = false;
      }catch (error) {
          console.log(error);
          fatalError.value = true;
          fatalErrorMsg.value.length = 0;
          fatalErrorMsg.value.push(error.message);
          fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/pci");
          showFixButton.value = false;
        }
    };

    getPciInfo();

    return {
      pcis,
      isFlashing,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler,
      getPciInfo,
      modalVisible,
      modalData,
      showUpdateModal,
      flashDevice,
      rebootModalVisible,
      showRebootDialog,
      rebootLater,
      rebootNow
    }
  },
  components: {
    RefreshIconOutline,
    ErrorMessage
  },
};
</script>