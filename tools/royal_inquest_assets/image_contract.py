"""Deterministic inspection helpers for the Royal Inquest PNG asset contract."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image


@dataclass(frozen=True)
class ImageFacts:
    """The small set of image facts enforced by the runtime asset pack."""

    width: int
    height: int
    mode: str
    has_alpha: bool
    opaque_fraction: float
    transparent_corners: bool

    @property
    def is_512(self) -> bool:
        """Whether this image satisfies the pack's required dimensions."""

        return (self.width, self.height) == (512, 512)

    @property
    def is_512x512(self) -> bool:
        """Alias that reads naturally in contract assertions."""

        return self.is_512


def inspect_png(path: Path) -> ImageFacts:
    """Return deterministic contract facts for a PNG file.

    Palette and grayscale images are converted before inspection so opacity is
    calculated from their actual alpha channel rather than their source mode.
    """

    with Image.open(path) as opened:
        image = opened.copy()

    has_alpha = "A" in image.getbands() or "transparency" in image.info
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    alpha_values = list(alpha.getdata())
    total_pixels = len(alpha_values)
    opaque_fraction = (
        sum(value == 255 for value in alpha_values) / total_pixels if total_pixels else 0.0
    )
    width, height = rgba.size
    corners = ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1))
    transparent_corners = all(alpha.getpixel(point) == 0 for point in corners)

    return ImageFacts(
        width=width,
        height=height,
        mode=image.mode,
        has_alpha=has_alpha,
        opaque_fraction=opaque_fraction,
        transparent_corners=transparent_corners,
    )


def edge_distance(first: Path, second: Path, first_edge: str, second_edge: str) -> float:
    """Return the mean normalized RGB(A) distance between two one-pixel edges.

    Edges are compared in their natural reading direction.  A right edge and a
    left edge therefore compare top-to-bottom; a bottom and top edge compare
    left-to-right.  Images must share the same dimensions.
    """

    with Image.open(first) as opened:
        first_image = opened.convert("RGBA")
    with Image.open(second) as opened:
        second_image = opened.convert("RGBA")

    if first_image.size != second_image.size:
        raise ValueError("Images must have identical dimensions to compare edges.")

    first_pixels = _edge_pixels(first_image, first_edge)
    second_pixels = _edge_pixels(second_image, second_edge)
    channel_total = sum(
        abs(left - right)
        for first_pixel, second_pixel in zip(first_pixels, second_pixels)
        for left, right in zip(first_pixel, second_pixel)
    )
    return channel_total / (len(first_pixels) * 4 * 255)


def _edge_pixels(image: Image.Image, edge: str) -> list[tuple[int, int, int, int]]:
    width, height = image.size
    if edge == "top":
        return [image.getpixel((x, 0)) for x in range(width)]
    if edge == "bottom":
        return [image.getpixel((x, height - 1)) for x in range(width)]
    if edge == "left":
        return [image.getpixel((0, y)) for y in range(height)]
    if edge == "right":
        return [image.getpixel((width - 1, y)) for y in range(height)]
    raise ValueError(f"Unknown edge {edge!r}; expected top, bottom, left, or right.")
