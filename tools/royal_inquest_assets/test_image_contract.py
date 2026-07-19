from collections import defaultdict
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from PIL import Image

from build_tile_set import build_environment
from image_contract import edge_distance, inspect_png
from normalize_cutout import normalize_cutout


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

    def test_tile_variants_share_exact_edges(self):
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
            for first in outputs:
                for second in outputs:
                    self.assertEqual(edge_distance(first, second, "right", "left"), 0.0)
                    self.assertEqual(edge_distance(first, second, "bottom", "top"), 0.0)


class CompletePackTests(unittest.TestCase):
    def test_runtime_pack_contract(self):
        root = Path(__file__).resolve().parents[2] / "src" / "assets" / "royal-inquest"
        if not root.exists():
            self.skipTest("Runtime Royal Inquest asset pack has not been generated yet.")

        avatars = sorted((root / "avatars").glob("*.png"))
        props = sorted((root / "props").glob("*.png"))
        tiles = sorted((root / "tiles").glob("*.png"))
        self.assertEqual(len(avatars), 18)
        self.assertEqual(len(props), 12)
        self.assertEqual(len(tiles), 21)

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

        for environment, variants in environments.items():
            self.assertEqual(len(variants), 3, environment)
            for first in variants:
                for second in variants:
                    self.assertEqual(edge_distance(first, second, "right", "left"), 0.0)
                    self.assertEqual(edge_distance(first, second, "bottom", "top"), 0.0)


if __name__ == "__main__":
    unittest.main()
