<template>
<div class="card">
  <div class="card-header flex flex-row items-center justify-between">
    <h3 class="text-header text-default">Drives</h3>
    <div class="mt-3 sm:mt-0 sm:ml-4">
      <button type="button" class="card-refresh-btn" :disabled="loading" @click="loadDrives()">
        <RefreshIconOutline class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </div>
  <div class="card-body">
    <div class="mt-2 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-default">
              <thead class="bg-accent">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6">Device</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Model</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Serial</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Type</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Size</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Firmware</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Latest FW</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default bg-default">
                <tr v-if="loading">
                  <td colspan="8" class="py-4 text-center text-sm text-muted">Loading drives...</td>
                </tr>
                <tr v-else-if="drives.length === 0">
                  <td colspan="8" class="py-4 text-center text-sm text-muted">No drives detected</td>
                </tr>
                <tr v-for="drive in drives" :key="drive.device">
                  <td class="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-default sm:pl-6">/dev/{{ drive.device }}</td>
                  <td class="whitespace-nowrap px-3 py-3 text-sm text-default">{{ drive.model || '—' }}</td>
                  <td class="whitespace-nowrap px-3 py-3 text-xs text-muted font-mono">{{ drive.serial || '—' }}</td>
                  <td class="whitespace-nowrap px-3 py-3 text-sm text-default">{{ drive.type }}</td>
                  <td class="whitespace-nowrap px-3 py-3 text-sm text-default">{{ drive.size }}</td>
                  <td class="whitespace-nowrap px-3 py-3 text-sm font-mono text-default">{{ drive.firmware || '—' }}</td>
                  <td class="whitespace-nowrap px-3 py-3 text-sm font-mono text-default">{{ drive.latestFirmware || '—' }}</td>
                  <td class="whitespace-nowrap px-3 py-3 text-sm">
                    <div v-if="drive.updateStatus === 'outdated'" class="flex items-center gap-2">
                      <span class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Update Available</span>
                      <button @click="showDriveInfo(drive)" class="inline-flex items-center rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700">Info</button>
                      <button v-if="drive.flashable" :disabled="drive.flashing" @click="flashDrive(drive)" class="inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">{{ drive.flashing ? 'Flashing...' : 'Update Now' }}</button>
                    </div>
                    <span v-else-if="drive.updateStatus === 'current'" class="inline-flex items-center rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-medium text-white">Up to Date</span>
                    <span v-else-if="drive.firmware && drive.firmware !== '—'" class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Unknown</span>
                    <span v-else class="text-muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Drive Firmware Info Modal -->
<div v-if="modalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="modalVisible = false">
  <div class="bg-default rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
    <div class="px-6 py-4 border-b border-default flex justify-between items-center">
      <h3 class="text-lg font-semibold">Drive Firmware Update</h3>
      <button @click="modalVisible = false" class="text-muted hover:text-default text-xl">&times;</button>
    </div>
    <div class="px-6 py-4 space-y-3">
      <div>
        <span class="text-sm font-medium">Device:</span>
        <span class="text-sm text-muted ml-2">/dev/{{ modalData.device }}</span>
      </div>
      <div>
        <span class="text-sm font-medium">Model:</span>
        <span class="text-sm text-muted ml-2">{{ modalData.model }}</span>
      </div>
      <div>
        <span class="text-sm font-medium">Serial:</span>
        <span class="text-sm text-muted ml-2 font-mono">{{ modalData.serial }}</span>
      </div>
      <div>
        <span class="text-sm font-medium">Current Firmware:</span>
        <span class="text-sm text-muted ml-2 font-mono">{{ modalData.firmware }}</span>
      </div>
      <div>
        <span class="text-sm font-medium">Latest Firmware:</span>
        <span class="text-sm text-muted ml-2 font-mono">{{ modalData.latestFirmware }}</span>
      </div>
      <div v-if="modalData.family">
        <span class="text-sm font-medium">Family:</span>
        <span class="text-sm text-muted ml-2">{{ modalData.family }}</span>
      </div>
      <div v-if="modalData.flashTool">
        <span class="text-sm font-medium">Flash Tool:</span>
        <span class="text-sm text-muted ml-2">{{ modalData.flashTool }}</span>
      </div>
      <div v-if="modalData.firmwareFile">
        <span class="text-sm font-medium">Firmware File:</span>
        <span class="text-sm text-muted ml-2 font-mono">{{ modalData.firmwareFile }}</span>
      </div>
      <div v-if="modalData.releaseNotes">
        <span class="text-sm font-medium">Notes:</span>
        <p class="text-sm text-muted mt-1">{{ modalData.releaseNotes }}</p>
      </div>
    </div>
    <div class="px-6 py-3 border-t border-default flex justify-end gap-2">
      <button @click="modalVisible = false" class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">Close</button>
      <button v-if="modalData.flashable" :disabled="modalData.flashing" @click="flashDrive(modalData); modalVisible = false" class="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">{{ modalData.flashing ? 'Flashing...' : 'Update Now' }}</button>
    </div>
  </div>
</div>

