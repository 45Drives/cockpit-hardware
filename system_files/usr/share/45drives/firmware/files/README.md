# Firmware Binary Files (Legacy — No Longer Used)

> **⚠️ DEPRECATED:** Firmware files are no longer stored locally or shipped with the package.
> They are now fetched on-demand from `https://fw.45drives.com` by `firmware-flash`.

## Current Architecture

Firmware binaries are hosted on `fw.45drives.com` and downloaded only when needed:

1. `firmware-check` fetches the manifest from `fw.45drives.com/manifest.json`
2. Manifest contains `firmware_file` paths (e.g., `hba/9600-16i/9600-16i.rom`)
3. `firmware-flash` downloads from `REPO_URL/<firmware_file>` on demand
4. SHA256 is verified against the GPG-signed manifest before flashing
5. Downloaded files are cached in `/opt/45drives/firmware/` for reuse

## Why This Changed

- Firmware files are large (300+ MB total) and most are irrelevant to any given machine
- Shipping all firmware with the package wastes bandwidth and disk
- On-demand download means only the firmware you need is fetched
- Updates are instant (no package rebuild required)

## This Directory

This directory (`/usr/share/45drives/firmware/files/`) may still exist on systems
that were upgraded from older versions. It can be safely removed. The `firmware-flash`
script no longer reads from this location.

## Where Firmware Lives Now

| Location | Purpose |
|----------|---------|
| `fw.45drives.com/<path>` | Authoritative source (served by nginx) |
| `firmware-admin VM (192.168.207.92)` | Upload + management (internal only) |
| `/opt/45drives/firmware/` (customer machine) | Download cache (populated by firmware-flash) |
