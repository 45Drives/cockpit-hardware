#!/usr/bin/env python3
"""
fan_common.py - Shared utilities for 45Drives Fan Controller backend scripts.

Uses the Linux hwmon interface for the MAX31790 fan controller.

Setup chain (automatic):
  1. Load ipmb-bus.ko   -- exposes the IPMB I2C bus as a Linux I2C adapter.
  2. modprobe max31790  -- loads the kernel hwmon driver for the MAX31790 IC.
  3. Instantiate device -- writes "max31790 <addr>" to i2c-<N>/new_device.
  4. A /sys/class/hwmon/hwmonX directory appears with:
       fan<N>_input  -- current RPM (read-only)
       fan<N>_fault  -- 1 if no fan detected (read-only)
       pwm<N>        -- duty cycle 0-255 (read/write)
       pwm<N>_enable -- 1=manual, 2=auto (read/write)

Boards and fans are auto-discovered -- nothing is hardcoded:
  - Boards are probed by instantiating each known address and checking
    whether a hwmon device appears.
  - Fans are detected by checking fan<N>_fault (0 = real fan present).
"""

import os
import re
import subprocess
import time

# --- Known board I2C **7-bit** addresses ---
# Board 1: MAX31790 at 0x20 (A1=0, A0=0)
# Board 2: MAX31790 at 0x28 (A1=1, A0=0)
KNOWN_BOARD_ADDRS = {
    1: 0x20,
    2: 0x28,
}

FANS_PER_BOARD = 6

# --- Path to pre-built ipmb-bus kernel module ---
_IPMB_MODULE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "ipmb-bus.ko"
)


# ====================================================
#  Module / device setup
# ====================================================

def _is_module_loaded(mod_name):
    """Check if a kernel module is loaded."""
    try:
        with open("/proc/modules") as f:
            for line in f:
                if line.split()[0] == mod_name:
                    return True
    except OSError:
        pass
    return False


def _load_ipmb_bus():
    """Load ipmb-bus.ko if not already loaded.  Returns True on success."""
    if _is_module_loaded("ipmb_bus"):
        return True
    if os.path.isfile(_IPMB_MODULE_PATH):
        try:
            r = subprocess.run(
                ["insmod", _IPMB_MODULE_PATH],
                capture_output=True, text=True, timeout=15,
            )
            if r.returncode == 0:
                time.sleep(1)
                return True
        except Exception:
            pass
    return False


def _load_max31790():
    """modprobe max31790 if not already loaded.  Returns True on success."""
    if _is_module_loaded("max31790"):
        return True
    try:
        r = subprocess.run(
            ["modprobe", "max31790"],
            capture_output=True, text=True, timeout=10,
        )
        return r.returncode == 0
    except Exception:
        return False


def _find_ipmb_bus():
    """
    Scan /sys/bus/i2c/devices/i2c-*/name for an IPMB adapter.
    Returns the bus number (int) or None.
    """
    base = "/sys/bus/i2c/devices"
    if not os.path.isdir(base):
        return None
    for entry in sorted(os.listdir(base)):
        name_path = os.path.join(base, entry, "name")
        if os.path.isfile(name_path):
            try:
                with open(name_path) as f:
                    name = f.read().strip().lower()
                if "ipmb" in name or "i2c-ipmi" in name:
                    m = re.search(r"i2c-(\d+)", entry)
                    if m:
                        return int(m.group(1))
            except OSError:
                pass
    return None


def _find_hwmon_for(bus_num, addr_7bit):
    """
    Find the hwmon sysfs path for a MAX31790 at a given I2C bus + address.
    Returns e.g. "/sys/class/hwmon/hwmon4" or None.
    """
    client_name = f"{bus_num}-{addr_7bit:04x}"
    client_path = f"/sys/bus/i2c/devices/{client_name}"

    # Check <client>/hwmon/hwmonX/
    hwmon_parent = os.path.join(client_path, "hwmon")
    if os.path.isdir(hwmon_parent):
        for d in os.listdir(hwmon_parent):
            candidate = os.path.join(hwmon_parent, d)
            name_file = os.path.join(candidate, "name")
            if os.path.isfile(name_file):
                try:
                    with open(name_file) as f:
                        if f.read().strip() == "max31790":
                            return candidate
                except OSError:
                    pass

    # Fallback: scan /sys/class/hwmon/
    for d in sorted(os.listdir("/sys/class/hwmon")):
        candidate = os.path.join("/sys/class/hwmon", d)
        name_file = os.path.join(candidate, "name")
        dev_link = os.path.join(candidate, "device")
        if os.path.isfile(name_file) and os.path.islink(dev_link):
            try:
                with open(name_file) as f:
                    if f.read().strip() != "max31790":
                        continue
                real = os.path.realpath(dev_link)
                if client_name in real:
                    return candidate
            except OSError:
                pass
    return None


