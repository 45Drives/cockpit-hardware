<template>
<div class="card mt-2">
  <div class="card-header flex flex-row items-center justify-between">
    <h3 class="text-header text-default">Firmware Updates Available</h3>
    <div class="flex items-center gap-2">
      <span v-if="lastChecked" class="text-xs text-muted">Last checked: {{ lastChecked }}</span>
      <button
        v-if="rebootPendingDevices.size > 0"
        type="button"
        @click="safeReboot()"
        class="inline-flex items-center rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700"
      >
        Safe Reboot
      </button>
      <button
        type="button"
        class="card-refresh-btn"
        :disabled="checking"
        @click="checkFirmware()"
      >
        <RefreshIconOutline class="h-5 w-5" :class="{ 'animate-spin': checking }" aria-hidden="true" />
      </button>
    </div>
  </div>
  <div class="card-body max-h-[32rem] overflow-y-auto">
    <div v-if="checking && devices.length === 0" class="text-sm text-muted py-4 text-center">
      Running firmware discovery and comparison...
    </div>
    <div v-else-if="error" class="text-sm text-red-600 py-4">
      {{ error }}
    </div>
    <div v-else-if="outdatedDevices.length > 0" class="mt-2 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg max-h-[28rem] overflow-y-auto">
            <table class="min-w-full divide-y divide-default">
              <thead class="bg-accent sticky top-0 z-10">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold">Type</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Device</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Current FW</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Latest FW</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="(device, idx) in outdatedDevices" :key="idx">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium uppercase">{{ device.type }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ device.device || '-' }} <span class="text-xs text-gray-400">({{ device.model || '-' }})</span></td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm font-mono text-muted">{{ device.current_firmware || '-' }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm font-mono text-muted">{{ device.latest_firmware || '-' }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                    <div class="flex items-center gap-2">
                      <span v-if="rebootPendingDevices.has(device.cache_index)" class="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">⚠ Reboot Required</span>
                      <span v-else-if="device.payload_missing" class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Payload Not Deployed</span>
                      <span v-else class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Update Available</span>
                      <button @click="showInfo(device)" class="inline-flex items-center justify-center rounded-md bg-blue-600 p-1.5 text-white hover:bg-blue-700 transition-colors" title="View device details">
                        <InformationCircleIcon class="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button v-if="canFlash(device) && !rebootPendingDevices.has(device.cache_index)" :disabled="device.flashing" @click="startFlash(device)" class="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors">{{ device.flashing ? 'Flashing...' : 'Update' }}</button>
                      <button v-if="device.type === 'hdd'" :disabled="device.reverting" @click="revertDevice(device)" class="inline-flex items-center gap-1 rounded-md bg-orange-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">{{ device.reverting ? 'Reverting...' : '↩ Revert' }}</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-sm text-muted py-4 text-center">
      All firmware is up to date.
    </div>
    <!-- Revert section: show current HDDs so testers can revert after flashing -->
    <div v-if="currentHddDevices.length > 0" class="mt-3 border-t border-default pt-3">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-xs font-medium text-muted uppercase tracking-wide">Up-to-date HDDs (testing: revert available)</h4>
        <button :disabled="revertingAll" @click="revertAll()" class="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">{{ revertingAll ? 'Reverting All...' : '↩ Revert All' }}</button>
      </div>
      <div class="space-y-1">
        <div v-for="(device, idx) in currentHddDevices" :key="'cur-'+idx" class="flex items-center justify-between px-3 py-1.5 rounded bg-accent text-sm">
          <span class="text-muted">{{ device.device }} <span class="text-xs text-gray-400">({{ device.model }})</span> — <span class="font-mono text-xs">{{ device.current_firmware }}</span></span>
          <button :disabled="device.reverting" @click="revertDevice(device)" class="inline-flex items-center gap-1 rounded-md bg-orange-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">{{ device.reverting ? 'Reverting...' : '↩ Revert' }}</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Info Modal -->
<div v-if="infoVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="infoVisible = false">
  <div class="bg-default rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
    <div class="px-6 py-4 border-b border-default flex justify-between items-center">
      <h3 class="text-lg font-semibold">Firmware Update Details</h3>
      <button @click="infoVisible = false" class="text-muted hover:text-default text-xl">&times;</button>
    </div>
    <div class="px-6 py-4 space-y-3">
      <div><span class="text-sm font-medium">Type:</span><span class="text-sm text-muted ml-2 uppercase">{{ infoDevice.type }}</span></div>
      <div><span class="text-sm font-medium">Model:</span><span class="text-sm text-muted ml-2">{{ infoDevice.model || infoDevice.model_full || '-' }}</span></div>
      <div><span class="text-sm font-medium">Serial:</span><span class="text-sm text-muted ml-2 font-mono">{{ infoDevice.serial || '-' }}</span></div>
      <div><span class="text-sm font-medium">Current Firmware:</span><span class="text-sm text-muted ml-2 font-mono">{{ infoDevice.current_firmware }}</span></div>
      <div><span class="text-sm font-medium">Latest Firmware:</span><span class="text-sm text-muted ml-2 font-mono">{{ infoDevice.latest_firmware }}</span></div>
      <div v-if="infoDevice.family"><span class="text-sm font-medium">Family:</span><span class="text-sm text-muted ml-2">{{ infoDevice.family }}</span></div>
      <div v-if="infoDevice.flash_tool"><span class="text-sm font-medium">Flash Tool:</span><span class="text-sm text-muted ml-2">{{ infoDevice.flash_tool }}</span></div>
      <div v-if="infoDevice.flash_command"><span class="text-sm font-medium">Command:</span><p class="text-xs text-muted mt-1 font-mono bg-gray-100 rounded px-2 py-1">{{ infoDevice.flash_command }}</p></div>
      <div v-if="infoDevice.release_notes"><span class="text-sm font-medium">Notes:</span><p class="text-sm text-muted mt-1">{{ infoDevice.release_notes }}</p></div>
      <div v-if="infoDevice.requires_reboot" class="rounded-md bg-yellow-50 p-3">
        <p class="text-xs text-yellow-700"><strong>Note:</strong> A system reboot is required after this firmware update.</p>
      </div>
    </div>
    <div class="px-6 py-3 border-t border-default flex justify-end gap-2">
      <button @click="infoVisible = false" class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">Close</button>
      <button v-if="canFlash(infoDevice)" @click="infoVisible = false; startFlash(infoDevice)" class="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Update Firmware</button>
    </div>
  </div>
</div>

<!-- Flash Progress Modal -->
<div v-if="flashProgressVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-default rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
    <div class="px-6 py-4 border-b border-default">
      <h3 class="text-lg font-semibold">{{ flashComplete ? (flashSuccess ? 'Update Complete' : 'Update Failed') : 'Updating Firmware...' }}</h3>
    </div>
    <div class="px-6 py-4 space-y-4">
      <div v-if="!flashComplete" class="flex items-center gap-3">
        <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span class="text-sm font-medium text-yellow-600">Do NOT power off the system!</span>
      </div>
      <div ref="flashLogEl" class="bg-gray-900 rounded-md p-3 font-mono text-xs max-h-64 overflow-y-auto whitespace-pre-wrap" v-html="colorizeLog(flashLog)"></div>
      <div v-if="flashComplete && flashSuccess && flashRebootRequired" class="rounded-md bg-yellow-50 border border-yellow-200 p-3">
        <p class="text-sm font-medium text-yellow-800">⚠ System reboot required to activate the new firmware.</p>
      </div>
    </div>
    <div v-if="flashComplete" class="px-6 py-3 border-t border-default flex justify-end">
      <button @click="flashProgressVisible = false" class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">Close</button>
    </div>
  </div>
</div>

<!-- Pre-Flash Confirmation Modal (HDD activity check) -->
<div v-if="confirmModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-default rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
    <div class="px-6 py-4 border-b border-default flex justify-between items-center">
      <h3 class="text-lg font-semibold">Pre-Flash Storage Check</h3>
      <button @click="confirmModalVisible = false" class="text-muted hover:text-default text-xl">&times;</button>
    </div>
    <div class="px-6 py-4 space-y-4">
      <div v-if="confirmLoading" class="flex items-center justify-center py-6">
        <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span class="ml-3 text-sm text-muted">Checking drive activity...</span>
      </div>
      <div v-else>
        <div class="mb-3">
          <span class="text-sm font-medium">Target:</span>
          <span class="text-sm text-muted ml-2">{{ confirmDevice.device }} — {{ confirmDevice.model }}</span>
        </div>
        <div class="mb-3">
          <span class="text-sm font-medium">Firmware Update:</span>
          <span class="text-sm font-mono text-muted ml-2">{{ confirmDevice.current_firmware }} → {{ confirmDevice.latest_firmware }}</span>
        </div>
        <!-- What will happen -->
        <div v-if="confirmActions.length > 0" class="mb-3 rounded-md bg-blue-50 border border-blue-200 p-3">
          <h4 class="text-sm font-medium text-blue-800 mb-2">This will:</h4>
          <ul class="text-sm text-blue-700 list-disc pl-5 space-y-1">
            <li v-for="(action, i) in confirmActions" :key="i">{{ action }}</li>
          </ul>
        </div>
        <!-- Downloads needed -->
        <div v-if="confirmDownloads.length > 0" class="mb-3 rounded-md bg-amber-50 border border-amber-200 p-3">
          <h4 class="text-sm font-medium text-amber-800 mb-2">Downloads required from firmware repo:</h4>
          <ul class="text-sm text-amber-700 list-disc pl-5 space-y-1">
            <li v-for="(dl, i) in confirmDownloads" :key="i"><strong>{{ dl.name }}</strong> — {{ dl.reason }}</li>
          </ul>
        </div>
        <template v-if="confirmDevice?.type === 'hdd'">
          <!-- Red: real warnings (degraded, no-redundancy pool, in-flight IO) -->
          <div v-if="confirmWarnings.length > 0" class="rounded-md bg-red-50 border border-red-200 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">{{ confirmBlocked ? 'Update blocked' : 'Caution — drive is in use' }}</h3>
                <ul class="mt-2 text-sm text-red-700 list-disc pl-5 space-y-1">
                  <li v-for="(w, i) in confirmWarnings" :key="i">{{ w }}</li>
                </ul>
                <p v-if="!confirmBlocked" class="mt-2 text-sm text-red-700">Proceed only if you understand the risk.</p>
              </div>
            </div>
          </div>
          <!-- Blue: safe informational (redundant pool, scrub on another pool) -->
          <div v-else-if="confirmInfo.length > 0" class="rounded-md bg-blue-50 border border-blue-200 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800">Safe to proceed</h3>
                <ul class="mt-1 text-sm text-blue-700 list-disc pl-5 space-y-1">
                  <li v-for="(info, i) in confirmInfo" :key="i">{{ info }}</li>
                </ul>
              </div>
            </div>
          </div>
          <!-- Green: completely idle -->
          <div v-else class="rounded-md bg-green-50 border border-green-200 p-4">
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
        </template>
        <div v-if="confirmDevice?.type === 'hdd'" class="rounded-md bg-gray-50 border border-gray-200 p-3 mt-4">
          <p class="text-xs text-gray-600"><strong>Note:</strong> Do not power off or reboot the system during the flash — an interrupted write can brick the drive.</p>
        </div>
        <div v-else class="rounded-md bg-yellow-50 border border-yellow-200 p-4 mt-4">
          <p class="text-xs text-yellow-700"><strong>Important:</strong> Do not power off the system during the flash process. A reboot may be required to activate the new firmware.</p>
        </div>
      </div>
    </div>
    <div v-if="!confirmLoading" class="px-6 py-3 border-t border-default space-y-3">
      <div v-if="!confirmBlocked">
        <label class="block text-sm font-medium text-default mb-1">Type <span class="font-mono font-bold text-red-600">confirm flash</span> to proceed:</label>
        <input v-model="confirmInput" type="text" placeholder="confirm flash" class="w-full rounded-md border bg-accent border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" @keyup.enter="confirmInput === 'confirm flash' && proceedSingleFlash()" />
      </div>
      <div class="flex justify-end gap-2">
        <button @click="confirmModalVisible = false; confirmInput = ''" class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">Cancel</button>
        <button v-if="!confirmBlocked" @click="proceedSingleFlash()" :disabled="confirmInput !== 'confirm flash'" class="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed" :class="confirmWarnings.length > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'">
          {{ confirmWarnings.length > 0 ? 'Flash Anyway' : 'Proceed with Flash' }}
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Safe Reboot Modal -->
<div v-if="rebootModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-default rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
    <div class="px-6 py-4 border-b border-default flex justify-between items-center">
      <h3 class="text-lg font-semibold">Reboot System</h3>
      <button @click="rebootModalVisible = false" class="text-muted hover:text-default text-xl">&times;</button>
    </div>
    <div class="px-6 py-4 space-y-4">
      <!-- Disclaimer -->
      <div class="rounded-md bg-yellow-50 border border-yellow-200 p-3">
        <p class="text-sm font-medium text-yellow-800">⚠ Please perform reboots during a maintenance window.</p>
        <p class="text-xs text-yellow-700 mt-1">Ensure no critical workloads are running. Pending firmware updates will be activated after reboot.</p>
      </div>

      <!-- Pending firmware count -->
      <div class="rounded-md bg-blue-50 border border-blue-200 p-3">
        <p class="text-xs font-medium text-blue-800">{{ rebootPendingDevices.size }} firmware update(s) pending activation.</p>
      </div>

      <!-- Confirmation input -->
      <div>
        <label class="block text-sm font-medium text-default mb-1">Type <span class="font-mono font-bold text-red-600">reboot now</span> to confirm:</label>
        <input v-model="rebootConfirmInput" type="text" placeholder="reboot now" class="w-full bg-accent rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
      </div>

      <!-- Reboot error -->
      <div v-if="rebootError" class="rounded-md bg-red-50 border border-red-200 p-3">
        <p class="text-sm text-red-800">{{ rebootError }}</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="px-6 py-3 border-t border-default flex justify-between items-center">
      <button @click="rebootModalVisible = false" class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">Cancel</button>
      <button
        @click="executeReboot()"
        :disabled="rebootConfirmInput !== 'reboot now' || rebootExecuting"
        class="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ rebootExecuting ? 'Rebooting...' : 'Reboot Now' }}
      </button>
    </div>
  </div>
</div>

</template>

<script>
import { RefreshIcon as RefreshIconOutline, InformationCircleIcon } from "@heroicons/vue/outline";
import { ref, computed, inject, watch, nextTick } from "vue";
import { server, Command, unwrap } from "@45drives/houston-common-lib";

export default {
  components: { RefreshIconOutline, InformationCircleIcon },
  setup() {
    const devices = ref([]);
    const checking = ref(false);
    const error = ref("");
    const lastChecked = ref("");
    const checkFirmwareBadge = inject('checkFirmwareBadge', () => {});

    const loadCache = async () => {
      try {
        const proc = await unwrap(server.execute(
          new Command(["cat", "/var/cache/45drives/firmware/status.json"], { superuser: "require" })
        ));
        const cache = JSON.parse(proc.getStdout());
        devices.value = cache.devices || [];
        if (cache.timestamp) {
          lastChecked.value = new Date(cache.timestamp).toLocaleString();
        }
        error.value = "";
      } catch (e) {
        return false;
      }
      return true;
    };

    const checkFirmware = async () => {
      checking.value = true;
      error.value = "";
      try {
        // firmware-check exit codes: 0=all current, 2=outdated found (both valid), 1=error
        const proc = await unwrap(server.execute(
          new Command(["python3", "/usr/share/45drives/firmware/firmware-check"], { superuser: "require" }),
          false
        ));
        if (proc.exitStatus === 1) {
          error.value = "Firmware check failed: " + proc.getStderr();
        } else {
          await loadCache();
          checkFirmwareBadge();
        }
      } catch (e) {
        error.value = "Firmware check failed: " + (e.message || e);
      } finally {
        checking.value = false;
      }
    };

    // Load existing cache on mount
    loadCache().then(found => {
      if (!found) {
        // No cache exists, run a check
        checkFirmware();
      }
    });

    const outdatedDevices = computed(() => devices.value.filter(d => d.update_available === 'outdated'));
    // Models that have revert firmware available (testing only)
    const REVERTABLE_MODELS = ['ST6000NM019B', 'ST4000NM024B', 'ST10000NM017B', 'ST8000NM017B', 'ST2000NM017B', 'ST16000NM001G', 'ST12000NM001G', 'ST4000NM002A', 'ST6000NM021A'];
    const currentHddDevices = computed(() => devices.value.filter(d => d.type === 'hdd' && d.update_available === 'current' && REVERTABLE_MODELS.includes(d.model)));

    // A device can be flashed if it has flashable flag and either:
    // - a firmware_file (normal flash), or
    // - a tool_package (nvmupdate — self-contained package with its own firmware)
    const canFlash = (device) => {
      if (!device.flashable) return false;
      if (device.firmware_file) return true;
      if (device.tool_package) return true;
      return false;
    };

    // Info modal
    const infoVisible = ref(false);
    const infoDevice = ref({});
    const showInfo = (device) => {
      infoDevice.value = device;
      infoVisible.value = true;
    };

    // Pre-flash confirmation modal (for HDD activity checks)
    const confirmModalVisible = ref(false);
    const confirmLoading = ref(false);
    const confirmWarnings = ref([]);
    const confirmInfo = ref([]);
    const confirmBlocked = ref(false);
    const confirmActions = ref([]);
    const confirmDownloads = ref([]);
    const confirmDevice = ref({});
    const confirmInput = ref('');

    // Track firmware files that failed in this session
    const failedFirmwareFiles = ref(new Set());

    const startFlash = async (device) => {
      // For HDD type, run pre-flight activity check
      if (device.type === 'hdd') {
        confirmDevice.value = device;
        confirmWarnings.value = [];
        confirmInfo.value = [];
        confirmBlocked.value = false;
        confirmActions.value = [];
        confirmDownloads.value = [];
        confirmInput.value = '';
        confirmModalVisible.value = true;
        confirmLoading.value = true;

        // Run preflight to determine what will be downloaded
        try {
          const pfProc = await unwrap(server.execute(
            new Command([
              "python3", "-u", "/usr/share/45drives/firmware/firmware-flash",
              "--cache-index", String(device.cache_index),
              "--preflight"
            ], { superuser: "require" })
          ));
          const pfData = JSON.parse(pfProc.getStdout());
          confirmActions.value = pfData.actions || [];
          confirmDownloads.value = pfData.downloads || [];
        } catch (e) {
          confirmActions.value = [`Flash ${device.model} using ${device.flash_tool}`];
        }

        // Check if this firmware file previously failed in this session
        if (failedFirmwareFiles.value.has(device.firmware_file)) {
          confirmWarnings.value.push(`⚠ This firmware file failed on a previous drive in this session. It may fail again.`);
        }

        const devName = (device.device || device.sg_device || '').replace('/dev/', '');
        try {
          const checkProc = await unwrap(server.execute(
            new Command(["bash", "-c", `
              DEV="/dev/${devName}"
              WARNINGS=""
              BLOCKERS=""
              INFO=""

              # SMART health check — block if FAILED
              SMART=$(smartctl -H "$DEV" 2>/dev/null)
              if echo "$SMART" | grep -q "FAILED"; then
                BLOCKERS="$BLOCKERS\n🛑 SMART health status: FAILED — drive is failing, do not flash"
              fi

              # Build list of all names that reference this drive (kernel, by-id, by-vdev, by-path)
              DEV_ALIASES="${devName}"
              for part in /sys/block/${devName}/${devName}*; do
                [ -e "$part" ] && DEV_ALIASES="$DEV_ALIASES $(basename $part)"
              done
              for by_dir in /dev/disk/by-id /dev/disk/by-vdev /dev/disk/by-path; do
                [ -d "$by_dir" ] || continue
                for link in "$by_dir"/*; do
                  real=$(readlink -f "$link" 2>/dev/null)
                  real_base=$(basename "$real" 2>/dev/null)
                  for alias in $DEV_ALIASES; do
                    if [ "$real_base" = "$alias" ]; then
                      DEV_ALIASES="$DEV_ALIASES $(basename $link) $link"
                      break
                    fi
                  done
                done
              done

              # ZFS scrub/resilver check
              ZPOOL_STATUS=$(zpool status 2>/dev/null)
              # Find which pool this drive belongs to using all known aliases
              DRIVE_POOL=""
              for pool in $(zpool list -H -o name 2>/dev/null); do
                POOL_STATUS=$(zpool status "$pool" 2>/dev/null)
                for alias in $DEV_ALIASES; do
                  if echo "$POOL_STATUS" | grep -qF "$alias"; then
                    DRIVE_POOL="$pool"
                    break 2
                  fi
                done
              done
              SCRUB_ACTIVE=$(echo "$ZPOOL_STATUS" | grep -qE "scrub in progress|resilver in progress" && echo "yes" || echo "no")

              if [ "$SCRUB_ACTIVE" = "yes" ] && [ -n "$DRIVE_POOL" ]; then
                POOL_STATUS_TEXT=$(zpool status "$DRIVE_POOL" 2>/dev/null)
                if echo "$POOL_STATUS_TEXT" | grep -q "resilver in progress"; then
                  BLOCKERS="$BLOCKERS\n🛑 Drive is in pool '$DRIVE_POOL' which is resilvering — wait for it to complete"
                elif echo "$POOL_STATUS_TEXT" | grep -q "scrub in progress"; then
                  BLOCKERS="$BLOCKERS\n🛑 Drive is in pool '$DRIVE_POOL' which is scrubbing — wait for it to complete"
                else
                  INFO="$INFO\nA ZFS operation is running on another pool (drive not affected)"
                fi
              elif [ "$SCRUB_ACTIVE" = "yes" ]; then
                INFO="$INFO\nA ZFS operation is running on another pool (drive not in any pool)"
              fi

              # Root/boot drive check — block if OS drive
              BOOT_MOUNTS=$(lsblk -n -o MOUNTPOINT "$DEV" 2>/dev/null | grep -E '^/$|^/boot$|^/boot/efi$')
              if [ -n "$BOOT_MOUNTS" ]; then
                BLOCKERS="$BLOCKERS\n🛑 Drive is the system boot disk (mounted at: $BOOT_MOUNTS) — do not flash"
              fi

              MOUNTS=$(lsblk -n -o MOUNTPOINT "$DEV" 2>/dev/null | grep -v "^$")
              if [ -n "$MOUNTS" ]; then
                WARNINGS="$WARNINGS\nDrive has mounted filesystems: $MOUNTS"
              fi

              if [ -n "$DRIVE_POOL" ]; then
                POOL_STATE=$(zpool status "$DRIVE_POOL" 2>/dev/null | grep "state:" | awk '{print $2}')
                POOL_CONFIG=$(zpool status "$DRIVE_POOL" 2>/dev/null)

                if [ "$POOL_STATE" = "DEGRADED" ]; then
                  # Find the target drive's vdev and count faults only within it.
                  # Parse zpool status config section into vdev groups.
                  TARGET_VDEV_TYPE=""
                  TARGET_VDEV_FAULTED=0
                  TARGET_VDEV_TOTAL=0
                  FOUND_TARGET=0

                  # Use awk to extract per-vdev info for the target drive.
                  # Strategy: track current vdev type and its children.
                  # When we see a child matching any of our aliases, record that vdev's stats.
                  VDEV_INFO=$(echo "$POOL_CONFIG" | awk -v aliases="$DEV_ALIASES" '
                    BEGIN {
                      split(aliases, a, " ")
                      for (i in a) alias_set[a[i]] = 1
                      in_config = 0; vdev_type = ""; faulted = 0; total = 0; found = 0
                    }
                    /^\tconfig:/ || /^  config:/ { in_config = 1; next }
                    !in_config { next }
                    /errors:/ { exit }
                    {
                      # Strip leading whitespace and get tokens
                      line = $0; sub(/^[\t ]+/, "", line)
                      if (line == "" || line ~ /^NAME/) next
                      name = $1; state = $2
                      # Detect vdev header
                      if (name ~ /^(mirror|raidz3|raidz2|raidz1|raidz)/) {
                        if (found) exit  # already found target, stop
                        if (name ~ /^raidz3/) vdev_type = "raidz3"
                        else if (name ~ /^raidz2/) vdev_type = "raidz2"
                        else if (name ~ /^raidz[^0-9]/ || name ~ /^raidz$/) vdev_type = "raidz1"
                        else if (name ~ /^mirror/) vdev_type = "mirror"
                        faulted = 0; total = 0
                        next
                      }
                      # Skip pool name line
                      if (vdev_type == "" && total == 0) next
                      # Child of current vdev
                      total++
                      if (state ~ /FAULTED|OFFLINE|UNAVAIL|REMOVED/) faulted++
                      # Check if this child is our target drive
                      basename = name; sub(/.*\//, "", basename)
                      if (basename in alias_set || name in alias_set) found = 1
                    }
                    END {
                      if (found) print vdev_type " " faulted " " total
                      else print "NOTFOUND"
                    }
                  ')

                  if [ "$VDEV_INFO" != "NOTFOUND" ] && [ -n "$VDEV_INFO" ]; then
                    TARGET_VDEV_TYPE=$(echo "$VDEV_INFO" | awk '{print $1}')
                    TARGET_VDEV_FAULTED=$(echo "$VDEV_INFO" | awk '{print $2}')
                    TARGET_VDEV_TOTAL=$(echo "$VDEV_INFO" | awk '{print $3}')
                    HAS_REDUNDANCY="no"
                    if [ "$TARGET_VDEV_TYPE" = "raidz3" ] && [ "$TARGET_VDEV_FAULTED" -lt 3 ]; then
                      HAS_REDUNDANCY="yes"
                    elif [ "$TARGET_VDEV_TYPE" = "raidz2" ] && [ "$TARGET_VDEV_FAULTED" -lt 2 ]; then
                      HAS_REDUNDANCY="yes"
                    elif [ "$TARGET_VDEV_TYPE" = "raidz1" ] && [ "$TARGET_VDEV_FAULTED" -lt 1 ]; then
                      HAS_REDUNDANCY="yes"
                    elif [ "$TARGET_VDEV_TYPE" = "mirror" ]; then
                      ONLINE_COUNT=$((TARGET_VDEV_TOTAL - TARGET_VDEV_FAULTED))
                      if [ "$ONLINE_COUNT" -ge 2 ]; then
                        HAS_REDUNDANCY="yes"
                      fi
                    fi
                    if [ "$HAS_REDUNDANCY" = "yes" ]; then
                      WARNINGS="$WARNINGS\n⚠️ Drive's vdev ($TARGET_VDEV_TYPE) in pool '$DRIVE_POOL' is DEGRADED but has remaining redundancy ($TARGET_VDEV_FAULTED faulted of $TARGET_VDEV_TOTAL)"
                    else
                      BLOCKERS="$BLOCKERS\n🛑 Drive's vdev ($TARGET_VDEV_TYPE) in pool '$DRIVE_POOL' has no remaining redundancy ($TARGET_VDEV_FAULTED faulted of $TARGET_VDEV_TOTAL) — flashing risks total data loss"
                    fi
                  else
                    # Could not locate drive in config — conservative block
                    BLOCKERS="$BLOCKERS\n🛑 Pool '$DRIVE_POOL' is DEGRADED and drive's vdev could not be identified"
                  fi
                fi

                # Check pool redundancy type
                if echo "$POOL_CONFIG" | grep -qE "mirror|raidz"; then
                  INFO="$INFO\nDrive is part of ZFS pool: $DRIVE_POOL (redundant — pool will remain online)"
                else
                  INFO="$INFO\nDrive is part of ZFS pool: $DRIVE_POOL (no redundancy)"
                fi
              fi

              # MD RAID check — match drive AND its partitions (mdstat: sda1[0])
              MD=$(grep -E "${devName}[0-9]*\[" /proc/mdstat 2>/dev/null)
              if [ -n "$MD" ]; then
                BLOCKERS="$BLOCKERS\n🛑 Drive (or a partition) is part of a Linux MD RAID array — do not flash while array is active"
              fi

              INFLIGHT=$(cat /sys/block/${devName}/inflight 2>/dev/null | awk '{print $1+$2}')
              if [ -n "$INFLIGHT" ] && [ "$INFLIGHT" -gt 0 ]; then
                WARNINGS="$WARNINGS\nDrive has $INFLIGHT in-flight I/O requests"
              fi

              FUSER=$(fuser "$DEV" 2>/dev/null)
              if [ -n "$FUSER" ]; then
                WARNINGS="$WARNINGS\nDrive is open by process(es): $FUSER"
              fi

              if [ -n "$BLOCKERS" ]; then
                echo "BLOCKED"
                echo -e "$BLOCKERS"
              elif [ -n "$WARNINGS" ]; then
                echo "BUSY"
                echo -e "$WARNINGS"
              elif [ -n "$INFO" ]; then
                echo "SAFE"
                echo -e "$INFO"
              else
                echo "IDLE"
              fi
            `], { superuser: "require" })
          ));
          const checkOutput = checkProc.getStdout().trim();
          const lines = checkOutput.split("\n");
          if (lines[0] === "BLOCKED") {
            confirmWarnings.value = [...confirmWarnings.value, ...lines.slice(1).filter(l => l.trim())];
            confirmBlocked.value = true;
          } else if (lines[0] === "BUSY") {
            confirmWarnings.value = [...confirmWarnings.value, ...lines.slice(1).filter(l => l.trim())];
          } else if (lines[0] === "SAFE") {
            confirmInfo.value = [...confirmInfo.value, ...lines.slice(1).filter(l => l.trim())];
          }
        } catch (e) {
          confirmWarnings.value = [...confirmWarnings.value, "Unable to determine drive activity status"];
        }
        confirmLoading.value = false;
      } else {
        // Non-HDD devices (NIC, HBA, etc.) — show preflight info then flash
        confirmDevice.value = device;
        confirmWarnings.value = [];        confirmInfo.value = [];        confirmBlocked.value = false;
        confirmActions.value = [];
        confirmDownloads.value = [];
        confirmInput.value = '';
        confirmModalVisible.value = true;
        confirmLoading.value = true;

        try {
          const pfProc = await unwrap(server.execute(
            new Command([
              "python3", "-u", "/usr/share/45drives/firmware/firmware-flash",
              "--cache-index", String(device.cache_index),
              "--preflight"
            ], { superuser: "require" })
          ));
          const pfData = JSON.parse(pfProc.getStdout());
          confirmActions.value = pfData.actions || [];
          confirmDownloads.value = pfData.downloads || [];
        } catch (e) {
          confirmActions.value = [`Flash ${device.model} using ${device.flash_tool || 'unknown'}`];
        }
        confirmLoading.value = false;
      }
    };

    const proceedSingleFlash = () => {
      confirmModalVisible.value = false;
      confirmInput.value = '';
      flashDevice(confirmDevice.value);
    };

    // Track devices that have been flashed and are pending reboot
    const rebootPendingDevices = ref(new Set());
    const FIRMWARE_REBOOT_PENDING_FILE = '/var/cache/45drives/firmware/reboot-pending.json';

    const saveRebootPending = async () => {
      try {
        const data = JSON.stringify([...rebootPendingDevices.value]);
        await unwrap(server.execute(
          new Command(["python3", "-c", "import sys; open(sys.argv[1],'w').write(sys.argv[2])", FIRMWARE_REBOOT_PENDING_FILE, data], { superuser: "require" })
        ));
      } catch (e) {
        console.log("Failed to save firmware reboot-pending state:", e);
      }
    };

    const loadRebootPending = async () => {
      try {
        // Check if system has rebooted since the pending file was written
        // If so, the reboot already happened — clear the pending state
        const uptimeProc = await unwrap(server.execute(
          new Command(["python3", "-c",
            "import os, time; f='" + FIRMWARE_REBOOT_PENDING_FILE + "'; " +
            "boot_time = time.time() - float(open('/proc/uptime').read().split()[0]); " +
            "file_mtime = os.path.getmtime(f); " +
            "print('stale' if boot_time > file_mtime else 'current')"
          ], { superuser: "try" })
        ));
        const status = uptimeProc.getStdout().trim();
        if (status === 'stale') {
          // System rebooted after the pending file was written — clear it
          rebootPendingDevices.value = new Set();
          await saveRebootPending();
          // Re-run firmware-check to pick up newly-activated firmware versions
          checkFirmware();
          return;
        }

        const proc = await unwrap(server.execute(
          new Command(["cat", FIRMWARE_REBOOT_PENDING_FILE], { superuser: "try" })
        ));
        const pending = JSON.parse(proc.getStdout());
        if (Array.isArray(pending) && pending.length > 0) {
          rebootPendingDevices.value = new Set(pending);
        }
      } catch (e) { /* file doesn't exist yet or error checking — treat as clean */ }
    };

    // Load reboot-pending state on mount
    loadRebootPending();

    // Flash
    const flashProgressVisible = ref(false);
    const flashLog = ref('');
    const flashLogEl = ref(null);
    const flashComplete = ref(false);
    const flashSuccess = ref(false);
    const flashRebootRequired = ref(false);

    const colorizeLog = (text) => {
      return text.split('\n').map(line => {
        const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (/✗|FAILED|ERROR|failed/i.test(line)) return `<span class="text-red-400">${escaped}</span>`;
        if (/✓|Success|successful/i.test(line)) return `<span class="text-green-400">${escaped}</span>`;
        if (/^>|^---/.test(line)) return `<span class="text-gray-300">${escaped}</span>`;
        if (/Warning/i.test(line)) return `<span class="text-yellow-400">${escaped}</span>`;
        return `<span class="text-gray-400">${escaped}</span>`;
      }).join('\n');
    };

    const flashDevice = async (device) => {
      device.flashing = true;
      flashLog.value = '';
      flashComplete.value = false;
      flashSuccess.value = false;
      flashProgressVisible.value = true;

      flashRebootRequired.value = false;
      flashLog.value += `> Target: ${device.model} (${device.type})\n`;
      flashLog.value += `> Current: ${device.current_firmware} → ${device.latest_firmware}\n`;
      flashLog.value += `> Tool: ${device.flash_tool}\n`;
      flashLog.value += `> Cache index: ${device.cache_index}\n\n--- Starting update ---\n\n`;

      try {
        const cmd = new Command([
          "python3", "-u", "/usr/share/45drives/firmware/firmware-flash",
          "--cache-index", String(device.cache_index),
          "--allow-download"
        ], { superuser: "require" });
        const proc = server.spawnProcess(cmd);
        // Stream stdout in real-time
        proc.stream((chunk) => {
          flashLog.value += chunk;
        });
        const result = await unwrap(proc.wait());
        // Append any remaining buffered output
        const finalStdout = result.getStdout();
        const finalStderr = result.getStderr();
        if (finalStderr) flashLog.value += finalStderr + '\n';
        flashLog.value += '\n--- ✓ Update completed successfully ---\n';
        if (device.requires_reboot) {
          flashRebootRequired.value = true;
          rebootPendingDevices.value.add(device.cache_index);
          await saveRebootPending();
          flashLog.value += '\n⚠ REBOOT REQUIRED: This device requires a system reboot to activate the new firmware.\n';
        }
        flashSuccess.value = true;
        // Refresh
        await checkFirmware();
      } catch (e) {
        if (e.stdout) flashLog.value += e.stdout + '\n';
        if (e.stderr) flashLog.value += e.stderr + '\n';
        flashLog.value += `\n✗ FAILED: ${e.message || e}\n`;
        flashSuccess.value = false;
        // Track this firmware file as failed for this session
        if (device.firmware_file) {
          failedFirmwareFiles.value.add(device.firmware_file);
        }
      }
      flashComplete.value = true;
      device.flashing = false;
    };

    // Safe Reboot
    const rebootModalVisible = ref(false);
    const rebootConfirmInput = ref('');
    const rebootError = ref('');
    const rebootExecuting = ref(false);

    const safeReboot = () => {
      rebootModalVisible.value = true;
      rebootConfirmInput.value = '';
      rebootError.value = '';
    };

    const executeReboot = async () => {
      rebootExecuting.value = true;
      rebootError.value = '';
      try {
        await unwrap(server.execute(
          new Command(["systemctl", "reboot"], { superuser: "require" })
        ));
      } catch (e) {
        rebootError.value = `Reboot command failed: ${e}`;
        rebootExecuting.value = false;
      }
    };

    // Auto-scroll the flash log when new content arrives
    watch(flashLog, () => {
      nextTick(() => {
        if (flashLogEl.value) {
          flashLogEl.value.scrollTop = flashLogEl.value.scrollHeight;
        }
      });
    });

    // Revert firmware (TESTING ONLY)
    const revertingAll = ref(false);

    const revertDevice = async (device) => {
      if (!confirm(`Revert ${device.model} (${device.device}) to previous firmware? (TESTING ONLY)`)) return;
      device.reverting = true;
      try {
        const proc = await unwrap(server.execute(
          new Command([
            "python3", "-u", "/usr/share/45drives/firmware/firmware-revert",
            "--cache-index", String(device.cache_index)
          ], { superuser: "require" })
        ));
        const output = proc.getStdout() + proc.getStderr();
        if (output.includes("Revert successful")) {
          alert("✓ Revert successful for " + device.model + ". Run Check for Updates to refresh.");
          await checkFirmware();
        } else {
          alert("✗ Revert failed:\n" + output);
        }
      } catch (e) {
        alert("✗ Revert error: " + (e.message || e));
      }
      device.reverting = false;
    };

    const revertAll = async () => {
      if (!confirm(`Revert ALL ${currentHddDevices.value.length} up-to-date HDDs to previous firmware? (TESTING ONLY)`)) return;
      revertingAll.value = true;
      let success = 0, failed = 0;
      for (const device of currentHddDevices.value) {
        device.reverting = true;
        try {
          const proc = await unwrap(server.execute(
            new Command([
              "python3", "-u", "/usr/share/45drives/firmware/firmware-revert",
              "--cache-index", String(device.cache_index)
            ], { superuser: "require" })
          ));
          const output = proc.getStdout() + proc.getStderr();
          if (output.includes("Revert successful")) {
            success++;
          } else {
            failed++;
          }
        } catch (e) {
          failed++;
        }
        device.reverting = false;
      }
      revertingAll.value = false;
      alert(`Revert All complete: ${success} succeeded, ${failed} failed.`);
      await checkFirmware();
    };

    return { devices, outdatedDevices, currentHddDevices, canFlash, checking, error, lastChecked, checkFirmware, infoVisible, infoDevice, showInfo, startFlash, flashDevice, confirmModalVisible, confirmLoading, confirmWarnings, confirmInfo, confirmBlocked, confirmActions, confirmDownloads, confirmDevice, confirmInput, proceedSingleFlash, flashProgressVisible, flashLog, flashLogEl, flashComplete, flashSuccess, flashRebootRequired, rebootPendingDevices, colorizeLog, rebootModalVisible, rebootConfirmInput, rebootError, rebootExecuting, safeReboot, executeReboot, revertDevice, revertAll, revertingAll };
  }
};
</script>
