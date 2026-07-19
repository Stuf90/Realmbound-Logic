"""Build independently seamless Royal Inquest floor tiles."""

from __future__ import annotations

import math
from pathlib import Path
import zlib

from PIL import Image, ImageChops


def build_environment(
    sources: list[Path], destinations: list[Path], size: int = 512, edge_band: int = 48
) -> None:
    """Build every source as an independently self-seamless tile."""

    if not sources:
        raise ValueError("At least one source tile is required.")
    if len(sources) != len(destinations):
        raise ValueError("sources and destinations must have the same length.")
    if size <= 0:
        raise ValueError("size must be positive")
    if not 0 < edge_band <= size // 2:
        raise ValueError("edge_band must be greater than zero and at most half of size.")

    for source, destination in zip(sources, destinations):
        texture = _offset_wrapped_texture(source, size, edge_band)
        seamless = _feather_opposing_edges(texture, edge_band)
        destination.parent.mkdir(parents=True, exist_ok=True)
        seamless.save(destination, format="PNG")


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


def _feather_opposing_edges(base: Image.Image, feather: int) -> Image.Image:
    """Blend each opposing edge pair with a broad, wavy two-dimensional feather."""

    horizontal = base.copy()
    source = base.load()
    pixels = horizontal.load()
    width, height = base.size
    for y in range(height):
        row_feather = _varying_feather(feather, y, height, phase=0.37)
        for distance in range(row_feather):
            left_x = distance
            right_x = width - 1 - distance
            strength = _cosine_falloff(distance, row_feather)
            shared = _average(source[left_x, y], source[right_x, y])
            pixels[left_x, y] = _mix(source[left_x, y], shared, strength)
            pixels[right_x, y] = _mix(source[right_x, y], shared, strength)

    vertical = horizontal.copy()
    source = horizontal.load()
    pixels = vertical.load()
    for x in range(width):
        column_feather = _varying_feather(feather, x, width, phase=1.91)
        for distance in range(column_feather):
            top_y = distance
            bottom_y = height - 1 - distance
            strength = _cosine_falloff(distance, column_feather)
            shared = _average(source[x, top_y], source[x, bottom_y])
            pixels[x, top_y] = _mix(source[x, top_y], shared, strength)
            pixels[x, bottom_y] = _mix(source[x, bottom_y], shared, strength)
    return vertical


def _varying_feather(feather: int, position: int, span: int, phase: float) -> int:
    wave = 0.5 + 0.5 * math.sin((position / (span - 1)) * math.tau + phase)
    return max(2, round(feather * (0.72 + 0.28 * wave)))


def _cosine_falloff(distance: int, feather: int) -> float:
    if feather <= 1:
        return 1.0
    progress = distance / (feather - 1)
    return (1.0 + math.cos(math.pi * progress)) / 2.0


def _average(first: tuple[int, int, int], second: tuple[int, int, int]) -> tuple[int, int, int]:
    return tuple(round((left + right) / 2) for left, right in zip(first, second))


def _mix(
    original: tuple[int, int, int], shared: tuple[int, int, int], strength: float
) -> tuple[int, int, int]:
    return tuple(round(left * (1.0 - strength) + right * strength) for left, right in zip(original, shared))