def _instantiate_device(bus_num, addr_7bit):
    """
    Tell the kernel to instantiate a max31790 at the given bus/address.
    echo max31790 0x20 > /sys/bus/i2c/devices/i2c-<bus>/new_device
    """
    new_dev = f"/sys/bus/i2c/devices/i2c-{bus_num}/new_device"
    try:
        with open(new_dev, "w") as f:
            f.write(f"max31790 0x{addr_7bit:02x}\n")
        time.sleep(0.5)
        return True
    except OSError:
        return False


# ====================================================
#  Board / hwmon discovery  (cached after first call)
# ====================================================

_discovered_boards = None    # { board_num: hwmon_path }
_ipmb_bus_num_cache = None


def _ensure_setup():
    """Load kernel modules and find the IPMB bus.  Returns bus number or raises."""
    global _ipmb_bus_num_cache
    if _ipmb_bus_num_cache is not None:
        return _ipmb_bus_num_cache

    _load_ipmb_bus()
    bus = _find_ipmb_bus()
    if bus is None:
        raise RuntimeError(
            "IPMB I2C adapter not found.  Is ipmb-bus.ko loaded?"
        )
    _load_max31790()
    _ipmb_bus_num_cache = bus
    return bus


def probe_boards():
    """
    Probe all known addresses, instantiate any that don't already have hwmon,
    and return { board_num: hwmon_path } for those that respond.
    Result is cached.
    """
    global _discovered_boards
    if _discovered_boards is not None:
        return _discovered_boards

    bus = _ensure_setup()
    alive = {}

    for board_num, addr in sorted(KNOWN_BOARD_ADDRS.items()):
        hwmon = _find_hwmon_for(bus, addr)
        if hwmon is None:
            _instantiate_device(bus, addr)
            hwmon = _find_hwmon_for(bus, addr)
        if hwmon is not None:
            alive[board_num] = hwmon

    _discovered_boards = alive
    return _discovered_boards


def get_board_hwmon(board_num):
    """Get the hwmon sysfs path for a board number, validating it exists."""
    boards = probe_boards()
    if board_num not in boards:
        available = sorted(boards.keys())
        raise ValueError(
            f"Board {board_num} not found.  Available boards: {available}"
        )
    return boards[board_num]


def get_transport():
    """Return transport description for UI display."""
    return "hwmon"


# ====================================================
#  Fan-level helpers -- all via hwmon sysfs
# ====================================================

def _read_sysfs(path):
    """Read a sysfs file and return stripped content."""
    with open(path) as f:
        return f.read().strip()


def _write_sysfs(path, value):
    """Write a value to a sysfs file."""
    with open(path, "w") as f:
        f.write(str(value))


def is_fan_present(hwmon_path, fan_num):
    """
    Check if a real fan is connected to channel fan_num (1-6).
    Uses the fan<N>_fault file -- 0 means a fan is present.
    Returns (present: bool, rpm: int).
    """
    fault_path = os.path.join(hwmon_path, f"fan{fan_num}_fault")
    input_path = os.path.join(hwmon_path, f"fan{fan_num}_input")

    try:
        fault = int(_read_sysfs(fault_path))
        if fault != 0:
            return False, 0
        rpm = int(_read_sysfs(input_path))
        return True, rpm
    except (OSError, ValueError):
        return False, 0


def read_fan_rpm(hwmon_path, fan_num):
    """Read RPM from fan<N>_input.  Returns int RPM or 0."""
    input_path = os.path.join(hwmon_path, f"fan{fan_num}_input")
    try:
        return int(_read_sysfs(input_path))
    except (OSError, ValueError):
        return 0


