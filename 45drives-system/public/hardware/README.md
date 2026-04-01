# Hardware Data Collection — Refactored Architecture

## Overview

The `hardware/` directory replaces the collection of standalone Python scripts in
`scripts/` with a unified, profile-driven hardware data collector.

**Before:** 7 scripts (~2400 lines), each invoking dmidecode/ipmitool/lspci
independently, with 30+ hardcoded lookup tables duplicated across files.

**After:** 1 entry point (`collect.py`), 4 provider modules (~600 lines), and
~20 board profile JSON files containing all vendor-specific data.

## Directory Structure

```
hardware/
├── collect.py              # Main entry point (replaces all scripts)
├── profiles/               # Board-specific data (JSON, one per motherboard)
│   ├── X11SPL-F.json
│   ├── MZ73-LM0-000.json
│   ├── MH53-G40-000.json
│   └── ...
└── providers/              # Shared parsing modules
    ├── sysfs.py            # Zero-subprocess reads from /sys and /proc
    ├── dmi.py              # Single dmidecode invocation, cached access
    ├── ipmi.py             # Single ipmitool invocation, profile-driven
    └── pci.py              # PCI slot/device detection with profile maps
```

## Usage

```bash
# Collect one section:
python3 collect.py cpu

# Collect multiple sections:
python3 collect.py cpu ram pci

# Collect everything:
python3 collect.py all
```

Output is always JSON to stdout with section keys:

```json
{
    "cpu": { "cpus": [...] },
    "ram": [...],
    "pci": [...],
    "network": [...],
    "sata": { "SATA Info": [...] },
    "ipmi": { "ipAddress": "...", ... },
    "motherboard": { "manufacturer": "...", ... }
}
```

## How It Works

1. **Board identification:** `sysfs.board_info()` reads `/sys/class/dmi/id/board_name`
   (no subprocess needed).
2. **Profile loading:** Matches board name to a JSON profile in `profiles/`.
3. **Provider creation:** DMI and IPMI providers are instantiated lazily — external
   tools are only invoked when their data is actually accessed.
4. **Section collection:** Each requested section uses the shared providers and
   the profile data to produce its output.

## Adding a New Board

1. Create `profiles/NEW_BOARD.json` following the existing format:
   - `pci.address_to_slot` — maps slot designations to candidate PCI addresses
   - `pci.slot_types` — overrides for slot type strings
   - `sata.port_mappings` — maps by-path strings to connector labels
   - `ipmi_sensors` — lists sensor field names for CPU temp, DIMMs, fans, power
   - `ram.locator_tags` — maps DIMM locators to IPMI sensor names

2. No code changes needed — the collector automatically loads the profile.

## OS Compatibility

- Rocky Linux 8 (kernel 4.18+)
- Rocky Linux 9 (kernel 5.14+)
- Ubuntu 20.04 (kernel 5.4+)
- Ubuntu 22.04 (kernel 5.15+)

**Note:** NVMe temperature via `/sys/class/nvme/*/hwmon*/temp1_input` requires
kernel 5.5+. On Rocky 8, the collector would need a smartctl fallback (not yet
implemented).

## Migration Status

### 45drives-system (DONE)
All Section*.vue components updated to call `collect.py <section>` instead of
individual scripts. The old scripts in `scripts/` are kept for reference but
are no longer called by the frontend.

### 45drives-motherboard (TODO)
Still uses its own `helper_scripts/` directory with independent script copies.
The motherboard module's P5.js visualization expects specific JSON shapes that
differ from the unified collector output. Migration requires reshaping the
P5Motherboard.vue data consumption.

### 45drives-disks (NOT AFFECTED)
Uses `server_info`, `disk_info`, and `zfs_info` scripts plus external tools
(`dmap`, `lsdev`, `server_identifier`). These are separate concerns from the
hardware detection refactor.
