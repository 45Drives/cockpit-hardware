<template>
	<div id="diskInfoCard" class="card self-stretch flex-auto flex flex-col">
		<div class="card-header">
			<h3 class="text-header text-default">Disk Information</h3>
		</div>
		<div id="disk-section-card-body" :class="[currentDisk ? '':'grow','card-body flex flex-wrap justify-start']">
			<div id="diskInfoTable" v-if="currentDisk"
				class="grid grid-cols-2 2xl:grid-cols-3 grid-flow-row-dense grow">
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Drive Slot
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['bay-id']">{{ diskObj['bay-id'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-col-1 self-start col-span-2 py-1 md:py-2 px-2">
					<div class="text-sm text-muted col-span-2">
						Device Path (by-path)
					</div>
					<div class="text-sm col-span-2 break-words">
						<span v-if="diskObj['dev-by-path']">{{ diskObj['dev-by-path'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Disk Type
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['disk_type']">{{ diskObj['disk_type'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Device Path (sd)
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['dev']">{{ diskObj['dev'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Partition Count
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['partitions']">{{ diskObj['partitions'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Model Family
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['model-family'] && !['?'].includes(diskObj['model-family'])">{{
							diskObj['model-family'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Model Name
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['model-name'] && !['?'].includes(diskObj['model-name'])">{{
							diskObj['model-name'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Serial
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['serial']">{{ diskObj['serial'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Capacity
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['capacity']">{{ diskObj['capacity'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Firmware Version
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['firm-ver'] && !['?'].includes(diskObj['firm-ver'])">{{ diskObj['firm-ver']
							}}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Rotation Rate
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['rotation-rate'] && diskObj['rotation-rate'] != 0">{{
							diskObj['rotation-rate'] }} RPM</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Start/Stop Count
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['start-stop-count'] && !['?'].includes(diskObj['start-stop-count'])">{{
							diskObj['start-stop-count'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Power Cycle Count
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['power-cycle-count'] && !['?'].includes(diskObj['power-cycle-count'])">{{
							diskObj['power-cycle-count'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Temperature
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['temp-c']">
							{{ diskObj["temp-c"]?.replace(/[^0-9]/g, "") }} °C /
							{{
								(
									diskObj["temp-c"]?.replace(/[^0-9]/g, "") * (9 / 5) + 32
								).toFixed(1)
							}}
							°F
						</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">
						Power On Time
					</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['power-on-time']">{{ diskObj['power-on-time'] }} h</span>
						<span v-else>N/A</span>
					</div>
				</div>
				<div class="grid grid-cols-1 self-start py-1 md:py-2 px-2">
					<div class="text-sm text-muted">Health</div>
					<div class="text-sm break-words">
						<span v-if="diskObj['health']">{{ diskObj['health'] }}</span>
						<span v-else>N/A</span>
					</div>
				</div>

				<div v-if="loadingSpinner" class="grid grid-cols-1 self-center py-1 md:py-2 px-2 row-span-2">
					<LoadingSpinner></LoadingSpinner>
				</div>
			</div>
			<div v-else class="grow flex justify-center items-center">
				<div class="p-5 bg-accent rounded-lg">
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
    // console.log('disks info:', diskInfo)
    // console.log('lsDev info:', lsdevJson)
    const updateDiskObj = () => {
      if (!currentDisk.value) return;
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