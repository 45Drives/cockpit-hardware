#!/usr/bin/env python3
"""
firmware-admin - Internal 45Drives firmware management app.

Single standalone app that handles:
- Upload firmware files
- Assign to device models in manifest
- Auto-compute SHA256
- Sign manifest with GPG
- Serve files to customer machines

Usage:
    python3 firmware-admin.py [--port 8089]
"""

import os
import sys
import json
import hashlib
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory

# ─── Config ────────────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIRMWARE_DIR = os.path.join(BASE_DIR, "firmware-repo")
MANIFEST_SRC = os.path.join(BASE_DIR, "system_files/usr/share/45drives/firmware/manifest.json")
MANIFEST_SERVED = os.path.join(FIRMWARE_DIR, "manifest.json")
SIGNATURE_SERVED = os.path.join(FIRMWARE_DIR, "manifest.json.sig")
GPG_KEY_ID = "firmware@45drives.com"

app = Flask(__name__)


# ─── Helpers ───────────────────────────────────────────────────────────────────

def compute_sha256(filepath):
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def load_manifest():
    """Load the source manifest."""
    with open(MANIFEST_SRC, "r") as f:
        return json.load(f)


def save_manifest(data):
    """Save manifest to source location."""
    data["last_updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(MANIFEST_SRC, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def sign_and_publish():
    """Sign manifest and copy to serve directory."""
    # Copy manifest to firmware-repo/
    shutil.copy2(MANIFEST_SRC, MANIFEST_SERVED)

    # Sign
    sig_path = MANIFEST_SRC + ".sig"
    if os.path.exists(sig_path):
        os.unlink(sig_path)

    try:
        result = subprocess.run(
            ["gpg", "--batch", "--yes", "--detach-sign", "--armor", "-u", GPG_KEY_ID, "-o", sig_path, MANIFEST_SRC],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30
        )
    except subprocess.TimeoutExpired:
        return False, "GPG signing timed out (30s)"
    if result.returncode != 0:
        return False, f"GPG signing failed: {result.stderr}"

    # Copy sig to serve dir
    shutil.copy2(sig_path, SIGNATURE_SERVED)
    return True, "Signed and published"


def get_all_models():
    """Get flat list of all models from manifest."""
    manifest = load_manifest()
    models = []
    for category, entries in manifest.get("components", {}).items():
        for entry in entries:
            model_match = entry.get("model_match", "")
            family = entry.get("family", "")
            interface = entry.get("interface", "")
            vendor = entry.get("vendor", "")
            # Build a readable display name
            capacity = entry.get("capacity", "")
            if family:
                display = f"{vendor} {family}" if vendor else family
                if capacity:
                    display += f" {capacity}"
                if interface:
                    display += f" ({interface})"
            elif "|" in model_match:
                # Long regex — show first model + count
                parts = model_match.split("|")
                display = f"{parts[0]} +{len(parts)-1} more"
            else:
                display = model_match

            models.append({
                "category": category,
                "model": model_match,
                "display_name": display,
                "family": family,
                "interface": interface,
                "capacity": entry.get("capacity", ""),
                "vendor": vendor,
                "version": entry.get("latest_firmware", ""),
                "firmware_file": entry.get("firmware_file", ""),
                "sha256": entry.get("sha256", ""),
                "flash_tool": entry.get("flash_tool", ""),
                "flash_command": entry.get("flash_command", ""),
                "flashable": entry.get("flashable", False),
                "requires_reboot": entry.get("requires_reboot", False),
                "part_match": entry.get("part_match", ""),
                "release_notes": entry.get("release_notes", ""),
                "release_date": entry.get("release_date", ""),
                "upgrade_from": entry.get("upgrade_from", ""),
            })
    return models


# ─── API Routes ────────────────────────────────────────────────────────────────

@app.route("/api/models")
def api_models():
    return jsonify(get_all_models())


@app.route("/api/model/update", methods=["PUT"])
def api_model_update():
    """Update fields of an existing model entry."""
    data = request.json
    model_match = (data.get("model") or "").strip()
    if not model_match:
        return jsonify({"error": "model is required"}), 400

    manifest = load_manifest()
    found = False
    for category, entries in manifest.get("components", {}).items():
        for entry in entries:
            if entry.get("model_match", "") == model_match:
                # Update editable fields if provided
                editable = [
                    "latest_firmware", "firmware_file", "flash_tool", "flash_command",
                    "flashable", "requires_reboot", "release_notes", "release_date",
                    "upgrade_from", "part_match", "family", "interface", "capacity", "vendor"
                ]
                for field in editable:
                    if field in data:
                        val = data[field]
                        # Handle booleans
                        if field in ("flashable", "requires_reboot"):
                            val = val if isinstance(val, bool) else str(val).lower() == "true"
                        entry[field] = val
                found = True
                break
        if found:
            break

    if not found:
        return jsonify({"error": f"Model '{model_match}' not found"}), 404

    save_manifest(manifest)
    return jsonify({"status": "ok", "model": model_match})


@app.route("/api/flash-tools")
def api_flash_tools():
    """Return flash tools registry (manifest.flash_tools + discovered from components)."""
    manifest = load_manifest()
    # Start with the dedicated flash_tools registry
    tools = {}
    for t in manifest.get("flash_tools", []):
        name = t.get("name", "").strip()
        if name:
            tools[name] = {
                "command": t.get("command", ""),
                "description": t.get("description", ""),
                "install_check": t.get("install_check", ""),
            }
    # Also discover any tools referenced in components but not in registry
    for category, entries in manifest.get("components", {}).items():
        for entry in entries:
            tool = (entry.get("flash_tool") or "").strip()
            cmd = (entry.get("flash_command") or "").strip()
            if tool and tool not in tools:
                tools[tool] = {"command": cmd, "description": "", "install_check": ""}
    return jsonify(tools)


@app.route("/api/flash-tools/add", methods=["POST"])
def api_add_flash_tool():
    """Add or update a flash tool in the registry."""
    data = request.json
    name = (data.get("name") or "").strip()
    command = (data.get("command") or "").strip()
    description = (data.get("description") or "").strip()
    install_check = (data.get("install_check") or "").strip()

    if not name:
        return jsonify({"error": "Tool name is required"}), 400
    if not command:
        return jsonify({"error": "Command template is required"}), 400

    manifest = load_manifest()
    flash_tools = manifest.setdefault("flash_tools", [])

    # Update existing or append new
    for t in flash_tools:
        if t.get("name", "").lower() == name.lower():
            t["command"] = command
            t["description"] = description
            t["install_check"] = install_check
            save_manifest(manifest)
            return jsonify({"status": "ok", "action": "updated", "name": name})

    flash_tools.append({
        "name": name,
        "command": command,
        "description": description,
        "install_check": install_check,
    })
    save_manifest(manifest)
    return jsonify({"status": "ok", "action": "added", "name": name})


@app.route("/api/flash-tools/delete", methods=["POST"])
def api_delete_flash_tool():
    """Delete a flash tool from the registry."""
    data = request.json
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Tool name is required"}), 400

    manifest = load_manifest()
    flash_tools = manifest.get("flash_tools", [])

    # Check if tool is in use by any component
    in_use = []
    for cat, entries in manifest.get("components", {}).items():
        for entry in entries:
            if (entry.get("flash_tool") or "").strip().lower() == name.lower():
                in_use.append(f"{cat}/{entry.get('model_match', '?')}")

    if in_use:
        return jsonify({"error": f"Tool '{name}' is in use by: {', '.join(in_use[:5])}{'...' if len(in_use) > 5 else ''}"}), 409

    original_len = len(flash_tools)
    manifest["flash_tools"] = [t for t in flash_tools if t.get("name", "").lower() != name.lower()]

    if len(manifest["flash_tools"]) == original_len:
        return jsonify({"error": f"Tool '{name}' not found in registry"}), 404

    save_manifest(manifest)
    return jsonify({"status": "ok", "name": name})


@app.route("/api/files")
def api_files():
    files = []
    for f in sorted(os.listdir(FIRMWARE_DIR)):
        fp = os.path.join(FIRMWARE_DIR, f)
        if os.path.isfile(fp) and not f.startswith("."):
            stat = os.stat(fp)
            files.append({
                "name": f,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            })
    return jsonify(files)


@app.route("/api/upload", methods=["POST"])
def api_upload():
    """Upload firmware file and assign to all models in a family/interface/track."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400

    category = request.form.get("category", "hdd").strip()
    family = request.form.get("family", "").strip()
    interface = request.form.get("interface", "").strip()
    version = request.form.get("version", "").strip()
    model_match_input = request.form.get("model_match", "").strip()
    notes = request.form.get("notes", "")
    upgrade_from = request.form.get("upgrade_from", "").strip()

    if not family and not model_match_input:
        return jsonify({"error": "Family or model number is required"}), 400
    if not version:
        return jsonify({"error": "Firmware version is required"}), 400

    # Sanitize filename to prevent path traversal attacks
    filename = os.path.basename(f.filename)
    # Remove any remaining dangerous characters
    filename = filename.replace("..", "").replace("/", "").replace("\\", "")
    if not filename:
        return jsonify({"error": "Invalid filename"}), 400
    dest_path = os.path.join(FIRMWARE_DIR, filename)

    # Save file
    f.save(dest_path)
    sha256 = compute_sha256(dest_path)
    size = os.path.getsize(dest_path)

    result = {
        "filename": filename,
        "size": size,
        "sha256": sha256,
        "assigned_models": [],
    }

    track_prefix = version[:2] if len(version) >= 2 else ""
    manifest = load_manifest()
    assigned = []

    # Only search within the selected category
    entries_in_cat = manifest.get("components", {}).get(category, [])
    for entry in entries_in_cat:
        entry_family = entry.get("family", "")
        entry_interface = entry.get("interface", "")
        entry_model = entry.get("model_match", "")
        entry_version = entry.get("latest_firmware", "")
        entry_track = entry_version[:2] if len(entry_version) >= 2 else ""

        matched = False

        # Match by family + interface + track prefix (HDD)
        if (family and entry_family == family and
                entry_interface == interface and
                entry_track == track_prefix):
            matched = True

        # Match by model number
        if (model_match_input and entry_model and
                entry_model.lower() == model_match_input.lower()):
            matched = True

        if matched:
            entry["firmware_file"] = filename
            entry["sha256"] = sha256
            entry["latest_firmware"] = version
            if upgrade_from:
                entry["upgrade_from"] = upgrade_from
            if notes:
                entry["release_notes"] = notes
            entry["release_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            assigned.append(entry_model)

    # If model_match was provided but didn't match any existing entry, create it
    model_already_existed = model_match_input and model_match_input.lower() in [m.lower() for m in assigned]
    if model_match_input and not model_already_existed:
        # Defaults per category
        CATEGORY_DEFAULTS = {
            "hdd": {"vendor": "Seagate", "flash_tool": "SeaChest", "flash_command": "SeaChest_Firmware --scan --firmware <firmware_path>", "requires_reboot": False},
            "hba": {"vendor": "Broadcom", "flash_tool": "storcli64", "flash_command": "storcli64 /cX download file=<firmware_path>", "requires_reboot": True},
            "nic": {"vendor": "NVIDIA/Mellanox", "flash_tool": "mlxup", "flash_command": "mlxup --update --dev <bus_info>", "requires_reboot": True},
            "nvme": {"vendor": "Micron", "flash_tool": "nvme-cli", "flash_command": "nvme fw-download <device> --fw=<firmware_path> && nvme fw-activate <device> -s 1", "requires_reboot": True},
            "ssd": {"vendor": "", "flash_tool": "", "flash_command": "", "requires_reboot": True},
        }
        defaults = CATEGORY_DEFAULTS.get(category, CATEGORY_DEFAULTS["hdd"])

        new_entry = {
            "model_match": model_match_input,
            "vendor": defaults["vendor"],
            "latest_firmware": version,
            "firmware_file": filename,
            "sha256": sha256,
            "flashable": True,
            "flash_tool": defaults["flash_tool"],
            "flash_command": defaults["flash_command"],
            "requires_reboot": defaults["requires_reboot"],
            "release_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        }
        if interface:
            new_entry["interface"] = interface
        if family:
            new_entry["family"] = family
        if upgrade_from:
            new_entry["upgrade_from"] = upgrade_from
        if notes:
            new_entry["release_notes"] = notes

        if category not in manifest.get("components", {}):
            manifest["components"][category] = []
        manifest["components"][category].append(new_entry)
        assigned.append(model_match_input)
        result["created_new"] = True

    if assigned:
        save_manifest(manifest)
        result["assigned_models"] = assigned
    else:
        result["warning"] = f"No models found for {family} / {interface} / {track_prefix}-track"

    return jsonify(result)


@app.route("/api/assign", methods=["POST"])
def api_assign():
    """Assign an existing file to a model."""
    data = request.json
    model = data.get("model", "")
    filename = data.get("filename", "")
    version = data.get("version", "")
    notes = data.get("notes", "")

    if not model or not filename:
        return jsonify({"error": "model and filename required"}), 400

    filepath = os.path.join(FIRMWARE_DIR, filename)
    if not os.path.isfile(filepath):
        return jsonify({"error": f"File not found: {filename}"}), 404

    sha256 = compute_sha256(filepath)

    manifest = load_manifest()
    found = False
    for category, entries in manifest.get("components", {}).items():
        for entry in entries:
            if entry.get("model_match", "").lower() == model.lower():
                entry["firmware_file"] = filename
                entry["sha256"] = sha256
                if version:
                    entry["latest_firmware"] = version
                if notes:
                    entry["release_notes"] = notes
                entry["release_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                found = True
                break
        if found:
            break

    if not found:
        return jsonify({"error": f"Model '{model}' not found"}), 404

    save_manifest(manifest)
    return jsonify({"status": "ok", "model": model, "filename": filename, "sha256": sha256})


@app.route("/api/sign", methods=["POST"])
def api_sign():
    """Sign manifest and publish to serve directory."""
    ok, msg = sign_and_publish()
    if ok:
        return jsonify({"status": "ok", "message": msg})
    return jsonify({"error": msg}), 500


@app.route("/api/add-model", methods=["POST"])
def api_add_model():
    """Add a new device model to the manifest."""
    data = request.json
    category = data.get("category", "").strip()
    model_match = data.get("model_match", "").strip()
    vendor = data.get("vendor", "").strip()
    flash_tool = data.get("flash_tool", "").strip()
    flash_command = data.get("flash_command", "").strip()
    requires_reboot = data.get("requires_reboot", True)

    if not category or not model_match:
        return jsonify({"error": "category and model_match are required"}), 400

    manifest = load_manifest()
    components = manifest.setdefault("components", {})

    # Check if model already exists
    for cat, entries in components.items():
        for entry in entries:
            if entry.get("model_match", "").lower() == model_match.lower():
                return jsonify({"error": f"Model '{model_match}' already exists in [{cat}]"}), 409

    # Create new entry
    new_entry = {
        "model_match": model_match,
        "vendor": vendor,
        "latest_firmware": "",
        "flash_tool": flash_tool,
        "flash_command": flash_command,
        "flashable": True,
        "requires_reboot": requires_reboot,
        "release_date": "",
        "release_notes": "",
        "firmware_file": "",
        "sha256": ""
    }

    # Add to category (create category if needed)
    if category not in components:
        components[category] = []
    components[category].append(new_entry)

    save_manifest(manifest)
    return jsonify({"status": "ok", "model": model_match, "category": category})


@app.route("/api/delete", methods=["POST"])
def api_delete():
    data = request.json
    filename = os.path.basename(data.get("filename", ""))
    if not filename:
        return jsonify({"error": "No filename"}), 400

    filepath = os.path.join(FIRMWARE_DIR, filename)
    if os.path.isfile(filepath):
        os.unlink(filepath)
        return jsonify({"status": "ok", "deleted": filename})
    return jsonify({"error": "File not found"}), 404


@app.route("/api/manifest")
def api_manifest():
    return jsonify(load_manifest())


@app.route("/api/check-coverage", methods=["POST"])
def api_check_coverage():
    """Check which models from a list are covered by the manifest."""
    import re as regex_module
    data = request.json
    input_models = data.get("models", [])
    if not input_models:
        return jsonify({"error": "No models provided"}), 400

    manifest = load_manifest()
    results = []

    for item in input_models:
        model_name = (item if isinstance(item, str) else item.get("model", "")).strip()
        current_fw = item.get("firmware", "") if isinstance(item, dict) else ""
        if not model_name:
            continue

        matched_entry = None
        matched_category = None

        for category, entries in manifest.get("components", {}).items():
            for entry in entries:
                pattern = entry.get("model_match", "")
                if not pattern:
                    continue
                try:
                    if regex_module.fullmatch(pattern, model_name, regex_module.IGNORECASE):
                        matched_entry = entry
                        matched_category = category
                        break
                    if pattern.lower() == model_name.lower():
                        matched_entry = entry
                        matched_category = category
                        break
                except regex_module.error:
                    if pattern.lower() == model_name.lower():
                        matched_entry = entry
                        matched_category = category
                        break
            if matched_entry:
                break

        if matched_entry:
            latest = matched_entry.get("latest_firmware", "")
            has_file = bool(matched_entry.get("firmware_file"))
            needs_update = (current_fw and latest and current_fw != latest)
            results.append({
                "model": model_name,
                "status": "supported",
                "category": matched_category,
                "family": matched_entry.get("family", ""),
                "latest_firmware": latest,
                "current_firmware": current_fw,
                "needs_update": needs_update,
                "has_firmware_file": has_file,
            })
        else:
            results.append({
                "model": model_name,
                "status": "unsupported",
                "current_firmware": current_fw,
            })

    supported = sum(1 for r in results if r["status"] == "supported")
    unsupported = sum(1 for r in results if r["status"] == "unsupported")
    return jsonify({
        "total": len(results),
        "supported": supported,
        "unsupported": unsupported,
        "results": results,
    })


# ─── File Serving (for customer machines) ──────────────────────────────────────

@app.route("/manifest.json")
def serve_manifest():
    return send_from_directory(FIRMWARE_DIR, "manifest.json")


@app.route("/manifest.json.sig")
def serve_sig():
    return send_from_directory(FIRMWARE_DIR, "manifest.json.sig")


@app.route("/<path:filename>")
def serve_firmware(filename):
    """Serve firmware files (what customer machines download)."""
    if filename.startswith("api/"):
        return jsonify({"error": "not found"}), 404
    return send_from_directory(FIRMWARE_DIR, filename)


# ─── UI ────────────────────────────────────────────────────────────────────────

@app.route("/project-dna")
def project_dna():
    """Serve the Firmware Project DNA documentation page."""
    dna_path = os.path.join(BASE_DIR, "documentation", "Firmware_Project_DNA.html")
    if os.path.exists(dna_path):
        with open(dna_path) as f:
            return f.read()
    return "Project DNA not found", 404


@app.route("/")
def index():
    return APP_HTML


APP_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Firmware Admin - 45Drives</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f1a;
            color: #e0e0e0;
            min-height: 100vh;
        }
        .header {
            background: #1a1a2e;
            border-bottom: 1px solid #2a2a4a;
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .header h1 { color: #00d4aa; font-size: 1.3rem; }
        .header .actions { display: flex; gap: 0.5rem; }
        
        .main { display: flex; height: calc(100vh - 60px); }
        .sidebar {
            width: 280px;
            background: #141425;
            border-right: 1px solid #2a2a4a;
            overflow-y: auto;
            padding: 1rem 0;
        }
        .content { flex: 1; overflow-y: auto; padding: 2rem; }
        
        .nav-section { padding: 0.5rem 1rem; color: #666; font-size: 0.75rem; text-transform: uppercase; margin-top: 1rem; }
        .nav-item {
            padding: 0.5rem 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            border-left: 3px solid transparent;
        }
        .nav-item:hover { background: #1a1a2e; }
        .nav-item.active { background: #1a2a4a; border-left-color: #00d4aa; color: #00d4aa; }
        .nav-item .status {
            width: 8px; height: 8px; border-radius: 50%; margin-left: auto;
        }
        .status-ok { background: #27ae60; }
        .status-missing { background: #e74c3c; }
        .status-no-hash { background: #f39c12; }
        
        .card {
            background: #1a1a2e;
            border: 1px solid #2a2a4a;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .card h2 { color: #00d4aa; font-size: 1.1rem; margin-bottom: 1rem; }
        .card h3 { color: #888; font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase; }
        
        .drop-zone {
            border: 2px dashed #333;
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        .drop-zone:hover, .drop-zone.dragover { border-color: #00d4aa; background: #1a2a4a; }
        .drop-zone p { color: #888; }
        
        .form-row { margin-bottom: 1rem; }
        .form-row label { display: block; color: #888; font-size: 0.8rem; margin-bottom: 0.3rem; }
        .form-row input, .form-row select, .form-row textarea {
            width: 100%;
            padding: 0.5rem 0.75rem;
            background: #0f0f1a;
            border: 1px solid #333;
            border-radius: 4px;
            color: #eee;
            font-size: 0.9rem;
        }
        .form-row select { cursor: pointer; }
        .form-row textarea { resize: vertical; min-height: 60px; }

        .chip-input-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            padding: 0.4rem 0.5rem;
            background: #0f0f1a;
            border: 1px solid #333;
            border-radius: 4px;
            min-height: 38px;
            cursor: text;
            align-items: center;
        }
        .chip-input-container:focus-within { border-color: #00d4aa; }
        .chip-input-container .chip {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            background: #1a3a5c;
            border: 1px solid #00d4aa;
            border-radius: 12px;
            padding: 0.2rem 0.5rem;
            font-size: 0.8rem;
            color: #00d4aa;
            white-space: nowrap;
        }
        .chip-input-container .chip .chip-remove {
            cursor: pointer;
            font-size: 1rem;
            line-height: 1;
            color: #ff6b6b;
            font-weight: bold;
        }
        .chip-input-container .chip .chip-remove:hover { color: #ff4444; }
        .chip-input-container .chip-text-input {
            border: none;
            outline: none;
            background: transparent;
            color: #eee;
            font-size: 0.85rem;
            flex: 1;
            min-width: 80px;
            padding: 0.2rem 0;
        }

        .searchable-select { position: relative; }
        .searchable-select input[type="text"] {
            width: 100%;
            padding: 0.5rem 0.75rem;
            background: #0f0f1a;
            border: 1px solid #333;
            border-radius: 4px;
            color: #eee;
            font-size: 0.9rem;
        }
        .searchable-dropdown {
            display: none;
            position: absolute;
            top: 100%;
            left: 0; right: 0;
            max-height: 220px;
            overflow-y: auto;
            background: #1a1a2e;
            border: 1px solid #444;
            border-radius: 4px;
            z-index: 999;
            margin-top: 2px;
        }
        .searchable-dropdown.open { display: block; }
        .searchable-dropdown .dd-item {
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            font-size: 0.85rem;
            color: #ccc;
            border-bottom: 1px solid #222;
        }
        .searchable-dropdown .dd-item:hover { background: #2a2a4a; color: #fff; }
        .searchable-dropdown .dd-item.selected { background: #3a3a6a; color: #7ec8e3; }
        
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.2s;
        }
        .btn-primary { background: #00d4aa; color: #000; }
        .btn-primary:hover { background: #00f0c0; }
        .btn-danger { background: #e74c3c; color: #fff; }
        .btn-danger:hover { background: #c0392b; }
        .btn-secondary { background: #333; color: #eee; }
        .btn-secondary:hover { background: #444; }
        .btn-sign { background: #9b59b6; color: #fff; }
        .btn-sign:hover { background: #8e44ad; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .model-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
        }
        .model-card {
            background: #141425;
            border: 1px solid #2a2a4a;
            border-radius: 6px;
            padding: 1rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .model-card:hover { border-color: #00d4aa; }
        .model-card .model-name { color: #00d4aa; font-weight: bold; font-size: 0.95rem; }
        .model-card .model-meta { color: #666; font-size: 0.8rem; margin-top: 0.3rem; }
        .model-card .model-version { color: #888; font-size: 0.85rem; }
        .model-card .model-file { color: #555; font-size: 0.75rem; font-family: monospace; margin-top: 0.3rem; word-break: break-all; }
        .model-card .badge {
            display: inline-block;
            padding: 0.15rem 0.5rem;
            border-radius: 3px;
            font-size: 0.7rem;
            font-weight: bold;
            margin-top: 0.4rem;
        }
        .badge-ok { background: #1a3a2a; color: #27ae60; }
        .badge-missing { background: #3a1a1a; color: #e74c3c; }
        .badge-no-hash { background: #3a2a1a; color: #f39c12; }
        
        .file-list { width: 100%; border-collapse: collapse; }
        .file-list th { text-align: left; padding: 0.5rem; color: #666; font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid #2a2a4a; }
        .file-list td { padding: 0.5rem; font-size: 0.85rem; border-bottom: 1px solid #1a1a2a; }
        .file-list tr:hover td { background: #1a2a4a; }
        .file-name { font-family: monospace; color: #00d4aa; }
        
        .toast {
            position: fixed; bottom: 2rem; right: 2rem;
            padding: 0.75rem 1.5rem; border-radius: 8px;
            color: white; font-size: 0.9rem;
            opacity: 0; transition: opacity 0.3s; z-index: 1000;
        }
        .toast.show { opacity: 1; }
        .toast.success { background: #27ae60; }
        .toast.error { background: #e74c3c; }
        .toast.progress { background: #8e44ad; }
        
        .signed-status { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
        .signed-status .dot { width: 10px; height: 10px; border-radius: 50%; }

        .modal-overlay {
            display: none;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7);
            z-index: 2000;
            align-items: center;
            justify-content: center;
        }
        .modal-overlay.open { display: flex; }
        .modal {
            background: #1a1a2e;
            border: 1px solid #2a2a4a;
            border-radius: 8px;
            width: 600px;
            max-width: 90vw;
            max-height: 85vh;
            overflow-y: auto;
            padding: 1.5rem;
        }
        .modal h2 { color: #00d4aa; margin-bottom: 1rem; font-size: 1.1rem; }
        .modal .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
        .modal .form-grid .span-2 { grid-column: span 2; }
        .modal .modal-actions { display: flex; gap: 0.5rem; margin-top: 1.2rem; justify-content: flex-end; }
        
        .upload-result {
            background: #0f0f1a;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 0.75rem;
            margin-top: 1rem;
            font-family: monospace;
            font-size: 0.8rem;
            display: none;
        }
        .tabs { display: flex; gap: 0; border-bottom: 1px solid #2a2a4a; margin-bottom: 1.5rem; }
        .tab {
            padding: 0.6rem 1.2rem; cursor: pointer; color: #888;
            border-bottom: 2px solid transparent; font-size: 0.9rem;
        }
        .tab:hover { color: #eee; }
        .tab.active { color: #00d4aa; border-bottom-color: #00d4aa; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔧 Firmware Admin</h1>
        <div class="actions">
            <button class="btn btn-sign" onclick="signManifest()">🔏 Sign & Publish</button>
        </div>
    </div>
    
    <div class="main">
        <div class="sidebar">
            <div style="padding: 0.75rem 1rem;">
                <input type="text" id="sidebarSearch" placeholder="🔍 Search models..." oninput="filterSidebar()" style="width:100%; padding:0.4rem 0.6rem; background:#0f0f1a; border:1px solid #333; border-radius:4px; color:#eee; font-size:0.85rem;">
            </div>
            <div id="sidebarList"></div>
        </div>
        <div class="content">
            <div class="tabs">
                <div class="tab active" data-tab="upload">Upload</div>
                <div class="tab" data-tab="models">Models</div>
                <div class="tab" data-tab="coverage">Coverage</div>
                <div class="tab" data-tab="tools">Tools</div>
                <div class="tab" data-tab="files">Files</div>
            </div>
            
            <!-- Upload Tab -->
            <div class="tab-content active" id="tab-upload">
                <div class="card">
                    <h2>Upload Firmware</h2>
                    <div class="drop-zone" id="dropZone">
                        <p>📁 Drop firmware file here or click to browse</p>
                        <input type="file" id="fileInput" style="display:none" accept=".rom,.bin,.pkg,.LOD,.fw,.img">
                    </div>
                    <div id="uploadForm" style="display:none; margin-top:1.5rem;">
                        <div class="form-row">
                            <label>File</label>
                            <input type="text" id="uploadFilename" readonly>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                            <div class="form-row">
                                <label>Device Type</label>
                                <select id="uploadCategory" onchange="onCategoryChange()">
                                    <option value="hdd">HDD (Seagate)</option>
                                    <option value="hba">HBA (Broadcom)</option>
                                    <option value="nic">NIC (Mellanox/Broadcom)</option>
                                    <option value="nvme">NVMe SSD</option>
                                    <option value="ssd">SSD</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label>Model Number <span style="color:#666; font-size:0.75rem;">(from firmware release notes)</span></label>
                                <input type="text" id="uploadModelMatch" placeholder="e.g., ST16000NM001G" oninput="livePreview()">
                            </div>
                        </div>
                        <div id="hddFields">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                                <div class="form-row">
                                    <label>Interface</label>
                                    <select id="uploadInterface" onchange="livePreview()">
                                        <option value="SATA">SATA</option>
                                        <option value="SAS">SAS</option>
                                    </select>
                                </div>
                                <div class="form-row">
                                    <label>Apply to entire family? <span style="color:#666; font-size:0.75rem;">(assigns to all models in same family &amp; track)</span></label>
                                    <select id="uploadFamily" onchange="livePreview()">
                                        <option value="">— None (single model only) —</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <label>Compatible Source Versions <span style="color:#666; font-size:0.75rem;">(drives must be running one of these — press Enter to add)</span></label>
                                <div class="chip-input-container" id="upgradeFromChips" onclick="this.querySelector('.chip-text-input').focus()">
                                    <input type="text" class="chip-text-input" id="upgradeFromInput" placeholder="e.g., SN01, SN02, SN03, SN04...">
                                </div>
                            </div>
                        </div>
                        <div class="form-row">
                            <label>Target Firmware Version</label>
                            <input type="text" id="uploadVersion" placeholder="e.g., SN05 or 25.00.00.00" oninput="livePreview()">
                        </div>
                        <div class="form-row">
                            <label>Release Notes</label>
                            <textarea id="uploadNotes" placeholder="Optional notes..."></textarea>
                        </div>
                        <div id="uploadPreview" style="display:none; margin:1rem 0; padding:0.75rem; background:#0a0a15; border:1px solid #333; border-radius:6px; font-size:0.85rem;">
                        </div>
                        <button class="btn btn-primary" onclick="doUpload()">⬆️ Upload & Assign to Family</button>
                        <button class="btn btn-secondary" onclick="previewUpload()">👁 Preview</button>
                        <button class="btn btn-secondary" onclick="cancelUpload()">Cancel</button>
                    </div>
                    <div class="upload-result" id="uploadResult"></div>
                </div>
            </div>
            
            <!-- Models Tab -->
            <div class="tab-content" id="tab-models">
                <div class="card">
                    <h2>Add New Model</h2>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <div class="form-row">
                            <label>Category</label>
                            <select id="newModelCategory"></select>
                        </div>
                        <div class="form-row">
                            <label>Model Match (regex)</label>
                            <input type="text" id="newModelMatch" placeholder="e.g., 9600-16i or ST.*NM000A">
                        </div>
                        <div class="form-row">
                            <label>Vendor</label>
                            <select id="newModelVendor"><option value="">— Select or type below —</option></select>
                            <input type="text" id="newModelVendorCustom" placeholder="Or type new vendor" style="margin-top:0.3rem;">
                        </div>
                        <div class="form-row">
                            <label>Flash Tool</label>
                            <select id="newModelFlashTool" onchange="onFlashToolChange()">
                                <option value="">— Select —</option>
                            </select>
                            <input type="text" id="newModelFlashToolCustom" placeholder="Or type new tool name" style="margin-top:0.3rem; display:none;">
                        </div>
                        <div class="form-row" style="grid-column: span 2">
                            <label>Flash Command Template <span style="color:#666; font-size:0.75rem;">(auto-filled from tool, editable)</span></label>
                            <input type="text" id="newModelFlashCmd" placeholder="Auto-fills when you pick a tool">
                        </div>
                        <div class="form-row">
                            <label>Requires Reboot</label>
                            <select id="newModelReboot"><option value="true">Yes</option><option value="false">No</option></select>
                        </div>
                        <div class="form-row" style="display:flex; align-items:end;">
                            <button class="btn btn-primary" onclick="addModel()">+ Add Model</button>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <h2>All Models</h2>
                    <div style="margin-bottom:1rem;">
                        <input type="text" id="modelGridSearch" placeholder="🔍 Filter models..." oninput="filterModelGrid(this.value.toLowerCase())" style="width:100%; padding:0.5rem 0.75rem; background:#0f0f1a; border:1px solid #333; border-radius:4px; color:#eee; font-size:0.9rem;">
                    </div>
                    <div class="model-grid" id="modelGrid"></div>
                </div>
            </div>
            
            <!-- Coverage Tab -->
            <div class="tab-content" id="tab-coverage">
                <div class="card">
                    <h2>🔍 Check Coverage</h2>
                    <p style="color:#888; font-size:0.85rem; margin-bottom:1rem;">Paste model numbers from a customer machine to see which are supported. One per line, or paste smartctl scan output.</p>
                    <div class="form-row">
                        <label>Device Models <span style="color:#666; font-size:0.75rem;">(one per line — optionally add current firmware after a comma: MODEL,FIRMWARE)</span></label>
                        <textarea id="coverageInput" style="min-height:140px; font-family:monospace; font-size:0.85rem;" placeholder="ST16000NM001G,SN06&#10;ST8000NM017B,SN04&#10;9600-16i&#10;ConnectX-6&#10;UNKNOWN_MODEL_XYZ"></textarea>
                    </div>
                    <div style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                        <button class="btn btn-primary" onclick="checkCoverage()">🔍 Check Coverage</button>
                        <button class="btn btn-secondary" onclick="document.getElementById('coverageInput').value=''; document.getElementById('coverageResults').style.display='none';">Clear</button>
                        <button class="btn btn-secondary" onclick="parseScanOutput()">📋 Parse from smartctl JSON</button>
                    </div>
                    <div id="coverageResults" style="display:none;">
                        <div id="coverageSummary" style="margin-bottom:1rem; padding:0.75rem; border-radius:6px; background:#0a0a15; border:1px solid #333;"></div>
                        <div id="coverageUnsupported" style="margin-bottom:1rem;"></div>
                        <div id="coverageSupported"></div>
                    </div>
                </div>
            </div>

            <!-- Files Tab -->
            <!-- Tools Tab -->
            <div class="tab-content" id="tab-tools">
                <div class="card">
                    <h2>Add / Edit Flash Tool</h2>
                    <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-row">
                            <label>Tool Name</label>
                            <input type="text" id="toolName" placeholder="e.g., storcli64, sas3flash, SeaChest">
                        </div>
                        <div class="form-row">
                            <label>Install Check Command <span style="color:#666; font-size:0.75rem;">(verify tool exists)</span></label>
                            <input type="text" id="toolInstallCheck" placeholder="e.g., which storcli64">
                        </div>
                        <div class="form-row" style="grid-column: span 2;">
                            <label>Flash Command Template <span style="color:#666; font-size:0.75rem;">(use &lt;firmware_path&gt;, &lt;device&gt; as placeholders)</span></label>
                            <input type="text" id="toolCommand" placeholder="e.g., storcli64 /cX download file=<firmware_path>">
                        </div>
                        <div class="form-row" style="grid-column: span 2;">
                            <label>Description</label>
                            <input type="text" id="toolDescription" placeholder="Brief description of what this tool flashes">
                        </div>
                        <div class="form-row" style="display:flex; align-items:end; gap:0.5rem;">
                            <button class="btn btn-primary" onclick="addTool()">💾 Save Tool</button>
                            <button class="btn" onclick="clearToolForm()" style="background:#333;">Clear</button>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <h2>Registered Flash Tools</h2>
                    <table class="file-list">
                        <thead><tr><th>Tool Name</th><th>Command Template</th><th>Description</th><th>Used By</th><th></th></tr></thead>
                        <tbody id="toolsTableBody"></tbody>
                    </table>
                </div>
            </div>

            <div class="tab-content" id="tab-files">
                <div class="card">
                    <h2>Repository Files</h2>
                    <table class="file-list">
                        <thead><tr><th>Filename</th><th>Size</th><th>Modified</th><th></th></tr></thead>
                        <tbody id="fileListBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <div class="toast" id="toast"></div>

    <!-- Edit Model Modal -->
    <div class="modal-overlay" id="editModal">
        <div class="modal">
            <h2>✏️ Edit Model: <span id="editModelTitle"></span></h2>
            <input type="hidden" id="editModelKey">
            <div class="form-grid">
                <div class="form-row">
                    <label>Vendor</label>
                    <input type="text" id="editVendor">
                </div>
                <div class="form-row">
                    <label>Family</label>
                    <input type="text" id="editFamily">
                </div>
                <div class="form-row">
                    <label>Interface</label>
                    <input type="text" id="editInterface">
                </div>
                <div class="form-row">
                    <label>Capacity</label>
                    <input type="text" id="editCapacity">
                </div>
                <div class="form-row">
                    <label>Part Match</label>
                    <input type="text" id="editPartMatch">
                </div>
                <div class="form-row">
                    <label>Latest Firmware</label>
                    <input type="text" id="editVersion">
                </div>
                <div class="form-row">
                    <label>Flash Tool</label>
                    <input type="text" id="editFlashTool">
                </div>
                <div class="form-row">
                    <label>Flashable</label>
                    <select id="editFlashable"><option value="true">Yes</option><option value="false">No</option></select>
                </div>
                <div class="form-row span-2">
                    <label>Flash Command</label>
                    <input type="text" id="editFlashCommand">
                </div>
                <div class="form-row">
                    <label>Requires Reboot</label>
                    <select id="editReboot"><option value="true">Yes</option><option value="false">No</option></select>
                </div>
                <div class="form-row">
                    <label>Firmware File</label>
                    <input type="text" id="editFirmwareFile" readonly style="opacity:0.6" title="Upload a file to change this">
                </div>
                <div class="form-row span-2">
                    <label>Compatible Source FW</label>
                    <div class="chip-input-container" id="editUpgradeFromChips" onclick="this.querySelector('.chip-text-input').focus()">
                        <input type="text" class="chip-text-input" id="editUpgradeFromInput" placeholder="Type prefix, press Enter...">
                    </div>
                </div>
                <div class="form-row span-2">
                    <label>Release Notes</label>
                    <textarea id="editNotes" style="min-height:50px;"></textarea>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveModelEdit()">💾 Save</button>
            </div>
        </div>
    </div>

    <!-- Family Detail Modal -->
    <div class="modal-overlay" id="familyModal">
        <div class="modal" id="familyModalContent"></div>
    </div>

    <script>
        let models = [];
        let pendingFile = null;
        
        // ─── Tab switching ─────────────────────────────────────────────
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
            });
        });
        
        // ─── Drop zone ─────────────────────────────────────────────────
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) prepareUpload(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', () => { if (fileInput.files.length) prepareUpload(fileInput.files[0]); });
        
        function prepareUpload(file) {
            pendingFile = file;
            document.getElementById('uploadFilename').value = file.name;
            document.getElementById('uploadForm').style.display = 'block';
            document.getElementById('uploadResult').style.display = 'none';
        }
        
        function cancelUpload() {
            pendingFile = null;
            document.getElementById('uploadForm').style.display = 'none';
            fileInput.value = '';
            clearUpgradeFromChips();
        }

        // ─── Chip input for upgrade_from ───────────────────────────────
        const chipContainer = document.getElementById('upgradeFromChips');
        const chipInput = document.getElementById('upgradeFromInput');

        chipInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addChip(this.value.trim());
                this.value = '';
            }
            if (e.key === 'Backspace' && this.value === '') {
                const chips = chipContainer.querySelectorAll('.chip');
                if (chips.length) chips[chips.length - 1].remove();
            }
        });

        chipInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                addChip(this.value.trim());
                this.value = '';
            }
        });

        function addChip(value) {
            value = value.replace(/,/g, '').trim().toUpperCase();
            if (!value) return;
            // Prevent duplicates
            const existing = [...chipContainer.querySelectorAll('.chip')].map(c => c.dataset.value);
            if (existing.includes(value)) return;

            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.dataset.value = value;
            chip.innerHTML = `${value}<span class="chip-remove" onclick="this.parentElement.remove()">&times;</span>`;
            chipContainer.insertBefore(chip, chipInput);
        }

        function getUpgradeFromChips() {
            return [...chipContainer.querySelectorAll('.chip')].map(c => c.dataset.value).join(',');
        }

        function clearUpgradeFromChips() {
            chipContainer.querySelectorAll('.chip').forEach(c => c.remove());
            chipInput.value = '';
        }

        function onCategoryChange() {
            const cat = document.getElementById('uploadCategory').value;
            const hddFields = document.getElementById('hddFields');
            const modelInput = document.getElementById('uploadModelMatch');

            if (cat === 'hdd') {
                hddFields.style.display = 'block';
                modelInput.placeholder = 'e.g., ST16000NM001G';
            } else if (cat === 'hba') {
                hddFields.style.display = 'none';
                modelInput.placeholder = 'e.g., 9600-16i';
            } else if (cat === 'nic') {
                hddFields.style.display = 'none';
                modelInput.placeholder = 'e.g., ConnectX-6 or P210p';
            } else {
                hddFields.style.display = 'none';
                modelInput.placeholder = 'e.g., Micron_7450';
            }
            livePreview();
        }

        async function doUpload() {
            if (!pendingFile) return;
            
            const category = document.getElementById('uploadCategory').value;
            const family = (category === 'hdd') ? document.getElementById('uploadFamily').value : '';
            const iface = (category === 'hdd') ? document.getElementById('uploadInterface').value : '';
            const version = document.getElementById('uploadVersion').value;
            const modelMatch = document.getElementById('uploadModelMatch').value.trim();
            
            if (!family && !modelMatch) { showToast('Please enter a model number or select a family', 'error'); return; }
            if (!version) { showToast('Please enter target firmware version', 'error'); return; }
            
            const form = new FormData();
            form.append('file', pendingFile);
            form.append('category', category);
            form.append('family', family);
            form.append('interface', iface);
            form.append('version', version);
            form.append('model_match', modelMatch);
            form.append('notes', document.getElementById('uploadNotes').value);
            form.append('upgrade_from', (category === 'hdd') ? getUpgradeFromChips() : '');
            
            try {
                const resp = await fetch('/api/upload', { method: 'POST', body: form });
                const data = await resp.json();
                
                const resultEl = document.getElementById('uploadResult');
                resultEl.style.display = 'block';
                
                if (data.assigned_models && data.assigned_models.length > 0) {
                    const action = data.created_new ? '🆕 Created new entry' : '🔗 Assigned';
                    const target = modelMatch ? `model <code>${modelMatch}</code>` : `<strong>${family}</strong> ${iface} <code>${version.substring(0,2)}</code>-track`;
                    resultEl.innerHTML = `✅ <strong>${data.filename}</strong> uploaded<br>${action} to <strong>${data.assigned_models.length}</strong> entry/entries: ${target}<br>SHA256: ${data.sha256}<br><br><span id="signStatus">🔄 Signing & publishing...</span>`;
                } else if (data.warning) {
                    resultEl.innerHTML = `⚠️ Uploaded <strong>${data.filename}</strong> but: ${data.warning}<br>SHA256: ${data.sha256}<br><br><span id="signStatus">🔄 Signing & publishing...</span>`;
                } else {
                    resultEl.innerHTML = `✅ <strong>${data.filename}</strong> uploaded (no matching models found)<br>SHA256: ${data.sha256}<br><br><span id="signStatus">🔄 Signing & publishing...</span>`;
                }
                showToast('🔄 Signing & publishing...', 'progress', true);
                
                document.getElementById('uploadForm').style.display = 'none';
                pendingFile = null;
                fileInput.value = '';
                
                // Auto sign & publish
                try {
                    const signResp = await fetch('/api/sign', { method: 'POST' });
                    const signData = await signResp.json();
                    const signStatusEl = document.getElementById('signStatus');
                    if (signResp.ok) {
                        if (signStatusEl) signStatusEl.innerHTML = '✅ Signed & published!';
                        else resultEl.innerHTML = resultEl.innerHTML.replace('🔄 Signing & publishing...', '✅ Signed & published!');
                        updateToast('✅ Signed & published!', 'success');
                    } else {
                        if (signStatusEl) signStatusEl.innerHTML = '❌ Sign failed: ' + signData.error;
                        else resultEl.innerHTML = resultEl.innerHTML.replace('🔄 Signing & publishing...', '❌ Sign failed: ' + signData.error);
                        updateToast('❌ Sign failed: ' + signData.error, 'error');
                    }
                } catch (signErr) {
                    const signStatusEl = document.getElementById('signStatus');
                    if (signStatusEl) signStatusEl.innerHTML = '❌ Sign error: ' + signErr.message;
                    else resultEl.innerHTML = resultEl.innerHTML.replace('🔄 Signing & publishing...', '❌ Sign error: ' + signErr.message);
                    updateToast('❌ Sign error: ' + signErr.message, 'error');
                }
                
                loadAll();
            } catch (err) {
                showToast('Upload failed: ' + err.message, 'error');
            }
        }
        
        // ─── Sign & Publish ────────────────────────────────────────────
        async function signManifest() {
            if (!confirm('Sign manifest with GPG and publish to repository?')) return;
            try {
                const resp = await fetch('/api/sign', { method: 'POST' });
                const data = await resp.json();
                if (resp.ok) {
                    showToast('✓ Manifest signed and published!', 'success');
                } else {
                    showToast('Sign failed: ' + data.error, 'error');
                }
            } catch (err) {
                showToast('Error: ' + err.message, 'error');
            }
        }
        
        // ─── Flash Tools Management ───────────────────────────────────
        let flashTools = {};  // tool_name -> {command, description, install_check}
        
        async function loadFlashTools() {
            const resp = await fetch('/api/flash-tools');
            flashTools = await resp.json();
            
            // Populate flash tool dropdown in Add Model form
            const select = document.getElementById('newModelFlashTool');
            select.innerHTML = '<option value="">— Select existing tool —</option>';
            for (const [tool, info] of Object.entries(flashTools)) {
                select.innerHTML += `<option value="${tool}">${tool}</option>`;
            }
            select.innerHTML += '<option value="__new__">+ Add new tool...</option>';
            
            // Render tools table
            renderToolsTable();
        }
        
        function renderToolsTable() {
            const tbody = document.getElementById('toolsTableBody');
            if (!tbody) return;
            
            const toolEntries = Object.entries(flashTools);
            if (toolEntries.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#888;">No flash tools registered yet</td></tr>';
                return;
            }
            
            // Count usage per tool
            const usage = {};
            models.forEach(m => {
                const t = m.flash_tool || '';
                if (t) usage[t] = (usage[t] || 0) + 1;
            });
            
            tbody.innerHTML = toolEntries.map(([name, info]) => {
                const cmd = typeof info === 'object' ? info.command : info;
                const desc = typeof info === 'object' ? (info.description || '') : '';
                const count = usage[name] || 0;
                return `<tr>
                    <td><strong>${name}</strong></td>
                    <td style="font-family:monospace; font-size:0.8rem; max-width:300px; overflow:hidden; text-overflow:ellipsis;">${cmd}</td>
                    <td>${desc}</td>
                    <td style="text-align:center;">${count > 0 ? '<span style="color:#4fc3f7;">' + count + ' model' + (count > 1 ? 's' : '') + '</span>' : '<span style="color:#666;">unused</span>'}</td>
                    <td>
                        <button class="btn" style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#1a5276;" onclick="editTool('${name}')">✏️</button>
                        <button class="btn" style="padding:0.2rem 0.5rem; font-size:0.75rem; background:#5c1a1a;" onclick="deleteTool('${name}')">🗑️</button>
                    </td>
                </tr>`;
            }).join('');
        }
        
        function editTool(name) {
            const info = flashTools[name];
            if (!info) return;
            document.getElementById('toolName').value = name;
            document.getElementById('toolCommand').value = typeof info === 'object' ? info.command : info;
            document.getElementById('toolDescription').value = typeof info === 'object' ? (info.description || '') : '';
            document.getElementById('toolInstallCheck').value = typeof info === 'object' ? (info.install_check || '') : '';
            // Switch to tools tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="tools"]').classList.add('active');
            document.getElementById('tab-tools').classList.add('active');
        }
        
        async function addTool() {
            const name = document.getElementById('toolName').value.trim();
            const command = document.getElementById('toolCommand').value.trim();
            const description = document.getElementById('toolDescription').value.trim();
            const install_check = document.getElementById('toolInstallCheck').value.trim();
            
            if (!name) { showToast('Tool name is required', 'error'); return; }
            if (!command) { showToast('Command template is required', 'error'); return; }
            
            try {
                const resp = await fetch('/api/flash-tools/add', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ name, command, description, install_check })
                });
                const result = await resp.json();
                if (resp.ok) {
                    showToast(`Tool '${name}' ${result.action}`, 'success');
                    clearToolForm();
                    await loadFlashTools();
                } else {
                    showToast(result.error, 'error');
                }
            } catch (err) {
                showToast('Failed to save tool: ' + err.message, 'error');
            }
        }
        
        async function deleteTool(name) {
            if (!confirm(`Delete tool '${name}'?`)) return;
            try {
                const resp = await fetch('/api/flash-tools/delete', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ name })
                });
                const result = await resp.json();
                if (resp.ok) {
                    showToast(`Tool '${name}' deleted`, 'success');
                    await loadFlashTools();
                } else {
                    showToast(result.error, 'error');
                }
            } catch (err) {
                showToast('Failed to delete tool: ' + err.message, 'error');
            }
        }
        
        function clearToolForm() {
            document.getElementById('toolName').value = '';
            document.getElementById('toolCommand').value = '';
            document.getElementById('toolDescription').value = '';
            document.getElementById('toolInstallCheck').value = '';
        }
        
        // ─── Add Model ─────────────────────────────────────────────────
        function loadModelFormDropdowns() {
            // Populate vendor dropdown from existing models
            const vendors = [...new Set(models.map(m => m.vendor).filter(Boolean))];
            const vendorSelect = document.getElementById('newModelVendor');
            vendorSelect.innerHTML = '<option value="">— Select —</option>';
            vendors.forEach(v => { vendorSelect.innerHTML += `<option value="${v}">${v}</option>`; });
            vendorSelect.innerHTML += '<option value="__new__">+ New vendor...</option>';
            
            // Populate category dropdown from existing + defaults
            const existingCats = [...new Set(models.map(m => m.category))];
            const defaultCats = ['hba', 'nic', 'hdd', 'nvme', 'ssd', 'bios', 'bmc', 'expander'];
            const allCats = [...new Set([...existingCats, ...defaultCats])];
            const catSelect = document.getElementById('newModelCategory');
            catSelect.innerHTML = allCats.map(c => `<option value="${c}">${c.toUpperCase()}</option>`).join('');
        }
        
        function onFlashToolChange() {
            const select = document.getElementById('newModelFlashTool');
            const customInput = document.getElementById('newModelFlashToolCustom');
            const cmdInput = document.getElementById('newModelFlashCmd');
            
            if (select.value === '__new__') {
                customInput.style.display = 'block';
                customInput.focus();
                cmdInput.value = '';
                cmdInput.placeholder = 'Enter command template with <firmware_path>';
            } else if (select.value) {
                customInput.style.display = 'none';
                const info = flashTools[select.value];
                cmdInput.value = (typeof info === 'object' ? info.command : info) || '';
            } else {
                customInput.style.display = 'none';
                cmdInput.value = '';
            }
        }
        
        function onVendorChange() {
            const select = document.getElementById('newModelVendor');
            const customInput = document.getElementById('newModelVendorCustom');
            if (select.value === '__new__') {
                customInput.style.display = 'block';
                customInput.focus();
            } else {
                customInput.style.display = 'none';
            }
        }
        
        async function addModel() {
            const category = document.getElementById('newModelCategory').value;
            const model_match = document.getElementById('newModelMatch').value.trim();
            
            // Vendor: use custom if "new" selected
            const vendorSelect = document.getElementById('newModelVendor');
            const vendor = vendorSelect.value === '__new__' 
                ? document.getElementById('newModelVendorCustom').value.trim()
                : vendorSelect.value;
            
            // Flash tool: use custom if "new" selected
            const toolSelect = document.getElementById('newModelFlashTool');
            const flash_tool = toolSelect.value === '__new__'
                ? document.getElementById('newModelFlashToolCustom').value.trim()
                : toolSelect.value;
            
            const flash_command = document.getElementById('newModelFlashCmd').value.trim();
            const requires_reboot = document.getElementById('newModelReboot').value === 'true';
            
            if (!model_match) { showToast('Model match is required', 'error'); return; }
            if (!flash_tool) { showToast('Flash tool is required', 'error'); return; }
            
            try {
                const resp = await fetch('/api/add-model', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ category, model_match, vendor, flash_tool, flash_command, requires_reboot })
                });
                const data = await resp.json();
                if (resp.ok) {
                    showToast(`Added ${model_match} to [${category}]`, 'success');
                    document.getElementById('newModelMatch').value = '';
                    document.getElementById('newModelVendorCustom').value = '';
                    document.getElementById('newModelFlashToolCustom').value = '';
                    document.getElementById('newModelFlashCmd').value = '';
                    loadAll();
                } else {
                    showToast(data.error, 'error');
                }
            } catch (err) {
                showToast('Error: ' + err.message, 'error');
            }
        }
        
        // ─── Load data ─────────────────────────────────────────────────
        async function loadAll() {
            await Promise.all([loadModels(), loadFiles()]);
            await loadFlashTools();
            loadModelFormDropdowns();
            populateFamilyDropdown();
            buildSidebar();
            // Wire up vendor dropdown onchange
            document.getElementById('newModelVendor').onchange = onVendorChange;
        }

        function populateFamilyDropdown() {
            const families = new Set();
            models.forEach(m => {
                if (m.family && m.category === 'hdd') families.add(m.family);
            });
            const sel = document.getElementById('uploadFamily');
            sel.innerHTML = '<option value="">— None (single model only) —</option>';
            [...families].sort().forEach(f => {
                sel.innerHTML += `<option value="${f}">${f}</option>`;
            });
        }

        function livePreview() {
            const category = document.getElementById('uploadCategory').value;
            const family = (category === 'hdd') ? document.getElementById('uploadFamily').value : '';
            const iface = (category === 'hdd') ? document.getElementById('uploadInterface').value : '';
            const version = document.getElementById('uploadVersion').value;
            const modelMatch = document.getElementById('uploadModelMatch').value.trim();
            const previewEl = document.getElementById('uploadPreview');

            // Don't show anything until there's at least some input
            if (!family && !modelMatch && !version) {
                previewEl.style.display = 'none';
                return;
            }

            previewEl.style.display = 'block';

            if ((!family && !modelMatch) || !version) {
                previewEl.innerHTML = '<span style="color:#888;">Fill in model + version to see affected devices.</span>';
                return;
            }

            const trackPrefix = version.substring(0, 2);
            let matching = [];

            // Filter models by selected category
            const categoryModels = models.filter(m => m.category === category);

            // Match by family + interface + track (HDD only)
            if (family) {
                const familyMatches = categoryModels.filter(m => 
                    m.family === family && 
                    m.interface === iface && 
                    m.version && m.version.substring(0, 2) === trackPrefix
                );
                matching = matching.concat(familyMatches);
            }

            // Match by model number
            if (modelMatch) {
                const modelMatches = categoryModels.filter(m => {
                    const entryModel = m.model || '';
                    try {
                        return new RegExp(entryModel, 'i').test(modelMatch) || 
                               entryModel.toLowerCase() === modelMatch.toLowerCase();
                    } catch(e) {
                        return entryModel.toLowerCase() === modelMatch.toLowerCase();
                    }
                });
                modelMatches.forEach(m => {
                    if (!matching.find(x => x.model === m.model)) matching.push(m);
                });
            }

            // Check if the entered model already exists in matches
            const modelIsNew = modelMatch && !matching.find(m => 
                (m.model || '').toLowerCase() === modelMatch.toLowerCase()
            );

            let html = '';
            if (matching.length > 0) {
                html += `✅ Compatible with <strong>${matching.length}</strong> existing model(s):<br>`;
                html += '<div style="margin-top:0.5rem; display:flex; flex-wrap:wrap; gap:0.4rem;">';
                matching.forEach(m => {
                    const name = m.model || m.display_name;
                    html += `<span style="display:inline-block; background:#1a2a3a; border:1px solid #2a4a6a; border-radius:4px; padding:0.2rem 0.5rem; font-size:0.8rem;">`;
                    html += `<strong style="color:#4fc3f7;">${name}</strong>`;
                    html += `</span>`;
                });
                html += '</div>';
            }

            if (modelIsNew) {
                html += `<div style="margin-top:0.6rem; padding:0.4rem 0.6rem; background:#2a2a1a; border:1px solid #5a5a2a; border-radius:4px; font-size:0.85rem;">`;
                html += `🆕 <strong style="color:#f39c12;">${modelMatch}</strong> is not in the manifest — a new entry will be created.`;
                html += `</div>`;
            }

            if (matching.length === 0 && !modelIsNew) {
                html = `⚠️ No matching entries found for this family/interface/track combination.`;
            }

            previewEl.innerHTML = html;
        }

        // Keep Preview button working (same as live)
        function previewUpload() { livePreview(); }
        
        async function loadModels() {
            const resp = await fetch('/api/models');
            models = await resp.json();
            
            // Model grid — group by family for HDD, show individual for others
            const grid = document.getElementById('modelGrid');
            const categories = {};
            models.forEach(m => {
                if (!categories[m.category]) categories[m.category] = [];
                categories[m.category].push(m);
            });

            let cards = [];
            for (const [cat, items] of Object.entries(categories)) {
                if (cat === 'hdd') {
                    // Group HDDs by family
                    const families = {};
                    items.forEach(m => {
                        const key = m.family || m.model;
                        if (!families[key]) families[key] = [];
                        families[key].push(m);
                    });
                    for (const [fam, members] of Object.entries(families)) {
                        const allReady = members.every(m => m.firmware_file && m.sha256);
                        const someReady = members.some(m => m.firmware_file && m.sha256);
                        let badge = '';
                        if (allReady) badge = '<span class="badge badge-ok">✓ All Ready</span>';
                        else if (someReady) badge = '<span class="badge badge-no-hash">⚠ Partial</span>';
                        else badge = '<span class="badge badge-missing">No Files</span>';

                        // Collect unique firmware versions and interfaces
                        const versions = [...new Set(members.map(m => m.version).filter(Boolean))];
                        const interfaces = [...new Set(members.map(m => m.interface).filter(Boolean))];
                        const fwFile = [...new Set(members.map(m => m.firmware_file).filter(Boolean))];
                        const vendor = members[0].vendor || '';

                        cards.push(`<div class="model-card" onclick='openFamilyDetail("${fam.replace(/'/g, "\\'")}")' data-search="${fam.toLowerCase()} ${vendor.toLowerCase()} ${cat} ${members.map(m=>m.model).join(' ').toLowerCase()}">
                            <div class="model-name">${vendor ? vendor + ' ' : ''}${fam}</div>
                            <div class="model-meta">${cat} • ${members.length} model${members.length > 1 ? 's' : ''} • ${interfaces.join('/')}</div>
                            <div class="model-version">${versions.length > 0 ? 'v' + versions.join(', v') : 'No version'}</div>
                            <div class="model-file">${fwFile.length > 0 ? fwFile.join(', ') : '—'}</div>
                            ${badge}
                        </div>`);
                    }
                } else {
                    // Non-HDD: show individual cards
                    items.forEach(m => {
                        let badge = '';
                        if (m.firmware_file && m.sha256) badge = '<span class="badge badge-ok">✓ Ready</span>';
                        else if (m.firmware_file && !m.sha256) badge = '<span class="badge badge-no-hash">⚠ No Hash</span>';
                        else badge = '<span class="badge badge-missing">No File</span>';

                        cards.push(`<div class="model-card" onclick='openEditModal(${JSON.stringify(m)})' data-search="${m.display_name.toLowerCase()} ${m.model.toLowerCase()} ${cat} ${(m.vendor||'').toLowerCase()}">
                            <div class="model-name">${m.display_name}</div>
                            <div class="model-meta">${cat} • ${m.model}</div>
                            <div class="model-version">v${m.version || '?'}</div>
                            <div class="model-file" title="${m.firmware_file || 'No file assigned'}">${m.firmware_file || '—'}</div>
                            ${badge}
                        </div>`);
                    });
                }
            }
            grid.innerHTML = cards.join('');
        }

        function openFamilyDetail(family) {
            // Filter to models in this family
            const familyModels = models.filter(m => m.family === family);
            if (familyModels.length === 1) {
                openEditModal(familyModels[0]);
                return;
            }
            // Build a mini-grid in the family modal (separate from edit modal)
            const content = document.getElementById('familyModalContent');
            content.innerHTML = `
                <h2>📦 ${family} <span style="color:#888; font-size:0.85rem;">(${familyModels.length} models)</span></h2>
                <div class="model-grid" style="max-height:60vh; overflow-y:auto;">
                    ${familyModels.map((m, i) => {
                        let badge = '';
                        if (m.firmware_file && m.sha256) badge = '<span class="badge badge-ok">✓</span>';
                        else if (m.firmware_file) badge = '<span class="badge badge-no-hash">⚠</span>';
                        else badge = '<span class="badge badge-missing">✗</span>';
                        return `<div class="model-card" data-family-idx="${i}">
                            <div class="model-name">${m.model}</div>
                            <div class="model-meta">${m.interface || ''} • ${m.capacity || ''}</div>
                            <div class="model-version">v${m.version || '?'}</div>
                            <div class="model-file">${m.firmware_file || '—'}</div>
                            ${badge}
                        </div>`;
                    }).join('')}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="closeFamilyModal()">Close</button>
                </div>
            `;
            // Attach click handlers (avoids quote escaping issues with inline JSON)
            content.querySelectorAll('[data-family-idx]').forEach(card => {
                card.addEventListener('click', () => {
                    const idx = parseInt(card.dataset.familyIdx);
                    closeFamilyModal();
                    openEditModal(familyModels[idx]);
                });
            });
            document.getElementById('familyModal').classList.add('open');
        }

        function closeFamilyModal() {
            document.getElementById('familyModal').classList.remove('open');
        }

        // Close family modal on overlay click
        document.getElementById('familyModal').addEventListener('click', function(e) {
            if (e.target === this) closeFamilyModal();
        });

        // ─── Coverage Check ────────────────────────────────────────────
        async function checkCoverage() {
            const raw = document.getElementById('coverageInput').value.trim();
            if (!raw) { showToast('Paste model numbers first', 'error'); return; }

            // Parse lines: each line is "MODEL" or "MODEL,FIRMWARE"
            const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
            const modelList = lines.map(line => {
                const parts = line.split(/[,\t]+/);
                return { model: parts[0].trim(), firmware: (parts[1] || '').trim() };
            });

            try {
                const resp = await fetch('/api/check-coverage', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ models: modelList })
                });
                const data = await resp.json();
                if (!resp.ok) { showToast(data.error || 'Check failed', 'error'); return; }
                renderCoverageResults(data);
            } catch (err) {
                showToast('Error: ' + err.message, 'error');
            }
        }

        function renderCoverageResults(data) {
            const resultsEl = document.getElementById('coverageResults');
            const summaryEl = document.getElementById('coverageSummary');
            const unsupportedEl = document.getElementById('coverageUnsupported');
            const supportedEl = document.getElementById('coverageSupported');
            resultsEl.style.display = 'block';

            // Summary bar
            const pct = data.total > 0 ? Math.round((data.supported / data.total) * 100) : 0;
            const barColor = pct === 100 ? '#27ae60' : pct >= 80 ? '#f39c12' : '#e74c3c';
            summaryEl.innerHTML = `
                <div style="display:flex; align-items:center; gap:1rem; margin-bottom:0.5rem;">
                    <strong style="font-size:1.1rem;">${pct}% Coverage</strong>
                    <span style="color:#888;">${data.supported} supported / ${data.unsupported} unsupported / ${data.total} total</span>
                </div>
                <div style="height:6px; background:#1a1a2e; border-radius:3px; overflow:hidden;">
                    <div style="height:100%; width:${pct}%; background:${barColor}; border-radius:3px;"></div>
                </div>
            `;

            // Unsupported (gaps) — shown prominently
            const unsupported = data.results.filter(r => r.status === 'unsupported');
            if (unsupported.length > 0) {
                unsupportedEl.innerHTML = `
                    <h3 style="color:#e74c3c; margin-bottom:0.5rem;">❌ Unsupported Models (${unsupported.length})</h3>
                    <p style="color:#888; font-size:0.8rem; margin-bottom:0.5rem;">These models have no matching entry in the manifest. Firmware updates will NOT be applied to these drives.</p>
                    <div class="model-grid">
                        ${unsupported.map(r => `
                            <div class="model-card" style="border-color:#5c1a1a;">
                                <div class="model-name" style="color:#e74c3c;">${r.model}</div>
                                <div class="model-meta">${r.current_firmware ? 'Current FW: ' + r.current_firmware : 'No FW info'}</div>
                                <span class="badge badge-missing">Not in manifest</span>
                                <div style="margin-top:0.5rem;">
                                    <button class="btn btn-primary" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="quickAddFromCoverage('${r.model}')">+ Add to Manifest</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                unsupportedEl.innerHTML = '';
            }

            // Supported — collapsed by default
            const supported = data.results.filter(r => r.status === 'supported');
            if (supported.length > 0) {
                const needsUpdate = supported.filter(r => r.needs_update);
                const upToDate = supported.filter(r => !r.needs_update);
                let html = `<details ${unsupported.length === 0 ? 'open' : ''}>
                    <summary style="cursor:pointer; color:#27ae60; font-weight:bold; margin-bottom:0.5rem;">
                        ✅ Supported Models (${supported.length})${needsUpdate.length > 0 ? ` — <span style="color:#f39c12;">${needsUpdate.length} need update</span>` : ''}
                    </summary>
                    <div class="model-grid">`;
                supported.forEach(r => {
                    const updateBadge = r.needs_update
                        ? `<span class="badge badge-no-hash">⬆ ${r.current_firmware} → ${r.latest_firmware}</span>`
                        : r.has_firmware_file
                            ? `<span class="badge badge-ok">✓ Ready</span>`
                            : `<span class="badge badge-no-hash">⚠ No file uploaded</span>`;
                    html += `<div class="model-card" style="border-color:#1a3a2a;">
                        <div class="model-name" style="color:#27ae60;">${r.model}</div>
                        <div class="model-meta">${r.category} • ${r.family || r.model}</div>
                        <div class="model-version">Latest: v${r.latest_firmware || '?'}${r.current_firmware ? ' | Current: v' + r.current_firmware : ''}</div>
                        ${updateBadge}
                    </div>`;
                });
                html += '</div></details>';
                supportedEl.innerHTML = html;
            } else {
                supportedEl.innerHTML = '';
            }
        }

        function quickAddFromCoverage(model) {
            // Pre-fill the Add Model form and switch to Models tab
            document.getElementById('newModelMatch').value = model;
            // Switch to models tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="models"]').classList.add('active');
            document.getElementById('tab-models').classList.add('active');
            // Scroll to top
            document.querySelector('.content').scrollTop = 0;
            showToast(`Fill in details for ${model} and click "Add Model"`, 'success');
        }

        function parseScanOutput() {
            // Try to parse the textarea as smartctl JSON scan output
            const raw = document.getElementById('coverageInput').value.trim();
            if (!raw) { showToast('Paste smartctl output first', 'error'); return; }

            try {
                const json = JSON.parse(raw);
                // Handle smartctl --scan-open --json output
                let parsed = [];
                if (json.devices) {
                    // It's a scan result — we need to explain we need per-device info
                    showToast('This is a scan list. Paste individual device info or a list of model numbers.', 'error');
                    return;
                }
                if (json.model_name) {
                    // Single device info
                    parsed.push(json.model_name + (json.firmware_version ? ',' + json.firmware_version : ''));
                }
                if (parsed.length > 0) {
                    document.getElementById('coverageInput').value = parsed.join('\\n');
                    showToast(`Parsed ${parsed.length} device(s)`, 'success');
                    return;
                }
            } catch(e) {
                // Not JSON — try to extract model numbers from smartctl text output
                const modelLines = [];
                const lines = raw.split('\\n');
                for (const line of lines) {
                    // Match "Device Model:" or "Product:" lines from smartctl -i
                    let m = line.match(/(?:Device Model|Product|Model Number):\\s*(.+)/i);
                    if (m) {
                        let model = m[1].trim();
                        // Try to find firmware on nearby lines
                        modelLines.push(model);
                    }
                    // Match "Firmware Version:" 
                    let fw = line.match(/(?:Firmware Version|Revision):\\s*(.+)/i);
                    if (fw && modelLines.length > 0) {
                        // Append firmware to last model
                        modelLines[modelLines.length - 1] += ',' + fw[1].trim();
                    }
                }
                if (modelLines.length > 0) {
                    document.getElementById('coverageInput').value = modelLines.join('\\n');
                    showToast(`Extracted ${modelLines.length} model(s) from text`, 'success');
                    return;
                }
            }
            showToast('Could not parse input. Use format: MODEL,FIRMWARE (one per line)', 'error');
        }

        async function loadFiles() {
            const resp = await fetch('/api/files');
            const files = await resp.json();
            
            const tbody = document.getElementById('fileListBody');
            tbody.innerHTML = files.map(f => `<tr>
                <td class="file-name">${f.name}</td>
                <td>${formatSize(f.size)}</td>
                <td style="color:#666;font-size:0.8rem">${new Date(f.modified).toLocaleDateString()}</td>
                <td><button class="btn btn-danger" onclick="deleteFile('${f.name}')" style="padding:0.2rem 0.5rem;font-size:0.75rem">🗑</button></td>
            </tr>`).join('');
        }
        
        function buildSidebar() {
            filterSidebar();
        }
        
        function filterSidebar() {
            const query = (document.getElementById('sidebarSearch').value || '').toLowerCase();
            const sidebar = document.getElementById('sidebarList');
            const categories = {};
            models.forEach(m => {
                if (!categories[m.category]) categories[m.category] = [];
                categories[m.category].push(m);
            });
            
            let html = '';
            for (const [cat, items] of Object.entries(categories)) {
                const filtered = items.filter(m => 
                    m.model.toLowerCase().includes(query) ||
                    (m.vendor || '').toLowerCase().includes(query) ||
                    (m.family || '').toLowerCase().includes(query) ||
                    cat.toLowerCase().includes(query)
                );
                if (filtered.length === 0) continue;

                // Group by family (for categories with many entries like hdd)
                if (cat === 'hdd' && !query) {
                    html += `<div class="nav-section">${cat} (${filtered.length})</div>`;
                    const families = {};
                    filtered.forEach(m => {
                        const key = m.family || m.model;
                        if (!families[key]) families[key] = [];
                        families[key].push(m);
                    });
                    for (const [fam, members] of Object.entries(families)) {
                        // Determine aggregate status
                        const allReady = members.every(m => m.firmware_file && m.sha256);
                        const someReady = members.some(m => m.firmware_file && m.sha256);
                        const statusClass = allReady ? 'status-ok' : someReady ? 'status-no-hash' : 'status-missing';
                        const count = members.length;
                        const label = count > 1 ? `${fam} <span style="color:#555; font-size:0.75rem;">(${count})</span>` : fam;
                        html += `<div class="nav-item"><span>${label}</span><div class="status ${statusClass}"></div></div>`;
                    }
                } else {
                    html += `<div class="nav-section">${cat} (${filtered.length})</div>`;
                    filtered.forEach(m => {
                        let statusClass = 'status-missing';
                        if (m.firmware_file && m.sha256) statusClass = 'status-ok';
                        else if (m.firmware_file) statusClass = 'status-no-hash';
                        html += `<div class="nav-item"><span>${m.display_name}</span><div class="status ${statusClass}"></div></div>`;
                    });
                }
            }
            sidebar.innerHTML = html || '<div style="padding:1rem;color:#666;">No matches</div>';
            
            // Also filter model grid if visible
            filterModelGrid(query);
        }
        
        function filterModelGrid(query) {
            const grid = document.getElementById('modelGrid');
            if (!grid) return;
            const cards = grid.querySelectorAll('.model-card');
            cards.forEach(card => {
                const searchText = (card.dataset.search || card.textContent).toLowerCase();
                card.style.display = searchText.includes(query) ? '' : 'none';
            });
        }
        
        async function deleteFile(name) {
            if (!confirm(`Delete ${name}?`)) return;
            await fetch('/api/delete', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({filename: name})
            });
            showToast(`Deleted ${name}`, 'success');
            loadAll();
        }
        
        function formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
            return (bytes/(1024*1024)).toFixed(1) + ' MB';
        }
        
        let toastTimer = null;
        function showToast(msg, type, persistent) {
            const t = document.getElementById('toast');
            t.textContent = msg;
            t.className = `toast show ${type}`;
            if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
            if (!persistent) {
                toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
            }
        }
        function updateToast(msg, type) {
            const t = document.getElementById('toast');
            t.textContent = msg;
            t.className = `toast show ${type}`;
            if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
            toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
        }

        // ─── Edit Modal ────────────────────────────────────────────────
        const editModal = document.getElementById('editModal');
        const editChipContainer = document.getElementById('editUpgradeFromChips');
        const editChipInput = document.getElementById('editUpgradeFromInput');

        editChipInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addEditChip(this.value.trim());
                this.value = '';
            }
            if (e.key === 'Backspace' && this.value === '') {
                const chips = editChipContainer.querySelectorAll('.chip');
                if (chips.length) chips[chips.length - 1].remove();
            }
        });

        editChipInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                addEditChip(this.value.trim());
                this.value = '';
            }
        });

        function addEditChip(value) {
            value = value.replace(/,/g, '').trim().toUpperCase();
            if (!value) return;
            const existing = [...editChipContainer.querySelectorAll('.chip')].map(c => c.dataset.value);
            if (existing.includes(value)) return;
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.dataset.value = value;
            chip.innerHTML = `${value}<span class="chip-remove" onclick="event.stopPropagation(); this.parentElement.remove()">&times;</span>`;
            editChipContainer.insertBefore(chip, editChipInput);
        }

        function getEditChips() {
            return [...editChipContainer.querySelectorAll('.chip')].map(c => c.dataset.value).join(',');
        }

        function clearEditChips() {
            editChipContainer.querySelectorAll('.chip').forEach(c => c.remove());
            editChipInput.value = '';
        }

        function openEditModal(m) {
            document.getElementById('editModelKey').value = m.model;
            document.getElementById('editModelTitle').textContent = m.display_name;
            document.getElementById('editVendor').value = m.vendor || '';
            document.getElementById('editFamily').value = m.family || '';
            document.getElementById('editInterface').value = m.interface || '';
            document.getElementById('editCapacity').value = m.capacity || '';
            document.getElementById('editPartMatch').value = m.part_match || '';
            document.getElementById('editVersion').value = m.version || '';
            document.getElementById('editFlashTool').value = m.flash_tool || '';
            document.getElementById('editFlashCommand').value = m.flash_command || '';
            document.getElementById('editFlashable').value = m.flashable ? 'true' : 'false';
            document.getElementById('editReboot').value = m.requires_reboot ? 'true' : 'false';
            document.getElementById('editFirmwareFile').value = m.firmware_file || '';
            document.getElementById('editNotes').value = m.release_notes || '';

            // Populate upgrade_from chips
            clearEditChips();
            if (m.upgrade_from) {
                m.upgrade_from.split(',').forEach(v => { if (v.trim()) addEditChip(v.trim()); });
            }

            editModal.classList.add('open');
        }

        function closeEditModal() {
            editModal.classList.remove('open');
        }

        // Close modal on overlay click
        editModal.addEventListener('click', function(e) {
            if (e.target === this) closeEditModal();
        });

        async function saveModelEdit() {
            const model = document.getElementById('editModelKey').value;
            const payload = {
                model: model,
                vendor: document.getElementById('editVendor').value.trim(),
                family: document.getElementById('editFamily').value.trim(),
                interface: document.getElementById('editInterface').value.trim(),
                capacity: document.getElementById('editCapacity').value.trim(),
                part_match: document.getElementById('editPartMatch').value.trim(),
                latest_firmware: document.getElementById('editVersion').value.trim(),
                flash_tool: document.getElementById('editFlashTool').value.trim(),
                flash_command: document.getElementById('editFlashCommand').value.trim(),
                flashable: document.getElementById('editFlashable').value === 'true',
                requires_reboot: document.getElementById('editReboot').value === 'true',
                release_notes: document.getElementById('editNotes').value.trim(),
                upgrade_from: getEditChips(),
            };

            try {
                const resp = await fetch('/api/model/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await resp.json();
                if (resp.ok) {
                    showToast(`Updated ${model}`, 'success');
                    closeEditModal();
                    loadAll();
                } else {
                    showToast(data.error || 'Update failed', 'error');
                }
            } catch (err) {
                showToast('Error: ' + err.message, 'error');
            }
        }

        loadAll();
    </script>
</body>
</html>
"""


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="45Drives Firmware Admin")
    parser.add_argument("--port", "-p", type=int, default=8089)
    parser.add_argument("--host", default="0.0.0.0")
    args = parser.parse_args()

    os.makedirs(FIRMWARE_DIR, exist_ok=True)

    print(f"🔧 45Drives Firmware Admin")
    print(f"   Manifest: {MANIFEST_SRC}")
    print(f"   Repo Dir: {FIRMWARE_DIR}")
    print(f"   URL:      http://{args.host}:{args.port}")
    print(f"   GPG Key:  {GPG_KEY_ID}")
    print()

    app.run(host=args.host, port=args.port, debug=False, threaded=True)
