<!-- This example requires Tailwind CSS v2.0+ -->
<template>
<div class="card">
  <div
    class="card-header p-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"
  >
    <h3 class="text-lg leading-6 font-semibold">CPU</h3>
    <div class="mt-3 sm:mt-0 sm:ml-4">
        <button type="button" class="card-refresh-btn" @click="getCpuInfo()">
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
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-stone-900 dark:text-stone-200 sm:pl-6">Socket</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200">Model</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200">Max Speed</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200">Current Speed</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200">Temperature</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200 bg-white dark:bg-stone-600 dark:divide-stone-500">
                <tr v-for="cpu in cpus" :key="cpu.socket">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-stone-900 dark:text-stone-300 sm:pl-6">{{ cpu.socket }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400">{{ cpu.model }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400">{{ cpu.maxSpeed }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400">{{ cpu.currentSpeed }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400">{{ cpu.temperature }}</td>
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
    const cpus = ref([
      { socket: 'Loading...', model: 'Loading...', maxSpeed: 'Loading...', currentSpeed: 'Loading...', temperature: 'Loading...' }
    ]);
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const getCpuInfo = async () => {
      cpus.value.length = 0;
      cpus.value.push({ socket: 'Loading...', model: 'Loading...', maxSpeed: 'Loading...', currentSpeed: 'Loading...', temperature: 'Loading...' });
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-system-vue/scripts/cpu_info"],
          {
            err: "out",
            superuser: "require",
            promise: true,
          }
        );
        let cpuInfo = JSON.parse(state.stdout);
        cpus.value.length = 0;
        cpuInfo.cpus.forEach(cpu => {
          cpus.value.push(cpu);
        });
          fatalError.value = false;
          fatalErrorMsg.value.length = 0;
          showFixButton.value = false;
      }catch (error) {
          console.log(error);
          fatalError.value = true;
          fatalErrorMsg.value.length = 0;
          fatalErrorMsg.value.push(error.stderr);
          fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/cpu_info");
          showFixButton.value = false;
        }
    };

    getCpuInfo();

    return {
      cpus,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler,
      getCpuInfo
    }
  },
  components: {
    RefreshIconOutline,
    ErrorMessage
  },
};
</script>