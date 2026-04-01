"""
sysfs.py - Pure filesystem reads for hardware identification.
No subprocesses. Works on Rocky 8/9 and Ubuntu 20/22.
"""

import os
import re
from glob import glob


def _read(path):
    """Read a sysfs/procfs file, return stripped content or empty string."""
    try:
        with open(path, "r") as f:
            return f.read().strip()
    except (OSError, IOError):
        return ""


# ---------------------------------------------------------------------------
# Board identification (available since kernel ~2.6)
# ---------------------------------------------------------------------------

def board_info():
    """Read motherboard info from /sys/class/dmi/id/. Needs root for serial."""
    return {
        "manufacturer": _read("/sys/class/dmi/id/board_vendor"),
        "product_name": _read("/sys/class/dmi/id/board_name"),
        "serial": _read("/sys/class/dmi/id/board_serial"),
    }


def chassis_info():
    return {
        "serial": _read("/sys/class/dmi/id/chassis_serial"),
        "type": _read("/sys/class/dmi/id/chassis_type"),
    }


def system_info():
    return {
        "manufacturer": _read("/sys/class/dmi/id/sys_vendor"),
        "product_name": _read("/sys/class/dmi/id/product_name"),
        "serial": _read("/sys/class/dmi/id/product_serial"),
    }


# ---------------------------------------------------------------------------
# Disk detection
# ---------------------------------------------------------------------------

def disk_type(dev):
    """Return 'SSD' or 'HDD' based on /sys/block/<dev>/queue/rotational."""
    val = _read(f"/sys/block/{dev}/queue/rotational")
    if val == "0":
        return "SSD"
    elif val == "1":
        return "HDD"
    return ""


def list_block_devices():
    """List all block devices (sd*, nvme*) from /sys/block/."""
    result = []
    try:
        for name in os.listdir("/sys/block"):
            if name.startswith("sd") or name.startswith("nvme"):
                result.append(name)
    except OSError:
        pass
    return sorted(result)


# ---------------------------------------------------------------------------
# NVMe temperature (kernel 5.5+ exposes hwmon; fallback needed for Rocky 8)
# ---------------------------------------------------------------------------

def nvme_temp(dev):
    """
    Read NVMe temperature from hwmon sysfs (millidegrees C).
    Returns integer degrees C or None if unavailable.
    Works on kernel 5.5+ (Rocky 9, Ubuntu 22).
    Rocky 8 (kernel 4.18) does NOT have this — caller should fall back to smartctl.
    """
    paths = glob(f"/sys/class/nvme/{dev}/hwmon*/temp1_input")
    if paths:
        raw = _read(paths[0])
        if raw:
            try:
                return int(raw) // 1000
            except ValueError:
                pass
    return None


# ---------------------------------------------------------------------------
# PCI device enumeration via sysfs
# ---------------------------------------------------------------------------

def pci_devices():
    """
    Enumerate PCI devices from /sys/bus/pci/devices/.
    Returns dict: bus_address -> {vendor, device, class, driver, max_link_width, max_link_speed}
    """
    result = {}
    base = "/sys/bus/pci/devices"
    try:
        entries = os.listdir(base)
    except OSError:
        return result

    for addr in entries:
        dev_path = os.path.join(base, addr)
        result[addr] = {
            "vendor": _read(os.path.join(dev_path, "vendor")),
            "device": _read(os.path.join(dev_path, "device")),
            "class": _read(os.path.join(dev_path, "class")),
            "driver": os.path.basename(os.readlink(os.path.join(dev_path, "driver")))
                      if os.path.islink(os.path.join(dev_path, "driver")) else "",
            "max_link_width": _read(os.path.join(dev_path, "max_link_width")),
            "max_link_speed": _read(os.path.join(dev_path, "max_link_speed")),
        }
    return result


