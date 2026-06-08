# Firmware Management Project — Project DNA

---

## 1. WHO

Stakeholders & Contributors:

- Brett Kelly
- Rachit Hans
- Andrew MacAdam
- Austin Auxworthy
---

## 2. WHY — The Problem We're Solving

Customers have no visibility into firmware versions on their servers. They don't know when updates exist until something breaks.

**What we're building:** A Houston module that lists all devices, shows current firmware, notifies of available updates, and allows safe updates from the UI.

**Key rule:** Risky devices (BIOS, BMC) → display only. Safe devices (HBAs, NICs, HDDs, NVMe) → allow update from UI.

**Scope:** Permanent devices (HBAs, NICs, RAID, BIOS, BMC, Seagate HDDs, GPUs).

### Project Goal & Business Impact

**WHAT WE'RE DELIVERING:**

A web interface in Cockpit that shows server admins exactly which firmware versions they have installed and which are outdated. With one click, they can safely update to the latest validated version.
**BUSINESS IMPACT:**

1. **SUPPORT REDUCTION:** Fewer tickets about firmware mismatches or update problems. Customers self-serve instead.
2. **CUSTOMER HAPPINESS:** 2-3 hours of manual work becomes 5 minutes. Admins love that.
3. **SAFETY:** We prevent mistakes (wrong version, interrupted updates) that could damage servers. Reduces liability.
4. **FLEET CONSISTENCY:** Dual-repo sync ensures production and development stay aligned on firmware binaries.

---

## 3. HOW — What We're Building

We're adding a "Firmware" section to the existing 45drives-system Cockpit module. It's like a control panel for server component updates.

**What users see:** A table showing all server components (HBAs, NICs, BIOS, BMC, NVMe, HDDs) with columns: "Current Version" | "Latest Version" | "Status". If everything is up-to-date, they see a checkmark. If updates are available, a button appears. A **sidebar badge** on the 45Drives System tab notifies of pending updates without requiring the user to open the page.

### Architecture

**Hypothesis:** Build a firmware management module within the existing 45drives-system Cockpit Houston UI that follows a manifest-driven, cache-first architecture with phased flash enablement.

### Solution Components:

#### 1. BACKEND — Device Discovery Script (`firmware-discover`)
- Enumerates all permanent hardware using existing CLI tools (storcli, storcli2, mlxup, dmidecode, ipmitool, smartctl, nvme-cli)
- Leverages the existing `pci` script for HBA and NIC detection
- Adds BIOS, BMC, NVMe, HDD, and SAS Expander discovery
- Outputs structured JSON: `[{type, model, vendor, firmware, device_path}]`

#### 2. REPO — Firmware Manifest and Binary Hosting
- `manifest.json` at `repo.45drives.com/firmware/manifest.json`
- Schema covers 8 component categories: HBA, NIC, BIOS, BMC, Expander, NVMe, HDD, GPU
- Per-entry fields: model_match (regex), vendor, latest_firmware, flash_tool, flash_command, flashable, requires_reboot, firmware_file, sha256
- Firmware binaries hosted alongside manifest

#### 3. BACKEND — Version Comparison and Caching (`firmware-check`)
- Fetches manifest, runs discovery, compares versions
- Writes atomic cache to `/var/cache/45drives/firmware.json`
- Classifies devices as: current, outdated, or unknown
- Handles network failures gracefully (writes partial cache)
- Systemd timer (`45d-firmware-check.timer`) runs daily with `RandomizedDelaySec=12h`

#### 4. BACKEND — Flash Runner (`firmware-flash`)
- Validates manifest entry, resolves tool paths
- Downloads firmware binary with SHA256 verification
- Executes flash command with proper arguments
- Returns JSON result with status, stdout, stderr, reboot_needed

#### 5. FRONTEND — Sidebar Badge Notification
- Preloads on Cockpit start (no need to open the page)
- Reads firmware cache and sets page_status badge:
  - 🔴 **Error badge:** Reboot required to complete firmware update
  - 🟡 **Warning badge:** X firmware update(s) available
  - ✅ **No badge:** Everything current

#### 6. FRONTEND — Firmware Table UI
- FirmwareTable.vue component reading from cache
- Status badges, refresh button, manual update instructions modal
- Integration into 45drives-system SectionContainer

#### 7. HDD FIRMWARE — Seagate Exos via SeaChest

**Supported Drives:** Exos X18, X20, X22, X24, 2X18 (SAS & SATA variants)

**Flash Tool:** `SeaChest_Firmware`  
**Flash Command:** `SeaChest_Firmware --device /dev/sgX --downloadFW /path/to/firmware.LOD`  
**Reboot Required:** No (live microcode download)

