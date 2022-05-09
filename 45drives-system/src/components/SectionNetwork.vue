<!-- This example requires Tailwind CSS v2.0+ -->
<template>
<div class="card">
  <div
    class="card-header card-header flex flex-row items-center justify-between"
  >
    <h3 class="text-header text-default">Network</h3>
    <div class="mt-3 sm:mt-0 sm:ml-4">
        <button type="button" class="card-refresh-btn" @click="getNetworkInfo()">
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
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6">Connection Name</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Connection State</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Type</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">MAC</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">IPv4</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">IPv6</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">PCI Slot</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Bus Address</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default bg-default">
                <tr v-for="network in networks" :key="network.connectionName">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">{{ network.connectionName }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ network.connectionState }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ network.connectionType }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ network.mac }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ network.ipv4 }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ network.ipv6 }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ network.pciSlot }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ network.busAddress }}</td>
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
    const networks = ref([
      { connectionName: 'Loading...', connectionState: 'Loading...', connectionType: 'Loading...', mac: 'Loading...', ipv4: 'Loading...', ipv6: 'Loading...', pciSlot: 'Loading...', busAddress: 'Loading...' }
    ]);
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const getNetworkInfo = async () => {
      networks.value.length = 0;
      networks.value.push({ connectionName: 'Loading...', connectionState: 'Loading...', connectionType: 'Loading...', mac: 'Loading...', ipv4: 'Loading...', ipv6: 'Loading...', pciSlot: 'Loading...', busAddress: 'Loading...' });
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-system/scripts/network"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let networkInfo = JSON.parse(state.stdout);
        networks.value.length = 0;
        networkInfo.forEach(network => {
          networks.value.push(network);
        });
          fatalError.value = false;
          fatalErrorMsg.value.length = 0;
          showFixButton.value = false;
      }catch (error) {
          console.log(error);
          fatalError.value = true;
          fatalErrorMsg.value.length = 0;
          fatalErrorMsg.value.push(error.stderr);
          fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/network");
          showFixButton.value = false;
        }
    };

    getNetworkInfo();

    return {
      networks,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler,
      getNetworkInfo
    }
  },
  components: {
    RefreshIconOutline,
    ErrorMessage
  },
};
</script>