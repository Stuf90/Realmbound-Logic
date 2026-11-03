"""Contract checks for the rural expansion; run after generating all assets."""
from pathlib import Path
import sys
import unittest
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "archive/royal-inquest/tools/royal_inquest_assets"))
from image_contract import inspect_png, edge_distance

ASSETS = ROOT / "src/assets/royal-inquest"
PROPS = "hay-bale feed-trough well scarecrow farm-fence tavern-bar barstool ale-barrel fireplace dartboard cabin-bed wood-stove washbasin rocking-chair chest".split()

class RuralAssetsTests(unittest.TestCase):
    def test_cutouts_and_overlay_scale(self):
        for category, names in [("props", PROPS), ("marks", ["manual-cross", "auto-cross"])]:
            for name in names:
                path = ASSETS / category / (name + ".png")
                with self.subTest(name=name):
                    facts = inspect_png(path)
                    self.assertTrue(facts.is_512 and facts.has_alpha and facts.transparent_corners)
                    with Image.open(path) as image:
                        alpha = image.getchannel("A")
                        bounds = alpha.point(lambda x: 255 if x > 40 else 0).getbbox()
                        self.assertIsNotNone(bounds)
                        if category == "marks":
                            extent = max(bounds[2]-bounds[0], bounds[3]-bounds[1])
                            self.assertTrue(200 <= extent <= 245, extent)

    def test_tiles_are_opaque_and_all_variants_connect(self):
        for prefix in ["farm-dirt", "tavern-planks", "cabin-log"]:
            paths = [ASSETS / "tiles" / f"{prefix}-{i}.png" for i in range(1, 4)]
            for first in paths:
                facts = inspect_png(first)
                self.assertTrue(facts.is_512)
                self.assertEqual(facts.opaque_fraction, 1.0)
                for second in paths:
                    with self.subTest(first=first.name, second=second.name):
                        self.assertEqual(edge_distance(first, second, "right", "left"), 0.0)
                        self.assertEqual(edge_distance(first, second, "bottom", "top"), 0.0)

if __name__ == "__main__":
    unittest.main()
