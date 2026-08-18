"""Chroma-key normalization for generated avatars and map props."""

from __future__ import annotations

import math
from pathlib import Path
from statistics import median

from PIL import Image


KEY_CLEAR_DISTANCE = 12.0
KEY_OPAQUE_DISTANCE = 80.0
LOW_ALPHA_KEY_RESIDUE_CUTOFF = 40
BREATHING_ROOM = 0.08


def normalize_cutout(source: Path, destination: Path, size: int = 512) -> None:
    """Remove the sampled border key, square-pad the subject, and resize it.

    The alpha matte uses a smooth transition from fully transparent at a color
    distance of 12 to opaque at 80.  That is deliberately broad enough to
    absorb generator anti-aliasing around a nominally flat chroma-key border.
    """

    if size <= 0:
        raise ValueError("size must be positive")

    with Image.open(source) as opened:
        image = opened.convert("RGBA")

    key_color = _sample_border_key(image)
    alpha = Image.new("L", image.size)
    alpha.putdata(
        [_matte_alpha(pixel, key_color) for pixel in image.getdata()]
    )
    image.putalpha(alpha)
    image = _despill_chroma_key(image, key_color)

    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError(f"No foreground remained after keying {source}.")

    subject = image.crop(bounds)
    subject_width, subject_height = subject.size
    available = max(1, round(size * (1 - (2 * BREATHING_ROOM))))
    scale = min(available / subject_width, available / subject_height)
    resized_size = (
        max(1, round(subject_width * scale)),
        max(1, round(subject_height * scale)),
    )
    subject = subject.resize(resized_size, Image.Resampling.LANCZOS)
    subject = _despill_chroma_key(subject, key_color)

    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = ((size - resized_size[0]) // 2, (size - resized_size[1]) // 2)
    output.alpha_composite(subject, offset)
    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, format="PNG")


def _sample_border_key(image: Image.Image) -> tuple[int, int, int]:
    width, height = image.size
    border = [
        *(image.getpixel((x, 0))[:3] for x in range(width)),
        *(image.getpixel((x, height - 1))[:3] for x in range(width)),
        *(image.getpixel((0, y))[:3] for y in range(1, height - 1)),
        *(image.getpixel((width - 1, y))[:3] for y in range(1, height - 1)),
    ]
    return tuple(round(median(channel)) for channel in zip(*border))  # type: ignore[return-value]


def _matte_alpha(pixel: tuple[int, int, int, int], key_color: tuple[int, int, int]) -> int:
    distance = math.sqrt(sum((component - key) ** 2 for component, key in zip(pixel[:3], key_color)))
    if distance <= KEY_CLEAR_DISTANCE:
        key_alpha = 0.0
    elif distance >= KEY_OPAQUE_DISTANCE:
        key_alpha = 1.0
    else:
        progress = (distance - KEY_CLEAR_DISTANCE) / (KEY_OPAQUE_DISTANCE - KEY_CLEAR_DISTANCE)
        key_alpha = progress * progress * (3 - (2 * progress))
    return round(pixel[3] * key_alpha)


def _despill_chroma_key(image: Image.Image, key_color: tuple[int, int, int]) -> Image.Image:
    """Unmix the sampled key color from partially transparent edge pixels."""

    pixels: list[tuple[int, int, int, int]] = []
    for red, green, blue, alpha in image.getdata():
        key_distance = math.sqrt(
            sum((color - key) ** 2 for color, key in zip((red, green, blue), key_color))
        )
        if alpha == 0 or key_distance <= KEY_CLEAR_DISTANCE:
            pixels.append((0, 0, 0, 0))
            continue
        if alpha <= LOW_ALPHA_KEY_RESIDUE_CUTOFF and key_distance < KEY_OPAQUE_DISTANCE:
            # A generator's chroma-key anti-aliasing can retain a one-digit
            # alpha value after matte calculation.  It is not useful subject
            # coverage and becomes visible as a key-coloured fringe when the
            # token is composited.  Use the sampled key colour, so this also
            # handles non-green keys such as magenta.
            pixels.append((0, 0, 0, 0))
            continue
        if alpha == 255:
            pixels.append((red, green, blue, alpha))
            continue

        opacity = alpha / 255
        colors = (red, green, blue)
        corrected = tuple(
            round(max(0, min(255, (color - ((1 - opacity) * key)) / opacity)))
            for color, key in zip(colors, key_color)
        )
        pixels.append((*corrected, alpha))

    result = Image.new("RGBA", image.size)
    result.putdata(pixels)
    return result
