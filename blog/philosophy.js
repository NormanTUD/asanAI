const CRSim = (() => {

  // ── Conversation data ──────────────────────────────────────────────
  // Each round: input (what slides under the door), correct output,
  // 3 distractors, the rulebook entries visible that round,
  // and the English meaning of the exchange.
  const rounds = [
    {
      input: "ᐅᓪᓗᒥ ᓯᓚ ᖃᓄᐃᑦᑐᖅ?",
      correct: "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ",
      distractors: ["ᐃᒡᓗ ᐊᖏᔪᖅ", "ᓇᒃᓴᕐᓗᒍ ᑎᒥᖅ", "ᐃᓄᒃ ᑕᑯᔪᖅ"],
      rules: [
        ["ᐅᓪᓗᒥ ᓯᓚ ᖃᓄᐃᑦᑐᖅ?", "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ"],
        ["ᓇᑭᑦ?", "ᐃᖃᓗᐃᑦ ᐅᕙᖓ"]
      ],
      english: "Q: How is the weather today? → A: The weather is harsh today."
    },
    {
      input: "ᐊᐱᖅᓱᖅᑐᖅ ᐊᐅᓚᔪᖅ?",
      correct: "ᐄ, ᐊᓄᕆ ᓴᖑᓪᓗᓂ",
      distractors: ["ᐅᖃᓕᒫᒐᖅ ᐱᐅᔪᖅ", "ᓂᕆᔪᒪᔪᖅ ᐃᒻᒪᖄ", "ᑐᒃᑐ ᐊᖏᔪᖅ"],
      rules: [
        ["ᐊᐱᖅᓱᖅᑐᖅ ᐊᐅᓚᔪᖅ?", "ᐄ, ᐊᓄᕆ ᓴᖑᓪᓗᓂ"],
        ["ᖃᖓ?", "ᐅᓪᓗᒥ ᐅᓐᓄᓴᒃᑯᑦ"]
      ],
      english: "Q: Is the wind blowing? → A: Yes, the wind is shifting."
    },
    {
      input: "ᓇᒧᑦ ᐊᐅᓪᓚᖅᐱᑦ?",
      correct: "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ",
      distractors: ["ᐃᒡᓗ ᓯᑯᐃᔭᖅᑐᖅ", "ᐊᕐᓇᖅ ᐃᓱᒪᔪᖅ", "ᓄᓇᕗᑦ ᐊᖏᔪᖅ"],
      rules: [
        ["ᓇᒧᑦ ᐊᐅᓪᓚᖅᐱᑦ?", "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ"],
        ["ᖃᓄᐃᒻᒪᑦ?", "ᓂᕿᑦᑎᐊᕙᐅᔪᖅ"]
      ],
      english: "Q: Where are you going? → A: I am going to the store."
    },
    {
      input: "ᓂᕿᒃᓴᖃᖅᐱᑦ?",
      correct: "ᐄ, ᑐᒃᑐᒥᒃ ᓂᕆᔪᒪᔪᖓ",
      distractors: ["ᐅᒥᐊᖅ ᐊᐅᓚᔪᖅ", "ᓯᓚ ᖃᐅᔨᒪᔪᖅ", "ᐃᒡᓗ ᐅᖅᑰᔪᖅ"],
      rules: [
        ["ᓂᕿᒃᓴᖃᖅᐱᑦ?", "ᐄ, ᑐᒃᑐᒥᒃ ᓂᕆᔪᒪᔪᖓ"],
        ["ᑭᓱᒥᒃ?", "ᑐᒃᑐᒥᒃ ᐊᒻᒪ ᐃᖃᓗᒃ"]
      ],
      english: "Q: Do you have food? → A: Yes, I want to eat caribou."
    },
    {
      input: "ᖃᐅᔨᒪᕖᑦ ᐊᖅᑯᑎᒥᒃ?",
      correct: "ᓴᐅᒥᖕᒧᑦ ᐊᓂᒍᐊᕐᓗᑎᑦ",
      distractors: ["ᐃᓄᒃ ᓯᓂᒃᑐᖅ", "ᐊᕐᓇᖅ ᐃᒡᓗᒥ", "ᓇᓄᖅ ᑕᑯᔪᖅ"],
      rules: [
        ["ᖃᐅᔨᒪᕖᑦ ᐊᖅᑯᑎᒥᒃ?", "ᓴᐅᒥᖕᒧᑦ ᐊᓂᒍᐊᕐᓗᑎᑦ"],
        ["ᖃᓄᖅ ᐅᖓᓯᒃᑎᒋᕙ?", "ᐅᖓᓯᒃᑑᖏᑦᑐᖅ"]
      ],
      english: "Q: Do you know the way? → A: Go past it to the left."
    },
    {
      // Round 6: THE TRICK — input is NOT in the rulebook
      input: "ᐃᓕᓐᓂᐊᕐᕕᒃ ᒪᑐᓯᒪᕖᑦ?",
      correct: null, // no correct answer exists
      distractors: ["ᐊᕐᓇᖅ ᐃᒡᓗᒥ", "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ", "ᐄ, ᐊᓄᕆ ᓴᖑᓪᓗᓂ", "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ"],
      rules: [
        ["ᐅᓪᓗᒥ ᓯᓚ ᖃᓄᐃᑦᑐᖅ?", "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ"],
        ["ᓇᒧᑦ ᐊᐅᓪᓚᖅᐱᑦ?", "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ"],
        ["ᖃᐅᔨᒪᕖᑦ ᐊᖅᑯᑎᒥᒃ?", "ᓴᐅᒥᖕᒧᑦ ᐊᓂᒍᐊᕐᓗᑎᑦ"]
      ],
      english: "Q: Is the school closed? → (Not in your rulebook — you're stuck!)",
      isTrick: true
    }
  ];

  // ── State ──────────────────────────────────────────────────────────
  let currentRound = 0;
  let score = 0;
  let timerInterval = null;
  let roundStartTime = 0;
  let responseTimes = [];

  // ── DOM refs ───────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);

  // ── Helpers ────────────────────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startTimer() {
    roundStartTime = performance.now();
    const el = $('cr-timer-val');
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      el.textContent = ((performance.now() - roundStartTime) / 1000).toFixed(1);
    }, 100);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    return (performance.now() - roundStartTime) / 1000;
  }

  // ── Render a round ────────────────────────────────────────────────
  function renderRound() {
    const r = rounds[currentRound];

    // Show room, hide reveal
    $('cr-room').style.display = '';
    $('cr-reveal').style.display = 'none';

    // Round number
    $('cr-round-num').textContent = currentRound + 1;
    $('cr-total-rounds').textContent = rounds.length;

    // Incoming message with slide-in animation
    const msgEl = $('cr-incoming-msg');
    msgEl.style.opacity = '0';
    msgEl.style.transform = 'translateX(-60px)';
    msgEl.textContent = r.input;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        msgEl.style.opacity = '1';
        msgEl.style.transform = 'translateX(0)';
      });
    });

    // Rulebook
    const tbody = $('cr-rulebook-body');
    tbody.innerHTML = '';
    r.rules.forEach(([inp, out]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:0.4em 0.5em; border-bottom:1px solid #333; font-size:1.15em; letter-spacing:0.05em;">${inp}</td>
        <td style="padding:0.4em 0.5em; border-bottom:1px solid #333; font-size:1.15em; letter-spacing:0.05em; color:#81d4fa;">${out}</td>
      `;
      tr.dataset.input = inp;
      tbody.appendChild(tr);
    });

    // Options
    const optContainer = $('cr-options');
    optContainer.innerHTML = '';

    let options;
    if (r.isTrick) {
      options = shuffle(r.distractors);
    } else {
      options = shuffle([r.correct, ...r.distractors]);
    }

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.style.cssText = `
        padding: 0.6em 1.2em;
        font-size: 1.2em;
        letter-spacing: 0.08em;
        border: 2px solid #555;
        border-radius: 8px;
        background: #0f3460;
        color: #eee;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s, transform 0.1s;
        min-width: 120px;
      `;
      btn.addEventListener('mouseenter', () => { btn.style.background = '#1a5276'; btn.style.borderColor = '#81d4fa'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = '#0f3460'; btn.style.borderColor = '#555'; });
      btn.addEventListener('click', () => handleChoice(opt, btn));
      optContainer.appendChild(btn);
    });

    // Clear feedback
    $('cr-feedback').textContent = '';
    $('cr-feedback').style.opacity = '1';

    // Start timer
    startTimer();
  }

  // ── Handle user choice ────────────────────────────────────────────
  function handleChoice(chosen, btnEl) {
    const r = rounds[currentRound];
    const elapsed = stopTimer();
    responseTimes.push(elapsed);

    const feedbackEl = $('cr-feedback');
    const allBtns = $('cr-options').querySelectorAll('button');

    if (r.isTrick) {
      // Round 6: NOTHING is correct
      // Flash the chosen button red
      btnEl.style.background = '#c0392b';
      btnEl.style.borderColor = '#e74c3c';

      // Disable all buttons
      allBtns.forEach(b => { b.disabled = true; b.style.cursor = 'default'; b.style.opacity = '0.6'; });

      feedbackEl.innerHTML = `❌ <strong>That's not in the rulebook!</strong><br>
        <span style="font-size:0.85em; color:#ffab91;">The input doesn't match any rule. You're stuck — just like an LLM
        encountering something truly outside its training distribution.</span>`;
      feedbackEl.style.color = '#ef9a9a';

      setTimeout(() => showReveal(), 3000);
      return;
    }

    if (chosen === r.correct) {
      // Correct!
      score++;
      btnEl.style.background = '#27ae60';
      btnEl.style.borderColor = '#2ecc71';

      // Highlight matching rule
      const rows = $('cr-rulebook-body').querySelectorAll('tr');
      rows.forEach(tr => {
        if (tr.dataset.input === r.input) {
          tr.style.background = 'rgba(46, 204, 113, 0.2)';
          tr.style.transition = 'background 0.4s';
        }
      });

      allBtns.forEach(b => { b.disabled = true; b.style.cursor = 'default'; });

      feedbackEl.textContent = `✅ Correct! (${elapsed.toFixed(1)}s)`;
      feedbackEl.style.color = '#a5d6a7';

      setTimeout(() => {
        currentRound++;
        if (currentRound < rounds.length) {
          renderRound();
        } else {
          showReveal();
        }
      }, 1200);

    } else {
      // Wrong — highlight the correct rule, let them try again
      btnEl.style.background = '#c0392b';
      btnEl.style.borderColor = '#e74c3c';
      btnEl.disabled = true;
      btnEl.style.opacity = '0.4';
      btnEl.style.cursor = 'default';

      // Flash the matching rule row
      const rows = $('cr-rulebook-body').querySelectorAll('tr');
      rows.forEach(tr => {
        if (tr.dataset.input === r.input) {
          tr.style.background = 'rgba(231, 76, 60, 0.25)';
          tr.style.transition = 'background 0.3s';
          setTimeout(() => { tr.style.background = 'rgba(241, 196, 15, 0.15)'; }, 600);
        }
      });

      feedbackEl.textContent = '❌ Check the rulebook again…';
      feedbackEl.style.color = '#ef9a9a';
    }
  }

  // ── Show the reveal ───────────────────────────────────────────────
  function showReveal() {
    stopTimer();
    $('cr-room').style.display = 'none';
    $('cr-reveal').style.display = '';

    // Hide translation table for fresh reveal
    $('cr-translations').style.display = 'none';
    $('cr-reveal-translations-btn').style.display = '';

    // Build Plotly chart
    const chartData = [
      {
        x: ['Accuracy'],
        y: [Math.round((score / (rounds.length - 1)) * 100)], // exclude trick round from accuracy
        type: 'bar',
        marker: { color: '#66bb6a' },
        name: 'Accuracy',
        text: [Math.round((score / (rounds.length - 1)) * 100) + '%'],
        textposition: 'outside',
        textfont: { size: 18, color: '#333' }
      },
      {
        x: ['Understanding'],
        y: [0],
        type: 'bar',
        marker: { color: '#ef5350' },
        name: 'Understanding',
        text: ['0%'],
        textposition: 'outside',
        textfont: { size: 18, color: '#333' }
      }
    ];

    const chartLayout = {
      yaxis: {
        range: [0, 115],
        title: '',
        ticksuffix: '%',
        gridcolor: '#e0e0e0'
      },
      xaxis: { title: '' },
      showlegend: false,
      margin: { t: 30, b: 40, l: 50, r: 20 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Segoe UI, system-ui, sans-serif' },
      annotations: [{
        x: 0.5, y: 1.08, xref: 'paper', yref: 'paper',
        text: 'You followed the rules perfectly — but understood nothing.',
        showarrow: false,
        font: { size: 13, color: '#888' }
      }]
    };

    if (typeof Plotly !== 'undefined') {
      Plotly.newPlot('cr-chart', chartData, chartLayout, { displayModeBar: false, responsive: true });
    } else {
      $('cr-chart').innerHTML = '<p style="text-align:center; color:#999;">Plotly not loaded — Accuracy: ' +
        Math.round((score / (rounds.length - 1)) * 100) + '%, Understanding: 0%</p>';
    }

    // Build translation table
    const ttbody = $('cr-translation-body');
    ttbody.innerHTML = '';
    rounds.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.style.background = r.isTrick ? '#fff8e1' : (i % 2 === 0 ? '#fafafa' : '#fff');
      tr.innerHTML = `
        <td style="padding:0.5em; font-size:1.05em; letter-spacing:0.04em;">${r.input}</td>
        <td style="padding:0.5em; font-size:1.05em; letter-spacing:0.04em; color:#1565c0;">${r.correct || '—'}</td>
        <td style="padding:0.5em; color:#555;">${r.english}</td>
      `;
      ttbody.appendChild(tr);
    });
  }

  // ── Reveal translations ───────────────────────────────────────────
  function revealTranslations() {
    $('cr-translations').style.display = '';
    $('cr-reveal-translations-btn').style.display = 'none';
  }

  // ── Public start ──────────────────────────────────────────────────
  function start() {
    currentRound = 0;
    score = 0;
    responseTimes = [];
    renderRound();
  }

  // ── Expose public API ─────────────────────────────────────────────
  return { start, revealTranslations };

})();

function loadPhilosophyModule () {
	CRSim.start();
}