def set_pwm_duty(hwmon_path, fan_num, duty_percent):
    """
    Set PWM duty cycle for a fan (0-100%).
    The hwmon pwm<N> file accepts values 0-255.
    Returns the raw 0-255 value written.
    """
    duty_percent = max(0.0, min(100.0, float(duty_percent)))
    pwm_raw = int(round(duty_percent * 255 / 100))
    pwm_path = os.path.join(hwmon_path, f"pwm{fan_num}")

    # Ensure PWM is in manual mode (enable=1) before writing
    enable_path = os.path.join(hwmon_path, f"pwm{fan_num}_enable")
    try:
        current_enable = int(_read_sysfs(enable_path))
        if current_enable != 1:
            _write_sysfs(enable_path, 1)
    except (OSError, ValueError):
        pass

    _write_sysfs(pwm_path, pwm_raw)
    return pwm_raw


# ====================================================
#  Temperature sensor discovery and reading
# ====================================================

# Chip names to skip when discovering temperature sensors
_SKIP_CHIPS = {"max31790", "drivetemp", "bnxt_en"}

# Chip names that are always CPU sensors
_CPU_CHIPS = {"k10temp", "coretemp", "zenpower", "fam15h_power"}

# Chip name for drive temperature
_DRIVE_CHIP = "drivetemp"

# PCI vendor ID -> device type  (PRIMARY classification)
_PCI_VENDOR_MAP = {
    "0x14e4": "NIC",      # Broadcom Inc. (bnxt_en NICs)
    "0x15b3": "NIC",      # Mellanox / NVIDIA Networking
    "0x10de": "GPU",      # NVIDIA
    "0x1002": "GPU",      # AMD (Radeon)
}
# NOTE: HBA temps are detected via storcli, not hwmon.

# PCI class code -> device type  (FALLBACK if vendor not matched)
_PCI_CLASS_MAP = {
    0x02: "NIC",       # Network controller
    0x03: "GPU",       # Display controller
}


def _load_drivetemp():
    """Load the drivetemp kernel module if not already loaded."""
    if _is_module_loaded("drivetemp"):
        return True
    try:
        r = subprocess.run(
            ["modprobe", "drivetemp"],
            capture_output=True, text=True, timeout=10,
        )
        if r.returncode == 0:
            import time as _t
            _t.sleep(0.5)
            return True
    except Exception:
        pass
    return False


def _classify_hwmon(chip_name, hwmon_dir):
    """
    Classify a hwmon device into (category, device_type, model).

    Categories: "cpu", "pci", "drive"
    Device types: "CPU", "NIC", "HBA", "GPU", "Drive", or the chip name
    """
    # CPU sensors
    if chip_name in _CPU_CHIPS:
        return "cpu", "CPU", ""

    # Drive sensors
    if chip_name == _DRIVE_CHIP:
        model = ""
        dev_link = os.path.join(hwmon_dir, "device")
        if os.path.islink(dev_link):
            model_file = os.path.join(os.path.realpath(dev_link), "model")
            if os.path.isfile(model_file):
                try:
                    model = _read_sysfs(model_file).strip()
                except OSError:
                    pass
        return "drive", "Drive", model

    # PCI devices -- determine type from vendor (primary) then class (fallback)
    dev_link = os.path.join(hwmon_dir, "device")
    device_type = chip_name  # fallback
    if os.path.islink(dev_link):
        real_dev = os.path.realpath(dev_link)

        # Primary: vendor-based classification
        vendor_file = os.path.join(real_dev, "vendor")
        if os.path.isfile(vendor_file):
            try:
                vendor = _read_sysfs(vendor_file)
                if vendor in _PCI_VENDOR_MAP:
                    device_type = _PCI_VENDOR_MAP[vendor]
            except OSError:
                pass

        # Fallback: PCI class-based classification
        if device_type == chip_name:
            class_file = os.path.join(real_dev, "class")
            if os.path.isfile(class_file):
                try:
                    cls_str = _read_sysfs(class_file)
                    cls_val = int(cls_str, 16)
                    base_class = (cls_val >> 16) & 0xFF
                    if base_class in _PCI_CLASS_MAP:
                        device_type = _PCI_CLASS_MAP[base_class]
                except (OSError, ValueError):
                    pass

    return "pci", device_type, ""