def pcie_gen_from_speed(speed_str):
    """Convert PCIe link speed string (e.g. '16 GT/s') to generation number."""
    m = re.search(r"([0-9]+(?:\.[0-9]+)?)", speed_str or "")
    if not m:
        return None
    speed = float(m.group(1))
    if speed >= 64:
        return 6
    if speed >= 32:
        return 5
    if speed >= 16:
        return 4
    if speed >= 8:
        return 3
    if speed >= 5:
        return 2
    if speed >= 2.5:
        return 1
    return None


def infer_pcie_type(bus_address):
    """Infer PCIe slot type string from sysfs link info."""
    if not bus_address or bus_address == "0000:00:00.0":
        return None
    base = f"/sys/bus/pci/devices/{bus_address}"
    width = _read(os.path.join(base, "max_link_width"))
    speed_raw = _read(os.path.join(base, "max_link_speed"))
    if not width or not speed_raw:
        return None
    gen = pcie_gen_from_speed(speed_raw)
    if not gen:
        return None
    return f"PCI Express {gen} x{width}"


# ---------------------------------------------------------------------------
# Network interfaces
# ---------------------------------------------------------------------------

def network_interfaces():
    """List network interfaces with basic info from sysfs."""
    result = []
    try:
        for iface in os.listdir("/sys/class/net"):
            iface_path = f"/sys/class/net/{iface}"
            result.append({
                "name": iface,
                "mac": _read(os.path.join(iface_path, "address")),
                "operstate": _read(os.path.join(iface_path, "operstate")),
                "type": _read(os.path.join(iface_path, "type")),
                "pci_bus": os.path.basename(
                    os.readlink(os.path.join(iface_path, "device"))
                ) if os.path.islink(os.path.join(iface_path, "device")) else "",
            })
    except OSError:
        pass
    return result


# ---------------------------------------------------------------------------
# SATA ATA port enumeration
# ---------------------------------------------------------------------------

def ata_port_count():
    """Count ATA ports from /sys/class/ata_port/."""
    try:
        return len(os.listdir("/sys/class/ata_port"))
    except OSError:
        return 0


# ---------------------------------------------------------------------------
# Disk-by-path mapping
# ---------------------------------------------------------------------------

def disk_by_path():
    """
    Read /dev/disk/by-path symlinks.
    Returns dict: path_name -> device_name (e.g. 'sda')
    """
    result = {}
    bypath = "/dev/disk/by-path"
    try:
        for name in os.listdir(bypath):
            if "-part" in name:
                continue
            target = os.path.realpath(os.path.join(bypath, name))
            dev = os.path.basename(target)
            result[name] = dev
    except OSError:
        pass
    return result


# ---------------------------------------------------------------------------
# IPMI hwmon sensors (ipmi_si driver exposes some via /sys/class/hwmon/)
# ---------------------------------------------------------------------------

def hwmon_sensors():
    """
    Try to read IPMI-exposed sensors from hwmon sysfs.
    Returns dict: sensor_label -> value_string
    Not all systems expose IPMI sensors via hwmon; this is best-effort.
    """
    result = {}
    for hwmon_dir in glob("/sys/class/hwmon/hwmon*"):
        name = _read(os.path.join(hwmon_dir, "name"))
        if name not in ("ipmi", "acpi"):
            continue
        for label_file in glob(os.path.join(hwmon_dir, "temp*_label")):
            label = _read(label_file)
            if not label:
                continue
            input_file = label_file.replace("_label", "_input")
            raw = _read(input_file)
            if raw:
                try:
                    result[label] = int(raw) // 1000
                except ValueError:
                    pass
    return result


# ---------------------------------------------------------------------------
# OS info
# ---------------------------------------------------------------------------

def os_info():
    """Read OS name and version from /etc/os-release."""
    info = {"name": "", "version_id": ""}
    try:
        with open("/etc/os-release", "r") as f:
            for line in f:
                if line.startswith("NAME="):
                    info["name"] = line.split("=", 1)[1].strip().strip('"')
                elif line.startswith("VERSION_ID="):
                    info["version_id"] = line.split("=", 1)[1].strip().strip('"')
    except (OSError, IOError):
        pass
    return info
