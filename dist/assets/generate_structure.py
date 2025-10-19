#!/usr/bin/env python3

"""Serialize a directory tree into JSON for AI-assisted asset mapping."""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".tiff"}


def guess_image_size(path: Path) -> Optional[Dict[str, int]]:
    if path.suffix.lower() not in IMAGE_EXTENSIONS:
        return None
    try:
        from PIL import Image

        with Image.open(path) as img:
            width, height = img.size
            mode = img.mode
        return {"width": width, "height": height, "mode": mode}
    except ImportError:
        return None
    except Exception:
        return None


def build_node(
    path: Path,
    root: Path,
    include_image_size: bool,
    include_ds_store: bool,
) -> Optional[Dict[str, Any]]:
    if path.name == ".DS_Store" and not include_ds_store:
        return None
    rel = path.relative_to(root)
    node: Dict[str, Any] = {
        "name": path.name,
        "path": "." if rel == Path(".") else str(rel).replace(os.sep, "/"),
    }
    stat = path.stat()
    if path.is_dir():
        children: List[Dict[str, Any]] = []
        for child in sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name.lower())):
            child_node = build_node(child, root, include_image_size, include_ds_store)
            if child_node is not None:
                children.append(child_node)
        node.update(
            {
                "type": "directory",
                "children": children,
                "item_count": len(children),
            }
        )
    else:
        file_info: Dict[str, Any] = {
            "type": "file",
            "extension": path.suffix.lower(),
            "size_bytes": stat.st_size,
        }
        if path.suffix.lower() == ".json":
            sibling_png = next(
                (
                    sibling
                    for sibling in path.parent.iterdir()
                    if sibling.is_file()
                    and sibling.stem == path.stem
                    and sibling.suffix.lower() == ".png"
                ),
                None,
            )
            if sibling_png is not None:
                file_info["description"] = "Contiene il perimetro dell'immagine PNG corrispondente."
        if include_image_size:
            meta = guess_image_size(path)
            if meta:
                file_info["image"] = meta
        node.update(file_info)
    return node


def walk_roots(
    roots: List[Path],
    include_image_size: bool,
    include_ds_store: bool,
) -> List[Dict[str, Any]]:
    result: List[Dict[str, Any]] = []
    for root in roots:
        tree = build_node(root, root, include_image_size, include_ds_store)
        if tree is None:
            continue
        manifest = {
            "root": str(root.resolve()),
            "tree": tree,
        }
        result.append(manifest)
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Genera un JSON ricorsivo con la struttura dei file."
    )
    parser.add_argument(
        "paths",
        nargs="+",
        help="Cartelle o file da includere nella descrizione.",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("file_structure.json"),
        help="Percorso del file JSON finale (default: file_structure.json).",
    )
    parser.add_argument(
        "--image-size",
        action="store_true",
        help="Includi dimensioni (larghezza, altezza, mode) per le immagini supportate.",
    )
    parser.add_argument(
        "--include-ds-store",
        action="store_true",
        help="Includi i file .DS_Store nell'output (default: ignorati).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    roots: List[Path] = []
    for raw in args.paths:
        path = Path(raw).expanduser()
        if not path.exists():
            raise FileNotFoundError(f"Percorso non trovato: {path}")
        roots.append(path.resolve())
    manifests = walk_roots(roots, args.image_size, args.include_ds_store)

    payload = {
        "generated_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "entries": manifests,
    }

    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")
    print(f"Manifest salvato in {args.output.resolve()}")


if __name__ == "__main__":
    main()
