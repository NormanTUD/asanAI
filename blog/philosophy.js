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
      // Round 6: THE TRICK, input is NOT in the rulebook
      input: "ᐃᓕᓐᓂᐊᕐᕕᒃ ᒪᑐᓯᒪᕖᑦ?",
      correct: null, // no correct answer exists
      distractors: ["ᐊᕐᓇᖅ ᐃᒡᓗᒥ", "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ", "ᐄ, ᐊᓄᕆ ᓴᖑᓪᓗᓂ", "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ"],
      rules: [
        ["ᐅᓪᓗᒥ ᓯᓚ ᖃᓄᐃᑦᑐᖅ?", "ᓯᓚ ᐊᒃᓱᕈᕐᓇᖅᑐᖅ ᐅᓪᓗᒥ"],
        ["ᓇᒧᑦ ᐊᐅᓪᓚᖅᐱᑦ?", "ᓂᐅᕕᕐᕕᒧᑦ ᐊᐅᓪᓚᖅᑐᖓ"],
        ["ᖃᐅᔨᒪᕖᑦ ᐊᖅᑯᑎᒥᒃ?", "ᓴᐅᒥᖕᒧᑦ ᐊᓂᒍᐊᕐᓗᑎᑦ"]
      ],
      english: "Q: Is the school closed? → (Not in your rulebook, you're stuck!)",
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
    $('#cr-room').style.display = '';
    $('#cr-reveal').style.display = 'none';

    // Round number
    $('#cr-round-num').textContent = currentRound + 1;
    $('#cr-total-rounds').textContent = rounds.length;

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
    border: 2px solid #ccc;
    border-radius: 8px;
    background: #ffffff;
    color: #333;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, transform 0.1s;
    min-width: 120px;
