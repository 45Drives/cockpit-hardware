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

    result = subprocess.run(
        ["gpg", "--detach-sign", "--armor", "-u", GPG_KEY_ID, "-o", sig_path, MANIFEST_SRC],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
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
                "flashable": entry.get("flashable", False),
            })
    return models


# ─── API Routes ────────────────────────────────────────────────────────────────

@app.route("/api/models")
def api_models():
    return jsonify(get_all_models())


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
    """Upload firmware file and optionally assign to a model."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400

    model = request.form.get("model", "")
    version = request.form.get("version", "")
    notes = request.form.get("notes", "")

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
        "assigned": False,
    }

    # Assign to model if specified
    if model:
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

        if found:
            save_manifest(manifest)
            result["assigned"] = True
            result["model"] = model
            result["version"] = version
        else:
            result["warning"] = f"Model '{model}' not found in manifest"

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
        
        .signed-status { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
        .signed-status .dot { width: 10px; height: 10px; border-radius: 50%; }
        
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
                        <div class="form-row">
                            <label>Assign to Model (optional)</label>
                            <div class="searchable-select" id="modelSelectWrapper">
                                <input type="text" id="modelSearchInput" placeholder="Search models..." autocomplete="off" onclick="toggleModelDropdown(true)">
                                <input type="hidden" id="uploadModel" value="">
                                <div class="searchable-dropdown" id="modelDropdown"></div>
                            </div>
                        </div>
                        <div class="form-row">
                            <label>Firmware Version</label>
                            <input type="text" id="uploadVersion" placeholder="e.g., 24.22.00.00">
                        </div>
                        <div class="form-row">
                            <label>Release Notes</label>
                            <textarea id="uploadNotes" placeholder="Optional notes..."></textarea>
                        </div>
                        <button class="btn btn-primary" onclick="doUpload()">⬆️ Upload & Assign</button>
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
        }
        
        async function doUpload() {
            if (!pendingFile) return;
            
            const form = new FormData();
            form.append('file', pendingFile);
            form.append('model', document.getElementById('uploadModel').value);
            form.append('version', document.getElementById('uploadVersion').value);
            form.append('notes', document.getElementById('uploadNotes').value);
            
            try {
                const resp = await fetch('/api/upload', { method: 'POST', body: form });
                const data = await resp.json();
                
                const resultEl = document.getElementById('uploadResult');
                resultEl.style.display = 'block';
                
                if (data.assigned) {
                    resultEl.innerHTML = `✅ <strong>${data.filename}</strong> uploaded and assigned to <strong>${data.model}</strong><br>SHA256: ${data.sha256}<br><br>🔄 Signing & publishing...`;
                    showToast('Uploaded and assigned!', 'success');
                } else if (data.warning) {
                    resultEl.innerHTML = `⚠️ Uploaded <strong>${data.filename}</strong> but: ${data.warning}<br>SHA256: ${data.sha256}<br><br>🔄 Signing & publishing...`;
                    showToast('Uploaded (not assigned)', 'success');
                } else {
                    resultEl.innerHTML = `✅ <strong>${data.filename}</strong> uploaded (not assigned to any model)<br>SHA256: ${data.sha256}<br><br>🔄 Signing & publishing...`;
                    showToast('File uploaded', 'success');
                }
                
                document.getElementById('uploadForm').style.display = 'none';
                pendingFile = null;
                fileInput.value = '';
                
                // Auto sign & publish
                try {
                    const signResp = await fetch('/api/sign', { method: 'POST' });
                    const signData = await signResp.json();
                    if (signResp.ok) {
                        resultEl.innerHTML = resultEl.innerHTML.replace('🔄 Signing & publishing...', '✅ Signed & published!');
                        showToast('✓ Signed & published!', 'success');
                    } else {
                        resultEl.innerHTML = resultEl.innerHTML.replace('🔄 Signing & publishing...', '❌ Sign failed: ' + signData.error);
                        showToast('Sign failed: ' + signData.error, 'error');
                    }
                } catch (signErr) {
                    resultEl.innerHTML = resultEl.innerHTML.replace('🔄 Signing & publishing...', '❌ Sign error: ' + signErr.message);
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
            buildSidebar();
            // Wire up vendor dropdown onchange
            document.getElementById('newModelVendor').onchange = onVendorChange;
        }
        
        async function loadModels() {
            const resp = await fetch('/api/models');
            models = await resp.json();
            
            // Populate searchable model dropdown
            populateModelDropdown(models);
            
            // Model grid
            const grid = document.getElementById('modelGrid');
            grid.innerHTML = models.map(m => {
                let badge = '';
                if (m.firmware_file && m.sha256) badge = '<span class="badge badge-ok">✓ Ready</span>';
                else if (m.firmware_file && !m.sha256) badge = '<span class="badge badge-no-hash">⚠ No Hash</span>';
                else badge = '<span class="badge badge-missing">No File</span>';
                
                const subtitle = m.capacity ? `${m.category} • ${m.capacity}` : m.category;
                
                return `<div class="model-card">
                    <div class="model-name">${m.display_name}</div>
                    <div class="model-meta">${m.category} • ${m.model}</div>
                    <div class="model-version">v${m.version || '?'}</div>
                    <div class="model-file" title="${m.firmware_file || 'No file assigned'}">${m.firmware_file || '—'}</div>
                    ${badge}
                </div>`;
            }).join('');
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
                    cat.toLowerCase().includes(query)
                );
                if (filtered.length === 0) continue;
                html += `<div class="nav-section">${cat} (${filtered.length})</div>`;
                filtered.forEach(m => {
                    let statusClass = 'status-missing';
                    if (m.firmware_file && m.sha256) statusClass = 'status-ok';
                    else if (m.firmware_file) statusClass = 'status-no-hash';
                    html += `<div class="nav-item"><span>${m.display_name}</span><div class="status ${statusClass}"></div></div>`;
                });
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
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(query) ? '' : 'none';
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
        
        // ─── Searchable Model Dropdown ─────────────────────────────────
        let modelOptions = [];
        
        function populateModelDropdown(modelList) {
            modelOptions = [{value: '', label: '— Don\\'t assign —'}];
            modelList.forEach(m => {
                const label = `[${m.category}] ${m.display_name} — ${m.model}`;
                modelOptions.push({value: m.model, label: label});
            });
            renderModelDropdown('');
            document.getElementById('modelSearchInput').value = '';
            document.getElementById('uploadModel').value = '';
        }
        
        function renderModelDropdown(filter) {
            const dd = document.getElementById('modelDropdown');
            const filtered = modelOptions.filter(o => 
                o.label.toLowerCase().includes(filter.toLowerCase())
            );
            dd.innerHTML = filtered.map(o => 
                `<div class="dd-item" data-value="${o.value}" onclick="selectModel(this)">${o.label}</div>`
            ).join('');
        }
        
        function toggleModelDropdown(show) {
            const dd = document.getElementById('modelDropdown');
            if (show) {
                renderModelDropdown(document.getElementById('modelSearchInput').value);
                dd.classList.add('open');
            } else {
                setTimeout(() => dd.classList.remove('open'), 150);
            }
        }
        
        function selectModel(el) {
            const value = el.dataset.value;
            const label = el.textContent;
            document.getElementById('uploadModel').value = value;
            document.getElementById('modelSearchInput').value = value ? label : '';
            document.getElementById('modelDropdown').classList.remove('open');
        }
        
        document.addEventListener('click', function(e) {
            if (!document.getElementById('modelSelectWrapper').contains(e.target)) {
                document.getElementById('modelDropdown').classList.remove('open');
            }
        });
        
        // Wire up search input filtering
        document.getElementById('modelSearchInput').addEventListener('input', function() {
            renderModelDropdown(this.value);
            document.getElementById('modelDropdown').classList.add('open');
            // Clear selection if user is typing
            document.getElementById('uploadModel').value = '';
        });
        
        document.getElementById('modelSearchInput').addEventListener('focus', function() {
            toggleModelDropdown(true);
        });
        
        function showToast(msg, type) {
            const t = document.getElementById('toast');
            t.textContent = msg;
            t.className = `toast show ${type}`;
            setTimeout(() => t.classList.remove('show'), 3000);
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

    app.run(host=args.host, port=args.port, debug=False)
