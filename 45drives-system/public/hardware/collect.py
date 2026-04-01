#!/usr/bin/env python3
"""
collect.py - Unified hardware data collector for 45Drives cockpit modules.
Replaces the 5-9 separate Python scripts with a single entry point.

Usage:
    collect.py <section> [section ...]

Sections:
    motherboard  - Board info, CPU, sensor readings
    cpu          - CPU info + temperatures
    ram          - Memory modules + temperatures
    pci          - PCI slots, HBAs, network/SATA cards
    sata         - Onboard SATA connections + partitions
    network      - Network interfaces with PCI slot mapping
    ipmi         - IPMI LAN configuration
    all          - All of the above

Output: JSON to stdout.
"""

import json
import os
import re
import subprocess
import sys

# Resolve paths relative to this script's location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROFILES_DIR = os.path.join(SCRIPT_DIR, "profiles")

# Add parent dir so we can import providers as a package
sys.path.insert(0, os.path.dirname(SCRIPT_DIR))

from hardware.providers import sysfs
from hardware.providers.dmi import DMIData
from hardware.providers.ipmi import IPMIData
from hardware.providers.pci import PCIInfo


# ---------------------------------------------------------------------------
# Profile loading
# ---------------------------------------------------------------------------

def load_profile(board_name):
    """
    Load a board profile JSON. Tries exact match first, then prefix match.
    Returns profile dict or a minimal fallback.
    """
    # Normalize filename: replace / with _, spaces with _
    safe_name = board_name.replace("/", "_").replace(" ", "_")

    # Try exact match
    path = os.path.join(PROFILES_DIR, f"{safe_name}.json")
    if os.path.isfile(path):
        with open(path, "r") as f:
            return json.load(f)

    # Try prefix match (e.g. "ROMED8-2T/BCM" -> "ROMED8-2T.json")
    base = safe_name.split("_")[0] if "_" in safe_name else safe_name
    for fname in os.listdir(PROFILES_DIR):
        if fname.startswith(base) and fname.endswith(".json"):
            with open(os.path.join(PROFILES_DIR, fname), "r") as f:
                return json.load(f)

    # Fallback — empty profile, everything uses generic paths
    return {
        "board_name": board_name,
        "manufacturer": "",
        "pci": {},
        "sata": {"port_mappings": []},
        "ipmi_sensors": {},
        "ram": {"locator_tags": {}},
        "network": {},
    }


# ---------------------------------------------------------------------------
# Section collectors
# ---------------------------------------------------------------------------

def collect_motherboard(dmi, ipmi, profile):
    """Motherboard info + sensor readings (replaces 'motherboard' script)."""
    board = dmi.motherboard
    cpus = dmi.cpus

    # Sensor readings
    sensor_data = {}
    for name, val in ipmi.sensors.items():
        if val and val.lower() != "na":
            sensor_data[name] = val

    return {
        "manufacturer": board["manufacturer"],
        "productName": board["product_name"],
        "serialNumber": board["serial"],
        "cpus": cpus,
        "sensorReadings": sensor_data,
    }


def collect_cpu(dmi, ipmi, profile):
    """CPU info + temperatures (replaces 'cpu_info' script)."""
    cpus = dmi.cpus
    cpu_temp_fields = profile.get("ipmi_sensors", {}).get("cpu_temp", [])

    result = []
    for cpu in cpus:
        sock = cpu.get("socket", "")

        # Map socket designation to IPMI sensor candidates
        if sock in ("CPU0", "P0", "AM5", "SP6"):
            candidates = ["CPU0_TEMP", "CPU Temp"]
        elif sock in ("CPU1", "P1"):
            candidates = ["CPU1_TEMP", "CPU Temp", "CPU1 Temp"]
        else:
            candidates = cpu_temp_fields if cpu_temp_fields else ["CPU Temp"]

        temp = None
        for key in candidates:
            val = ipmi.reading(key)
            if val is not None:
                temp = val
                break

        result.append({
            "socket": sock,
            "model": cpu.get("model", ""),
            "maxSpeed": cpu.get("max_speed", ""),
            "currentSpeed": cpu.get("current_speed", ""),
            "temperature": f"{temp} (C)" if temp is not None else "-",
        })

    return {"cpus": result} if result else {
        "cpus": [{
            "socket": "UNKNOWN",
            "model": "UNKNOWN",
            "maxSpeed": "-",
            "currentSpeed": "-",
            "temperature": "-",
        }]
    }


