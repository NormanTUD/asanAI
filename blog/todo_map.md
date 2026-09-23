# Atlas — Remaining Work

## High Priority

### 1. Earth day/night cycle with real-time terminator
- **Goal:** Earth shows city lights on the night side; the shadow (terminator) matches current UTC time so the dark side is geographically accurate.
- **Needs:**
  - CC-licensed night-lights Earth texture (NASA Black Marble / VIIRS, public domain)
  - Custom `ShaderMaterial` blending day + night textures based on dot product of surface normal and sun direction
  - Sun direction computed from current UTC time (subsolar point: latitude from solar declination, longitude from solar time)
  - Update sun direction each frame so the terminator moves in real time
- **Files:** `map.js` (buildEarth → replace MeshPhongMaterial with ShaderMaterial), new `earth_night.png`
- **Status:** Not started

### 2. Run full validators
- `uv run blog/tests/js_validator.py blog/`
- `uv run blog/tests/php_validator.py blog/`
- `uv run blog/tests/link_checker.py blog/`
- `php -l blog/map.php`
- **Status:** Not yet run on full suite

## Medium Priority

### 3. Download real CC galaxy images
- **Goal:** Replace procedural spiral textures with actual photos of galaxies (Andromeda, Whirlpool, Sombrero, Pinwheel).
- **Blocker:** NASA/Hubble/ESO sites block automated downloads (bot protection). Need to download manually via browser.
- **When images are available:**
  - Place in `blog/` as `galaxy_*.jpg`
  - Replace `makeSpiralTexture()` sprites with `SpriteMaterial({ map: loadedTex, blending: THREE.AdditiveBlending })`
  - Vary size/rotation for visual variety
  - Add to `bildquellen-pruefung.txt` + `literature.js` if cited
- **Status:** Blocked (manual download needed)

### 4. CDP regression test
- Single script: tour start/stop, dot click, asparagus reveal/close, toggle visibility, deep-time hiding, texture presence, celestialVis at key zoom levels.
- **Status:** Not started

## Low Priority / Polish

### 5. Mobile responsiveness
- Verify at 375px and 768px. Check tour dots, panels, toggles don't overflow.

### 6. Performance on low-end devices
- Profile FPS on mid-range phone. Consider reducing star count / galaxy count on mobile.

### 7. Update AGENTS.md
- Reflect new module vars (`bgTexture`), new behavior (question-world black bg, day/night shader, solar system repositioning).

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
