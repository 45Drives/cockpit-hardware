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
          <dl class="sm:divide-y divide-default divide-y">
            <div class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4 grid grid-cols-2">
              <dt
                class="text-sm font-medium text-muted"
              >
                Model
              </dt>
              <dd
                class="mt-1 text-sm sm:mt-0 sm:col-span-4 col-span-2"
              >
                {{ serverInfo.Model }}
              </dd>
            </div>

            <div class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4 grid grid-cols-2">
              <dt
                class="text-sm font-medium text-muted"
              >
                Disk Count
              </dt>
              <dd
                class="mt-1 text-sm sm:mt-0 sm:col-span-4 col-span-2"
              >
                {{ diskCount }}
              </dd>
            </div>

            <div class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4 grid grid-cols-2">
              <dt
                class="text-sm font-medium text-muted"
              >
                Total Storage
              </dt>
              <dd
                class="mt-1 text-sm sm:mt-0 sm:col-span-4 col-span-2"
              >
                {{ storageCapacityStr }}
              </dd>
            </div>

            <div class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4 grid grid-cols-2">
              <dt
                class="text-sm font-medium text-muted"
              >
                Disk Temperature (avg)
              </dt>
              <dd
                v-if="avgTemp != 0"
                class="mt-1 text-sm sm:mt-0 sm:col-span-4 col-span-2"
              >
                {{ avgTemp }} °C / {{ (avgTemp * (9 / 5) + 32).toFixed(2) }} °F
              </dd>
              <dd
                v-else
                class="mt-1 text-sm sm:mt-0 sm:col-span-4 col-span-2"
              >
                {{ avgTempStr }}
              </dd>
            </div>

            <div
              v-for="card in serverInfo.HBA"
              class="py-2 sm:py-2 sm:grid sm:grid-cols-5 sm:gap-4 grid grid-cols-2 col-span-2"
            >
              <dt
                class="text-sm font-medium text-muted col-span-2 sm:col-span-5"
              >
                HBA{{ card.Ctl + 1 }}
              </dt>
              <div class="col-span-1 sm:col-span-1">
                <dt
                  class="text-sm font-medium text-muted"
                >
                  Model
                </dt>
                <dd
                  class="mt-1 text-sm sm:mt-0 sm:col-span-1 col-span-1"
                >
                  {{ card.Model }}
                </dd>
              </div>
              <div class="col-span-1 sm:col-span-1">
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
              <div class="col-span-1 sm:col-span-1">
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
              <div class="col-span-1 sm:col-span-1">
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
              <div class="col-span-1 sm:col-span-1">
                <dt
                  class="text-sm font-medium text-muted"
                >
                  Firmware Version
                </dt>
                <dd
                  class="mt-1 text-sm sm:mt-0 sm:col-span-1"
                >
                  {{ card["Firmware Version"] || "-" }}
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
import Notifications from "./Notifications.vue";
import { errorStringHTML } from "@45drives/cockpit-helpers";

export default {
  props: {
    serverInfo: Object,
  },
  components: {
    Notifications
  },
  setup(props) {
    const lsdevJson = inject("lsdevJson");
    const diskInfo = inject("diskInfo");
    const notifications = inject("Notifications");
    const diskCount = ref(0);

    if(props.serverInfo.HBA){
      const has_hwraid = props.serverInfo.HBA.filter((card) => (["9361-16i","9361-24i"].includes(card.Model))).length != 0;
      if(has_hwraid){
        notifications.value.constructNotification(
        "Warning:",
        errorStringHTML("Hardware RAID card(s) detected. \nDevice Mapping is subject to change on subsequent reboots. Run 'dmap' and refresh page to ensure reliable device mapping."),
        "warning",
        0);
      }
    }

    const getCapacityGiB = (capacityStr) => {
      const coeffLut = {
        TB: 1024,
        GB: 1,
        GiB: 1,
        TiB: 1024,
      };
      if (!capacityStr || typeof capacityStr !== "string") return 0;
      const [value, unit] = capacityStr.split(" ");
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? 0 : parsedValue * (coeffLut[unit] ?? 0);
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

        // storageCapacity.value =
        //   diskCount.value > 0
        //     ? lsdevJson.rows
        //         .flat()
        //         .filter((slot) => slot.occupied)
        //         .map((disk) => getCapacityGiB(disk.capacity))
        //         .reduce((total, cap) => total + cap)
        //         .toFixed(2)
        //     : 0;
        storageCapacity.value =
          diskCount.value > 0
            ? lsdevJson.rows
              .flat()
              .filter((slot) => slot.occupied)
              .map((disk) => getCapacityGiB(disk.capacity))
              .reduce((total, cap) => total + cap)
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
        
        if(avgTemp.value === 0){
          avgTempStr.value = "No Disks Present";
        }

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
      avgTempStr,
      notifications
    };
  },
};
</script>
