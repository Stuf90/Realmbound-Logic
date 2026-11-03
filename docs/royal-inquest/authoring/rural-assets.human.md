# Rural assets and cross marks

Implemented from the 2026-08-15 marks and rural assets plan.

- Two transparent 512x512 marks replace the manual/automatic text glyphs. Their visible footprint is 45% of the canvas.
- Farm, tavern and cabin each have three opaque 512x512 floor variants with identical opposing edges across all three variants.
- Fifteen transparent 512x512 props are registered with their seat/decorative kinds, categories and environment allow-lists.
- The manifest now has 18 avatars, 40 prop ids (39 files), 24 tile files in 10 environments, and 2 marks: 83 distinct image URLs.
- Existing levels and rules are unchanged. Rural environments are available for future level authoring. The window placeholder remains a separate task.

Sources and review sheets are retained in `tmp/royal-inquest-assets/`.
The existing scripts under `archive/royal-inquest/tools/royal_inquest_assets/` are reused.
`normalize_cutout` accepts optional `breathing_room`; `build_environment` accepts optional `shared_edges=True`. Default padding and independent tile processing remain available.

Validation:
```powershell
python -m unittest discover -s tools/royal_inquest_assets -p 'test_*.py' -v
npm test -- --run src/assets/royal-inquest/manifest.test.ts
npm run build
```
