"""Local hardware restrictions shared by firmware checking and flashing."""

import re
import os
import shlex
import subprocess
from pathlib import Path


SYSFS_ROOT = Path("/sys")
OS_RELEASE_PATHS = (Path("/etc/os-release"), Path("/usr/lib/os-release"))
PROXMOX_VERSION_TOOL = Path("/usr/bin/pveversion")
ASROCK_ONBOARD_REASON = "asrock_onboard_nic"
# Intel X550 family PCI device IDs (X550-T, X550-AT2/X550T, X550EM variants)
X550_DEVICE_IDS = ("0x1563", "0x15d1", "0x15ad", "0x15ae", "0x15c2", "0x15c3",
                   "0x15c4", "0x15c6", "0x15c7", "0x15c8", "0x15ce", "0x15e4", "0x15e5")
ASROCK_ONBOARD_NOTE = (
    "Onboard ASRock NICs require an ASRock-signed firmware package. "
    "Generic NIC firmware updates are not available for this device."
)


def _read_text(path):
    try:
        return path.read_text().strip()
    except OSError:
        return ""


def get_os_info():
    """Read host OS identity without executing os-release as shell code."""
    # Proxmox must not accidentally inherit a Debian qualification profile.
    if PROXMOX_VERSION_TOOL.is_file():
        version = ""
        try:
            result = subprocess.run([str(PROXMOX_VERSION_TOOL)], stdout=subprocess.PIPE,
                                    stderr=subprocess.PIPE, universal_newlines=True, timeout=10)
            match = re.search(r"pve-manager/(\d+\.\d+)(?:[./-]|$)", result.stdout)
            if result.returncode == 0 and match:
                version = match.group(1)
        except (OSError, subprocess.TimeoutExpired):
            pass
        return {"id": "proxmox", "version_id": version}
    for path in OS_RELEASE_PATHS:
        contents = _read_text(path)
        if not contents:
            continue
        info = {}
        for line in contents.splitlines():
            key, separator, value = line.partition("=")
            key = key.strip()
            if not separator or key not in ("ID", "VERSION_ID"):
                continue
            try:
                tokens = shlex.split(value, comments=True)
            except ValueError:
                continue
            if len(tokens) == 1:
                info[key.lower()] = tokens[0].strip().lower()
        return info
    return {}


def get_host_environment():
    uname = os.uname()
    return {"os": get_os_info(), "architecture": uname.machine, "kernel_release": uname.release}


def get_board_info():
    """Read live board identity, with dmidecode as a fallback to sysfs."""
    board = {}
    for key, filename, dmi_field in (
        ("manufacturer", "board_vendor", "baseboard-manufacturer"),
        ("model", "board_name", "baseboard-product-name"),
    ):
        value = _read_text(SYSFS_ROOT / "class/dmi/id" / filename)
        if not value:
            try:
                result = subprocess.run(
                    ["dmidecode", "-s", dmi_field],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                    universal_newlines=True, timeout=10,
                )
                if result.returncode == 0:
                    value = result.stdout.strip()
            except (OSError, subprocess.TimeoutExpired):
                pass
        board[key] = value
    return board


def nic_pci_path(device):
    """Resolve a NIC's PCI address from current or older cache formats."""
    for value in (device.get("bus_info"), device.get("device_path"), device.get("device")):
        match = re.fullmatch(r"(?:([0-9a-fA-F]{4}):)?([0-9a-fA-F]{2}:[0-9a-fA-F]{2}\.[0-7])", value or "")
        if match:
            address = f"{match.group(1) or '0000'}:{match.group(2)}".lower()
            return SYSFS_ROOT / "bus/pci/devices" / address
    for iface in (device.get("interface"), device.get("device"), device.get("device_path")):
        if iface and re.fullmatch(r"[a-zA-Z0-9_.:-]+", iface):
            path = SYSFS_ROOT / "class/net" / iface / "device"
            if path.exists():
                return path.resolve()
    return None


def nic_update_policy(device, board=None, os_info=None):
    """Identify ASRock onboard NICs. OS eligibility comes from signed profiles.

    The PCI index/acpi_index attributes identify onboard devices using SMBIOS
    type 41 or ACPI, as used by systemd's network naming. ASRock subsystem IDs
    also identify OEM NICs when board firmware omits those attributes.
    """
    if device.get("type") != "nic":
        return {}
    if board is None:
        board = get_board_info()
    manufacturer = re.sub(r"[^a-z0-9]", "", board.get("manufacturer", "").lower())
    asrock_board = manufacturer.startswith("asrock") or board.get("model", "").upper().startswith(
        ("ROMED8", "GENOAD8", "TURIND8")
    )
    pci_path = nic_pci_path(device)
    onboard = False
    asrock_subsystem = False
    if pci_path is not None:
        # Both ports share firmware; some BIOSes describe only function 0.
        paths = {pci_path, pci_path.with_name(pci_path.name.rsplit(".", 1)[0] + ".0")}
        for path in paths:
            for attr in ("acpi_index", "index"):
                value = _read_text(path / attr)
                if value.isdigit() and 0 <= int(value) <= 65535:
                    onboard = True
            asrock_subsystem |= _read_text(path / "subsystem_vendor").lower() in ("0x1849", "0xf849")

    policy = {"onboard": onboard, "motherboard_model": board.get("model", "")}
    if (asrock_board and onboard) or asrock_subsystem:
        policy.update({
            "blocked_reason": ASROCK_ONBOARD_REASON,
            "firmware_update_note": ASROCK_ONBOARD_NOTE,
        })
    return policy


def nic_update_block_reason(device):
    """Recheck hardware and the host OS before using any cached authorization."""
    if device.get("blocked_reason") == ASROCK_ONBOARD_REASON:
        return ASROCK_ONBOARD_NOTE
    return nic_update_policy(device).get("firmware_update_note", "")


def pci_identity(device):
    """Read OEM IDs and driver details from the live PCI device."""
    path = nic_pci_path(device)
    if path is None:
        return {}
    info = {}
    for field, filename in (("pci_vendor", "vendor"), ("pci_device", "device"),
                            ("pci_subsystem_vendor", "subsystem_vendor"),
                            ("pci_subsystem_device", "subsystem_device")):
        info[field] = _read_text(path / filename).lower()
    driver = path / "driver"
    if driver.exists():
        info["driver"] = driver.resolve().name
        info["driver_version"] = _read_text(driver / "module/version")
    return info


def permanent_nic_mac(device):
    """Read a live permanent MAC to limit Intel NVM updates to one adapter."""
    pci_path = nic_pci_path(device)
    if pci_path is None:
        return ""
    try:
        interfaces = sorted((pci_path / "net").iterdir())
    except OSError:
        return ""
    for iface in interfaces:
        try:
            result = subprocess.run(
                ["ethtool", "-P", iface.name],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                universal_newlines=True, timeout=10,
            )
        except (OSError, subprocess.TimeoutExpired):
            continue
        match = re.search(r"Permanent address:\s*((?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2})", result.stdout)
        if result.returncode == 0 and match:
            mac = match.group(1).replace(":", "").upper()
            if mac != "000000000000" and not int(mac[:2], 16) & 1:
                return mac
    return ""
