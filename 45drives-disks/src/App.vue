<script>
import "@fontsource/red-hat-text/600.css";
import "@fontsource/red-hat-text/400.css";
import FfdHeader from "./components/FfdHeader.vue";
import DebugBox from "./components/DebugBox.vue";
import { ref, reactive, provide, inject, onMounted } from "vue";
import ServerSection from "./components/ServerSection.vue";
import DiskSection from "./components/DiskSection.vue";
import CanvasSection from "./components/CanvasSection.vue";
import ErrorMessage from "./components/ErrorMessage.vue";
import {
  useSpawn,
  errorString,
  errorStringHTML,
  FIFO,
} from "@45drives/cockpit-helpers";
import ZfsSection from "./components/ZfsSection.vue";
import Notifications from "./components/Notifications.vue";

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
    Notifications,
  },
  props: { notificationFIFO: FIFO },
  setup(props) {
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

    const notifications = ref();
    provide("Notifications", notifications);

    const delay = (s) => new Promise((res) => setTimeout(res, s * 1000));

    let watchInitiated = false;

    const adminFlag = ref(false);
    const adminCheck = ref(false);

    const preloadChecks = reactive({
      serverInfo: {
        content: reactive({}),
        finished: false,
        failed: false,
      },
      lsdev: {
        content: reactive({}),
        finished: false,
        failed: false,
      },
      diskInfo: {
        content: reactive({}),
        finished: false,
        failed: false,
      },
      zfs: {
        content: reactive({}),
        finished: false,
        failed: false,
      },
      pageStatus: {
        ready: false
      }
    });

    const runDmap = async () => {
      preloadChecks.serverInfo.finished = false;
      preloadChecks.diskInfo.finished = false;
      try {
        const state = await useSpawn(["/opt/45drives/tools/dmap"], {
          err: "out",
          superuser: "require",
        }).promise();
        init();
      } catch (error) {
        preloadChecks.serverInfo.finished = true;
        preloadChecks.diskInfo.finished = true;
        notifications.value.constructNotification(
          "Error running dmap",
          errorStringHTML(error.stdout),
          "error",
          0
        );
        return false;
      }
    };

    const runServerIdentifier = async () => {
      try {
        const state = await useSpawn(
          ["/opt/45drives/tools/server_identifier"],
          {
            err: "out",
            superuser: "require",
          }
        ).promise();
        return await runServerInfo();
      } catch (error) {
        console.log(error);
        notifications.value.constructNotification(
          "Error running server_identifier",
          errorStringHTML(error.stdout),
          "error",
          0
        );
        return false;
      }
    };

    const setPageLayout = () => {
      if (preloadChecks.zfs.finished && preloadChecks.zfs.failed) {
        // no zfs
        if (!preloadChecks.serverInfo.failed) {
          // server info is available.
          switch (preloadChecks.serverInfo.content["Chassis Size"]) {
            case "F8X1":
              pageLayout.value = "B";
              break;
            case "F8X2":
              pageLayout.value = "B";
              break;
            case "F8X3":
              pageLayout.value = "B";
              break;
            case "2U":
              pageLayout.value = "A";
              break;
            case "F2":
              pageLayout.value = "A";
              break;
            case "VM2":
              pageLayout.value = "C";
              break;
            case "VM8":
              pageLayout.value = "B";
              break;
            case "VM16":
              pageLayout.value = "A";
              break;
            case "VM32":
              pageLayout.value = "A";
              break;
            case "AV15":
              pageLayout.value = "B";
              break;
            case "HL4":
              pageLayout.value = "B";
              break;
            case "HL8":
              pageLayout.value = "B";
              break;
            case "HL15":
              pageLayout.value = "B";
              break;
            case "PRO4":
              pageLayout.value = "B";
              break;
            case "PRO8":
              pageLayout.value = "B";
              break;
            case "PRO15":
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
            case "F16":
              pageLayout.value = "A";
              break;
            case "STUDIO8":
              pageLayout.value = "A";
              break;
            case "HL15_BEAST":
              pageLayout.value = "B";
              break;
            default:
              console.log("UNKNOWN CHASSIS SIZE");
          }
        }
        preloadChecks.pageStatus.ready = true
      } else {
        //zfs info needs to be displayed
        if (preloadChecks.zfs.finished && !preloadChecks.serverInfo.failed) {
          // server info is available.
          switch (preloadChecks.serverInfo.content["Chassis Size"]) {
            case "F8X1":
              pageLayout.value = "BZ";
              break;
            case "F8X2":
              pageLayout.value = "BZ";
              break;
            case "F8X3":
              pageLayout.value = "BZ";
              break;              
            case "2U":
              pageLayout.value = "AZ";
              break;       
            case "F2":
              pageLayout.value = "AZ";
              break;      
            case "VM2":
              pageLayout.value = "CZ";
              break;          
            case "VM8":
              pageLayout.value = "BZ";
              break;
            case "VM16":
              pageLayout.value = "AZ";
              break;
            case "VM32":
              pageLayout.value = "AZ";
              break;
            case "AV15":
              pageLayout.value = "BZ";
              break;
            case "HL4":
              pageLayout.value = "BZ";
              break; 
            case "HL8":
              pageLayout.value = "BZ";
              break;
            case "HL15":
              pageLayout.value = "BZ";
              break;
            case "PRO4":
              pageLayout.value = "BZ";
              break;
            case "PRO8":
              pageLayout.value = "BZ";
              break;
            case "PRO15":
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
            case "F16":
              pageLayout.value = "AZ";
              break;  
            case "STUDIO8":
              pageLayout.value = "AZ";
              break;
            case "HL15_BEAST":
              pageLayout.value = "BZ";
              break;
            default:
              console.log("UNKNOWN CHASSIS SIZE");
          }
        }
        preloadChecks.pageStatus.ready = true
      }
    };

    let serverInfoFailNotification = null;
    const runServerInfo = async () => {
      preloadChecks.serverInfo.finished = false;
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
      } catch (error) {
        console.log(error);
        preloadChecks.serverInfo.content = null;
        preloadChecks.serverInfo.finished = true;
        preloadChecks.serverInfo.failed = true;
        if (
          error.stdout &&
          error.stdout.includes(
            "/etc/45drives/server_info/server_info.json not found."
          )
        ) {
          serverInfoFailNotification = notifications.value
            .constructNotification(
              "Error obtaining server model information",
              errorStringHTML(error.stdout),
              "error",
              30000
            )
            .addAction("fix", () => runServerIdentifier());
        }
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
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.log(error);
        preloadChecks.lsdev.content = null;
        preloadChecks.lsdev.finished = true;
        preloadChecks.lsdev.failed = true;
        notifications.value.constructNotification(
          "Error obtaining disk information",
          errorStringHTML(error.stdout),
          "error",
          0
        );
        return false;
      }
    };

    const runDiskInfo = async () => {
      preloadChecks.lsdev.finished = false;
      preloadChecks.diskInfo.finished = false;
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
        preloadChecks.diskInfo.content = result;
        preloadChecks.diskInfo.finished = true;
        preloadChecks.diskInfo.failed = false;
        return true;
      } catch (error) {
        console.log(error);
        preloadChecks.diskInfo.content = null;
        preloadChecks.diskInfo.failed = true;
        preloadChecks.diskInfo.finished = true;
        if (
          error.stdout &&
          error.stdout.includes("Error opening /etc/vdev_id.conf. Run `dmap`.")
        ) {
          notifications.value
            .constructNotification(
              "Error obtaining disk information",
              errorStringHTML(error.stdout),
              "error",
              0
            )
            .addAction("fix", () => {
              if (serverInfoFailNotification)
                serverInfoFailNotification.show = false;
              runDmap();
            });
        } else {
          notifications.value.constructNotification(
            "Error obtaining disk information",
            errorStringHTML(error.stdout),
            "error"
          );
          return false;
        }
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
        if (result.warnings && result.warnings.length > 0){
          notifications.value.constructNotification(
          "Warning:",
          errorStringHTML(result.warnings.join("")),
          "warning",
          0
        );
        }
        preloadChecks.zfs.content = result;
        preloadChecks.zfs.finished = true;
        preloadChecks.zfs.failed = !result?.zfs_installed;
      } catch (error) {
        console.log(error);
        preloadChecks.zfs.content = null;
        preloadChecks.zfs.finished = true;
        preloadChecks.zfs.failed = true;
        notifications.value.constructNotification(
          "Unable to gather zfs information",
          errorStringHTML(error.stdout),
          "warning",
          0
        );
        return false;
      }
    };

    const init = async () => {
      await runServerInfo();
      await runDiskInfo();
      await runZfsInfo();
      if (!preloadChecks.diskInfo.failed && !preloadChecks.serverInfo.failed && preloadChecks.zfs.finished) {
        setPageLayout();
        runLsdev();
      }
    };

    const retryLsdev = async (duration) => {
      await delay(duration);
      while (await runLsdev()) {
        await delay(duration);
      }
      await runZfsInfo();
    };

    const rootCheck = async () => {
      let root_check = cockpit.permission({ admin: true });
      root_check.addEventListener("changed", () => {
        if (root_check.allowed) {
          //user is an administrator, start the module as normal
          //setup on-click listeners for buttons as required.
          adminCheck.value = true;
          adminFlag.value = true;
          init();
        } else {
          //user is not an administrator, block the page content.
          adminCheck.value = true;
          adminFlag.value = false;
        }
      });
    };

    let udevState;

    const setupWatches = () => {
      udevState = cockpit
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
    };

    onMounted(() => {
      setupWatches();
      rootCheck();
    });

    return {
      adminCheck,
      adminFlag,
      preloadChecks,
      runServerInfo,
      runLsdev,
      lsdevJson,
      retryLsdev,
      diskInfo,
      zfsInfo,
      enableZfsAnimations,
      pageLayout,
      notifications,
    };
  },
};
</script>

