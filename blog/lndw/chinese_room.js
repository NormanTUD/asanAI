const CRSim = (() => {

	// ── 3 Beispiel-Runden für die Präsentation ──────────────────────────
	const rounds = [
		{
			input: "ᐅᓪᓗᒥ ᓯᓚ ᖃᓄᐃᒻᒪᖅ?",
			correct: "ᓯᓚ ᐊᒃᓱᕈᐊᓘᖅᒪᖅ ᐅᓪᓗᒥ",
			distractors: ["ᐃᒡᓗ ᐊᖏᓪᖅ", "ᓇᒃᓴᐅᓯᖅᒪ ᒪᒥᖅ", "ᐃᓄᒃ ᒐᒯᓪᖅ"],
			rules: [
				["ᐅᓪᓗᒥ ᓯᓚ ᖃᓄᐃᒻᒪᖅ?", "ᓯᓚ ᐊᒃᓱᕈᐊᓘᖅᒪᖅ ᐅᓪᓗᒥ"],
				["ᓇᒧᑦ?", "ᐅᓪᓗᒥ ᐅᓂᒃᓴᒃᓯᖅ"]
			],
			german: "F: Wie ist das Wetter heute? → A: Das Wetter ist heute rau."
		},
		{
			input: "ᐊᐃᑦᖅᓱᕈᐊᒪᖅ ᐊᐅᓚᖅ?",
			correct: "ᐄ, ᐊᓄᐊᕆ ᓴᖑᓪᓗᓂ",
			distractors: ["ᐅᖃᐅᑎᒫᒪᖅ ᐃᐅᓪᖅ", "ᓂᕆᓪᒪᓪᖅ ᐃᒻᒪᖅ", "ᒪᒃᓱ ᐊᖏᓪᖅ"],
			rules: [
				["ᐊᐃᑦᖅᓱᕈᐊᒪᖅ ᐊᐅᓚᖅ?", "ᐄ, ᐊᓄᐊᕆ ᓴᖑᓪᓗᓂ"],
				["ᖃᖑ?", "ᐅᓪᓗᒥ ᐅᓂᒃᓴᒃᓯᖅ"]
			],
			german: "F: Weht der Wind? → A: Ja, der Wind dreht sich."
		},
		{
			input: "ᓇᒧᑦ ᐊᐅᓚᖅᐃᑦᖅ?",
			correct: "ᓂᐅᕐᕈᕐᒧᑦ ᐊᐅᓚᖅᒪᖑ",
			distractors: ["ᐃᒡᓗ ᓯᓂᓪᖅᒥ", "ᐊᕈᓇᖅ ᐃᓱᒪᖅ", "ᓄᓇᕗᑦ ᐊᖏᓪᖅ"],
			rules: [
				["ᓇᒧᑦ ᐊᐅᓚᖅᐃᑦᖅ?", "ᓂᐅᕐᕈᕐᒧᑦ ᐊᐅᓚᖅᒪᖑ"],
				["ᖃᓄᐃᒻᒪᑦ?", "ᓂᕿᒃᓴᖅᓯᐅᕐᓂᖅ"]
			],
			german: "F: Wohin gehst du? → A: Ich gehe zum Laden."
		}
	];

	// ── State ──────────────────────────────────────────────────────────
	let currentRound = 0;
	let roundState = 'showing'; // 'showing' = Frage sichtbar, 'answered' = Antwort hervorgehoben
	let active = false; // ob wir auf der Chinese-Room-Slide sind

	// ── Hilfsfunktionen ──────────────────────────────────────────────
	function shuffle(arr) {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function isOnCRSlide() {
		const slides = document.querySelectorAll('.slide');
		const activeSlide = document.querySelector('.slide.active');
		if (!activeSlide) return false;
		return activeSlide.querySelector('#chinese-room-sim') !== null;
	}

	// ── Render ──────────────────────────────────────────────────────
	function renderRound() {
		const r = rounds[currentRound];

		$('#cr-room').show();
		$('#cr-reveal').hide();

		$('#cr-round-num').text(currentRound + 1);
		$('#cr-total-rounds').text(rounds.length);

		// Incoming message
		const $msgEl = $('#cr-incoming-msg');
		$msgEl.css({ opacity: '0', transform: 'translateX(-60px)' });
		$msgEl.text(r.input);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				$msgEl.css({ opacity: '1', transform: 'translateX(0)' });
			});
		});

		// Rulebook
		const $tbody = $('#cr-rulebook-body');
		$tbody.empty();
		r.rules.forEach(([inp, out]) => {
			const $tr = $('<tr>')
				.attr('data-input', inp)
				.append(
					$('<td>').css({ padding: '0.4em 0.5em', borderBottom: '1px solid #ddd', fontSize: '1.15em', letterSpacing: '0.05em' }).text(inp),
					$('<td>').css({ padding: '0.4em 0.5em', borderBottom: '1px solid #ddd', fontSize: '1.15em', letterSpacing: '0.05em', color: '#1565c0' }).text(out)
				);
			$tbody.append($tr);
		});

		// Options (angezeigt, aber nicht klickbar)
		const $optContainer = $('#cr-options');
		$optContainer.empty();

		const options = shuffle([r.correct, ...r.distractors]);

		options.forEach(opt => {
			const $btn = $('<button>')
				.text(opt)
				.attr('data-value', opt)
				.css({
					padding: '0.6em 1.2em',
					fontSize: '1.1em',
					letterSpacing: '0.08em',
					border: '2px solid #ccc',
					borderRadius: '8px',
					background: '#ffffff',
					color: '#333',
					cursor: 'default',
					transition: 'background 0.3s, border-color 0.3s, transform 0.2s',
					minWidth: '120px',
					pointerEvents: 'none' // nicht klickbar
				});
			$optContainer.append($btn);
		});

		// Feedback & English-Übersetzung zurücksetzen
		$('#cr-feedback').text('').css('opacity', '1');

		roundState = 'showing';
	}

	// ── Antwort hervorheben (simuliert "Auswahl") ──────────────────
	function showAnswer() {
		const r = rounds[currentRound];

		// Richtige Antwort grün markieren
		$('#cr-options button').each(function() {
			const $btn = $(this);
			if ($btn.attr('data-value') === r.correct) {
				$btn.css({
					background: '#27ae60',
					borderColor: '#2ecc71',
					color: '#fff',
					transform: 'scale(1.05)'
				});
			} else {
				$btn.css({ opacity: '0.4' });
			}
		});

		// Rulebook-Zeile hervorheben
		$('#cr-rulebook-body tr').each(function() {
			if ($(this).attr('data-input') === r.input) {
				$(this).css({ background: 'rgba(46, 204, 113, 0.15)', transition: 'background 0.4s' });
			}
		});

		// Feedback mit englischer Übersetzung
		$('#cr-feedback').html(
			`<span style="color:#27ae60; font-weight:bold;">✅ Richtig!</span> <span style="color:#888; font-size:0.85em;">${r.german}</span>`
		);

		roundState = 'answered';
	}

	// ── Navigation (für Pfeiltasten-Integration) ──────────────────
	function canGoNext() {
		if (!isOnCRSlide()) return false;
		if (!active) return false;
		// Kann weiter, solange wir nicht am Ende sind UND die Reveal-Seite nicht schon gezeigt wird
		if (roundState === 'showing') return true;
		if (roundState === 'answered' && currentRound < rounds.length - 1) return true;
		if (roundState === 'answered' && currentRound === rounds.length - 1) return true; // für Reveal
		return false;
	}

	function canGoPrev() {
		if (!isOnCRSlide()) return false;
		if (!active) return false;
		if (roundState === 'answered') return true;
		if (roundState === 'showing' && currentRound > 0) return true;
		return false;
	}

	function next() {
		if (roundState === 'showing') {
			// Zeige die Antwort
			showAnswer();
		} else if (roundState === 'answered') {
			if (currentRound < rounds.length - 1) {
				// Nächste Runde
				currentRound++;
				renderRound();
			} else {
				// Alle 3 Runden durch → Reveal zeigen
				showReveal();
			}
		}
	}

	function prev() {
		if (roundState === 'answered') {
			// Antwort-Hervorhebung zurücknehmen
			renderRound(); // Runde neu rendern ohne Antwort
		} else if (roundState === 'showing' && currentRound > 0) {
			// Vorherige Runde (mit Antwort gezeigt)
			currentRound--;
			renderRound();
			showAnswer();
		}
	}

	// ── Reveal ──────────────────────────────────────────────────────
	function showReveal() {
		$('#cr-room').hide();
		$('#cr-reveal').show();

		$('#cr-translations').hide();
		$('#cr-reveal-translations-btn').show();

		// Chart
		const chartData = [
			{
				x: ['Accuracy'],
				y: [100],
				type: 'bar',
				marker: { color: '#66bb6a' },
				text: ['100%'],
				textposition: 'outside',
				textfont: { size: 18, color: '#333' }
			},
			{
				x: ['Understanding'],
				y: [0],
				type: 'bar',
				marker: { color: '#ef5350' },
				text: ['0%'],
				textposition: 'outside',
				textfont: { size: 18, color: '#333' }
			}
		];

		const chartLayout = {
			yaxis: { range: [0, 115], title: '', ticksuffix: '%', gridcolor: '#e0e0e0' },
			xaxis: { title: '' },
			showlegend: false,
			margin: { t: 30, b: 40, l: 50, r: 20 },
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
			font: { family: 'Segoe UI, system-ui, sans-serif' },
			annotations: [{
				x: 0.5, y: 1.08, xref: 'paper', yref: 'paper',
				text: 'You followed the rules perfectly, but understood nothing.',
				showarrow: false,
				font: { size: 13, color: '#888' }
			}]
		};

		if (typeof Plotly !== 'undefined') {
			Plotly.newPlot('cr-chart', chartData, chartLayout, { displayModeBar: false, responsive: true });
		}

		// Translation table
		const ttbody = document.getElementById('cr-translation-body');
		if (ttbody) {
			ttbody.innerHTML = '';
			rounds.forEach((r, i) => {
				const tr = document.createElement('tr');
				tr.style.background = i % 2 === 0 ? '#fafafa' : '#fff';
				tr.innerHTML = `
	<td style="padding:0.5em; font-size:1.05em; letter-spacing:0.04em;">${r.input}</td>
	<td style="padding:0.5em; font-size:1.05em; letter-spacing:0.04em; color:#1565c0;">${r.correct}</td>
	<td style="padding:0.5em; color:#555;">${r.german}</td>
    `;
				ttbody.appendChild(tr);
			});
		}

		active = false; // Demo beendet, Pfeiltasten gehen wieder an Presentation
	}

	// ── Reveal Translations ──────────────────────────────────────────
	function revealTranslations() {
		$('#cr-translations').show();
		$('#cr-reveal-translations-btn').hide();
	}

	// ── Start / Activate ──────────────────────────────────────────────
	function start() {
		currentRound = 0;
		roundState = 'showing';
		active = true;
		renderRound();
	}

	function activate() {
		active = true;
	}

	function deactivate() {
		active = false;
	}

	// ── Public API ──────────────────────────────────────────────────
	return { start, revealTranslations, canGoNext, canGoPrev, next, prev, activate, deactivate, isOnCRSlide };
})();

function loadPhilosophyModule() {
	CRSim.start();
}
