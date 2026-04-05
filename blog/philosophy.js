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
  let scene, cam, ren, ctl, sphere, wire, gStalk, gPre, gSheaf;
  let ms = [], t = 0, glueAnim = null, clusterCenter = null, colorIdx = 0;
  const SCOLS = [0x42a5f5,0xff7043,0xab47bc,0x26c6da,0xffca28,0x5c6bc0,0x26a69a,0xec407a];
  const GCOLS = [0xe53935,0x43a047,0x1e88e5,0xf9a825,0x8e24aa,0x00acc1,0xfb8c00,0xd81b60];
  const GREEN = 0x4caf50, DGREEN = 0x2e7d32;

  // ══════════════════════════════════════════════════════════════════
  // GERM STORE — single source of truth for all germ positions
  // ══════════════════════════════════════════════════════════════════
  const allGerms = []; // {id, dir:Vector3, pt:Vector3, color:int, owners:Set<stalkId>}
  let gid = 0;

  function addGerm(dir, color) {
    const g = {id:gid++, dir:dir.clone().normalize(), pt:dir.clone().normalize().multiplyScalar(R), color, owners:new Set()};
    allGerms.push(g);
    return g;
  }

  function germById(id) { return allGerms.find(g=>g.id===id); }

  function isShared(g) { return g.owners.size > 1; }

  // ══════════════════════════════════════════════════════════════════

  function log(m) { console.log('[SV] '+m); }

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
    const up=Math.abs(dir.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0);
    const t1=new THREE.Vector3().crossVectors(dir,up).normalize();
    return{t1,t2:new THREE.Vector3().crossVectors(dir,t1).normalize()};
  }

  function randDir() {
    const u=Math.random()*2-1,th=Math.random()*Math.PI*2,s=Math.sqrt(1-u*u);
    return new THREE.Vector3(s*Math.cos(th),u,s*Math.sin(th)).normalize();
  }

  function pickColor() { return GCOLS[Math.floor(Math.random()*GCOLS.length)]; }

  // ── Angular distance on unit sphere ────────────────────────────────
  function angDist(a, b) { return Math.acos(Math.min(1, Math.max(-1, a.dot(b)))); }

  // ── Is direction inside stalk's angular box? ───────────────────────
  // Uses angular distance from center along each tangent axis
  function inStalk(dir, m) {
    const d = dir.clone().normalize();
    const diff = d.clone().sub(m.center);
    const u = Math.abs(diff.dot(m._tf.t1));
    const v = Math.abs(diff.dot(m._tf.t2));
    return u < m.hw + 0.005 && v < m.hh + 0.005;
  }

  // ── Random direction inside stalk ──────────────────────────────────
  function randInStalk(m) {
    const{t1,t2}=m._tf;
    const u = (Math.random()*1.4-0.7)*m.hw;
    const v = (Math.random()*1.4-0.7)*m.hh;
    return m.center.clone().add(t1.clone().multiplyScalar(u)).add(t2.clone().multiplyScalar(v)).normalize();
  }

  // ── Random direction inside the OVERLAP of two stalks ──────────────
  function randInOverlap(mA, mB) {
    for(let i=0;i<200;i++) {
      // Try random point between the two centers
      const blend = 0.3 + Math.random()*0.4;
      const mid = mA.center.clone().lerp(mB.center, blend).normalize();
      const{t1,t2}=tframe(mid);
      const u = (Math.random()*0.6-0.3)*Math.min(mA.hw, mB.hw);
      const v = (Math.random()*0.6-0.3)*Math.min(mA.hh, mB.hh);
      const dir = mid.clone().add(t1.clone().multiplyScalar(u)).add(t2.clone().multiplyScalar(v)).normalize();
      if(inStalk(dir, mA) && inStalk(dir, mB)) return dir;
    }
    // Fallback: exact midpoint
    return mA.center.clone().add(mB.center).normalize();
  }

  // ── Min distance from dir to any germ in a list ────────────────────
  function minGermDist(dir, germIds) {
    let min=Infinity;
    for(const id of germIds){const g=germById(id);if(g)min=Math.min(min,angDist(dir,g.dir));}
    return min;
  }

  // ══════════════════════════════════════════════════════════════════
  // TAKE MEASUREMENT
  // ══════════════════════════════════════════════════════════════════
  function takeMeasurement() {
    if(!clusterCenter) clusterCenter = randDir();

    // 1. Stalk center — overlap ~30-40% with previous
    let center;
    if(!ms.length) {
      center = clusterCenter.clone();
    } else {
      const last = ms[ms.length-1];
      const{t1,t2}=tframe(last.center);
      const a = Math.random()*Math.PI*2;
      const shift = 0.10 + Math.random()*0.06; // moderate overlap
      center = last.center.clone()
        .add(t1.clone().multiplyScalar(Math.cos(a)*shift))
        .add(t2.clone().multiplyScalar(Math.sin(a)*shift))
        .normalize();
    }

    const hw=0.14, hh=0.11;
    const _tf = tframe(center);
    const color = SCOLS[colorIdx++%SCOLS.length];
    const mObj = {center, color, hw, hh, id:ms.length, _tf, germIds:[]};
    ms.push(mObj);

    // 2. Create 1-3 SHARED germs in the overlap region with previous stalk
    if(ms.length >= 2) {
      const prev = ms[ms.length-2];
      const numShared = 1 + Math.floor(Math.random()*3); // 1-3

      for(let s=0; s<numShared; s++) {
        // Generate position guaranteed inside BOTH stalks
        const dir = randInOverlap(prev, mObj);

        // Check not too close to existing germs
        const tooClose = minGermDist(dir, mObj.germIds) < 0.03 ||
                         minGermDist(dir, prev.germIds) < 0.03;
        if(tooClose) continue;

        const sharedGerm = addGerm(dir, pickColor());
        sharedGerm.owners.add(prev.id);
        sharedGerm.owners.add(mObj.id);
        prev.germIds.push(sharedGerm.id);
        mObj.germIds.push(sharedGerm.id);

        log(`✓ SHARED germ #${sharedGerm.id} pos=(${dir.x.toFixed(4)},${dir.y.toFixed(4)},${dir.z.toFixed(4)}) in stalks ${prev.id}&${mObj.id}`);
      }
    }

    // 3. Fill rest with unique germs
    const target = 6 + Math.floor(Math.random()*3);
    let att = 0;
    while(mObj.germIds.length < target && att < 300) {
      att++;
      const dir = randInStalk(mObj);
      if(minGermDist(dir, mObj.germIds) < 0.035) continue;
      const g = addGerm(dir, pickColor());
      g.owners.add(mObj.id);
      mObj.germIds.push(g.id);
    }

    // 4. VALIDATE
    const shared = mObj.germIds.filter(id=>{const g=germById(id);return g&&isShared(g);}).length;
    log(`Stalk #${mObj.id}: ${mObj.germIds.length} germs, ${shared} shared`);

    // Verify shared germs render at identical positions
    mObj.germIds.forEach(id=>{
      const g=germById(id);
      if(!g||!isShared(g))return;
      const owners=[...g.owners];
      log(`  Germ #${g.id}: owners=[${owners}], pos=(${g.pt.x.toFixed(6)},${g.pt.y.toFixed(6)},${g.pt.z.toFixed(6)}), color=0x${g.color.toString(16)}`);
      // THE KEY: every stalk that owns this germ will read g.pt — the SAME Vector3
    });

    clear(gPre);clear(gSheaf);glueAnim=null;
    rebuildStalks();updateUI();
  }

  // ── Rebuild visuals ────────────────────────────────────────────────
  function rebuildStalks() {
    clear(gStalk);
    ms.forEach((m,mi) => {
      const g = new THREE.Group();
      g.add(mkQuadFill(m, m.color, 0.13));
      g.add(mkQuadBorder(m, m.color));

      m.germIds.forEach((gid_,gi) => {
        const germ = germById(gid_);
        if(!germ) return;

        // ── THE CRITICAL PART ──
        // Position comes from germ.pt — the ONE canonical position
        // Shared germs: multiple stalks render a dot at germ.pt
        // They will be at the EXACT same 3D coordinate
        const pos = germ.pt.clone().multiplyScalar(1.006);
        const lookAt = germ.pt.clone().multiplyScalar(2);

        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(DOT, 16),
          new THREE.MeshBasicMaterial({color:germ.color, side:2, transparent:true, opacity:0, depthWrite:false})
        );
        dot.position.copy(pos);
        dot.lookAt(lookAt);
        dot.userData = {ft:1, fd:mi*40+gi*15, fs:-1};
        g.add(dot);

        if(isShared(germ)) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(DOT+0.015, DOT+0.03, 20),
            new THREE.MeshBasicMaterial({color:0xffffff, side:2, transparent:true, opacity:0, depthWrite:false})
          );
          ring.position.copy(pos);
          ring.lookAt(lookAt);
          ring.userData = {ft:0.9, fd:mi*40+gi*15+8, fs:-1, type:'germ', si:mi, gi};
          g.add(ring);
        }
      });

      const lb = mkLabel('Stalk '+mi, m.color, 2.8);
      lb.position.copy(m.center.clone().multiplyScalar(R+0.45));
      lb.userData = {ft:1, fd:mi*40+200, fs:-1};
      g.add(lb);
      gStalk.add(g);
    });
  }

  function mkQuadBorder(m, color) {
    const{t1,t2}=m._tf, c=m.center, hw=m.hw+.02, hh=m.hh+.02;
    const corners=[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([u,v])=>
      c.clone().add(t1.clone().multiplyScalar(u)).add(t2.clone().multiplyScalar(v)).normalize().multiplyScalar(R*1.005));
    const pts=[];
    for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4];for(let s=0;s<=8;s++)pts.push(a.clone().lerp(b.clone(),s/8).normalize().multiplyScalar(R*1.005));}
    pts.push(pts[0].clone());
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity:0,depthWrite:false}));
    line.userData={ft:0.9,fd:60,fs:-1};
    return line;
  }

  function mkQuadFill(m, color, op) {
    const{t1,t2}=m._tf, c=m.center, hw=m.hw+.02, hh=m.hh+.02, res=6;
    const verts=[], idx=[];
    for(let i=0;i<=res;i++)for(let j=0;j<=res;j++){
      const u=-hw+2*hw*(i/res), v=-hh+2*hh*(j/res);
      const p=c.clone().add(t1.clone().multiplyScalar(u)).add(t2.clone().multiplyScalar(v)).normalize().multiplyScalar(R*1.004);
      verts.push(p.x,p.y,p.z);
    }
    for(let i=0;i<res;i++)for(let j=0;j<res;j++){const a=i*(res+1)+j;idx.push(a,a+1,a+res+1,a+1,a+res+2,a+res+1);}
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    geo.setIndex(idx);geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,side:2,depthWrite:false}));
    mesh.userData={ft:op,fd:100,fs:-1};
    return mesh;
  }

  function mkOutline(color, dashed) {
    if(ms.length<1)return null;
    const allC=[];
    ms.forEach(m=>{
      const{t1,t2}=m._tf, c=m.center, hw=m.hw+.04, hh=m.hh+.04;
      [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].forEach(([u,v])=>
        allC.push(c.clone().add(t1.clone().multiplyScalar(u)).add(t2.clone().multiplyScalar(v)).normalize()));
    });
    const cen=new THREE.Vector3();allC.forEach(c=>cen.add(c));cen.normalize();
    const{t1,t2}=tframe(cen);
    const p2=allC.map(c=>{const d=c.clone().sub(cen);return{x:d.dot(t1),y:d.dot(t2),orig:c};});
    const hull=cvxHull(p2);
    if(hull.length<3)return null;
    const pts=[];
    for(let i=0;i<hull.length;i++){
      const a=hull[i].orig.clone().multiplyScalar(R*1.013),b=hull[(i+1)%hull.length].orig.clone().multiplyScalar(R*1.013);
      for(let s=0;s<=10;s++)pts.push(a.clone().lerp(b.clone(),s/10).normalize().multiplyScalar(R*1.013));
    }
    pts.push(pts[0].clone());
    let mat;
    if(dashed)mat=new THREE.LineDashedMaterial({color,dashSize:.07,gapSize:.045,transparent:true,opacity:0,depthWrite:false});
    else mat=new THREE.LineBasicMaterial({color,transparent:true,opacity:0,depthWrite:false});
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mat);
    if(dashed)line.computeLineDistances();
    line.userData={ft:0.9,fd:100,fs:-1};
    return line;
  }

  function cvxHull(pts){if(pts.length<3)return pts;pts.sort((a,b)=>a.x-b.x||a.y-b.y);const lo=[],hi=[];for(const p of pts){while(lo.length>=2&&crx(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(hi.length>=2&&crx(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}lo.pop();hi.pop();return lo.concat(hi);}
  function crx(o,a,b){return(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);}

  function buildSheafFills() {
    return ms.map((m,mi)=>{
      const{t1,t2}=m._tf, c=m.center, hw=m.hw+.03, hh=m.hh+.03, res=8;
      const verts=[], idx=[];
      for(let i=0;i<=res;i++)for(let j=0;j<=res;j++){
        const u=-hw+2*hw*(i/res), v=-hh+2*hh*(j/res);
        const p=c.clone().add(t1.clone().multiplyScalar(u)).add(t2.clone().multiplyScalar(v)).normalize().multiplyScalar(R*1.001);
        verts.push(p.x,p.y,p.z);
      }
      for(let i=0;i<res;i++)for(let j=0;j<res;j++){const a=i*(res+1)+j;idx.push(a,a+1,a+res+1,a+1,a+res+2,a+res+1);}
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
      geo.setIndex(idx);geo.computeVertexNormals();
      const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:GREEN,transparent:true,opacity:0,side:2,depthWrite:false}));
      mesh.userData={ft:0.5,fd:mi*80,fs:-1,type:'glueFill',glueTarget:0.5};
      return mesh;
    });
  }

  function countShared(){let c=0;allGerms.forEach(g=>{if(isShared(g))c++;});return c;}

  function buildPresheaf(){
    clear(gPre);
    const outline=mkOutline(0x555555,true);
    if(outline)gPre.add(outline);
    const lb=mkLabel('Presheaf — '+countShared()+' shared germs (white rings). Gluable?',0x555555,3.2);
    lb.position.set(0,R+1.7,0);lb.userData={ft:1,fd:200,fs:-1};
    gPre.add(lb);
  }

  function buildSheaf(){
    clear(gSheaf);
    if(ms.length<2){const lb=mkLabel('Need ≥2 stalks',0x999999,3);lb.position.set(0,R+1.7,0);lb.userData={ft:1,fd:100,fs:-1};gSheaf.add(lb);return;}
    buildSheafFills().forEach(f=>gSheaf.add(f));
    const border=mkOutline(DGREEN,false);
    if(border){border.userData.fd=200;gSheaf.add(border);}
    const seen=new Set();
    allGerms.forEach(g=>{
      if(!isShared(g)||seen.has(g.id))return;seen.add(g.id);
      const ch=mkLabel('✓',DGREEN,1.3);
      ch.position.copy(g.pt.clone().multiplyScalar(1.04));
      ch.userData={ft:1,fd:700,fs:-1};
      gSheaf.add(ch);
    });
    const ti=mkLabel('Sheaf — glued into one global section ✓',DGREEN,3.2);
    ti.position.set(0,R+1.7,0);ti.userData={ft:1,fd:500,fs:-1};
    gSheaf.add(ti);
    glueAnim={start:performance.now(),dur:2000};
  }

  function mkLabel(text,hex,sz){
    const cv=document.createElement('canvas'),cx=cv.getContext('2d');
    cv.width=2048;cv.height=192;
    cx.font='bold 64px system-ui';cx.fillStyle='#'+new THREE.Color(hex).getHexString();
    cx.textAlign='center';cx.textBaseline='middle';cx.fillText(text,1024,96);
    const tx=new THREE.CanvasTexture(cv);tx.minFilter=THREE.LinearFilter;
    const mt=new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false,depthWrite:false});
    mt.opacity=0;const s=new THREE.Sprite(mt);s.scale.set(sz||2.5,(sz||2.5)*.12,1);return s;
  }

  function clear(g){while(g.children.length){const c=g.children[0];if(c.children?.length)clear(c);c.geometry?.dispose();c.material?.map?.dispose();c.material?.dispose();g.remove(c);}}
  function info(h){const e=document.getElementById('sheaf-info');if(e){e.style.opacity='0';setTimeout(()=>{e.innerHTML=h;e.style.opacity='1';},200);}}

  function updateUI(){
    const n=ms.length,sh=countShared();
    if(!n)info('Click <strong>📍 Take Measurement</strong> to place germs on the situs.');
    else info(`<strong>${n}</strong> stalks, <strong style="color:#fdd835">${sh}</strong> shared germs (white ring = identical position & color). ${n<2?'Take more!':''}`);
    const pre=document.getElementById('btn-presheaf'),glue=document.getElementById('btn-glue');
    if(pre)pre.disabled=n<2;if(glue)glue.disabled=n<2;
  }

  function fadeAll(obj,now){
    const u=obj.userData;
    if(u?.fs!==undefined){if(u.fs===-1)u.fs=now;const el=now-u.fs-(u.fd||0);if(el>0&&obj.material&&u.ft!==undefined)obj.material.opacity=u.ft*Math.min(1,el/500)*(2-Math.min(1,el/500));}
    obj.children?.forEach(c=>fadeAll(c,now));
  }

  function animate(){
    requestAnimationFrame(animate);t+=.016;ctl.update();
    const now=performance.now();
    [gStalk,gPre,gSheaf].forEach(g=>fadeAll(g,now));
    gStalk.children.forEach(gr=>gr.children?.forEach(c=>{if(c.userData?.type==='germ')c.scale.setScalar(1+.1*Math.sin(t*2.5+(c.userData.gi||0)*1.5));}));
    if(glueAnim){
      const p=Math.min(1,(now-glueAnim.start)/glueAnim.dur);
      const e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
      gSheaf.children.forEach(c=>{if(c.userData.type==='glueFill'&&c.material)c.material.opacity=(c.userData.glueTarget||.5)*e;});
      gPre.children.forEach(c=>{if(c.material&&c.userData.ft!==undefined)c.material.opacity=c.userData.ft*Math.max(0,1-e*1.5);});
      if(p>=1)glueAnim=null;
    }
    [sphere,wire,gStalk,gPre,gSheaf].forEach(o=>{if(o)o.rotation.y+=.0006;});
    ren.render(scene,cam);
  }

  function init(){
    log('init');const el=document.getElementById('sheaf-canvas');if(!el)return;
    if(!el.clientWidth)el.style.width='800px';if(!el.clientHeight)el.style.height='560px';
    const w=el.clientWidth||800,h=el.clientHeight||560;
    scene=new THREE.Scene();scene.background=new THREE.Color(0xf8f9fa);
    cam=new THREE.PerspectiveCamera(42,w/h,.1,100);
    ren=new THREE.WebGLRenderer({antialias:true});ren.setSize(w,h);ren.setPixelRatio(Math.min(devicePixelRatio,2));
    el.appendChild(ren.domElement);ctl=mkCtl(cam,ren.domElement);
    scene.add(new THREE.AmbientLight(0xffffff,.55));
    const dl=new THREE.DirectionalLight(0xffffff,.75);dl.position.set(5,8,5);scene.add(dl);
    scene.add(new THREE.DirectionalLight(0xbbdefb,.25).translateX(-4).translateY(-2).translateZ(-5));
    sphere=new THREE.Mesh(new THREE.SphereGeometry(R,48,36),new THREE.MeshPhongMaterial({color:0xe0e3f0,transparent:true,opacity:.28,shininess:80,specular:0xc5cae9,depthWrite:false}));scene.add(sphere);
    wire=new THREE.Mesh(new THREE.SphereGeometry(R+.003,18,12),new THREE.MeshBasicMaterial({color:0xc5cae9,wireframe:true,transparent:true,opacity:.08}));scene.add(wire);
    const sl=mkLabel('Situs (topological space)',0x9e9e9e,3.2);sl.position.set(0,-(R+0.8),0);sl.material.opacity=0.85;scene.add(sl);
    gStalk=new THREE.Group();gPre=new THREE.Group();gSheaf=new THREE.Group();
    scene.add(gStalk);scene.add(gPre);scene.add(gSheaf);
    window.addEventListener('resize',()=>{cam.aspect=(el.clientWidth||800)/(el.clientHeight||560);cam.updateProjectionMatrix();ren.setSize(el.clientWidth||800,el.clientHeight||560);});
    updateUI();ren.render(scene,cam);log('OK');animate();
  }

  function showPresheaf(){
    if(ms.length<2){info('⚠️ Take at least <strong>2</strong> measurements.');return;}
    clear(gPre);clear(gSheaf);glueAnim=null;buildPresheaf();
    info('<strong>Presheaf:</strong> Dotted outline = all stalks. White-ringed germs = shared. No gluing guarantee yet.');
  }

  function glueSheaf(){
    if(ms.length<2){info('⚠️ Take at least <strong>2</strong> measurements.');return;}
    clear(gSheaf);buildSheaf();
    info('<strong>Gluing…</strong> Green surface covers all stalks. Shared germs confirm agreement.');
    setTimeout(()=>{if(!glueAnim)info('<strong>Sheaf ✓</strong> Green = glued global section. Shared germs (white ring, same color) confirmed the gluing axiom.');},2200);
  }

  function reset(){
    clear(gStalk);clear(gPre);clear(gSheaf);
    ms=[];colorIdx=0;clusterCenter=null;glueAnim=null;
    allGerms.length=0;gid=0;
    updateUI();
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

  return{takeMeasurement,showPresheaf,glueSheaf,reset};
})();

function loadPhilosophyModule () {
	CRSim.start();
}