<!-- Pre-Flash Confirmation Modal -->
<div v-if="confirmModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-default rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
    <div class="px-6 py-4 border-b border-default flex justify-between items-center">
      <h3 class="text-lg font-semibold">Pre-Flash Storage Check</h3>
      <button @click="confirmModalVisible = false" class="text-muted hover:text-default text-xl">&times;</button>
    </div>
    <div class="px-6 py-4 space-y-4">
      <!-- Loading state -->
      <div v-if="confirmLoading" class="flex items-center justify-center py-6">
        <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span class="ml-3 text-sm text-muted">Checking drive activity...</span>
      </div>

      <!-- Results -->
      <div v-else>
        <div class="mb-3">
          <span class="text-sm font-medium">Target Drive:</span>
          <span class="text-sm text-muted ml-2">/dev/{{ confirmDrive.device }} — {{ confirmDrive.model }}</span>
        </div>
        <div class="mb-3">
          <span class="text-sm font-medium">Firmware Update:</span>
          <span class="text-sm font-mono text-muted ml-2">{{ confirmDrive.firmware }} → {{ confirmDrive.latestFirmware }}</span>
        </div>

        <!-- Warnings -->
        <div v-if="confirmWarnings.length > 0" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Drive is currently in use</h3>
              <div class="mt-2 text-sm text-red-700">
                <ul class="list-disc pl-5 space-y-1">
                  <li v-for="(warning, idx) in confirmWarnings" :key="idx">{{ warning }}</li>
                </ul>
              </div>
              <p class="mt-2 text-sm text-red-800 font-medium">Flashing firmware while the drive is active may cause data loss.</p>
            </div>
          </div>
        </div>

        <!-- All clear -->
        <div v-else class="rounded-md bg-green-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">Drive is idle</h3>
              <p class="mt-1 text-sm text-green-700">No active I/O, mounts, or storage pools detected. Safe to proceed.</p>
            </div>
          </div>
        </div>

        <!-- Disclaimer -->
        <div class="rounded-md bg-yellow-50 border border-yellow-200 p-4 mt-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">Important</h3>
              <p class="mt-1 text-xs text-yellow-700">Ensure your data is backed up before proceeding. 45Drives and Seagate are not responsible for any data loss or product damage resulting from a firmware update. Do not power off the system or remove the drive during the flash process.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!confirmLoading" class="px-6 py-3 border-t border-default space-y-3">
      <div>
        <label class="block text-sm font-medium text-default mb-1">Type <span class="font-mono font-bold text-red-600">confirm flash</span> to proceed:</label>
        <input v-model="confirmInput" type="text" placeholder="confirm flash" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" @keyup.enter="confirmInput === 'confirm flash' && proceedFlash()" />
      </div>
      <div class="flex justify-end gap-2">
        <button @click="confirmModalVisible = false; confirmInput = ''" class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">Cancel</button>
        <button @click="proceedFlash()" :disabled="confirmInput !== 'confirm flash'" class="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed" :class="confirmWarnings.length > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'">
          {{ confirmWarnings.length > 0 ? 'Flash Anyway' : 'Proceed with Flash' }}
        </button>
      </div>
    </div>
  </div>
</div>

</template>

<script>
import { RefreshIcon as RefreshIconOutline } from "@heroicons/vue/outline";
import { ref, onMounted } from "vue";
import { server, Command, unwrap } from "@45drives/houston-common-lib";

