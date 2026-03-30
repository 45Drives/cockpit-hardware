#!/usr/bin/env python3
"""
fan_common.py - Shared utilities for 45Drives Fan Controller backend scripts.

Provides low-level helpers for communicating with MAX31790 fan controllers.

Two I2C transport backends are supported, auto-detected at startup:
  1. i2c-dev  — via the ipmb-bus.ko kernel module, which exposes the IPMB bus
                as a standard Linux I2C adapter.  Uses i2cget/i2cset.
                This is the preferred, faster path.
  2. ipmitool — raw IPMI Master Write-Read (cmd 0x52) over the BMC.
                Fallback when ipmb-bus is not loaded.

Boards and fans are auto-discovered — nothing is hardcoded:
  - Boards are probed by attempting an I2C read at each known address.
  - Fans are detected by reading tach counts and filtering out empty channels
    (which report near-max tach values like 0xFFE0).

Register map (MAX31790):
  Config base:     0x02 + fan_offset
  Tach count base: 0x18 + (fan_offset * 2)
  PWM target base: 0x40 + (fan_offset * 2)
  fan_offset = fan_num - 1  (fan_num is 1-6)

Addressing:
  Addresses are stored internally as **7-bit** I2C addresses (Linux convention).
  - i2c-dev (i2cget/i2cset) uses them directly.
  - ipmitool i2c expects 8-bit addresses, so we shift left by 1.
"""

import os
import re
import shutil
import subprocess

# ─── Known board I2C **7-bit** addresses to probe ───
# Board 1: MAX31790 at 0x20 (A1=0, A0=0).  8-bit on-wire = 0x40.
# Board 2: MAX31790 at 0x28 (A1=1, A0=0).  8-bit on-wire = 0x50.
KNOWN_BOARD_ADDRS = {
    1: 0x20,
    2: 0x28,
}

# ─── MAX31790 register bases ───
CONFIG_BASE = 0x02
TACH_COUNT_BASE = 0x18
PWM_TARGET_BASE = 0x40
FANS_PER_BOARD = 6

# ─── RPM calculation defaults (MAX31790 datasheet) ───
SR = 4   # Speed Range
NP = 2   # Number of poles (typical brushless fan)

# ─── Detection thresholds ───
TACH_COUNT_NO_FAN = 0xFF00   # near-max = empty channel
MIN_RPM_THRESHOLD = 50       # filter noise

# ─── Path to pre-built ipmb-bus kernel module ───
_IPMB_MODULE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "ipmb-bus.ko"
)


# ═══════════════════════════════════════════════
#  Transport layer — auto-selected at import time
# ═══════════════════════════════════════════════

_transport = None          # "i2cdev" or "ipmitool"
_ipmb_bus_num = None       # e.g. 15  (only for i2cdev transport)


def _find_ipmb_bus():
    """
    Scan /sys/bus/i2c/devices/i2c-*/name for an IPMB adapter.
    Returns the bus number (int) or None.
    """
    i2c_base = "/sys/bus/i2c/devices"
    if not os.path.isdir(i2c_base):
        return None
    for entry in sorted(os.listdir(i2c_base)):
        name_path = os.path.join(i2c_base, entry, "name")
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


def _try_load_ipmb_module():
    """
    Attempt to load the ipmb-bus kernel module if it is not already loaded.
    First checks lsmod; if not present, runs insmod on the bundled .ko file.
    Returns True if the module is (now) loaded, False otherwise.
    """
    # Already loaded?
    try:
        result = subprocess.run(
            ["lsmod"], capture_output=True, text=True, timeout=5
        )
        if "ipmb_bus" in result.stdout:
            return True
    except Exception:
        pass

    # Try insmod with the bundled module
    if os.path.isfile(_IPMB_MODULE_PATH):
        try:
            result = subprocess.run(
                ["insmod", _IPMB_MODULE_PATH],
                capture_output=True, text=True, timeout=15,
            )
            if result.returncode == 0:
                # Give the adapter a moment to register
                import time
                time.sleep(1)
                return True
        except Exception:
            pass

    return False


def _detect_transport():
    """Choose the best available I2C transport and cache the choice."""
    global _transport, _ipmb_bus_num

    # 1. Check if an IPMB bus is already present
    bus = _find_ipmb_bus()

    # 2. If not, try auto-loading the kernel module
    if bus is None:
        _try_load_ipmb_module()
        bus = _find_ipmb_bus()

    # 3. Use i2c-dev if IPMB bus is available and i2c-tools are installed
    if bus is not None and shutil.which("i2cget") and shutil.which("i2cset"):
        _transport = "i2cdev"
        _ipmb_bus_num = bus
        return

    # 4. Fallback to ipmitool
    if shutil.which("ipmitool"):
        _transport = "ipmitool"
        return

    raise RuntimeError(
        "No I2C transport available. "
        "Install ipmitool or load the ipmb-bus kernel module."
    )


