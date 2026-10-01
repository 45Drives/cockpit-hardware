#!/usr/bin/env python3
import argparse, base64, hashlib, os, shutil, sys
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote
from lxml import etree

DESIGN_DIR = Path(__file__).resolve().parent
TARGETS = {
    "mobo": DESIGN_DIR / "motherboard" / "motherboard_assets.svg",
    "disk": DESIGN_DIR / "disks" / "disks_assets.svg",
}
SVG_IMAGE = "{http://www.w3.org/2000/svg}image"
HREF_ATTRS = ("{http://www.w3.org/1999/xlink}href", "href")
PARSER = etree.XMLParser(huge_tree=True)


def extract(svg_path):
    images_dir = svg_path.parent / "images"
    images_dir.mkdir(exist_ok=True)
    tree = etree.parse(str(svg_path), PARSER)
    count = 0
    for img in tree.iter(SVG_IMAGE):
        for attr in HREF_ATTRS:
            href = img.get(attr)
            if not href or not href.startswith("data:image/"):
                continue
            mime, data = href[5:].split(";base64,", 1)
            raw = base64.b64decode("".join(data.split()))
            ext = mime.split("/")[1].split("+")[0].replace("jpeg", "jpg")
            # content hash = identical images collapse to one file
            name = f"{hashlib.sha1(raw).hexdigest()[:12]}.{ext}"
            (images_dir / name).write_bytes(raw)
            img.set(attr, f"images/{name}")
            count += 1

    if count == 0:
        print(f"{svg_path.name}: no embedded images, file unchanged")
        return

    backup_dir = svg_path.parent / "backups"
    backup_dir.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = backup_dir / f"{svg_path.stem}-{stamp}{svg_path.suffix}"
    shutil.copy2(svg_path, backup)

    tmp = svg_path.with_suffix(".svg.tmp")
    tree.write(str(tmp), xml_declaration=True, encoding="UTF-8")
    os.replace(tmp, svg_path)
    print(f"{svg_path.name}: extracted {count} image(s), backup: {backup.relative_to(DESIGN_DIR)}")


def clean(svg_path):
    asset_dir = svg_path.parent
    images_dir = asset_dir / "images"
    if not images_dir.is_dir():
        return

    used = set()
    for svg in asset_dir.rglob("*.svg"):
        if "backups" in svg.relative_to(asset_dir).parts:
            continue
        for img in etree.parse(str(svg), PARSER).iter(SVG_IMAGE):
            for attr in HREF_ATTRS:
                href = img.get(attr)
                if href and not href.startswith("data:"):
                    used.add((svg.parent / unquote(href.removeprefix("file://"))).resolve())

    removed = [f for f in images_dir.iterdir() if f.is_file() and f.resolve() not in used]
    for f in removed:
        f.unlink()
        print(f"removed {f.relative_to(DESIGN_DIR)}")
    print(f"clean: removed {len(removed)} unused image(s)")


def main():
    p = argparse.ArgumentParser(
        description=(
            "Extract embedded images from design SVGs into <folder>/images/ and replace them with links.\n"
            "The original SVG is backed up to <folder>/backups/ before being overwritten."
        ),
        epilog=(
            "examples:\n"
            "  ./svg_assets.py --mobo            extract images from the motherboard file\n"
            "  ./svg_assets.py --disk            extract images from the disks file\n"
            "  ./svg_assets.py --mobo --clean    extract, then delete unused images\n"
            "  ./svg_assets.py --help            show this help"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    target = p.add_argument_group("target (pick one)")
    g = target.add_mutually_exclusive_group(required=True)
    g.add_argument("--mobo", action="store_true", help="use motherboard/motherboard_assets.svg")
    g.add_argument("--disk", action="store_true", help="use disks/disks_assets.svg")
    p.add_argument("--clean", action="store_true", help="after extracting, delete files in images/ that no SVG references")

    if len(sys.argv) == 1:
        p.print_help()
        sys.exit(0)
    args = p.parse_args()

    svg_path = TARGETS["mobo" if args.mobo else "disk"]
    if not svg_path.is_file():
        sys.exit(f"not found: {svg_path}")

    extract(svg_path)
    if args.clean:
        clean(svg_path)


if __name__ == "__main__":
    main()