def collect_ram(dmi, ipmi, profile):
    """Memory modules + temperatures (replaces 'ram' script)."""
    modules = dmi.memory
    board_name = profile.get("board_name", "")
    locator_tags = profile.get("ram", {}).get("locator_tags", {})

    # Board-specific locator remapping
    remap = profile.get("ram", {}).get("locator_remap", {})
    bank_remap = profile.get("ram", {}).get("bank_to_locator", {})

    result = []
    for mod in modules:
        locator = mod.get("locator", "")
        bank_locator = mod.get("bank_locator", "")

        # Apply bank-to-locator remap if defined (e.g., B550I, ROMED8)
        if bank_remap and bank_locator in bank_remap:
            locator = bank_remap[bank_locator]

        # Apply direct locator remap
        if remap and locator in remap:
            locator = remap[locator]

        # Get temperature via IPMI
        temp = ipmi.dimm_temp_for_locator(locator, profile)

        # Format temperature
        if temp is not None:
            temp_str = f"{temp} (C)"
        else:
            temp_str = "-"

        size = mod.get("size", "No Module Installed")
        mfr = mod.get("manufacturer", "-")
        serial = mod.get("serial", "-")
        if mfr == "NO DIMM":
            mfr = "-"
        if serial == "NO DIMM":
            serial = "-"

        result.append({
            "locator": locator,
            "type": mod.get("type", "-"),
            "size": size,
            "manufacturer": mfr,
            "serialNumber": serial,
            "temperature": temp_str,
        })

    return result


def collect_pci(dmi, profile):
    """PCI slot info (replaces 972-line 'pci' script)."""
    pci = PCIInfo(dmi, profile)
    return pci.to_json_list()


def collect_sata(profile):
    """SATA connections + partitions (replaces 'sata' script)."""
    port_mappings = profile.get("sata", {}).get("port_mappings", [])
    board_name = profile.get("board_name", "")

    # Build path->connector mapping from profile
    path_to_connector = {}
    for mapping in port_mappings:
        path_to_connector[mapping[0]] = mapping[1]

    # Read /dev/disk/by-path
    by_path = sysfs.disk_by_path()

    connections = {}
    port_counter = 0

    for path_name, device in sorted(by_path.items()):
        # Only ATA paths for onboard SATA
        if "-ata-" not in path_name:
            continue

        # Skip if device already seen
        if device in connections:
            continue

        # Look up connector from profile
        connector = path_to_connector.get(path_name)

        if connector is None and not port_mappings:
            # Fallback: sequential labeling for unknown boards
            connector = f"SATA_{port_counter}"
            port_counter += 1
        elif connector is None:
            # Board-specific mapping exists but no match — check prefix
            for prof_path, prof_conn in path_to_connector.items():
                if path_name.startswith(prof_path.rsplit("-ata-", 1)[0]):
                    connector = prof_conn
                    break
            if connector is None:
                connector = f"SATA_{port_counter}"
                port_counter += 1

        connections[device] = {
            "Path": path_name,
            "Connector": connector,
            "Device": device,
            "Partitions": _lsblk(device),
        }

    # B550I dynamic SATA discovery fallback
    if board_name == "B550I AORUS PRO AX" and not connections:
        connections = _b550i_sata_fallback()

    return {"SATA Info": list(connections.values())}


