<!-- This example requires Tailwind CSS v2.0+ -->
<template>
<div class="card">
  <div
    class="card-header card-header flex flex-row items-center justify-between"
  >
    <h3 class="text-header text-default">IPMI</h3>
    <div class="mt-3 sm:mt-0 sm:ml-4">
        <button type="button" class="card-refresh-btn" @click="getIpmiInfo()">
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
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6">IP Address</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Subnet Mask</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">MAC Address</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold">Default Gateway IP</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr>
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">{{ ipmi.ipAddress }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ ipmi.subnetMask }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ ipmi.macAddress }}</td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-muted">{{ ipmi.defaultGatewayIp }}</td>
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
    const ipmi = ref(
      { ipAddress: 'Loading...', subnetMask: 'Loading...', macAddress: 'Loading...', defaultGatewayIp: 'Loading...' }
    );
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const getIpmiInfo = async () => {
      ipmi.value={ ipAddress: 'Loading...', subnetMask: 'Loading...', macAddress: 'Loading...', defaultGatewayIp: 'Loading...' };
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-system/scripts/ipmi"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let ipmiInfo = JSON.parse(state.stdout);
        ipmi.value = ipmiInfo;
          fatalError.value = false;
          fatalErrorMsg.value.length = 0;
          showFixButton.value = false;
      }catch (error) {
          console.log(error);
          fatalError.value = true;
          fatalErrorMsg.value.length = 0;
          fatalErrorMsg.value.push(error.stderr);
          fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/ipmi");
          showFixButton.value = false;
        }
    };

    getIpmiInfo();

    return {
      ipmi,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler,
      getIpmiInfo
    }
  },
  components: {
    RefreshIconOutline,
    ErrorMessage
  },
};
</script>