(function () {
	'use strict';

	var SHOW_DELAY = 320;
	var HIDE_GRACE = 110;
	var EDGE = 10;
	var MAX_CACHE = 80;

	var fine = !!(window.__LKP_FORCE__)
		|| (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
	var built = false;
	var cache = {};
	var inflight = {};
	var card = null;
	var cardImg = null;
	var cardTitle = null;
	var cardCaption = null;
	var cardIcon = null;
	var showTimer = null;
	var hideTimer = null;
	var hoverLink = null;
	var pendingSrc = '';
	var lastData = null;
	var visible = false;
	var _ta = null;

	var CSS = [
		':root{--lkp-bg:rgba(253,250,241,0.95);--lkp-arrow:rgba(253,250,241,1);--lkp-ph:linear-gradient(135deg,rgba(120,112,98,0.08),rgba(120,112,98,0.22));}',
		'html.dark{--lkp-bg:rgba(21,32,54,0.95);--lkp-arrow:rgba(21,32,54,1);--lkp-ph:linear-gradient(135deg,rgba(51,65,85,0.30),rgba(51,65,85,0.55));}',
		'.lkp-card{position:fixed;z-index:100001;width:280px;margin:0;border-radius:14px;overflow:hidden;',
		'border:1px solid var(--mn-border);background:var(--lkp-bg);',
		'backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2);',
		'box-shadow:var(--mn-shadow-xl),0 0 0 0.5px rgba(127,127,127,0.10);',
		'opacity:0;visibility:hidden;pointer-events:none;transform:translateY(7px) scale(0.97);',
		'transition:opacity .16s ease,transform .18s cubic-bezier(.22,1,.36,1),visibility 0s linear .18s;}',
		'.lkp-card.lkp-show{opacity:1;visibility:visible;pointer-events:auto;transform:none;',
		'transition:opacity .16s ease,transform .18s cubic-bezier(.22,1,.36,1);}',
		'.lkp-card::after{content:"";position:absolute;left:50%;bottom:-5.5px;width:11px;height:11px;',
		'background:var(--lkp-arrow);border-right:1px solid var(--mn-border);border-bottom:1px solid var(--mn-border);',
		'transform:translateX(-50%) rotate(45deg);}',
		'.lkp-card.lkp-below::after{bottom:auto;top:-5.5px;border-right:0;border-bottom:0;',
		'border-left:1px solid var(--mn-border);border-top:1px solid var(--mn-border);}',
		'.lkp-media{position:relative;height:156px;background:var(--lkp-ph);}',
		'.lkp-media::after{content:"";position:absolute;inset:0;',
		'background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,0.35) 100%);}',
		'.lkp-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;',
		'opacity:0;transform:scale(1.05);transition:opacity .4s ease,transform 5s cubic-bezier(.22,1,.36,1);}',
		'.lkp-card.lkp-loaded .lkp-img{opacity:1;transform:scale(1);}',
		'.lkp-body{padding:11px 14px 12px;}',
		'.lkp-icon{font-size:34px;line-height:1.1;text-align:center;margin-bottom:6px;}',
		'.lkp-title{font-family:var(--mn-font-prose);font-size:15.5px;font-weight:600;line-height:1.3;',
		'color:var(--mn-heading);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
		'.lkp-caption{margin-top:4px;font-size:12px;line-height:1.45;color:var(--mn-text-secondary);',
		'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
		'.lkp-card.lkp-noimg .lkp-media{display:none;}',
		'.lkp-card.lkp-noimg .lkp-body{padding-top:16px;padding-bottom:15px;}',
		'@media (prefers-reduced-motion:reduce){.lkp-card,.lkp-img{transition:none;}}'
	].join('\n');

	function lessonSlug(href) {
		if (!href) return null;
		if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) return null;
		var h = href;
		var hash = h.indexOf('#');
		if (hash !== -1) h = h.slice(0, hash);
		if (!h || h.charAt(0) === '/') return null;
		if (h.indexOf('?') !== -1 || h.indexOf('\\') !== -1) return null;
		var segs = h.split('/');
		if (segs.length > 2) return null;
		for (var i = 0; i < segs.length; i++) {
			if (!/^[a-z0-9_-]+(\.php)?$/i.test(segs[i])) return null;
		}
		var slug = segs[segs.length - 1].replace(/\.php$/i, '');
		var here = (location.pathname.split('/').pop() || '').replace(/\.php$/i, '');
		if (slug === here) return null;
		return segs.join('/');
	}

	function okImg(el) {
		var src = el.getAttribute('src') || '';
		if (!src || /^data:/i.test(src)) return false;
		var st = el.getAttribute('style') || '';
		if (/display\s*:\s*none/i.test(st)) return false;
		var name = src.split('/').pop().split('?')[0];
		if (/^(logo|icon|favicon|sprite)/i.test(name)) return false;
		return true;
	}

	function citeText(macro, display, key) {
		if (display) return display;
		var bib = window.bibData;
		var e = bib && key ? bib[key] : null;
		if (!e) return '';
		if (macro === 'citetitle') return e.title || '';
		if (macro === 'citealternativetitle') return e.alternativetitle || e.title || '';
		if (macro === 'citeauthor' || macro === 'citeauthorlastnameand') return e.author || '';
		if (macro === 'citeyear') return e.year ? String(e.year) : '';
		if (macro === 'cite' || macro === 'footcite') {
			var a = e.author || '';
			return a ? a + (e.year ? ', ' + e.year : '') : '';
		}
		return '';
	}

	function cleanCaption(raw) {
		if (!raw) return '';
		var t = String(raw);
		t = t.replace(/\\([a-zA-Z]+)(?:\[([^\]]*)\])?\{([^{}]+)\}/g, function (m, macro, d, key) {
			return citeText(macro, d, key);
		});
		t = t.replace(/\\[a-zA-Z]+\{[^{}]*\}/g, '');
		t = t.replace(/\\[a-zA-Z]+/g, '');
		t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
		t = t.replace(/[*_`~#]/g, '');
		t = t.replace(/\s+/g, ' ').trim();
		return t.replace(/^[,.;:\s]+/, '');
	}

	function decodeEntities(s) {
		if (!s) return '';
		if (!_ta) _ta = document.createElement('textarea');
		_ta.innerHTML = s;
		return _ta.value;
	}

	function metaComment(html) {
		var out = { title: '', icon: '' };
		var m = html.match(/COURSE_METADATA:([\s\S]*?)\n-->/);
		if (!m) return out;
		var t = m[1].match(/^title:\s*(.+?)\s*$/m);
		var ic = m[1].match(/^icon:\s*(.+?)\s*$/m);
		if (t) out.title = decodeEntities(t[1]);
		if (ic) out.icon = decodeEntities(ic[1]);
		return out;
	}

	function parsePage(html, baseUrl) {
		var doc;
		try {
			doc = new DOMParser().parseFromString(html, 'text/html');
		} catch (e) {
			return null;
		}
		var scope = doc.getElementById('contents') || doc.body;
		if (!scope) return null;
		var out = { title: '', caption: '', src: '', icon: '' };
		var meta = metaComment(html);
		out.title = meta.title;
		out.icon = meta.icon;

		var h1 = scope.querySelector('h1');
		if (h1) {
			var ht = (h1.textContent || '').replace(/\s+/g, ' ').trim();
			if (ht) out.title = ht;
		}
		if (!out.title) {
			var tt = doc.querySelector('title');
			if (tt && (tt.textContent || '').trim()) out.title = tt.textContent.trim();
		}
		if (!out.title) return null;

		var figures = scope.querySelectorAll('figure');
		var fig = null;
		var im = null;
		var i;
		for (i = 0; i < figures.length; i++) {
			var cand = figures[i].querySelector('img');
			if (cand && okImg(cand)) {
				im = cand;
				fig = figures[i];
				break;
			}
		}
		if (!im) {
			var imgs = scope.querySelectorAll('img');
			for (i = 0; i < imgs.length; i++) {
				if (okImg(imgs[i])) {
					im = imgs[i];
					break;
				}
			}
		}
		if (im) {
			var src = im.getAttribute('src') || '';
			try {
				out.src = new URL(src, baseUrl).href;
			} catch (e) {
				out.src = src;
			}
			if (fig) {
				var fc = fig.querySelector('figcaption');
				if (fc) out.caption = cleanCaption(fc.textContent || '');
			}
		}
		if (!out.src) {
			var mm = html.match(/\\(?:marginfig|sideimage)(?:\[[^\]]*\])?\{([^}]+)\}/);
			if (mm) {
				try {
					out.src = new URL(mm[1].trim(), baseUrl).href;
				} catch (e) {
					out.src = mm[1].trim();
				}
			}
		}
		return out;
	}

	function fetchPreview(relUrl) {
		if (relUrl in cache) return Promise.resolve(cache[relUrl]);
		if (inflight[relUrl]) return inflight[relUrl];
		var absUrl;
		try {
			absUrl = new URL(relUrl, window.location.href).href;
		} catch (e) {
			absUrl = relUrl;
		}
		var p = fetch(absUrl, { credentials: 'same-origin' })
			.then(function (res) {
				if (!res.ok) throw new Error('http');
				return res.text();
			})
			.then(function (html) {
				return parsePage(html, absUrl);
			})
			.catch(function () {
				return null;
			})
			.then(function (data) {
				cache[relUrl] = data;
				delete inflight[relUrl];
				var keys = Object.keys(cache);
				if (keys.length > MAX_CACHE) delete cache[keys[0]];
				return data;
			});
		inflight[relUrl] = p;
		return p;
	}

	function buildCard() {
		var style = document.createElement('style');
		style.textContent = CSS;
		document.head.appendChild(style);

		card = document.createElement('div');
		card.className = 'lkp-card';
		card.setAttribute('aria-hidden', 'true');

		var media = document.createElement('div');
		media.className = 'lkp-media';
		cardImg = document.createElement('img');
		cardImg.className = 'lkp-img';
		cardImg.setAttribute('alt', '');
		media.appendChild(cardImg);

		var body = document.createElement('div');
		body.className = 'lkp-body';
		cardIcon = document.createElement('div');
		cardIcon.className = 'lkp-icon';
		cardIcon.style.display = 'none';
		cardTitle = document.createElement('div');
		cardTitle.className = 'lkp-title';
		cardCaption = document.createElement('div');
		cardCaption.className = 'lkp-caption';
		body.appendChild(cardIcon);
		body.appendChild(cardTitle);
		body.appendChild(cardCaption);

		card.appendChild(media);
		card.appendChild(body);
		document.body.appendChild(card);

		cardImg.addEventListener('load', function () {
			if (cardImg.getAttribute('src') === pendingSrc) card.classList.add('lkp-loaded');
		});
		cardImg.addEventListener('error', function () {
			if (!visible || cardImg.getAttribute('src') !== pendingSrc) return;
			card.classList.add('lkp-noimg');
			if (lastData && lastData.icon) cardIcon.style.display = '';
			if (hoverLink) positionFor(hoverLink);
		});
	}

	function positionFor(link) {
		if (!card || !link) return;
		var r = link.getBoundingClientRect();
		var w = card.offsetWidth || 280;
		var h = card.offsetHeight || 200;
		var x = r.left + r.width / 2 - w / 2;
		x = Math.max(EDGE, Math.min(x, Math.max(EDGE, window.innerWidth - w - EDGE)));
		var y = r.top - h - 9;
		var below = y < EDGE;
		if (below) y = r.bottom + 9;
		if (y + h > window.innerHeight - EDGE) y = Math.max(EDGE, window.innerHeight - h - EDGE);
		card.style.left = Math.round(x) + 'px';
		card.style.top = Math.round(y) + 'px';
		card.classList.toggle('lkp-below', below);
	}

	function hideNow() {
		if (hideTimer) {
			clearTimeout(hideTimer);
			hideTimer = null;
		}
		if (showTimer) {
			clearTimeout(showTimer);
			showTimer = null;
		}
		if (card) card.classList.remove('lkp-show');
		visible = false;
	}

	function scheduleHide() {
		if (hideTimer) clearTimeout(hideTimer);
		hideTimer = setTimeout(hideNow, HIDE_GRACE);
	}

	function reveal(link, data) {
		if (!card || !data || !data.title) {
			hideNow();
			return;
		}
		lastData = data;
		cardTitle.textContent = data.title;
		var cap = (data.caption || '').trim();
		if (cap.length < 12) cap = '';
		cardCaption.textContent = cap;
		cardCaption.style.display = cap ? '' : 'none';
		var hasImg = !!data.src;
		card.classList.toggle('lkp-noimg', !hasImg);
		cardIcon.style.display = (!hasImg && data.icon) ? '' : 'none';
		if (hasImg) {
			var same = cardImg.getAttribute('src') === data.src;
			if (!same) {
				card.classList.remove('lkp-loaded');
				cardImg.setAttribute('src', data.src);
			}
			pendingSrc = data.src;
			if (same && cardImg.complete) card.classList.add('lkp-loaded');
		} else {
			pendingSrc = '';
		}
		positionFor(link);
		card.classList.add('lkp-show');
		visible = true;
	}

	function arm(link) {
		if (showTimer) clearTimeout(showTimer);
		showTimer = setTimeout(function () {
			showTimer = null;
			if (hoverLink !== link) return;
			var url = lessonSlug(link.getAttribute('href'));
			if (!url) return;
			if (url in cache) {
				reveal(link, cache[url]);
				return;
			}
			fetchPreview(url).then(function (data) {
				if (hoverLink === link) reveal(link, data);
			});
		}, SHOW_DELAY);
	}

	function onOver(e) {
		var t = e.target;
		if (!t || !t.closest) return;
		if (t.closest('.lkp-card')) {
			if (hideTimer) {
				clearTimeout(hideTimer);
				hideTimer = null;
			}
			return;
		}
		var a = t.closest('a[href]');
		if (!a) return;
		if (hoverLink === a) return;
		hoverLink = a;
		if (hideTimer) {
			clearTimeout(hideTimer);
			hideTimer = null;
		}
		arm(a);
	}

	function onOut(e) {
		var to = e.relatedTarget;
		if (to && to.closest) {
			if (to.closest('.lkp-card')) return;
			if (to.closest('a[href]') === hoverLink) return;
		}
		scheduleHide();
	}

	function begin() {
		if (built) return;
		built = true;
		try {
			if (!fine) return;
			if (!('DOMParser' in window) || typeof fetch !== 'function') return;
			buildCard();
			document.addEventListener('mouseover', onOver, true);
			document.addEventListener('mouseout', onOut, true);
			document.addEventListener('mousedown', function (e) {
				var t = e.target;
				if (t && t.closest && t.closest('.lkp-card')) return;
				hideNow();
			}, true);
			window.addEventListener('scroll', hideNow, { passive: true, capture: true });
			document.addEventListener('keydown', function (e) {
				if (e.key === 'Escape') hideNow();
			}, true);
			window.addEventListener('blur', hideNow);
		} catch (err) {
			built = false;
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', begin);
	} else {
		begin();
	}
})();
