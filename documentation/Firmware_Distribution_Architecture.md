# Firmware Distribution Architecture

## Overview

This document describes how firmware updates are delivered, verified, and applied to 45Drives hardware through Houston (Cockpit). The design prioritizes **integrity**, **efficiency**, and **operational simplicity**.

---

## Design Philosophy

### Why Not Ship Firmware as a deb/rpm Package?

| Concern | Package approach | Our approach (HTTP repo) |
|---------|-----------------|--------------------------|
| **Download size** | All firmware (~500MB+) downloaded to every machine regardless of hardware | Only downloads firmware for detected hardware |
| **Update latency** | New firmware requires package rebuild, repo push, `apt update` cycle | Upload file + update manifest → immediately available |
| **Release frequency** | Vendors release firmware monthly; new package each time | Drop file on server, update manifest |
| **Disk waste** | 30+ firmware files for hardware you don't own | Zero unused files on disk |
| **Independence** | All firmware versions locked to one package version | Each device updates independently |

### Hybrid Approach (Best of Both Worlds)

- **Code** (scripts, manifest schema, public key) → ships as `.deb`/`.rpm` → verified by apt/yum GPG
- **Firmware payloads** (`.rom`, `.bin`, `.pkg`) → fetched on-demand from HTTP repo → verified by SHA256 + GPG-signed manifest

This gives us package-manager trust for the logic, and efficient on-demand delivery for the bulky binaries.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Build / Release Machine                  │
│                  (air-gapped or secured)                  │
│                                                          │
│  1. Collect firmware files from vendors                   │
│  2. Run update-manifest-hashes → SHA256 in manifest      │
│  3. gpg --sign manifest.json → manifest.json.sig         │
│  4. Upload manifest + firmware + sig to repo server       │
│                                                          │
│  🔑 GPG private key lives HERE only                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               repo.45drives.com (Public)                  │
│                                                          │
│  /firmware/manifest.json          ← device database      │
│  /firmware/manifest.json.sig      ← GPG signature        │
│  /firmware/9600-16i.rom           ← firmware binary       │
│  /firmware/BCM957416.pkg          ← firmware binary       │
│  /firmware/...                                            │
│                                                          │
│  Static file hosting (nginx). No logic.                  │
│  Even if fully compromised, cannot forge signatures.     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Customer Machine (Houston)                    │
│                                                          │
│  /usr/share/45drives/firmware/                            │
│    firmware-discover  ← detects hardware                  │
│    firmware-check     ← compares versions vs manifest     │
│    firmware-flash     ← downloads + verifies + flashes    │
│    manifest.json      ← local copy (updated from remote)  │
│    repo.conf          ← REPO_URL, MANIFEST_URL            │
│    45drives-release.gpg  ← public key (ships with pkg)   │
│                                                          │
│  /var/cache/45drives/firmware/                            │
│    status.json        ← cached check results              │
│    reboot-pending.json ← devices needing reboot          │
│                                                          │
│  🔑 GPG public key lives HERE                            │
└─────────────────────────────────────────────────────────┘
```

---

## Trust Chain

```
GPG private key (offline)
    │
    ▼ signs
manifest.json.sig
    │
    ▼ verified by public key on customer machine
manifest.json (trusted)
    │
    ▼ contains SHA256 hashes
firmware files (verified against trusted hashes)
    │
    ▼ applied by
flash tools (storcli64, SeaChest, niccli, etc.)
```

### What Each Layer Protects Against

| Layer | Threat | Protection |
|-------|--------|------------|
| **HTTPS** | Eavesdropping, basic MITM | Transport encryption |
| **SHA256** | Corrupted download, truncated file, wrong file served, bit rot | Data integrity |
| **GPG signature** | Compromised repo server, attacker replacing manifest+files | Authenticity (only private key holder can sign) |

### Key Principle

The **private key never touches the repo server**. Even full server compromise cannot produce a valid signature. The public key ships with the cockpit-hardware package (itself GPG-verified by apt/yum).

---

## Pipeline Flow

### Phase 1: Release Engineer Publishes Firmware

```bash
# On secured build machine
cp vendor-firmware.rom firmware-repo/9600-16i.rom

# Compute hashes and update manifest
./update-manifest-hashes

# Sign the manifest
gpg --detach-sign --armor -o manifest.json.sig manifest.json

# Upload to repo server
rsync firmware-repo/ repo.45drives.com:/srv/firmware/
```

### Phase 2: Customer Runs Firmware Check

```
firmware-check:
  1. Read repo.conf → get MANIFEST_URL
  2. Fetch remote manifest.json (fall back to local copy)
  3. (Future) Verify manifest.json.sig with public key
  4. Run firmware-discover → list installed hardware
  5. Compare installed versions vs manifest "latest_firmware"
  6. Write results to /var/cache/45drives/firmware/status.json
