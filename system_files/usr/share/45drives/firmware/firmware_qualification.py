"""Qualification contract shared by FirmwareAdmin and the firmware client.

Missing qualification is never permission to flash. Keep this file identical
in both projects; it intentionally has no host, network, or Flask dependencies.
"""

import hashlib
import json
import re


QUALIFIED_TYPES = ("nic", "hba")
RELEASE_STATUSES = ("draft", "approved", "withdrawn")
UPDATE_METHODS = ("self_service", "support_assisted")
UNVALIDATED_NOTE = "No validated firmware update available for this configuration."
POLICY_VERSION = 1


def release_id(category, entry):
    identity = category + ":" + str(entry.get("model_match", ""))
    return category + "-" + hashlib.sha256(identity.encode("utf-8")).hexdigest()[:20]


def release_revision(entry, flash_tools):
    payload = json.dumps({"entry": entry, "flash_tools": flash_tools},
                         sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _strings(value, field, pattern=None):
    if not isinstance(value, list) or not value or len(value) > 64:
        raise ValueError(field + " must be a nonempty list of strings")
    for item in value:
        if (not isinstance(item, str) or not item or len(item) > 128
                or item != item.strip() or (pattern and not re.fullmatch(pattern, item))):
            raise ValueError("Invalid " + field)


def validate_profiles(profiles):
    if not isinstance(profiles, list) or len(profiles) > 64:
        raise ValueError("validation_profiles must be a list (maximum 64 profiles)")
    seen = set()
    for profile in profiles:
        if not isinstance(profile, dict):
            raise ValueError("Each validation profile must be an object")
        profile_id = profile.get("id")
        if (not isinstance(profile_id, str)
                or not re.fullmatch(r"[a-z0-9][a-z0-9._-]{0,95}", profile_id)
                or profile_id in seen):
            raise ValueError("Validation profiles require unique IDs")
        seen.add(profile_id)
        if profile.get("qualification") != "45drives_validated":
            raise ValueError("Only 45Drives-tested profiles may enable customer updates")
        report = profile.get("test_report_id")
        if not isinstance(report, str) or not report.strip() or len(report) > 512:
            raise ValueError("Each profile requires a test_report_id")
        os_info = profile.get("os")
        if not isinstance(os_info, dict):
            raise ValueError("Each profile requires structured OS information")
        if not isinstance(os_info.get("id"), str) or not re.fullmatch(
                r"[a-z0-9][a-z0-9._-]{0,63}", os_info["id"]):
            raise ValueError("Use an OS ID such as rocky, ubuntu, or proxmox")
        _strings(os_info.get("version_ids"), "OS version_ids", r"[0-9]+(?:\.[0-9]+)*")
        if os_info.get("architecture") != "x86_64":
            raise ValueError("Firmware validation profiles must use x86_64")
        if "kernel_releases" in profile:
            _strings(profile["kernel_releases"], "kernel_releases")
        if "driver" in profile:
            driver = profile["driver"]
            if not isinstance(driver, dict) or not isinstance(driver.get("name"), str) or not re.fullmatch(
                    r"[a-zA-Z0-9_-]+", driver["name"]):
                raise ValueError("Invalid driver requirement")
            _strings(driver.get("versions"), "driver versions")
    return profiles


def validate_release(entry):
    if entry.get("release_status", "draft") not in RELEASE_STATUSES:
        raise ValueError("Invalid release_status")
    if entry.get("update_method", "support_assisted") not in UPDATE_METHODS:
        raise ValueError("Invalid update_method")
    profiles = validate_profiles(entry.get("validation_profiles", []))
    if entry.get("release_status") == "approved":
        if not profiles:
            raise ValueError("Approval requires at least one tested OS profile")
        if not entry.get("latest_firmware"):
            raise ValueError("Approval requires a target firmware version")
        if not entry.get("flash_tool"):
            raise ValueError("Approval requires an update tool")
        if not ((entry.get("firmware_file") and entry.get("sha256"))
                or (entry.get("tool_package") and entry.get("tool_package_sha256"))):
            raise ValueError("Approval requires a firmware image or tool package with its SHA256")
        if entry.get("tool_package"):
            command = entry.get("flash_command")
            if not isinstance(command, str) or not command.strip():
                raise ValueError("Approval requires a flash command for tool packages")
        for path, digest in (("firmware_file", "sha256"), ("tool_package", "tool_package_sha256")):
            if entry.get(path) and (not isinstance(entry.get(digest), str)
                                    or not re.fullmatch(r"[0-9a-fA-F]{64}", entry[digest])):
                raise ValueError("Approval requires a valid SHA256 for " + path)


def evaluate_qualification(entry, host, device=None):
    """Match complete profiles; never inherit support through ID_LIKE."""
    def denied(reason, note=UNVALIDATED_NOTE):
        return {"eligible": False, "blocked_reason": reason, "firmware_update_note": note,
                "qualification_policy_version": POLICY_VERSION}

    try:
        validate_release(entry)
    except (ValueError, TypeError):
        return denied("qualification_invalid")
    if entry.get("release_status") != "approved":
        return denied("release_" + entry.get("release_status", "draft"))
    if entry.get("update_method") != "self_service":
        return denied("support_assisted", "Firmware updates for this device require support assistance.")
    if entry.get("flashable") is not True:
        return denied("release_not_flashable")
    os_info = host.get("os", {})
    for profile in entry.get("validation_profiles", []):
        expected = profile["os"]
        if (os_info.get("id") != expected["id"]
                or os_info.get("version_id") not in expected["version_ids"]
                or host.get("architecture") != expected["architecture"]):
            continue
        if "kernel_releases" in profile and host.get("kernel_release") not in profile["kernel_releases"]:
            continue
        driver = profile.get("driver")
        if driver and (not device or device.get("driver") != driver["name"]
                       or device.get("driver_version") not in driver["versions"]):
            continue
        return {"eligible": True, "qualification_profile_id": profile["id"],
                "qualification": "45drives_validated", "qualification_policy_version": POLICY_VERSION}
    return denied("os_unvalidated")


PAYLOAD_FIELDS = ("firmware_file", "sha256", "tool_package", "tool_package_sha256")


def build_catalog(source):
    """Build the single published manifest.json.

    NIC/HBA entries carry qualification fields for current clients. Clients
    released before qualification ignore those fields, so any NIC/HBA release
    that is not approved for self-service is published with flashable=false and
    no firmware payload: older clients cannot flash drafts, withdrawn, or
    support-assisted releases. (Older clients do not check the OS.)
    """
    catalog = json.loads(json.dumps(source))
    catalog["schema_version"] = "2.0"
    catalog["qualification_policy_version"] = POLICY_VERSION
    for category in QUALIFIED_TYPES:
        for entry in catalog.get("components", {}).get(category, []):
            entry.setdefault("release_id", release_id(category, entry))
            entry.setdefault("release_status", "draft")
            entry.setdefault("update_method", "support_assisted")
            entry.setdefault("validation_profiles", [])
            validate_release(entry)
            if not (entry["release_status"] == "approved"
                    and entry["update_method"] == "self_service"):
                entry["flashable"] = False
                for field in PAYLOAD_FIELDS:
                    entry.pop(field, None)
    return catalog
