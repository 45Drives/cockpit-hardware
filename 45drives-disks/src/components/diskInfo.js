import { reactive, watch } from "vue";
import { useSpawn } from "@45drives/cockpit-helpers";

export default async function getServerInfo() {
  try {
    const state = await useSpawn(
      ["/usr/share/cockpit/45drives-disks/scripts/server_info"],
      {
        err: "out",
        superuser: "require",
      }
    ).promise()
    let serverInfo = JSON.parse(state.stdout);
    return serverInfo;
  } catch (error) {
    console.log(error);
    return error;
  }
}