def _lsblk(device):
    """Get partition list for a device."""
    try:
        result = subprocess.run(
            ["lsblk", "-l", f"/dev/{device}"],
            capture_output=True, text=True, timeout=10
        )
        raw = result.stdout
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return []

    parts = []
    for line in raw.splitlines():
        m = re.match(r"^(\S+)\s+\S+\s+\S+\s+(\S+)\s+\S+\s+(\S+)(.*)$", line)
        if m and m.group(1) != "NAME":
            parts.append({
                "Name": m.group(1),
                "Size": m.group(2),
                "Type": m.group(3),
                "Mount Point": m.group(4).lstrip(),
            })
    return parts


def _b550i_sata_fallback():
    """Dynamic SATA discovery for B550I via lshw."""
    connections = {}
    try:
        result = subprocess.run(
            ["lshw", "-class", "storage"],
            capture_output=True, text=True, timeout=15
        )
        raw = result.stdout
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return connections

    pci_addrs = []
    bus_rx = re.compile(r"bus info:\s+pci@(\S+)")
    desc_rx = re.compile(r"description:\s+SATA controller")
    in_sata = False

    for line in raw.splitlines():
        if desc_rx.search(line):
            in_sata = True
        elif not line.strip():
            in_sata = False
        if in_sata:
            m = bus_rx.search(line)
            if m:
                pci_addrs.append(m.group(1))

    by_path = sysfs.disk_by_path()
    for path_name, device in sorted(by_path.items()):
        if "-ata-" not in path_name:
            continue
        for addr in pci_addrs:
            if addr in path_name and device not in connections:
                port_m = re.search(r"-ata-(\d+)", path_name)
                port = port_m.group(1) if port_m else "0"
                connections[device] = {
                    "Path": path_name,
                    "Connector": f"SATA-{port}",
                    "Device": device,
                    "Partitions": _lsblk(device),
                }
    return connections


