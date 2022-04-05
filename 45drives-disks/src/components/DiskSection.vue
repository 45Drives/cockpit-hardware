<template>
  <div class="card m-2 flex-auto flex flex-col min-w-[35%]">
    <div
      class="card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"
    >
      <h3 class="text-lg leading-6 font-semibold">Disk Information</h3>
    </div>
    <div class="card-body dark:bg-stone-700 grow flex flex-col justify-start">
      <div v-if="currentDisk">
        <div class="grid grid-cols-6 divide-y divide-gray-300">
          <div
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2 border-t border-gray-300"
          >
            <div class="text-sm text-gray-500">Drive Slot</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["bay-id"] }}
            </div>
          </div>
          <div
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Disk Type</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["disk_type"] }}
            </div>
          </div>
          <div
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Device Path (sd)</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["dev"] }}
            </div>
          </div>
          <div
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Device Path (by-path)</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["dev-by-path"] }}
            </div>
          </div>
          <div
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Partition Count</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["partitions"] }}
            </div>
          </div>
          <div
            v-if="
              diskObj['model-family'] &&
              !['?'].includes(diskObj['model-family'])
            "
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Model Family</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["model-family"] }}
            </div>
          </div>
          <div
            v-if="
              diskObj['model-name'] && !['?'].includes(diskObj['model-name'])
            "
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Model Name</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["model-name"] }}
            </div>
          </div>
          <div
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Serial</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["serial"] }}
            </div>
          </div>
          <div
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Capacity</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["capacity"] }}
            </div>
          </div>
          <div
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Firmware Version</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["firm-ver"] }}
            </div>
          </div>
          <div
            v-if="diskObj['rotation-rate'] != 0"
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Rotation Rate</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["rotation-rate"] }} RPM
            </div>
          </div>
          <div
            v-if="
              diskObj['start-stop-count'] &&
              !['?'].includes(diskObj['start-stop-count'])
            "
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Start/Stop Count</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["start-stop-count"] }}
            </div>
          </div>
          <div
            v-if="
              diskObj['power-cycle-count'] &&
              !['?'].includes(diskObj['power-cycle-count'])
            "
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Power Cycle Count</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["power-cycle-count"] }}
            </div>
          </div>
          <div
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Temperature</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["temp-c"].replace(/[^0-9]/g, "") }} °C /
              {{
                (
                  diskObj["temp-c"].replace(/[^0-9]/g, "") * (9 / 5) +
                  32
                ).toFixed(1)
              }}
              °F
            </div>
          </div>
          <div
            v-if="
              diskObj['current-pending-sector'] &&
              !['?', 0, '0'].includes(diskObj['current-pending-sector'])
            "
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Current Pending Sector</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["current-pending-sector"] }}
            </div>
          </div>
          <div
            v-if="
              diskObj['offline-uncorrectable'] &&
              !['?', 0, '0'].includes(diskObj['offline-uncorrectable'])
            "
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Offline Uncorrectable</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["offline-uncorrectable"] }}
            </div>
          </div>
          <div
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Power On Time</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["power-on-time"] }} h
            </div>
          </div>
          <div
            class="col-span-6 md:col-span-3 grid grid-cols-3 py-1 md:py-2 px-2"
          >
            <div class="text-sm text-gray-500">Health</div>
            <div class="col-span-2 text-sm text-gray-900">
              {{ diskObj["health"] }}
            </div>
          </div>
        </div>
      </div>
      <div v-else class="grow flex justify-center items-center">
        <div
          class="p-5 bg-stone-100 dark:bg-stone-600 rounded-lg text-stone-500 dark:text-stone-300"
        >
          {{ wMsg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { RefreshIcon as RefreshIconOutline } from "@heroicons/vue/outline";
import { ref, watch, inject, reactive } from "vue";

export default {
  components: {
    RefreshIconOutline,
  },
  props: {
    diskInfo: Object,
  },
  setup(props) {
    const currentDisk = inject("currentDisk");
    const wMsg = ref("Click on a disk for more detail.");
    const diskObj = reactive({});
    const lsdevJson = inject("lsdevJson");

    const updateDiskObj = () => {
      if (!currentDisk.value) return;
      const tmpObj = lsdevJson.rows
        .flat()
        .filter((slot) => slot.occupied)
        .find((slot) => slot["bay-id"] === currentDisk.value);
      if (!tmpObj) {
        console.log(
          `Unable to find info for disk in slot "${currentDisk.value}"`
        );
        currentDisk.value = "";
        return;
      }
      Object.assign(diskObj, tmpObj);
    };

    watch(currentDisk, updateDiskObj);
    watch(lsdevJson, updateDiskObj); //when lsdev is run again on udev rule trigger

    return {
      wMsg,
      currentDisk,
      diskObj,
      lsdevJson,
    };
  },
};
</script>
