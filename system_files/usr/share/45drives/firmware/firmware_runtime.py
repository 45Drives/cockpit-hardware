"""Bind signed release data to live hardware before allowing NIC/HBA updates."""

from pathlib import Path
import re
import runpy

from firmware_policy import get_host_environment, nic_update_block_reason, pci_identity
from firmware_qualification import (
    QUALIFIED_TYPES, POLICY_VERSION, UNVALIDATED_NOTE, evaluate_qualification,
    release_revision,
)


SCRIPT_DIR = Path(__file__).resolve().parent


class UpdateNotQualified(ValueError):
    pass


def canonical_pci(device):
    for key in ("bus_info", "device_path", "device"):
        value = device.get(key, "")
        match = re.fullmatch(r"(?:([0-9a-fA-F]{4}):)?([0-9a-fA-F]{2}:[0-9a-fA-F]{2}\.[0-7])", value or "")
        if match:
            return (match.group(1) or "0000").lower() + ":" + match.group(2).lower()
    return ""


def bind_release(device, entry, manifest, host):
    """Execution fields always come from the signed catalog, never the UI cache."""
    result = dict(device)
    for field in ("latest_firmware", "flash_tool", "flash_command", "tool_package",
                  "tool_package_sha256", "firmware_file", "sha256", "family", "release_notes",
                  "upgrade_from", "previous_firmware", "previous_firmware_file", "previous_sha256"):
        result[field] = entry.get(field, "")
    result["current_firmware"] = device.get("firmware", "")
    result["requires_reboot"] = entry.get("requires_reboot", False)
    result["flashable"] = entry.get("flashable") is True
    result["release_id"] = entry.get("release_id", "")
    result["release_status"] = entry.get("release_status", "draft")
    result["update_method"] = entry.get("update_method", "support_assisted")
    result["release_revision"] = release_revision(entry, manifest.get("flash_tools", []))
    result["validation_profiles"] = entry.get("validation_profiles", [])
    result["flash_tool_sha256s"] = {
        tool["name"].lower(): tool["sha256"] for tool in manifest.get("flash_tools", [])
        if isinstance(tool, dict) and isinstance(tool.get("name"), str) and tool.get("sha256")
    }
    result["tool_binary_sha256"] = result["flash_tool_sha256s"].get(str(result["flash_tool"]).lower(), "")
    policy = evaluate_qualification(entry, host, device)
    if (manifest.get("qualification_policy_version") != POLICY_VERSION
            or manifest.get("schema_version") != "2.0" or not result["release_id"]):
        policy = {"eligible": False, "blocked_reason": "qualification_required",
                  "firmware_update_note": UNVALIDATED_NOTE, "qualification_policy_version": POLICY_VERSION}
    current = result["current_firmware"]
    if policy.get("eligible") and not canonical_pci(device):
        policy = {"eligible": False, "blocked_reason": "adapter_identity_unknown",
                  "firmware_update_note": "The selected PCI adapter could not be identified. Refresh inventory before updating.",
                  "qualification_policy_version": POLICY_VERSION}
    if policy.get("eligible") and (not current or current.lower() in ("unknown", "n/a", "not available")):
        policy = {"eligible": False, "blocked_reason": "current_firmware_unknown",
                  "firmware_update_note": "The running firmware could not be identified. Refresh inventory before updating.",
                  "qualification_policy_version": POLICY_VERSION}
    sources = entry.get("upgrade_from", "")
    if policy.get("eligible") and sources and current.split()[0] != result["latest_firmware"]:
        if not isinstance(sources, str) or not any(
                current.startswith(prefix.strip()) for prefix in sources.split(",") if prefix.strip()):
            policy = {"eligible": False, "blocked_reason": "upgrade_path_unvalidated",
                      "firmware_update_note": UNVALIDATED_NOTE, "qualification_policy_version": POLICY_VERSION}
    result.update(policy)
    result["flashable"] = result["flashable"] and policy.get("eligible") is True
    return result


def load_current_catalog():
    checker = runpy.run_path(str(SCRIPT_DIR / "firmware-check"))
    manifest = checker["load_manifest"]()
    if not manifest:
        raise UpdateNotQualified("The current signed firmware catalog could not be verified. Refresh and try again.")
    return manifest, checker["match_device_to_manifest"], checker["compare_firmware"]


def discover_live_devices(device_type):
    discover = runpy.run_path(str(SCRIPT_DIR / "firmware-discover"))
    devices = discover["discover_nic" if device_type == "nic" else "discover_hba"]()
    for device in devices:
        details = pci_identity(device)
        # ethtool can report a driver version when sysfs does not expose one.
        for key, value in details.items():
            if value:
                device[key] = value
    return devices


def authorize_device(cached):
    """Recheck the catalog, adapter identity, firmware, and host before flashing."""
    if cached.get("type") not in QUALIFIED_TYPES:
        return cached
    blocked = nic_update_block_reason(cached)
    if blocked:
        raise UpdateNotQualified(blocked)
    if not cached.get("release_id") or not cached.get("release_revision"):
        raise UpdateNotQualified("Firmware qualification information is missing. Refresh firmware inventory before updating.")
    target = canonical_pci(cached)
    if not target:
        raise UpdateNotQualified("Cannot identify the selected PCI adapter; update refused.")
    manifest, match_entry, compare = load_current_catalog()
    live = next((device for device in discover_live_devices(cached["type"])
                 if canonical_pci(device) == target), None)
    if live is None:
        raise UpdateNotQualified("The selected adapter is no longer present in live inventory.")
    for key in ("serial", "permanent_mac", "pci_vendor", "pci_device", "pci_subsystem_vendor", "pci_subsystem_device"):
        if cached.get(key) and cached[key] != live.get(key):
            raise UpdateNotQualified("The selected adapter identity changed. Refresh firmware inventory before updating.")
    if cached.get("current_firmware") != live.get("firmware"):
        raise UpdateNotQualified("The running firmware changed. Refresh and review the current update.")
    blocked = nic_update_block_reason(live)
    if blocked:
        raise UpdateNotQualified(blocked)
    entry = match_entry(live, manifest)
    if not entry or entry.get("release_id") != cached["release_id"]:
        raise UpdateNotQualified("This firmware release is no longer available for the selected adapter.")
    bound = bind_release(live, entry, manifest, get_host_environment())
    if bound["release_revision"] != cached["release_revision"]:
        raise UpdateNotQualified("The firmware release changed. Refresh and review the current update before proceeding.")
    if not bound.get("eligible"):
        raise UpdateNotQualified(bound.get("firmware_update_note", UNVALIDATED_NOTE))
    if bound["flash_tool"].lower() == "niccli":
        major = re.search(r"(?:^|pkg\s+)(\d+)\.", bound["current_firmware"])
        if major is None or int(major.group(1)) < 228:
            raise UpdateNotQualified("This Broadcom firmware cannot be updated using niccli; contact 45Drives support.")
    if compare(bound["current_firmware"], bound["latest_firmware"]) != "outdated":
        raise UpdateNotQualified("The selected adapter does not require this firmware update. Refresh inventory.")
    bound["cache_index"] = cached.get("cache_index")
    bound["update_available"] = "outdated"
    return bound
