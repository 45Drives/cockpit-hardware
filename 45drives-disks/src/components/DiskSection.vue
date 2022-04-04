<template>
  <div class="card m-2 flex-auto flex flex-col min-w-[35%]">
    <div
      class="card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"
    >
      <h3 class="text-lg leading-6 font-semibold">Disk Information</h3>
    </div>
    <div class="card-body dark:bg-stone-700 grow flex flex-col justify-center">
      <div v-if="currentDisk" class="grow flex justify-evenly">
        <table class="table-auto">
          <tbody class="divide-y divide-stone-200 dark:divide-stone-600">
            <tr>
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Drive Slot
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["bay-id"] }}
              </td>
            </tr>
            <tr>
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Disk Type
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["disk_type"] }}
              </td>
            </tr>
            <tr>
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Device Path (sd)
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["dev"] }}
              </td>
            </tr>
            <tr>
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Device Path (by-path)
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["dev-by-path"] }}
              </td>
            </tr>
            <tr>
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Partition Count
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["partitions"] }}
              </td>
            </tr>
            <tr
              v-if="
                diskObj['model-family'] &&
                !['?'].includes(diskObj['model-family'])
              "
            >
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Model Family
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["model-family"] }}
              </td>
            </tr>
            <tr
              v-if="
                diskObj['model-name'] && !['?'].includes(diskObj['model-name'])
              "
            >
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Model Name
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["model-name"] }}
              </td>
            </tr>
            <tr>
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Serial
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["serial"] }}
              </td>
            </tr>
          </tbody>
        </table>
        <table class="table-auto">
          <tbody class="divide-y divide-stone-200 dark:divide-stone-600">
            <tr>
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Capacity
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["capacity"] }}
              </td>
            </tr>
            <tr
              v-if="diskObj['firm-ver'] && !['?'].includes(diskObj['firm-ver'])"
            >
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Firmware Version
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["firm-ver"] }}
              </td>
            </tr>
            <tr v-if="diskObj['rotation-rate'] != 0">
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Rotation Rate (rpm)
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["rotation-rate"] }}
              </td>
            </tr>
            <tr
              v-if="
                diskObj['start-stop-count'] &&
                !['?'].includes(diskObj['start-stop-count'])
              "
            >
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Start/Stop Count
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["start-stop-count"] }}
              </td>
            </tr>
            <tr
              v-if="
                diskObj['power-cycle-count'] &&
                !['?'].includes(diskObj['power-cycle-count'])
              "
            >
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Power Cycle Count
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["power-cycle-count"] }}
              </td>
            </tr>
            <tr>
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Temperature
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["temp-c"].replace(/[^0-9]/g, "") }} °C /
                {{
                  (
                    diskObj["temp-c"].replace(/[^0-9]/g, "") * (9 / 5) +
                    32
                  ).toFixed(1)
                }}
                °F
              </td>
            </tr>
            <tr
              v-if="
                diskObj['current-pending-sector'] &&
                !['?', 0, '0'].includes(diskObj['current-pending-sector'])
              "
            >
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Current Pending Sector
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["current-pending-sector"] }}
              </td>
            </tr>
            <tr
              v-if="
                diskObj['offline-uncorrectable'] &&
                !['?', 0, '0'].includes(diskObj['offline-uncorrectable'])
              "
            >
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Offline Uncorrectable
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["offline-uncorrectable"] }}
              </td>
            </tr>
            <tr>
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Power On Time (h)
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["power-on-time"] }}
              </td>
            </tr>
            <tr>
              <td
                class="p-1 text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Health (smartctl)
              </td>
              <td
                class="p-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"
              >
                {{ diskObj["health"] }}
              </td>
            </tr>
          </tbody>
        </table>
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
