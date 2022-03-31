<template>
  <div class="card mx-2 grow flex flex-col">
    <div
      class="card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"
    >
      <h3 class="text-lg py-1 leading-6 font-semibold">Server</h3>
    </div>
    <div class="card-body dark:bg-stone-700 grow flex">
      <div class="grow flex flex-col items-stretch">
        <div class="mt-0">
          <dl class="sm:divide-y sm:divide-stone-200">
            <div class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4">
              <dt
                class="text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Model
              </dt>
              <dd
                class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-4"
              >
                {{ serverInfo.Model }}
              </dd>
            </div>

            <div class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4">
              <dt
                class="text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Disk Count
              </dt>
              <dd
                class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-4"
              >
                {{ diskCount }}
              </dd>
            </div>

            <div class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4">
              <dt
                class="text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Total Storage
              </dt>
              <dd
                class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-4"
              >
                {{ storageCapacity }} GB
              </dd>
            </div>

            <div v-if="avgTemp!=0" class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4">
              <dt
                class="text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                Disk Temperature (avg)
              </dt>
              <dd
                class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-4"
              >
                {{ avgTemp }} °C / {{ (avgTemp * (9 / 5) + 32).toFixed(2) }} °F
              </dd>
            </div>

            <div
              v-for="card in serverInfo.HBA"
              class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4"
            >
              <dt
                class="text-sm font-medium text-stone-500 dark:text-stone-400"
              >
                HBA{{ card.Ctl + 1 }}
              </dt>
              <div>
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Model
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-1"
                >
                  {{ card.Model }}
                </dd>
              </div>
              <div>
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Controller ID
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-1"
                >
                  {{ card.Ctl }}
                </dd>
              </div>
              <div>
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  PCI Slot
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-1"
                >
                  {{ card["PCI Slot"] }}
                </dd>
              </div>
                            <div>
                <dt
                  class="text-sm font-medium text-stone-500 dark:text-stone-400"
                >
                  Bus Address
                </dt>
                <dd
                  class="mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-1"
                >
                  {{ card["Bus Address"] }}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, inject } from "vue";

export default {
  props: {
    serverInfo: Object,
  },
  setup(props) {
    const lsdevJson = inject("lsdevJson");
    const diskCount = ref(
      lsdevJson.rows.flat().filter((slot) => slot.occupied).length
    );

    const getCapacityGB = (capacityStr) => {
      let coeffLut = {
        "TB": 1000,
        "GB": 1
      };
      return (Number(capacityStr.split(" ")[0]) * coeffLut[capacityStr.split(" ")[1]])
    };

    const storageCapacity = (diskCount.value > 0) ? lsdevJson.rows
        .flat()
        .filter((slot) => slot.occupied)
        .map((disk) => getCapacityGB(disk.capacity))
        .reduce((total, cap) => total + cap)
        .toFixed(2) : 0;

    const avgTemp = (diskCount.value > 0) ? (
        lsdevJson.rows
          .flat()
          .filter((slot) => slot.occupied)
          .map((disk) => Number(disk["temp-c"].replace(/[^0-9]/g, "")))
          .reduce((total, cap) => total + cap) / Number(diskCount.value)
      ).toFixed(2): 0;

    const updateDiskSummary = () => {
      diskCount.value = lsdevJson.rows
        .flat()
        .filter((slot) => slot.occupied).length;
      
      storageCapacity.value = (diskCount.value > 0) ? lsdevJson.rows
        .flat()
        .filter((slot) => slot.occupied)
        .map((disk) => getCapacityGB(disk.capacity))
        .reduce((total, cap) => total + cap)
        .toFixed(2) : 0;

      avgTemp.value = (diskCount.value > 0) ? (
        lsdevJson.rows
          .flat()
          .filter((slot) => slot.occupied)
          .map((disk) => Number(disk["temp-c"].replace(/[^0-9]/g, "")))
          .reduce((total, cap) => total + cap) / Number(diskCount.value)
      ).toFixed(2): 0;
    };

    watch(lsdevJson, updateDiskSummary); //when lsdev is run again on udev rule trigger

    return {
      diskCount,
      storageCapacity,
      avgTemp,
      lsdevJson
    };
  },
};
</script>
