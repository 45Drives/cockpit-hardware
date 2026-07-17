# Firmware Pre-Flash Safety Checks — Test Plan

## Overview

The firmware-flash script performs 8 pre-flight safety checks before allowing an HDD firmware update. These checks run in both `--preflight` (JSON output for UI) and actual flash mode (hard-block with exit code 4).

**Test Environment Requirements:**
- Node with ZFS pools (e.g. 192.168.207.11)
- Node with Ceph OSDs (e.g. 192.168.5.115)
- Seagate HDD drives with outdated firmware in the cache
- Cockpit UI accessible on the test nodes

**How to run preflight manually:**
```bash
python3 /usr/share/45drives/firmware/firmware-flash --cache-index <N> --preflight
```

**How to refresh the firmware cache:**
```bash
python3 /usr/share/45drives/firmware/firmware-check
```

---

## Test Cases

### TC-01: ZFS Pool — Imported (BLOCK)

| Field | Value |
|-------|-------|
| **Precondition** | Drive is a member of an imported zpool |
| **Steps** | 1. Ensure pool is imported: `zpool list`<br>2. Identify a drive in the pool: `zpool status -P`<br>3. Run preflight on that drive's cache index |
| **Expected** | `blocked: true`, warning with severity "error", message mentions pool name, action says "zpool export \<pool\>" |
| **Verify in UI** | Click "Update" → modal shows red blocked message with pool name |

---

### TC-02: ZFS Pool — Exported (ALLOW)

| Field | Value |
|-------|-------|
| **Precondition** | Drive was in a pool that is now exported |
| **Steps** | 1. Export the pool: `zpool export <pool>`<br>2. Run preflight on the same drive |
| **Expected** | `blocked: false`, no ZFS warnings (even though `blkid` still shows `zfs_member` on the partition) |
| **Cleanup** | Re-import: `zpool import <pool>` |

---

### TC-03: ZFS — No zpool Binary (BLOCK on zfs_member)

| Field | Value |
|-------|-------|
| **Precondition** | `zpool` binary not available but partitions have `zfs_member` superblock |
| **Steps** | 1. Temporarily rename zpool: `mv /usr/sbin/zpool /usr/sbin/zpool.bak`<br>2. Run preflight on a drive with ZFS partitions<br>3. Restore: `mv /usr/sbin/zpool.bak /usr/sbin/zpool` |
| **Expected** | `blocked: true`, warning says "(unknown pool)" |

---

### TC-04: Ceph OSD — UP (BLOCK)

| Field | Value |
|-------|-------|
| **Precondition** | Drive is backing a Ceph OSD that is currently running |
| **Steps** | 1. Verify OSD is active: `systemctl is-active ceph-osd@<id>`<br>2. Run preflight on that drive |
| **Expected** | `blocked: true`, warning mentions OSD ID, action says "ceph osd out \<id\> && systemctl stop ceph-osd@\<id\>" |
| **Verify in UI** | Red blocked message with OSD ID |

---

### TC-05: Ceph OSD — DOWN (ALLOW + LVM Exempt)

| Field | Value |
|-------|-------|
| **Precondition** | Drive is backing a Ceph OSD that is stopped |
| **Steps** | 1. Stop OSD: `systemctl stop ceph-osd@<id>`<br>2. Run preflight on that drive |
| **Expected** | `blocked: false`, info-level warning "Drive is Ceph OSD.\<id\> (currently DOWN — safe to flash)", **NO** LVM block for the Ceph VG |
| **Cleanup** | Restart OSD: `systemctl start ceph-osd@<id>` |

---

### TC-06: Ceph OSD DOWN but Non-Ceph LVM Active (BLOCK)

| Field | Value |
|-------|-------|
| **Precondition** | OSD is stopped but drive also has a non-Ceph VG with active LVs |
| **Steps** | 1. Stop OSD<br>2. Create a separate VG/LV on another partition of the same drive<br>3. Run preflight |
| **Expected** | `blocked: true` on LVM (non-Ceph VG), Ceph VG exempted |
| **Note** | Edge case — only test if environment allows |

---

### TC-07: Mounted Filesystem (BLOCK)

| Field | Value |
|-------|-------|
| **Precondition** | A partition on the drive is mounted |
| **Steps** | 1. Mount a partition: `mount /dev/sdX1 /mnt/test`<br>2. Run preflight on that drive |
| **Expected** | `blocked: true`, warning mentions mountpoint and fstype, action says "umount" |
| **Cleanup** | `umount /mnt/test` |

