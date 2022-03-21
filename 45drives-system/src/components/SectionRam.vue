<!-- This example requires Tailwind CSS v2.0+ -->
<template>
<div class="card">
  <div
    class="card-header p-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"
  >
    <h3 class="text-lg leading-6 font-semibold">RAM</h3>
    <div class="mt-3 sm:mt-0 sm:ml-4">
        <button type="button" class="card-refresh-btn" @click="getRamInfo()">
          <RefreshIconOutline class="h-5 w-5" aria-hidden="true" />
        </button>
    </div>
  </div>
  <div class="card-body dark:bg-stone-700">
    <div v-if="!fatalError" class="mt-2 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-stone-400 dark:divide-stone-600">
              <thead class="bg-stone-50 dark:bg-stone-500">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-stone-900 dark:text-stone-200 sm:pl-6">Locator</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200">Type</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200">Size</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200">Manufacturer</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200">Serial Number</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200">Temperature</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200 bg-white dark:bg-stone-600 dark:divide-stone-500">
                <tr v-for="ram in rams" :key="ram.locator">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-stone-900 dark:text-stone-300 sm:pl-6">{{ ram.locator }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400">{{ ram.type }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400">{{ ram.size }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400">{{ ram.manufacturer }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400">{{ ram.serialNumber }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400">{{ ram.temperature }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div v-if="fatalError">
        <ErrorMessage
          :errorMsg="fatalErrorMsg"
          :FixButton="showFixButton"
          :FixButtonHandler="fixButtonHandler"
        />
      </div>
  </div>
</div>

</template>

<script>
import { RefreshIcon as RefreshIconOutline } from "@heroicons/vue/outline";
import { ref } from "vue";
import useSpawn from "./cockpitSpawn.js";
import ErrorMessage from "./ErrorMessage.vue";

export default {
  setup() {
    const rams = ref([
      { locator: 'Loading...', type: 'Loading...', size: 'Loading...', manufacturer: 'Loading...', serialNumber: 'Loading...', temperature: 'Loading...' }
    ]);
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const getRamInfo = async () => {
      rams.value.length = 0;
      rams.value.push({ locator: 'Loading...', type: 'Loading...', size: 'Loading...', manufacturer: 'Loading...', serialNumber: 'Loading...', temperature: 'Loading...' });
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-system-vue/scripts/ram"],
          {
            err: "out",
            superuser: "require",
            promise: true,
          }
        );
        let ramInfo = JSON.parse(state.stdout);
        console.log(ramInfo);
        rams.value.length = 0;
        ramInfo.forEach(ram => {
          rams.value.push(ram);
        });
          fatalError.value = false;
          fatalErrorMsg.value.length = 0;
          showFixButton.value = false;
      }catch (error) {
          console.log(error);
          fatalError.value = true;
          fatalErrorMsg.value.length = 0;
          fatalErrorMsg.value.push(error.stderr);
          fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/ram");
          showFixButton.value = false;
        }
    };

    getRamInfo();

    return {
      rams,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler,
      getRamInfo
    }
  },
  components: {
    RefreshIconOutline,
    ErrorMessage
  },
};
</script>