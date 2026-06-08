#!/usr/bin/env python3
"""
firmware-repo-server - Simple HTTP server with upload UI for firmware files.

Serves firmware files and provides a web interface for uploading new files.
Run this on the dev/build machine to act as the firmware repository.

Usage:
    python3 firmware-repo-server.py [--port 8089] [--dir ./firmware-repo]
"""

import os
import sys
import json
import hashlib
import argparse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote
import cgi
from datetime import datetime


class FirmwareRepoHandler(SimpleHTTPRequestHandler):
    """HTTP handler that serves files and handles uploads."""

    def do_GET(self):
        if self.path == "/" or self.path == "/upload":
            self.send_upload_page()
        elif self.path == "/api/files":
            self.send_file_list()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/upload":
            self.handle_upload()
        elif self.path == "/api/delete":
            self.handle_delete()
        else:
            self.send_error(404)

    def handle_upload(self):
        """Handle file upload via multipart form data."""
        content_type = self.headers.get("Content-Type", "")

        if "multipart/form-data" in content_type:
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    "REQUEST_METHOD": "POST",
                    "CONTENT_TYPE": content_type,
                }
            )

            uploaded = []
            file_items = form["files"] if "files" in form else []
            if not isinstance(file_items, list):
                file_items = [file_items]

            for item in file_items:
                if item.filename:
                    filename = os.path.basename(item.filename)
                    dest_path = os.path.join(self.server.serve_dir, filename)
                    data = item.file.read()

                    with open(dest_path, "wb") as f:
                        f.write(data)

                    sha256 = hashlib.sha256(data).hexdigest()
                    size = len(data)
                    uploaded.append({
                        "filename": filename,
                        "size": size,
                        "sha256": sha256
                    })
                    print(f"  Uploaded: {filename} ({size} bytes) SHA256: {sha256[:16]}...")

            self.send_json(200, {"status": "ok", "files": uploaded})
        else:
            self.send_json(400, {"error": "Expected multipart/form-data"})

    def handle_delete(self):
        """Handle file deletion."""
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8")
        data = json.loads(body)
        filename = os.path.basename(data.get("filename", ""))

        if not filename:
            self.send_json(400, {"error": "No filename provided"})
            return

        filepath = os.path.join(self.server.serve_dir, filename)
        if os.path.isfile(filepath):
            os.unlink(filepath)
            print(f"  Deleted: {filename}")
            self.send_json(200, {"status": "ok", "deleted": filename})
        else:
            self.send_json(404, {"error": f"File not found: {filename}"})

    def send_file_list(self):
        """Return JSON list of all firmware files in the repo."""
        files = []
        for f in sorted(os.listdir(self.server.serve_dir)):
            filepath = os.path.join(self.server.serve_dir, f)
            if os.path.isfile(filepath) and not f.startswith("."):
                stat = os.stat(filepath)
                files.append({
                    "name": f,
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                })
        self.send_json(200, files)

    def send_json(self, code, data):
        """Send a JSON response."""
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_upload_page(self):
        """Serve the upload UI page."""
        html = UPLOAD_HTML
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