<template>
  <Notifications :notificationFIFO="notificationFIFO" ref="notifications" />
  <div id="App" class="flex flex-col h-full">
    <FfdHeader moduleName="Disks" centerName />
    <div
      v-if="
        adminCheck &&
        adminFlag &&
        preloadChecks.serverInfo.finished &&
        preloadChecks.diskInfo.finished &&
        !preloadChecks.serverInfo.failed &&
        !preloadChecks.diskInfo.failed &&
        preloadChecks.zfs.finished && 
        preloadChecks.pageStatus.ready
      "
      class="grow flex flex-col well overflow-y-auto p-4"
    >
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
                preloadChecks.diskInfo.finished &&
                !preloadChecks.serverInfo.failed &&
                !preloadChecks.diskInfo.failed && 
                preloadChecks.zfs.finished &&
                preloadChecks.pageStatus.ready
              "
              :serverInfo="preloadChecks.serverInfo.content"
            />
          </div>
        </div>

        <div
          v-if="
            preloadChecks.serverInfo.finished &&
            preloadChecks.diskInfo.finished &&
            !preloadChecks.serverInfo.failed &&
            !preloadChecks.diskInfo.failed &&
            preloadChecks.zfs.finished &&
            preloadChecks.pageStatus.ready
          "
          :class="[
            pageLayout === 'AZ' ? 'lg:col-span-3' : '',
            pageLayout === 'BZ' ? 'xl:col-span-3 2xl:col-span-4' : '',
            pageLayout === 'CZ' ? 'xl:col-span-2 2xl:col-span-3' : '',
            pageLayout === 'A' ? 'lg:col-span-6' : '',
            pageLayout === 'B' ? 'xl:col-span-3 2xl:col-span-4' : '',
            pageLayout === 'C' ? 'xl:col-span-2 2xl:col-span-3' : '',
            'grow grid gap-well col-span-6',
          ]"
        >
          <DiskSection
            v-if="
              preloadChecks.serverInfo.finished &&
              preloadChecks.diskInfo.finished &&
              !preloadChecks.serverInfo.failed &&
              !preloadChecks.diskInfo.failed && 
              preloadChecks.pageStatus.ready
            "
          />
        </div>

        <div
          v-if="
            preloadChecks.zfs.finished &&
            !preloadChecks.zfs.failed &&
            !preloadChecks.serverInfo.failed &&
            !preloadChecks.diskInfo.failed &&
            preloadChecks.pageStatus.ready
          "
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
    </div>
    <div v-else-if="adminCheck && adminFlag" class="flex-auto flex flex-col items-center justify-evenly well">
      <div
        v-if="
          !preloadChecks.serverInfo.finished || !preloadChecks.diskInfo.finished || !preloadChecks.zfs.finished
        "
      >
        Gathering disk information. Please wait...
      </div>
      <div
        v-if="
          (preloadChecks.serverInfo.finished &&
            preloadChecks.serverInfo.failed) ||
          (preloadChecks.diskInfo.finished && preloadChecks.diskInfo.failed)
        "
        class="well flex flex-col items-center h-full"
      >
        <div class="card">
          <div class="card-header">
            <h3 class="text-header text-default">
              45Drives Disks - Unable to proceed
            </h3>
          </div>
          <div class="card-body flex flex-col gap-4">
            <h3>This module is designed to work with 45Drives servers which feature dedicated storage bays.</h3>
            <div>Consult any notifications for potential fixes.</div>
            <div>
              If you are still experiencing issues, contact 45Drives Support or
              let us know by submitting an issue on our github.
            </div>
            <div
              class="bg-accent rounded-md p-5 flex flex-col items-center gap-4"
            >
              <a
                href="https://github.com/45Drives/cockpit-hardware/issues"
                class="text-blue-500"
                target="_blank"
              >
                Submit a github issue
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else-if="adminCheck && !adminFlag"
      class="grow flex flex-col well overflow-y-auto p-4 justify-center items-center"
    >
      <div class="card">
        <div class="card-header">
          <h3 class="text-header text-default">
            Administrative Access Required
          </h3>
        </div>
        <div class="card-body flex flex-col gap-4">
          <div
            class="bg-accent rounded-md p-5 flex flex-col items-center gap-4"
          >
            45Drives Disks requires administrative access to proceed.
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="grow flex flex-col well overflow-y-auto p-4 justify-center items-center"
    >
      Loading ...
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
