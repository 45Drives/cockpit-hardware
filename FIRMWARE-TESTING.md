# Firmware Update Module — Testing Guide

## Test Environment

- **Test machine:** 192.168.207.11 (Rocky Linux 8)
- **Cockpit URL:** https://192.168.207.11:9090/cockpit-hardware/45drives-system
- **Branch:** `firmware-update-testing`

## How It Works

1. Click the **refresh** (🔄) button on the Firmware Updates card
2. Backend runs `firmware-check` → discovers hardware, compares against manifest
3. Outdated devices appear in a table with **Update** buttons
4. Click **Update** → pre-flash safety checks run → confirmation modal appears
5. Type `confirm flash` → firmware downloads (if needed) → flash executes with live log
6. Post-flash verification confirms the new firmware version

---

## Test Scenarios

### 1. Basic Flash (Happy Path)

**Steps:**
1. Find any HDD with "Update Available" badge (SN03 → SN04)
2. Click **Update**
3. Wait for pre-flash check (should show green "Drive is idle" or blue info)
4. Type `confirm flash` and click **Proceed with Flash**
5. Watch the live log — should show SeaChest output and end with ✓

**Expected:**
- Flash succeeds (~5 seconds)
- Post-flash shows: ✓ Verified firmware, ✓ SMART PASSED, ✓ serial confirmed
- Drive disappears from outdated list
- Drive appears in "Up-to-date HDDs" revert section at the bottom

---

### 2. Revert (Reset Drive for Re-Testing)

**Steps:**
1. After flashing a drive, scroll down to "Up-to-date HDDs" section
2. Click **↩ Revert** on a specific drive, OR click **↩ Revert All**
3. Confirm the browser dialog
4. Wait for completion alert

**Expected:**
- Drive firmware goes back to SN03
- Drive reappears in the outdated list after auto-refresh
- Ready to test again

**Supported models for revert:** ST6000NM019B, ST4000NM024B, ST10000NM017B, ST8000NM017B, ST16000NM001G, ST12000NM001G, ST4000NM002A, ST6000NM021A

---

### 3. Pre-Flash Safety: Drive in ZFS Pool (Redundant)

**Steps:**
1. Find a drive that's part of `testpool-mirror` or `testpool-raidz2` (e.g., sdg, sdb, sdn, sdq, sdu, sdam)
2. Click **Update**

**Expected:**
- Blue info box: "Safe to proceed"
- Message: "Drive is part of ZFS pool: testpool-mirror (redundant — pool will remain online)"
- Flash button is enabled

---

### 4. Pre-Flash Safety: Drive in Single-Drive Pool (No Redundancy)

**Steps:**
1. Find `sdal` (part of `testpool-single`)
2. Click **Update**

**Expected:**
- Blue info box: "Safe to proceed"
- Message: "Drive is part of ZFS pool: testpool-single (no redundancy)"
- Flash button is enabled (informational only, not blocked)

---

### 5. Pre-Flash Safety: Pool is Scrubbing (BLOCKED)

**Steps:**
1. SSH to .11: `zpool scrub testpool-mirror`
2. Immediately click **Update** on a drive in testpool-mirror (sdg, sdb, or sdn)

**Expected:**
- Red box: "Update blocked"
- Message: "🛑 Drive is in pool 'testpool-mirror' which is scrubbing — wait for it to complete"
- No flash button — only Cancel

**Cleanup:** `zpool scrub -s testpool-mirror` (stop the scrub)

---

### 6. Pre-Flash Safety: Pool is DEGRADED (BLOCKED)

**Steps:**
1. SSH to .11: `zpool offline testpool-raidz2 sdq && zpool offline testpool-raidz2 sdu`
2. Click **Update** on a drive in testpool-raidz2 (e.g., sdam)

**Expected:**
- Red box: "Update blocked"
- Message: "🛑 Drive's vdev (raidz2) in pool 'testpool-raidz2' has no remaining redundancy"
- No flash button

**Cleanup:** `zpool online testpool-raidz2 sdq && zpool online testpool-raidz2 sdu && zpool clear testpool-raidz2`

---

### 7. Pre-Flash Safety: DEGRADED but Has Remaining Redundancy (WARNING)

