"""Render a labeled contact sheet for Royal Inquest PNG assets."""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


BACKGROUND = (245, 238, 220, 255)
INK = (45, 31, 21, 255)
PADDING = 16
GAP = 12


def build_contact_sheet(root: Path, out: Path, tile_size: int = 96, repeat_tiles: bool = False) -> None:
    """Render every PNG below *root*, with an optional 3x3 tile preview."""

    if tile_size <= 0:
        raise ValueError("tile_size must be positive")
    files = sorted(path for path in root.rglob("*.png") if path.is_file())
    if not files:
        raise ValueError(f"No PNG files found below {root}.")

    font = ImageFont.load_default()
    preview_size = tile_size * (3 if repeat_tiles else 1)
    labels = [path.relative_to(root).as_posix() for path in files]
    label_height = max(_text_height(label, font) for label in labels)
    cell_width = max(preview_size, max(_text_width(label, font) for label in labels))
    cell_height = preview_size + 6 + label_height
    columns = min(4, len(files))
    rows = math.ceil(len(files) / columns)
    canvas = Image.new(
        "RGBA",
        (PADDING * 2 + columns * cell_width + (columns - 1) * GAP, PADDING * 2 + rows * cell_height + (rows - 1) * GAP),
        BACKGROUND,
    )
    draw = ImageDraw.Draw(canvas)

    for index, (path, label) in enumerate(zip(files, labels)):
        column, row = index % columns, index // columns
        x = PADDING + column * (cell_width + GAP)
        y = PADDING + row * (cell_height + GAP)
        preview = _preview(path, tile_size, repeat_tiles)
        canvas.alpha_composite(preview, (x, y))
        draw.text((x, y + preview_size + 6), label, fill=INK, font=font)

    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out, format="PNG")


def _preview(path: Path, tile_size: int, repeat_tiles: bool) -> Image.Image:
    with Image.open(path) as opened:
        thumbnail = opened.convert("RGBA").resize((tile_size, tile_size), Image.Resampling.LANCZOS)
    if not repeat_tiles:
        return thumbnail
    preview = Image.new("RGBA", (tile_size * 3, tile_size * 3))
    for y in range(3):
        for x in range(3):
            preview.alpha_composite(thumbnail, (x * tile_size, y * tile_size))
    return preview


def _text_width(text: str, font: ImageFont.ImageFont) -> int:
    return font.getbbox(text)[2]


def _text_height(text: str, font: ImageFont.ImageFont) -> int:
    box = font.getbbox(text)
    return box[3] - box[1]


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True, help="Directory containing PNG assets.")
    parser.add_argument("--out", type=Path, required=True, help="Destination PNG path.")
    parser.add_argument("--tile-size", type=int, default=96, help="Thumbnail size in pixels.")
    parser.add_argument("--repeat-tiles", action="store_true", help="Show each tile in a 3x3 repeat block.")
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    build_contact_sheet(args.root, args.out, args.tile_size, args.repeat_tiles)
