#!/usr/bin/env python3

"""Generate JSON hitbox polygons from PNG transparency.

Given one or more PNG files, this script inspects the alpha channel to build
polygonal perimeters for all opaque regions and stores them in a sibling JSON
file. The JSON payload can be consumed by web clients to implement precise
hit-testing without reading the image pixels at runtime.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, List, Sequence, Tuple

import numpy as np
from PIL import Image

# Type aliases for readability
Point = Tuple[int, int]
Edge = Tuple[Point, Point]


@dataclass
class Polygon:
    points: List[Point]

    @property
    def closed_points(self) -> List[Point]:
        if not self.points:
            return []
        if self.points[0] == self.points[-1]:
            return list(self.points)
        return self.points + [self.points[0]]

    @property
    def signed_area(self) -> float:
        pts = self.closed_points
        if len(pts) < 4:  # need at least 3 distinct vertices + closing point
            return 0.0
        area = 0.0
        for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
            area += x1 * y2 - x2 * y1
        return area / 2.0

    @property
    def kind(self) -> str:
        # In image coordinates (y grows downward) a counter-clockwise walk
        # around a solid region still yields a negative signed area.
        return "outer" if self.signed_area < 0 else "hole"


def load_mask(image_path: Path, alpha_threshold: int) -> np.ndarray:
    image = Image.open(image_path).convert("RGBA")
    alpha = np.array(image, dtype=np.uint8)[..., 3]
    return alpha > alpha_threshold


def iter_edges(mask: np.ndarray) -> Iterator[Edge]:
    height, width = mask.shape
    for y in range(height):
        for x in range(width):
            if not mask[y, x]:
                continue
            if y == 0 or not mask[y - 1, x]:
                yield ((x + 1, y), (x, y))
            if y == height - 1 or not mask[y + 1, x]:
                yield ((x, y + 1), (x + 1, y + 1))
            if x == 0 or not mask[y, x - 1]:
                yield ((x, y), (x, y + 1))
            if x == width - 1 or not mask[y, x + 1]:
                yield ((x + 1, y + 1), (x + 1, y))


def edges_to_polygons(edges: Iterable[Edge]) -> List[Polygon]:
    # Deduplicate edges to avoid traversing redundant paths.
    edge_set = set(edges)
    if not edge_set:
        return []

    forward: dict[Point, List[Point]] = defaultdict(list)
    for start, end in edge_set:
        forward[start].append(end)

    visited: set[Edge] = set()
    polygons: List[Polygon] = []

    for start, destinations in forward.items():
        for dest in destinations:
            edge = (start, dest)
            if edge in visited:
                continue

            polygon: List[Point] = [start]
            current_start, current_end = start, dest

            while True:
                visited.add((current_start, current_end))
                polygon.append(current_end)

                next_candidates = forward.get(current_end)
                if not next_candidates:
                    raise RuntimeError("Contour traversal reached a dead end.")

                if len(next_candidates) == 1:
                    next_end = next_candidates[0]
                else:
                    # Prefer edges that do not immediately backtrack.
                    next_end = None
                    for candidate in next_candidates:
                        if candidate != current_start:
                            next_end = candidate
                            break
                    if next_end is None:
                        next_end = current_start

                current_start, current_end = current_end, next_end

                if current_start == start and current_end == dest:
                    break

            if polygon[0] == polygon[-1]:
                polygon.pop()

            polygons.append(Polygon(points=polygon))

    return polygons


def find_png_files(paths: Sequence[str]) -> List[Path]:
    files: List[Path] = []
    for item in paths:
        path = Path(item)
        if path.is_dir():
            candidates = (
                p for p in path.rglob("*") if p.is_file() and p.suffix.lower() == ".png"
            )
            files.extend(sorted(candidates))
        elif path.is_file() and path.suffix.lower() == ".png":
            files.append(path)
        else:
            raise FileNotFoundError(f"Nessun file PNG trovato in '{path}'.")
    if not files:
        raise FileNotFoundError("Nessun file PNG da processare.")
    return sorted(files)


def polygon_to_json(polygon: Polygon) -> dict:
    return {
        "type": polygon.kind,
        "points": [[int(x), int(y)] for x, y in polygon.points],
    }


def process_image(image_path: Path, alpha_threshold: int) -> dict:
    mask = load_mask(image_path, alpha_threshold)
    polygons = edges_to_polygons(iter_edges(mask))
    return {
        "image": image_path.name,
        "width": int(mask.shape[1]),
        "height": int(mask.shape[0]),
        "alpha_threshold": alpha_threshold,
        "polygons": [polygon_to_json(p) for p in polygons],
    }


def write_output(image_path: Path, payload: dict) -> Path:
    output_path = image_path.with_suffix(".json")
    with output_path.open("w", encoding="utf-8") as fp:
        json.dump(payload, fp, ensure_ascii=True, indent=2)
    return output_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Genera file JSON contenenti il perimetro dei pixel opachi di immagini PNG.",
    )
    parser.add_argument(
        "paths",
        nargs="+",
        help="Uno o più file PNG o cartelle contenenti PNG.",
    )
    parser.add_argument(
        "--alpha-threshold",
        type=int,
        default=0,
        help="Valore minimo del canale alpha (0-255) per considerare un pixel solido.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    files = find_png_files(args.paths)

    for image_path in files:
        payload = process_image(image_path, args.alpha_threshold)
        output_path = write_output(image_path, payload)
        print(f"Creato {output_path}")


if __name__ == "__main__":
    main()
