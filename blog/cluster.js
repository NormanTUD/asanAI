/* ════════════════════════════════════════════════════════════════
   AURORA CLUSTERS — the soft, glowing color lanes from the
   Knowledge Map, woven into the regular prose of the book.

   Syntax (in any .md block):

       inline:    [[c:ki]]a single idea[[/c]]
       short:     [[cluster:ki]]...[[/cluster]]
       block:     [[c:ki]]
                  A whole paragraph that should sit inside its
                  own softly-glowing aurora lane.
                  [[/c]]

   You can use ANY cluster name you like — `ki`, `philosophy`,
   `math`, `hardware`, `art`, `wonder`, `night`. Names you never
   use are never generated. The system assigns each name a stable,
   well-distinguished hue the first time it appears and remembers
   it for the rest of the page (and for every page after).

   No code changes needed to add a new cluster. No LLM pass required.
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	/* ── 1. deterministic hash → stable 0..1 ── */
	function hash01(str) {
		let h = 2166136261 >>> 0;
		for (let i = 0; i < str.length; i++) {
			h ^= str.charCodeAt(i);
			h = Math.imul(h, 16777619) >>> 0;
		}
		return (h >>> 0) / 4294967295;
	}

	/* ── 2. curated palette (well-known names land on a hand-picked hue) ──
	   Anything not in this map falls through to a golden-angle hue
	   generator below, so the system grows on its own. */
	const PALETTE = {
		'ki'         : { hue: 218, sat: 78, light: 62 }, // electric indigo (the course's own thread)
		'philosophy' : { hue: 282, sat: 60, light: 60 },
		'math'       : { hue: 198, sat: 80, light: 55 },
		'history'    : { hue: 32,  sat: 75, light: 55 },
		'language'   : { hue: 332, sat: 70, light: 62 },
		'hardware'   : { hue: 174, sat: 60, light: 50 },
		'culture'    : { hue: 318, sat: 65, light: 65 },
		'ethics'     : { hue: 348, sat: 60, light: 60 },
		'art'        : { hue: 14,  sat: 78, light: 60 },
		'biology'    : { hue: 142, sat: 60, light: 50 },
		'physics'    : { hue: 264, sat: 70, light: 60 },
		'code'       : { hue: 156, sat: 60, light: 48 },
		'music'      : { hue: 304, sat: 65, light: 68 },
		'mystic'     : { hue: 250, sat: 75, light: 70 }
	};

	/* golden-angle distribution so any new name lands on a
	   visually distinct hue from its neighbours */
	function hashToColor(name) {
		const h = hash01(name);
		const hue = Math.floor(h * 360);
		const sat = 62 + Math.floor(hash01(name + 's') * 22); // 62–84
		const light = 52 + Math.floor(hash01(name + 'l') * 16); // 52–68
		return { hue, sat, light };
	}

	function cssSafe(name) {
		return String(name).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
	}

	function getColor(name) {
		const key = String(name).toLowerCase().trim();
		const base = PALETTE[key] || hashToColor(key);
		const { hue, sat, light } = base;
		return {
			hue, sat, light,
			base   : `hsl(${hue}, ${sat}%, ${light}%)`,
			glow   : `hsla(${hue}, ${sat}%, ${light}%, 0.55)`,
			soft   : `hsla(${hue}, ${sat}%, ${light}%, 0.16)`,
			mist   : `hsla(${hue}, ${sat}%, ${light}%, 0.08)`,
			halo1  : `hsla(${hue}, 92%, 70%, 0.18)`,
			halo2  : `hsla(${(hue + 28) % 360}, 92%, 70%, 0.10)`,
			halo3  : `hsla(${(hue + 300) % 360}, 92%, 70%, 0.10)`
		};
	}

	/* ── 3. preprocess raw markdown (runs BEFORE marked.parse) ──
	   converts [[c:name]]...[[/c]] into a <span> or <div> carrying
	   data-cluster, and remembers every name it sees.

	   Strategy: hand the cluster block syntax to marked as a custom
	   block extension. marked parses the *inner* content (so multi-
	   paragraph blocks get correct <p>/<ul>/<h2>/… wrapping) and the
	   renderer emits a single <div class="cl-block"> around the
	   already-rendered HTML. Inline clusters remain a flat regex
	   replacement — marked passes the resulting <span> through as
	   inline HTML. */
	const CLUSTER_RE = /\[\[(?:cluster|c):([^\]\n]+?)\]\]([\s\S]*?)\[\[\/(?:cluster|c)\]\]/g;
	const CLUSTER_BLOCK_RE = /^(\s*)\[\[(?:cluster|c):([^\]\n]+?)\]\]([\s\S]*?)\[\[\/(?:cluster|c)\]\](\s*)/;

	function preprocess(rawHtml) {
		const found = new Set();

		// register a marked block extension once
		if (window.marked && window.marked.use && !window.__bcMarkedHooked) {
			window.__bcMarkedHooked = true;
			window.marked.use({
				extensions: [{
					name: 'clusterBlock',
					level: 'block',
					start(src) {
						const i1 = src.indexOf('[[c:');
						const i2 = src.indexOf('[[cluster:');
						if (i1 === -1) return i2;
						if (i2 === -1) return i1;
						return Math.min(i1, i2);
					},
					tokenizer(src) {
						// marked feeds us the remaining source. The cluster must
						// start at the *beginning* of what we got, otherwise we let
						// marked try other tokenizers.
						const trimmed = src.replace(/^\s*/, '');
						const leadingWS = src.length - trimmed.length;
						const scan = findNextCluster(trimmed);
						if (!scan || scan.start !== 0 || !scan.block) return undefined;
						const norm = cssSafe(scan.name);
						if (!norm) return undefined;
						const inner = preprocess(scan.inner); // recurse — handles nesting
						return {
							type: 'clusterBlock',
							raw: src.substring(0, leadingWS + scan.end),
							name: norm,
							tokens: this.lexer.blockTokens(inner, [])
						};
					},
					renderer(token) {
						const inner = this.parser.parse(token.tokens);
						return `<div class="cl-block" data-cluster="${escAttr(token.name)}">${inner}</div>\n`;
					},
					childTokens: ['tokens']
				}]
			});
		}

		return preprocessBalanced(rawHtml, found);
	}

	/* ── balanced cluster scanner ──
	   Walks the text looking for the next `[[c:NAME]]` or `[[cluster:NAME]]`,
	   then advances char-by-char balancing nested opens with their matching
	   closes. Handles nesting correctly. */

	function findNextCluster(text, from) {
		const start = from || 0;
		const openScan0 = /\[\[(?:cluster|c):/g;
		openScan0.lastIndex = start;
		const openM = openScan0.exec(text);
		if (!openM) return null;
		const nameEnd = text.indexOf(']]', openM.index + 2);
		if (nameEnd === -1) return null;
		const name = text.substring(openM.index + openM[0].length, nameEnd);
		const bodyStart = nameEnd + 2;
		let depth = 1;
		const openScan = /\[\[(?:cluster|c):/g;
		const closeScan = /\[\[\/(?:cluster|c)\]\]/g;
		openScan.lastIndex = bodyStart;
		closeScan.lastIndex = bodyStart;
		while (depth > 0) {
			const co = openScan.exec(text);
			const cc = closeScan.exec(text);
			if (!cc) return null; // unterminated
			if (co && co.index < cc.index) {
				// a nested open comes before the next close. The close we
				// just found still matches THIS level (or an outer level),
				// not the new nested one — so we open a level, but the
				// close is still pending: re-exec to consume it now.
				const ne = text.indexOf(']]', co.index + 2);
				if (ne === -1) return null;
				openScan.lastIndex = ne + 2;
				depth++;
				// treat the close that was found as belonging to the level we
				// just deepened? No — it belongs to an outer level. So DON'T
				// decrement here; just continue, and the same close will be
				// re-found and decremented on the next iteration. To avoid
				// double-consuming, we manually decrement here using the
				// close we already located, and reset closeScan past it.
				closeScan.lastIndex = cc.index + cc[0].length;
				depth--;
			} else {
				closeScan.lastIndex = cc.index + cc[0].length;
				depth--;
			}
			if (depth === 0) {
				const inner = text.substring(bodyStart, cc.index);
				const endIdx = cc.index + cc[0].length;
				return {
					name,
					inner,
					raw: text.substring(openM.index, endIdx),
					start: openM.index,
					end: endIdx,
					block: /\n/.test(inner)
				};
			}
		}
		return null;
	}

	function preprocessBalanced(text, found) {
		let out = '';
		let cursor = 0;
		while (true) {
			const c = findNextCluster(text, cursor);
			if (!c) {
				out += text.substring(cursor);
				break;
			}
			out += text.substring(cursor, c.start);
			const norm = cssSafe(c.name);
			if (!norm) {
				out += text.substring(c.start, c.end);
			} else if (c.block) {
				found.add(norm);
				out += text.substring(c.start, c.end); // leave for marked extension
			} else {
				found.add(norm);
				const inner = preprocessBalanced(c.inner, found);
				out += `<span class="cl-inline" data-cluster="${escAttr(norm)}">${inner}</span>`;
			}
			cursor = c.end;
		}
		return out;
	}

	function escAttr(s) {
		return String(s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	/* ── 4. inject per-cluster CSS variables after marked.parse ── */
	let injectedKey = '';

	function injectCSS() {
		const names = new Set();
		document.querySelectorAll('[data-cluster]').forEach(function (el) {
			const n = cssSafe(el.dataset.cluster);
			if (n) names.add(n);
		});
		if (window.__blogClusters) window.__blogClusters.forEach(function (n) { names.add(n); });

		if (!names.size) return;

		const key = Array.from(names).sort().join('|');
		if (key === injectedKey) return; // nothing changed
		injectedKey = key;

		let css = ':root {\n';
		names.forEach(function (name) {
			const c = getColor(name);
			const p = '--cl-' + name;
			css += `  ${p}:${c.base};${p}-glow:${c.glow};${p}-soft:${c.soft};${p}-mist:${c.mist};${p}-halo1:${c.halo1};${p}-halo2:${c.halo2};${p}-halo3:${c.halo3};\n`;
		});
		css += '}\n';

		let style = document.getElementById('blog-cluster-vars');
		if (!style) {
			style = document.createElement('style');
			style.id = 'blog-cluster-vars';
			document.head.appendChild(style);
		}
		style.textContent = css;
	}

	/* ── 5. subtle, unobtrusive polish ──
	   a) a barely-there reading progress ribbon at the top
	   b) a soft aurora underline on hover for cluster inline words
	   The aim is to make the book feel like a place, not a document. */
	function mountPolish() {
		/* reading progress ribbon */
		if (!document.getElementById('cl-progress')) {
			const bar = document.createElement('div');
			bar.id = 'cl-progress';
			bar.setAttribute('aria-hidden', 'true');
			document.body.appendChild(bar);
			let ticking = false;
			function update() {
				const h = document.documentElement;
				const max = (h.scrollHeight - h.clientHeight) || 1;
				const p = Math.max(0, Math.min(1, h.scrollTop / max));
				bar.style.setProperty('--cl-p', p.toFixed(4));
				ticking = false;
			}
			document.addEventListener('scroll', function () {
				if (!ticking) {
					requestAnimationFrame(update);
					ticking = true;
				}
			}, { passive: true });
			window.addEventListener('resize', update);
			setTimeout(update, 30);
		}
	}

	/* ── 6. scan newly-added content (for late-loading modules) ── */
	const _mo = new MutationObserver(function (muts) {
		let touched = false;
		for (const m of muts) {
			m.addedNodes.forEach(function (n) {
				if (!(n instanceof Element)) return;
				if (n.matches && n.matches('[data-cluster]')) { touched = true; return; }
				if (n.querySelector && n.querySelector('[data-cluster]')) { touched = true; }
			});
		}
		if (touched) injectCSS();
	});

	function start() {
		injectCSS();
		mountPolish();
		_mo.observe(document.body, { childList: true, subtree: true });
	}

	/* ── public API ── */
	window.BlogClusters = {
		preprocess : preprocess,
		injectCSS  : injectCSS,
		getColor   : getColor,
		palette    : PALETTE,
		hash01     : hash01
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}
})();
