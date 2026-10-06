(function () {
	'use strict';

	var ALLOWED = { accent: 1, coral: 1, emerald: 1, rose: 1, sky: 1, 'text-secondary': 1 };
	var built = false;
	var subCache = {};
	var CARET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>';

	// Margin layout: the dock lives in the left margin, its right edge kept
	// GAP px clear of the centered reading column. Hidden when that margin
	// can't fit MIN_W (i.e. phones / narrow screens / reader mode).
	var LEFT_PAD = 24, GAP = 22, MAX_W = 500, MIN_W = 240;
	var spy = { items: [], activeList: null, active: null, ticking: false };

	function safeColor(c) { return (c && ALLOWED[c]) ? 'var(--mn-' + c + ')' : 'var(--mn-accent)'; }
	function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }

	function headerText(h) {
		var c = h.cloneNode(true);
		c.querySelectorAll('svg, img, [data-mjx-annotation], annotation, .cl-h-anchor, .toc-meta').forEach(function (x) { x.remove(); });
		return (c.textContent || '').replace(/\s+/g, ' ').trim();
	}

	function currentSubs() {
		var out = [];
		var contents = document.getElementById('contents');
		if (contents) {
			Array.prototype.slice.call(contents.querySelectorAll('h2, h3')).forEach(function (h) {
				out.push({ level: h.tagName === 'H3' ? 3 : 2, text: headerText(h), id: h.id, _h: h });
			});
		}
		return out;
	}

	function spyTick() {
		spy.ticking = false;
		if (!spy.items.length) return;
		var y = window.scrollY + 130;
		var active = null;
		for (var i = 0; i < spy.items.length; i++) {
			var it = spy.items[i];
			if (!it.h) continue;
			var r = it.h.getBoundingClientRect();
			if (r.height === 0) continue;
			if (r.top + window.scrollY <= y) active = it;
		}
		if (active === spy.active) return;
		spy.active = active;
		if (spy.activeList) {
			var marks = spy.activeList.querySelectorAll('.chsw-sub.is-active');
			for (var j = 0; j < marks.length; j++) marks[j].classList.remove('is-active');
		}
		if (active && active.a) active.a.classList.add('is-active');
	}

	function fillSubs(sub, m, isCurrent, done) {
		if (sub.dataset.filled === '1') { if (done) done(); return; }
		sub.dataset.filled = '1';
		var render = function (list) {
			while (sub.firstChild) sub.removeChild(sub.firstChild);
			var pairs = [];
			list.forEach(function (h) {
				var li = el('li');
				var a = el('a', 'chsw-sub chsw-sub-l' + (h.level === 3 ? '3' : '2'));
				var label = h.text || '';
				a.textContent = label;
				a.title = label;
				if (isCurrent && h._h) {
					var target = h._h;
					a.href = '#' + (target.id || '');
					if (target.id) pairs.push({ h: target, a: a });
					a.addEventListener('click', function (e) {
						e.preventDefault();
						if (typeof revealAncestorOptionalBlocks === 'function') revealAncestorOptionalBlocks(target);
						var unfolded = 0;
						if (window.BlogTopics && window.BlogTopics.revealAncestorsOf) unfolded = window.BlogTopics.revealAncestorsOf(target) || 0;
						if (target.id) { try { history.replaceState(null, '', '#' + target.id); } catch (x) { } }
						if (unfolded) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 280);
						else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
					});
				} else {
					a.href = m.url + '#' + h.id;
				}
				li.appendChild(a);
				sub.appendChild(li);
			});
			if (isCurrent) {
				spy.items = pairs;
				spy.activeList = sub;
				spy.active = null;
				spyTick();
			}
			if (done) done();
		};
		if (isCurrent) { render(currentSubs()); return; }
		var slug = m.slug;
		if (subCache[slug] !== undefined) { render(subCache[slug]); return; }
		fetch('headings.php?lesson=' + encodeURIComponent(slug))
			.then(function (r) { return r.ok ? r.json() : { headings: [] }; })
			.then(function (data) { subCache[slug] = (data && data.headings) || []; render(subCache[slug]); })
			.catch(function () { subCache[slug] = []; render([]); });
	}

	function makeCaret(m, chap) {
		var caret = el('button', 'chsw-caret');
		caret.type = 'button';
		caret.setAttribute('aria-expanded', 'false');
		caret.setAttribute('aria-label', 'Sections: ' + m.title);
		caret.innerHTML = CARET;
		caret.addEventListener('click', function (e) {
			e.stopPropagation();
			var sub = chap.querySelector('.chsw-sublist');
			if (chap.classList.contains('open')) {
				chap.classList.remove('open');
				caret.setAttribute('aria-expanded', 'false');
				return;
			}
			if (!chap.classList.contains('is-current') && sub.dataset.filled !== '1') {
				sub.innerHTML = '<li class="chsw-loading">Loading&hellip;</li>';
			}
			fillSubs(sub, m, chap.classList.contains('is-current'), function () {
				if (sub.children.length === 0) { caret.remove(); return; }
				chap.classList.add('open');
				caret.setAttribute('aria-expanded', 'true');
			});
		});
		return caret;
	}

	function buildChapter(m, num, isCur) {
		var chap = el('div', 'chsw-chap' + (isCur ? ' is-current' : ''));
		chap.dataset.title = m.title;
		var row = el('a', 'chsw-row');
		row.href = m.url;
		var n = el('span', 'chsw-num'); n.textContent = String(num);
		var t = el('span', 'chsw-t'); t.textContent = m.title; t.title = m.title;
		row.appendChild(n);
		row.appendChild(t);
		chap.appendChild(row);
		chap.appendChild(makeCaret(m, chap));
		chap.appendChild(el('ul', 'chsw-sublist'));
		return chap;
	}

	function buildPanel(panel, modules, cur) {
		var head = el('div', 'chsw-head');
		var title = el('div', 'chsw-title');
		title.textContent = 'Chapters';
		var sub = el('div', 'chsw-sub');
		var curMod = modules[cur];
		sub.textContent = (curMod && curMod.part ? 'Part ' + curMod.part + ' \u00b7 ' : '') + (cur + 1) + ' of ' + modules.length;
		head.appendChild(title);
		head.appendChild(sub);
		panel.appendChild(head);

		var searchRow = el('div', 'chsw-search');
		var icon = el('span', 'chsw-search-ico');
		icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path></svg>';
		var search = el('input', 'chsw-search-input');
		search.type = 'search';
		search.placeholder = 'Search chapters';
		search.setAttribute('aria-label', 'Search chapters');
		searchRow.appendChild(icon);
		searchRow.appendChild(search);
		panel.appendChild(searchRow);

		var bar = el('div', 'chsw-bar');
		var fill = el('div', 'chsw-bar-fill');
		fill.style.width = Math.round(((cur + 1) / modules.length) * 100) + '%';
		bar.appendChild(fill);
		panel.appendChild(bar);

		var list = el('div', 'chsw-list');
		var lastPart = null;
		var inPart = 0;
		modules.forEach(function (m, i) {
			if (m.part !== lastPart) {
				if (lastPart !== null) list.appendChild(el('div', 'chsw-gap'));
				lastPart = m.part;
				inPart = 0;
				var label = el('div', 'chsw-part-label');
				label.textContent = 'Part ' + m.part;
				list.appendChild(label);
			}
			inPart++;
			list.appendChild(buildChapter(m, inPart, i === cur));
		});
		panel.appendChild(list);
		return list;
	}

	function honorHash() {
		if (!window.location.hash) return;
		var id = window.location.hash.slice(1);
		if (!id) return;
		var tries = 0;
		(function attempt() {
			var target = document.getElementById(id);
			var contents = document.getElementById('contents');
			var visible = contents && window.getComputedStyle(contents).display !== 'none';
			if (target && visible) {
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
			} else if (tries < 60) {
				tries++;
				setTimeout(attempt, 120);
			}
		})();
	}

	function injectStyles() {
		var css = [
			'#chsw-dock { position: fixed; left: ' + LEFT_PAD + 'px; bottom: 20px; z-index: 9000; font-family: var(--mn-font-body); opacity: 0; visibility: hidden; transform: translateY(6px); transition: opacity .4s ease .12s, visibility .4s ease .12s, transform .4s ease .12s; }',
			'html.is-ready #chsw-dock { opacity: 1; visibility: visible; transform: translateY(0); }',

			'#chsw-pill { display: inline-flex; align-items: center; gap: 7px; padding: 6px 11px 6px 9px; border-radius: 999px; background: var(--mn-bg-glass); border: 1px solid var(--mn-border); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); box-shadow: var(--mn-shadow-md); cursor: pointer; color: var(--mn-text-secondary); font-family: var(--mn-font-body); transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease; }',
			'#chsw-pill:hover { border-color: var(--chsw-accent); transform: translateY(-1px); box-shadow: var(--mn-shadow-lg); }',
			'#chsw-pill:hover .chsw-chev { color: var(--chsw-accent); }',
			'#chsw-pill:active { transform: translateY(0) scale(.97); }',
			'#chsw-pill:focus-visible { outline: 2px solid var(--chsw-accent); outline-offset: 2px; }',
			'#chsw-dock.is-open #chsw-pill { border-color: var(--chsw-accent); box-shadow: var(--mn-shadow-lg); }',

			'.chsw-ring { width: 20px; height: 20px; flex: none; transform: rotate(-90deg); }',
			'.chsw-ring circle { fill: none; stroke-width: 2; }',
			'.chsw-ring-track { stroke: var(--mn-border); opacity: .55; }',
			'.chsw-ring-fill { stroke: var(--chsw-accent); stroke-linecap: round; }',
			'.chsw-count { font-size: .78rem; font-weight: 600; line-height: 1; letter-spacing: .01em; font-variant-numeric: tabular-nums; color: var(--mn-text-muted); }',
			'.chsw-count .chsw-cur { color: var(--chsw-accent); font-weight: 700; }',
			'.chsw-chev { width: 13px; height: 13px; flex: none; color: var(--mn-text-muted); transition: transform .25s cubic-bezier(0.22,1,0.36,1), color .2s ease; }',
			'#chsw-dock.is-open .chsw-chev { transform: rotate(180deg); }',

			'#chsw-panel { position: absolute; left: 0; bottom: calc(100% + 12px); width: 320px; max-width: calc(100vw - ' + (LEFT_PAD * 2) + 'px); max-height: min(66vh, 540px); display: flex; flex-direction: column; overflow: hidden; background: var(--mn-bg-glass); border: 1px solid var(--mn-border); border-radius: var(--mn-radius-lg); box-shadow: var(--mn-shadow-xl); -webkit-backdrop-filter: blur(22px) saturate(1.4); backdrop-filter: blur(22px) saturate(1.4); padding: 10px 8px 10px; opacity: 0; transform: translateY(10px) scale(.98); transform-origin: bottom left; pointer-events: none; transition: opacity .2s ease, transform .28s cubic-bezier(0.22,1,0.36,1); }',
			'#chsw-dock.is-open #chsw-panel { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }',
			'.chsw-list::-webkit-scrollbar { width: 8px; }',
			'.chsw-list::-webkit-scrollbar-track { background: transparent; }',
			'.chsw-list::-webkit-scrollbar-thumb { background: var(--mn-border); border-radius: 99px; }',

			'#chsw-head { flex: 0 0 auto; display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding: 2px 12px 8px; }',
			'#chsw-title { font-size: .84rem; font-weight: 700; color: var(--mn-heading); letter-spacing: .01em; }',
			'#chsw-sub { font-size: .68rem; color: var(--mn-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }',
			'#chsw-bar { flex: 0 0 auto; height: 3px; border-radius: 99px; background: var(--mn-border-light); overflow: hidden; margin: 0 12px 8px; }',
			'#chsw-bar-fill { height: 100%; border-radius: 99px; background: var(--chsw-accent); box-shadow: 0 0 7px var(--chsw-accent); transition: width .4s cubic-bezier(0.22,1,0.36,1); }',

			'#chsw-list { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; scrollbar-width: thin; }',
			'.chsw-part-label { font-size: .62rem; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: var(--mn-text-muted); padding: 12px 12px 6px; }',
			'.chsw-part-label:first-child { padding-top: 4px; }',
			'.chsw-gap { height: 1px; margin: 10px 12px; background: var(--mn-border); }',

			'.chsw-chap { display: flex; flex-wrap: wrap; align-items: center; border-radius: 10px; margin-bottom: 1px; }',
			'.chsw-chap:hover { background: var(--mn-bg-subtle); }',
			'.chsw-row { position: relative; flex: 1 1 0; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 7px 4px 7px 14px; color: var(--mn-text-secondary); text-decoration: none; transition: color .15s ease; }',
			'.chsw-chap:hover .chsw-row { color: var(--mn-text); }',
			'.chsw-chap.is-current { background: color-mix(in srgb, var(--chsw-accent) 11%, transparent); }',
			'.chsw-chap.is-current .chsw-row { color: var(--mn-heading); }',
			'.chsw-chap.is-current .chsw-row::before { content: ""; position: absolute; left: 5px; top: 50%; transform: translateY(-50%); width: 3px; height: 14px; border-radius: 3px; background: var(--chsw-accent); }',
			'.chsw-num { flex: none; min-width: 1.2em; text-align: right; font-size: .68rem; font-weight: 600; color: var(--mn-text-muted); font-variant-numeric: tabular-nums; }',
			'.chsw-chap.is-current .chsw-num { color: var(--chsw-accent); }',
			'.chsw-t { flex: 1; font-size: .84rem; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',

			'.chsw-caret { flex: 0 0 auto; width: 22px; height: 22px; margin: 0 5px 0 0; padding: 0; border: none; background: transparent; color: var(--mn-text-muted); cursor: pointer; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; transition: color .15s ease, background .15s ease; }',
			'.chsw-caret:hover { color: var(--chsw-accent); background: color-mix(in srgb, var(--chsw-accent) 12%, transparent); }',
			'.chsw-caret:focus-visible { outline: 2px solid var(--chsw-accent); outline-offset: 1px; }',
			'.chsw-caret svg { width: 14px; height: 14px; transition: transform .2s ease; }',
			'.chsw-chap.open .chsw-caret svg { transform: rotate(90deg); }',

			'.chsw-sublist { flex-basis: 100%; margin: 1px 10px 6px 18px; padding: 2px 0 2px 10px; list-style: none; border-left: 1px solid var(--mn-border-light); display: none; }',
			'.chsw-chap.open > .chsw-sublist { display: block; }',
			'.chsw-sub { position: relative; display: block; padding: 5px 8px; color: var(--mn-text-muted); font-size: .8rem; line-height: 1.35; text-decoration: none; border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color .15s ease, background .15s ease; }',
			'.chsw-sub:hover { color: var(--mn-text); background: var(--mn-bg-subtle); }',
			'.chsw-sub:focus-visible { outline: 2px solid var(--chsw-accent); outline-offset: -2px; }',
			'.chsw-sub-l3 { padding-left: 22px; font-size: .76rem; }',
			'.chsw-sub.is-active { color: var(--chsw-accent); font-weight: 600; }',
			'.chsw-sub.is-active::before { content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--chsw-accent); margin-right: 8px; vertical-align: middle; }',
			'.chsw-loading { padding: 5px 8px; font-size: .76rem; font-style: italic; color: var(--mn-text-muted); }',
			'.chsw-search { flex: 0 0 auto; position: relative; margin: 0 12px 8px; }',
			'.chsw-search-ico { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--mn-text-muted); pointer-events: none; }',
			'.chsw-search-ico svg { width: 100%; height: 100%; display: block; }',
			'.chsw-search-input { width: 100%; box-sizing: border-box; padding: 7px 10px 7px 30px; font: inherit; font-size: .8rem; color: var(--mn-text); background: var(--mn-bg-subtle); border: 1px solid var(--mn-border); border-radius: 9px; outline: none; transition: border-color .15s ease, box-shadow .15s ease; }',
			'.chsw-search-input:focus { border-color: var(--chsw-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--chsw-accent) 22%, transparent); }',
			'.chsw-search-input::placeholder { color: var(--mn-text-muted); }',
			'.chsw-chap.chsw-hidden { display: none; }',
			'.chsw-mark { background: color-mix(in srgb, var(--chsw-accent) 32%, transparent); color: inherit; border-radius: 3px; padding: 0 1px; }',
			'.chsw-empty { padding: 18px 12px; font-size: .8rem; color: var(--mn-text-muted); text-align: center; }',

			'@media (prefers-reduced-motion: reduce) { #chsw-dock, #chsw-dock * { transition: none !important; } }'
		].join('\n');
		var s = el('style');
		s.id = 'chsw-styles';
		s.textContent = css;
		document.head.appendChild(s);
	}

	function init() {
		if (built) return;
		var nav = window.__moduleNavData;
		// Only real course lessons: index / index_full / atlas / non-course
		// pages never set __moduleNavData or resolve a current index.
		if (!nav || !nav.modules || nav.current < 0 || nav.modules.length < 2) return;
		var contents = document.getElementById('contents');
		if (!contents) return;

		var modules = nav.modules;
		var cur = nav.current;
		var total = modules.length;
		var accent = safeColor(modules[cur] && modules[cur].color);

		var R = 8.25;
		var C = 2 * Math.PI * R;
		var pct = (cur + 1) / total;
		var off = C * (1 - pct);

		var dock = el('div');
		dock.id = 'chsw-dock';
		dock.style.setProperty('--chsw-accent', accent);

		var pill = el('button', 'chsw-pill');
		pill.id = 'chsw-pill';
		pill.type = 'button';
		pill.setAttribute('aria-haspopup', 'true');
		pill.setAttribute('aria-expanded', 'false');
		pill.setAttribute('aria-controls', 'chsw-panel');
		pill.setAttribute('title', 'Jump to a chapter');
		pill.setAttribute('aria-label', 'Jump to a chapter \u2014 ' + (cur + 1) + ' of ' + total);

		var ring = el('span');
		ring.innerHTML =
			'<svg class="chsw-ring" viewBox="0 0 22 22" aria-hidden="true">'
			+ '<circle class="chsw-ring-track" cx="11" cy="11" r="' + R + '"></circle>'
			+ '<circle class="chsw-ring-fill" cx="11" cy="11" r="' + R + '" '
			+ 'stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"></circle>'
			+ '</svg>';

		var count = el('span', 'chsw-count');
		var curS = el('span', 'chsw-cur');
		curS.textContent = String(cur + 1);
		var totS = el('span', 'chsw-tot');
		totS.textContent = '/' + total;
		count.appendChild(curS);
		count.appendChild(totS);

		var chev = el('span');
		chev.innerHTML =
			'<svg class="chsw-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
			+ 'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
			+ '<path d="M18 15l-6-6-6 6"></path></svg>';

		pill.appendChild(ring);
		pill.appendChild(count);
		pill.appendChild(chev);

		var panel = el('nav', 'chsw-panel');
		panel.id = 'chsw-panel';
		panel.setAttribute('aria-label', 'Chapters');
		var list = buildPanel(panel, modules, cur);

		dock.appendChild(pill);
		dock.appendChild(panel);
		document.body.appendChild(dock);
		injectStyles();

		// Measure the centered column and size the panel to the left margin.
		function layout() {
			var c = document.getElementById('contents');
			if (!c) return;
			var colLeft = c.getBoundingClientRect().left;
			var avail = colLeft - LEFT_PAD - GAP;
			if (avail < MIN_W) { dock.style.display = 'none'; return; }
			dock.style.display = '';
			panel.style.width = Math.min(MAX_W, avail) + 'px';
		}

		function centerOn(node) {
			if (!node) return;
			var target = (node.offsetTop - list.offsetTop) - (list.clientHeight - node.offsetHeight) / 2;
			list.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
		}

		var search = panel.querySelector('.chsw-search-input');
		var emptyMsg = el('div', 'chsw-empty');
		emptyMsg.textContent = 'No chapters match';
		emptyMsg.style.display = 'none';
		list.appendChild(emptyMsg);

		function resetTitle(t, title) { while (t.firstChild) t.removeChild(t.firstChild); t.textContent = title; }
		function highlightTitle(t, title, q) {
			while (t.firstChild) t.removeChild(t.firstChild);
			var idx = title.toLowerCase().indexOf(q);
			if (idx < 0) { t.textContent = title; return; }
			t.appendChild(document.createTextNode(title.slice(0, idx)));
			var mk = el('mark', 'chsw-mark');
			mk.textContent = title.slice(idx, idx + q.length);
			t.appendChild(mk);
			t.appendChild(document.createTextNode(title.slice(idx + q.length)));
		}
		function refreshGroups() {
			var nodes = Array.prototype.slice.call(list.children);
			var i, j;
			for (i = 0; i < nodes.length; i++) {
				var n = nodes[i];
				if (!n.classList.contains('chsw-part-label')) continue;
				var any = false;
				for (j = i + 1; j < nodes.length && !nodes[j].classList.contains('chsw-part-label'); j++) {
					if (nodes[j].classList.contains('chsw-chap') && !nodes[j].classList.contains('chsw-hidden')) { any = true; break; }
				}
				n.style.display = any ? '' : 'none';
			}
			for (i = 0; i < nodes.length; i++) {
				var g = nodes[i];
				if (!g.classList.contains('chsw-gap')) continue;
				var nx = g.nextElementSibling;
				g.style.display = (nx && nx.classList.contains('chsw-part-label') && nx.style.display === 'none') ? 'none' : '';
			}
		}
		function applySearch() {
			var q = (search.value || '').trim().toLowerCase();
			var chapters = Array.prototype.slice.call(list.querySelectorAll('.chsw-chap'));
			var anyVisible = false;
			if (!q) {
				chapters.forEach(function (c) { c.classList.remove('chsw-hidden'); resetTitle(c.querySelector('.chsw-t'), c.dataset.title); });
			} else {
				chapters.forEach(function (c) {
					var title = c.dataset.title || '';
					var match = title.toLowerCase().indexOf(q) !== -1;
					c.classList.toggle('chsw-hidden', !match);
					highlightTitle(c.querySelector('.chsw-t'), title, q);
					if (match) anyVisible = true;
				});
			}
			refreshGroups();
			emptyMsg.style.display = (q && !anyVisible) ? '' : 'none';
			if (q) list.scrollTop = 0;
		}
		search.addEventListener('input', applySearch);

		var open = false;
		var openedOnce = false;
		function setOpen(v) {
			open = v;
			dock.classList.toggle('is-open', v);
			pill.setAttribute('aria-expanded', v ? 'true' : 'false');
			if (!v) return;
			if (!openedOnce) {
				openedOnce = true;
				var curChap = list.querySelector('.chsw-chap.is-current');
				if (curChap) {
					var csub = curChap.querySelector('.chsw-sublist');
					fillSubs(csub, modules[cur], true, function () {
						var ccaret = curChap.querySelector('.chsw-caret');
						if (csub.children.length > 0) {
							curChap.classList.add('open');
							if (ccaret) ccaret.setAttribute('aria-expanded', 'true');
						} else if (ccaret) {
							ccaret.remove();
						}
						var activeLink = csub.querySelector('.chsw-sub.is-active');
						centerOn(activeLink || curChap.querySelector('.chsw-row'));
						if (document.activeElement === pill) {
							(activeLink || curChap.querySelector('.chsw-row')).focus();
						}
					});
				}
			}
		}

		pill.addEventListener('click', function (e) {
			e.stopPropagation();
			setOpen(!open);
		});
		document.addEventListener('click', function (e) {
			if (open && !dock.contains(e.target)) setOpen(false);
		});
		document.addEventListener('keydown', function (e) {
			if (e.key !== 'Escape' || !open) return;
			if (document.activeElement === search && search.value) { search.value = ''; applySearch(); return; }
			setOpen(false); pill.focus();
		});
		panel.addEventListener('keydown', function (e) {
			if (!open) return;
			if (document.activeElement === search) return;
			if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
			var foci = Array.prototype.filter.call(panel.querySelectorAll('a, button'), function (x) { return x.offsetParent !== null; });
			var i = foci.indexOf(document.activeElement);
			if (e.key === 'ArrowDown') { e.preventDefault(); foci[Math.min(foci.length - 1, i < 0 ? 0 : i + 1)].focus(); }
			else if (e.key === 'ArrowUp') { e.preventDefault(); foci[Math.max(0, i - 1)].focus(); }
			else if (e.key === 'Home') { e.preventDefault(); foci[0].focus(); }
			else if (e.key === 'End') { e.preventDefault(); foci[foci.length - 1].focus(); }
		});

		var rt;
		window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 100); });
		if (window.MutationObserver) {
			new MutationObserver(layout).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		}
		window.addEventListener('load', layout);
		window.addEventListener('scroll', function () {
			if (!spy.items.length || spy.ticking) return;
			spy.ticking = true;
			requestAnimationFrame(spyTick);
		}, { passive: true });

		layout();
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout, layout);
		honorHash();
		built = true;
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
