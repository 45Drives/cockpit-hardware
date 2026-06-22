# 45Drives Firmware Lifecycle Management

Keep supported HBA controllers and network cards current through a guided, validated workflow in Cockpit.

---

## Customer Value

Firmware maintenance is easy to postpone. It often means searching vendor portals, matching files to exact hardware revisions, learning vendor-specific command-line tools, and scheduling a maintenance window with incomplete visibility into risk.

45Drives simplifies that workflow for supported hardware. The firmware update experience is built into the same Cockpit interface customers already use to manage their systems, with discovery, version comparison, preflight review, verified downloads, guided flashing, and reboot tracking in one place.

For this release, one-click firmware updates are focused on qualified HBA and NIC devices.

---

## What It Does Today

### Hardware Discovery

The system inventories firmware-relevant hardware and compares discovered versions against the 45Drives firmware catalog.

Current one-click update support includes:

- **HBA controllers** - Broadcom 9305, 9361, 9400, 9600, and 9660 series
- **Network cards** - NVIDIA/Mellanox ConnectX-5 and ConnectX-6
- **Network cards** - Broadcom NetXtreme BCM57416 and BCM57504
- **Network cards** - Intel E810 series

Other device classes may be visible for inventory or future expansion, but drive, NVMe, BIOS, and BMC flashing are not exposed in this release.

### Proactive Notifications

Customers can see firmware status without manually checking vendor sites:

- Cockpit sidebar badge when updates are available
- Reboot-required indication when a pending update needs activation
- Daily automatic checks through the firmware check service
- Status refresh after update and reboot

### Guided Updates

Administrators can apply supported firmware updates from the browser:

1. Open the **System** page in Cockpit.
2. Review devices with available updates.
3. Open **Info** for version details and release notes.
4. Click **Update** and review the preflight summary.
5. Type `confirm flash` to proceed.
6. Watch real-time progress output.
7. Reboot during a maintenance window when activation is required.

This is not a forced or automatic update system. Customers remain in control of when updates are applied.

### Verified Firmware Supply Chain

Firmware metadata and payloads are verified before use:

- Firmware catalog signature verification
- SHA256 checks for firmware payloads
- SHA256 checks for flash tools that run with elevated privileges
- Automatic refusal when expected signatures or hashes do not match

This design reduces the risk of using incorrect or tampered files from the firmware repository.

### Operational Safeguards

The workflow includes guardrails that help reduce common firmware update risks.

| Safeguard | Customer Benefit |
|-----------|------------------|
| Preflight summary | Shows target device, actions, and downloads before flashing |
| Explicit confirmation | Requires `confirm flash` before an update starts |
| Compatibility metadata | Helps ensure the update path is valid for the current firmware |
| Real-time log output | Lets administrators and support see exactly what happened |
| Reboot tracking | Shows when a reboot is needed to activate firmware |
| Audit logging | Records flash attempts and outcomes for support and compliance review |

---

## Why Customers Care

### For IT Administrators

- Spend less time searching vendor portals and update guides
- Reduce manual command-line work during firmware maintenance
- Apply a consistent process across supported 45Drives configurations
- Keep an audit trail of firmware update attempts

### For Operations Teams

- Plan updates around maintenance windows
- See when firmware activation requires a reboot
- Reduce avoidable mistakes caused by manual file and tool selection
- Improve visibility into fleet firmware posture

### For Security Teams

- Verify firmware catalog and payload integrity before use
- Avoid running unverified flash tools as root
- Support controlled environments by preloading firmware files when internet access is unavailable
- Preserve update history for review and support workflows

---

## Differentiation

Traditional firmware workflows often require administrators to move between vendor portals, release notes, model-specific tools, and manual CLI procedures. 45Drives brings the qualified update path into Cockpit.

| Capability | 45Drives Workflow | Traditional Manual Workflow |
|-----------|-------------------|-----------------------------|
| Firmware status visibility | Built into Cockpit | Manual inventory and lookup |
| Qualified catalog | 45Drives-tested firmware metadata | Administrator must select files |
| Update process | Guided browser workflow | Vendor-specific tools and commands |
| File verification | Signature and checksum checks | Varies by vendor and process |
| Tool management | Required tools delivered with the catalog | Separate downloads and setup |
| Reboot tracking | Shown in the UI | Manually tracked |
| Audit trail | Flash attempts logged | Often external or manual |

---

## Current Support

### One-Click Firmware Updates

| Component | Qualified Models | Status |
|-----------|------------------|--------|
| **HBA controllers** | Broadcom 9305-16i, 9305-24i, 9361-16i, 9361-24i, 9400-16i, 9600-16i, 9600-24i, 9660-16i | Supported |
| **NVIDIA/Mellanox NICs** | ConnectX-5, ConnectX-6 | Supported |
| **Broadcom NICs** | BCM57416, BCM57504 NetXtreme | Supported |
| **Intel NICs** | E810 series | Supported |

### Not Exposed For One-Click Flashing In This Release

- HDD firmware updates
- NVMe firmware updates
- BIOS/UEFI updates
- BMC/IPMI updates

These categories may be inventoried or considered for future releases, but the current customer-facing update workflow is scoped to HBA and NIC devices.

---

## Frequently Asked Questions

### Is internet access required?

No. Systems can operate in controlled or air-gapped environments when firmware files and tools are preloaded. When internet access is available, supported systems can fetch qualified firmware and tools from the configured 45Drives firmware repository.

### Does the system install firmware automatically?

No. It checks for updates and guides the administrator through the process. Firmware is only flashed after an administrator reviews the summary and types `confirm flash`.

### What happens if a reboot is required?

The UI tracks devices that need a reboot for activation and shows a reboot-required state. Customers should reboot during a planned maintenance window.

### What happens if power is lost during a flash?

Recovery behavior depends on the device and vendor firmware design. The workflow warns administrators not to power off during a flash and records the update output so 45Drives support can help troubleshoot failures.

### Can customers update firmware across an entire fleet at once?

The current Cockpit workflow updates one server at a time. Fleet orchestration can be handled through external automation in the future, using the same catalog and tooling concepts.

### How quickly are new firmware versions available?

45Drives publishes firmware after qualification on supported 45Drives hardware. Timing depends on vendor release scope, validation effort, and customer impact.

### Does it work with non-45Drives hardware?

The workflow is designed for 45Drives-qualified configurations. Hardware outside the firmware catalog may be detected, but update availability is only shown for cataloged, supported devices.

### Can a customer stay on an older firmware version?

Yes. The system notifies and guides; it does not force updates.

---

## Sales Talking Points

> "45Drives firmware lifecycle management gives customers a guided way to keep supported HBA and NIC firmware current from Cockpit, without hunting through vendor portals or running complex manual flash procedures."

> "The value is not just convenience. The workflow uses 45Drives-qualified firmware metadata, signature checks, payload checksums, preflight review, real-time logs, and reboot tracking to reduce operational risk."

> "Customers stay in control. The system notifies them when updates are available, shows what will happen, requires explicit confirmation, and lets them schedule activation reboots around their maintenance windows."

> "For the current release, the customer-facing update workflow is intentionally scoped to HBA controllers and network cards. That focused scope helps us deliver a cleaner, safer experience for the devices that most often require vendor-specific firmware tooling."
