 209 lines (205 sloc) 4.28 KB
<template>
<div class="h-full w-full overflow-y-scroll well">
	<div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8 grow gap-well">
		<SectionSystem/>
		<SectionPci/>
		<SectionCpu/>
		<SectionRam/>
		<SectionNetwork/>
		<SectionIpmiLan/>
	</div>
</div>
</template>

<script setup>
import SectionSystem from './SectionSystem.vue';
import SectionCpu from './SectionCpu.vue';
import SectionPci from './SectionPci.vue';
import SectionRam from './SectionRam.vue';
import SectionNetwork from './SectionNetwork.vue';
import SectionIpmiLan from './SectionIpmiLan.vue';
</script>