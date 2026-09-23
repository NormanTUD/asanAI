# Atlas — Remaining Work

## High Priority

### 1. Earth day/night cycle with real-time terminator
- **Goal:** Earth shows city lights on the night side; the shadow (terminator) matches current UTC time so the dark side is geographically accurate.
- **Needs:**
  - CC-licensed night-lights Earth texture (e.g., NASA Black Marble / VIIRS, public domain)
  - Custom `ShaderMaterial` that blends day texture + night texture based on dot product of surface normal and sun direction
  - Sun direction computed from current UTC time (subsolar point: latitude from declination, longitude from solar time)
  - Update sun direction each frame (or each second) so the terminator moves in real time
- **Files:** `map.js` (buildEarth → replace MeshPhongMaterial with ShaderMaterial), new `earth_night.png`

### 2. Solar system: sun at center, correct orbits
- **Goal:** Heliocentric model — sun at the center of the solar system group, planets orbiting around it.
- **Current:** `SUN_POS = [85, 6, -20]` (off to the side). Planets orbit around this position.
- **Fix:** Either move `SUN_POS` closer to origin, or create a `THREE.Group` for the solar system with sun at group-origin, then position the group so it's visible at the solar-system zoom level (d≈60).
- **Constraint:** Earth must still be at (0,0,0) for the main globe view. The solar system is a "zoomed-out" view, so the group can be positioned such that at d=60 the sun is centered in view.

### 3. Run full validators
- `uv run blog/tests/js_validator.py blog/`
- `uv run blog/tests/php_validator.py blog/`
- `uv run blog/tests/link_checker.py blog/`
- `php -l blog/map.php`

## Medium Priority

### 4. Replace spiral galaxy sprites with real CC galaxy images
- **Goal:** Use actual photos of galaxies (Andromeda, Whirlpool, Sombrero, etc.) instead of procedural spiral sprites.
- **Needs:**
  - Find 5–8 CC/public-domain galaxy images (NASA/ESO/Hubble are public domain)
  - Download to `blog/`
  - Replace `makeSpiralTexture()` sprites with `SpriteMaterial` using the real images
  - Set blending to `THREE.AdditiveBlending` or `THREE.MultiplyBlending` so they blend with the dark background
  - Vary size/rotation for visual variety
- **Credit:** Add to `bildquellen-pruefung.txt` + `literature.js` if cited in captions

### 5. CDP regression test
- Single script: tour start/stop, dot click, asparagus reveal/close, toggle visibility, deep-time hiding, texture presence.
- Run with `uv run --with websockets python <test>.py`

## Low Priority / Polish

### 6. Mobile responsiveness
- Verify at 375px and 768px. Check tour dots, panels, toggles don't overflow.

### 7. Performance on low-end devices
- Profile FPS on mid-range phone. Consider reducing star count / galaxy count on mobile.

### 8. Update AGENTS.md
- Reflect new module vars (`bgTexture`), new behavior (question-world black bg, day/night shader).
