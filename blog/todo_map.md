# Atlas — Remaining Work

## High Priority

### 1. Fix Earth texture not showing
- **Symptom:** Earth renders as solid dark-blue sphere; `earth_texture.png` (2048×1024, CC) not applied.
- **Code:** `buildEarth()` at `map.js:277` — texture loading callback sets `mat.map`, `mat.color.set(0xffffff)`, `mat.needsUpdate = true`.
- **Check:** Verify `tex.needsUpdate = true` is set after `tex.encoding`; confirm texture loads in browser (Network tab); rule out stale cache.

### 2. Run full validators
- `uv run blog/tests/js_validator.py blog/`
- `uv run blog/tests/php_validator.py blog/`
- `uv run blog/tests/link_checker.py blog/`
- `php -l blog/map.php`

## Medium Priority

### 3. TOC: hide Find/Legend/Threads/Time on map page
- **Symptom:** The course TOC sidebar shows "Find", "Legend", "Threads", "Time" entries on the map page. These are Atlas UI panels, not course TOC items — they should not appear in the course TOC.
- **Approach:** Identify where TOC entries are generated (likely `functions.php` or a JS builder). Either filter them out when the slug is `map`, or add a `data-toc-hidden` attribute to those elements in `map.php`.
- **Scope:** Map page only — TOC must still work normally on all other lessons.

### 4. Verify deep-time hiding at all extreme zoom levels
- Confirm at `d=260` (cosmic web), `d=400` (Big Bang), `d=560` (question): Earth, Moon, atmosphere, sun, planets all invisible.
- Confirm at `d=3.2` (Earth view) and `d=60` (solar system): all visible.
- CDP test: `__ATLAS_DEBUG.state.tD = 400; __ATLAS_DEBUG.goStep(11);` then check `scene()` children visibility.

## Low Priority / Polish

### 5. CDP regression test suite
- Write a single CDP test script that exercises: tour start/stop, dot click, asparagus reveal/close, toggle visibility, deep-time hiding.
- Run in CI or as a pre-commit check.

### 6. Mobile responsiveness check
- Verify Atlas renders correctly at 375px width (iPhone SE) and 768px (tablet).
- Check tour dots, panels, and toggle buttons don't overflow.

### 7. Performance: dot mesh on low-end devices
- 829 instanced dots + 188 thread lines + starfield + galaxies. Profile on a mid-range phone.
- Consider reducing star count or galaxy count on mobile if FPS < 30.
