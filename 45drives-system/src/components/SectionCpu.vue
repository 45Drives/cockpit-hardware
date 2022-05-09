<!-- This example requires Tailwind CSS v2.0+ -->
<template>
<div class="card">
  <div
    class="card-header card-header flex flex-row items-center justify-between"
  >
    <h3 class="text-header text-default">CPU</h3>
    <div class="mt-3 sm:mt-0 sm:ml-4">
        <button type="button" class="card-refresh-btn" @click="getCpuInfo()">
          <RefreshIconOutline class="h-5 w-5" aria-hidden="true" />
        </button>
    </div>
  </div>
  <div class="card-body">
    <div v-if="!fatalError" class="mt-2 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-default">
              <thead class="bg-accent">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6">Socket</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Model</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold ">Max Speed</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold ">Current Speed</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold ">Temperature</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default bg-default">
                <tr v-for="cpu in cpus" :key="cpu.socket">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium  sm:pl-6">{{ cpu.socket }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ cpu.model }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ cpu.maxSpeed }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ cpu.currentSpeed }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ cpu.temperature }}</td>
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
import { useSpawn } from "@45drives/cockpit-helpers/src/useSpawn";
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
          ["/usr/share/cockpit/45drives-system/scripts/cpu_info"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
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