**Steps:**
1. SSH to .11: `zpool offline testpool-raidz2 sdq` (just one drive)
2. Click **Update** on another drive in testpool-raidz2 (e.g., sdam)

**Expected:**
- Red box: "Caution — drive is in use"
- Message: "⚠️ Drive's vdev (raidz2) is DEGRADED but has remaining redundancy (1 faulted of 5)"
- Flash button shows as **Flash Anyway** (red) — user can override

**Cleanup:** `zpool online testpool-raidz2 sdq && zpool clear testpool-raidz2`

---

### 8. Pre-Flash Safety: Boot Drive (BLOCKED)

**Steps:**
1. If the OS drive shows up in the list, click **Update**

**Expected:**
- Red box: "Update blocked"
- Message: "🛑 Drive is the system boot disk (mounted at: /) — do not flash"

---

### 9. Pre-Flash Safety: MD RAID (BLOCKED)

**Steps:**
1. If any drive is part of an MD RAID array (`/proc/mdstat`), click **Update**

**Expected:**
- Red box: "Update blocked"  
- Message: "🛑 Drive (or a partition) is part of a Linux MD RAID array"

---

### 10. Idle Drive (No Pool, No Mounts)

**Steps:**
1. Find a drive that's not in any pool or mounted (most of the drives)
2. Click **Update**

**Expected:**
- Green box: "Drive is idle"
- Message: "No active I/O, mounts, or storage pools detected. Safe to proceed."

---

### 11. Info Modal

**Steps:**
1. Click the blue ℹ️ button on any device row

**Expected:**
- Modal shows: Type, Model, Serial, Current FW, Latest FW, Family, Flash Tool
- "Update Firmware" button available at bottom

---

### 12. Download-on-Demand

**Steps:**
1. Flash a drive that hasn't been flashed before (firmware not cached locally)

**Expected:**
- Pre-flash modal shows amber "Downloads required from firmware repo" box
- Flash log shows download progress with SHA256 verification
- Flash proceeds after download

---

### 13. Scrub on ANOTHER Pool (Not Blocked)

**Steps:**
1. SSH to .11: `zpool scrub testpool-raidz2`
2. Click **Update** on a drive in `testpool-mirror`

**Expected:**
- Blue info box (not red): "A ZFS operation is running on another pool (drive not affected)"
- Flash allowed

**Cleanup:** `zpool scrub -s testpool-raidz2`

---

## Test Pools on .11

| Pool | Type | Drives |
|------|------|--------|
| testpool-mirror | 3-way mirror | sdg, sdb, sdn |
| testpool-raidz2 | raidz2 (5 drives) | sdq, sdu, sdam, sdai, sdt |
| testpool-single | single drive (no redundancy) | sdal |

---

## Known Limitations

- **Revert only works for specific models** — drives must have SN03 LOD files available
- **Revert button is testing-only** — will be removed before production
- **ST12000NM0007** (Exos X12) can be flashed forward but NOT reverted (no old firmware LOD available)
- **HBA/NIC flashing** — no pre-flash safety checks (they don't apply to controllers)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No "Update" button | Check manifest has `flashable: true`, `flash_tool`, and `sha256` for that model |
| SHA256 mismatch | Delete stale cached file: `rm /usr/share/45drives/firmware/files/hdd/...` and retry |
| "Unsupported flash tool" | Model missing `flash_tool` in manifest |
| Pool shows DEGRADED after flash | Run `zpool clear <pool>` — drive went offline briefly during activation |
| Revert fails | Model not in REVERT_MAP or LOD file not in `/usr/share/45drives/firmware/revert/` |

---

## Quick Commands (SSH to .11)

```bash
# Force re-check firmware
python3 /usr/share/45drives/firmware/firmware-check

# Check pool status
zpool status

# Clear a faulted pool
zpool clear <pool_name>

# Start a scrub (for testing blocker)
zpool scrub testpool-mirror

# Stop a scrub
zpool scrub -s testpool-mirror

# Offline a drive (simulate DEGRADED)
zpool offline testpool-raidz2 sdq

# Bring it back
zpool online testpool-raidz2 sdq && zpool clear testpool-raidz2

# View flash log
cat /var/log/45drives/firmware-flash.log
```
