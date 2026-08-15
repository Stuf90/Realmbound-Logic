# Gemini style-example prompt (Royal Inquest asset style check)

Used to generate a quick reference sheet for judging art style before committing to the
full `$image-gen` pipeline in
`docs/superpowers/plans/2026-08-15-royal-inquest-marks-and-rural-assets.md`. Not part of
the production pipeline (no chroma-key background here — this is for visual sign-off
only).

## Prompt used

```
Create one single reference sheet image, divided into a clean labeled 3x3 grid on a
plain light-parchment background, showing 9 example game-art assets for a medieval
logic/mystery board game called "Royal Inquest." All 9 must share one consistent
illustrated style so they can be judged as a set:

Style/medium: refined 2D game illustration, crisp dark-brown ink outlines, restrained
parchment texture, sophisticated rather than cartoonish (not cute, not photorealistic,
not pixel art).
Color palette: burgundy, navy, forest green, warm stone, dark oak, antique gold —
consistent across every panel, no other colors.
Lighting: even neutral light, no strong directional shadows.

Grid layout, each cell labeled underneath with its name in a small serif caption:

Row 1 — Avatars (circular portrait tokens, head-and-shoulders, inside a complete
antique-gold circular frame, centered):
1. "monarch" — older ruling queen, narrow crown, silver-streaked dark hair, burgundy
   mantle, authoritative expression.
2. "knight" — broad middle-aged knight, weathered face, steel gorget, navy surcoat.
3. "cook" — sturdy older cook, ruddy cheeks, linen-wrapped hair, burgundy apron.

Row 2 — Props (exact straight-down orthographic view, full footprint visible, no
perspective tilt, no cast shadow):
4. "throne" — ornate dark-oak royal throne, burgundy cushion, antique-gold fittings.
5. "hay-bale" — compact round hay bale, golden straw texture, twine bindings (a new
   rustic/farm-style prop, should still clearly match the same palette/ink-outline style
   as the throne despite being a plainer, rougher object).
6. "tavern-bar" — long dark-oak tavern serving counter, worn tabletop, subtle grain.

Row 3 — Floor tiles (fully opaque, straight-down, no border, no object, no focal
point, edge-to-edge texture, seamlessly tileable) and overlay marks (small centered
symbol, generous transparent padding, reads as a stamp not an object):
7. "royal-marble tile" — cream and burgundy geometric inlay, thin antique-gold lines.
8. "farm-dirt tile" — packed warm-brown farmyard dirt, scattered straw wisps, faint
   furrow lines.
9. "cross marks pair" — show two small X symbols side by side in one cell: left one a
   hand-inked dark-brown ink X with an uneven brushstroke, quill-drawn feel; right one a
   precise antique-gold geometric X with a thin navy outline, mechanical/stamped
   character. The two must look clearly different from each other in style, not just
   color, even at small size.

Constraints: no readable body text other than the 9 small captions, no watermark, no
logos, consistent line weight and texture density across all 9 panels so the set reads
as one coherent art style. Avoid photorealism, pixel art, cartoon/chibi proportions.
```

## Results

Two generations saved in this folder:

- `gemini-style-example-1.jpg` — ungridded/unlabeled sticker-style layout: 5 avatars top
  row (monarch, knight, and 3 unlabeled repeats reading as scholar/steward/cook), throne
  + bench + 2 hay-bales, 3 tiles (royal-marble x2 variants + farm-dirt) + 2 cross marks
  bottom row.
- `gemini-style-example-2.jpg` — closer to the requested 3x3 grid with captions, but
  Gemini repeated/mislabeled several cells (`cook` appears twice, `knight` appears twice,
  `tavern-bar` appears twice, "floor tiles" is a duplicate generic caption rather than a
  9th distinct item) instead of producing all 9 distinct requested subjects.

## Style verdict (pending Stef's review)

Both hits: consistent ink-outline + parchment style across avatars/props/tiles, palette
matches spec, hay-bale and tavern-bar read clearly as rustic/lived-in without breaking
from the royal-court pieces' line weight, cross marks are visually distinguishable
(hand-inked vs. geometric-gold) as required.

Open issue: Gemini did not reliably honor the distinct-9-subjects-with-correct-labels
instruction — it duplicated/relabeled several cells in both attempts. If iterating
further, consider generating panels individually (one image per asset) rather than
asking for a full labeled grid in one shot, since the grid-composition instruction
itself seems to be where it drifted, not the per-asset style description.
