import { server, Command, unwrap } from "@45drives/houston-common-lib";

export default async function getServerInfo() {
  try {
    const proc = await unwrap(server.execute(
      new Command(["/usr/share/cockpit/45drives-disks/scripts/server_info"], { superuser: "require" })
    ));
    let serverInfo = JSON.parse(proc.getStdout());
    return serverInfo;
  } catch (error) {
    console.log(error);
    return error;
  }
}
