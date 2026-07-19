"""Split a normalized prop into two transparent horizontal grid-cell segments."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


BREATHING_ROOM = 0.08
LOW_ALPHA_CUTOFF = 12


def reframe_prop(source: Path, cell_size: int = 512) -> Image.Image:
    """Return *source* reframed on a transparent two-cell canvas.

    The foreground bounds, rather than the source canvas, are scaled uniformly
    into the available 2:1 area.  This preserves the prop's proportions while
    giving it the same breathing room as a one-cell normalized cutout.
    """

    if cell_size <= 0:
        raise ValueError("cell_size must be positive")
    with Image.open(source) as opened:
        image = opened.convert("RGBA")
    if image.size != (cell_size, cell_size):
        raise ValueError(f"Expected a {cell_size}x{cell_size} normalized prop, got {image.size}.")

    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError(f"No foreground found in {source}.")

    subject = image.crop(bounds)
    available_width = max(1, round(cell_size * 2 * (1 - (2 * BREATHING_ROOM))))
    available_height = max(1, round(cell_size * (1 - (2 * BREATHING_ROOM))))
    scale = min(available_width / subject.width, available_height / subject.height)
    resized_size = (
        max(1, round(subject.width * scale)),
        max(1, round(subject.height * scale)),
    )
    subject = subject.resize(resized_size, Image.Resampling.LANCZOS)
    subject = _discard_low_alpha_pixels(subject)

    canvas = Image.new("RGBA", (cell_size * 2, cell_size), (0, 0, 0, 0))
    offset = (
        (canvas.width - resized_size[0]) // 2,
        (canvas.height - resized_size[1]) // 2,
    )
    canvas.alpha_composite(subject, offset)
    return canvas


def _discard_low_alpha_pixels(image: Image.Image) -> Image.Image:
    """Remove imperceptible resize residue before the two-cell seam is cut."""

    pixels = [
        (0, 0, 0, 0) if alpha <= LOW_ALPHA_CUTOFF else (red, green, blue, alpha)
        for red, green, blue, alpha in image.get_flattened_data()
    ]
    result = Image.new("RGBA", image.size)
    result.putdata(pixels)
    return result


def split_prop(source: Path, left_destination: Path, right_destination: Path, cell_size: int = 512) -> None:
    """Write transparent left/right segments whose recomposition is exact."""

    reframed = reframe_prop(source, cell_size)
    left_destination.parent.mkdir(parents=True, exist_ok=True)
    right_destination.parent.mkdir(parents=True, exist_ok=True)
    # Cropping adjacent columns from one canvas avoids a resample at the seam;
    # alpha-compositing the results at x=0 and x=cell_size reconstructs exactly.
    reframed.crop((0, 0, cell_size, cell_size)).save(left_destination, format="PNG")
    reframed.crop((cell_size, 0, cell_size * 2, cell_size)).save(right_destination, format="PNG")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Normalized 512x512 prop PNG.")
    parser.add_argument("left", type=Path, help="Output path for the left segment.")
    parser.add_argument("right", type=Path, help="Output path for the right segment.")
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    split_prop(args.source, args.left, args.right)