---

### TC-08: Mounted Filesystem — Unmounted (ALLOW)

| Field | Value |
|-------|-------|
| **Precondition** | Partition was mounted but is now unmounted |
| **Steps** | 1. Ensure nothing on the drive is mounted: `findmnt | grep sdX`<br>2. Run preflight |
| **Expected** | `blocked: false`, no mount warnings |

---

### TC-09: MD RAID Membership (BLOCK)

| Field | Value |
|-------|-------|
| **Precondition** | Drive or partition is in a Linux software RAID array |
| **Steps** | 1. Verify: `cat /proc/mdstat`<br>2. Run preflight on that drive |
| **Expected** | `blocked: true`, warning mentions the md array device |

---

### TC-10: LVM Physical Volume — Active VG (BLOCK)

| Field | Value |
|-------|-------|
| **Precondition** | Drive is an LVM PV in an active Volume Group |
| **Steps** | 1. Verify: `pvs` shows the drive with an active VG<br>2. Run preflight |
| **Expected** | `blocked: true`, warning mentions VG name, action says "vgchange -an \<vg\>" |

---

### TC-11: LVM Physical Volume — Inactive VG (ALLOW)

| Field | Value |
|-------|-------|
| **Precondition** | Drive is an LVM PV but VG is deactivated |
| **Steps** | 1. Deactivate VG: `vgchange -an <vg>`<br>2. Run preflight |
| **Expected** | `blocked: false`, no LVM warning |
| **Cleanup** | `vgchange -ay <vg>` |

---

### TC-12: Swap Active (BLOCK)

| Field | Value |
|-------|-------|
| **Precondition** | A partition on the drive is active swap |
| **Steps** | 1. Enable swap: `swapon /dev/sdX2`<br>2. Run preflight |
| **Expected** | `blocked: true`, warning mentions the swap device, action says "swapoff" |
| **Cleanup** | `swapoff /dev/sdX2` |

---

### TC-13: Swap Disabled (ALLOW)

| Field | Value |
|-------|-------|
| **Precondition** | No swap on the drive |
| **Steps** | 1. Verify: `cat /proc/swaps | grep sdX` returns nothing<br>2. Run preflight |
| **Expected** | `blocked: false`, no swap warning |

---

### TC-14: Hardware RAID — Drive in VD (BLOCK)

| Field | Value |
|-------|-------|
| **Precondition** | Drive is part of a RAID Virtual Disk (not JBOD) behind a MegaRAID/SAS3 controller |
| **Steps** | 1. Verify with storcli: `storcli64 /call/eall/sall show`<br>2. Run preflight on that drive |
| **Expected** | `blocked: true`, warning says "RAID virtual disk" |

---

### TC-15: Hardware RAID — JBOD Mode (ALLOW)

| Field | Value |
|-------|-------|
| **Precondition** | Drive is in JBOD/passthrough mode |
| **Steps** | 1. Verify drive state is JBOD in storcli<br>2. Run preflight |
| **Expected** | `blocked: false` (RAID check passes) |

---

### TC-16: upgrade_from — Compatible FW (ALLOW)

| Field | Value |
|-------|-------|
| **Precondition** | Drive's current FW is in the manifest's `upgrade_from` list |
| **Steps** | 1. Check device cache: current_firmware matches one of the upgrade_from prefixes<br>2. Attempt flash |
| **Expected** | Flash proceeds (no upgrade_from block) |

---

### TC-17: upgrade_from — Incompatible FW (BLOCK)

| Field | Value |
|-------|-------|
| **Precondition** | Drive's current FW is NOT in the `upgrade_from` list |
| **Steps** | 1. Manually edit cache to set current_firmware to an unsupported version<br>2. Attempt flash |
| **Expected** | Exit code 5, message: "Current firmware 'XX' is not compatible with this upgrade" |

---

### TC-18: No Blockers — Clean Flash (ALLOW)

| Field | Value |
|-------|-------|
| **Precondition** | Drive has no storage membership (no ZFS, Ceph, mount, MD, LVM, swap) |
| **Steps** | 1. Run preflight<br>2. Verify `blocked: false` and warnings is empty or info-only<br>3. Flash from UI |
| **Expected** | Preflight passes, flash succeeds, firmware version updates |

---

### TC-19: Device Matching — /dev/sda vs /dev/sdaa (NO FALSE POSITIVE)

