<script>
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
import FfdHeader from "./components/FfdHeader.vue";
import P5Canvas from "./components/P5Canvas.vue";
import DebugBox from "./components/DebugBox.vue";
import { ref, reactive, provide } from "vue";
import ServerSection from "./components/ServerSection.vue";
import DiskSection from "./components/DiskSection.vue";
import CanvasSection from "./components/CanvasSection.vue";
import ErrorMessage from "./components/ErrorMessage.vue";
import useSpawn from "./components/cockpitSpawn";

export default {
  name: "App",
  components: {
    P5Canvas,
    FfdHeader,
    DebugBox,
    ServerSection,
    DiskSection,
    CanvasSection,
    ErrorMessage,
  },
  setup() {
    const currentDisk = ref("");
    provide("currentDisk", currentDisk);
    const lsdevState = ref("");
    provide("lsdevState", lsdevState);
    const lsdevJson = reactive({ lsdevDuration: 5 });
    provide("lsdevJson", lsdevJson);

    const delay = (s) => new Promise((res) => setTimeout(res, s * 1000));

    const preloadChecks = reactive({
      serverInfo: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
        fixAvailable: false,
        fixHandler: () => {
          console.log("Default handler was run for the fix button.");
        },
      },
      lsdev: {
        content: reactive({}),
        finished: false,
        failed: false,
        errorMessage: [],
        fixAvailable: false,
        fixHandler: () => {
          console.log("Default handler was run for the fix button.");
        },
      },
    });

    const runServerInfo = async () => {
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-disks-vue/scripts/server_info"],
          {
            err: "out",
            superuser: "require",
            promise: true,
          }
        );
        let result = JSON.parse(state.stdout);
        preloadChecks.serverInfo.content = result;
        preloadChecks.serverInfo.finished = true;
        preloadChecks.serverInfo.failed = false;
        preloadChecks.serverInfo.fixAvailable = false;
      } catch (error) {
        console.log(error);
        preloadChecks.serverInfo.content = null;
        preloadChecks.serverInfo.finished = false;
        preloadChecks.serverInfo.failed = true;
        preloadChecks.serverInfo.fixAvailable = false;
        preloadChecks.serverInfo.errorMessage.length = 0;
        preloadChecks.serverInfo.errorMessage.push(
          "An error occurred when trying to run /usr/share/cockpit/45drives-disks/scripts/server_info"
        );
        preloadChecks.serverInfo.errorMessage.push(error.stderr);
      }
    };

    const runLsdev = async () => {
      try {
        const state = await useSpawn(["/opt/45drives/tools/lsdev", "--json"], {
          err: "out",
          superuser: "require",
          promise: true,
        });
        let result = JSON.parse(state.stdout);
        if (
          !lsdevJson.hasOwnProperty("rows") ||
          result.rows.flat().filter((slot) => slot.occupied).length !=
          lsdevJson.rows.flat().filter((slot) => slot.occupied).length
        ) {
          console.log("result and lsdevJson differed");
          Object.assign(lsdevJson, result);
          preloadChecks.lsdev.content = result;
          preloadChecks.lsdev.finished = true;
          preloadChecks.lsdev.failed = false;
          preloadChecks.lsdev.fixAvailable = false;
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.log(error);
        preloadChecks.lsdev.content = null;
        preloadChecks.lsdev.finished = false;
        preloadChecks.lsdev.failed = true;
        preloadChecks.lsdev.fixAvailable = false;
        preloadChecks.lsdev.errorMessage.length = 0;
        preloadChecks.lsdev.errorMessage.push(
          "An error occurred when trying to run /opt/45drives/tools/lsdev"
        );
        preloadChecks.lsdev.errorMessage.push(error.stderr);
        return false;
      }
    };

    const init = async () => {
      await runServerInfo();
      await runLsdev();
    };

    const retryLsdev = async (duration) => {
      await delay(duration);
      while (await runLsdev()) {
        console.log(`Waited ${duration}s`);
        console.log("running lsdev again.");
        await delay(duration);
      }
    };

    const udevState = cockpit.file(
      "/usr/share/cockpit/45drives-disks-vue/udev/state"
    );
    udevState.watch(async function (content) {
      lsdevState.value = content;
      console.log("udev state updated: ", lsdevState.value);
      // a disk was inserted or removed from system, run lsdev again.
      if (await runLsdev()) {
        console.log('runLsdev resulted in updated information, running retryLsdev');
        retryLsdev(lsdevJson.lsdevDuration.toFixed(2) * 2);
      }
    });

    init();
    return {
      preloadChecks,
      runServerInfo,
      runLsdev,
      udevState,
      lsdevJson,
      retryLsdev,
    };
  },
};
</script>

<template>
  <div id="App">
    <div class="h-screen flex flex-col overflow-hidden">
      <FfdHeader moduleName="Disks" centerName />
      <div class="flex flex-wrap overflow-y-auto">
        <div class="flex p-2 grow flex-wrap">
          <CanvasSection
            v-if="
              preloadChecks.serverInfo.finished && preloadChecks.lsdev.finished
            "
            :serverInfo="preloadChecks.serverInfo.content"
            :diskInfo="preloadChecks.lsdev.content"
          />
          <DiskSection
            v-if="
              preloadChecks.serverInfo.finished && preloadChecks.lsdev.finished
            "
            :diskInfo="preloadChecks.lsdev.content"
          />
        </div>
        <div class="flex p-2 mx-auto grow flex-col items-stretch">
          <ServerSection
            v-if="
              preloadChecks.serverInfo.finished && preloadChecks.lsdev.finished
            "
            :serverInfo="preloadChecks.serverInfo.content"
            :diskInfo="preloadChecks.lsdev.content"
          />
        </div>
      </div>
      <div class="flex-auto flex items-center justify-evenly mt-2 mx-2">
        <div v-if="preloadChecks.serverInfo.failed" class="p-2 m-2">
          <ErrorMessage
            :errorMsg="preloadChecks.serverInfo.errorMessage"
            :FixButton="preloadChecks.serverInfo.fixAvailable"
            :FixButtonHandler="preloadChecks.serverInfo.fixHandler"
          />
        </div>
        <div v-if="preloadChecks.lsdev.failed" class="p-2 m-2">
          <ErrorMessage
            :errorMsg="preloadChecks.lsdev.errorMessage"
            :FixButton="preloadChecks.lsdev.fixAvailable"
            :FixButtonHandler="preloadChecks.lsdev.fixHandler"
          />
        </div>
      </div>
      <!-- <div class="flex-auto flex"> -->
      <!-- <DebugBox></DebugBox> -->
      <!-- </div> -->
    </div>
  </div>
</template>

<style>
#app {
  font-family: "Red Hat Text";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  @apply bg-white dark:bg-stone-800 h-full;
}
</style>