```

### Phase 3: Customer Flashes Firmware

```
firmware-flash:
  1. Read device info from cache
  2. Check if firmware file exists locally
     - If not: download from REPO_URL
  3. Compute SHA256 of downloaded/local file
  4. Compare against manifest sha256 field
     - Mismatch → reject, abort flash
     - Match → proceed
  5. Call appropriate flash tool (storcli64, SeaChest, niccli, etc.)
  6. Report success/failure
  7. If reboot required → record in reboot-pending.json
```

---

## Configuration

### repo.conf

```ini
# Production
REPO_URL=https://repo.45drives.com/firmware
MANIFEST_URL=https://repo.45drives.com/firmware/manifest.json

# Development (local HTTP server)
# REPO_URL=http://192.168.209.126:8089
# MANIFEST_URL=
```

- `REPO_URL` — Base URL for downloading firmware binaries
- `MANIFEST_URL` — URL for fetching the latest manifest (empty = use local only)

---

## SHA256 Verification

### What It Contains

A 64-character hex string representing the SHA-256 digest of the firmware file:

```json
{
  "model": "9600-16i",
  "type": "HBA",
  "latest_firmware": "24.21.00.38",
  "firmware_file": "9600-16i_full_fw_vsn_pldm_pkg_signed.rom",
  "sha256": "a3f7b2c91d4e8f06523a1b9c0d7e4f8a2b6c3d5e9f1a4b7c8d0e2f3a5b6c7d8e"
}
```

### How It's Generated

The `update-manifest-hashes` helper script:
1. Reads each entry in `manifest.json`
2. Locates the corresponding firmware file in the repo
3. Computes `sha256sum` of the file
4. Writes the hash back into the manifest

### How It's Verified

In `firmware-flash`:
```python
computed = hashlib.sha256(file_data).hexdigest()
if computed != expected_sha256:
    # REJECT — file is corrupt or tampered
```

### What It Catches

- Partial/truncated downloads (network failure mid-transfer)
- Silent bit rot on storage
- CDN/proxy serving stale cached copy
- Wrong file accidentally uploaded under correct filename

---

## GPG Signing (Future Implementation)

### Why SHA256 Alone Isn't Enough

SHA256 verifies "this file matches what the manifest says." But if an attacker controls the repo server, they can replace **both** the manifest (with new hashes) and the firmware files. SHA256 alone cannot detect this.

### How GPG Solves It

- Manifest is signed with a **private key** kept offline
- Customer machines have the **public key** (shipped with the package)
- Attacker cannot forge a valid signature without the private key
- Even full server compromise = harmless (can't sign)

### Implementation Plan

```bash
# Signing (build machine)
gpg --detach-sign --armor -o manifest.json.sig manifest.json

# Verification (customer machine, in firmware-check)
gpg --verify --keyring /usr/share/45drives/firmware/45drives-release.gpg \
    manifest.json.sig manifest.json
```

### Public Key Distribution

The public key ships inside the `cockpit-hardware` package itself:
- Package is GPG-verified by apt/yum (using 45drives' existing repo key)
- Therefore the public key inside it is transitively trusted
- New keys can be rotated via package updates

---

## Comparison to Package Manager Security

| Aspect | apt/yum packages | Our firmware delivery |
|--------|-----------------|----------------------|
| Signing | Built into package manager | We implement it ourselves |
| Verification | Automatic on install | Called in firmware-flash |
| Key distribution | `apt-key add` during setup | Ships with cockpit-hardware package |
| Granularity | Per-package | Per-manifest (covers all firmware) |
| Transport | apt/yum handles downloads | We use urllib/requests |

The model is identical — we're just implementing the same pattern for files that aren't `.deb`/`.rpm` packages.

---

## Security Summary

| Attack Vector | SHA256 | GPG | Combined |
|---------------|--------|-----|----------|
| Network corruption | ✅ Detected | — | ✅ |
| Disk bit rot | ✅ Detected | — | ✅ |
| Wrong file on server | ✅ Detected | — | ✅ |
| Compromised repo server | ❌ | ✅ Detected | ✅ |
| MITM (no HTTPS) | ❌ | ✅ Detected | ✅ |
| Stolen private key | — | ❌ | ❌ (key rotation needed) |

---

## File Locations

| File | Path | Purpose |
|------|------|---------|
| firmware-discover | `/usr/share/45drives/firmware/firmware-discover` | Hardware detection |
| firmware-check | `/usr/share/45drives/firmware/firmware-check` | Version comparison |
| firmware-flash | `/usr/share/45drives/firmware/firmware-flash` | Download + verify + flash |
| manifest.json | `/usr/share/45drives/firmware/manifest.json` | Device/firmware database |
| repo.conf | `/usr/share/45drives/firmware/repo.conf` | Repo URL configuration |
| update-manifest-hashes | `/usr/share/45drives/firmware/update-manifest-hashes` | SHA256 population helper |
| status cache | `/var/cache/45drives/firmware/status.json` | Check results |
| reboot-pending | `/var/cache/45drives/firmware/reboot-pending.json` | Reboot tracking |
| GPG public key | `/usr/share/45drives/firmware/45drives-release.gpg` | Signature verification (future) |