**Notes:**
- Uses `/dev/sgX` (SCSI generic) paths, not `/dev/sdX`
- LOD files sourced from Seagate support (not publicly downloadable)
- Different firmware for SAS vs SATA variants of same model
- Some drives require minimum firmware version before upgrade (chain flash)

#### 8. DUAL-REPO SYNC
- Sync firmware binaries between `cockpit-hardware` and `productionScripts` repos
- Single source of truth with SHA256 verification
- Script-based or CI-triggered sync on manifest update

---

## 4. UNCERTAINTIES — Known Risks & Open Questions

**TECHNICAL RISKS:**

| Risk | Mitigation |
|------|-----------|
| Scanner misses components on older hardware revisions | Graceful fallback — report "unknown" rather than crash |
| Flash tool failures vary by vendor | Per-tool error handling, capture full stdout/stderr |
| HDD flash during active I/O could cause data loss | Pre-flight checks: ZFS scrub/rebuild detection, mount check |
| Network unreachable during manifest fetch | Cache continues to show last-known state, badge shows stale warning |
| Dual-repo drift (firmware mismatch between repos) | SHA256 verification on sync, drift detection script |

**OPEN QUESTIONS:**

1. ~~Will the scanner find ALL server components across all customer hardware?~~ → **Resolved:** Discovery script handles missing tools gracefully, reports what it can find.
2. Should HDD flash require unmounting the drive? → Seagate says hot-flash is supported for Exos, but we add safety warnings.
3. Which repo is authoritative for firmware binaries? → To be decided in Thread 9.
4. Do we need approval workflow for flash operations? → Phase 1 uses explicit user confirmation only.

---

## 5. PROJECT PLAN

| Thread | Description | Effort |
|--------|-------------|--------|
| 1. Audit Existing Scripts | Review discovery + flash tools, identify gaps | 8h |
| 2. Modify Discovery Scripts | `firmware-discover` outputs structured JSON | 8h |
| 3. Manifest & Repo Infrastructure | Schema, initial manifest, hosting | 8h |
| 4. Firmware Check Cache Service | `firmware-check` + systemd timer | 4h |
| 5. UI Integration | FirmwareTable.vue, badges, refresh | 6h |
| 6. Firmware Flash Capability | `firmware-flash` with tool resolution | 8h |
| 7. Packaging & Release | RPM/DEB specs, install testing | 8h |
| 8. HDD Firmware Update | SeaChest integration, batch flash testing | 8h |
| 9. Dual-Repo Firmware Sync | cockpit-hardware ↔ productionScripts sync | 10h |
| 10. Manifest Management & Docs | CLI update tool, validation, process docs | 10h |
| 11. GPG Signing & Integrity | Key generation, manifest signing, SHA256 enforcement, verification in firmware-check/flash | 8h |
| 12. Firmware Admin App | Internal web UI for upload, assign, sign, publish. Smart dropdowns, search, model management | 16h |

**Total: ~102 hours**

---

## 6. END-TO-END MILESTONES

| # | Milestone | Success Criteria |
|---|-----------|------------------|
| 1 | Discovery + Comparison Works | Script scans server, compares against manifest, outputs JSON. All permanent devices detected with correct versions. |
| 2 | Sidebar Badge Notification | Badge appears on 45Drives System tab when updates available or reboot needed. |
| 3 | UI Displays Firmware Status | Open Houston, see firmware table with real data. Table shows all components, versions, update status. |
| 4 | Flash Works End-to-End | Click "Update" on HBA/NIC → firmware flashes successfully. Version changes after flash, no errors. |
| 5 | HDD Flash Validated | Batch flash Exos drives via SeaChest with safety checks. No data loss. |
| 6 | Dual-Repo Sync Working | Add firmware in one repo, sync script propagates to other with SHA256 match. |
| 7 | GPG Manifest Signing + Verification | Manifest is GPG-signed on publish. Customer machines verify signature before trusting remote manifest. Tampered manifests rejected. Missing signatures rejected. |
| 8 | SHA256 Firmware Integrity Enforcement | All firmware downloads verified against SHA256 hash in manifest. Mismatched or missing hashes block flash. Corrupted downloads detected and rejected. |
| 9 | Firmware Admin App (Internal) | Internal web UI for engineers to upload firmware, assign to models, sign manifest, and publish — no CLI or manual JSON editing required. Smart dropdowns auto-fill flash tools/commands from existing manifest data. |
| 10 | Full Release Ready | All components, all flows, packaged and tested. Ready to ship. |

---
