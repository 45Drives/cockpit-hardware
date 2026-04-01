"""
ipmi.py - Unified ipmitool provider.
Single `ipmitool sensor` invocation, profile-driven field lookups.
Separate `ipmitool lan print 1` for IPMI LAN configuration.
"""

import re
import subprocess


class IPMIData:
    """
    Invokes ipmitool once, caches all sensor readings, and provides
    profile-driven lookups for CPU temp, DIMM temp, fans, power.
    """

    def __init__(self):
        self._sensors = None
        self._lan = None

    @property
    def sensors(self):
        """Parse ipmitool sensor output into {name: value_str}."""
        if self._sensors is None:
            self._sensors = {}
            try:
                result = subprocess.run(
                    ["ipmitool", "sensor"],
                    capture_output=True, text=True, timeout=30
                )
                raw = result.stdout
            except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
                return self._sensors

            for line in raw.splitlines():
                # Format: "Sensor Name    | value | units | ..."
                m = re.match(r"^(.+?)\s*\|\s*(\S+)\s*\|", line)
                if m:
                    name = m.group(1).strip()
                    val = m.group(2).strip()
                    self._sensors[name] = val
        return self._sensors

    def reading(self, sensor_name):
        """Get a single sensor reading, or None if not found."""
        val = self.sensors.get(sensor_name)
        if val is None or val.lower() == "na":
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return val

    def cpu_temps(self, profile):
        """
        Return list of (sensor_name, value) for CPU temp sensors
        defined in profile["ipmi_sensors"]["cpu_temp"].
        """
        fields = profile.get("ipmi_sensors", {}).get("cpu_temp", [])
        results = []
        for name in fields:
            val = self.reading(name)
            results.append((name, val))
        return results

    def dimm_temps(self, profile):
        """
        Return dict {sensor_name: value} for DIMM temp sensors
        defined in profile["ipmi_sensors"]["dimm_temp_fields"].
        """
        fields = profile.get("ipmi_sensors", {}).get("dimm_temp_fields", [])
        results = {}
        for name in fields:
            val = self.reading(name)
            results[name] = val
        return results

    def fan_speeds(self, profile):
        """
        Return dict {sensor_name: value} for fan sensors
        defined in profile["ipmi_sensors"]["fan_fields"].
        """
        fields = profile.get("ipmi_sensors", {}).get("fan_fields", [])
        results = {}
        for name in fields:
            val = self.reading(name)
            results[name] = val
        return results

    def power(self, profile):
        """
        Return dict {sensor_name: value} for power sensors
        defined in profile["ipmi_sensors"]["power_fields"].
        """
        fields = profile.get("ipmi_sensors", {}).get("power_fields", [])
        results = {}
        for name in fields:
            val = self.reading(name)
            results[name] = val
        return results

    def dimm_temp_for_locator(self, locator, profile):
        """
        Given a DIMM locator string (from dmidecode) and the board profile,
        resolve the IPMI sensor temperature for that DIMM.

        Uses profile["ram"]["locator_tags"] to map locator→sensor names,
        then checks ipmi sensors for a reading.
        """
        tags = profile.get("ram", {}).get("locator_tags", {})

        # Check direct locator match against sensor names first
        direct = self.reading(locator)
        if direct is not None:
            return direct

        # Check locator_tags mapping: locator → list of candidate sensor keys
        candidates = tags.get(locator, [])
        for sensor_key in candidates:
            # Try exact match
            val = self.reading(sensor_key)
            if val is not None:
                return val
            # Try with "_TEMP" suffix (Gigabyte naming)
            val = self.reading(sensor_key + "_TEMP")
            if val is not None:
                return val
            # Try with " Temp" suffix (Supermicro naming)
            val = self.reading(sensor_key + " Temp")
            if val is not None:
                return val

        return None

    @property
    def lan(self):
        """Parse ipmitool lan print 1 for IPMI LAN configuration."""
        if self._lan is None:
            self._lan = {
                "ip_address": "-",
                "subnet_mask": "-",
                "mac_address": "-",
                "default_gateway": "-",
            }
            try:
                result = subprocess.run(
                    ["ipmitool", "lan", "print", "1"],
                    capture_output=True, text=True, timeout=15
                )
                raw = result.stdout
            except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
                return self._lan

            field_map = {
                "IP Address": "ip_address",
                "Subnet Mask": "subnet_mask",
                "MAC Address": "mac_address",
                "Default Gateway IP": "default_gateway",
            }
            for line in raw.splitlines():
                for field, key in field_map.items():
                    m = re.match(
                        r"^" + re.escape(field) + r"\s+:\s+(\S+)", line
                    )
                    if m:
                        self._lan[key] = m.group(1)
        return self._lan