def get_transport():
    """Return the active transport name ("i2cdev" or "ipmitool")."""
    if _transport is None:
        _detect_transport()
    return _transport


# ═══════════════════════════════════════════════
#  Low-level I2C read / write  (transport-agnostic)
# ═══════════════════════════════════════════════

def i2c_read(dev_addr_int, num_bytes, register):
    """
    Read *num_bytes* from *register* on device at 7-bit *dev_addr_int*.
    Returns the raw hex string (e.g. "0b 20").
    """
    if get_transport() == "i2cdev":
        return _i2cdev_read(dev_addr_int, num_bytes, register)
    else:
        return _ipmitool_read(dev_addr_int, num_bytes, register)


def i2c_write(dev_addr_int, register, *data_bytes):
    """
    Write *data_bytes* to *register* on device at 7-bit *dev_addr_int*.
    """
    if get_transport() == "i2cdev":
        return _i2cdev_write(dev_addr_int, register, *data_bytes)
    else:
        return _ipmitool_write(dev_addr_int, register, *data_bytes)


# ── i2c-dev backend (i2cget / i2cset) ──

def _i2cdev_read(dev_addr, num_bytes, register):
    """Use i2cget to read from the IPMB bus adapter."""
    bus = _ipmb_bus_num
    if num_bytes == 1:
        cmd = ["i2cget", "-y", str(bus),
               f"0x{dev_addr:02x}", f"0x{register:02x}", "b"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode != 0:
            raise RuntimeError(f"i2cget failed: {result.stderr.strip()}")
        val = result.stdout.strip()  # e.g. "0x1f"
        return val.replace("0x", "")
    elif num_bytes == 2:
        cmd = ["i2cget", "-y", str(bus),
               f"0x{dev_addr:02x}", f"0x{register:02x}", "w"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode != 0:
            raise RuntimeError(f"i2cget failed: {result.stderr.strip()}")
        # i2cget -w returns e.g. "0x200b" (little-endian word)
        # We need to swap bytes to match ipmitool's big-endian output
        raw = int(result.stdout.strip(), 16)
        hi = (raw >> 8) & 0xFF
        lo = raw & 0xFF
        return f"{lo:02x} {hi:02x}"
    else:
        raise ValueError(f"i2cdev read: unsupported num_bytes={num_bytes}")


def _i2cdev_write(dev_addr, register, *data_bytes):
    """Use i2cset to write to the IPMB bus adapter."""
    bus = _ipmb_bus_num
    if len(data_bytes) == 1:
        cmd = ["i2cset", "-y", str(bus),
               f"0x{dev_addr:02x}", f"0x{register:02x}",
               f"0x{data_bytes[0]:02x}", "b"]
    elif len(data_bytes) == 2:
        # Write as word (i2cset swaps bytes for little-endian)
        word_le = data_bytes[0] | (data_bytes[1] << 8)
        cmd = ["i2cset", "-y", str(bus),
               f"0x{dev_addr:02x}", f"0x{register:02x}",
               f"0x{word_le:04x}", "w"]
    else:
        # For >2 bytes, write each byte using i2c block
        cmd = ["i2cset", "-y", str(bus),
               f"0x{dev_addr:02x}", f"0x{register:02x}"]
        for b in data_bytes:
            cmd.append(f"0x{b:02x}")
        cmd.append("i")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    if result.returncode != 0:
        raise RuntimeError(f"i2cset failed: {result.stderr.strip()}")
    return result.stdout.strip()


# ── ipmitool backend ──

def _ipmitool_read(dev_addr, num_bytes, register):
    """
    Use ipmitool i2c to read via IPMI Master Write-Read.
    dev_addr is 7-bit; ipmitool expects 8-bit, so we shift left by 1.
    """
    addr_8bit = dev_addr << 1
    cmd = [
        "ipmitool", "i2c",
        f"0x{addr_8bit:02x}",
        str(num_bytes),
        f"0x{register:02x}",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    if result.returncode != 0:
        raise RuntimeError(
            f"ipmitool i2c read failed: {result.stderr.strip()}"
        )
    output = result.stdout.strip().splitlines()
    if not output:
        raise RuntimeError("Empty response from ipmitool i2c read")
    return output[0].strip()


def _ipmitool_write(dev_addr, register, *data_bytes):
    """
    Use ipmitool i2c to write via IPMI Master Write-Read.
    dev_addr is 7-bit; ipmitool expects 8-bit, so we shift left by 1.
    """
    addr_8bit = dev_addr << 1
    cmd = [
        "ipmitool", "i2c",
        f"0x{addr_8bit:02x}",
        "0",
        f"0x{register:02x}",
    ]
    for b in data_bytes:
        cmd.append(f"0x{b:02x}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    if result.returncode != 0:
        raise RuntimeError(
            f"ipmitool i2c write failed: {result.stderr.strip()}"
        )
    return result.stdout.strip()


# ═══════════════════════════════════════════════
#  Board / fan register helpers
# ═══════════════════════════════════════════════

_discovered_boards = None


def probe_boards():
    """
    Probe all known I2C addresses and return a dict of {board_num: addr_int}
    for boards that actually respond.  Result is cached after first call.
    """
    global _discovered_boards
    if _discovered_boards is not None:
        return _discovered_boards

    alive = {}
    for board_num, addr in sorted(KNOWN_BOARD_ADDRS.items()):
        try:
            i2c_read(addr, 1, CONFIG_BASE)
            alive[board_num] = addr
        except Exception:
            pass

    _discovered_boards = alive
    return _discovered_boards


def get_board_addr(board_num):
    """Get the I2C 7-bit address (int) for a board number, validating it exists."""
    boards = probe_boards()
    if board_num not in boards:
        available = sorted(boards.keys())
        raise ValueError(
            f"Board {board_num} not found on I2C bus. "
            f"Available boards: {available}"
        )
    return boards[board_num]


def get_fan_registers(fan_num):
    """
    Get the register addresses for a given fan number (1-6).
    Returns (config_reg, tach_reg, pwm_reg) as integers.
    """
    if fan_num < 1 or fan_num > FANS_PER_BOARD:
        raise ValueError(f"Invalid fan number {fan_num}. Must be 1-{FANS_PER_BOARD}.")
    offset = fan_num - 1
    config_reg = CONFIG_BASE + offset
    tach_reg = TACH_COUNT_BASE + (offset * 2)
    pwm_reg = PWM_TARGET_BASE + (offset * 2)
    return config_reg, tach_reg, pwm_reg


# ═══════════════════════════════════════════════
#  Fan-level helpers
# ═══════════════════════════════════════════════

def check_and_enable_tach(dev_addr, config_reg):
    """
    Check if tachometer is enabled for a fan's config register.
    If not, enable it (set bit 3).
    Returns True if the register is reachable, False otherwise.
    """
    try:
        raw = i2c_read(dev_addr, 1, config_reg)
        config_byte = int(raw.replace(" ", ""), 16)
        tach_enabled = (config_byte >> 3) & 1

        if not tach_enabled:
            new_config = config_byte | 0x08
            i2c_write(dev_addr, config_reg, new_config)
        return True
    except Exception:
        return False


def read_tach_count(dev_addr, tach_reg):
    """
    Read the raw 16-bit tach count from a fan.
    Returns the integer count, or None on failure.
    """
    try:
        raw = i2c_read(dev_addr, 2, tach_reg)
        hex_str = raw.replace(" ", "")
        return int(hex_str, 16)
    except Exception:
        return None


def tach_count_to_rpm(tach_count):
    """Convert a raw tach count to RPM using the MAX31790 formula."""
    if tach_count is None or tach_count == 0 or tach_count >= TACH_COUNT_NO_FAN:
        return 0
    rpm = (60.0 / (NP * tach_count)) * SR * 8192
    return max(0, int(round(rpm)))


def read_tach_rpm(dev_addr, tach_reg):
    """
    Read tachometer count from a fan and calculate RPM.
    Returns RPM as an integer, or 0 if the fan is not spinning / not present.
    """
    tach_count = read_tach_count(dev_addr, tach_reg)
    return tach_count_to_rpm(tach_count)


def is_fan_present(dev_addr, config_reg, tach_reg):
    """
    Determine whether a real fan is physically connected to this channel.
    A channel is considered occupied if:
      1. The config register is readable (chip channel exists).
      2. The tach count is below the no-fan threshold.
      3. The resulting RPM is above MIN_RPM_THRESHOLD.
    """
    if not check_and_enable_tach(dev_addr, config_reg):
        return False, 0

    tach_count = read_tach_count(dev_addr, tach_reg)
    if tach_count is None or tach_count >= TACH_COUNT_NO_FAN:
        return False, 0

    rpm = tach_count_to_rpm(tach_count)
    if rpm < MIN_RPM_THRESHOLD:
        return False, 0

    return True, rpm


def set_pwm_duty(dev_addr, pwm_reg, duty_percent):
    """
    Set the PWM duty cycle for a fan (0-100%).
    The MAX31790 uses a 9-bit PWM target register
    (2 bytes: MSB[8:1], LSB[0] in bit 7).
    Returns the 9-bit raw value written.
    """
    duty_percent = max(0.0, min(100.0, float(duty_percent)))
    value_9bit = int((511 * duty_percent + 50) // 100)
    msb = (value_9bit >> 1) & 0xFF
    lsb = (value_9bit & 1) << 7
    i2c_write(dev_addr, pwm_reg, msb, lsb)
    return value_9bit
