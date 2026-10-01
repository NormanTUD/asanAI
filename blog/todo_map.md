# Atlas — Remaining Work

## High Priority

### 1. Run full validator suite
- `uv run blog/tests/js_validator.py blog/` (full, not just map.js)
- `uv run blog/tests/link_checker.py blog/`
- **Status:** map.js + map.php pass clean; full suite not yet run

## Medium Priority

### 2. Full validator suite
- `uv run blog/tests/link_checker.py blog/` (all literature.js URLs)
- `uv run blog/tests/php_validator.py blog/` (all PHP files)
- **Status:** map.js + map.php pass clean; full suite not yet run

### 3. CDP regression test
- Single script: tour start/stop, dot click, asparagus reveal/close, toggle visibility, deep-time hiding, texture presence, celestialVis at key zoom levels, day/night terminator position.
- **Status:** Not started

## Low Priority / Polish

### 4. Mobile responsiveness
- Verify at 375px and 768px. Check tour dots, panels, toggles don't overflow.

### 5. Performance on low-end devices
- Profile FPS on mid-range phone. Consider reducing star count / galaxy count on mobile.

### 6. Update AGENTS.md
- Reflect new module vars (`bgTexture`, `earthDayNightMat`), new behavior (question-world black bg, day/night shader, solar system repositioning).

---

## Completed this session
- `renderer.outputEncoding = sRGBEncoding` (fixes texture color management)
- Inverted `celestialVis` logic fixed (Earth/Moon were hidden at normal zoom)
- `celestialVis` threshold moved to d=70-120 (no flash during galaxies→web)
- 5 guardrails added (visibility, opacity, needsUpdate, encoding, 404)
- Question-world black background (swaps starfield → black at d>480)
- Solar system: sun moved to [35,0,0], orbits scaled 6-19.5
- Galaxy sprites: improved procedural texture + `AdditiveBlending`
- Map top border: `border-radius: 0 0 14px 14px`, `margin-top: -1px`
- TOC: skipped entirely on `map.php`
- Texture error handlers on Earth/Moon loaders
- **Earth day/night cycle:** custom `ShaderMaterial` blending day (`earth_texture.jpg`) + night (`earth_night.jpg`, NASA VIIRS 2012, public domain) textures. Sun direction computed from UTC time each frame (subsolar longitude from solar time, declination from day-of-year). Terminator moves in real time. Night lights glow at 2.5× brightness.
- **Galaxy sprites:** 5 real CC galaxy photos (NGC 2683, NGC 55, NGC 2403, NGC 1300, NGC 300) from NASA/ESA/ESO via Wikimedia Commons, resized to 512×512, loaded as sprite textures with `AdditiveBlending`. Procedural spiral retained as fallback.
