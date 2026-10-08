// ============================================================
// DenseMerge (T20): Folie 8 (NeuronIntro) + Folie 9 (SpaceMorph)
// zu EINER Folie gemerged. Szene A = NeuronIntro (Formeln/Fragmente),
// Szene B = SpaceMorph (3D-Canvas). Der Wechsel A→B ist ein weicher
// INHALT-SWAP (kein Folienwechsel) — "wie die anderen Übergänge".
//
// Navigation:
//   Szene A  → die Fragmente laufen normal (Presentation.next/prev);
//              nach dem LETZTEN Fragment (alle sichtbar) frisst das
//              nächste "next" den Swap A→B.
//   Szene B  → SpaceMorph übernimmt (next/prev/canGoNext/…); "prev"
//              am Anfang schaltet zurück zu Szene A.
// ============================================================
const DenseMerge = (() => {
	'use strict';
	const SLIDE_ID = 'slide-dense-layer';
	const FADE_MS = 450;
	let scene = 0;        // 0 = A (NeuronIntro), 1 = B (SpaceMorph)
	let swapping = false;

	function slideEl() { return document.getElementById(SLIDE_ID); }
	function wrap() { return document.getElementById('dl-scene-wrap'); }
	function sm() { return (typeof SpaceMorph !== 'undefined') ? SpaceMorph : null; }

	function allSceneAFragmentsVisible() {
		const el = slideEl();
		if (!el) return false;
		const frags = el.querySelectorAll('.fragment');
		if (!frags.length) return false;
		return Array.prototype.every.call(frags, f => f.classList.contains('visible'));
	}

	function toB() {
		if (scene === 1 || swapping) return;
		swapping = true; scene = 1;
		const w = wrap(); if (w) w.classList.add('in-b');
		const s = sm();
		setTimeout(() => { if (s) s.init(); }, 60);
		setTimeout(() => { swapping = false; }, FADE_MS + 90);
	}

	function toA() {
		if (scene === 0 || swapping) return;
		swapping = true; scene = 0;
		const s = sm(); if (s) s.reset();
		const w = wrap(); if (w) w.classList.remove('in-b');
		setTimeout(() => { swapping = false; }, FADE_MS + 90);
	}

	function canGoNext() {
		if (swapping) return false;
		if (scene === 0) return allSceneAFragmentsVisible();
		const s = sm(); return !!(s && s.canGoNext());
	}
	function canGoPrev() {
		if (swapping) return false;
		if (scene === 0) return false;   // Fragmente/System regeln prev
		return true;                      // Szene B: immer zurück (Step oder A)
	}
	function next() {
		if (scene === 0) { toB(); return; }
		const s = sm(); if (s) s.next();
	}
	function prev() {
		if (scene !== 1) return;
		const s = sm();
		if (s && s.canGoPrev()) { s.prev(); return; }
		toA();
	}
	function block() {
		if (swapping) return true;
		if (scene === 1) { const s = sm(); return !!(s && s.isAnimating()); }
		return false;
	}
	function reset() {
		scene = 0; swapping = false;
		const w = wrap(); if (w) w.classList.remove('in-b');
		const s = sm(); if (s) s.reset();
	}
	function onEnter() { reset(); }
	function onLeave() { reset(); }
	function getState() { return { scene: scene, sm: (sm() ? sm().getState() : null) }; }
	function setState(st) {
		if (!st) return;
		const s = sm();
		const w = wrap();
		if (st.scene === 1) {
			scene = 1; if (w) w.classList.add('in-b');
			if (s) { s.init(); if (st.sm) s.setState(st.sm); }
		} else {
			scene = 0; if (w) w.classList.remove('in-b');
			if (s) s.reset();
		}
		swapping = false;
	}
	return { canGoNext, canGoPrev, next, prev, block, reset, onEnter, onLeave, getState, setState };
})();
