"""Build compatible, seamless tile variants for one Royal Inquest environment."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image


def build_environment(
    sources: list[Path], destinations: list[Path], size: int = 512, edge_band: int = 48
) -> None:
    """Build one environment's variants with one shared seamless edge band."""

    if not sources:
        raise ValueError("At least one source tile is required.")
    if len(sources) != len(destinations):
        raise ValueError("sources and destinations must have the same length.")
    if size <= 0:
        raise ValueError("size must be positive")
    if not 0 < edge_band <= size // 2:
        raise ValueError("edge_band must be greater than zero and at most half of size.")

    variants = [_mirrored_seamless_base(source, size) for source in sources]
    shared_edge = variants[0]
    for variant, destination in zip(variants, destinations):
        blended = _blend_interior_into_shared_edge(shared_edge, variant, edge_band)
        destination.parent.mkdir(parents=True, exist_ok=True)
        blended.save(destination, format="PNG")


def _mirrored_seamless_base(source: Path, size: int) -> Image.Image:
    """Mirror a source across both axes, giving equal pixels on opposite edges."""

    with Image.open(source) as opened:
        quadrant = opened.convert("RGB").resize((size // 2, size // 2), Image.Resampling.LANCZOS)

    # Crop/pad through resize when an odd size is requested, retaining an exact
    # mirrored relationship for the outermost pixel rows and columns.
    left_width = size // 2
    right_width = size - left_width
    top_height = size // 2
    bottom_height = size - top_height
    top_left = quadrant.resize((left_width, top_height), Image.Resampling.LANCZOS)
    top_right = Image.Transpose.FLIP_LEFT_RIGHT
    top = Image.new("RGB", (size, top_height))
    top.paste(top_left, (0, 0))
    top.paste(top_left.transpose(top_right).resize((right_width, top_height), Image.Resampling.LANCZOS), (left_width, 0))
    bottom = top.transpose(Image.Transpose.FLIP_TOP_BOTTOM).resize((size, bottom_height), Image.Resampling.LANCZOS)
    base = Image.new("RGB", (size, size))
    base.paste(top, (0, 0))
    base.paste(bottom, (0, top_height))
    return base


def _blend_interior_into_shared_edge(
    shared_edge: Image.Image, variant: Image.Image, edge_band: int
) -> Image.Image:
    """Keep a shared edge band, then cosine-feather into each variant centre."""

    width, height = shared_edge.size
    mask = Image.new("L", (width, height))
    values: list[int] = []
    for y in range(height):
        for x in range(width):
            distance_to_edge = min(x, y, width - 1 - x, height - 1 - y)
            # The complete edge band is copied verbatim from ``shared_edge``.
            # Begin the transition only after it, so all 48 pixels (by default)
            # agree byte-for-byte across every compatible variant.
            transition_distance = max(0, distance_to_edge - edge_band + 1)
            progress = min(1.0, transition_distance / edge_band)
            values.append(round((1 - math.cos(math.pi * progress)) * 127.5))
    mask.putdata(values)
    return Image.composite(variant, shared_edge, mask)