def discover_temp_sensors():
    """
    Scan /sys/class/hwmon/ for all temperature sensors.
    Skips the MAX31790 fan controller (no temp sensors).
    Loads drivetemp module for drive temperature detection.

    Returns a list of dicts:
      [
        {
          "id":          "hwmon0_temp1",
          "chip":        "k10temp",
          "hwmon":       "hwmon0",
          "hwmon_path":  "/sys/class/hwmon/hwmon0",
          "input_file":  "temp1_input",
          "label":       "Tctl",          # may be ""
          "value":       61.1,            # degrees C
          "category":    "cpu",           # "cpu", "pci", "drive"
          "device_type": "CPU",           # "CPU", "NIC", "HBA", "GPU", "Drive"
          "model":       "",              # drive model if applicable
        },
        ...
      ]
    """
    # Ensure drivetemp is loaded for drive temperatures
    _load_drivetemp()

    sensors = []
    base = "/sys/class/hwmon"
    if not os.path.isdir(base):
        return sensors

    for entry in sorted(os.listdir(base)):
        hwmon_dir = os.path.join(base, entry)
        name_file = os.path.join(hwmon_dir, "name")
        if not os.path.isfile(name_file):
            continue

        try:
            chip_name = _read_sysfs(name_file)
        except OSError:
            continue

        if chip_name in _SKIP_CHIPS:
            continue

        # Classify this hwmon device
        category, device_type, model = _classify_hwmon(chip_name, hwmon_dir)

        # Find all temp*_input files in this hwmon
        for fname in sorted(os.listdir(hwmon_dir)):
            if not fname.endswith("_input") or not fname.startswith("temp"):
                continue

            input_path = os.path.join(hwmon_dir, fname)
            # Derive the temp index (e.g. "temp1" from "temp1_input")
            temp_base = fname.replace("_input", "")

            # Read label (optional)
            label_path = os.path.join(hwmon_dir, f"{temp_base}_label")
            label = ""
            if os.path.isfile(label_path):
                try:
                    label = _read_sysfs(label_path)
                except OSError:
                    pass

            # Read current value (millidegrees -> degrees)
            try:
                raw = int(_read_sysfs(input_path))
                value = round(raw / 1000.0, 1)
            except (OSError, ValueError):
                value = 0.0

            sensor_id = f"{entry}_{temp_base}"
            sensors.append({
                "id":          sensor_id,
                "chip":        chip_name,
                "hwmon":       entry,
                "hwmon_path":  hwmon_dir,
                "input_file":  fname,
                "label":       label,
                "value":       value,
                "category":    category,
                "device_type": device_type,
                "model":       model,
            })

    return sensors