`;

      btn.addEventListener('mouseenter', () => { btn.style.background = '#fff'; btn.style.borderColor = '#eee'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = '#eee'; btn.style.borderColor = '#555'; });
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
        <span style="font-size:0.85em; color:#ffab91;">The input doesn't match any rule. You're stuck, just like an LLM
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
      // Wrong, highlight the correct rule, let them try again
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
        text: 'You followed the rules perfectly, but understood nothing.',
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

const SheafViz = (() => {
  const R = 2.5, DOT = 0.06;
  let scene, cam, ren, ctl, sphere, wire, gStalk, gPre, gSheaf, worldGroup;
  let ms = [], t = 0, glueAnim = null, colorIdx = 0;
  const SCOLS = [0x42a5f5,0xff7043,0xab47bc,0x26c6da,0xffca28,0x5c6bc0,0x26a69a,0xec407a];
  const GCOLS = [0xe53935,0x43a047,0x1e88e5,0xf9a825,0x8e24aa,0x00acc1,0xfb8c00,0xd81b60];
  const GREEN = 0x4caf50, DGREEN = 0x2e7d32;

  const dotPool = [];
  const DOT_POOL_SIZE = 1500;
  let dotIdCounter = 0;
  const dotVisuals = new Map();
  let bgGroup = null;

  // ── NEW: Two-phase state tracking ──
  // ungroupedGerms holds germ placements that haven't been grouped into stalks yet
  let ungroupedGerms = []; // array of { center, hw, hh, _tf, color, dotIds, rotAngle }
  let stalksFormed = false; // whether formStalks() has been called for current germs

  function initDotPool() {
    dotPool.length = 0;
    dotIdCounter = 0;
    dotVisuals.clear();
    for (let i = 0; i < DOT_POOL_SIZE; i++) {
      const dir = randDir();
      const color = pickColor();
      dotPool.push({
        id: dotIdCounter++,
        dir: dir.clone(),
        pt: dir.clone().multiplyScalar(R),
        color,
        owners: new Set()
      });
    }
    log(`Dot pool initialized: ${dotPool.length} dots`);
  }

  function dotById(id) { return dotPool.find(d => d.id === id); }
  function isShared(d) { return d.owners.size > 1; }

  function log(m) { console.log('[SV] ' + m); }

  function mkCtl(c, el) {
    let dn=false,px=0,py=0,rx=0.35,ry=0.6,trx=0.35,try_=0.6,d=6.5,td=6.5;
    const on=(e,f,o)=>el.addEventListener(e,f,o);
    on('mousedown',e=>{dn=true;px=e.clientX;py=e.clientY});
    on('mousemove',e=>{if(!dn)return;try_+=(e.clientX-px)*.005;trx+=(e.clientY-py)*.005;trx=Math.max(-1.4,Math.min(1.4,trx));px=e.clientX;py=e.clientY});
    on('mouseup',()=>dn=false);on('mouseleave',()=>dn=false);
    on('wheel',e=>{e.preventDefault();td=Math.max(3.5,Math.min(14,td+e.deltaY*.005))},{passive:false});
    on('touchstart',e=>{if(e.touches.length===1){dn=true;px=e.touches[0].clientX;py=e.touches[0].clientY}});
    on('touchmove',e=>{if(!dn||e.touches.length!==1)return;try_+=(e.touches[0].clientX-px)*.005;trx+=(e.touches[0].clientY-py)*.005;trx=Math.max(-1.4,Math.min(1.4,trx));px=e.touches[0].clientX;py=e.touches[0].clientY});
    on('touchend',()=>dn=false);
    return{update(){rx+=(trx-rx)*.08;ry+=(try_-ry)*.08;d+=(td-d)*.08;c.position.set(d*Math.sin(ry)*Math.cos(rx),d*Math.sin(rx),d*Math.cos(ry)*Math.cos(rx));c.lookAt(0,0,0)}};
  }

  function tframe(dir) {
    const up = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0,1,0) : new THREE.Vector3(1,0,0);
    const t1 = new THREE.Vector3().crossVectors(dir, up).normalize();
    return { t1, t2: new THREE.Vector3().crossVectors(dir, t1).normalize() };
  }

  function randDir() {
    const u = Math.random()*2-1, th = Math.random()*Math.PI*2, s = Math.sqrt(1-u*u);
    return new THREE.Vector3(s*Math.cos(th), u, s*Math.sin(th)).normalize();
  }

  function pickColor() { return GCOLS[Math.floor(Math.random()*GCOLS.length)]; }

  function angDist(a, b) { return Math.acos(Math.min(1, Math.max(-1, a.dot(b)))); }

  function getCameraLookDir() {
    return cam.position.clone().normalize();
  }

  function dotsInStalk(m) {
    const results = [];
    for (const dot of dotPool) {
      if (inStalk(dot.dir, m)) results.push(dot);
    }
    return results;
  }

  function inStalk(dir, m) {
    const d = dir.clone().normalize();
    const cosAngle = d.dot(m.center);
    if (cosAngle < 0.85) return false;
    const diff = d.clone().sub(m.center);
    const normalComp = diff.dot(m.center);
    const tangentDiff = diff.clone().sub(m.center.clone().multiplyScalar(normalComp));
    const u = tangentDiff.dot(m._tf.t1);
    const v = tangentDiff.dot(m._tf.t2);
    return Math.abs(u) < m.hw && Math.abs(v) < m.hh;
  }

  function inStalkUV(dir, m) {
    const d = dir.clone().normalize();
    const cosAngle = d.dot(m.center);
    if (cosAngle < 0.85) return null;
    const diff = d.clone().sub(m.center);
    const normalComp = diff.dot(m.center);
    const tangentDiff = diff.clone().sub(m.center.clone().multiplyScalar(normalComp));
    const u = tangentDiff.dot(m._tf.t1);
    const v = tangentDiff.dot(m._tf.t2);
    if (Math.abs(u) < m.hw && Math.abs(v) < m.hh) {
      return { u, v };
    }
    return null;
  }

  function isBorderDot(dir, m) {
    const uv = inStalkUV(dir, m);
    if (!uv) return false;
    const uNorm = Math.abs(uv.u) / m.hw;
    const vNorm = Math.abs(uv.v) / m.hh;
    return uNorm > 0.7 || vNorm > 0.7;
  }

  function createDotVisual(dot, fadeDelay, now) {
    const pos = dot.pt.clone().multiplyScalar(1.006);
    const lookTarget = dot.pt.clone().multiplyScalar(2);
    const group = new THREE.Group();
    group.position.copy(pos);
    group.lookAt(lookTarget);
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(DOT, 16),
      new THREE.MeshBasicMaterial({
        color: dot.color, side: 2, transparent: true,
        opacity: 0, depthWrite: false
      })
    );
    mesh.userData = { ft: 0.85, fd: fadeDelay, fs: now };
    group.add(mesh);
    gStalk.add(group);
    dotVisuals.set(dot.id, { group, hasDot: true, hasRing: false });
  }

  function ensureRingOnVisual(dot) {
    const vis = dotVisuals.get(dot.id);
    if (!vis || vis.hasRing) return;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(DOT + 0.015, DOT + 0.035, 24),
      new THREE.MeshBasicMaterial({
        color: 0x333333, side: 2, transparent: true,
        opacity: 0, depthWrite: false
      })
    );
    ring.userData = { ft: 1.0, fd: 0, fs: performance.now() };
    vis.group.add(ring);
    vis.hasRing = true;
    const dotMesh = vis.group.children[0];
    if (dotMesh && dotMesh.userData) {
      dotMesh.userData.ft = 1.0;
      dotMesh.userData.fs = performance.now();
      dotMesh.userData.fd = 0;
    }
    log(`Ring added to dot #${dot.id} (now shared by ${dot.owners.size} stalks)`);
  }

  function findNonOverlappingCenter(hw, hh) {
    const last = ms.length ? ms[ms.length - 1] : ungroupedGerms[ungroupedGerms.length - 1];
    const minSep = Math.sqrt(hw * hw + hh * hh) * 0.85;
    const maxSep = Math.sqrt(hw * hw + hh * hh) * 1.4;
    const allPlacements = [...ms, ...ungroupedGerms];

    for (let attempt = 0; attempt < 60; attempt++) {
      const { t1, t2 } = tframe(last.center);
      const a = Math.random() * Math.PI * 2;
      const dist = minSep + Math.random() * (maxSep - minSep);
      const candidate = last.center.clone()
        .add(t1.clone().multiplyScalar(Math.cos(a) * dist))
        .add(t2.clone().multiplyScalar(Math.sin(a) * dist))
        .normalize();
      if (isValidCenterAll(candidate, minSep, allPlacements)) {
        return candidate;
      }
    }

    const shuffled = [...allPlacements].sort(() => Math.random() - 0.5);
    for (const stalk of shuffled) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const { t1, t2 } = tframe(stalk.center);
        const a = Math.random() * Math.PI * 2;
        const dist = minSep + Math.random() * (maxSep - minSep);
        const candidate = stalk.center.clone()
          .add(t1.clone().multiplyScalar(Math.cos(a) * dist))
          .add(t2.clone().multiplyScalar(Math.sin(a) * dist))
          .normalize();
        if (isValidCenterAll(candidate, minSep, allPlacements)) {
          return candidate;
        }
      }
    }

    for (let attempt = 0; attempt < 200; attempt++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const candidate = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      ).normalize();
      if (isValidCenterAll(candidate, minSep, allPlacements)) {
        return candidate;
      }
    }

    for (let relaxFactor = 0.9; relaxFactor >= 0.3; relaxFactor -= 0.1) {
      const relaxedMin = minSep * relaxFactor;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const candidate = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      ).normalize();
      if (isValidCenterAll(candidate, relaxedMin, allPlacements)) {
        return candidate;
      }
    }

    const { t1 } = tframe(last.center);
    return last.center.clone().add(t1.clone().multiplyScalar(maxSep)).normalize();
  }

  function isValidCenterAll(candidate, minSep, allPlacements) {
    for (const stalk of allPlacements) {
      const dist = angDist(candidate, stalk.center);
      if (dist < minSep) return false;
      const { t1, t2 } = tframe(candidate);
      const hw = 0.18, hh = 0.15;
      const corners = [
        candidate.clone().add(t1.clone().multiplyScalar(hw)).add(t2.clone().multiplyScalar(hh)).normalize(),
        candidate.clone().add(t1.clone().multiplyScalar(-hw)).add(t2.clone().multiplyScalar(hh)).normalize(),
        candidate.clone().add(t1.clone().multiplyScalar(hw)).add(t2.clone().multiplyScalar(-hh)).normalize(),
        candidate.clone().add(t1.clone().multiplyScalar(-hw)).add(t2.clone().multiplyScalar(-hh)).normalize(),
      ];
      let cornersInside = 0;
      for (const corner of corners) {
        if (inStalk(corner, stalk)) cornersInside++;
      }
      if (cornersInside > 1) return false;
    }
    return true;
  }

  function isValidCenter(candidate, minSep) {
    return isValidCenterAll(candidate, minSep, ms);
  }

  // ══════════════════════════════════════════════════════════════════
  // PHASE 1: PLACE GERMS — dots appear on sphere, no stalk grouping
  // ══════════════════════════════════════════════════════════════════

  function placeGerms() {
    if (!cam || !gStalk) {
      info('⚠️ Visualization is still loading. Please wait a moment…');
      return;
    }

    if (stalksFormed) {
      stalksFormed = false;
    }

    const hw = 0.18, hh = 0.15;

    let center;
    const allPlacements = [...ms, ...ungroupedGerms];
    if (!allPlacements.length) {
      center = getCameraLookDir();
    } else {
      center = findNonOverlappingCenter(hw, hh);
    }

    const baseFrame = tframe(center);
    let rotAngle;
    const prev = allPlacements.length ? allPlacements[allPlacements.length - 1] : null;
    if (prev) {
      const prevAngle = Math.atan2(
        prev._tf.t1.dot(baseFrame.t2),
        prev._tf.t1.dot(baseFrame.t1)
      );
      rotAngle = Math.random() < 0.5
        ? prevAngle + (Math.random() - 0.5) * Math.PI * 0.5
        : Math.random() * Math.PI * 2;
    } else {
      rotAngle = Math.random() * Math.PI * 2;
    }
    const cosA = Math.cos(rotAngle), sinA = Math.sin(rotAngle);
    const rotT1 = baseFrame.t1.clone().multiplyScalar(cosA).add(baseFrame.t2.clone().multiplyScalar(sinA)).normalize();
    const rotT2 = baseFrame.t1.clone().multiplyScalar(-sinA).add(baseFrame.t2.clone().multiplyScalar(cosA)).normalize();

    const color = SCOLS[colorIdx++ % SCOLS.length];
    const germGroup = {
      center, color, hw, hh,
      id: ms.length + ungroupedGerms.length,
      _tf: { t1: rotT1, t2: rotT2 },
      dotIds: [],
      rotAngle
    };

    const prevStalkDotIds = new Set();
    for (const s of [...ms, ...ungroupedGerms]) {
      s.dotIds.forEach(id => prevStalkDotIds.add(id));
    }

    let candidates = dotsInStalk(germGroup);
    log(`Germ group #${germGroup.id}: ${candidates.length} candidates found in region`);

    let sharedDotIds = new Set();
    const allPrev = [...ms, ...ungroupedGerms];
    if (allPrev.length >= 1) {
      let adjacentStalk = null;
      let bestDist = Infinity;
      for (const s of allPrev) {
        const dist = angDist(germGroup.center, s.center);
        if (dist < bestDist) { bestDist = dist; adjacentStalk = s; }
      }

      if (adjacentStalk) {
        let sharedCandidates = candidates.filter(d => {
          if (!inStalk(d.dir, adjacentStalk)) return false;
          return isBorderDot(d.dir, germGroup) || isBorderDot(d.dir, adjacentStalk);
        });
        if (sharedCandidates.length === 0) {
          sharedCandidates = candidates.filter(d => inStalk(d.dir, adjacentStalk));
        }
        if (sharedCandidates.length === 0) {
          sharedCandidates = dotPool.filter(d => inStalk(d.dir, adjacentStalk) && inStalk(d.dir, germGroup));
        }

        if (sharedCandidates.length === 0) {
          let forcedDir = null;
          for (let s = 0.1; s <= 0.9; s += 0.02) {
            const tryDir = adjacentStalk.center.clone().lerp(germGroup.center.clone(), s).normalize();
            if (inStalk(tryDir, adjacentStalk) && inStalk(tryDir, germGroup)) {
              forcedDir = tryDir; break;
            }
          }
          if (!forcedDir) {
            const steps = 10;
            let bestDir = null, bestScore = -Infinity;
            for (let ui = 0; ui <= steps; ui++) {
              for (let vi = 0; vi <= steps; vi++) {
                const u = -adjacentStalk.hw + 2 * adjacentStalk.hw * (ui / steps);
                const v = -adjacentStalk.hh + 2 * adjacentStalk.hh * (vi / steps);
                const tryDir = adjacentStalk.center.clone()
                  .add(adjacentStalk._tf.t1.clone().multiplyScalar(u))
                  .add(adjacentStalk._tf.t2.clone().multiplyScalar(v))
                  .normalize();
                if (inStalk(tryDir, adjacentStalk) && inStalk(tryDir, germGroup)) {
                  const uvNew = inStalkUV(tryDir, germGroup);
                  const uvAdj = inStalkUV(tryDir, adjacentStalk);
                  if (uvNew && uvAdj) {
                    const score = Math.max(
                      Math.abs(uvNew.u) / germGroup.hw, Math.abs(uvNew.v) / germGroup.hh,
                      Math.abs(uvAdj.u) / adjacentStalk.hw, Math.abs(uvAdj.v) / adjacentStalk.hh
                    );
                    if (score > bestScore) { bestScore = score; bestDir = tryDir.clone(); }
                  }
                }
              }
            }
            if (bestDir) forcedDir = bestDir;
          }
          if (!forcedDir) {
            const nudgedCenter = germGroup.center.clone().lerp(adjacentStalk.center, 0.15).normalize();
            germGroup.center = nudgedCenter;
            const newBase = tframe(nudgedCenter);
            const nCosA = Math.cos(rotAngle), nSinA = Math.sin(rotAngle);
            germGroup._tf.t1 = newBase.t1.clone().multiplyScalar(nCosA).add(newBase.t2.clone().multiplyScalar(nSinA)).normalize();
            germGroup._tf.t2 = newBase.t1.clone().multiplyScalar(-nSinA).add(newBase.t2.clone().multiplyScalar(nCosA)).normalize();
            forcedDir = adjacentStalk.center.clone().lerp(germGroup.center.clone(), 0.5).normalize();
            if (!inStalk(forcedDir, adjacentStalk) || !inStalk(forcedDir, germGroup)) {
              forcedDir = germGroup.center.clone();
            }
          }
          if (forcedDir) {
            let bestDot = null, bestDotDist = Infinity;
            for (const dot of dotPool) {
              if (dot.owners.size === 0) {
                const dist = angDist(dot.dir, forcedDir);
                if (dist < bestDotDist) { bestDotDist = dist; bestDot = dot; }
              }
            }
            if (bestDot) {
              bestDot.dir.copy(forcedDir);
              bestDot.pt.copy(forcedDir.clone().multiplyScalar(R));
              if (dotVisuals.has(bestDot.id)) {
                const vis = dotVisuals.get(bestDot.id);
                vis.group.position.copy(bestDot.pt.clone().multiplyScalar(1.006));
                vis.group.lookAt(bestDot.pt.clone().multiplyScalar(2));
              }
              sharedCandidates = [bestDot];
            } else {
              const newDot = {
                id: dotIdCounter++, dir: forcedDir.clone(),
                pt: forcedDir.clone().multiplyScalar(R), color: pickColor(), owners: new Set()
              };
              dotPool.push(newDot);
              sharedCandidates = [newDot];
            }
          }
        }

        const numToShare = Math.min(sharedCandidates.length, 1 + Math.floor(Math.random() * 2));
        for (let i = 0; i < numToShare; i++) {
          const dot = sharedCandidates[i];
          dot.owners.add(adjacentStalk.id);
          dot.owners.add(germGroup.id);
          if (!adjacentStalk.dotIds.includes(dot.id)) adjacentStalk.dotIds.push(dot.id);
          if (!germGroup.dotIds.includes(dot.id)) germGroup.dotIds.push(dot.id);
          sharedDotIds.add(dot.id);
        }
      }
    }

    candidates = dotsInStalk(germGroup);
    const target = 6 + Math.floor(Math.random() * 3);
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    for (const dot of shuffled) {
      if (germGroup.dotIds.length >= target) break;
      if (germGroup.dotIds.includes(dot.id)) continue;
      if (dot.owners.size > 0 && !sharedDotIds.has(dot.id)) continue;
      if (prevStalkDotIds.has(dot.id) && !sharedDotIds.has(dot.id)) continue;
      dot.owners.add(germGroup.id);
      germGroup.dotIds.push(dot.id);
    }

    if (germGroup.dotIds.length < target) {
      const needed = target - germGroup.dotIds.length;
      for (let i = 0; i < needed; i++) {
        let dir; let attempts = 0;
        do {
          const u = (Math.random() * 2 - 1) * hw * 0.65;
          const v = (Math.random() * 2 - 1) * hh * 0.65;
          dir = germGroup.center.clone()
            .add(germGroup._tf.t1.clone().multiplyScalar(u))
            .add(germGroup._tf.t2.clone().multiplyScalar(v))
            .normalize();
          let inOther = false;
          for (const s of allPrev) { if (inStalk(dir, s)) { inOther = true; break; } }
          if (!inOther) break;

          const u2 = (Math.random() * 2 - 1) * hw * 0.35;
          const v2 = (Math.random() * 2 - 1) * hh * 0.35;
          dir = germGroup.center.clone()
            .add(germGroup._tf.t1.clone().multiplyScalar(u2))
            .add(germGroup._tf.t2.clone().multiplyScalar(v2))
            .normalize();

          let stillInOther = false;
          for (const s of allPrev) {
            if (inStalk(dir, s)) { stillInOther = true; break; }
          }
          if (!stillInOther) break;
          attempts++;
        } while (attempts < 5);

        const newDot = {
          id: dotIdCounter++,
          dir: dir.clone(),
          pt: dir.clone().multiplyScalar(R),
          color: pickColor(),
          owners: new Set([germGroup.id])
        };
        dotPool.push(newDot);
        germGroup.dotIds.push(newDot.id);
      }
    }

    while (germGroup.dotIds.length < 6) {
      const u = (Math.random() * 2 - 1) * hw * 0.3;
      const v = (Math.random() * 2 - 1) * hh * 0.3;
      const dir = germGroup.center.clone()
        .add(germGroup._tf.t1.clone().multiplyScalar(u))
        .add(germGroup._tf.t2.clone().multiplyScalar(v))
        .normalize();
      const newDot = {
        id: dotIdCounter++,
        dir: dir.clone(),
        pt: dir.clone().multiplyScalar(R),
        color: pickColor(),
        owners: new Set([germGroup.id])
      };
      dotPool.push(newDot);
      germGroup.dotIds.push(newDot.id);
    }

    ungroupedGerms.push(germGroup);

    const shared = germGroup.dotIds.filter(id => { const d = dotById(id); return d && isShared(d); }).length;
    log(`Germ group #${germGroup.id}: ${germGroup.dotIds.length} dots total, ${shared} shared`);

    clear(gPre); clear(gSheaf); glueAnim = null;

    const now = performance.now();
    germGroup.dotIds.forEach((did, gi) => {
      if (dotVisuals.has(did)) return;
      const dot = dotById(did);
      if (!dot) return;
      createDotVisual(dot, germGroup.id * 40 + gi * 15, now);
    });

    germGroup.dotIds.forEach(did => {
      const dot = dotById(did);
      if (dot && isShared(dot)) ensureRingOnVisual(dot);
    });

    const btnStalks = document.getElementById('btn-stalks');
    if (btnStalks) btnStalks.disabled = false;

    updateUI_germs();
  }

  function formStalks() {
    if (!cam || !gStalk) {
      info('⚠️ Visualization is still loading. Please wait a moment…');
      return;
    }
    if (ungroupedGerms.length === 0) {
      info('⚠️ Place some germs first with <strong>🌱 Place Germs</strong>.');
      return;
    }

    for (const g of ungroupedGerms) {
      g.id = ms.length;
      g.dotIds.forEach(did => {
        const dot = dotById(did);
        if (dot) {
          dot.owners.delete(g.id);
          dot.owners.add(ms.length);
        }
      });
      ms.push(g);
    }

    ms.forEach((m, idx) => {
      m.id = idx;
      m.dotIds.forEach(did => {
        const dot = dotById(did);
        if (dot) dot.owners.add(idx);
      });
    });

    ungroupedGerms = [];
    stalksFormed = true;

    rebuildStalkBackgrounds();

    const btnStalks = document.getElementById('btn-stalks');
    if (btnStalks) btnStalks.disabled = true;

    updateUI();
  }

  function showPresheaf() {
    if (!cam || !gStalk) { info('⚠️ Still loading…'); return; }
    if (ms.length < 2) { info('⚠️ Form at least <strong>2</strong> stalks first.'); return; }
    clear(gPre); clear(gSheaf); glueAnim = null; buildPresheaf();
    info('<strong>Presheaf:</strong> Dotted outline = all stalks. Circled outlines = shared germs. No gluing guarantee yet.');
  }

  function glueSheaf() {
    if (!cam || !gStalk) { info('⚠️ Still loading…'); return; }
    if (ms.length < 2) { info('⚠️ Form at least <strong>2</strong> stalks first.'); return; }
    clear(gSheaf); buildSheaf();
    info('<strong>Gluing…</strong> Green surface covers all stalks. Shared germs confirm agreement.');
    setTimeout(() => { if (!glueAnim) info('<strong>Sheaf ✓</strong> Green = glued global section. Circled outlines (brighter dots) confirmed the gluing axiom.'); }, 2200);
  }

  function reset() {
    if (!gStalk) return;
    dotVisuals.forEach(vis => {
      if (vis.group.parent) vis.group.parent.remove(vis.group);
      vis.group.children.forEach(c => { c.geometry?.dispose(); c.material?.map?.dispose(); c.material?.dispose(); });
    });
    dotVisuals.clear();
    if (bgGroup) { clear(bgGroup); gStalk.remove(bgGroup); bgGroup = null; }
    clear(gPre); clear(gSheaf);
    ms = []; ungroupedGerms = []; stalksFormed = false; colorIdx = 0; glueAnim = null;
    const btnStalks = document.getElementById('btn-stalks');
    if (btnStalks) btnStalks.disabled = true;
    initDotPool();
    updateUI();
  }

  // ══════════════════════════════════════════════════════════════════
  // PHASE 2: FORM STALKS — group ungrouped germs into labeled stalks
  // ══════════════════════════════════════════════════════════════════
  function formStalks() {
    if (ungroupedGerms.length === 0) {
      info('⚠️ Place some germs first with <strong>🌱 Place Germs</strong>.');
      return;
    }

    // Move all ungrouped germ groups into the ms (stalks) array
    for (const g of ungroupedGerms) {
      // Re-assign the id to match ms index
      g.id = ms.length;
      // Update owner references in dots
      g.dotIds.forEach(did => {
        const dot = dotById(did);
        if (dot) {
          // Replace old temporary id with new stalk id
          dot.owners.delete(g.id);
          dot.owners.add(ms.length);
        }
      });
      ms.push(g);
    }

    // Fix owner IDs — since we pushed them sequentially, re-scan
    // to ensure dot.owners reflect the correct ms indices
    ms.forEach((m, idx) => {
      m.id = idx;
      m.dotIds.forEach(did => {
        const dot = dotById(did);
        if (dot) dot.owners.add(idx);
      });
    });

    ungroupedGerms = [];
    stalksFormed = true;

    // Now draw stalk backgrounds (quads, borders, labels)
    rebuildStalkBackgrounds();

    // Disable "Form Stalks", enable presheaf/glue if ≥2
    const btnStalks = document.getElementById('btn-stalks');
    if (btnStalks) btnStalks.disabled = true;

    updateUI();
  }

  // ── Info display for germs phase (before stalks are formed) ──
  function updateUI_germs() {
    const totalGerms = ungroupedGerms.reduce((sum, g) => sum + g.dotIds.length, 0);
    const totalGroups = ungroupedGerms.length + ms.length;
    info(`<strong>${totalGerms}</strong> germs placed in <strong>${ungroupedGerms.length}</strong> region(s). Click <strong>📍 Form Stalks</strong> to group them, or place more germs.`);

    // Presheaf and glue stay disabled during germ phase
    const pre = document.getElementById('btn-presheaf');
    const glue = document.getElementById('btn-glue');
    if (pre) pre.disabled = true;
    if (glue) glue.disabled = true;
  }

  // ── Rebuild ONLY stalk backgrounds — dots are NEVER touched here ──
  function rebuildStalkBackgrounds() {
    if (bgGroup) {
      clear(bgGroup);
      gStalk.remove(bgGroup);
    }
    bgGroup = new THREE.Group();

    ms.forEach((m, mi) => {
      bgGroup.add(mkQuadFill(m, m.color, 0.13));
      bgGroup.add(mkQuadBorder(m, m.color));

      const lb = mkLabel('Stalk ' + mi, m.color, 2.8);
      lb.position.copy(m.center.clone().multiplyScalar(R + 0.45));
      lb.userData = { ft: 1, fd: mi * 40 + 200, fs: -1 };
      bgGroup.add(lb);
    });

    gStalk.add(bgGroup);
  }

  function mkQuadBorder(m, color) {
    const { t1, t2 } = m._tf, c = m.center, hw = m.hw + .02, hh = m.hh + .02;
    const corners = [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([u,v]) =>
      c.clone().add(t1.clone().multiplyScalar(u)).add(t2.clone().multiplyScalar(v)).normalize().multiplyScalar(R * 1.005));
    const pts = [];
    for (let i = 0; i < 4; i++) {
      const a = corners[i], b = corners[(i+1) % 4];
      for (let s = 0; s <= 8; s++) pts.push(a.clone().lerp(b.clone(), s/8).normalize().multiplyScalar(R * 1.005));
    }
    pts.push(pts[0].clone());
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false })
    );
    line.userData = { ft: 0.9, fd: 60, fs: -1 };
    return line;
  }

  function mkQuadFill(m, color, op) {
    const { t1, t2 } = m._tf, c = m.center, hw = m.hw + .02, hh = m.hh + .02, res = 6;
    const verts = [], idx = [];
    for (let i = 0; i <= res; i++) for (let j = 0; j <= res; j++) {
      const u = -hw + 2*hw*(i/res), v = -hh + 2*hh*(j/res);
      const p = c.clone().add(t1.clone().multiplyScalar(u)).add(t2.clone().multiplyScalar(v)).normalize().multiplyScalar(R * 1.004);
      verts.push(p.x, p.y, p.z);
    }
    for (let i = 0; i < res; i++) for (let j = 0; j < res; j++) {
      const a = i*(res+1)+j;
      idx.push(a, a+1, a+res+1, a+1, a+res+2, a+res+1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: 2, depthWrite: false }));
    mesh.userData = { ft: op, fd: 100, fs: -1 };
    return mesh;
  }

  function mkOutline(color, dashed) {
    if (ms.length < 1) return null;
    const allC = [];
    ms.forEach(m => {
      const { t1, t2 } = m._tf, c = m.center, hw = m.hw + .04, hh = m.hh + .04;
      [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].forEach(([u,v]) =>
        allC.push(c.clone().add(t1.clone().multiplyScalar(u)).add(t2.clone().multiplyScalar(v)).normalize()));
    });
    const cen = new THREE.Vector3(); allC.forEach(c => cen.add(c)); cen.normalize();
    const { t1, t2 } = tframe(cen);
    const p2 = allC.map(c => { const d = c.clone().sub(cen); return { x: d.dot(t1), y: d.dot(t2), orig: c }; });
    const hull = cvxHull(p2);
    if (hull.length < 3) return null;
    const pts = [];
    for (let i = 0; i < hull.length; i++) {
      const a = hull[i].orig.clone().multiplyScalar(R * 1.013), b = hull[(i+1) % hull.length].orig.clone().multiplyScalar(R * 1.013);
      for (let s = 0; s <= 10; s++) pts.push(a.clone().lerp(b.clone(), s/10).normalize().multiplyScalar(R * 1.013));
    }
    pts.push(pts[0].clone());
    let mat;
    if (dashed) mat = new THREE.LineDashedMaterial({ color, dashSize: .07, gapSize: .045, transparent: true, opacity: 0, depthWrite: false });
    else mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    if (dashed) line.computeLineDistances();
    line.userData = { ft: 0.9, fd: 100, fs: -1 };
    return line;
  }

  function cvxHull(pts) {
    if (pts.length < 3) return pts;
    pts.sort((a,b) => a.x - b.x || a.y - b.y);
    const lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && crx(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length-1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && crx(hi[hi.length-2], hi[hi.length-1], p) <= 0) hi.pop(); hi.push(p); }
    lo.pop(); hi.pop(); return lo.concat(hi);
  }
  function crx(o,a,b) { return (a.x-o.x)*(b.y-o.y) - (a.y-o.y)*(b.x-o.x); }

  function buildSheafFills() {
    return ms.map((m, mi) => {
      const { t1, t2 } = m._tf, c = m.center, hw = m.hw + .03, hh = m.hh + .03, res = 8;
      const verts = [], idx = [];
      for (let i = 0; i <= res; i++) for (let j = 0; j <= res; j++) {
        const u = -hw + 2*hw*(i/res), v = -hh + 2*hh*(j/res);
        const p = c.clone().add(t1.clone().multiplyScalar(u)).add(t2.clone().multiplyScalar(v)).normalize().multiplyScalar(R * 1.001);
        verts.push(p.x, p.y, p.z);
      }
      for (let i = 0; i < res; i++) for (let j = 0; j < res; j++) {
        const a = i*(res+1)+j;
        idx.push(a, a+1, a+res+1, a+1, a+res+2, a+res+1);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setIndex(idx); geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0, side: 2, depthWrite: false }));
      mesh.userData = { ft: 0.5, fd: mi * 80, fs: -1, type: 'glueFill', glueTarget: 0.5 };
      return mesh;
    });
  }

  function countShared() { let c = 0; dotPool.forEach(d => { if (isShared(d)) c++; }); return c; }

  function buildPresheaf() {
    clear(gPre);
    const outline = mkOutline(0x555555, true);
    if (outline) gPre.add(outline);
    const lb = mkLabel('Presheaf — ' + countShared() + ' shared germs (circled outlines). Gluable?', 0x555555, 3.2);
    lb.position.set(0, R + 1.7, 0); lb.userData = { ft: 1, fd: 200, fs: -1 };
    gPre.add(lb);
  }

	function buildSheaf() {
		clear(gSheaf);
		clear(gPre);  // ← Remove presheaf labels/outlines to prevent overlap
		if (ms.length < 2) {
			const lb = mkLabel('Need ≥2 stalks', 0x999999, 3);
			lb.position.set(0, R + 1.7, 0); lb.userData = { ft: 1, fd: 100, fs: -1 };
			gSheaf.add(lb); return;
		}
		buildSheafFills().forEach(f => gSheaf.add(f));
		const border = mkOutline(DGREEN, false);
		if (border) { border.userData.fd = 200; gSheaf.add(border); }
		const seen = new Set();
		dotPool.forEach(d => {
			if (!isShared(d) || seen.has(d.id)) return; seen.add(d.id);
			const ch = mkLabel('✓', DGREEN, 1.3);
			ch.position.copy(d.pt.clone().multiplyScalar(1.04));
			ch.userData = { ft: 1, fd: 700, fs: -1 };
			gSheaf.add(ch);
		});
		const ti = mkLabel('Sheaf — glued into one global section ✓', DGREEN, 3.2);
		ti.position.set(0, R + 1.7, 0); ti.userData = { ft: 1, fd: 500, fs: -1 };
		gSheaf.add(ti);
		glueAnim = { start: performance.now(), dur: 2000 };
	}


  function mkLabel(text, hex, sz) {
    const cv = document.createElement('canvas'), cx = cv.getContext('2d');
    cv.width = 2048; cv.height = 192;
    cx.font = 'bold 64px system-ui'; cx.fillStyle = '#' + new THREE.Color(hex).getHexString();
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(text, 1024, 96);
    const tx = new THREE.CanvasTexture(cv); tx.minFilter = THREE.LinearFilter;
    const mt = new THREE.SpriteMaterial({ map: tx, transparent: true, depthTest: false, depthWrite: false });
    mt.opacity = 0; const s = new THREE.Sprite(mt); s.scale.set(sz || 2.5, (sz || 2.5) * .12, 1); return s;
  }

  function clear(g) {
    while (g.children.length) {
      const c = g.children[0];
      if (c.children?.length) clear(c);
      c.geometry?.dispose(); c.material?.map?.dispose(); c.material?.dispose(); g.remove(c);
    }
  }

  function info(h) {
    const e = document.getElementById('sheaf-info');
    if (e) { e.style.opacity = '0'; setTimeout(() => { e.innerHTML = h; e.style.opacity = '1'; }, 200); }
  }

  function updateUI() {
    const n = ms.length, sh = countShared();
    if (!n && ungroupedGerms.length === 0) {
      info('Click <strong>🌱 Place Germs</strong> to scatter local data on the situs.');
    } else if (ungroupedGerms.length > 0) {
      updateUI_germs();
      return;
    } else {
      info(`<strong>${n}</strong> stalks, <strong style="color:#fdd835">${sh}</strong> shared germs (circled outline = overlap). ${n < 2 ? 'Place more germs and form stalks!' : ''}`);
    }
    const pre = document.getElementById('btn-presheaf'), glue = document.getElementById('btn-glue');
    if (pre) pre.disabled = n < 2;
    if (glue) glue.disabled = n < 2;
  }

  // ── Fade logic ──
  function fadeAll(obj, now) {
    const u = obj.userData;
    if (u?.fs !== undefined && u.fs !== -2) {
      if (u.fs === -1) u.fs = now;
      const el = now - u.fs - (u.fd || 0);
      if (el > 0 && obj.material && u.ft !== undefined) {
        const progress = Math.min(1, el / 500);
        obj.material.opacity = u.ft * progress * (2 - progress);
        if (progress >= 1) {
          obj.material.opacity = u.ft;
          u.fs = -2;
        }
      }
    }
    obj.children?.forEach(c => fadeAll(c, now));
  }

  function animate() {
    requestAnimationFrame(animate); t += .016; ctl.update();
    const now = performance.now();
    [gStalk, gPre, gSheaf].forEach(g => fadeAll(g, now));
    if (glueAnim) {
      const p = Math.min(1, (now - glueAnim.start) / glueAnim.dur);
      const e = p < .5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3) / 2;
      gSheaf.children.forEach(c => {
        if (c.userData.type === 'glueFill' && c.material)
          c.material.opacity = (c.userData.glueTarget || .5) * e;
      });
      gPre.children.forEach(c => {
        if (c.material && c.userData.ft !== undefined && c.userData.fs !== -2)
          c.material.opacity = c.userData.ft * Math.max(0, 1 - e * 1.5);
      });
      if (p >= 1) glueAnim = null;
    }
    ren.render(scene, cam);
  }

  function init() {
    log('init');
    const el = document.getElementById('sheaf-canvas'); if (!el) return;
    if (!el.clientWidth) el.style.width = '800px';
    if (!el.clientHeight) el.style.height = '560px';
    const w = el.clientWidth || 800, h = el.clientHeight || 560;
    scene = new THREE.Scene(); scene.background = new THREE.Color(0xf8f9fa);
    cam = new THREE.PerspectiveCamera(42, w/h, .1, 100);
    ren = new THREE.WebGLRenderer({antialias:true}); ren.setSize(w,h); ren.setPixelRatio(Math.min(devicePixelRatio,2));
    el.appendChild(ren.domElement); ctl = mkCtl(cam, ren.domElement);
    scene.add(new THREE.AmbientLight(0xffffff,.55));
    const dl = new THREE.DirectionalLight(0xffffff,.75); dl.position.set(5,8,5); scene.add(dl);
    scene.add(new THREE.DirectionalLight(0xbbdefb,.25).translateX(-4).translateY(-2).translateZ(-5));
    sphere = new THREE.Mesh(new THREE.SphereGeometry(R,48,36), new THREE.MeshPhongMaterial({color:0xe0e3f0,transparent:true,opacity:.28,shininess:80,specular:0xc5cae9,depthWrite:false}));
    wire = new THREE.Mesh(new THREE.SphereGeometry(R+.003,18,12), new THREE.MeshBasicMaterial({color:0xc5cae9,wireframe:true,transparent:true,opacity:.08}));
    const sl = mkLabel('Situs (topological space)',0x9e9e9e,3.2); sl.position.set(0,-(R+0.8),0); sl.material.opacity=0.85;
    gStalk = new THREE.Group(); gPre = new THREE.Group(); gSheaf = new THREE.Group();
    worldGroup = new THREE.Group();
    worldGroup.add(sphere); worldGroup.add(wire); worldGroup.add(sl);
    worldGroup.add(gStalk); worldGroup.add(gPre); worldGroup.add(gSheaf);
    scene.add(worldGroup);
    initDotPool();
    log(`Dot pool ready: ${dotPool.length} pre-placed dots on sphere`);
    window.addEventListener('resize',()=>{cam.aspect=(el.clientWidth||800)/(el.clientHeight||560);cam.updateProjectionMatrix();ren.setSize(el.clientWidth||800,el.clientHeight||560);});
    updateUI(); ren.render(scene,cam); log('OK'); animate();
  }

  function boot(){
    if(typeof THREE==='undefined'){setTimeout(boot,100);return;}
    const el=document.getElementById('sheaf-canvas');
    if(!el){setTimeout(boot,200);return;}
    if(!el.clientWidth||!el.clientHeight){
      el.style.width=el.style.width||'100%';el.style.height=el.style.height||'560px';el.style.minHeight='560px';
      requestAnimationFrame(()=>setTimeout(boot,100));return;
    }
    try{init();}catch(e){console.error('[SV]',e);}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();

  return { placeGerms, formStalks, showPresheaf, glueSheaf, reset };
})();

function loadPhilosophyModule () {
	CRSim.start();
}
