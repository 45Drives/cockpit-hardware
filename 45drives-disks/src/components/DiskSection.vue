<template>
  <div id="diskInfoCard" class="card self-stretch flex-auto flex flex-col">
    <div
      class="card-header"
    >
      <h3 class="text-header text-default">Disk Information</h3>
    </div>
    <div
      id="disk-section-card-body"
      :class="[currentDisk ? '':'grow','card-body flex flex-wrap justify-start']"
    >
      <div
        id="diskInfoTable"
        v-if="currentDisk"
        class="grid grid-cols-2 2xl:grid-cols-3 grid-flow-row-dense grow"
      >
        <div
          v-if="diskObj['bay-id']"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Drive Slot
          </div>
          <div class="text-sm break-words">
            {{ diskObj["bay-id"] }}
          </div>
        </div>
        <div
          v-if="diskObj['dev-by-path']"
          class="grid grid-col-1 self-start col-span-2 py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted col-span-2">
            Device Path (by-path)
          </div>
          <div class="text-sm col-span-2 break-words">
            {{ diskObj["dev-by-path"] }}
          </div>
        </div>
        <div
          v-if="diskObj['disk_type']"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Disk Type
          </div>
          <div class="text-sm break-words">
            {{ diskObj["disk_type"] }}
          </div>
        </div>
        <div v-if="diskObj['dev']" class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
          <div class="text-sm text-muted">
            Device Path (sd)
          </div>
          <div class="text-sm break-words">
            {{ diskObj["dev"] }}
          </div>
        </div>
        <div
          v-if="diskObj['partitions']"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Partition Count
          </div>
          <div class="text-sm break-words">
            {{ diskObj["partitions"] }}
          </div>
        </div>
        <div
          v-if="
            diskObj['model-family'] && !['?'].includes(diskObj['model-family'])
          "
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Model Family
          </div>
          <div class="text-sm break-words">
            {{ diskObj["model-family"] }}
          </div>
        </div>
        <div
          v-if="diskObj['model-name'] && !['?'].includes(diskObj['model-name'])"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Model Name
          </div>
          <div class="text-sm break-words">
            {{ diskObj["model-name"] }}
          </div>
        </div>
        <div
          v-if="diskObj['serial']"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">Serial</div>
          <div class="text-sm break-words">
            {{ diskObj["serial"] }}
          </div>
        </div>
        <div
          v-if="diskObj['capacity']"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">Capacity</div>
          <div class="text-sm break-words">
            {{ diskObj["capacity"] }}
          </div>
        </div>
        <div
          v-if="diskObj['firm-ver'] && !['?'].includes(diskObj['start-stop-count'])"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Firmware Version
          </div>
          <div class="text-sm break-words">
            {{ diskObj["firm-ver"] }}
          </div>
        </div>
        <div
          v-if="diskObj['rotation-rate'] && diskObj['rotation-rate'] != 0"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Rotation Rate
          </div>
          <div class="text-sm break-words">
            {{ diskObj["rotation-rate"] }} RPM
          </div>
        </div>
        <div
          v-if="
            diskObj['start-stop-count'] &&
            !['?'].includes(diskObj['start-stop-count'])
          "
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Start/Stop Count
          </div>
          <div class="text-sm break-words">
            {{ diskObj["start-stop-count"] }}
          </div>
        </div>
        <div
          v-if="
            diskObj['power-cycle-count'] &&
            !['?'].includes(diskObj['power-cycle-count'])
          "
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Power Cycle Count
          </div>
          <div class="text-sm break-words">
            {{ diskObj["power-cycle-count"] }}
          </div>
        </div>
        <div
          v-if="diskObj['temp-c']"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Temperature
          </div>
          <div
            v-if="diskObj['temp-c']"
            class="text-sm break-words"
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
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Current Pending Sector
          </div>
          <div class="text-sm break-words">
            {{ diskObj["current-pending-sector"] }}
          </div>
        </div>
        <div
          v-if="
            diskObj['offline-uncorrectable'] &&
            !['?', 0, '0'].includes(diskObj['offline-uncorrectable'])
          "
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Offline Uncorrectable
          </div>
          <div class="text-sm break-words">
            {{ diskObj["offline-uncorrectable"] }}
          </div>
        </div>
        <div
          v-if="diskObj['power-on-time']"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">
            Power On Time
          </div>
          <div class="text-sm break-words">
            {{ diskObj["power-on-time"] }} h
          </div>
        </div>
        <div
          v-if="diskObj['health']"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2"
        >
          <div class="text-sm text-muted">Health</div>
          <div class="text-sm break-words">
            {{ diskObj["health"] }}
          </div>
        </div>
        <div
          v-if="loadingSpinner"
          class="grid grid-cols-1 self-start py-1 md:py-2 px-2 row-span-2"
        >
          <LoadingSpinner></LoadingSpinner>
        </div>
      </div>
      <div v-else class="grow flex justify-center items-center">
        <div
          class="p-5 bg-accent rounded-lg"
        >
          <span class="text-muted">{{wMsg}}</span>
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

      /*const tmpObj = lsdevJson.rows
        ? lsdevJson.rows
            .flat()
            .filter((slot) => slot.occupied)
            .find((slot) => slot["bay-id"] === currentDisk.value)
        : diskInfo.rows
            .flat()
            .filter((slot) => slot.occupied)
            .find((slot) => slot["bay-id"] === currentDisk.value);
      */
      const tmpObj = lsdevJson.rows
        ? lsdevJson.rows
            .flat()
            .find((slot) => slot["bay-id"] === currentDisk.value)
        : diskInfo.rows
            .flat()
            .find((slot) => slot["bay-id"] === currentDisk.value);

      if (!tmpObj) {
        console.log(
          `Unable to find info for disk in slot "${currentDisk.value}"`
        );
        //currentDisk.value = "";
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