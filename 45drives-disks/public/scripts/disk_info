#!/usr/bin/env python3
import os
import json
import sys
import re

def loadServerInfo():
    json_path = "/etc/45drives/server_info/server_info.json"
    server_info = {}
    if os.path.exists(json_path):
        f = open(json_path, "r")
        server_info = json.load(f)
        f.close()
        return server_info
    else:
        print("/etc/45drives/server_info/server_info.json not found.")
        sys.exit(1)

def getDiskInfo(path,server_info):
    if not os.path.isfile(path):
        if "Chassis Size" in server_info.keys() and server_info["Chassis Size"] in ["2UGW"]:
            print(f"This program is intended to display disk information for servers with dedicated storage bays.",file=sys.stderr)
            print(f"Use command line utilities such as lsblk to see disk information for Ceph Gateways.",file=sys.stderr)
            sys.exit(1)
        print(f"Error opening {path}. Run `dmap`.",file=sys.stderr)
        sys.exit(1)
    
    c_lines = []
    disks = []
    with open("/etc/vdev_id.conf","r") as vdev_id:
        c_lines = vdev_id.readlines()
    
    for line in c_lines:
        regex = re.search("^alias\s+(\d+-\d+)\s+(\S+)",line)
        if regex != None:
            disks.append({"dev-by-path":regex.group(2),"bay-id":regex.group(1)})
        
    for d in disks:
        d["occupied"] = os.path.islink(d["dev-by-path"])
        d["dev"] = os.path.realpath(d["dev-by-path"]) if d["occupied"] else ""
        d["disk_type"] = disk_type(d["dev"])

    return {"rows":disks}

def disk_type(device_path):
	#get the value of "/sys/block/[device_name]/queue/rotational
	#this check will return 1 if block device is a spinner, 0 if not
	device_name = os.path.basename(device_path)
	rotational_path = "/sys/block/" + device_name + "/queue/rotational"
	if not os.path.isfile(rotational_path):
		return ""
	rotational = open(rotational_path, mode='r')
	is_rotational = bool(int(rotational.read(1)))
	return ("HDD" if is_rotational else "SSD")

def main():
    server_info = loadServerInfo()
    diskInfo = getDiskInfo("/etc/vdev_id.conf",server_info)
    print(json.dumps(diskInfo,indent=4))


if __name__ == "__main__":
    main()
