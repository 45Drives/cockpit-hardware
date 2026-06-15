# Firmware Binary Files

This directory (`/usr/share/45drives/firmware/files/`) is the local firmware cache
used by `firmware-flash`. Files are **not** shipped with the package — they are
downloaded on-demand from the configured firmware repo.

## How It Works

1. `firmware-check` fetches the manifest from `fw.45drives.com/manifest.json`
2. Manifest contains `firmware_file` paths (e.g., `hba/9600-16i/9600-16i.rom`)
3. `firmware-flash` downloads from `REPO_URL/<firmware_file>` on demand
4. SHA256 is verified against the GPG-signed manifest before flashing
5. Downloaded files are cached here (`/usr/share/45drives/firmware/files/`) for reuse

## Why On-Demand?

- Firmware files are large (300+ MB total) and most are irrelevant to any given machine
- Shipping all firmware with the package wastes bandwidth and disk
- On-demand download means only the firmware you need is fetched
- Updates are instant (no package rebuild required)

## This Directory at Runtime

- Empty on fresh install (no firmware shipped with the package)
- Populated by `firmware-flash` when a device is flashed
- Can be cleared to reclaim disk; files will be re-downloaded as needed
- Path is configurable via `FIRMWARE_DIR` environment variable

## Where Firmware Lives

| Location | Purpose |
|----------|---------|
| `fw.45drives.com/<path>` | Authoritative source (served by nginx) |
| `firmware-admin VM (192.168.207.92)` | Upload + management (internal only) |
| `/usr/share/45drives/firmware/files/` (customer machine) | Download cache (populated by firmware-flash) |