UPLOAD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>45Drives Firmware Repository</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #eee;
            min-height: 100vh;
            padding: 2rem;
        }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { 
            color: #00d4aa; 
            margin-bottom: 0.5rem;
            font-size: 1.8rem;
        }
        .subtitle { color: #888; margin-bottom: 2rem; }
        
        .drop-zone {
            border: 2px dashed #444;
            border-radius: 12px;
            padding: 3rem 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 2rem;
            background: #16213e;
        }
        .drop-zone:hover, .drop-zone.dragover {
            border-color: #00d4aa;
            background: #1a2a4a;
        }
        .drop-zone h3 { color: #00d4aa; margin-bottom: 0.5rem; }
        .drop-zone p { color: #888; font-size: 0.9rem; }
        
        .file-input { display: none; }
        
        .upload-progress {
            margin-bottom: 2rem;
            display: none;
        }
        .progress-bar {
            height: 4px;
            background: #333;
            border-radius: 2px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: #00d4aa;
            width: 0%;
            transition: width 0.3s;
        }
        .progress-text {
            color: #888;
            font-size: 0.85rem;
            margin-top: 0.5rem;
        }
        
        .file-table {
            width: 100%;
            border-collapse: collapse;
            background: #16213e;
            border-radius: 8px;
            overflow: hidden;
        }
        .file-table th {
            background: #0f3460;
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.85rem;
            text-transform: uppercase;
            color: #888;
        }
        .file-table td {
            padding: 0.6rem 1rem;
            border-bottom: 1px solid #222;
            font-size: 0.9rem;
        }
        .file-table tr:last-child td { border-bottom: none; }
        .file-table tr:hover td { background: #1a2a4a; }
        
        .file-name { color: #00d4aa; font-family: monospace; }
        .file-size { color: #888; }
        .file-date { color: #666; font-size: 0.8rem; }
        
        .btn {
            padding: 0.4rem 0.8rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.2s;
        }
        .btn-delete { background: #e74c3c; color: white; }
        .btn-delete:hover { background: #c0392b; }
        .btn-copy { background: #333; color: #eee; }
        .btn-copy:hover { background: #444; }
        
        .stats {
            display: flex;
            gap: 2rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }
        .stat-card {
            background: #16213e;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            flex: 1;
            min-width: 150px;
        }
        .stat-value { font-size: 1.5rem; color: #00d4aa; font-weight: bold; }
        .stat-label { color: #888; font-size: 0.8rem; text-transform: uppercase; }
        
        .toast {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-size: 0.9rem;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 1000;
        }
        .toast.show { opacity: 1; }
        .toast.success { background: #27ae60; }
        .toast.error { background: #e74c3c; }
        
        .empty-state { text-align: center; padding: 3rem; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 45Drives Firmware Repository</h1>
        <p class="subtitle">Upload and manage firmware files • Served at <code id="serverUrl"></code></p>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value" id="fileCount">-</div>
                <div class="stat-label">Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="totalSize">-</div>
                <div class="stat-label">Total Size</div>
            </div>
        </div>
        
        <div class="drop-zone" id="dropZone">
            <h3>📁 Drop firmware files here</h3>
            <p>or click to browse • .rom, .bin, .pkg, .LOD files</p>
            <input type="file" class="file-input" id="fileInput" multiple 
                   accept=".rom,.bin,.pkg,.LOD,.fw,.img">
        </div>
        
        <div class="upload-progress" id="uploadProgress">
            <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
            <div class="progress-text" id="progressText">Uploading...</div>
        </div>
        
        <table class="file-table" id="fileTable">
            <thead>
                <tr>
                    <th>Filename</th>
                    <th>Size</th>
                    <th>Modified</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="fileList"></tbody>
        </table>
        <div class="empty-state" id="emptyState" style="display:none">No files uploaded yet</div>
    </div>
    
    <div class="toast" id="toast"></div>

    <script>
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');
        const uploadProgress = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        document.getElementById('serverUrl').textContent = window.location.origin;
        
        // Drag and drop
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            uploadFiles(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', () => uploadFiles(fileInput.files));
        
        async function uploadFiles(files) {
            if (!files.length) return;
            
            uploadProgress.style.display = 'block';
            progressFill.style.width = '0%';
            progressText.textContent = `Uploading ${files.length} file(s)...`;
            
            const formData = new FormData();
            for (const file of files) {
                formData.append('files', file);
            }
            
            try {
                const resp = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await resp.json();
                
                if (resp.ok) {
                    progressFill.style.width = '100%';
                    const names = data.files.map(f => f.filename).join(', ');
                    progressText.textContent = `✓ Uploaded: ${names}`;
                    showToast(`Uploaded ${data.files.length} file(s)`, 'success');
                    
                    // Show SHA256
                    for (const f of data.files) {
                        console.log(`${f.filename}: SHA256=${f.sha256}`);
                    }
                    
                    loadFiles();
                } else {
                    throw new Error(data.error || 'Upload failed');
                }
            } catch (err) {
                progressText.textContent = `✗ Error: ${err.message}`;
                showToast(err.message, 'error');
            }
            
            setTimeout(() => { uploadProgress.style.display = 'none'; }, 3000);
            fileInput.value = '';
        }
        
        async function deleteFile(filename) {
            if (!confirm(`Delete ${filename}?`)) return;
            
            try {
                const resp = await fetch('/api/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename })
                });
                if (resp.ok) {
                    showToast(`Deleted ${filename}`, 'success');
                    loadFiles();
                }
            } catch (err) {
                showToast(err.message, 'error');
            }
        }
        
        function copyUrl(filename) {
            const url = `${window.location.origin}/${filename}`;
            navigator.clipboard.writeText(url);
            showToast(`Copied: ${url}`, 'success');
        }
        
        function formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
            return (bytes/(1024*1024)).toFixed(1) + ' MB';
        }
        
        function formatDate(iso) {
            return new Date(iso).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });
        }
        
        async function loadFiles() {
            try {
                const resp = await fetch('/api/files');
                const files = await resp.json();
                
                document.getElementById('fileCount').textContent = files.length;
                const total = files.reduce((sum, f) => sum + f.size, 0);
                document.getElementById('totalSize').textContent = formatSize(total);
                
                if (files.length === 0) {
                    document.getElementById('fileTable').style.display = 'none';
                    document.getElementById('emptyState').style.display = 'block';
                    return;
                }
                
                document.getElementById('fileTable').style.display = 'table';
                document.getElementById('emptyState').style.display = 'none';
                
                fileList.innerHTML = files.map(f => `
                    <tr>
                        <td class="file-name">${f.name}</td>
                        <td class="file-size">${formatSize(f.size)}</td>
                        <td class="file-date">${formatDate(f.modified)}</td>
                        <td>
                            <button class="btn btn-copy" onclick="copyUrl('${f.name}')">📋 URL</button>
                            <button class="btn btn-delete" onclick="deleteFile('${f.name}')">🗑</button>
                        </td>
                    </tr>
                `).join('');
            } catch (err) {
                console.error('Failed to load files:', err);
            }
        }
        
        function showToast(msg, type) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.className = `toast show ${type}`;
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
        
        loadFiles();
    </script>
</body>
</html>
"""


def main():
    parser = argparse.ArgumentParser(description="45Drives Firmware Repository Server")
    parser.add_argument("--port", "-p", type=int, default=8089, help="Port to serve on")
    parser.add_argument("--dir", "-d", default=None, help="Directory to serve firmware from")
    parser.add_argument("--bind", "-b", default="0.0.0.0", help="Address to bind to")
    args = parser.parse_args()

    serve_dir = args.dir or os.path.join(os.path.dirname(os.path.abspath(__file__)), "firmware-repo")
    if not os.path.isdir(serve_dir):
        os.makedirs(serve_dir, exist_ok=True)

    os.chdir(serve_dir)

    server = HTTPServer((args.bind, args.port), FirmwareRepoHandler)
    server.serve_dir = serve_dir

    print(f"🔧 45Drives Firmware Repository Server")
    print(f"   Serving: {serve_dir}")
    print(f"   URL:     http://{args.bind}:{args.port}")
    print(f"   Upload:  http://{args.bind}:{args.port}/upload")
    print(f"\n   Press Ctrl+C to stop.\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.shutdown()


if __name__ == "__main__":
    main()