export default {
  components: { RefreshIconOutline },
  setup() {
    const drives = ref([]);
    const loading = ref(false);
    const modalVisible = ref(false);
    const modalData = ref({});
    const confirmModalVisible = ref(false);
    const confirmLoading = ref(false);
    const confirmWarnings = ref([]);
    const confirmDrive = ref({});
    const confirmInput = ref('');

    const loadDrives = async () => {
      loading.value = true;
      drives.value = [];
      try {
        const proc = await unwrap(server.execute(
          new Command(["lsblk", "-J", "-o", "NAME,MODEL,SERIAL,TYPE,SIZE,REV,TRAN,ROTA", "-d"], { superuser: "try" })
        ));
        const data = JSON.parse(proc.getStdout());
        const blockdevices = data.blockdevices || [];
        let driveList = blockdevices
          .filter(d => d.type === "disk")
          .map(d => ({
            device: d.name,
            model: (d.model || "").trim(),
            serial: (d.serial || "").trim(),
            type: getDriveType(d),
            size: d.size || "",
            firmware: (d.rev || "").trim(),
            latestFirmware: "",
            updateStatus: "",
          }));

        // Load firmware cache and merge status
        try {
          const fwProc = await unwrap(server.execute(
            new Command(["cat", "/var/cache/45drives/firmware/status.json"], { superuser: "try" })
          ));
          const fwData = JSON.parse(fwProc.getStdout());
          const fwDevices = fwData.devices || [];
          for (let drive of driveList) {
            const match = fwDevices.find(fd =>
              fd.serial && fd.serial === drive.serial
            );
            if (match) {
              drive.latestFirmware = match.latest_firmware || "";
              drive.updateStatus = match.update_available || "";
              drive.flashable = match.flashable || false;
              drive.flashTool = match.flash_tool || "";
              drive.firmwareFile = match.firmware_file || "";
              drive.sgDevice = match.sg_device || "";
              drive.family = match.family || "";
              drive.releaseNotes = match.release_notes || "";
              drive.flashing = false;
              // Use firmware from cache (smartctl) as it's more accurate than lsblk REV
              if (match.current_firmware) {
                drive.firmware = match.current_firmware;
              }
            }
          }
        } catch (e) {
          console.log("Firmware cache not available:", e);
        }

        drives.value = driveList;
      } catch (e) {
        console.error("Failed to load drives:", e);
      }
      loading.value = false;
    };

    const getDriveType = (d) => {
      if (d.tran === "nvme") return "NVMe";
      if (d.tran === "sas") return d.rota === "1" || d.rota === true ? "SAS HDD" : "SAS SSD";
      if (d.tran === "sata") return d.rota === "1" || d.rota === true ? "SATA HDD" : "SATA SSD";
      if (d.rota === "0" || d.rota === false) return "SSD";
      return "HDD";
    };

    onMounted(() => {
      loadDrives();
    });

    const showDriveInfo = (drive) => {
      modalData.value = { ...drive };
      modalVisible.value = true;
    };

    const flashDrive = async (drive) => {
      confirmDrive.value = drive;
      confirmWarnings.value = [];
      confirmInput.value = '';
      confirmModalVisible.value = true;
      confirmLoading.value = true;

      try {
        const checkProc = await unwrap(server.execute(
          new Command(["bash", "-c", `
            DEV="/dev/${drive.device}"
            WARNINGS=""

            # Check if any partition is mounted
            MOUNTS=$(lsblk -n -o MOUNTPOINT "$DEV" 2>/dev/null | grep -v "^$")
            if [ -n "$MOUNTS" ]; then
              WARNINGS="$WARNINGS\nDrive has mounted filesystems: $MOUNTS"
            fi

            # Check if drive is part of a ZFS pool
            ZFS=$(zpool status 2>/dev/null | grep -B5 "${drive.device}" | grep "pool:" | awk '{print $2}')
            if [ -n "$ZFS" ]; then
              WARNINGS="$WARNINGS\nDrive is part of ZFS pool: $ZFS"
            fi

            # Check if drive is part of an MD RAID array
            MD=$(grep "${drive.device}" /proc/mdstat 2>/dev/null)
            if [ -n "$MD" ]; then
              WARNINGS="$WARNINGS\nDrive is part of MD RAID array"
            fi

            # Check for active I/O (inflight requests)
            INFLIGHT=$(cat /sys/block/${drive.device}/inflight 2>/dev/null | awk '{print $1+$2}')
            if [ -n "$INFLIGHT" ] && [ "$INFLIGHT" -gt 0 ]; then
              WARNINGS="$WARNINGS\nDrive has $INFLIGHT in-flight I/O requests"
            fi

            # Check if drive is open by any process
            FUSER=$(fuser "$DEV" 2>/dev/null)
            if [ -n "$FUSER" ]; then
              WARNINGS="$WARNINGS\nDrive is open by process(es): $FUSER"
            fi

            if [ -n "$WARNINGS" ]; then
              echo "BUSY"
              echo -e "$WARNINGS"
            else
              echo "IDLE"
            fi
          `], { superuser: "require" })
        ));
        const checkOutput = checkProc.getStdout().trim();
        const lines = checkOutput.split("\n");

        if (lines[0] === "BUSY") {
          confirmWarnings.value = lines.slice(1).filter(l => l.trim());
        }
      } catch (e) {
        console.error("Pre-flash check failed:", e);
        confirmWarnings.value = ["Unable to determine drive activity status"];
      }
      confirmLoading.value = false;
    };

    const proceedFlash = async () => {
      confirmModalVisible.value = false;
      const drive = confirmDrive.value;
      drive.flashing = true;

      try {
        const proc = await unwrap(server.execute(
          new Command([
            "python3", "/usr/share/45drives/firmware/firmware-flash",
            "--device", drive.sgDevice || drive.device,
            "--firmware-file", `/usr/share/45drives/firmware/files/${drive.firmwareFile}`,
            "--tool", drive.flashTool || "SeaChest_Firmware"
          ], { superuser: "require" })
        ));
        const output = proc.getStdout();
        console.log("Flash output:", output);
        // Re-run firmware check to update cache
        try {
          await unwrap(server.execute(
            new Command(["python3", "/usr/share/45drives/firmware/firmware-check"], { superuser: "require" })
          ));
        } catch (e) {
          console.log("Failed to refresh firmware cache:", e);
        }
        await loadDrives();
      } catch (e) {
        console.error("Flash failed:", e);
        alert("Firmware flash failed: " + (e.message || e));
      }
      drive.flashing = false;
    };

    return {
      drives,
      loading,
      loadDrives,
      modalVisible,
      modalData,
      showDriveInfo,
      flashDrive,
      confirmModalVisible,
      confirmLoading,
      confirmWarnings,
      confirmDrive,
      confirmInput,
      proceedFlash,
    };
  },
};
</script>
