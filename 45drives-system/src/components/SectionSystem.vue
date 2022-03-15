<!-- This example requires Tailwind CSS v2.0+ -->
<template>
  <div class="card">
    <div
      class="card-header p-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between"
    >
      <h3 class="text-lg leading-6 font-semibold">System</h3>
      <div class="mt-3 sm:mt-0 sm:ml-4">
        <button type="button" class="card-refresh-btn" @click="getSystemInfo()">
          <RefreshIconOutline class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div class="flex flex-row justify-evenly">
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="border-b border-gray-200">
            <dl>
              <div
                class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium text-gray-500">Model</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{sysModel}}
                </dd>
              </div>
              <div
                class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium text-gray-500">Chassis Size</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{sysChassis}}
                </dd>
              </div>
              <div
                class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium text-gray-500">Serial</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{sysSerial}}
                </dd>
              </div>
              <div
                class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium text-gray-500">Motherboard</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{moboModel}}
                </dd>
              </div>
              <div
                class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt class="text-sm font-medium text-gray-500">
                  Motherboard Serial
                </dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{moboSerial}}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <img
          src="storinatorQ30.jpg"
          class="object-contain h-72 rounded-none justify-self-center"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { RefreshIcon as RefreshIconOutline } from "@heroicons/vue/outline";
import { ref } from 'vue';
export default {
  components: {
    RefreshIconOutline,
  },
  setup(){
    const sysModel = ref("sysModel");
    const sysChassis = ref("sysChassis");
    const sysSerial = ref("sysSerial");
    const moboModel = ref("moboModel");
    const moboSerial = ref("moboSerial");
    
    const getSystemInfo = () => {
      sysModel.value = "SYSMODEL";
      sysChassis.value = "SYSCHASSIS"
      sysSerial.value = "SYSSERIAL";
      moboModel.value = "MOBOMODEL";
      moboSerial.value = "MOBOSERIAL";
    };

    return {
      sysModel,
      sysChassis,
      sysSerial,
      moboModel,
      moboSerial,
      getSystemInfo
    }
  }
};
</script>
