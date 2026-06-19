<template>
<div class="h-full w-full overflow-y-scroll well">
	<div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8 grow gap-well">
		<SectionSystem/>
		<SectionFirmware/>
		<SectionPci/>
		<SectionDrives/>
		<SectionCpu/>
		<SectionRam/>
		<SectionNetwork/>
		<SectionIpmiLan/>
	</div>
</div>
</template>

<script setup>
import SectionSystem from './SectionSystem.vue';
import SectionFirmware from './SectionFirmware.vue';
import SectionCpu from './SectionCpu.vue';
import SectionPci from './SectionPci.vue';
import SectionDrives from './SectionDrives.vue';
import SectionRam from './SectionRam.vue';
import SectionNetwork from './SectionNetwork.vue';
import SectionIpmiLan from './SectionIpmiLan.vue';
</script>