"""
dmi.py - Unified dmidecode parser.
Single invocation, cached results, structured access by DMI type.
"""

import re
import subprocess


class DMIData:
    """
    Parses the full dmidecode output once and provides cached access
    to specific DMI types (motherboard, CPU, PCI slots, RAM).
    """

    def __init__(self):
        self._raw = self._run_dmidecode()
        self._sections = self._parse_all()
        self._motherboard = None
        self._cpus = None
        self._pci_slots = None
        self._memory = None

    @staticmethod
    def _run_dmidecode():
        try:
            result = subprocess.run(
                ["dmidecode"],
                capture_output=True, text=True, timeout=15
            )
            return result.stdout
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            return ""

    def _parse_all(self):
        """Parse full dmidecode output into {type_id: [list of record dicts]}."""
        sections = {}
        current_type = None
        current_record = None

        for line in self._raw.splitlines():
            # New handle line: "Handle 0x0002, DMI type 2, 15 bytes"
            m = re.match(r"^Handle\s+\S+,\s+DMI type\s+(\d+)", line)
            if m:
                if current_type is not None and current_record is not None:
                    sections.setdefault(current_type, []).append(current_record)
                current_type = int(m.group(1))
                current_record = {}
                continue

            if current_record is None:
                continue

            # Key: Value lines (indented with tab)
            kv = re.match(r"^\t([A-Za-z][^:]+):\s*(.*)", line)
            if kv:
                key = kv.group(1).strip()
                val = kv.group(2).strip()
                current_record[key] = val

        # Don't forget the last record
        if current_type is not None and current_record is not None:
            sections.setdefault(current_type, []).append(current_record)

        return sections

    def records(self, type_id):
        """Get all parsed records for a DMI type."""
        return self._sections.get(type_id, [])

    # -------------------------------------------------------------------
    # Type 2: Motherboard
    # -------------------------------------------------------------------

    @property
    def motherboard(self):
        if self._motherboard is None:
            records = self.records(2)
            if records:
                r = records[0]
                self._motherboard = {
                    "manufacturer": r.get("Manufacturer", ""),
                    "product_name": r.get("Product Name", ""),
                    "serial": r.get("Serial Number", ""),
                }
            else:
                self._motherboard = {
                    "manufacturer": "",
                    "product_name": "",
                    "serial": "",
                }
        return self._motherboard

    # -------------------------------------------------------------------
    # Type 4: CPU
    # -------------------------------------------------------------------

    @property
    def cpus(self):
        if self._cpus is None:
            self._cpus = []
            for r in self.records(4):
                # Skip unpopulated sockets
                status = r.get("Status", "")
                if "Unpopulated" in status:
                    continue
                self._cpus.append({
                    "socket": r.get("Socket Designation", ""),
                    "model": r.get("Version", ""),
                    "max_speed": r.get("Max Speed", ""),
                    "current_speed": r.get("Current Speed", ""),
                    "core_count": r.get("Core Count", ""),
                    "thread_count": r.get("Thread Count", ""),
                })
        return self._cpus

    # -------------------------------------------------------------------
    # Type 9: PCI Slots
    # -------------------------------------------------------------------

    @property
    def pci_slots(self):
        if self._pci_slots is None:
            self._pci_slots = []
            for r in self.records(9):
                designation = r.get("Designation", "")
                if designation == "N/A":
                    continue
                self._pci_slots.append({
                    "designation": designation,
                    "type": r.get("Type", ""),
                    "current_usage": r.get("Current Usage", ""),
                    "bus_address": r.get("Bus Address", ""),
                    "id": r.get("ID", ""),
                })
        return self._pci_slots

    # -------------------------------------------------------------------
    # Type 17: Memory Modules
    # -------------------------------------------------------------------

    @property
    def memory(self):
        if self._memory is None:
            self._memory = []
            current_bank = ""
            # Re-parse type 17 from raw to capture Bank Locator
            # which isn't always in the standard key-value position
            for r in self.records(17):
                self._memory.append({
                    "size": r.get("Size", "No Module Installed"),
                    "form_factor": r.get("Form Factor", ""),
                    "locator": r.get("Locator", ""),
                    "bank_locator": r.get("Bank Locator", ""),
                    "type": r.get("Type", ""),
                    "manufacturer": r.get("Manufacturer", ""),
                    "serial": r.get("Serial Number", ""),
                    "speed": r.get("Speed", ""),
                    "configured_speed": r.get("Configured Memory Speed",
                                             r.get("Configured Clock Speed", "")),
                })
        return self._memory
