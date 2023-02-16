<!-- This example requires Tailwind CSS v2.0+ -->
<template>
<div class="card">
  <div
    class="card-header card-header flex flex-row items-center justify-between"
  >
    <h3 class="text-header text-default">PCI</h3>
    <div class="mt-3 sm:mt-0 sm:ml-4">
        <button type="button" class="card-refresh-btn" @click="getPciInfo()">
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
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold  sm:pl-6">Slot</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Type</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Availability</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Bus Address</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Card Type</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Card Model</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Firmware Version</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="pci in pcis" :key="pci.socket">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">{{ pci.slot }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.type }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.availibility }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.busAddress }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.cardType }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.cardModel }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ pci.firmwareVersion }}</td>
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
    const pcis = ref([
      { slot: 'Loading...', type: 'Loading...', availibility: 'Loading...', busAddress: 'Loading...', cardType: 'Loading...', cardModel: 'Loading...', firmwareVersion: 'Loading...' }
    ]);
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const getPciInfo = async () => {
      pcis.value.length = 0;
      pcis.value.push({ slot: 'Loading...', type: 'Loading...', availibility: 'Loading...', busAddress: 'Loading...', cardType: 'Loading...', cardModel: 'Loading...', firmwareVersion: 'Loading...' });
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-system/scripts/pci"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let pciInfo = JSON.parse(state.stdout);
        pcis.value.length = 0;
        pciInfo.forEach(pci => {
          pcis.value.push(pci);
        });
          fatalError.value = false;
          fatalErrorMsg.value.length = 0;
          showFixButton.value = false;
      }catch (error) {
          console.log(error);
          fatalError.value = true;
          fatalErrorMsg.value.length = 0;
          fatalErrorMsg.value.push(error.stderr);
          fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/pci");
          showFixButton.value = false;
        }
    };

    getPciInfo();

    return {
      pcis,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler,
      getPciInfo
    }
  },
  components: {
    RefreshIconOutline,
    ErrorMessage
  },
};
</script>