def collect_network(dmi, profile):
    """Network interfaces with PCI slot mapping (replaces 'network' script)."""
    # Get IP addresses
    try:
        result = subprocess.run(
            ["ip", "-j", "addr"],
            capture_output=True, text=True, timeout=10
        )
        ip_json = json.loads(result.stdout)
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError, json.JSONDecodeError):
        ip_json = []

    connections = []
    for conn in ip_json:
        addr_info = conn.get("addr_info", [])
        ipv4 = "-"
        ipv6 = "-"
        for ai in addr_info:
            if ai.get("family") == "inet" and ipv4 == "-":
                ipv4 = f"{ai['local']}/{ai['prefixlen']}"
            elif ai.get("family") == "inet6" and ipv6 == "-":
                ipv6 = f"{ai['local']}/{ai['prefixlen']}"

        connections.append({
            "connectionName": conn.get("ifname", ""),
            "connectionState": conn.get("operstate", ""),
            "connectionType": conn.get("link_type", ""),
            "mac": conn.get("address", "-"),
            "ipv4": ipv4,
            "ipv6": ipv6,
            "pciSlot": "-",
            "busAddress": "-",
        })

    # Match network interfaces to PCI slots via lshw
    try:
        result = subprocess.run(
            ["lshw", "-C", "network", "-businfo", "-quiet"],
            capture_output=True, text=True, timeout=15
        )
        lshw_raw = result.stdout
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        lshw_raw = ""

    # Parse lshw output: bus_address -> interface_name
    lshw_map = {}
    for line in lshw_raw.splitlines():
        m = re.match(r"^pci@(\S+)\s+(\S+)\s+(\S+)\s+(.+)$", line)
        if m:
            bus_addr = m.group(1)
            iface = m.group(2)
            device_name = m.group(4).strip()

            # Skip onboard NICs if profile says to
            skip_nics = profile.get("network", {}).get("onboard_nics_to_skip", [])
            if any(s in device_name for s in skip_nics):
                continue

            lshw_map[iface] = bus_addr

    # Get PCI slots from DMI type 9
    address_fixups = profile.get("pci", {}).get("address_fixups", {})
    designation_remap = profile.get("pci", {}).get("designation_remap", {})
    address_to_slot = profile.get("pci", {}).get("address_to_slot", {})

    slots_by_bus = {}
    for record in dmi.records(9):
        designation = record.get("Designation", "")
        if designation == "N/A":
            continue
        bus = record.get("Bus Address", "")
        if bus in address_fixups:
            bus = address_fixups[bus]

        # Apply designation remap
        if designation in designation_remap:
            designation = designation_remap[designation]
        else:
            designation = re.sub(r"_[A-Z]$", "", designation)

        slots_by_bus[bus] = designation

        # Also map all candidate addresses from profile
        if designation in address_to_slot:
            addrs = address_to_slot[designation]
            if not isinstance(addrs, list):
                addrs = [addrs]
            for addr in addrs:
                slots_by_bus[addr] = designation

    # Match connections to PCI slots
    for conn in connections:
        iface = conn["connectionName"]
        if iface in lshw_map:
            bus_addr = lshw_map[iface]
            conn["busAddress"] = bus_addr

            # Find slot for this bus address
            # Normalize for comparison
            norm_bus = bus_addr.lower().lstrip("0")
            for slot_bus, designation in slots_by_bus.items():
                if slot_bus.lower().lstrip("0") == norm_bus:
                    m = re.search(r"(PCIE(?:X\d+|_\d+|\d+)|SLOT\d+)", designation)
                    if m:
                        conn["pciSlot"] = m.group(1)
                    break

            # Also check port 1 (dual-port NIC assumption)
            if conn["busAddress"].endswith(".0"):
                port1_bus = conn["busAddress"][:-1] + "1"
                # Find matching connection for port 1
                for other in connections:
                    if other["connectionName"] != iface and \
                            lshw_map.get(other["connectionName"]) == port1_bus:
                        other["busAddress"] = port1_bus
                        other["pciSlot"] = conn["pciSlot"]

    return connections


def collect_ipmi_lan(ipmi):
    """IPMI LAN config (replaces 'ipmi' script)."""
    lan = ipmi.lan
    return {
        "ipAddress": lan["ip_address"],
        "subnetMask": lan["subnet_mask"],
        "macAddress": lan["mac_address"],
        "defaultGatewayIp": lan["default_gateway"],
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

ALL_SECTIONS = [
    "motherboard", "cpu", "ram", "pci", "sata", "network", "ipmi"
]


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <section> [section ...]", file=sys.stderr)
        print(f"Sections: {', '.join(ALL_SECTIONS)}, all", file=sys.stderr)
        sys.exit(1)

    sections = sys.argv[1:]
    if "all" in sections:
        sections = ALL_SECTIONS

    # Identify board
    board = sysfs.board_info()
    board_name = board["product_name"]
    profile = load_profile(board_name)

    # Initialize providers (lazy — only invoke external tools when accessed)
    dmi = DMIData()
    ipmi = IPMIData()

    output = {}

    for section in sections:
        if section == "motherboard":
            output["motherboard"] = collect_motherboard(dmi, ipmi, profile)
        elif section == "cpu":
            output["cpu"] = collect_cpu(dmi, ipmi, profile)
        elif section == "ram":
            output["ram"] = collect_ram(dmi, ipmi, profile)
        elif section == "pci":
            output["pci"] = collect_pci(dmi, profile)
        elif section == "sata":
            output["sata"] = collect_sata(profile)
        elif section == "network":
            output["network"] = collect_network(dmi, profile)
        elif section == "ipmi":
            output["ipmi"] = collect_ipmi_lan(ipmi)
        else:
            print(f"Unknown section: {section}", file=sys.stderr)
            sys.exit(1)

    print(json.dumps(output, indent=4))


if __name__ == "__main__":
    main()
