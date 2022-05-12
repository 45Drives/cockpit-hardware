<template>
  <div class="card m-3 grow">
    <div
      class="card-header p-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"
    >
      <h3 class="text-lg leading-6 font-semibold">Debug Section</h3>
    </div>
    <div class="card-body dark:bg-stone-700">
      <div class="mt-3 sm:mt-0 sm:ml-4">
        <button
          type="button"
          @click="runServerInfo()"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          run "server_info"
        </button>
      </div>
      <div v-if="!serverInfoError.errorFlag">
        <div class="w-3/4 m-2">
          <div class="whitespace-pre">
            {{ serverInfo }}
          </div>
        </div>
      </div>
      <div v-if="serverInfoError.errorFlag">
        <ErrorMessage
          :errorMsg="serverInfoError.errorMessage"
          :FixButton="serverInfoError.showFixButton"
          :FixButtonHandler="serverInfoError.fixButtonHandler"
        />
      </div>
      <div class="mt-3 sm:mt-0 sm:ml-4">
        <button
          type="button"
          @click="runLsdev()"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          run "lsdev"
        </button>
      </div>
      <div v-if="!lsdevError.errorFlag" class="mt-2 flex">
        <div class="w-3/4 m-2">
          <div class="whitespace-pre">
            {{ lsdevInfo }}

          </div>
        </div>
      </div>
      <div v-if="lsdevError.errorFlag">
        <ErrorMessage
          :errorMsg="lsdevError.errorMessage"
          :FixButton="lsdevError.showFixButton"
          :FixButtonHandler="lsdevError.fixButtonHandler"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { RefreshIcon as RefreshIconOutline } from "@heroicons/vue/outline";
import { ref, reactive } from "vue";
import ErrorMessage from "./ErrorMessage.vue";
import { useSpawn } from "@45drives/cockpit-helpers";

export default {
  setup() {
    const serverInfo = ref();
    const serverInfoError = reactive({
      errorFlag: false,
      errorMessage: [],
      showFixButton: false,
      fixButtonHandler: () => {
        console.log("Default handler was run for the fix button.");
      },
    });
    const lsdevInfo = ref();
    const lsdevError = reactive({
      errorFlag: false,
      errorMessage: [],
      showFixButton: false,
      fixButtonHandler: () => {
        console.log("Default handler was run for the fix button.");
      },
    });

    console.log(serverInfoError);
    console.log(lsdevError);

    const runServerInfo = async () => {
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-disks/scripts/server_info"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise()
        let result = JSON.parse(state.stdout);
        console.log(result);
        serverInfo.value = state.stdout;
        serverInfoError.errorFlag = false;
        serverInfoError.errorMessage.length = 0;
        serverInfoError.showFixButton = false;
      } catch (error) {
        console.log(error);
        serverInfoError.errorFlag = true;
        serverInfoError.errorMessage.length = 0;
        serverInfoError.errorMessage.push(error.stderr);
        serverInfoError.errorMessage.push(
          "An error occurred when trying to run /usr/share/cockpit/45drives-disks/scripts/server_info"
        );
        serverInfoError.showFixButton = false;
      }
    };

    const runLsdev = async () => {
      try {
        const state = await useSpawn(["/opt/45drives/tools/lsdev", "--json"], {
          err: "out",
          superuser: "require",
        }).promise()
        let result = JSON.parse(state.stdout);
        console.log(result);
        lsdevInfo.value = state.stdout;
        lsdevError.errorFlag = false;
        lsdevError.errorMessage.length = 0;
        lsdevError.showFixButton = false;
      } catch (error) {
        console.log(error);
        lsdevError.errorFlag = true;
        lsdevError.errorMessage.length = 0;
        lsdevError.errorMessage.push(error.stderr);
        lsdevError.errorMessage.push(
          "An error occurred when trying to run /opt/45drives/tools/lsdev"
        );
        lsdevError.showFixButton = false;
      }
    };

    return {
      runServerInfo,
      runLsdev,
      serverInfo,
      serverInfoError,
      lsdevInfo,
      lsdevError,
    };
  },
  components: {
    RefreshIconOutline,
    ErrorMessage,
  },
};
</script>
