"""
pci.py - PCI slot detection, HBA/network/SATA card identification.
Uses board profiles for address-to-slot mapping instead of hardcoded LUTs.
"""

import os
import re
import subprocess


# Models detected by lspci for various card types
HBA_MODELS = [
    "9600-16i", "9600-24i", "SAS9305-16i", "SAS9305-24i",
    "HBA 9405W-16i", "9361-16i", "HBA 9400-16i", "LSI HBA 9400-16i",
    "SAS3416", "9361-24i", "9660-16i",
]

NETWORK_CARD_MODELS = [
    "X540-AT2", "XL710", "XXV710", "82599ES",
    "BCM57412", "MT27800",
]

SATA_CONTROLLERS = [
    "ASM1062", "Raptor Lake SATA AHCI Controller",
]


class PCIInfo:
    """
    Unified PCI slot and device detection.
    Combines dmidecode type-9 data, lspci, and profile address mappings.
    """

    def __init__(self, dmi_data, profile):
        self._dmi = dmi_data
        self._profile = profile
        self._pci_cfg = profile.get("pci", {})
        self._lspci_cache = None
        self._hba_cache = None

    @property
    def lspci_devices(self):
        """Parse lspci -mm into {bus_address: [class, vendor, device, ...]}."""
        if self._lspci_cache is not None:
            return self._lspci_cache

        self._lspci_cache = {}
        try:
            result = subprocess.run(
                ["lspci", "-mm"],
                capture_output=True, text=True, timeout=15
            )
            raw = result.stdout
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            return self._lspci_cache

        bus_rx = re.compile(r"^([0-9a-fA-F]{2}:[0-9a-fA-F]{2}\.[0-9])")
        exclusions = self._pci_cfg.get("lspci_exclusions", [])

        for line in raw.splitlines():
            m = bus_rx.match(line)
            if not m:
                continue
            bus_address = "0000:" + m.group(1)
            fields = re.findall(r'"[^"]*"|[\S]+', line)[1:]

            if exclusions and any(ex in " ".join(fields) for ex in exclusions):
                continue

            self._lspci_cache[bus_address] = fields
        return self._lspci_cache

    def _is_endpoint(self, bus_address):
        """Check if a PCI device is an endpoint (not a bridge)."""
        info = self.lspci_devices.get(bus_address)
        if not info:
            return False
        cls = str(info[0]).strip('"').lower()
        return "bridge" not in cls

    def _endpoint_buses(self):
        return {
            bus for bus, info in self.lspci_devices.items()
            if self._is_endpoint(bus)
        }

    # -------------------------------------------------------------------
    # PCI slot enumeration from dmidecode type 9
    # -------------------------------------------------------------------

    def _raw_slots(self):
        """
        Get PCI slot records from DMI type 9, applying profile-based
        designation normalization and address fixups.
        """
        slots = []
        address_fixups = self._pci_cfg.get("address_fixups", {})
        strip_suffix = self._pci_cfg.get("strip_designation_suffix", False)
        dedup = self._pci_cfg.get("deduplicate_by_designation", False)

        seen = {}
        for record in self._dmi.records(9):
            designation = record.get("Designation", "")
            if designation == "N/A":
                continue

            bus_address = record.get("Bus Address", "")
            slot_type = record.get("Type", "")
            current_usage = record.get("Current Usage", "")

            # Apply address fixups from profile
            if bus_address in address_fixups:
                bus_address = address_fixups[bus_address]

            # Strip trailing _A, _B suffixes if profile says to
            if strip_suffix:
                designation = re.sub(r"_[A-Z]$", "", designation)

            # Override slot type from profile if available
            profile_types = self._pci_cfg.get("slot_types", {})
            aux_types = self._pci_cfg.get("aux_slot_types", {})
            if designation in profile_types:
                slot_type = profile_types[designation]
            elif designation in aux_types:
                slot_type = aux_types[designation]

            # Apply type decorations for special slot prefixes
            if designation.startswith("U2_"):
                slot_type = "MCIO Port"
            elif designation.startswith("OCU") and not slot_type.startswith("OCulink"):
                slot_type = f"OCulink ({slot_type})" if slot_type else "OCulink"
            elif designation.startswith("M2_") and not slot_type.startswith("M.2"):
                slot_type = f"M.2 Slot ({slot_type})" if slot_type else "M.2 Slot"

            slot = {
                "Designation": designation,
                "Type": slot_type,
                "Current Usage": current_usage,
                "Bus Address": bus_address,
                "ID": record.get("ID", ""),
            }

            # Skip zero bus addresses
            if bus_address == "0000:00:00.0":
                continue

            # Deduplication
            if dedup:
                base_key = re.sub(r"_[A-Z]$", "", designation)
                if base_key in seen:
                    continue
                seen[base_key] = True
            else:
                if designation in seen:
                    continue
                seen[designation] = True

            slots.append(slot)

        return slots

    def _resolve_slot_usage(self, slots):
        """
        Use profile address_to_slot mappings to determine which slots
        are in use and resolve their bus addresses.
        """
        address_to_slot = self._pci_cfg.get("address_to_slot", {})
        endpoint_buses = self._endpoint_buses()

        if not address_to_slot:
            # No profile mapping — use dmidecode's "Current Usage" as-is
            for slot in slots:
                if slot["Current Usage"] != "In Use":
                    slot["Current Usage"] = "Available"
            return slots

        slot_map = {s["Designation"]: s for s in slots}

        for designation, candidate_addrs in address_to_slot.items():
            if designation not in slot_map:
                # Profile defines a slot not in dmidecode — create it
                slot_type = self._pci_cfg.get("slot_types", {}).get(
                    designation,
                    self._pci_cfg.get("aux_slot_types", {}).get(designation, "")
                )
                slot_map[designation] = {
                    "Designation": designation,
                    "Type": slot_type,
                    "Current Usage": "Available",
                    "Bus Address": "",
                    "ID": "",
                }

            slot = slot_map[designation]
            in_use = False
            resolved_addr = ""

            if not isinstance(candidate_addrs, list):
                candidate_addrs = [candidate_addrs]

            # Prefer endpoints, then any known device
            for addr in candidate_addrs:
                if addr in endpoint_buses:
                    resolved_addr = addr
                    in_use = True
                    break
            if not resolved_addr:
                for addr in candidate_addrs:
                    if addr in self.lspci_devices:
                        resolved_addr = addr
                        in_use = True
                        break

            if resolved_addr:
                slot["Bus Address"] = resolved_addr
            slot["Current Usage"] = "In Use" if in_use else "Available"

        # Respect slot_order if defined
        slot_order = self._pci_cfg.get("slot_order", [])
        if slot_order:
            ordered = []
            for designation in slot_order:
                if designation in slot_map:
                    ordered.append(slot_map.pop(designation))
            # Append remaining slots not in order list
            ordered.extend(slot_map.values())
            return ordered

        return list(slot_map.values())

    # -------------------------------------------------------------------
    # HBA detection
    # -------------------------------------------------------------------

    def _detect_hbas(self):
        """Detect HBA cards via lspci -d 1000:*."""
        if self._hba_cache is not None:
            return self._hba_cache

        self._hba_cache = []
        try:
            result = subprocess.run(
                ["lspci", "-d", "1000:*", "-vv",
                 "-i", "/opt/45drives/tools/pci.ids"],
                capture_output=True, text=True, timeout=15
            )
            raw = result.stdout
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            return self._hba_cache

        pattern = "|".join(re.escape(m) for m in HBA_MODELS)
        rx = re.compile(
            r"^(\w\w:\w\w\.\w).*?\n(?:\t.*\n)*?.*?(" + pattern + ")",
            re.MULTILINE
        )
        for m in rx.finditer(raw):
            self._hba_cache.append({
                "model": m.group(2),
                "bus_address": "0000:" + m.group(1),
            })
        return self._hba_cache

    # -------------------------------------------------------------------
    # SATA controller detection
    # -------------------------------------------------------------------

    def _detect_sata_controllers(self):
        """Detect add-in SATA controllers via lspci."""
        controllers = []
        try:
            result = subprocess.run(
                ["lspci"], capture_output=True, text=True, timeout=15
            )
            raw = result.stdout
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            return controllers

        for line in raw.splitlines():
            for model in SATA_CONTROLLERS:
                m = re.search(rf"^(\S+).*({re.escape(model)}).*$", line)
                if m:
                    controllers.append({
                        "model": m.group(2),
                        "bus_address": "0000:" + m.group(1),
                    })
        return controllers

    # -------------------------------------------------------------------
    # Network card detection
    # -------------------------------------------------------------------

    def _detect_network_cards(self):
        """Detect network card models from lspci for known models."""
        cards = {}  # bus_address -> model
        for bus_addr, fields in self.lspci_devices.items():
            if not fields:
                continue
            cls = str(fields[0]).strip('"').lower()
            if "ethernet" not in cls and "network" not in cls:
                continue
            line_str = " ".join(str(f).strip('"') for f in fields)
            for model in NETWORK_CARD_MODELS:
                if model in line_str:
                    cards[bus_addr] = model
                    break
            else:
                # Store vendor + device for unrecognized cards
                if len(fields) >= 3:
                    cards[bus_addr] = f"{str(fields[1]).strip(chr(34))} {str(fields[2]).strip(chr(34))}"
        return cards

    # -------------------------------------------------------------------
    # HBA firmware from server_info
    # -------------------------------------------------------------------

    @staticmethod
    def _get_hba_firmware():
        """Read HBA firmware info from /etc/45drives/server_info/server_info.json."""
        json_path = "/etc/45drives/server_info/server_info.json"
        if not os.path.exists(json_path):
            return {}
        try:
            import json
            with open(json_path, "r") as f:
                si = json.load(f)
            return {
                card.get("Bus Address", ""): card.get("Firmware Version", "-")
                for card in si.get("HBA", [])
            }
        except (OSError, ValueError, KeyError):
            return {}

    # -------------------------------------------------------------------
    # OCulink usage detection
    # -------------------------------------------------------------------

    @staticmethod
    def _detect_ocu_usage():
        """Detect OCU1/OCU2 usage from /dev/disk/by-path ATA entries."""
        usage = {"OCU1": [], "OCU2": []}
        bypath = "/dev/disk/by-path"
        try:
            entries = os.listdir(bypath)
        except OSError:
            return usage

        rx = re.compile(r"^pci-[0-9a-fA-F:.-]+-ata-(\d+)$")
        for name in entries:
            if "-part" in name or "-nvme-" in name or "-sas-" in name:
                continue
            m = rx.match(name)
            if not m:
                continue
            port = int(m.group(1))
            target = os.path.realpath(os.path.join(bypath, name))
            dev = os.path.basename(target)
            if 1 <= port <= 4:
                usage["OCU1"].append(dev)
            elif 5 <= port <= 8:
                usage["OCU2"].append(dev)
        return usage

    # -------------------------------------------------------------------
    # Main: assemble full PCI slot info
    # -------------------------------------------------------------------

    def collect(self):
        """
        Return list of PCI slot dicts with card type, model, firmware.
        This is the main entry point replacing the 972-line pci script.
        """
        slots = self._raw_slots()
        slots = self._resolve_slot_usage(slots)

        hbas = self._detect_hbas()
        sata_ctrls = self._detect_sata_controllers()
        net_cards = self._detect_network_cards()
        hba_firmware = self._get_hba_firmware()

        # Build bus_address -> device info lookup
        device_map = {}
        for hba in hbas:
            device_map[hba["bus_address"]] = {
                "card_type": "HBA",
                "card_model": hba["model"],
            }
        for ctrl in sata_ctrls:
            device_map[ctrl["bus_address"]] = {
                "card_type": "Serial ATA Controller",
                "card_model": ctrl["model"],
            }
        for bus_addr, model in net_cards.items():
            device_map[bus_addr] = {
                "card_type": "Network Card",
                "card_model": model,
            }

        # Also check profile address_to_slot for multi-address slots
        address_to_slot = self._pci_cfg.get("address_to_slot", {})

        # Match devices to slots
        for slot in slots:
            bus = slot.get("Bus Address", "")
            designation = slot.get("Designation", "")

            # Direct bus match
            if bus in device_map:
                slot["Card Type"] = device_map[bus]["card_type"]
                slot["Card Model"] = device_map[bus]["card_model"]
            else:
                # Check all candidate addresses from profile
                candidates = address_to_slot.get(designation, [])
                if not isinstance(candidates, list):
                    candidates = [candidates]
                for addr in candidates:
                    if addr in device_map:
                        slot["Card Type"] = device_map[addr]["card_type"]
                        slot["Card Model"] = device_map[addr]["card_model"]
                        if not bus:
                            slot["Bus Address"] = addr
                        break

            # HBA firmware
            fw = hba_firmware.get(bus, "")
            if fw:
                slot["Firmware Version"] = fw

            # Fix slot type if still unknown
            slot_type = slot.get("Type", "")
            if not slot_type or slot_type in ("<OUT OF SPEC>", "Unknown", "-"):
                from . import sysfs
                inferred = sysfs.infer_pcie_type(bus)
                if inferred:
                    slot["Type"] = inferred

            # Mark slots with detected cards as In Use
            if slot.get("Card Type") and bus and bus != "0000:00:00.0":
                slot["Current Usage"] = "In Use"

        # OCulink usage detection for EC266D2I
        board_name = self._profile.get("board_name", "")
        if board_name.startswith("EC266D2I"):
            ocu_usage = self._detect_ocu_usage()
            for slot in slots:
                desig = slot.get("Designation", "")
                if desig in ("OCU1", "OCU2"):
                    if ocu_usage.get(desig):
                        slot["Current Usage"] = "In Use"

        # Renumber IDs
        for idx, slot in enumerate(slots, start=1):
            slot["ID"] = str(idx)

        return slots

    def to_json_list(self):
        """Return the slot data formatted for the frontend JSON output."""
        result = []
        for slot in self.collect():
            result.append({
                "slot": " ".join(slot.get("Designation", "-").split()[:2]),
                "type": slot.get("Type", "-"),
                "availibility": slot.get("Current Usage", "-"),
                "busAddress": slot.get("Bus Address", "-"),
                "cardType": slot.get("Card Type", "-"),
                "cardModel": slot.get("Card Model", "-"),
                "firmwareVersion": slot.get("Firmware Version", "-"),
            })
        return result
