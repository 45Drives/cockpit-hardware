<template>
  <div class="card m-2 self-stretch flex-auto flex flex-col min-w-[50%]">
    <div
      class="card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"
    >
      <h3 class="text-lg leading-6 font-semibold">Disk Information</h3>
    </div>
    <div
      id="disk-section-card-body"
      class="card-body dark:bg-stone-700 grow flex flex-col justify-start h-full"
    >
      <div
        id="diskInfoTable"
        v-if="currentDisk"
        class="flex flex-col flex-wrap h-full"
      >
        <div
          v-if="diskObj['bay-id']"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Drive Slot
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["bay-id"] }}
          </div>
        </div>
        <div
          v-if="diskObj['disk_type']"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Disk Type
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["disk_type"] }}
          </div>
        </div>
        <div v-if="diskObj['dev']" class="grid grid-cols-1 py-1 md:py-2 px-2">
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Device Path (sd)
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["dev"] }}
          </div>
        </div>
        <div
          v-if="diskObj['dev-by-path']"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Device Path (by-path)
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["dev-by-path"] }}
          </div>
        </div>
        <div
          v-if="diskObj['partitions']"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Partition Count
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["partitions"] }}
          </div>
        </div>
        <div
          v-if="
            diskObj['model-family'] && !['?'].includes(diskObj['model-family'])
          "
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Model Family
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["model-family"] }}
          </div>
        </div>
        <div
          v-if="diskObj['model-name'] && !['?'].includes(diskObj['model-name'])"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Model Name
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["model-name"] }}
          </div>
        </div>
        <div
          v-if="diskObj['serial']"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">Serial</div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["serial"] }}
          </div>
        </div>
        <div
          v-if="diskObj['capacity']"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">Capacity</div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["capacity"] }}
          </div>
        </div>
        <div
          v-if="diskObj['firm-ver'] && !['?'].includes(diskObj['start-stop-count'])"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Firmware Version
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["firm-ver"] }}
          </div>
        </div>
        <div
          v-if="diskObj['rotation-rate'] && diskObj['rotation-rate'] != 0"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Rotation Rate
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["rotation-rate"] }} RPM
          </div>
        </div>
        <div
          v-if="
            diskObj['start-stop-count'] &&
            !['?'].includes(diskObj['start-stop-count'])
          "
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Start/Stop Count
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["start-stop-count"] }}
          </div>
        </div>
        <div
          v-if="
            diskObj['power-cycle-count'] &&
            !['?'].includes(diskObj['power-cycle-count'])
          "
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Power Cycle Count
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["power-cycle-count"] }}
          </div>
        </div>
        <div
          v-if="diskObj['temp-c']"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Temperature
          </div>
          <div
            v-if="diskObj['temp-c']"
            class="text-sm text-stone-900 dark:text-stone-200"
          >
            {{ diskObj["temp-c"]?.replace(/[^0-9]/g, "") }} °C /
            {{
              (
                diskObj["temp-c"]?.replace(/[^0-9]/g, "") * (9 / 5) +
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
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Current Pending Sector
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["current-pending-sector"] }}
          </div>
        </div>
        <div
          v-if="
            diskObj['offline-uncorrectable'] &&
            !['?', 0, '0'].includes(diskObj['offline-uncorrectable'])
          "
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Offline Uncorrectable
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["offline-uncorrectable"] }}
          </div>
        </div>
        <div
          v-if="diskObj['power-on-time']"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">
            Power On Time
          </div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["power-on-time"] }} h
          </div>
        </div>
        <div
          v-if="diskObj['health']"
          class="grid grid-cols-1 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-stone-500 dark:text-stone-400">Health</div>
          <div class="text-sm text-stone-900 dark:text-stone-200">
            {{ diskObj["health"] }}
          </div>
        </div>
        <div
          v-if="loadingSpinner"
          class="grid grid-cols-1 py-1 md:py-2 px-2 row-span-2"
        >
          <LoadingSpinner></LoadingSpinner>
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
import LoadingSpinner from "./LoadingSpinner.vue";

export default {
  components: {
    RefreshIconOutline,
    LoadingSpinner,
  },
  props: {
    diskInfo: Object,
  },
  setup(props) {
    const currentDisk = inject("currentDisk");
    const wMsg = ref("Click on a disk for more detail.");
    const diskObj = reactive({});
    const lsdevJson = inject("lsdevJson");
    const diskInfo = inject("diskInfo");
    const loadingSpinner = ref(true);

    const updateDiskObj = () => {
      if (!currentDisk.value) return;

      const tmpObj = lsdevJson.rows
        ? lsdevJson.rows
            .flat()
            .filter((slot) => slot.occupied)
            .find((slot) => slot["bay-id"] === currentDisk.value)
        : diskInfo.rows
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
      loadingSpinner.value = lsdevJson.rows ? false : true;
      Object.assign(diskObj, tmpObj);
    };

    watch(currentDisk, updateDiskObj);
    watch(lsdevJson, updateDiskObj); //when lsdev is run again on udev rule trigger

    return {
      wMsg,
      currentDisk,
      diskObj,
      lsdevJson,
      diskInfo,
      loadingSpinner,
    };
  },
};
</script>
