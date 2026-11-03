"""Run with: python3 -m unittest discover -s tests -p 'test_firmware_policy.py'."""

import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import Mock, patch


ROOT = Path(__file__).resolve().parents[1]
FIRMWARE = ROOT / "system_files/usr/share/45drives/firmware"
sys.path.insert(0, str(FIRMWARE))
import firmware_policy as policy
from firmware_qualification import build_catalogs, evaluate_qualification


def load_script(path):
    module = types.ModuleType(path.name.replace("-", "_"))
    module.__file__ = str(path)
    exec(compile(path.read_text(), str(path), "exec"), module.__dict__)
    return module


class FirmwarePolicyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.sysfs = Path(self.temp.name) / "sys"
        self.start_patch(patch.object(policy, "SYSFS_ROOT", self.sysfs))
        self.os_release = Path(self.temp.name) / "os-release"
        self.start_patch(patch.object(policy, "OS_RELEASE_PATHS", (self.os_release,)))
        self.start_patch(patch.object(policy, "PROXMOX_VERSION_TOOL", Path(self.temp.name) / "no-pve"))
        self.os_release.write_text('ID=ubuntu\nVERSION_ID="24.04"\n')
        self.board("ROMED8-2T")

    def start_patch(self, patcher):
        result = patcher.start()
        self.addCleanup(patcher.stop)
        return result

    def write(self, relative, text):
        path = self.sysfs / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        return path

    def board(self, model, vendor="ASRockRack"):
        self.write("class/dmi/id/board_vendor", vendor)
        self.write("class/dmi/id/board_name", model)

    def nic(self, address="0000:41:00.0", subsystem="0x8086", onboard=None, model="X550"):
        self.write(f"bus/pci/devices/{address}/subsystem_vendor", subsystem)
        if onboard is not None:
            self.write(f"bus/pci/devices/{address}/index", onboard)
        return {"type": "nic", "model": model, "bus_info": address, "device": "enp65s0f0"}

    def qualified_catalog(self, model, os_id="rocky", version="9.8"):
        return build_catalogs({"components": {"nic": [{
            "model_match": model, "latest_firmware": "5.10", "flashable": True,
            "flash_tool": "nvmupdate64e", "tool_package": "intel.tar.gz",
            "tool_package_sha256": "a" * 64,
            "release_status": "approved", "update_method": "self_service",
            "validation_profiles": [{"id": "lab-profile", "qualification": "45drives_validated",
                "test_report_id": "LAB-001", "os": {"id": os_id, "version_ids": [version], "architecture": "x86_64"}}]
        }]}})[0]

    def test_onboard_ports_on_rome_and_genoa_are_blocked(self):
        nic = self.nic(onboard="1")
        for model in ("ROMED8-2T", "ROMED8-2T/BCM", "GENOAD8UD-2T/X550", "GENOAD8X-2T/BCM"):
            with self.subTest(model=model):
                self.board(model)
                self.assertEqual(policy.nic_update_policy(nic)["blocked_reason"], policy.ASROCK_ONBOARD_REASON)

    def test_retail_x550_on_same_board_remains_eligible(self):
        self.nic(onboard="1")
        addon = self.nic("0000:81:00.0")
        self.assertNotIn("blocked_reason", policy.nic_update_policy(addon))

    def test_asrock_subsystem_is_blocked_without_onboard_index(self):
        nic = self.nic(subsystem="0x1849")
        self.assertEqual(policy.nic_update_policy(nic)["blocked_reason"], policy.ASROCK_ONBOARD_REASON)

    def test_asrock_vendor_id_blocks_onboard_nics_on_real_boards(self):
        # Values read from real hosts: no BIOS onboard index, ASRock subsystem 0x1849.
        cases = (
            ("TURIND8X-2T/500W", "0000:02:00.0", "BCM57416"),   # 192.168.8.90, port 0
            ("TURIND8X-2T/500W", "0000:02:00.1", "BCM57416"),   # 192.168.8.90, port 1
            ("ROMED8-2T/BCM", "0000:42:00.0", "BCM57416"),
            ("ROMED8-2T", "0000:41:00.0", "X550"),              # onboard X550-AT2
        )
        for board, address, model in cases:
            with self.subTest(board=board, address=address):
                self.board(board)
                nic = self.nic(address, subsystem="0x1849", model=model)
                result = policy.nic_update_policy(nic)
                self.assertEqual(result["blocked_reason"], policy.ASROCK_ONBOARD_REASON)
                self.assertEqual(result["firmware_update_note"], policy.ASROCK_ONBOARD_NOTE)

    def test_asrock_vendor_id_blocks_even_when_board_name_is_unknown(self):
        self.board("To Be Filled By O.E.M.", "To Be Filled By O.E.M.")
        nic = self.nic(subsystem="0x1849")
        self.assertEqual(policy.nic_update_policy(nic)["blocked_reason"], policy.ASROCK_ONBOARD_REASON)

    def test_addin_card_on_asrock_board_is_not_blocked(self):
        # 192.168.8.90: add-in ConnectX-7 reports NVIDIA's subsystem vendor.
        self.board("TURIND8X-2T/500W")
        nic = self.nic("0000:01:00.0", subsystem="0x15b3", model="ConnectX-7")
        self.assertNotIn("blocked_reason", policy.nic_update_policy(nic))

    def test_second_port_inherits_function_zero_onboard_identity(self):
        self.nic(onboard="2")
        nic = self.nic("0000:41:00.1")
        self.assertIn("blocked_reason", policy.nic_update_policy(nic))

    def test_acpi_onboard_index(self):
        nic = self.nic()
        self.write("bus/pci/devices/0000:41:00.0/acpi_index", "0")
        self.assertIn("blocked_reason", policy.nic_update_policy(nic))

    def test_invalid_indices_do_not_hide_addon(self):
        nic = self.nic()
        for index in ("", "garbage", "-1", "16777215"):
            with self.subTest(index=index):
                self.write("bus/pci/devices/0000:41:00.0/index", index)
                self.assertNotIn("blocked_reason", policy.nic_update_policy(nic))

    def test_other_motherboard_and_non_nic_are_unaffected(self):
        self.board("H12SSL-i", "Supermicro")
        nic = self.nic(onboard="1")
        self.assertNotIn("blocked_reason", policy.nic_update_policy(nic))
        nic["type"] = "hba"
        self.assertEqual(policy.nic_update_policy(nic), {})

    def test_legacy_bus_and_interface_cache_formats(self):
        self.nic(subsystem="0x1849")
        pci = self.sysfs / "bus/pci/devices/0000:41:00.0"
        iface = self.sysfs / "class/net/eno1/device"
        iface.parent.mkdir(parents=True)
        iface.symlink_to(pci, target_is_directory=True)
        for device in ({"device_path": "41:00.0"}, {"device": "eno1"}):
            self.assertIn("blocked_reason", policy.nic_update_policy(dict(type="nic", **device)))

    def test_check_preserves_inventory_but_removes_update_and_badge_count(self):
        checker = load_script(FIRMWARE / "firmware-check")
        onboard = self.nic(subsystem="0x1849")
        addon = self.nic("0000:81:00.0")
        for nic in (onboard, addon):
            nic["firmware"] = "3.10"
        manifest = self.qualified_catalog("X550", "ubuntu", "24.04")
        manifest["components"]["nic"][0]["latest_firmware"] = "3.70"
        self.start_patch(patch.object(checker, "load_manifest", return_value=manifest))
        self.start_patch(patch.object(checker, "run_discover", return_value={"devices": [onboard, addon]}))
        self.start_patch(patch.object(checker, "CACHE_PATH", str(Path(self.temp.name) / "status.json")))
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(checker.main(), 2)
        cache = json.loads(Path(checker.CACHE_PATH).read_text())
        oem, retail = cache["devices"]
        self.assertFalse(oem["flashable"])
        self.assertEqual(oem["current_firmware"], "3.10")
        self.assertEqual(oem["update_available"], "unknown")
        self.assertEqual(oem["latest_firmware"], "")
        self.assertEqual(oem["blocked_reason"], policy.ASROCK_ONBOARD_REASON)
        self.assertEqual(oem["cache_index"], 0)
        self.assertTrue(retail["flashable"])
        self.assertEqual(retail["cache_index"], 1)
        self.assertEqual(cache["summary"], {"total": 2, "current": 0, "outdated": 1, "unknown": 1})

    def test_onboard_only_does_not_report_available_updates(self):
        checker = load_script(FIRMWARE / "firmware-check")
        onboard = self.nic(subsystem="0x1849")
        self.start_patch(patch.object(checker, "load_manifest", return_value={"components": {"nic": []}}))
        self.start_patch(patch.object(checker, "run_discover", return_value={"devices": [onboard]}))
        self.start_patch(patch.object(checker, "write_cache"))
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(checker.main(), 0)

    def test_stale_cache_is_blocked_before_preflight_downloads_or_flash(self):
        flash = load_script(FIRMWARE / "firmware-flash")
        nic = self.nic(subsystem="0x1849")
        nic.update(flashable=True, update_available="outdated", flash_tool="nvmupdate64e")
        self.start_patch(patch.object(flash, "load_cache", return_value={"devices": [nic]}))
        execute = self.start_patch(patch.object(flash, "flash_device", side_effect=AssertionError("must not flash")))
        for flags in ([], ["--dry-run"], ["--preflight"]):
            with patch.object(sys, "argv", ["firmware-flash", "--cache-index", "0"] + flags):
                output = io.StringIO()
                with contextlib.redirect_stdout(output), contextlib.redirect_stderr(io.StringIO()):
                    self.assertEqual(flash.main(), 0 if flags == ["--preflight"] else 3)
                if flags == ["--preflight"]:
                    info = json.loads(output.getvalue())
                    self.assertTrue(info["blocked"])
                    self.assertEqual(info["downloads"], [])
                    self.assertEqual(info["actions"], [])
        execute.assert_not_called()

    def test_direct_flash_routing_also_blocks_onboard(self):
        flash = load_script(FIRMWARE / "firmware-flash")
        nic = self.nic(subsystem="0x1849")
        nic["tool_package"] = "intel.tar.gz"
        package = self.start_patch(patch.object(flash, "flash_tool_package"))
        success, reason = flash.flash_device(nic)
        self.assertFalse(success)
        self.assertIn("ASRock-signed", reason)
        package.assert_not_called()

    def test_legacy_flasher_also_rechecks_live_hardware(self):
        flash = load_script(ROOT / "45drives-system/public/scripts/firmware-flash")
        nic = self.nic(subsystem="0x1849")
        nic["flashable"] = True
        self.start_patch(patch.object(flash.os, "geteuid", return_value=0))
        self.start_patch(patch.object(flash, "get_device_from_cache", return_value=nic))
        download = self.start_patch(patch.object(flash, "download_firmware"))
        with patch.object(sys, "argv", ["firmware-flash", "--type", "nic", "--model", "X550", "--device-path", nic["bus_info"]]):
            output = io.StringIO()
            with contextlib.redirect_stdout(output), self.assertRaises(SystemExit) as exited:
                flash.main()
            self.assertEqual(exited.exception.code, 2)
            self.assertIn("ASRock-signed", json.loads(output.getvalue())["error"])
        download.assert_not_called()

    def test_intel_update_never_runs_without_permanent_target_mac(self):
        flash = load_script(FIRMWARE / "firmware-flash")
        execute = self.start_patch(patch.object(flash.subprocess, "Popen"))
        success, reason = flash.flash_tool_package({"flash_tool": "nvmupdate64e", "tool_package": "intel.tar.gz"})
        self.assertFalse(success)
        self.assertIn("unscoped", reason)
        execute.assert_not_called()

    def test_intel_update_uses_live_target_instead_of_manifest_selector(self):
        flash = load_script(FIRMWARE / "firmware-flash")
        mac = "001122334455"
        self.start_patch(patch.object(flash, "permanent_nic_mac", return_value=mac))
        self.start_patch(patch.object(flash.os.path, "isfile", return_value=True))
        self.start_patch(patch.object(flash, "compute_sha256", return_value="valid-hash"))
        process = Mock(stdout=iter(["Update complete\n"]), returncode=0)
        execute = self.start_patch(patch.object(flash.subprocess, "Popen", return_value=process))
        with contextlib.redirect_stdout(io.StringIO()):
            success, _ = flash.flash_tool_package({
                "type": "nic", "flash_tool": "nvmupdate64e", "tool_package": "intel.tar.gz",
                "tool_package_sha256": "valid-hash",
                "flash_command": "nvmupdate64e -u -l -c nvmupdate.cfg -m AABBCCDDEEFF",
            })
        self.assertTrue(success)
        argv = execute.call_args[0][0]
        self.assertEqual(argv[-2:], ["-m", mac])
        self.assertNotIn("AABBCCDDEEFF", argv)
        self.assertEqual(argv.count("-m"), 1)
        self.assertFalse(execute.call_args[1]["shell"])

    def test_permanent_mac_comes_from_the_selected_pci_device(self):
        nic = self.nic()
        (self.sysfs / "bus/pci/devices/0000:41:00.0/net/eno1").mkdir(parents=True)
        query = self.start_patch(patch.object(policy.subprocess, "run", return_value=Mock(
            returncode=0, stdout="Permanent address: 00:11:22:33:44:55\n",
        )))
        self.assertEqual(policy.permanent_nic_mac(nic), "001122334455")
        self.assertEqual(query.call_args[0][0], ["ethtool", "-P", "eno1"])

    def test_e810_is_unqualified_on_every_untested_rocky8_minor_release(self):
        entry = self.qualified_catalog("E810")["components"]["nic"][0]
        for version in ("8", "8.0", "8.6", "8.10"):
            with self.subTest(version=version):
                host = {"os": {"id": "rocky", "version_id": version}, "architecture": "x86_64"}
                self.assertFalse(evaluate_qualification(entry, host)["eligible"])

    def test_os_release_falls_back_to_vendor_file_and_ignores_malformed_values(self):
        missing = Path(self.temp.name) / "missing-os-release"
        with patch.object(policy, "OS_RELEASE_PATHS", (missing, self.os_release)):
            self.os_release.write_text('# Comment\nNAME="Rocky Linux"\nID=rocky\nVERSION_ID="8.10" # Comment\n')
            self.assertEqual(policy.get_os_info(), {"id": "rocky", "version_id": "8.10"})
            self.os_release.write_text('ID="unterminated\nVERSION_ID=8.10\n')
            self.assertEqual(policy.get_os_info(), {"version_id": "8.10"})

    def test_missing_profiles_never_qualify_any_nic_model(self):
        for model in ("E810", "X550", "BCM57416", "ConnectX-5"):
            catalog = self.qualified_catalog(model)
            entry = catalog["components"]["nic"][0]
            entry["validation_profiles"] = []
            self.assertFalse(evaluate_qualification(entry, {"os": {"id": "rocky", "version_id": "9.8"}, "architecture": "x86_64"})["eligible"])

    def test_other_nics_and_non_nic_devices_remain_eligible_on_rocky8(self):
        self.os_release.write_text('ID=rocky\nVERSION_ID="8.10"\n')
        for model in ("X550", "X710", "BCM57416", "ConnectX-5", "E8100"):
            with self.subTest(model=model):
                self.assertNotIn("blocked_reason", policy.nic_update_policy(self.nic(model=model)))
        self.assertEqual(policy.nic_update_policy({"type": "hba", "model": "E810"}), {})

    def test_e810_os_restriction_does_not_extend_to_other_distributions(self):
        nic = self.nic(model="E810")
        for os_id, version in (("rocky", "9.6"), ("rocky", "10"), ("ubuntu", "24.04"), ("debian", "12"), ("rhel", "8.10")):
            with self.subTest(os_id=os_id, version=version):
                self.os_release.write_text(f'ID={os_id}\nID_LIKE="rhel rocky"\nVERSION_ID="{version}"\n')
                self.assertNotIn("blocked_reason", policy.nic_update_policy(nic))

    def test_rocky8_check_keeps_e810_inventory_without_update_or_badge_count(self):
        self.os_release.write_text('ID=rocky\nVERSION_ID="8.10"\n')
        checker = load_script(FIRMWARE / "firmware-check")
        e810 = self.nic(model="E810")
        e810["firmware"] = "4.10"
        manifest = self.qualified_catalog("E810")
        self.start_patch(patch.object(checker, "load_manifest", return_value=manifest))
        self.start_patch(patch.object(checker, "run_discover", return_value={"devices": [e810]}))
        self.start_patch(patch.object(checker, "CACHE_PATH", str(Path(self.temp.name) / "status.json")))
        for version in ("8.10", "9.8"):
            with self.subTest(version=version):
                self.os_release.write_text(f'ID=rocky\nVERSION_ID="{version}"\n')
                blocked = version == "8.10"
                with contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(checker.main(), 0 if blocked else 2)
                cache = json.loads(Path(checker.CACHE_PATH).read_text())
                device = cache["devices"][0]
                self.assertEqual(device["current_firmware"], "4.10")
                self.assertEqual(device["cache_index"], 0)
                self.assertEqual(device["flashable"], not blocked)
                self.assertEqual(cache["summary"]["outdated"], 0 if blocked else 1)
                if blocked:
                    self.assertEqual(device["blocked_reason"], "os_unvalidated")
                    self.assertEqual(device["latest_firmware"], "")
                    self.assertEqual(device["update_available"], "unknown")
                else:
                    self.assertNotIn("blocked_reason", device)

    def test_rocky8_stale_cache_cannot_authorize_preflight_or_flash(self):
        self.os_release.write_text('ID=rocky\nVERSION_ID="8.10"\n')
        flash = load_script(FIRMWARE / "firmware-flash")
        e810 = self.nic(model="E810")
        e810.update(flashable=True, update_available="outdated", flash_tool="nvmupdate64e", tool_package="nvmupdate_E810.tar.gz")
        self.start_patch(patch.object(flash, "load_cache", return_value={"devices": [e810]}))
        package = self.start_patch(patch.object(flash, "flash_tool_package"))
        for flags in ([], ["--dry-run"], ["--preflight"]):
            with self.subTest(flags=flags), patch.object(sys, "argv", ["firmware-flash", "--cache-index", "0"] + flags):
                output = io.StringIO()
                with contextlib.redirect_stdout(output), contextlib.redirect_stderr(io.StringIO()):
                    self.assertEqual(flash.main(), 0 if flags == ["--preflight"] else 3)
                if flags == ["--preflight"]:
                    info = json.loads(output.getvalue())
                    self.assertTrue(info["blocked"])
                    self.assertIn("qualification", info["block_reason"])
                    self.assertEqual(info["downloads"], [])
                    self.assertEqual(info["actions"], [])
        self.assertFalse(flash.flash_device(e810)[0])
        package.assert_not_called()

    def test_legacy_flasher_also_blocks_e810_on_rocky8(self):
        self.os_release.write_text('ID=rocky\nVERSION_ID="8.10"\n')
        flash = load_script(ROOT / "45drives-system/public/scripts/firmware-flash")
        e810 = self.nic(model="E810")
        e810["flashable"] = True
        self.start_patch(patch.object(flash.os, "geteuid", return_value=0))
        self.start_patch(patch.object(flash, "get_device_from_cache", return_value=e810))
        download = self.start_patch(patch.object(flash, "download_firmware"))
        with patch.object(sys, "argv", ["firmware-flash", "--type", "nic", "--model", "E810", "--device-path", e810["bus_info"]]):
            output = io.StringIO()
            with contextlib.redirect_stdout(output), self.assertRaises(SystemExit) as exited:
                flash.main()
            self.assertEqual(exited.exception.code, 2)
            self.assertIn("validated update", json.loads(output.getvalue())["error"])
        download.assert_not_called()


if __name__ == "__main__":
    unittest.main()
