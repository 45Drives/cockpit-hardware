<template>
<div class="card mt-2">
  <div class="card-header flex flex-row items-center justify-between">
    <h3 class="text-header text-default">Firmware Updates Available</h3>
    <div class="flex items-center gap-2">
      <span v-if="lastChecked" class="text-xs text-muted">Last checked: {{ lastChecked }}</span>
      <button
        v-if="flashableDevices.length > 0"
        type="button"
        :disabled="checking"
        @click="flashAllDevices()"
        class="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Update All ({{ flashableDevices.length }})
      </button>
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
        class="btn btn-sm btn-default"
        title="Dismiss notification badge"
        @click="dismissBadge()"
      >
        Dismiss
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
  <div class="card-body">
    <div v-if="checking && devices.length === 0" class="text-sm text-muted py-4 text-center">
      Running firmware discovery and comparison...
    </div>
    <div v-else-if="error" class="text-sm text-red-600 py-4">
      {{ error }}
    </div>
    <div v-else-if="outdatedDevices.length > 0" class="mt-2 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-default">
              <thead class="bg-accent">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6">Type</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Device</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Current FW</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Latest FW</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="(device, idx) in outdatedDevices" :key="idx">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6 uppercase">{{ device.type }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ device.device || '-' }} <span class="text-xs text-gray-400">({{ device.model || '-' }})</span></td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm font-mono text-muted">{{ device.current_firmware || '-' }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm font-mono text-muted">{{ device.latest_firmware || '-' }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                    <div class="flex items-center gap-2">
                      <span v-if="rebootPendingDevices.has(device.cache_index)" class="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">⚠ Reboot Required</span>
                      <span v-else-if="device.payload_missing" class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Payload Not Deployed</span>
                      <span v-else class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Update Available</span>
                      <button @click="showInfo(device)" class="inline-flex items-center rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700">Info</button>
                      <button v-if="canFlash(device) && !rebootPendingDevices.has(device.cache_index)" :disabled="device.flashing" @click="startFlash(device)" class="inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">{{ device.flashing ? 'Flashing...' : 'Update' }}</button>
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
      <div class="bg-gray-900 rounded-md p-3 font-mono text-xs max-h-64 overflow-y-auto whitespace-pre-wrap" v-html="colorizeLog(flashLog)"></div>
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
          <div v-if="confirmWarnings.length > 0" class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Drive is currently in use</h3>
                <ul class="mt-2 text-sm text-red-700 list-disc pl-5 space-y-1">
                  <li v-for="(w, i) in confirmWarnings" :key="i">{{ w }}</li>
                </ul>
                <p class="mt-2 text-sm text-red-800 font-medium">Flashing firmware while the drive is active may cause data loss.</p>
              </div>
            </div>
          </div>
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
        </template>
        <div v-if="confirmDevice?.type === 'hdd'" class="rounded-md bg-yellow-50 border border-yellow-200 p-4 mt-4">
          <p class="text-xs text-yellow-700"><strong>Important:</strong> Ensure your data is backed up. 45Drives and Seagate are not responsible for any data loss or product damage resulting from a firmware update. Do not power off the system during the flash process.</p>
        </div>
        <div v-else class="rounded-md bg-yellow-50 border border-yellow-200 p-4 mt-4">
          <p class="text-xs text-yellow-700"><strong>Important:</strong> Do not power off the system during the flash process. A reboot may be required to activate the new firmware.</p>
        </div>
      </div>
    </div>
    <div v-if="!confirmLoading" class="px-6 py-3 border-t border-default space-y-3">
      <div>
        <label class="block text-sm font-medium text-default mb-1">Type <span class="font-mono font-bold text-red-600">confirm flash</span> to proceed:</label>
        <input v-model="confirmInput" type="text" placeholder="confirm flash" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" @keyup.enter="confirmInput === 'confirm flash' && proceedSingleFlash()" />
      </div>
      <div class="flex justify-end gap-2">
        <button @click="confirmModalVisible = false; confirmInput = ''" class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">Cancel</button>
        <button @click="proceedSingleFlash()" :disabled="confirmInput !== 'confirm flash'" class="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed" :class="confirmWarnings.length > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'">
          {{ confirmWarnings.length > 0 ? 'Flash Anyway' : 'Proceed with Flash' }}
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Batch Flash Modal -->
<div v-if="batchModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-default rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
    <div class="px-6 py-4 border-b border-default flex justify-between items-center">
      <h3 class="text-lg font-semibold">{{ batchFlashing ? 'Batch Firmware Update' : batchComplete ? 'Batch Update Complete' : 'Update All — Pre-Check' }}</h3>
      <button v-if="!batchFlashing" @click="batchModalVisible = false" class="text-muted hover:text-default text-xl">&times;</button>
    </div>
    <div class="px-6 py-4 space-y-4">
      <!-- Disclaimer -->
      <div v-if="!batchLoading" class="rounded-md bg-yellow-50 border border-yellow-200 p-3">
        <ul class="text-xs text-yellow-700 font-medium list-disc pl-4 space-y-1">
          <li v-if="batchDrives.some(d => d.type === 'hdd')">Ensure all drives are backed up before proceeding.</li>
          <li>Do not power off the system during the update process.</li>
          <li v-if="batchDrives.some(d => d.type === 'hdd')">45Drives and Seagate are not responsible for any data loss or product damage resulting from a firmware update.</li>
          <li v-else>45Drives is not responsible for any product damage resulting from a firmware update.</li>
        </ul>
      </div>

      <!-- Loading pre-checks -->
      <div v-if="batchLoading" class="flex items-center justify-center py-6">
        <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span class="ml-3 text-sm text-muted">Running pre-flight checks on {{ batchDrives.length }} devices...</span>
      </div>

      <!-- Pre-check results / progress -->
      <div v-else class="max-h-80 overflow-y-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-default">
              <th class="text-left py-2 pr-3 font-medium">Device</th>
              <th class="text-left py-2 pr-3 font-medium">FW</th>
              <th class="text-left py-2 pr-3 font-medium">Pre-Check</th>
              <th class="text-left py-2 font-medium">Flash</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bd in batchDrives" :key="bd.device" class="border-b border-default">
              <td class="py-2 pr-3 font-mono text-xs">{{ bd.device }} <span class="text-muted">({{ bd.model }})</span></td>
              <td class="py-2 pr-3 font-mono text-xs">{{ bd.current_firmware }} → {{ bd.latest_firmware }}</td>
              <td class="py-2 pr-3">
                <span v-if="bd.preCheck === 'idle'" class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Idle</span>
                <span v-else-if="bd.preCheck === 'busy'" class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Busy</span>
                <span v-else-if="bd.preCheck === 'checking'" class="text-xs text-muted">Checking...</span>
                <span v-else-if="bd.preCheck === 'na'" class="text-xs text-muted">N/A</span>
                <span v-else class="text-xs text-muted">—</span>
              </td>
              <td class="py-2">
                <span v-if="bd.flashStatus === 'pending'" class="text-xs text-muted">Pending</span>
                <span v-else-if="bd.flashStatus === 'flashing'" class="text-xs text-blue-600 font-medium">Flashing...</span>
                <span v-else-if="bd.flashStatus === 'success'" class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">✓ Success</span>
                <span v-else-if="bd.flashStatus === 'failed'" class="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">✗ Failed</span>
                <span v-else-if="bd.flashStatus === 'skipped'" class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Skipped</span>
                <span v-else class="text-xs text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Summary after completion -->
        <div v-if="batchComplete" class="mt-4 p-3 rounded-md" :class="batchFailCount > 0 ? 'bg-yellow-50' : 'bg-green-50'">
          <p class="text-sm font-medium" :class="batchFailCount > 0 ? 'text-yellow-800' : 'text-green-800'">
            Batch complete: {{ batchSuccessCount }} succeeded, {{ batchFailCount }} failed, {{ batchSkipCount }} skipped
          </p>
        </div>
        <div v-if="batchComplete && batchRebootRequired" class="mt-3 rounded-md bg-yellow-50 border border-yellow-200 p-3">
          <p class="text-sm font-medium text-yellow-800">⚠ System reboot required to activate new firmware on one or more devices.</p>
        </div>

        <!-- Busy drive warning -->
        <div v-if="!batchFlashing && !batchComplete && batchBusyCount > 0" class="mt-3 rounded-md bg-yellow-50 border border-yellow-200 p-3">
          <p class="text-xs text-yellow-800"><strong>Warning:</strong> {{ batchBusyCount }} device(s) are currently in use. They will be skipped unless you choose to include them.</p>
        </div>
      </div>

      <!-- Batch log -->
      <div v-if="batchFlashing || batchComplete" class="bg-gray-900 rounded-md p-3 font-mono text-xs max-h-40 overflow-y-auto whitespace-pre-wrap" v-html="colorizeLog(batchLog || 'Starting batch flash...')"></div>
    </div>

    <!-- Actions -->
    <div v-if="!batchLoading" class="px-6 py-3 border-t border-default">
      <div v-if="!batchFlashing && !batchComplete" class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-default mb-1">Type <span class="font-mono font-bold text-red-600">confirm flash</span> to proceed:</label>
          <input v-model="batchConfirmInput" type="text" placeholder="confirm flash" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>
        <div class="flex justify-between items-center">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="batchIncludeBusy" class="rounded" />
            Include busy devices
          </label>
          <div class="flex gap-2">
            <button @click="batchModalVisible = false" class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">Cancel</button>
            <button @click="proceedBatchFlash()" :disabled="batchConfirmInput !== 'confirm flash'" class="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Flash All ({{ batchIncludeBusy ? batchDrives.length : batchDrives.filter(d => d.preCheck !== 'busy').length }})
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="batchComplete" class="flex justify-end">
        <button @click="batchModalVisible = false" class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">Close</button>
      </div>
      <div v-else class="flex items-center gap-3">
        <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span class="text-sm font-medium text-yellow-600">Flashing in progress — do NOT power off!</span>
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
        <input v-model="rebootConfirmInput" type="text" placeholder="reboot now" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
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
import { RefreshIcon as RefreshIconOutline } from "@heroicons/vue/outline";
import { ref, computed, inject } from "vue";
import { server, Command, unwrap } from "@45drives/houston-common-lib";

export default {
  components: { RefreshIconOutline },
  setup() {
    const devices = ref([]);
    const checking = ref(false);
    const error = ref("");
    const lastChecked = ref("");
    const dismissBadge = inject('dismissBadge', () => {});
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
        await unwrap(server.execute(
          new Command(["python3", "/usr/share/45drives/firmware/firmware-check"], { superuser: "require" })
        ));
        await loadCache();
        checkFirmwareBadge();
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

    // A device can be flashed if it has flashable flag and either:
    // - a firmware_file (normal flash), or
    // - a tool_package (nvmupdate — self-contained package with its own firmware)
    const canFlash = (device) => {
      if (!device.flashable) return false;
      if (device.firmware_file) return true;
      if (device.tool_package) return true;
      return false;
    };

    // Devices eligible for batch flash (exclude reboot-pending ones)
    const flashableDevices = computed(() => outdatedDevices.value.filter(d => canFlash(d) && !rebootPendingDevices.value.has(d.cache_index)));

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
    const confirmActions = ref([]);
    const confirmDownloads = ref([]);
    const confirmDevice = ref({});
    const confirmInput = ref('');

    const startFlash = async (device) => {
      // For HDD type, run pre-flight activity check
      if (device.type === 'hdd') {
        confirmDevice.value = device;
        confirmWarnings.value = [];
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

        const devName = (device.device || device.sg_device || '').replace('/dev/', '');
        try {
          const checkProc = await unwrap(server.execute(
            new Command(["bash", "-c", `
              DEV="/dev/${devName}"
              WARNINGS=""

              MOUNTS=$(lsblk -n -o MOUNTPOINT "$DEV" 2>/dev/null | grep -v "^$")
              if [ -n "$MOUNTS" ]; then
                WARNINGS="$WARNINGS\nDrive has mounted filesystems: $MOUNTS"
              fi

              ZFS=$(zpool status 2>/dev/null | grep -B5 "${devName}" | grep "pool:" | awk '{print $2}')
              if [ -n "$ZFS" ]; then
                WARNINGS="$WARNINGS\nDrive is part of ZFS pool: $ZFS"
              fi

              MD=$(grep "${devName}" /proc/mdstat 2>/dev/null)
              if [ -n "$MD" ]; then
                WARNINGS="$WARNINGS\nDrive is part of MD RAID array"
              fi

              INFLIGHT=$(cat /sys/block/${devName}/inflight 2>/dev/null | awk '{print $1+$2}')
              if [ -n "$INFLIGHT" ] && [ "$INFLIGHT" -gt 0 ]; then
                WARNINGS="$WARNINGS\nDrive has $INFLIGHT in-flight I/O requests"
              fi

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
          confirmWarnings.value = ["Unable to determine drive activity status"];
        }
        confirmLoading.value = false;
      } else {
        // Non-HDD devices (NIC, HBA, etc.) — show preflight info then flash
        confirmDevice.value = device;
        confirmWarnings.value = [];
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
    const flashComplete = ref(false);
    const flashSuccess = ref(false);
    const flashRebootRequired = ref(false);

    // Batch flash state
    const batchModalVisible = ref(false);
    const batchLoading = ref(false);
    const batchFlashing = ref(false);
    const batchComplete = ref(false);
    const batchDrives = ref([]);
    const batchConfirmInput = ref('');
    const batchIncludeBusy = ref(false);
    const batchLog = ref('');
    const batchSuccessCount = ref(0);
    const batchFailCount = ref(0);
    const batchSkipCount = ref(0);
    const batchRebootRequired = ref(false);
    const batchBusyCount = computed(() => batchDrives.value.filter(d => d.preCheck === 'busy').length);

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
        const proc = await unwrap(server.execute(
          new Command([
            "python3", "-u", "/usr/share/45drives/firmware/firmware-flash",
            "--cache-index", String(device.cache_index),
            "--allow-download"
          ], { superuser: "require" })
        ));
        const stdout = proc.getStdout();
        const stderr = proc.getStderr();
        if (stdout) flashLog.value += stdout + '\n';
        if (stderr) flashLog.value += stderr + '\n';
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
      }
      flashComplete.value = true;
      device.flashing = false;
    };

    const flashAllDevices = async () => {
      batchDrives.value = flashableDevices.value.map(d => ({
        ...d,
        preCheck: d.type === 'hdd' ? 'checking' : 'na',
        flashStatus: '',
      }));
      batchConfirmInput.value = '';
      batchIncludeBusy.value = false;
      batchComplete.value = false;
      batchFlashing.value = false;
      batchLog.value = '';
      batchSuccessCount.value = 0;
      batchFailCount.value = 0;
      batchSkipCount.value = 0;
      batchModalVisible.value = true;
      batchLoading.value = true;

      // Run pre-checks for HDD devices (check if in use)
      for (let bd of batchDrives.value) {
        if (bd.type !== 'hdd') continue;
        const devName = (bd.device || '').replace('/dev/', '');
        if (!devName) { bd.preCheck = 'na'; continue; }
        try {
          const checkProc = await unwrap(server.execute(
            new Command(["bash", "-c", `
              DEV="/dev/${devName}"
              MOUNTS=$(lsblk -n -o MOUNTPOINT "$DEV" 2>/dev/null | grep -v "^$")
              ZFS=$(zpool status 2>/dev/null | grep -B5 "${devName}" | grep "pool:" | awk '{print $2}')
              MD=$(grep "${devName}" /proc/mdstat 2>/dev/null)
              INFLIGHT=$(cat /sys/block/${devName}/inflight 2>/dev/null | awk '{print $1+$2}')
              FUSER=$(fuser "$DEV" 2>/dev/null)
              if [ -n "$MOUNTS" ] || [ -n "$ZFS" ] || [ -n "$MD" ] || ([ -n "$INFLIGHT" ] && [ "$INFLIGHT" -gt 0 ]) || [ -n "$FUSER" ]; then
                echo "BUSY"
              else
                echo "IDLE"
              fi
            `], { superuser: "require" })
          ));
          const result = checkProc.getStdout().trim();
          bd.preCheck = result === 'IDLE' ? 'idle' : 'busy';
        } catch (e) {
          bd.preCheck = 'busy';
        }
      }
      batchLoading.value = false;
    };

    const proceedBatchFlash = async () => {
      batchFlashing.value = true;
      batchLog.value = `Starting batch firmware update...\n\n`;

      const toFlash = batchIncludeBusy.value
        ? batchDrives.value
        : batchDrives.value.filter(d => d.preCheck !== 'busy');

      // Mark skipped
      for (let bd of batchDrives.value) {
        if (!toFlash.includes(bd)) {
          bd.flashStatus = 'skipped';
          batchSkipCount.value++;
        } else {
          bd.flashStatus = 'pending';
        }
      }

      for (let bd of toFlash) {
        bd.flashStatus = 'flashing';
        batchLog.value += `--- ${bd.device || bd.model} (${bd.type}) ---\n`;
        batchLog.value += `  ${bd.current_firmware} → ${bd.latest_firmware}\n`;

        try {
          const proc = await unwrap(server.execute(
            new Command([
              "python3", "-u", "/usr/share/45drives/firmware/firmware-flash",
              "--cache-index", String(bd.cache_index),
              "--allow-download"
            ], { superuser: "require" })
          ));
          const stdout = proc.getStdout();
          if (stdout) batchLog.value += stdout.trim() + '\n';
          batchLog.value += `  ✓ Success\n\n`;
          bd.flashStatus = 'success';
          batchSuccessCount.value++;
          if (bd.requires_reboot) {
            batchRebootRequired.value = true;
            rebootPendingDevices.value.add(bd.cache_index);
            await saveRebootPending();
          }
        } catch (e) {
          if (e.stdout) batchLog.value += e.stdout + '\n';
          if (e.stderr) batchLog.value += e.stderr + '\n';
          batchLog.value += `  ✗ FAILED: ${e.message || e}\n\n`;
          bd.flashStatus = 'failed';
          batchFailCount.value++;
        }
      }

      // Refresh cache
      batchLog.value += `\nRefreshing firmware status...\n`;
      try {
        await unwrap(server.execute(
          new Command(["python3", "/usr/share/45drives/firmware/firmware-check"], { superuser: "require" })
        ));
        await loadCache();
        batchLog.value += 'Done.\n';
      } catch (e) {
        batchLog.value += 'Warning: cache refresh failed.\n';
      }
      batchFlashing.value = false;
      batchComplete.value = true;
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

    return { devices, outdatedDevices, flashableDevices, canFlash, checking, error, lastChecked, checkFirmware, dismissBadge, infoVisible, infoDevice, showInfo, startFlash, flashDevice, confirmModalVisible, confirmLoading, confirmWarnings, confirmActions, confirmDownloads, confirmDevice, confirmInput, proceedSingleFlash, flashProgressVisible, flashLog, flashComplete, flashSuccess, flashRebootRequired, rebootPendingDevices, colorizeLog, batchModalVisible, batchLoading, batchFlashing, batchComplete, batchDrives, batchConfirmInput, batchIncludeBusy, batchLog, batchSuccessCount, batchFailCount, batchSkipCount, batchRebootRequired, batchBusyCount, flashAllDevices, proceedBatchFlash, rebootModalVisible, rebootConfirmInput, rebootError, rebootExecuting, safeReboot, executeReboot };
  }
};
</script>
