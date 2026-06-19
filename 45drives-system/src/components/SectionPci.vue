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

<!-- Pre-Reboot Storage Check Modal -->
<div v-if="preRebootModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden max-h-[85vh] flex flex-col">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
      <h3 class="text-lg font-bold text-gray-900">Pre-Reboot Storage Check</h3>
      <button @click="preRebootModalVisible = false" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
    </div>

    <div class="px-6 py-5 space-y-5 overflow-y-auto">
      <!-- Alert message -->
      <div class="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p class="text-sm text-blue-900 leading-relaxed">Rebooting will stop all running applications and services on this system. Save your work and stop any important jobs before continuing.</p>
      </div>

      <!-- Loading state -->
      <div v-if="preRebootLoading" class="flex items-center gap-3 py-6 justify-center">
        <svg class="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
        <span class="text-sm text-gray-600">Checking storage activity...</span>
      </div>

      <!-- Error state: check failed, no summary -->
      <div v-if="!preRebootLoading && !preRebootData.summary && preRebootData.overall_risk_level" class="rounded-md border-2 border-red-300 bg-red-50 p-4">
        <h4 class="text-sm font-bold text-red-900 flex items-center gap-2">
          <svg class="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          Storage Check Failed
        </h4>
        <p class="text-sm text-red-800 mt-2">Unable to verify storage safety. Rebooting without verification may risk data loss.</p>
        <p v-if="preRebootData.global_recommendations && preRebootData.global_recommendations.length" class="text-sm text-red-700 mt-1 font-mono">{{ preRebootData.global_recommendations[0] }}</p>
      </div>

      <div v-if="!preRebootLoading && preRebootData.summary" class="space-y-5">
        <!-- Storage Summary -->
        <div>
          <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Storage Summary</h4>
          <ul class="space-y-1.5 text-sm text-gray-700">
            <li class="flex items-start gap-2">
              <span class="text-gray-400 mt-0.5">•</span>
              <span>{{ preRebootData.summary.total_drives }} drives detected across {{ preRebootData.controller_count }} controllers</span>
            </li>
            <li v-if="!preRebootData.summary.active_writes && !preRebootData.summary.active_reads" class="flex items-start gap-2">
              <span class="text-gray-400 mt-0.5">•</span>
              <span>No active read/write activity detected</span>
            </li>
            <li v-else-if="preRebootData.summary.active_writes" class="flex items-start gap-2 text-red-700 font-medium">
              <span class="mt-0.5">•</span>
              <span>Active write operations detected</span>
            </li>
            <li v-else class="flex items-start gap-2 text-amber-700">
              <span class="mt-0.5">•</span>
              <span>Read activity detected</span>
            </li>
            <li v-if="preRebootData.summary.zfs_pools.length" class="flex items-start gap-2">
              <span class="text-gray-400 mt-0.5">•</span>
              <span>{{ preRebootData.summary.zfs_pools.length }} imported ZFS pool{{ preRebootData.summary.zfs_pools.length > 1 ? 's' : '' }} detected: <strong>{{ preRebootData.summary.zfs_pools.join(', ') }}</strong></span>
            </li>
            <li v-if="preRebootData.summary.resilver_rebuild_in_progress.length" class="flex items-start gap-2 text-red-700 font-medium">
              <span class="mt-0.5">•</span>
              <span>Resilver/rebuild in progress: {{ preRebootData.summary.resilver_rebuild_in_progress.join(', ') }}</span>
            </li>
            <li v-if="preRebootData.summary.mounted_filesystems.length" class="flex items-start gap-2">
              <span class="text-gray-400 mt-0.5">•</span>
              <span>{{ preRebootData.summary.mounted_filesystems.length }} mounted filesystem{{ preRebootData.summary.mounted_filesystems.length > 1 ? 's' : '' }}</span>
            </li>
          </ul>
        </div>

        <!-- Warning Card -->
        <div v-if="preRebootData.controllers.some(c => c.risk_level !== 'safe' && c.risk_level !== 'info' && c.warnings && c.warnings.length)" class="rounded-md border-2 border-amber-300 bg-amber-50 overflow-hidden">
          <div class="px-4 py-3 bg-amber-100 border-b border-amber-200">
            <h4 class="text-sm font-bold text-amber-900 uppercase tracking-wide flex items-center gap-2">
              <svg class="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              Warning
            </h4>
          </div>
          <div class="px-4 py-4 space-y-4">
            <template v-for="ctrl in preRebootData.controllers.filter(c => c.risk_level !== 'safe' && c.risk_level !== 'info' && c.warnings && c.warnings.length)" :key="'w-'+ctrl.pci_address">
              <!-- Warning description -->
              <div v-for="w in ctrl.warnings" :key="w" class="text-sm text-amber-900 leading-relaxed">{{ w }}</div>

              <!-- Affected pools / details -->
              <div v-if="ctrl.zfs_pools && ctrl.zfs_pools.length" class="mt-1">
                <p class="text-xs font-semibold text-amber-800 uppercase tracking-wide">Affected pool{{ ctrl.zfs_pools.length > 1 ? 's' : '' }}:</p>
                <p class="text-sm text-amber-900 font-medium mt-0.5">{{ ctrl.zfs_pools.map(p => p.name || p).join(', ') }}</p>
              </div>

              <!-- Recommended action -->
              <div v-if="ctrl.recommendations && ctrl.recommendations.length">
                <p class="text-xs font-semibold text-amber-800 uppercase tracking-wide">Recommended action:</p>
                <div class="mt-1.5 space-y-1.5">
                  <code v-for="r in ctrl.recommendations" :key="r" class="block text-sm font-mono bg-white text-gray-800 rounded px-3 py-2 border border-amber-200 shadow-sm">{{ r }}</code>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- High/Critical warning card -->
        <div v-if="!preRebootData.safe_to_reboot" class="rounded-md border-2 overflow-hidden" :class="preRebootData.overall_risk_level === 'high' || preRebootData.overall_risk_level === 'critical' ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'">
          <div class="px-4 py-3 border-b" :class="preRebootData.overall_risk_level === 'high' || preRebootData.overall_risk_level === 'critical' ? 'bg-red-100 border-red-200' : 'bg-amber-100 border-amber-200'">
            <h4 class="text-sm font-bold uppercase tracking-wide flex items-center gap-2" :class="preRebootData.overall_risk_level === 'high' || preRebootData.overall_risk_level === 'critical' ? 'text-red-900' : 'text-amber-900'">
              <svg class="h-4 w-4" :class="preRebootData.overall_risk_level === 'high' || preRebootData.overall_risk_level === 'critical' ? 'text-red-600' : 'text-amber-600'" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              {{ preRebootData.overall_risk_level === 'high' || preRebootData.overall_risk_level === 'critical' ? 'Critical — Data Loss Risk' : 'Confirmation Required' }}
            </h4>
          </div>
          <div class="px-4 py-4">
            <p class="text-sm leading-relaxed" :class="preRebootData.overall_risk_level === 'high' || preRebootData.overall_risk_level === 'critical' ? 'text-red-900' : 'text-amber-900'">{{ preRebootData.overall_risk_level === 'high' || preRebootData.overall_risk_level === 'critical' ? 'Active storage I/O or critical operations detected. Rebooting now may cause data loss or corruption.' : 'Storage warnings detected. Please review the warnings above before proceeding.' }}</p>
            <div class="mt-3">
              <label class="text-sm font-medium" :class="preRebootData.overall_risk_level === 'high' || preRebootData.overall_risk_level === 'critical' ? 'text-red-800' : 'text-amber-800'">Type <strong>CONFIRM</strong> to proceed:</label>
              <input v-model="confirmText" type="text" class="mt-1.5 block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-1" :class="preRebootData.overall_risk_level === 'high' || preRebootData.overall_risk_level === 'critical' ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-amber-300 focus:border-amber-500 focus:ring-amber-500'" placeholder="CONFIRM" />
            </div>
          </div>
        </div>

        <!-- Additional note / Global recommendations -->
        <div v-if="preRebootData.global_recommendations && preRebootData.global_recommendations.length" class="text-sm text-gray-600 space-y-1">
          <p v-for="r in preRebootData.global_recommendations" :key="r" class="leading-relaxed">{{ r }}</p>
        </div>

        <!-- Technical Details (expandable) -->
        <details class="group">
          <summary class="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg class="h-4 w-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            Technical Details
          </summary>
          <div class="mt-3 space-y-1.5 pl-5">
            <div v-for="ctrl in preRebootData.controllers" :key="'d-'+ctrl.pci_address" class="text-sm text-gray-700 leading-relaxed">
              <span class="font-medium">{{ getControllerName(ctrl) }}</span>
              <span class="font-mono text-xs text-gray-500 ml-1">({{ ctrl.pci_address }})</span>:
              <span v-if="ctrl.block_devices && ctrl.block_devices.length" class="text-gray-600">{{ ctrl.block_devices.join(', ') }} — {{ ctrl.activity_status || 'idle' }}</span>
              <span v-else class="text-gray-500 italic">no drives attached</span>
            </div>
          </div>
        </details>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
      <button @click="preRebootModalVisible = false" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Cancel</button>
      <button @click="runPreRebootCheck()" :disabled="preRebootLoading" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50">Re-check</button>
      <button
        @click="doReboot()"
        :disabled="preRebootLoading || (!preRebootData.safe_to_reboot && confirmText !== 'CONFIRM')"
        class="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >Reboot Now</button>
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
          new Command(["cat", "/var/cache/45drives/firmware/status.json"], { superuser: "try" })
        ));
        return JSON.parse(cacheProc.getStdout());
      } catch (e) {
        // Cache doesn't exist yet — generate it
        console.log("Firmware cache not found, running firmware-check...");
        try {
          const fwProc = await unwrap(server.execute(
            new Command(["python3", "/usr/share/45drives/firmware/firmware-check"], { superuser: "try" }),
            false
          ));
          if (fwProc.exitStatus === 1) {
            console.log("Firmware check failed (exit 1):", fwProc.getStderr());
            return null;
          }
          const retryProc = await unwrap(server.execute(
            new Command(["cat", "/var/cache/45drives/firmware/status.json"], { superuser: "try" })
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
        const match = pciList.find(pci => (pci.busAddress || '').toLowerCase() === String(device.bus_info || device.device_path || '').toLowerCase());
        if (match) {
          match.cacheIndex = device.cache_index;
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
    const REBOOT_PENDING_FILE = '/var/cache/45drives/firmware/reboot-pending.json';

    const saveRebootPending = async (cacheIndex) => {
      try {
        // Read existing pending list
        let pending = [];
        try {
          const proc = await unwrap(server.execute(
            new Command(["cat", REBOOT_PENDING_FILE], { superuser: "try" })
          ));
          pending = JSON.parse(proc.getStdout());
        } catch (e) { /* file doesn't exist yet */ }
        // Normalize to numeric values for compatibility with SectionFirmware
        pending = Array.isArray(pending)
          ? pending.map(Number).filter(n => Number.isFinite(n))
          : [];
        const idx = Number(cacheIndex);
        if (!Number.isFinite(idx)) return;
        if (!pending.includes(idx)) {
          pending.push(idx);
        }
        const data = JSON.stringify(pending);
        await unwrap(server.execute(
          new Command(["python3", "-c", "import sys; open(sys.argv[1],'w').write(sys.argv[2])", REBOOT_PENDING_FILE, data], { superuser: "require" })
        ));
      } catch (e) {
        console.log("Failed to save reboot-pending state:", e);
      }
    };

    const loadRebootPending = async () => {
      try {
        const proc = await unwrap(server.execute(
          new Command(["cat", REBOOT_PENDING_FILE], { superuser: "try" })
        ));
        const pending = JSON.parse(proc.getStdout());
        return Array.isArray(pending)
          ? pending.map(Number).filter(n => Number.isFinite(n))
          : [];
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
      confirmText.value = '';
      preRebootModalVisible.value = true;
      await runPreRebootCheck();
    };

    const runPreRebootCheck = async () => {
      preRebootLoading.value = true;
      try {
        const proc = await unwrap(server.execute(
          new Command(["python3", "/usr/share/cockpit/45drives-system/scripts/pre-reboot-storage-check",
            "--samples", "3", "--interval", "1"
          ], { superuser: "try" })
        ));
        const result = JSON.parse(proc.getStdout());
        preRebootData.value = result;
      } catch (e) {
        preRebootData.value = {
          overall_risk_level: 'warning',
          safe_to_reboot: false,
          controllers: [],
          global_recommendations: ['Pre-reboot check failed: ' + (e.message || e)],
        };
      }
      preRebootLoading.value = false;
    };

    const doReboot = async () => {
      // Re-run check to ensure state hasn't changed since modal was opened
      try {
        const proc = await unwrap(server.execute(
          new Command(["python3", "/usr/share/cockpit/45drives-system/scripts/pre-reboot-storage-check",
            "--samples", "2", "--interval", "1"
          ], { superuser: "try" })
        ));
        const freshResult = JSON.parse(proc.getStdout());
        if (!freshResult.safe_to_reboot && freshResult.overall_risk_level !== preRebootData.value.overall_risk_level) {
          // Risk escalated since user confirmed — update modal and abort
          preRebootData.value = freshResult;
          confirmText.value = '';
          return;
        }
      } catch (e) {
        // If re-check fails, abort reboot
        preRebootData.value = {
          overall_risk_level: 'warning',
          safe_to_reboot: false,
          controllers: [],
          global_recommendations: ['Re-check before reboot failed: ' + (e.message || e)],
        };
        confirmText.value = '';
        return;
      }
      preRebootModalVisible.value = false;
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

    const preRebootModalVisible = ref(false);
    const preRebootData = ref({});
    const preRebootLoading = ref(false);
    const confirmText = ref('');

    const getControllerName = (ctrl) => {
      // Try to match with pcis table data by bus address
      const match = pcis.value.find(p => p.busAddress === ctrl.pci_address);
      if (match && match.cardModel && match.cardModel !== 'Loading...') {
        return match.cardModel;
      }
      if (match && match.cardType && match.cardType !== 'Loading...') {
        return match.cardType;
      }
      // Fallback to description from lspci or just the address
      if (ctrl.description && !ctrl.description.includes('Advanced Micro Devices')) {
        return ctrl.description;
      }
      if (ctrl.block_devices && ctrl.block_devices.length > 0) {
        return "Storage Controller";
      }
      return "Controller";
    };

    const flashDevice = async (pci) => {
      pci.flashing = true;
      isFlashing.value = true;
      try {
        // Run pre-flash validation
        const preCheck = await unwrap(server.execute(
          new Command(["python3", "/usr/share/cockpit/45drives-system/scripts/pre-flash-check",
            "--device-path", pci.busAddress
          ], { superuser: "try" })
        ));
        const preResult = JSON.parse(preCheck.getStdout());
        if (!preResult.safe_to_flash) {
          pci.flashing = false;
          isFlashing.value = false;
          alert('Pre-flash check failed: ' + (preResult.message || 'Controller not ready'));
          return;
        }

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
            await saveRebootPending(pci.cacheIndex);
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
          const fwProc = await unwrap(server.execute(
            new Command(["python3", "/usr/share/45drives/firmware/firmware-check"], { superuser: "try" }),
            false
          ));
          if (fwProc.exitStatus === 1) {
            console.log("Firmware check error (exit 1):", fwProc.getStderr());
          }
        } catch (e) {
          console.log("Firmware check failed (non-fatal):", e);
        }
      }
      try {
        const proc = await unwrap(server.execute(
          new Command(["/usr/share/cockpit/45drives-system/scripts/pci"], { superuser: "try" })
        ));
        let pciInfo = JSON.parse(proc.getStdout());
        const cache = await loadFirmwareCache();
        if (cache) {
          mergeFirmwareStatus(pciInfo, cache);
        }
        // Restore reboot-pending state from disk
        const pendingList = await loadRebootPending();
        pendingList.forEach(idx => {
          const match = pciInfo.find(pci => pci.cacheIndex === idx);
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
      rebootNow,
      preRebootModalVisible,
      preRebootData,
      preRebootLoading,
      confirmText,
      getControllerName,
      runPreRebootCheck,
      doReboot
    }
  },
  components: {
    RefreshIconOutline,
    ErrorMessage
  },
};
</script>