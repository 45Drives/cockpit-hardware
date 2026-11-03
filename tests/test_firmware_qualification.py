"""Qualification, stale-cache, and selected-adapter regression tests. No flashing."""

import copy
import contextlib
import io
import json
from pathlib import Path
import runpy
import sys
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
FIRMWARE = ROOT / "system_files/usr/share/45drives/firmware"
sys.path.insert(0, str(FIRMWARE))
import firmware_qualification as qualification
import firmware_runtime as runtime
import firmware_policy as policy


def profile(os_id="rocky", version="9.8", arch="x86_64"):
    return {"id": os_id + "-" + version, "qualification": "45drives_validated", "test_report_id": "LAB-001",
            "os": {"id": os_id, "version_ids": [version], "architecture": arch}}


def catalog(category="nic", **changes):
    entry = {"model_match": "E810", "latest_firmware": "5.10", "flashable": True,
             "flash_tool": "nvmupdate64e", "flash_command": "nvmupdate64e -u -l -c nvmupdate.cfg", "tool_package": "intel.tar.gz", "tool_package_sha256": "a" * 64,
             "release_status": "approved", "update_method": "self_service", "validation_profiles": [profile()]}
    entry.update(changes)
    return qualification.build_catalog({"components": {category: [entry]}, "flash_tools": []})


HOST = {"os": {"id": "rocky", "version_id": "9.8"}, "architecture": "x86_64", "kernel_release": "lab-kernel"}
LIVE = {"type": "nic", "model": "E810", "firmware": "4.80", "bus_info": "0000:41:00.0",
        "device": "enp65s0f0", "driver": "ice", "driver_version": "lab-driver", "serial": "CARD-001"}


