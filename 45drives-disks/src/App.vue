<script>
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
import FfdHeader from "./components/FfdHeader.vue";
import DebugBox from "./components/DebugBox.vue";
import { ref, reactive, provide } from "vue";
import ServerSection from "./components/ServerSection.vue";
import DiskSection from "./components/DiskSection.vue";
import CanvasSection from "./components/CanvasSection.vue";
import ErrorMessage from "./components/ErrorMessage.vue";
import { useSpawn } from "@45drives/cockpit-helpers/useSpawn";
import ZfsSection from "./components/ZfsSection.vue";

export default {
  name: "App",
  components: {
    FfdHeader,
    DebugBox,
    ServerSection,
    DiskSection,
    CanvasSection,
    ErrorMessage,
    ZfsSection,
  },
  setup() {
    const currentDisk = ref("");
    provide("currentDisk", currentDisk);
    const lsdevState = ref("");
    provide("lsdevState", lsdevState);
    const lsdevJson = reactive({ lsdevDuration: 5 });
    provide("lsdevJson", lsdevJson);
    const diskInfo = reactive({ lsdevDuration: 5 });
    provide("diskInfo", diskInfo);
    const zfsInfo = reactive({});
    provide("zfsInfo", zfsInfo);
    const enableZfsAnimations = reactive({ flag: true });
    provide("enableZfsAnimations", enableZfsAnimations);
    const pageLayout = ref("AZ");
    provide("pageLayout", pageLayout);

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
      zfs: {
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

    const setPageLayout = () => {
      if (preloadChecks.zfs.failed) {
        // no zfs
        if (!preloadChecks.serverInfo.failed) {
          // server info is available.
          switch (preloadChecks.serverInfo.content["Chassis Size"]) {
            case "2U":
              pageLayout.value = "A";
              break;
            case "AV15":
              pageLayout.value = "B";
              break;
            case "C8":
              pageLayout.value = "A";
              break;
            case "MI4":
              pageLayout.value = "A";
              break;
            case "Q30":
              pageLayout.value = "B";
              break;
            case "S45":
              pageLayout.value = "B";
              break;
            case "XL60":
              pageLayout.value = "C";
              break;
            default:
              console.log("UNKNOWN CHASSIS SIZE");
          }
        }
      } else {
        //zfs info needs to be displayed
        if (!preloadChecks.serverInfo.failed) {
          // server info is available.
          switch (preloadChecks.serverInfo.content["Chassis Size"]) {
            case "2U":
              pageLayout.value = "AZ";
              break;
            case "AV15":
              pageLayout.value = "BZ";
              break;
            case "C8":
              pageLayout.value = "AZ";
              break;
            case "MI4":
              pageLayout.value = "AZ";
              break;
            case "Q30":
              pageLayout.value = "BZ";
              break;
            case "S45":
              pageLayout.value = "BZ";
              break;
            case "XL60":
              pageLayout.value = "CZ";
              break;
            default:
              console.log("UNKNOWN CHASSIS SIZE");
          }
        }
      }
    };

    const runServerInfo = async () => {
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-disks/scripts/server_info"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
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
        preloadChecks.serverInfo.errorMessage.push(error.stdout);
      }
    };

    const runLsdev = async () => {
      try {
        const state = await useSpawn(["/opt/45drives/tools/lsdev", "--json"], {
          err: "out",
          superuser: "require",
        }).promise();
        let result = JSON.parse(state.stdout);
        if (
          !lsdevJson["rows"] ||
          result.rows.flat().filter((slot) => slot.occupied).length !=
            lsdevJson.rows.flat().filter((slot) => slot.occupied).length
        ) {
          Object.assign(lsdevJson, result);
          preloadChecks.lsdev.content = lsdevJson;
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
        preloadChecks.lsdev.errorMessage.push(error.stdout);
        return false;
      }
    };

    const runDiskInfo = async () => {
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-disks/scripts/disk_info"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(diskInfo, result);
        preloadChecks.lsdev.content = result;
        preloadChecks.lsdev.finished = true;
        preloadChecks.lsdev.failed = false;
        preloadChecks.lsdev.fixAvailable = false;
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    };

    const runZfsInfo = async () => {
      try {
        const state = await useSpawn(
          ["/usr/share/cockpit/45drives-disks/scripts/zfs_info"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        let result = JSON.parse(state.stdout);
        Object.assign(zfsInfo, result);
        preloadChecks.zfs.content = result;
        preloadChecks.zfs.finished = true;
        preloadChecks.zfs.failed = !result?.zfs_installed;
        preloadChecks.zfs.fixAvailable = false;
      } catch (error) {
        console.log(error);
      }
    };

    const init = async () => {
      await runServerInfo();
      await runDiskInfo();
      await runZfsInfo();
      setPageLayout();
      runLsdev();
    };

    const retryLsdev = async (duration) => {
      await delay(duration);
      while (await runLsdev()) {
        await delay(duration);
      }
      await runZfsInfo();
    };

    let watchInitiated = false;

    const udevState = cockpit
      .file("/usr/share/cockpit/45drives-disks/udev/state")
      .watch(async (content) => {
        if (watchInitiated) {
          lsdevState.value = content;
          // a disk was inserted or removed from system, run lsdev again.
          if (await runLsdev()) {
            retryLsdev((lsdevJson.lsdevDuration?.toFixed(2) ?? 5) * 2);
          }
        } else {
          watchInitiated = true;
        }
      });

    init();
    return {
      preloadChecks,
      runServerInfo,
      runLsdev,
      lsdevJson,
      retryLsdev,
      diskInfo,
      zfsInfo,
      enableZfsAnimations,
      pageLayout,
    };
  },
};
</script>

<template>
  <div id="App" class="flex flex-col h-full">
    <FfdHeader moduleName="Disks" centerName />
    <div class="grow flex flex-col well overflow-y-auto p-4">
      <div class="gap-well grid grid-cols-6">
        <div
          :class="[
            pageLayout === 'AZ' ? 'lg:col-span-6' : '',
            pageLayout === 'BZ' ? 'xl:col-span-3 2xl:col-span-2' : '',
            pageLayout === 'CZ' ? 'xl:col-span-4 2xl:col-span-3' : '',
            pageLayout === 'A' ? 'lg:col-span-6' : '',
            pageLayout === 'B' ? 'xl:col-span-3 2xl:col-span-2' : '',
            pageLayout === 'C' ? 'xl:col-span-4 2xl:col-span-3' : '',
            'grow grid gap-well col-span-6',
          ]"
        >
          <div class="flex flex-col gap-well grow flex-wrap">
            <CanvasSection
              v-if="
                preloadChecks.serverInfo.finished &&
                preloadChecks.lsdev.finished
              "
              :serverInfo="preloadChecks.serverInfo.content"
            />
          </div>
        </div>

        <div
          v-if="
            preloadChecks.serverInfo.finished && preloadChecks.lsdev.finished
          "
          :class="[
            pageLayout === 'AZ' ? 'lg:col-span-3' : '',
            pageLayout === 'BZ' ? 'xl:col-span-3 2xl:col-span-4' : '',
            pageLayout === 'CZ' ? 'xl:col-span-2 2xl:col-span-3' : '',
            pageLayout === 'A' ? 'lg:col-span-2' : '',
            pageLayout === 'B' ? 'xl:col-span-3 2xl:col-span-4' : '',
            pageLayout === 'C' ? 'xl:col-span-2 2xl:col-span-3' : '',
            'grow grid gap-well col-span-6',
          ]"
        >
          <DiskSection
            v-if="
              preloadChecks.serverInfo.finished && preloadChecks.lsdev.finished
            "
          />
        </div>

        <div
          v-if="preloadChecks.zfs.finished && !preloadChecks.zfs.failed"
          :class="[
            pageLayout === 'AZ' ? 'lg:col-span-3' : '',
            pageLayout === 'BZ' ? 'lg:col-span-6' : '',
            pageLayout === 'CZ' ? 'lg:col-span-6' : '',
            'grow grid gap-well col-span-6',
          ]"
        >
          <ZfsSection
            v-if="preloadChecks.zfs.finished && !preloadChecks.zfs.failed"
          />
        </div>

        <div class="flex grow flex-col items-stretch gap-well col-span-6">
          <ServerSection
            v-if="
              preloadChecks.serverInfo.finished && preloadChecks.lsdev.finished
            "
            :serverInfo="preloadChecks.serverInfo.content"
          />
        </div>
      </div>
      <div class="flex-auto flex items-center justify-evenly mx-2">
        <div
          v-if="
            !preloadChecks.serverInfo.finished || !preloadChecks.lsdev.finished
          "
        >
          Gathering disk information. Please wait...
        </div>
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
    </div>
  </div>
</template>

<style>
@import "@45drives/cockpit-css/src/index.css";
#app {
  /*font-family: "Red Hat Text";*/
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  @apply bg-default h-full text-default;
}
</style>