def _discover_gpu_sensors():
    """
    Discover NVIDIA GPU temperatures via nvidia-smi.
    Returns a list of sensor dicts with category='pci', device_type='GPU'.
    """
    sensors = []
    try:
        r = subprocess.run(
            ["nvidia-smi", "--query-gpu=index,name,temperature.gpu",
             "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=10,
        )
        if r.returncode != 0:
            return sensors
        for line in r.stdout.strip().splitlines():
            parts = [p.strip() for p in line.split(",")]
            if len(parts) < 3:
                continue
            idx, name, temp_str = parts[0], parts[1], parts[2]
            try:
                temp = float(temp_str)
            except ValueError:
                temp = 0.0
            sensor_id = f"nvidia_gpu{idx}"
            sensors.append({
                "id":          sensor_id,
                "chip":        "nvidia",
                "hwmon":       f"nvidia_gpu{idx}",
                "hwmon_path":  "",
                "input_file":  "",
                "label":       name,
                "value":       temp,
                "category":    "pci",
                "device_type": "GPU",
                "model":       name,
            })
    except (FileNotFoundError, OSError):
        pass
    return sensors


def _discover_smartctl_drives():
    """
    Discover drive temperatures via smartctl for non-SATA drives
    (e.g. SAS/NVMe drives behind HBAs).  Skips SATA drives (OS/boot).
    Returns a list of sensor dicts with category='drive'.
    """
    import glob
    sensors = []

    # Scan /dev/sd* block devices (skip SATA drives — those are typically OS/boot drives)
    for dev_path in sorted(glob.glob("/dev/sd[a-z]") + glob.glob("/dev/sd[a-z][a-z]")):
        dev_name = os.path.basename(dev_path)

        # Skip SATA drives (connected via ATA, not behind an HBA)
        sys_block_dev = f"/sys/block/{dev_name}/device"
        if os.path.islink(sys_block_dev):
            real_dev = os.path.realpath(sys_block_dev)
            if "/ata" in real_dev:
                continue

        # Try smartctl
        try:
            r = subprocess.run(
                ["smartctl", "-A", dev_path],
                capture_output=True, text=True, timeout=10,
            )
            temp = None
            for line in r.stdout.splitlines():
                if "Current Drive Temperature" in line:
                    # SAS format: "Current Drive Temperature:     55 C"
                    parts = line.split()
                    for i, p in enumerate(parts):
                        if p == "C" and i > 0:
                            try:
                                temp = float(parts[i - 1])
                            except ValueError:
                                pass
                            break
                    if temp is not None:
                        break
                elif "Temperature_Celsius" in line:
                    # SATA SMART attribute format
                    parts = line.split()
                    for p in reversed(parts):
                        try:
                            temp = float(p)
                            if 0 < temp < 150:
                                break
                        except ValueError:
                            continue
                    if temp is not None:
                        break

            if temp is None:
                continue

            # Get model
            model = ""
            model_file = f"/sys/block/{dev_name}/device/model"
            if os.path.isfile(model_file):
                try:
                    model = _read_sysfs(model_file).strip()
                except OSError:
                    pass

            sensor_id = f"smartctl_{dev_name}"
            sensors.append({
                "id":          sensor_id,
                "chip":        "smartctl",
                "hwmon":       f"smartctl_{dev_name}",
                "hwmon_path":  "",
                "input_file":  "",
                "label":       dev_name,
                "value":       temp,
                "category":    "drive",
                "device_type": "Drive",
                "model":       model,
            })
        except (FileNotFoundError, OSError):
            pass

    return sensors


# ── storcli HBA temperature discovery ─────────────────────────────────

_STORCLI_PATHS = [
    "/opt/45drives/tools/storcli2",
    "/opt/45drives/tools/storcli64",
    "/usr/sbin/storcli2",
    "/usr/sbin/storcli64",
    "/usr/local/bin/storcli2",
    "/usr/local/bin/storcli64",
]


def _find_storcli():
    """Return the first available storcli binary path, or None."""
    for p in _STORCLI_PATHS:
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return p
    # Try PATH as last resort
    for name in ("storcli2", "storcli64", "storcli"):
        try:
            r = subprocess.run(
                ["which", name], capture_output=True, text=True, timeout=5,
            )
            if r.returncode == 0 and r.stdout.strip():
                return r.stdout.strip()
        except Exception:
            pass
    return None


def _discover_storcli_hba():
    """
    Discover HBA (SAS controller) chip temperatures via storcli.
    Tries storcli2 first, then storcli64.

    Returns a list of sensor dicts with category='pci', device_type='HBA'.
    Only reports the chip (die) temperature — the relevant value for fan control.
    """
    storcli = _find_storcli()
    if storcli is None:
        return []

    sensors = []
    try:
        r = subprocess.run(
            [storcli, "/call", "show", "all", "J"],
            capture_output=True, text=True, timeout=30,
        )
        if r.returncode != 0:
            return sensors

        import json as _json
        data = _json.loads(r.stdout)

        for ctrl_idx, ctrl in enumerate(data.get("Controllers", [])):
            status = ctrl.get("Command Status", {})
            if status.get("Status") == "Failure":
                continue

            rd = ctrl.get("Response Data", {})
            if not rd:
                continue

            hw = rd.get("HwCfg", {})
            basics = rd.get("Basics", {})
            model = basics.get("Product Name", "HBA").strip()

            # Chip (die) temperature — the only relevant metric for fan control
            chip_temp = hw.get("Chip temperature(C)")
            if chip_temp is not None and isinstance(chip_temp, (int, float)):
                sensor_id = f"storcli_c{ctrl_idx}_chip"
                sensors.append({
                    "id":          sensor_id,
                    "chip":        "storcli",
                    "hwmon":       f"storcli_c{ctrl_idx}",
                    "hwmon_path":  "",
                    "input_file":  "",
                    "label":       model,
                    "value":       float(chip_temp),
                    "category":    "pci",
                    "device_type": "HBA",
                    "model":       model,
                })

    except (FileNotFoundError, OSError, ValueError):
        pass

    return sensors


def read_sensor_temp(sensor_id):
    """
    Read the current temperature for a sensor identified by its id.
    Supports hwmon sensors (hwmonX_tempY), nvidia GPUs (nvidia_gpuN),
    smartctl drives (smartctl_sdX), and storcli HBAs (storcli_cN_chip/board).
    Returns degrees C as a float.
    """
    # storcli HBA sensor
    if sensor_id.startswith("storcli_c"):
        storcli = _find_storcli()
        if storcli is None:
            raise RuntimeError(f"storcli not found for sensor {sensor_id}")
        # Parse controller index and temp type from id: storcli_c0_chip or storcli_c0_board
        parts = sensor_id.split("_")
        ctrl_idx = int(parts[1].lstrip("c"))
        temp_type = parts[2]  # 'chip' or 'board'
        try:
            r = subprocess.run(
                [storcli, f"/c{ctrl_idx}", "show", "all", "J"],
                capture_output=True, text=True, timeout=15,
            )
            import json as _json
            data = _json.loads(r.stdout)
            for ctrl in data.get("Controllers", []):
                rd = ctrl.get("Response Data", {})
                hw = rd.get("HwCfg", {})
                if temp_type == "chip":
                    val = hw.get("Chip temperature(C)")
                else:
                    val = hw.get("Board temperature(C)")
                if val is not None and isinstance(val, (int, float)):
                    return float(val)
        except Exception as e:
            raise RuntimeError(f"Cannot read HBA sensor {sensor_id}: {e}")
        raise RuntimeError(f"Cannot read HBA sensor {sensor_id}: no temp found")
    # NVIDIA GPU sensor
    if sensor_id.startswith("nvidia_gpu"):
        idx = sensor_id.replace("nvidia_gpu", "")
        try:
            r = subprocess.run(
                ["nvidia-smi", "--query-gpu=temperature.gpu",
                 "--format=csv,noheader,nounits", f"-i={idx}"],
                capture_output=True, text=True, timeout=10,
            )
            return float(r.stdout.strip())
        except Exception as e:
            raise RuntimeError(f"Cannot read GPU sensor {sensor_id}: {e}")

    # smartctl drive sensor
    if sensor_id.startswith("smartctl_"):
        dev_name = sensor_id.replace("smartctl_", "")
        dev_path = f"/dev/{dev_name}"
        try:
            r = subprocess.run(
                ["smartctl", "-A", dev_path],
                capture_output=True, text=True, timeout=10,
            )
            for line in r.stdout.splitlines():
                if "Current Drive Temperature" in line:
                    parts = line.split()
                    for i, p in enumerate(parts):
                        if p == "C" and i > 0:
                            return float(parts[i - 1])
                elif "Temperature_Celsius" in line:
                    parts = line.split()
                    for p in reversed(parts):
                        try:
                            val = float(p)
                            if 0 < val < 150:
                                return val
                        except ValueError:
                            continue
        except Exception as e:
            raise RuntimeError(f"Cannot read drive sensor {sensor_id}: {e}")
        raise RuntimeError(f"Cannot read drive sensor {sensor_id}: no temp found")

    # Standard hwmon sensor: "hwmonX_tempY"
    parts = sensor_id.split("_", 1)
    if len(parts) != 2:
        raise ValueError(f"Invalid sensor id: {sensor_id}")

    hwmon_name, temp_base = parts
    input_path = os.path.join("/sys/class/hwmon", hwmon_name, f"{temp_base}_input")

    try:
        raw = int(_read_sysfs(input_path))
        return round(raw / 1000.0, 1)
    except (OSError, ValueError) as e:
        raise RuntimeError(f"Cannot read sensor {sensor_id}: {e}")