class QualificationTests(unittest.TestCase):
    def test_only_explicit_os_version_and_architecture_match(self):
        entry = catalog()["components"]["nic"][0]
        self.assertTrue(qualification.evaluate_qualification(entry, HOST)["eligible"])
        for os_id, version, arch in (("rocky", "8.10", "x86_64"), ("rocky", "9.9", "x86_64"),
                                      ("rocky", "9", "x86_64"), ("rhel", "9.8", "x86_64"),
                                      ("rocky", "9.8", "aarch64"), ("", "", "x86_64")):
            with self.subTest(os_id=os_id, version=version, arch=arch):
                host = {"os": {"id": os_id, "version_id": version}, "architecture": arch}
                self.assertFalse(qualification.evaluate_qualification(entry, host)["eligible"])

    def test_profiles_are_alternatives_and_fields_do_not_cross_match(self):
        entry = catalog()["components"]["nic"][0]
        entry["validation_profiles"].append(profile("ubuntu", "24.04"))
        host = {"os": {"id": "ubuntu", "version_id": "9.8"}, "architecture": "x86_64"}
        self.assertFalse(qualification.evaluate_qualification(entry, host)["eligible"])
        host["os"]["version_id"] = "24.04"
        self.assertTrue(qualification.evaluate_qualification(entry, host)["eligible"])

    def test_unsupported_architectures_cannot_be_approved_or_exported(self):
        entry = catalog()["components"]["nic"][0]
        for arch in ("aarch64", "ppc64le", "s390x", "armv7l", "noarch", "amd64", "", None):
            with self.subTest(arch=arch):
                invalid_profile = profile(arch=arch)
                with self.assertRaisesRegex(ValueError, "x86_64"):
                    qualification.validate_profiles([invalid_profile])
                with self.assertRaisesRegex(ValueError, "x86_64"):
                    catalog(validation_profiles=[invalid_profile])
                invalid_entry = dict(entry, validation_profiles=[invalid_profile])
                host = dict(HOST, architecture=arch)
                self.assertFalse(qualification.evaluate_qualification(invalid_entry, host)["eligible"])

    def test_new_profile_can_explicitly_qualify_rocky8(self):
        entry = catalog()["components"]["nic"][0]
        host = {"os": {"id": "rocky", "version_id": "8.10"}, "architecture": "x86_64"}
        self.assertFalse(qualification.evaluate_qualification(entry, host)["eligible"])
        entry["validation_profiles"].append(profile("rocky", "8.10"))
        self.assertTrue(qualification.evaluate_qualification(entry, host)["eligible"])

    def test_draft_withdrawn_support_assisted_and_malformed_never_enable(self):
        baseline = catalog()["components"]["nic"][0]
        for changes in ({"release_status": "draft"}, {"release_status": "withdrawn"},
                        {"update_method": "support_assisted"}, {"flashable": False},
                        {"validation_profiles": []}, {"validation_profiles": "rocky 9.8"},
                        {"validation_profiles": [dict(profile(), qualification="manufacturer_supported")]}):
            with self.subTest(changes=changes):
                entry = dict(baseline, **changes)
                self.assertFalse(qualification.evaluate_qualification(entry, HOST)["eligible"])

    def test_profiles_require_evidence_and_no_wildcard_or_numeric_versions(self):
        for changes in ({"test_report_id": ""}, {"id": ""},
                        {"os": {"id": "rocky", "version_ids": [9.8], "architecture": "x86_64"}},
                        {"os": {"id": "rocky", "version_ids": ["9.*"], "architecture": "x86_64"}}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                qualification.validate_profiles([dict(profile(), **changes)])

    def test_optional_kernel_and_driver_constraints_are_enforced(self):
        entry = catalog()["components"]["nic"][0]
        entry["validation_profiles"][0].update(kernel_releases=["lab-kernel"], driver={"name": "ice", "versions": ["lab-driver"]})
        self.assertTrue(qualification.evaluate_qualification(entry, HOST, LIVE)["eligible"])
        self.assertFalse(qualification.evaluate_qualification(entry, dict(HOST, kernel_release="other"), LIVE)["eligible"])
        self.assertFalse(qualification.evaluate_qualification(entry, HOST, dict(LIVE, driver_version="other"))["eligible"])

    def test_catalog_hides_unapproved_payloads_from_older_clients(self):
        source = {"components": {"nic": [{"model_match": "E810", "flashable": True,
                                          "firmware_file": "nic/e810.bin", "sha256": "a" * 64}],
                                 "hba": [{"model_match": "9600-16i"}], "hdd": [{"model_match": "ST123"}]}}
        published = qualification.build_catalog(source)
        nic = published["components"]["nic"][0]
        self.assertEqual(nic["release_status"], "draft")
        self.assertFalse(nic["flashable"])
        self.assertNotIn("firmware_file", nic)
        self.assertNotIn("sha256", nic)
        self.assertEqual(published["components"]["hdd"], source["components"]["hdd"])
        self.assertEqual(published["schema_version"], "2.0")
        self.assertNotIn("release_status", source["components"]["nic"][0])

    def test_hba_uses_same_qualification_policy(self):
        release = catalog("hba", model_match="9600-16i")["components"]["hba"][0]
        self.assertTrue(qualification.evaluate_qualification(release, HOST)["eligible"])
        self.assertFalse(qualification.evaluate_qualification(release, dict(HOST, os={"id": "rocky", "version_id": "8.10"}))["eligible"])

    def test_tool_package_approval_requires_flash_command(self):
        for command in ("", "   ", None):
            with self.assertRaises(ValueError):
                catalog(flash_command=command)

    def test_proxmox_does_not_inherit_debian_profile(self):
        with patch.object(policy, "PROXMOX_VERSION_TOOL") as tool, patch.object(policy.subprocess, "run", return_value=Mock(returncode=0, stdout="pve-manager/9.0.11/abcdef")):
            tool.is_file.return_value = True
            self.assertEqual(policy.get_os_info(), {"id": "proxmox", "version_id": "9.0"})
        with patch.object(policy, "PROXMOX_VERSION_TOOL") as tool, patch.object(policy.subprocess, "run", side_effect=OSError):
            tool.is_file.return_value = True
            self.assertEqual(policy.get_os_info(), {"id": "proxmox", "version_id": ""})


class AuthorizationTests(unittest.TestCase):
    def setUp(self):
        self.manifest = catalog()
        self.checker = runpy.run_path(str(FIRMWARE / "firmware-check"))
        self.cached = runtime.bind_release(LIVE, self.manifest["components"]["nic"][0], self.manifest, HOST)
        self.cached.update(cache_index=0, update_available="outdated")
        for patcher in (patch.object(runtime, "load_current_catalog", side_effect=lambda: (self.manifest, self.checker["match_device_to_manifest"], self.checker["compare_firmware"])),
                        patch.object(runtime, "discover_live_devices", return_value=[dict(LIVE)]),
                        patch.object(runtime, "get_host_environment", return_value=HOST),
                        patch.object(runtime, "nic_update_block_reason", return_value="")):
            patcher.start()
            self.addCleanup(patcher.stop)

    def test_current_signed_entry_overrides_tampered_cached_commands(self):
        self.cached.update(flash_command="evil", firmware_file="evil", sha256="evil", controller_index=99)
        result = runtime.authorize_device(self.cached)
        self.assertEqual(result["flash_command"], "nvmupdate64e -u -l -c nvmupdate.cfg")
        self.assertEqual(result["firmware_file"], "")
        self.assertNotEqual(result.get("controller_index"), 99)

    def test_withdrawn_replaced_and_removed_releases_are_refused(self):
        original = copy.deepcopy(self.manifest)
        for field, value in (("release_status", "withdrawn"), ("tool_package_sha256", "b" * 64), ("latest_firmware", "5.20")):
            self.manifest = copy.deepcopy(original)
            self.manifest["components"]["nic"][0][field] = value
            with self.subTest(field=field), self.assertRaises(runtime.UpdateNotQualified):
                runtime.authorize_device(self.cached)
        self.manifest["components"]["nic"] = []
        with self.assertRaises(runtime.UpdateNotQualified):
            runtime.authorize_device(self.cached)

    def test_changed_os_or_card_and_missing_identity_are_refused(self):
        with patch.object(runtime, "get_host_environment", return_value=dict(HOST, os={"id": "rocky", "version_id": "8.10"})), self.assertRaises(runtime.UpdateNotQualified):
            runtime.authorize_device(self.cached)
        with patch.object(runtime, "get_host_environment", return_value=dict(HOST, architecture="aarch64")), self.assertRaises(runtime.UpdateNotQualified):
            runtime.authorize_device(self.cached)
        with patch.object(runtime, "discover_live_devices", return_value=[dict(LIVE, serial="OTHER")]), self.assertRaises(runtime.UpdateNotQualified):
            runtime.authorize_device(self.cached)
        for changes in ({"bus_info": ""}, {"release_id": ""}, {"release_revision": ""}):
            with self.subTest(changes=changes), self.assertRaises(runtime.UpdateNotQualified):
                runtime.authorize_device(dict(self.cached, **changes))

    def test_unknown_running_firmware_and_unapproved_source_are_refused(self):
        for fw in ("", "unknown"):
            result = runtime.bind_release(dict(LIVE, firmware=fw), self.manifest["components"]["nic"][0], self.manifest, HOST)
            self.assertFalse(result["eligible"])
        entry = self.manifest["components"]["nic"][0]
        entry["upgrade_from"] = "4.90"
        self.assertFalse(runtime.bind_release(LIVE, entry, self.manifest, HOST)["eligible"])
        self.assertTrue(runtime.bind_release(dict(LIVE, firmware="5.10"), entry, self.manifest, HOST)["eligible"])

    def test_schema_without_qualification_support_never_authorizes(self):
        for schema in ("1.0", "3.0", None):
            manifest = dict(self.manifest, schema_version=schema)
            self.assertFalse(runtime.bind_release(LIVE, manifest["components"]["nic"][0], manifest, HOST)["eligible"])


class VendorWrapperTests(unittest.TestCase):
    def setUp(self):
        self.flash = runpy.run_path(str(FIRMWARE / "firmware-flash"))

    def test_mlxup_requires_selected_card_and_pinned_image(self):
        execute = Mock(side_effect=AssertionError("must not execute"))
        with patch("subprocess.Popen", execute):
            self.assertFalse(self.flash["flash_mlxup"]({}, "/image.bin")[0])
            self.assertFalse(self.flash["flash_mlxup"](LIVE)[0])
        execute.assert_not_called()

    def test_mlxup_preserves_version_checks_and_failure_exit(self):
        process = Mock(stdout=iter(["Other device is up to date; selected card failed\n"]), returncode=6)
        with patch("os.path.isfile", return_value=True), patch.dict(self.flash["flash_mlxup"].__globals__, compute_sha256=lambda path: "a" * 64), patch("subprocess.Popen", return_value=process) as execute:
            with contextlib.redirect_stdout(io.StringIO()):
                success, _ = self.flash["flash_mlxup"](dict(LIVE, tool_binary_sha256="a" * 64), "/image.bin")
        self.assertFalse(success)
        argv = execute.call_args[0][0]
        self.assertNotIn("--force", argv)
        self.assertIn("--image-file", argv)
        self.assertEqual(argv[argv.index("--dev") + 1], LIVE["bus_info"])
        self.assertFalse(execute.call_args[1]["shell"])


if __name__ == "__main__":
    unittest.main()
