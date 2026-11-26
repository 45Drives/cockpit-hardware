import contextlib
import importlib.machinery
import importlib.util
import io
import json
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIRS = {
    "motherboard": ROOT / "45drives-motherboard" / "public" / "helper_scripts",
    "system": ROOT / "45drives-system" / "public" / "scripts",
}
BOARDS = ("GENOAD8UD-2T/X550", "TURIND8UD-2T/X550")
SLOTS = [
    ("PCIE3", "19", "0000:40:01.1"),
    ("PCIE4", "20", "0000:00:01.1"),
    ("PCIE5", "21", "0000:80:01.1"),
    ("PCIE6", "22", "0000:c0:01.1"),
    ("MCIO1-1", "81", "0000:c0:03.1"),
    ("MCIO1-2", "82", "0000:c0:03.2"),
    ("MCIO2-1", "83", "0000:c0:03.3"),
    ("MCIO2-2", "84", "0000:c0:03.4"),
    ("MCIO3-1", "85", "0000:40:03.2"),
    ("MCIO3-2", "86", "0000:40:03.1"),
    ("MCIO4-1", "87", "0000:40:03.4"),
    ("MCIO4-2", "88", "0000:40:03.3"),
    ("MCIO5", "89", "0000:80:03.1"),
    ("M2_1", "1", "0000:80:03.3"),
    ("M2_2", "2", "0000:80:03.2"),
]
IN_USE = {"PCIE5", "MCIO2-1", "MCIO4-1", "MCIO4-2"}
DMI_SLOTS = "".join(
    f"Handle 0x{index:04x}, DMI type 9, 28 bytes\n"
    f"\tDesignation: {name}\n\tType: PCI Express 5 x{16 if index < 4 else 4}\n"
    f"\tCurrent Usage: {'In Use' if name in IN_USE else 'Available'}\n"
    f"\tID: {slot_id}\n\tBus Address: {bus}\n"
    for index, (name, slot_id, bus) in enumerate(SLOTS)
)
LSPCI = "".join(f'{line}\n' for line in (
    '00:05.1 "PCI bridge" "AMD" "GPP Bridge"',
    '01:00.0 "Ethernet controller" "Intel Corporation" "Ethernet Controller X550"',
    '40:03.3 "PCI bridge" "AMD" "GPP Bridge"',
    '40:03.4 "PCI bridge" "AMD" "GPP Bridge"',
    '41:00.0 "Non-Volatile memory controller" "Micron Technology Inc" "7450 PRO NVMe SSD"',
    '43:00.0 "Non-Volatile memory controller" "Micron Technology Inc" "7450 PRO NVMe SSD"',
    '80:01.1 "PCI bridge" "AMD" "GPP Bridge"',
    '81:00.0 "3D controller" "NVIDIA Corporation" "AD104GL [L4]"',
    'c0:03.1 "PCI bridge" "AMD" "GPP Bridge"',
    'c0:03.3 "PCI bridge" "AMD" "GPP Bridge"',
    'c3:00.0 "Ethernet controller" "Mellanox Technologies" "MT27800 Family [ConnectX-5]"',
))
BEHIND_ROOT = {
    "0000:c0:03.3": "0000:c3:00.0",
    "0000:40:03.3": "0000:41:00.0",
    "0000:40:03.4": "0000:43:00.0",
    "0000:80:01.1": "0000:81:00.0",
}


def load_helper(name, directory):
    loader = importlib.machinery.SourceFileLoader(name, str(directory / name))
    spec = importlib.util.spec_from_loader(name, loader)
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


def board_info(board):
    return {"Motherboard": [{"Product Name": board}]}


def pci_slots_by_designation(output):
    """The helper prints {"PCI Info": [...]}; the system script prints a flat list for its table."""
    if isinstance(output, dict):
        return {s["Designation"]: s for s in output["PCI Info"]}
    keys = {"availibility": "Current Usage", "busAddress": "Bus Address",
            "cardType": "Card Type", "cardModel": "Card Model"}
    return {
        row["slot"]: {keys[k]: v for k, v in row.items() if k in keys and v != "-"}
        for row in output
    }