| Field | Value |
|-------|-------|
| **Precondition** | System has both /dev/sda and /dev/sdaa (or similar) |
| **Steps** | 1. Create a ZFS pool on /dev/sdaa1<br>2. Run preflight on /dev/sda |
| **Expected** | /dev/sda is NOT blocked (no false match against /dev/sdaa) |

---

## Revert Tests

### TC-20: Revert — Single Drive (from UI)

| Field | Value |
|-------|-------|
| **Precondition** | Drive is at latest firmware, has `previous_firmware_file` set in cache |
| **Steps** | 1. In Cockpit UI, find the "Up-to-date HDDs (revert available)" section<br>2. Click "↩ Revert" on a drive<br>3. Confirm the prompt |
| **Expected** | Flash progress modal shows SeaChest output, revert succeeds, drive shows as "outdated" after refresh |

---

### TC-21: Revert — Revert All (from UI)

| Field | Value |
|-------|-------|
| **Precondition** | Multiple drives are at latest firmware with previous_firmware_file set |
| **Steps** | 1. Click "↩ Revert All" button<br>2. Confirm |
| **Expected** | All drives reverted sequentially, alert shows success count |

---

### TC-22: Revert — No Previous Firmware (NO BUTTON)

| Field | Value |
|-------|-------|
| **Precondition** | Drive model has no `previous_firmware_file` in manifest |
| **Steps** | 1. Check UI for that drive |
| **Expected** | No "↩ Revert" button shown for that device |

---

### TC-23: Revert — CLI Direct

| Field | Value |
|-------|-------|
| **Precondition** | Drive with previous firmware configured |
| **Steps** | 1. Run: `python3 /usr/share/45drives/firmware/firmware-revert --cache-index <N>` |
| **Expected** | Downloads previous firmware, flashes via SeaChest, prints "✓ Revert successful" |

---

## UI Tests

### TC-24: UI — Blocked Modal Display

| Field | Value |
|-------|-------|
| **Steps** | 1. Click "Update" on a blocked drive (ZFS/Ceph/mount)<br>2. Observe the confirmation modal |
| **Expected** | Red "🚫 Flash Blocked" box shown, "Proceed with Flash" button hidden, only "Close" available |

---

### TC-25: UI — Warning with Info Severity

| Field | Value |
|-------|-------|
| **Steps** | 1. Stop a Ceph OSD<br>2. Click "Update" on that drive |
| **Expected** | Blue info box: "Drive is Ceph OSD.\<id\> (currently DOWN — safe to flash)", flash allowed |

---

### TC-26: UI — Confirm Flash Input

| Field | Value |
|-------|-------|
| **Steps** | 1. Click "Update" on a non-blocked drive<br>2. Type "confirm flash" in the input<br>3. Click "Proceed with Flash" |
| **Expected** | Button enables only when text matches exactly, flash starts after click |

---

## Pass/Fail Summary

| TC | Description | Pass/Fail | Tester | Date | Notes |
|----|-------------|-----------|--------|------|-------|
| TC-01 | ZFS Imported → Block | | | | |
| TC-02 | ZFS Exported → Allow | | | | |
| TC-03 | No zpool binary → Block | | | | |
| TC-04 | Ceph OSD UP → Block | | | | |
| TC-05 | Ceph OSD DOWN → Allow | | | | |
| TC-06 | Ceph DOWN + non-Ceph LVM → Block | | | | |
| TC-07 | Mounted FS → Block | | | | |
| TC-08 | Unmounted → Allow | | | | |
| TC-09 | MD RAID → Block | | | | |
| TC-10 | LVM Active VG → Block | | | | |
| TC-11 | LVM Inactive VG → Allow | | | | |
| TC-12 | Swap Active → Block | | | | |
| TC-13 | Swap Disabled → Allow | | | | |
| TC-14 | HW RAID VD → Block | | | | |
| TC-15 | HW RAID JBOD → Allow | | | | |
| TC-16 | upgrade_from Compatible → Allow | | | | |
| TC-17 | upgrade_from Incompatible → Block | | | | |
| TC-18 | Clean Flash (no blockers) | | | | |
| TC-19 | No sda/sdaa false positive | | | | |
| TC-20 | Revert Single Drive | | | | |
| TC-21 | Revert All | | | | |
| TC-22 | No Revert Button (no prev FW) | | | | |
| TC-23 | Revert CLI | | | | |
| TC-24 | UI Blocked Modal | | | | |
| TC-25 | UI Info Warning (Ceph DOWN) | | | | |
| TC-26 | UI Confirm Flash Input | | | | |
