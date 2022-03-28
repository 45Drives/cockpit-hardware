<template>
  <div class="card m-2 flex-auto flex flex-col min-w-[35%]">
    <div
      class="card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"
    >
      <h3 class="text-lg leading-6 font-semibold">Disk Information</h3>
      <!-- <div class="mt-3 sm:mt-0 sm:ml-4"> -->
        <!-- <button type="button" class="card-refresh-btn"> -->
          <!-- <RefreshIconOutline class="h-5 w-5" aria-hidden="true" /> -->
        <!-- </button> -->
      <!-- </div> -->
    </div>
    <div class="card-body dark:bg-stone-700 grow flex flex-col">
      <div v-if="currentDisk">
        <div class="grow flex items-start justify-evenly">
          <div class="m-2 flex flex-col">
            <dl class="sm:divide-y sm:divide-stone-200">
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Drive Slot
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["bay-id"] }}
                </dd>
              </div>
            </dl>
            <dl class="sm:divide-y sm:divide-stone-200">
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Disk Type
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["disk_type"] }}
                </dd>
              </div>
            </dl>
            <dl class="sm:divide-y sm:divide-stone-200">
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Device Path (sd)
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["dev"] }}
                </dd>
              </div>
            </dl>
            <dl class="sm:divide-y sm:divide-stone-200">
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Device Path (by-path)
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["dev-by-path"] }}
                </dd>
              </div>
            </dl>
            <dl class="sm:divide-y sm:divide-stone-200">
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Partition Count
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["partitions"] }}
                </dd>
              </div>
            </dl>
                        <dl
              v-if="
                diskObj['model-family'] &&
                !['?'].includes(diskObj['model-family'])
              "
              class="sm:divide-y sm:divide-stone-200"
            >
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Model Family
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["model-family"] }}
                </dd>
              </div>
            </dl>
            <dl
              v-if="
                diskObj['model-name'] && !['?'].includes(diskObj['model-name'])
              "
              class="sm:divide-y sm:divide-stone-200"
            >
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Model Name
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["model-name"] }}
                </dd>
              </div>
            </dl>
            <dl class="sm:divide-y sm:divide-stone-200">
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Serial
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["serial"] }}
                </dd>
              </div>
            </dl>
          </div>
          <div class="m-2 flex flex-col">
            <dl class="sm:divide-y sm:divide-stone-200">
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Capacity
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["capacity"] }}
                </dd>
              </div>
            </dl>
            <dl
              v-if="diskObj['firm-ver'] && !['?'].includes(diskObj['firm-ver'])"
              class="sm:divide-y sm:divide-stone-200"
            >
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Firmware Version
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["firm-ver"] }}
                </dd>
              </div>
            </dl>
            <dl
              v-if="diskObj['rotation-rate'] != 0"
              class="sm:divide-y sm:divide-stone-200"
            >
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Rotation Rate
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["rotation-rate"] }}
                </dd>
              </div>
            </dl>
            <dl
              v-if="
                diskObj['start-stop-count'] &&
                !['?'].includes(diskObj['start-stop-count'])
              "
              class="sm:divide-y sm:divide-stone-200"
            >
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Start/Stop count
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["start-stop-count"] }}
                </dd>
              </div>
            </dl>
            <dl
              v-if="
                diskObj['power-cycle-count'] &&
                !['?'].includes(diskObj['power-cycle-count'])
              "
              class="sm:divide-y sm:divide-stone-200"
            >
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Power Cycle Count
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["power-cycle-count"] }}
                </dd>
              </div>
            </dl>
            <dl class="sm:divide-y sm:divide-stone-200">
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Temperature
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["temp-c"].replace(/[^0-9]/g, "") }} °C / {{ (diskObj["temp-c"].replace(/[^0-9]/g, "") * (9 / 5) + 32).toFixed(1) }} °F
                </dd>
              </div>
            </dl>
            <dl
              v-if="
                diskObj['current-pending-sector'] &&
                !['?', 0, '0'].includes(diskObj['current-pending-sector'])
              "
              class="sm:divide-y sm:divide-stone-200"
            >
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Current Pending Sector
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["current-pending-sector"] }}
                </dd>
              </div>
            </dl>
            <dl
              v-if="
                diskObj['offline-uncorrectable'] &&
                !['?', 0, '0'].includes(diskObj['offline-uncorrectable'])
              "
              class="sm:divide-y sm:divide-stone-200"
            >
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Offline-Uncorrectable
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["offline-uncorrectable"] }}
                </dd>
              </div>
            </dl>
            <dl class="sm:divide-y sm:divide-stone-200">
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Power On Time
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["power-on-time"] }}
                </dd>
              </div>
            </dl>
            <dl class="sm:divide-y sm:divide-stone-200">
              <div class="py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Health
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
                >
                  {{ diskObj["health"] }}
                </dd>
              </div>
            </dl>
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


    const updateDiskObj = () => {
      if (!currentDisk.value) return;
      const tmpObj = props.diskInfo.rows
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
    watch(props.diskInfo, updateDiskObj); //when lsdev is run again on udev rule trigger

    return {
      wMsg,
      currentDisk,
      diskObj,
    };
  },
};
</script>