def fake_command(board):
    outputs = {
        ("dmidecode", "-t", "9"): DMI_SLOTS,
        ("dmidecode", "-s", "baseboard-product-name"): board,
        ("dmidecode", "-s", "baseboard-manufacturer"): "ASRockRack",
        ("lspci", "-mm"): LSPCI,
    }
    return lambda args: outputs.get(tuple(args), "")


@contextlib.contextmanager
def fake_system(board):
    """Answer the commands the helpers run (dmidecode, lspci) with captured output."""
    command = fake_command(board)
    with patch("subprocess.Popen", side_effect=lambda args, *a, **k: SimpleNamespace(
        stdout=io.StringIO(command(args)),
        communicate=lambda *x, **y: (command(args), ""),
        wait=lambda *x, **y: 0, returncode=0,
    )), patch("subprocess.run", side_effect=lambda args, *a, **k: SimpleNamespace(
        stdout=command(args), stderr="", returncode=0,
    )), patch("subprocess.check_output", side_effect=lambda args, *a, **k: command(args)):
        yield


class TurinHelpersTest:
    scripts = None

    def pin_board(self, module, board):
        """Scripts that read server_info.json need the board pinned; the system pci asks dmidecode."""
        if self.scripts == SCRIPT_DIRS["system"] and module.__name__ == "pci":
            return contextlib.nullcontext()
        info = board_info(board)
        value = info if module.__name__ == "pci" else json.dumps(info)
        return patch.object(module, "get_motherboard_model_server_info", return_value=value)

    def test_dmi_detection_does_not_mark_supported_board_generic(self):
        motherboard = load_helper("motherboard", self.scripts)
        for board in BOARDS:
            dmi = (
                f"\tManufacturer: ASRockRack\n\tProduct Name: {board}\n"
                "\tSerial Number: test\n"
            )
            with self.subTest(board=board), patch.object(
                motherboard, "get_motherboard_model_server_info",
                return_value='{"Motherboard": [{"Product Name": "?"}]}',
            ), patch.object(
                motherboard.subprocess, "Popen",
                return_value=SimpleNamespace(stdout=io.StringIO(dmi)),
            ):
                info = json.loads(motherboard.get_motherboard_model())
                self.assertEqual(info["Motherboard"][0]["Product Name"], board)

    def test_ram_bank_locators_match_masks_including_last_slot(self):
        ram = load_helper("ram", self.scripts)
        channels = "ABCEGHIK"
        dmi = "".join(
            f"Handle 0x{index:04x}, DMI type 17, 92 bytes\n"
            f"\tSize: {'64 GiB' if index == 0 else 'No Module Installed'}\n"
            f"\tLocator: DIMM 0\n\tBank Locator: P0 CHANNEL {channel}\n"
            for index, channel in enumerate(channels)
        )
        for board in BOARDS:
            with self.subTest(board=board), patch.object(
                ram, "get_motherboard_model_server_info",
                return_value=json.dumps(board_info(board)),
            ), patch.object(
                ram.subprocess, "Popen",
                return_value=SimpleNamespace(stdout=io.StringIO(dmi)),
            ):
                slots = ram.dmidecode()
                self.assertEqual(
                    [slot["Locator"] for slot in slots],
                    [f"DIMM {channel}1" for channel in channels],
                )
                self.assertEqual(
                    [slot["Temperature Keys"] for slot in slots],
                    [[f"TEMP_DDR5_{channel}1"] for channel in channels],
                )
                self.assertEqual(slots[0]["Size"], "64 GiB")
                self.assertEqual(slots[-1]["Size"], "No Module Installed")

    def test_pci_retains_compound_mcio_designations_and_firmware_ids(self):
        pci = load_helper("pci", self.scripts)
        for board in BOARDS:
            with self.subTest(board=board), fake_system(board), self.pin_board(pci, board), patch.object(
                pci, "get_disk_by_path", return_value={},
            ):
                slots = pci.dmidecode()
                self.assertEqual(
                    [(s["Designation"], s["ID"], s["Bus Address"]) for s in slots],
                    SLOTS,
                )
                self.assertTrue(all(s["Type"] == "MCIO Port" for s in slots[4:13]))
                self.assertTrue(all(s["Type"].startswith("M.2 Slot") for s in slots[13:]))

    def test_pci_resolves_bridge_without_claiming_another_slots_endpoint(self):
        pci = load_helper("pci", self.scripts)
        roots = {
            "0000:c0:03.1": "0000:c1:00.0",
            "0000:c0:03.3": "0000:c3:00.0",
        }
        lspci = {root: ['"PCI bridge"'] for root in roots}
        for board in BOARDS:
            slots = [
                {"Designation": name, "Bus Address": bus, "Current Usage": "Available"}
                for name, _, bus in SLOTS[4:8]
            ]
            with self.subTest(board=board), fake_system(board), self.pin_board(pci, board), patch.object(
                pci, "has_downstream_endpoint", side_effect=lambda bus, _: bus in roots,
            ), patch.object(
                pci, "first_endpoint_addr", side_effect=lambda bus, _: roots.get(bus),
            ):
                resolved = pci.process_pci_slots_and_devices(slots, [], lspci)
                self.assertEqual(
                    [slot["Current Usage"] for slot in resolved],
                    ["In Use", "Available", "In Use", "Available"],
                )
                self.assertEqual(resolved[0]["Bus Address"], "0000:c1:00.0")
                self.assertEqual(resolved[2]["Bus Address"], "0000:c3:00.0")

    def test_pci_describes_devices_behind_each_slot_and_leaves_empty_ports_available(self):
        pci = load_helper("pci", self.scripts)
        for board in BOARDS:
            stdout = io.StringIO()
            with self.subTest(board=board), fake_system(board), self.pin_board(pci, board), patch.object(
                pci, "get_disk_by_path", return_value={},
            ), patch.object(
                pci, "has_downstream_endpoint", side_effect=lambda bus, _: bus in BEHIND_ROOT,
            ), patch.object(
                pci, "first_endpoint_addr", side_effect=lambda bus, _: BEHIND_ROOT.get(bus),
            ), patch.object(pci, "lspci_hba", return_value=[]), patch.object(
                pci, "network", return_value=[],
            ), patch.object(pci, "sata", return_value=[]), patch.object(
                pci, "getNetworkCardModel", return_value="MT27800",
            ), patch("sys.argv", ["pci"]), patch("sys.stdout", stdout):
                pci.main()
            slots = pci_slots_by_designation(json.loads(stdout.getvalue()))
            self.assertEqual(
                {name for name, slot in slots.items() if slot["Current Usage"] == "In Use"},
                IN_USE,
            )
            self.assertEqual(slots["MCIO4-1"]["Bus Address"], "0000:43:00.0")
            self.assertEqual(slots["MCIO4-2"]["Bus Address"], "0000:41:00.0")
            self.assertEqual(slots["MCIO4-1"]["Card Model"], "7450 PRO NVMe SSD")
            self.assertEqual(slots["PCIE5"]["Card Model"], "AD104GL [L4]")
            self.assertEqual(slots["MCIO2-1"]["Card Type"], "Network Card")
            self.assertEqual(slots["MCIO2-1"]["Bus Address"], "0000:c3:00.0")
            self.assertNotIn("Card Type", slots["MCIO1-1"])

    def test_onboard_devices_are_excluded_from_pci_card_matching(self):
        pci = load_helper("pci", self.scripts)
        for board in BOARDS:
            with self.subTest(board=board), fake_system(board), self.pin_board(pci, board):
                found = pci.parse_lspci_output()
                self.assertNotIn("0000:01:00.0", {a for a, v in found.items() if "BCM57416" in " ".join(v)})
                self.assertFalse(any("Non-Essential" in " ".join(v) for v in found.values()))
                self.assertIn("0000:c3:00.0", found)


class MotherboardScriptsTest(TurinHelpersTest, unittest.TestCase):
    scripts = SCRIPT_DIRS["motherboard"]


class SystemScriptsTest(TurinHelpersTest, unittest.TestCase):
    scripts = SCRIPT_DIRS["system"]


if __name__ == "__main__":
    unittest.main()
