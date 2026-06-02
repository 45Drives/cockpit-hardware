<template>
<div class="card mt-2">
  <div class="card-header flex flex-row items-center justify-between">
    <h3 class="text-header text-default">Firmware</h3>
    <div class="flex items-center gap-2">
      <span v-if="lastChecked" class="text-xs text-muted">Last checked: {{ lastChecked }}</span>
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
    <div v-else-if="devices.length > 0" class="mt-2 flex flex-col">
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
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="(device, idx) in devices" :key="idx">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6 uppercase">{{ device.type }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ device.model || device.device_path || '-' }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ device.current_firmware || '-' }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ device.latest_firmware || '-' }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm">
                    <span v-if="device.update_available === 'outdated'" class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Update Available</span>
                    <span v-else-if="device.update_available === 'current'" class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Up to Date</span>
                    <span v-else class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Unknown</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-sm text-muted py-4 text-center">
      No firmware data available. Click the refresh button to check.
    </div>
  </div>
</div>
</template>

<script>
import { RefreshIcon as RefreshIconOutline } from "@heroicons/vue/outline";
import { ref } from "vue";
import { server, Command, unwrap } from "@45drives/houston-common-lib";

export default {
  components: { RefreshIconOutline },
  setup() {
    const devices = ref([]);
    const checking = ref(false);
    const error = ref("");
    const lastChecked = ref("");

    const loadCache = async () => {
      try {
        const proc = await unwrap(server.execute(
          new Command(["cat", "/var/cache/45drives/firmware.json"], { superuser: "require" })
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
          new Command(["python3", "/usr/share/cockpit/45drives-system/scripts/firmware-check"], { superuser: "require" })
        ));
        await loadCache();
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

    return { devices, checking, error, lastChecked, checkFirmware };
  }
};
</script>
