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
import { legacy, server, Command, unwrap } from "@45drives/houston-common-lib";
const { errorStringHTML } = legacy;
import { pushNotification, Notification, NotificationView } from "@45drives/houston-common-ui";
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
    NotificationView,
  },
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

    const delay = (s) => new Promise((res) => setTimeout(res, s * 1000));

    const withTimeout = (promise, timeoutMs, label) => {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`)), timeoutMs)
        ),
      ]);
    };

    let watchInitiated = false;
    let initStarted = false;

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
        await unwrap(server.execute(
          new Command(["/opt/45drives/tools/dmap"], { superuser: "require" })
        ));
        init();
      } catch (error) {
        preloadChecks.serverInfo.finished = true;
        preloadChecks.diskInfo.finished = true;
        pushNotification(
          new Notification(
            "Error running dmap",
            errorStringHTML(error.message || error),
            "error",
            "never"
          )
        );
        return false;
      }
    };

    const runServerIdentifier = async () => {
      try {
        await unwrap(server.execute(
          new Command(["/opt/45drives/tools/server_identifier"], { superuser: "require" })
        ));
        return await runServerInfo();
      } catch (error) {
        console.log(error);
        pushNotification(
          new Notification(
            "Error running server_identifier",
            errorStringHTML(error.message || error),
            "error",
            "never"
          )
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
            case "NVME-F8X1":
              pageLayout.value = "B";
              break;
            case "NVME-F8X2":
              pageLayout.value = "B";
              break;
            case "NVME-F8X3":
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
            case "NVME-F8X1":
              pageLayout.value = "BZ";
              break;
            case "NVME-F8X2":
              pageLayout.value = "BZ";
              break;
            case "NVME-F8X3":
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
        const proc = await withTimeout(
          unwrap(server.execute(
            new Command(["/usr/share/cockpit/45drives-disks/scripts/server_info"], { superuser: "require" })
          )),
          30000,
          'server_info'
        );
        let result = JSON.parse(proc.getStdout());
        preloadChecks.serverInfo.content = result;
        preloadChecks.serverInfo.finished = true;
        preloadChecks.serverInfo.failed = false;
      } catch (error) {
        console.log(error);
        preloadChecks.serverInfo.content = null;
        preloadChecks.serverInfo.finished = true;
        preloadChecks.serverInfo.failed = true;
        if (
          error.message &&
          error.message.includes(
            "/etc/45drives/server_info/server_info.json not found."
          )
        ) {
          serverInfoFailNotification = new Notification(
              "Error obtaining server model information",
              errorStringHTML(error.message),
              "error",
              30000
            );
          serverInfoFailNotification.addAction("fix", () => runServerIdentifier());
          pushNotification(serverInfoFailNotification);
        }
      }
    };

    const runLsdev = async () => {
      try {
        const proc = await withTimeout(
          unwrap(server.execute(
            new Command(["/opt/45drives/tools/lsdev", "--json"], { superuser: "require" })
          )),
          30000,
          'lsdev'
        );
        let result = JSON.parse(proc.getStdout());
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
        pushNotification(
          new Notification(
            "Error obtaining disk information",
            errorStringHTML(error.message || error),
            "error",
            "never"
          )
        );
        return false;
      }
    };

    const runDiskInfo = async () => {
      preloadChecks.lsdev.finished = false;
      preloadChecks.diskInfo.finished = false;
      try {
        const proc = await withTimeout(
          unwrap(server.execute(
            new Command(["/usr/share/cockpit/45drives-disks/scripts/disk_info"], { superuser: "require" })
          )),
          30000,
          'disk_info'
        );
        let result = JSON.parse(proc.getStdout());
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
          error.message &&
          error.message.includes("Error opening /etc/vdev_id.conf. Run `dmap`.")
        ) {
          const diskErrorNotif = new Notification(
              "Error obtaining disk information",
              errorStringHTML(error.message),
              "error",
              "never"
            );
          diskErrorNotif.addAction("fix", () => {
              if (serverInfoFailNotification)
                serverInfoFailNotification.remove();
              return runDmap();
            });
          pushNotification(diskErrorNotif);
        } else {
          pushNotification(
            new Notification(
              "Error obtaining disk information",
              errorStringHTML(error.message || error),
              "error"
            )
          );
          return false;
        }
      }
    };

    const runZfsInfo = async () => {
      try {
        const proc = await withTimeout(
          unwrap(server.execute(
            new Command(["/usr/share/cockpit/45drives-disks/scripts/zfs_info"], { superuser: "require" })
          )),
          30000,
          'zfs_info'
        );
        let result = JSON.parse(proc.getStdout());
        Object.assign(zfsInfo, result);
        if (result.warnings && result.warnings.length > 0){
          pushNotification(
            new Notification(
              "Warning:",
              errorStringHTML(result.warnings.join("")),
              "warning",
              "never"
            )
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
        pushNotification(
          new Notification(
            "Unable to gather zfs information",
            errorStringHTML(error.message || error),
            "warning",
            "never"
          )
        );
        return false;
      }
    };

    const init = async () => {
      if (initStarted) return;
      initStarted = true;
      try {
        // console.time('init:total');
        // console.time('init:serverInfo');
        await runServerInfo();
        // console.timeEnd('init:serverInfo');
        // console.time('init:diskInfo+zfsInfo');
        await Promise.all([runDiskInfo(), runZfsInfo()]);
        // console.timeEnd('init:diskInfo+zfsInfo');
        setPageLayout();
        if (!preloadChecks.diskInfo.failed && !preloadChecks.serverInfo.failed) {
          console.time('init:lsdev');
          await runLsdev();
          // console.timeEnd('init:lsdev');
        }
        // console.timeEnd('init:total');
      } catch (error) {
        console.error('init failed:', error);
        // Ensure page still renders with whatever data we have
        preloadChecks.serverInfo.finished = true;
        preloadChecks.diskInfo.finished = true;
        preloadChecks.zfs.finished = true;
        preloadChecks.zfs.failed = true;
        setPageLayout();
      }
    };

    const MAX_LSDEV_RETRIES = 5;

    const retryLsdev = async (duration) => {
      await delay(duration);
      let retries = 0;
      while (await runLsdev()) {
        retries++;
        if (retries >= MAX_LSDEV_RETRIES) {
          console.warn('lsdev: max retries reached, stopping retry loop');
          break;
        }
        await delay(duration);
      }
      await runZfsInfo();
    };

    const rootCheck = async () => {
      let root_check = cockpit.permission({ admin: true });
      let handled = false;
      const handlePermission = () => {
        if (handled) return;
        // console.log('rootCheck: allowed =', root_check.allowed);
        if (root_check.allowed) {
          handled = true;
          adminCheck.value = true;
          adminFlag.value = true;
          init();
        } else if (root_check.allowed === false) {
          handled = true;
          adminCheck.value = true;
          adminFlag.value = false;
        }
      };
      root_check.addEventListener("changed", handlePermission);
      // Check immediately in case already resolved
      handlePermission();
      // Polling fallback: if event never fires, check periodically
      const pollInterval = setInterval(() => {
        if (handled) {
          clearInterval(pollInterval);
          return;
        }
        // console.log('rootCheck: polling, allowed =', root_check.allowed);
        handlePermission();
      }, 500);
      // Stop polling after 10 seconds regardless
      setTimeout(() => clearInterval(pollInterval), 10000);
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
    };
  },
};
</script>

<template>
  <NotificationView />
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
@import "@45drives/houston-common-css/src/index.css";
#app {
  /*font-family: "Red Hat Text";*/
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  @apply bg-default h-full text-default;
}
</style>
