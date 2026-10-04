"use strict";

// =============================================================
// INTRO ANIMATION
// -------------------------------------------------------------
// 1. Phone-Animation (Folie: "Was sind Large Language Models?")
//    Beats: Logo → Mikrofon → Text → Denken → Antwort → Code →
//           Output → Bild → Statement → Frage (Brücke zur nächsten Folie)
// 2. Token-Splitting (Folie: "Tokenisierung")
//    Beats: Token-Reihe → "himmel" knackt → "him" + "mel"
// =============================================================

const IntroAnim = (() => {
	// ============================================================
	// SHARED HELPERS
	// ============================================================
	const SATZ = 'warum ist der himmel blau?';
	const PIC_PROMPT = 'Generier mir ein photorealistisches Bild einer Katze';
	const THINK_MS = 100;   // max. Wartezeit auf die drei Denk-Punkte
	const TYPE_MS = 13;     // ms pro Zeichen im Suchfeld
	const SEARCH_UP_MS = 320; // wie lange das Suchfeld braucht, nach oben zu fahren
	const CODE_LINES = [
		[{ t: '# Rayleigh-Streuung in Luft', c: 'cmt' }],
		[{ t: 'K_B = ' }, { t: '1.380649e-23', c: 'num' }, { t: '   # J/K', c: 'cmt' }],
		[{ t: '' }],
		[{ t: 'def ', c: 'kw' }, { t: 'streuung', c: 'fn' }, { t: '(laenge, p, t):' }],
		[{ t: '    dichte = p / (K_B * t)' }],
		[{ t: '    return dichte / laenge ** 4' }],
		[{ t: '' }],
		[{ t: 'blau = ', c: 'fn' }, { t: 'streuung(', c: 'fn' }, { t: '450e-9', c: 'num' },
		 { t: ', ' }, { t: '1e5', c: 'num' }, { t: ', ' }, { t: '293', c: 'num' }, { t: ')' }],
		[{ t: 'rot  = ', c: 'fn' }, { t: 'streuung(', c: 'fn' }, { t: '650e-9', c: 'num' },
		 { t: ', ' }, { t: '1e5', c: 'num' }, { t: ', ' }, { t: '293', c: 'num' }, { t: ')' }],
		[{ t: 'print(f"', c: 'fn' }, { t: 'Blau wird {blau/rot:.2f}x stärker gestreut als Rot")' }],
	];
	const AI_TEXT = [
		{ t: 'Der Himmel ist blau, weil Luftmoleküle kurzwelliges Licht stärker streuen als langwelliges. Blau (450 nm) wird etwa 4× mehr gestreut als Rot (650 nm) — ' },
		{ t: 'Rayleigh-Streuung', c: 'b' },
		{ t: '.' },
	];

	function lineHtml(ln) {
		return ln.map(tk => tk.c ? '<span class="ia-' + tk.c + '">' + tk.t + '</span>' : tk.t).join('');
	}

	// ============================================================
	// PHONE ANIMATION (Folie: Was sind Large Language Models?)
	// ============================================================
	const Phone = (() => {
		const stage = {};
		let beatTimers = [];
		let typeTimer = null;
		let aiTimer = null;
		let bubbleTimer = null;
		let searchTypeTimer = null;
		let currentBeat = -1;

		function $(id) { return stage[id]; }

		function later(fn, ms) {
			const id = setTimeout(fn, ms);
			beatTimers.push(id);
		}
		function clearTimers() {
			beatTimers.forEach(clearTimeout);
			beatTimers = [];
			if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
			if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
			if (bubbleTimer) { clearTimeout(bubbleTimer); bubbleTimer = null; }
			if (searchTypeTimer) { clearInterval(searchTypeTimer); searchTypeTimer = null; }
		}

		function resetAll() {
			clearTimers();
			if (!stage.stage) return;

			function safe(el, fn) { if (el) fn(el); }

			safe($('phone'), p => {
				p.style.transform = 'translate(-50%, -50%) scale(0.6)';
				p.style.opacity = '0';
				p.classList.remove('levitate');
			});
			safe($('logo'), l => {
				l.style.opacity = '0';
				l.classList.remove('breathe');
			});
			safe($('searchText'), s => {
				s.classList.remove('typing');
				s.textContent = '';
			});
			setSearchCentered(true);
			safe($('micBtn'), m => m.classList.remove('listening'));
			safe($('waveform'), w => w.classList.remove('active'));
			safe($('aiCard'), a => a.classList.remove('on'));
			safe($('aiText'), t => t.innerHTML = '');
			safe($('aiThinking'), a => a.classList.remove('on'));
			safe($('serpList'), s => s.classList.remove('on'));
			safe($('codeWin'), w => {
				w.classList.remove('on');
				w.style.transform = '';
				w.style.opacity = '';
			});
			safe($('cwCode'), c => c.innerHTML = '');
			safe($('termWin'), w => {
				w.classList.remove('on');
				w.style.transform = '';
				w.style.opacity = '';
			});
			safe($('cwOut'), o => o.classList.remove('on'));
			safe($('chatWin'), w => {
				w.classList.remove('on');
				w.style.transform = '';
				w.style.opacity = '';
			});
			safe($('chatPrompt'), p => p.innerHTML = '');
			safe($('chatAi'), a => a.classList.remove('on'));
			safe($('statement'), s => s.classList.remove('on', 'question'));
			safe($('capCode'), c => c.style.opacity = '0');
			safe($('capPic'), c => c.style.opacity = '0');
			safe($('ttower'), t => {
				t.classList.remove('on');
			});
			safe($('ttAnswer'), t => t.classList.remove('lit'));
			safe($('ttCode'), t => t.classList.remove('lit'));
			safe($('ttPic'), t => t.classList.remove('lit'));
		}

		function setPhone(scale, opacity) {
			const p = $('phone');
			if (!p) return;
			p.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
			p.style.opacity = opacity;
		}

		function setCodeWindow(scale, opacity) {
			const w = $('codeWin');
			if (!w) return;
			if (opacity >= 1) w.classList.add('on');
			w.style.transform = scale >= 1 ? '' : 'scale(' + scale + ')';
			w.style.opacity = opacity;
		}

		function setTermWindow(scale, opacity) {
			const w = $('termWin');
			if (!w) return;
			if (opacity >= 1) w.classList.add('on');
			w.style.transform = scale >= 1 ? '' : 'scale(' + scale + ')';
			w.style.opacity = opacity;
		}

		function setChatWindow(scale, opacity) {
			const w = $('chatWin');
			if (!w) return;
			if (opacity >= 1) w.classList.add('on');
			w.style.transform = scale >= 1 ? '' : 'translate(-50%, -50%) scale(' + scale + ')';
			w.style.opacity = opacity;
		}

		// Suchfeld zentriert (Anfang) vs. nach oben gerückt (Content erscheint).
		function setSearchCentered(on) {
			const sb = stage.searchBar;
			if (sb) sb.classList.toggle('centered', !!on);
		}

		function typeSearch(text, onDone) {
			if (searchTypeTimer) { clearInterval(searchTypeTimer); searchTypeTimer = null; }
			const el = $('searchText');
			if (!el) return;
			el.classList.add('typing');
			el.innerHTML = '<span class="ia-caret"></span>';
			let i = 0;
			searchTypeTimer = setInterval(() => {
				if (i < text.length) {
					i++;
					el.innerHTML = text.slice(0, i) + '<span class="ia-caret"></span>';
				} else {
					clearInterval(searchTypeTimer);
					searchTypeTimer = null;
					el.classList.remove('typing');
					el.innerHTML = text;
					if (onDone) later(onDone, 0);
				}
			}, TYPE_MS);
		}

		// Tippt in eine Chat-Bubble (mit blinkendem Cursor).
		function typeBubble(el, text, msPerChar, onDone) {
			if (!el) { if (onDone) later(onDone, 0); return; }
			// Bei sehr kleinen Werten (<8ms/Zeichen) mehrere Zeichen pro
			// 16ms-Tick tippen — setTimeout clamps sonst auf ~4ms und die
			// Wunschgeschwindigkeit (z.B. 8× schneller) würde nicht erreicht.
			const fast = msPerChar < 8;
			const perTick = fast ? Math.max(1, Math.round(16 / msPerChar)) : 1;
			const interval = fast ? 16 : msPerChar;
			let i = 0;
			function tick() {
				i = Math.min(text.length, i + perTick);
				if (i >= text.length) {
					el.textContent = text;
					bubbleTimer = null;
					if (onDone) later(onDone, 0);
					return;
				}
				el.innerHTML = text.slice(0, i) + '<span class="ia-msg-caret"></span>';
				bubbleTimer = setTimeout(tick, interval);
			}
			el.innerHTML = '<span class="ia-msg-caret"></span>';
			bubbleTimer = setTimeout(tick, fast ? 8 : interval);
		}

		function renderCode(instant) {
			const cwCode = $('cwCode');
			cwCode.innerHTML = CODE_LINES.map((ln) =>
				'<div class="ia-cl' + (instant ? ' show' : '') + '">' + lineHtml(ln) + '</div>'
			).join('');
		}

		function startCodeTyping() {
			if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
			renderCode(false);
			const lines = $('cwCode').querySelectorAll('.ia-cl');
			let i = 0;
			typeTimer = setInterval(() => {
				if (i > 0) lines[i - 1].classList.remove('cur');
				if (i < lines.length) {
					lines[i].classList.add('show', 'cur');
					i++;
				}
				if (i >= lines.length) {
					clearInterval(typeTimer); typeTimer = null;
				}
			}, 190);
		}

		function startAiTyping() {
			if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
			const aiText = $('aiText');
			aiText.innerHTML = '';
			const spans = AI_TEXT.map(seg => {
				const s = document.createElement('span');
				if (seg.c) s.className = 'ia-' + seg.c;
				aiText.appendChild(s);
				return s;
			});
			// Antwort soll schnell auftauchen: mehrere Zeichen pro 16ms-Tick
			// (ein Pro-Zeichen-Timeout clamped auf ~4ms und wäre dadurch zu langsam).
			const perTick = 8;
			let si = 0, ci = 0;
			function tick() {
				let remaining = perTick;
				while (remaining > 0 && si < spans.length) {
					const seg = AI_TEXT[si];
					const take = Math.min(remaining, seg.t.length - ci);
					ci += take;
					remaining -= take;
					spans[si].textContent = seg.t.slice(0, ci);
					if (ci >= seg.t.length) { si++; ci = 0; }
				}
				if (si >= spans.length) { aiTimer = null; return; }
				aiTimer = setTimeout(tick, 16);
			}
			// Erstes Zeichen sofort (ohne Timeout-Wartung), damit die Antwort
			// direkt mit Beat 3 sichtbar wird.
			tick();
		}

		function setTower(lit) {
			s('ttower', t => t.classList.toggle('on', !!lit));
			s('ttAnswer', t => t.classList.toggle('lit', !!(lit && lit.includes('answer'))));
			s('ttCode', t => t.classList.toggle('lit', !!(lit && lit.includes('code'))));
			s('ttPic', t => t.classList.toggle('lit', !!(lit && lit.includes('pic'))));
		}

		function s(id, fn) { const e = stage[id]; if (e) fn(e); }

		// Auto-Advance-Timer: Die drei Denk-Punkte (Beat 3) stehen maximal
		// THINK_MS — danach geht es von selbst zur Antwort weiter.
		let autoAdvanceTimer = null;
		function clearAutoAdvance() {
			if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
		}
		function scheduleAutoAdvance(toBeat, ms) {
			clearAutoAdvance();
			autoAdvanceTimer = setTimeout(() => {
				autoAdvanceTimer = null;
				setBeat(toBeat);
			}, ms);
		}

		// ---- Beats ------------------------------------------------
		const beats = [
			function () {
				// 0: Phone mit Logo, idle — statisch, kein Auf/Ab-Schweben,
				//    kein "Breathe"-Scale (sonst weicht das Logo von Beat zu Beat ab)
				clearAutoAdvance();
				resetAll();
				setPhone(1, 1);
				s('logo', l => l.style.opacity = '1');
			},
			function () {
				// 1: Mikrofon blinkt + Suchtext tippt gleichzeitig ins Suchfeld
				clearAutoAdvance();
				resetAll();
				setPhone(1, 1);
				s('logo', l => l.style.opacity = '1');
				s('micBtn', m => m.classList.add('listening'));
				s('waveform', w => w.classList.add('active'));
				typeSearch(SATZ, () => setBeat(2));
			},
			function () {
				// 2: Suchfeld fährt smooth & schnell nach oben, dann denkt die KI
				clearAutoAdvance();
				resetAll();
				setPhone(1, 1);
				s('logo', l => l.style.opacity = '1');
				s('searchText', t => t.textContent = SATZ);
				setSearchCentered(false);  // Suchfeld rückt nach oben
				// Content taucht erst auf, nachdem das Suchfeld oben ist.
				later(() => {
					s('aiCard', a => a.classList.add('on'));
					s('aiThinking', a => a.classList.add('on'));
				}, SEARCH_UP_MS);
				scheduleAutoAdvance(3, SEARCH_UP_MS + THINK_MS);
			},
			function () {
				// 3: KI antwortet (taucht schnell auf) + SERP
				clearAutoAdvance();
				resetAll();
				setPhone(1, 1);
				s('logo', l => l.style.opacity = '1');
				s('searchText', t => t.textContent = SATZ);
				setSearchCentered(false);
				s('aiCard', a => a.classList.add('on'));
				startAiTyping();
				s('serpList', s => s.classList.add('on'));
			},
			function () {
				// 4: Chat-Fenster mit Frage, Antwort und Code-Block
				clearAutoAdvance();
				resetAll();
				setCodeWindow(1, 1);
				s('capCode', c => c.style.opacity = '1');
				startCodeTyping();
			},
			function () {
				// 5: Code fertig — Terminal darunter zeigt Aufruf + Output
				clearAutoAdvance();
				resetAll();
				setCodeWindow(1, 1);
				s('capCode', c => c.style.opacity = '1');
				renderCode(true);
				setTermWindow(1, 1);
				s('cwOut', o => o.classList.add('on'));
			},
			function () {
				// 6: Bilder generieren (Chat): Prompt tippen, dann das Bild
				clearAutoAdvance();
				resetAll();
				setChatWindow(1, 1);
				s('capPic', c => c.style.opacity = '1');
				later(() => {
					// Prompt ~8× schneller als das alte 22ms/Zeichen
					typeBubble($('chatPrompt'), PIC_PROMPT, 22 / 8,
						() => s('chatAi', a => a.classList.add('on')));
				}, 400);
			},
			function () {
				// 7: Statement
				clearAutoAdvance();
				resetAll();
				s('statement', st => st.classList.add('on'));
			},
			function () {
				// 8: Frage — Brücke zur nächsten Folie („Die Wirklichkeit hat
				//    mathematische Muster"): Der nächste Folienwechsel ist die
				//    Antwort auf diese Frage.
				clearAutoAdvance();
				resetAll();
				s('statement', st => st.classList.add('on', 'question'));
			},
		];

		function setBeat(n) {
			if (n < 0 || n >= beats.length) return;
			if (!isReady()) {
				const slide = document.getElementById('slide-was-sind-llm');
				if (slide && init(slide)) {
					return setBeat(n);
				}
				return;
			}
			currentBeat = n;
			beats[n]();
			updateStepBar();
		}

		function updateStepBar() {
			const bar = document.getElementById('ia-phone-step-bar');
			if (!bar) return;
			bar.querySelectorAll('button').forEach((b, i) => {
				b.classList.toggle('active', i === currentBeat);
			});
		}

		// ============================================================
		// GUARDRAIL 1 + 2: init() ist idempotent und retry-fähig.
		// - Wenn die DOM-Elemente noch nicht da sind, retry in 50ms.
		// - Wenn alle kritischen Elemente fehlen, schlägt init() fehl
		//   UND setBeat() merkt das und rendert nichts (kein Crash,
		//   kein leeres Phone).
		// - Doppelaufrufe sind sicher: nur der erste setzt die
		//   Step-Bar-Buttons.
		// ============================================================
		function isReady() {
			// Mindestens die Bühne muss da sein — der Rest wird per
			// safe() in den Beats ohnehin null-gecheckt.
			return !!stage.stage;
		}

		function init(slideEl) {
			if (!slideEl) return false;
			stage.stage     = slideEl.querySelector('.ia-stage');
			stage.phone     = slideEl.querySelector('.ia-phone');
			stage.logo      = slideEl.querySelector('.ia-app-logo');
			stage.searchText = slideEl.querySelector('.ia-search-text');
			stage.searchBar  = slideEl.querySelector('.ia-search-bar');
			stage.micBtn    = slideEl.querySelector('.ia-mic-btn');
			stage.waveform  = slideEl.querySelector('.ia-waveform');
			stage.aiCard    = slideEl.querySelector('.ia-ai-card');
			stage.aiText    = slideEl.querySelector('.ia-ai-text');
			stage.aiThinking = slideEl.querySelector('.ia-ai-thinking');
			stage.serpList  = slideEl.querySelector('.ia-serp');
			stage.codeWin   = slideEl.querySelector('.ia-llm-chat');
			stage.cwCode    = slideEl.querySelector('.ia-cw-code');
			stage.termWin   = slideEl.querySelector('.ia-term-window');
			stage.cwOut     = slideEl.querySelector('.ia-cw-out');
			stage.chatWin   = slideEl.querySelector('.ia-chat-window');
			stage.chatPrompt = slideEl.querySelector('.ia-chat-window .ia-chat-msg.user');
			stage.chatAi    = slideEl.querySelector('.ia-chat-window .ia-chat-msg.ai');
			stage.statement = slideEl.querySelector('.ia-statement');
			stage.capCode   = slideEl.querySelector('.ia-cap-code');
			stage.capPic    = slideEl.querySelector('.ia-cap-pic');
			stage.ttower    = slideEl.querySelector('.ia-ttower');
			stage.ttAnswer  = slideEl.querySelector('.ia-tt-head-answer');
			stage.ttCode    = slideEl.querySelector('.ia-tt-head-code');
			stage.ttPic     = slideEl.querySelector('.ia-tt-head-pic');

			// Step-Bar Buttons — nur einmal verdrahten (Buttons sind eindeutig)
			const bar = slideEl.querySelector('#ia-phone-step-bar');
			if (bar && !bar.dataset.iaWired) {
				bar.dataset.iaWired = '1';
				bar.querySelectorAll('button').forEach((b, i) => {
					b.onclick = () => setBeat(i);
				});
			}

			// FIX: isReady() prüft drei Elemente. Wenn auch nur eines fehlt,
			// returnt init false OHNE die anderen Stages zu initialisieren.
			// Wir lockern das: wenn die kritischsten Elemente (stage, phone,
			// logo) da sind, geht's los. Die anderen sind optional.
			const critical = stage.stage && stage.phone && stage.logo;
			if (!critical) return false;

			// Sicherer Beat-0-Aufruf: wenn currentBeat -1 ist, initialisieren
			if (currentBeat < 0) currentBeat = 0;
			try {
				beats[0]();
			} catch (e) {
				// Stage-Elemente könnten sich geändert haben — setze zurück
				return false;
			}
			updateStepBar();
			return true;
		}

		// Folie verlassen: Timer stoppen, Beat zurücksetzen — beim nächsten
		// Besuch startet die Animation wieder von vorn.
		function reset() {
			clearTimers();
			clearAutoAdvance();
			currentBeat = 0;
		}

		return {
			init, setBeat, reset, getBeat: () => currentBeat,
			lastBeat: beats.length - 1,
			isReady,
			get stage() { return stage; },
		};
	})();

	// ============================================================
	// TOKEN ANIMATION (Folie: Tokenisierung)
	// ============================================================
	const Tokens = (() => {
		const stage = {};
		let timers = [];
		let currentBeat = -1;

		const FULL = ['warum', 'ist', 'der', 'himmel', 'blau'];
		const SPLIT = ['warum', 'ist', 'der', 'him', 'mel', 'blau'];

		function later(fn, ms) {
			const id = setTimeout(fn, ms);
			timers.push(id);
		}
		function clearTimers() {
			timers.forEach(clearTimeout);
			timers = [];
		}

		function render(list, freshKeys) {
			const layer = stage.layer;
			if (!layer) return;
			layer.innerHTML = list.map(t => {
				const fresh = freshKeys && freshKeys.includes(t) ? ' fresh' : '';
				return '<div class="ia-token-pill' + fresh + '">' + t + '</div>';
			}).join('');
		}

		function makePill(text, fresh) {
			const el = document.createElement('div');
			el.className = 'ia-token-pill' + (fresh ? ' fresh' : '');
			el.textContent = text;
			return el;
		}

		function isReady() {
			return !!(stage.layer && stage.label);
		}

		// Zwei Schritte: Beat 0 = ganze Wörter, Beat 1 = tokenisiertes
		// Ergebnis. Ein Pfeil-Druck macht EINEN Smooth-Wechsel
		// („himmel" → „him"+"mel") — kein Reset/Fade-Blitz der ganzen Reihe
		// (das sah aus wie „mehrfach durchgehen").
		function setBeat(n) {
			if (n < 0 || n > 1) return;
			// GUARDRAIL 2: nicht rendern, wenn init() nicht erfolgreich war
			if (!isReady()) return;
			clearTimers();
			currentBeat = n;
			stage.layer.classList.add('on');
			stage.label.classList.add('on');
			if (n === 0) {
				render(FULL);
				stage.label.innerHTML = '<span class="ia-acc">Tokenisierung</span> — der Computer teilt anders als wir';
				stage.sub.classList.remove('on');
			} else {
				stage.label.innerHTML = '<span class="ia-acc">Tokenisierung</span> — möglichst viel Inhalt, möglichst wenige Bausteine';
				const layer = stage.layer;
				const himmel = Array.from(layer.querySelectorAll('.ia-token-pill'))
					.find(p => p.textContent.trim() === 'himmel');
				if (himmel) {
					// „him"+"mel" an der Stelle von „himmel" einfügen (popt
					// smooth rein), „himmel" parallel zusammenklappen lassen.
					const him = makePill('him', true);
					const mel = makePill('mel', true);
					himmel.before(him, mel);
					requestAnimationFrame(() => {
						himmel.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
						himmel.style.transform = 'scale(0.15)';
						himmel.style.opacity = '0';
					});
					later(() => { if (himmel.isConnected) himmel.remove(); }, 430);
				} else {
					render(SPLIT, ['him', 'mel']);
				}
				later(() => { stage.sub.classList.add('on'); }, 500);
			}
			updateStepBar();
		}

		function updateStepBar() {
			const bar = document.getElementById('ia-tokens-step-bar');
			if (!bar) return;
			bar.querySelectorAll('button').forEach(b => {
				const db = parseInt(b.dataset.beat, 10);
				b.classList.toggle('active', !isNaN(db) && db === currentBeat);
			});
		}

		function init(slideEl) {
			if (!slideEl) return false;
			stage.layer = slideEl.querySelector('.ia-tokens-layer');
			stage.label = slideEl.querySelector('.ia-tokens-label');
			stage.sub   = slideEl.querySelector('.ia-tokens-sub');

			// Step-Bar Buttons nur einmal verdrahten
			const bar = slideEl.querySelector('#ia-tokens-step-bar');
			if (bar && !bar.dataset.iaWired) {
				bar.dataset.iaWired = '1';
				bar.querySelectorAll('button').forEach(b => {
					b.onclick = () => setBeat(parseInt(b.dataset.beat, 10) || 0);
				});
			}

			if (!isReady()) return false;
			currentBeat = 0;
			setBeat(0);
			return true;
		}

		function reset() {
			clearTimers();
			currentBeat = 0;
		}

		return {
			init, setBeat, reset, getBeat: () => currentBeat,
			lastBeat: 1,
			isReady,
			get stage() { return stage; },
		};
	})();

	// ============================================================
	// AUTO-HOOK: Beim Betreten der Folien aktivieren
	// ============================================================
	function watchSlides() {
		// Slides erst HIER holen — Intro-Skript läuft möglicherweise
		// bevor sie im DOM sind. Wir warten, bis mindestens eine da
		// ist, damit die Closure-Variablen nicht halbleer bleiben
		// (sonst greift der Pfeiltasten-Hook ins Leere und wirft
		// Nullpointer).
		let phoneSlide = (typeof document !== 'undefined') ? document.getElementById('slide-was-sind-llm') : null;
		let tokenSlide = (typeof document !== 'undefined') ? document.getElementById('slide-tokenisierung') : null;
		if (!phoneSlide && !tokenSlide) {
			setTimeout(watchSlides, 50);
			return;
		}

		// FIX 2: activate-Funktionen sind jetzt VOLLSTÄNDIG idempotent.
		// Sie versuchen init() JEDES MAL, wenn nicht ready — nicht nur
		// beim ersten Mal. Vergleich gegen IDs (robuster).
		function activatePhone() {
			const slide = phoneSlide && phoneSlide.isConnected
				? phoneSlide
				: document.getElementById('slide-was-sind-llm');
			if (!slide) return false;
			phoneSlide = slide;
			if (!Phone.isReady()) {
				if (!Phone.init(slide)) return false;
			}
			// Render Beat 0 sofort, damit beim Wechsel der Logo sichtbar ist.
			Phone.setBeat(0);
			return true;
		}
		function activateTokens() {
			const slide = tokenSlide && tokenSlide.isConnected
				? tokenSlide
				: document.getElementById('slide-tokenisierung');
			if (!slide) return false;
			tokenSlide = slide;
			if (!Tokens.isReady()) {
				if (!Tokens.init(slide)) return false;
			}
			Tokens.setBeat(0);
			return true;
		}

		// Wenn eine Anim-Folie verlassen wurde (Button-Klick, Zifferntasten,
		// goTo …), steht sie intern noch auf dem letzten Beat. Beat
		// zurücksetzen, damit ein späterer Besuch wieder von vorn startet.
		function syncBeats() {
			const active = document.querySelector('.slide.active');
			const onPhone = !!active && (active === phoneSlide || active.id === 'slide-was-sind-llm');
			const onTokens = !!active && (active === tokenSlide || active.id === 'slide-tokenisierung');
			if (!onPhone && Phone.isReady()) Phone.reset();
			if (!onTokens && Tokens.isReady()) Tokens.reset();
			return { onPhone, onTokens };
		}

		// Die Anim-Folien schlucken die Pfeiltasten: jeder Tastendruck ist
		// ein Beat, auch Beat 0 (von dort startet die Animation ja erst).
		function isAnimating() {
			const { onPhone, onTokens } = syncBeats();
			return onPhone || onTokens;
		}

		function phoneEl() { return phoneSlide || document.getElementById('slide-was-sind-llm'); }
		function tokenEl() { return tokenSlide || document.getElementById('slide-tokenisierung'); }

		// Achtung: Solange presentation.js noch nicht gelaufen ist, ist der
		// Bezeichner "Presentation" nicht die Engine, sondern ein Named-Access-
		// Objekt des Browsers. Deshalb nicht auf typeof prüfen, sondern an der
		// API der Engine (slides/goTo/next/prev) festmachen.
		function engine() {
			try {
				if (typeof Presentation === 'undefined' || !Presentation) return null;
				if (typeof Presentation.slides !== 'function') return null;
				if (typeof Presentation.goTo !== 'function') return null;
				if (typeof Presentation.next !== 'function') return null;
				if (typeof Presentation.prev !== 'function') return null;
				return Presentation;
			} catch (e) {
				return null;
			}
		}

		function isSingleSlide() {
			const p = engine();
			return !!p && p.slides().length === 1;
		}

		function animNext() {
			const { onPhone, onTokens } = syncBeats();
			if (onPhone) {
				if (!Phone.isReady() && !Phone.init(phoneEl())) return;
				const b = Phone.getBeat();
				if (b < Phone.lastBeat) Phone.setBeat(b + 1);
				// Einzige Folie im Deck: am Ende wieder von vorn starten,
				// statt einen leeren Folienwechsel zu animieren.
				else if (isSingleSlide()) Phone.setBeat(0);
				else { const p = engine(); if (p) p.next(); }
			} else if (onTokens) {
				if (!Tokens.isReady() && !Tokens.init(tokenEl())) return;
				const b = Tokens.getBeat();
				if (b < Tokens.lastBeat) Tokens.setBeat(b + 1);
				else if (isSingleSlide()) Tokens.setBeat(0);
				else { const p = engine(); if (p) p.next(); }
			}
		}

		function animPrev() {
			const { onPhone, onTokens } = syncBeats();
			if (onPhone) {
				if (!Phone.isReady() && !Phone.init(phoneEl())) return;
				const b = Phone.getBeat();
				if (b > 0) Phone.setBeat(b - 1);
				else if (!isSingleSlide()) { const p = engine(); if (p) p.prev(); }
			} else if (onTokens) {
				if (!Tokens.isReady() && !Tokens.init(tokenEl())) return;
				const b = Tokens.getBeat();
				if (b > 0) Tokens.setBeat(b - 1);
				else if (!isSingleSlide()) { const p = engine(); if (p) p.prev(); }
			}
		}

		// FIX 6: Polling deutlich schneller (50ms statt 100ms), und beim
		// ersten Erfolg stoppen statt erst beim zweiten Match. So vergeht
		// zwischen Pfeiltaste und Beat-Wechsel maximal ~50ms statt ~400ms.
		let pollHandle = null;
		function stopPolling() {
			if (pollHandle) { clearTimeout(pollHandle); pollHandle = null; }
		}

		// Nach jedem Folienwechsel die Animation der Ziel-Folie (neu) starten.
		function scheduleActivate() {
			const a0 = document.querySelector('.slide.active');
			if (a0 && (a0.id === 'slide-was-sind-llm' || a0.id === 'slide-tokenisierung')) {
				if (a0.id === 'slide-was-sind-llm') { activatePhone(); return; }
				activateTokens();
				return;
			}
			stopPolling();
			let attempts = 0;
			const tryActivate = () => {
				attempts++;
				const a = document.querySelector('.slide.active');
				if (a && a.id === 'slide-was-sind-llm') {
					if (activatePhone()) stopPolling();
					else if (attempts < 16) pollHandle = setTimeout(tryActivate, 50);
					else stopPolling();
				} else if (a && a.id === 'slide-tokenisierung') {
					if (activateTokens()) stopPolling();
					else if (attempts < 16) pollHandle = setTimeout(tryActivate, 50);
					else stopPolling();
				} else if (attempts < 16) {
					pollHandle = setTimeout(tryActivate, 50);
				} else {
					stopPolling();
				}
			};
			tryActivate();
		}

		// Hook in Presentation.goTo / next / prev — wartet, bis die Engine da
		// ist. next/prev sind wichtig, weil sie die interne goTo() nutzen,
		// der goTo-Hook also nicht durchläuft (Button-Klick, Tastatur, Ziffern).
		function hookPresentation() {
			const p = engine();
			if (!p) {
				setTimeout(hookPresentation, 50);
				return;
			}
			if (p.__iaHooked) return;
			p.__iaHooked = true;
			const origGoTo = p.goTo;
			p.goTo = function(idx, showAllFragments) {
				const r = origGoTo.call(this, idx, showAllFragments);
				scheduleActivate();
				return r;
			};
			const origNext = p.next;
			p.next = function() {
				const r = origNext.apply(this, arguments);
				scheduleActivate();
				return r;
			};
			const origPrev = p.prev;
			p.prev = function() {
				const r = origPrev.apply(this, arguments);
				scheduleActivate();
				return r;
			};
		}
		hookPresentation();

		// FIX 8: Pfeiltasten-Handler greift zuverlässig. capture: true +
		// stopImmediatePropagation verhindert, dass Presentation's Handler
		// (oder ein anderer Listener) ebenfalls feuert und einen Slide-Wechsel
		// auslöst, während wir einen Beat-Wechsel machen.
		document.addEventListener('keydown', (e) => {
			if (!isAnimating()) return;
			// Nur die "weiter"-Tasten abfangen — andere (z.B. F für Fullscreen)
			// gehen weiterhin durch.
			if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'ArrowDown') {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				animNext();
			} else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'ArrowUp' || e.key === 'Backspace') {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				animPrev();
			}
		}, true);  // capture, damit wir vor dem Presentation-Handler drankommen

		// Nach dem Boot: wenn eine der Anim-Folien Startfolie ist, Beat 0
		// rendern. Der Timeout stellt sicher, dass Presentation.init() (das
		// beim DOMContentLoaded die aktive Folie setzt) schon durch ist.
		document.addEventListener('DOMContentLoaded', () => {
			setTimeout(() => {
				const a = document.querySelector('.slide.active');
				if (a && a.id === 'slide-was-sind-llm') activatePhone();
				else if (a && a.id === 'slide-tokenisierung') activateTokens();
			}, 0);
		});

		// activatePhone/activateTokens liegen in watchSlides() und werden
		// hier nach außen gestellt (Konsole / Tests).
		api.activatePhone = activatePhone;
		api.activateTokens = activateTokens;
	}

	// activatePhone/activateTokens liegen in watchSlides() und sind von
	// außen nicht direkt erreichbar — watchSlides() hängt sie an die api.
	const api = { Phone, Tokens, watchSlides };

	// watchSlides läuft sofort — unser interner Retry-Mechanismus
	// wartet sowieso, bis die Slides da sind. Kein Warten auf
	// DOMContentLoaded (das in manchen Browser-Setups zu spät feuert).
	watchSlides();

	if (typeof window !== 'undefined') {
		window.IntroAnim = api;
	}
	return api;
})();
