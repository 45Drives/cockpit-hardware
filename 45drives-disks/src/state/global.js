import { ref, watch } from 'vue';

const currentLsdevOutput = ref({});
const currentDisk = ref("DONT GOT NONE..");

watch(currentLsdevOutput, () => {
    console.log("currentLsdevOutput changed");
    console.log(currentLsdevOutput.value);
});

watch(currentDisk, () => {
    console.log("currentDisk changed");
    console.log(currentDisk.value);
});

export default {
    currentDisk,
    currentLsdevOutput
}