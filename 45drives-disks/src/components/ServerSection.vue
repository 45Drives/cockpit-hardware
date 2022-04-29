<template>
  <div class="card grow flex flex-col">
    <div
      class="card-header"
    >
      <h3 class="text-header text-default">Server</h3>
    </div>
    <div class="card-body grow flex">
      <div class="grow flex flex-col items-stretch">
        <div class="mt-0">
          <dl class="sm:divide-y divide-default">
            <div class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4">
              <dt
                class="text-sm font-medium text-muted"
              >
                Model
              </dt>
              <dd
                class="mt-1 text-sm sm:mt-0 sm:col-span-4"
              >
                {{ serverInfo.Model }}
              </dd>
            </div>

            <div class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4">
              <dt
                class="text-sm font-medium text-muted"
              >
                Disk Count
              </dt>
              <dd
                class="mt-1 text-sm sm:mt-0 sm:col-span-4"
              >
                {{ diskCount }}
              </dd>
            </div>

            <div class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4">
              <dt
                class="text-sm font-medium text-muted"
              >
                Total Storage
              </dt>
              <dd
                class="mt-1 text-sm sm:mt-0 sm:col-span-4"
              >
                {{ storageCapacityStr }}
              </dd>
            </div>

            <div class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4">
              <dt
                class="text-sm font-medium text-muted"
              >
                Disk Temperature (avg)
              </dt>
              <dd
                v-if="avgTemp != 0"
                class="mt-1 text-sm sm:mt-0 sm:col-span-4"
              >
                {{ avgTemp }} °C / {{ (avgTemp * (9 / 5) + 32).toFixed(2) }} °F
              </dd>
              <dd
                v-else
                class="mt-1 text-sm sm:mt-0 sm:col-span-4"
              >
                {{ avgTempStr }}
              </dd>
            </div>

            <div
              v-for="card in serverInfo.HBA"
              class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4"
            >
              <dt
                class="text-sm font-medium text-muted"
              >
                HBA{{ card.Ctl + 1 }}
              </dt>
              <div>
                <dt
                  class="text-sm font-medium text-muted"
                >
                  Model
                </dt>
                <dd
                  class="mt-1 text-sm sm:mt-0 sm:col-span-1"
                >
                  {{ card.Model }}
                </dd>
              </div>
              <div>
                <dt
                  class="text-sm font-medium text-muted"
                >
                  Controller ID
                </dt>
                <dd
                  class="mt-1 text-sm sm:mt-0 sm:col-span-1"
                >
                  {{ card.Ctl }}
                </dd>
              </div>
              <div>
                <dt
                  class="text-sm font-medium text-muted"
                >
                  PCI Slot
                </dt>
                <dd
                  class="mt-1 text-sm sm:mt-0 sm:col-span-1"
                >
                  {{ card["PCI Slot"] }}
                </dd>
              </div>
              <div>
                <dt
                  class="text-sm font-medium text-muted"
                >
                  Bus Address
                </dt>
                <dd
                  class="mt-1 text-sm sm:mt-0 sm:col-span-1"
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
    const diskInfo = inject("diskInfo");
    const diskCount = ref(0);

    const getCapacityGB = (capacityStr) => {
      let coeffLut = {
        TB: 1000,
        GB: 1,
      };
      if (!capacityStr) return 0;
      return (
        Number(capacityStr.split(" ")[0]) * coeffLut[capacityStr.split(" ")[1]]
      );
    };

    const storageCapacity = ref(0);
    const storageCapacityStr = ref("Loading ...");
    const avgTemp = ref(0);
    const avgTempStr = ref("Loading...");

    const updateDiskSummary = () => {
      if (lsdevJson.rows) {
        diskCount.value = lsdevJson.rows
          .flat()
          .filter((slot) => slot.occupied).length;

        storageCapacity.value =
          diskCount.value > 0
            ? lsdevJson.rows
                .flat()
                .filter((slot) => slot.occupied)
                .map((disk) => getCapacityGB(disk.capacity))
                .reduce((total, cap) => total + cap)
                .toFixed(2)
            : 0;

        storageCapacityStr.value =
          storageCapacity.value > 1000
            ? (storageCapacity.value / 1000).toFixed(2).toString() + " TB"
            : storageCapacity.value.toString() + " GB";

        avgTemp.value =
          diskCount.value > 0
            ? (
                lsdevJson.rows
                  .flat()
                  .filter((slot) => slot.occupied)
                  .map((disk) =>
                    Number(disk["temp-c"]?.replace(/[^0-9]/g, "") ?? 0)
                  )
                  .reduce((total, cap) => total + cap) / Number(diskCount.value)
              ).toFixed(2)
            : 0;
      }
    };

    watch(lsdevJson, updateDiskSummary); //when lsdev is run again on udev rule trigger

    return {
      diskCount,
      storageCapacity,
      storageCapacityStr,
      avgTemp,
      lsdevJson,
      diskInfo,
      avgTempStr
    };
  },
};
</script>
