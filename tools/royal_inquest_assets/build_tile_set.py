"""Build compatible, seamless tile variants for one Royal Inquest environment."""

from __future__ import annotations

import math
from pathlib import Path
import zlib

from PIL import Image, ImageChops


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

    variants = [_offset_wrapped_texture(source, size, edge_band) for source in sources]
    shared_edge = _shared_seam_frame(variants[0], edge_band)
    for variant, destination in zip(variants, destinations):
        blended = _blend_interior_into_shared_edge(shared_edge, variant, edge_band)
        destination.parent.mkdir(parents=True, exist_ok=True)
        blended.save(destination, format="PNG")


def _offset_wrapped_texture(source: Path, size: int, edge_band: int) -> Image.Image:
    """Sample a deterministic, non-symmetric source crop and offset it with wrapping."""

    with Image.open(source) as opened:
        original = opened.convert("RGB")

    overscan = size + edge_band * 2
    if original.width >= overscan and original.height >= overscan:
        resized = original
    else:
        scale = max(overscan / original.width, overscan / original.height)
        resized = original.resize(
            (math.ceil(original.width * scale), math.ceil(original.height * scale)),
            Image.Resampling.LANCZOS,
        )
    seed = zlib.crc32(source.name.encode("utf-8"))
    max_x = resized.width - overscan
    max_y = resized.height - overscan
    crop_x = seed % (max_x + 1)
    crop_y = (seed // 65537) % (max_y + 1)
    texture = resized.crop((crop_x, crop_y, crop_x + overscan, crop_y + overscan))
    texture = texture.resize((size, size), Image.Resampling.LANCZOS)

    offset_x = size // 8 + (seed % max(1, size // 4))
    offset_y = size // 8 + ((seed // 257) % max(1, size // 4))
    return ImageChops.offset(texture, offset_x, offset_y)


def _shared_seam_frame(base: Image.Image, edge_band: int) -> Image.Image:
    """Reflect only the common perimeter band, preserving an asymmetric centre."""

    width, height = base.size
    framed = base.copy()
    source = base.load()
    pixels = framed.load()
    for y in range(height):
        source_y = height - 1 - y if y >= height - edge_band else y
        for x in range(width):
            if x < edge_band or x >= width - edge_band or y < edge_band or y >= height - edge_band:
                source_x = width - 1 - x if x >= width - edge_band else x
                pixels[x, y] = source[source_x, source_y]
    return framed


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
