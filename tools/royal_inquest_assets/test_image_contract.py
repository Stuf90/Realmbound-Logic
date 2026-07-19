from collections import defaultdict
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from PIL import Image

from build_tile_set import build_environment
from image_contract import edge_distance, inspect_png
from normalize_cutout import _despill_chroma_key, normalize_cutout
from split_prop import reframe_prop, split_prop


class ImageContractTests(unittest.TestCase):
    def test_rgba_cutouts_report_transparent_corners(self):
        with TemporaryDirectory() as tmp:
            path = Path(tmp) / "cutout.png"
            image = Image.new("RGBA", (512, 512), (90, 30, 40, 255))
            for point in ((0, 0), (511, 0), (0, 511), (511, 511)):
                image.putpixel(point, (0, 0, 0, 0))
            image.save(path)
            facts = inspect_png(path)

            self.assertTrue(facts.has_alpha)
            self.assertTrue(facts.transparent_corners)

    def test_rgb_tiles_report_full_opacity(self):
        with TemporaryDirectory() as tmp:
            path = Path(tmp) / "tile.png"
            Image.new("RGB", (512, 512), (80, 70, 60)).save(path)
            self.assertEqual(inspect_png(path).opaque_fraction, 1.0)

    def test_256_image_violates_512_contract(self):
        with TemporaryDirectory() as tmp:
            path = Path(tmp) / "small.png"
            Image.new("RGB", (256, 256)).save(path)
            self.assertFalse(inspect_png(path).is_512)

    def test_identical_opposing_edges_have_zero_distance(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            first, second = root / "first.png", root / "second.png"
            Image.new("RGB", (512, 512), (12, 34, 56)).save(first)
            Image.new("RGB", (512, 512), (12, 34, 56)).save(second)
            self.assertEqual(edge_distance(first, second, "right", "left"), 0.0)

    def test_normalized_cutout_has_transparent_corners(self):
        with TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.png"
            output = Path(tmp) / "output.png"
            image = Image.new("RGB", (640, 640), "#00ff00")
            for x in range(160, 480):
                for y in range(160, 480):
                    image.putpixel((x, y), (90, 30, 40))
            image.save(source)
            normalize_cutout(source, output)
            facts = inspect_png(output)
            self.assertEqual((facts.width, facts.height), (512, 512))
            self.assertTrue(facts.has_alpha)
            self.assertTrue(facts.transparent_corners)

    def test_normalized_cutout_despills_nontransparent_edges(self):
        with TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.png"
            output = Path(tmp) / "output.png"
            image = Image.new("RGB", (640, 640), "#00ff00")
            for x in range(160, 480):
                for y in range(160, 480):
                    image.putpixel((x, y), (120, 80, 40))
            for x in range(160, 480):
                image.putpixel((x, 160), (10, 230, 5))
                image.putpixel((x, 479), (10, 230, 5))
            for y in range(160, 480):
                image.putpixel((160, y), (10, 230, 5))
                image.putpixel((479, y), (10, 230, 5))
            image.save(source)

            normalize_cutout(source, output)

            with Image.open(output) as opened:
                pixels = opened.convert("RGBA").getdata()
            green_dominant = [
                pixel
                for red, green, blue, alpha in pixels
                if alpha > 0 and green > red * 1.25 and green > blue * 1.25
                for pixel in [(red, green, blue, alpha)]
            ]
            self.assertEqual(green_dominant, [])

    def test_despill_discards_low_alpha_green_key_residue(self):
        self._assert_low_alpha_key_residue_is_transparent((0, 255, 0), 14)

    def test_despill_discards_low_alpha_magenta_key_residue(self):
        self._assert_low_alpha_key_residue_is_transparent((255, 0, 255), 39)

    def test_split_prop_preserves_two_cell_recomposition(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "long-prop.png"
            left = root / "long-prop-left.png"
            right = root / "long-prop-right.png"
            image = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
            for x in range(24, 488):
                for y in range(196, 316):
                    image.putpixel((x, y), (90 + (x % 20), 45, 30, 255))
            image.save(source)

            expected = reframe_prop(source)
            split_prop(source, left, right)

            for path in (left, right):
                facts = inspect_png(path)
                self.assertTrue(facts.is_512, path)
                self.assertTrue(facts.has_alpha, path)
                self.assertTrue(facts.transparent_corners, path)
            recomposed = Image.new("RGBA", (1024, 512), (0, 0, 0, 0))
            with Image.open(left) as opened:
                recomposed.alpha_composite(opened.convert("RGBA"), (0, 0))
            with Image.open(right) as opened:
                recomposed.alpha_composite(opened.convert("RGBA"), (512, 0))
            self.assertEqual(recomposed.tobytes(), expected.tobytes())

    def test_tile_variants_are_independently_self_seamless(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            sources = []
            for index, color in enumerate(((80, 70, 60), (95, 75, 50), (65, 75, 80)), 1):
                path = root / f"source-{index}.png"
                Image.new("RGB", (768, 768), color).save(path)
                sources.append(path)
            outputs = [root / f"tile-{index}.png" for index in range(1, 4)]
            build_environment(sources, outputs)
            for output in outputs:
                facts = inspect_png(output)
                self.assertEqual((facts.width, facts.height), (512, 512))
                self.assertEqual(facts.opaque_fraction, 1.0)
                self.assertEqual(edge_distance(output, output, "right", "left"), 0.0)
                self.assertEqual(edge_distance(output, output, "bottom", "top"), 0.0)

    def test_tile_builder_does_not_force_bilateral_symmetry(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "asymmetric-source.png"
            output = root / "tile.png"
            width, height = 180, 140
            pixels = [
                ((x * 29 + y * 7) % 256, (x * 3 + y * 41) % 256, (x * 17 + y * 11) % 256)
                for y in range(height)
                for x in range(width)
            ]
            image = Image.new("RGB", (width, height))
            image.putdata(pixels)
            image.save(source)

            build_environment([source], [output], size=128, edge_band=16)

            with Image.open(output) as opened:
                interior = opened.convert("RGB").crop((16, 16, 112, 112))
            self.assertNotEqual(
                interior.tobytes(),
                interior.transpose(Image.Transpose.FLIP_LEFT_RIGHT).tobytes(),
            )
            self.assertNotEqual(
                interior.tobytes(),
                interior.transpose(Image.Transpose.FLIP_TOP_BOTTOM).tobytes(),
            )

    def _assert_low_alpha_key_residue_is_transparent(
        self, key: tuple[int, int, int], alpha: int
    ) -> None:
        image = Image.new("RGBA", (3, 1), (*key, 0))
        near_key = tuple(max(0, component - 18) for component in key)
        image.putpixel((1, 0), (*near_key, alpha))

        result = _despill_chroma_key(image, key)

        self.assertEqual(result.getpixel((1, 0)), (0, 0, 0, 0))
class CompletePackTests(unittest.TestCase):
    def test_runtime_pack_contract(self):
        root = Path(__file__).resolve().parents[2] / "src" / "assets" / "royal-inquest"
        if not root.exists():
            self.skipTest("Runtime Royal Inquest asset pack has not been generated yet.")

        avatars = sorted((root / "avatars").glob("*.png"))
        props = sorted((root / "props").glob("*.png"))
        tiles = sorted((root / "tiles").glob("*.png"))
        self.assertEqual(len(avatars), 18)
        self.assertEqual(len(props), 22)
        self.assertEqual(len(tiles), 15)

        for path in [*avatars, *props]:
            facts = inspect_png(path)
            self.assertTrue(facts.is_512, path)
            self.assertTrue(facts.has_alpha, path)
            self.assertTrue(facts.transparent_corners, path)

        environments: dict[str, list[Path]] = defaultdict(list)
        for path in tiles:
            facts = inspect_png(path)
            self.assertTrue(facts.is_512, path)
            self.assertEqual(facts.opaque_fraction, 1.0, path)
            environment, separator, variant = path.stem.rpartition("-")
            self.assertTrue(separator and variant in {"1", "2", "3"}, path)
            environments[environment].append(path)
        self.assertEqual(len(environments), 7)

        expected_variant_counts = {
            "room-timber": 3,
            "garden": 3,
            "church-stone": 3,
            "kitchen-flagstone": 3,
            "hallway-stone": 1,
            "dungeon-masonry": 1,
            "royal-marble": 1,
        }
        self.assertEqual(
            {environment: len(variants) for environment, variants in environments.items()},
            expected_variant_counts,
        )
        for environment, variants in environments.items():
            for variant in variants:
                self.assertEqual(
                    edge_distance(variant, variant, "right", "left"),
                    0.0,
                    f"{environment}: {variant.name} right edge != left edge",
                )
                self.assertEqual(
                    edge_distance(variant, variant, "bottom", "top"),
                    0.0,
                    f"{environment}: {variant.name} bottom edge != top edge",
                )
if __name__ == "__main__":
    unittest.main()
