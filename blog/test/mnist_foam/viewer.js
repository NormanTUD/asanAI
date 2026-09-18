// viewer.js — MNIST Foam interactive viewer
// Loads sparse/dense JSON volumes and renders:
//   - three orthogonal 2D slices (canvas)
//   - a full 3D voxel point cloud (three.js)

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DATA_DIR = "data/";
const state = {
  meta: null,
  currentDigit: "1",
  variant: "raw",      // "aug" = rotation/shift augmented, "raw" = none, "diff" = aug - raw
  volume: null,        // Uint32Array of length 28*28*64
  shape: [28, 28, 64],
  samples: {},
  slice: { x: 14, y: 14, z: 32 },
  thr: 20, opacity: 1.0, cmap: "magma", log: true,
  pointSize: 3.0, showAxes: true,
  renderMode: "surface", // "points" | "surface" | "volume" | "mip"
  solid: true,           // points: opaque (solid) vs alpha-blended
};

// cache of already-fetched volumes keyed by `${variant}:${name}`
const volCache = {};

// -------- colormaps --------
const CMAPS = {
  magma: (t) => {  // approximation
    const r = Math.min(1, Math.max(0, 1.35*t - 0.15));
    const g = Math.min(1, Math.max(0, 1.1*t*t - 0.05));
    const b = Math.min(1, Math.max(0, 0.9*Math.sin(Math.PI*t*0.8)));
    return [r, g, b];
  },
  viridis: (t) => {
    const r = Math.min(1, Math.max(0, 0.267 + t*0.7));
    const g = Math.min(1, Math.max(0, 0.005 + t*0.98));
    const b = Math.min(1, Math.max(0, 0.33 + Math.sin(Math.PI*t)*0.4));
    return [r, g, b];
  },
  gray: (t) => [t, t, t],
  brightness: null, // handled specially: colors z-axis
};

// -------- data loading --------
async function fetchJSON(url) {
  let resp;
  try {
    resp = await fetch(url);
  } catch (e) {
    throw new Error(`Network error requesting ${url} — ${e.message}`);
  }
  const file = url.split("/").pop();
  if (!resp.ok) {
    if (resp.status === 404) {
      throw new Error(
`Missing data file: ${file}  (HTTP 404)

The voxel volumes have not been generated yet.
Build them, then click "Retry" (or reload this page):

  python3 build_data.py`);
    }
    throw new Error(`Failed to load ${file}: HTTP ${resp.status} ${resp.statusText}`);
  }
  try {
    return await resp.json();
  } catch (e) {
    throw new Error(`${file} is not valid JSON: ${e.message}`);
  }
}

async function loadVolume(variant, name) {
  const key = variant + ":" + name;
  if (volCache[key]) {
    state.volume   = volCache[key].vol;
    state.volMax   = volCache[key].max;
    state.volTotal = volCache[key].total;
    return;
  }
  // "diff" = aug - raw, computed client-side: the voxels created purely by
  // augmentation. aug >= raw holds for every cell, so this never goes negative.
  if (variant === "diff") {
    await loadVolume("aug", name);
    await loadVolume("raw", name);
    const a = volCache["aug:" + name].vol;
    const r = volCache["raw:" + name].vol;
    const d = new Uint32Array(a.length);
    let max = 0, total = 0;
    for (let i = 0; i < a.length; i++) {
      const v = a[i] - r[i];
      d[i] = v; total += v;
      if (v > max) max = v;
    }
    volCache[key] = { vol: d, max, total };
    state.volume   = d;
    state.volMax   = max;
    state.volTotal = total;
    return;
  }
  const j = await fetchJSON(`${DATA_DIR}foam_${variant}_${name}.json`);
  // support both dense ("data") and sparse ("x","y","b","count") formats
  const [W, H, B] = j.shape;
  const vol = new Uint32Array(W*H*B);
  if (j.data) {
    for (let i = 0; i < j.data.length; i++) vol[i] = j.data[i];
  } else {
    for (let i = 0; i < j.x.length; i++) {
      const idx = j.x[i]*H*B + j.y[i]*B + j.b[i];
      vol[idx] = j.count[i];
    }
  }
  volCache[key] = { vol, max: j.max, total: j.total };
  state.volume   = vol;
  state.shape    = j.shape;
  state.volMax   = j.max;
  state.volTotal = j.total;
}

function updateVolumeStats() {
  document.getElementById("volume-stats").textContent =
    `${state.volTotal.toLocaleString()} hits\nmax voxel = ${state.volMax}\n${state.volume.length} cells total`;
}

// load the volume for the current variant + digit, then redraw everything
async function refreshData() {
  const name = state.currentDigit === "total" ? "total" : `digit_${state.currentDigit}`;
  await loadVolume(state.variant, name);
  updateVolumeStats();
  redrawSlices();
  rebuild3D();
}

async function loadAll() {
  state.meta    = await fetchJSON(`${DATA_DIR}meta.json`);
  state.samples = await fetchJSON(`${DATA_DIR}samples.json`);
  document.getElementById("sz").max = state.meta.n_bins - 1;
  buildDigitButtons();
  renderSamples(state.currentDigit);
  await refreshData();
}

// -------- indexing helper --------
function at(x, y, z) {
  const [W, H, B] = state.shape;
  return state.volume[x*H*B + y*B + z];
}

function normalize(v, vmax) {
  if (state.log) return Math.log(1 + v) / Math.log(1 + vmax);
  return v / vmax;
}

// -------- 2D slice rendering --------
function drawSlice(canvasId, plane) {
  const canvas = document.getElementById(canvasId);
  const [W, H, B] = state.shape;
  let cols, rows, getVal;
  if (plane === "x") { cols = H; rows = B; getVal = (c,r) => at(state.slice.x, c, r); }
  if (plane === "y") { cols = W; rows = B; getVal = (c,r) => at(c, state.slice.y, r); }
  if (plane === "z") { cols = W; rows = H; getVal = (c,r) => at(c, r, state.slice.z); }
  canvas.width = cols; canvas.height = rows;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(cols, rows);
  const cmap = CMAPS[state.cmap] || CMAPS.magma;
  const vmax = state.volMax;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = getVal(c, r);
      const t = normalize(v, vmax);
      const [R, G, Bc] = cmap(t);
      const i = ((rows-1-r)*cols + c) * 4;   // flip Y so brightness axis goes up
      img.data[i]   = R*255;
      img.data[i+1] = G*255;
      img.data[i+2] = Bc*255;
      img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function redrawSlices() {
  drawSlice("canv-x", "x");
  drawSlice("canv-y", "y");
  drawSlice("canv-z", "z");
  document.getElementById("lbl-x").textContent = `x = ${state.slice.x} (axes: y × brightness)`;
  document.getElementById("lbl-y").textContent = `y = ${state.slice.y} (axes: x × brightness)`;
  document.getElementById("lbl-z").textContent = `brightness bin = ${state.slice.z} (axes: x × y)`;
}

// -------- 3D voxel cloud via three.js --------
let scene, camera, renderer, controls, pointCloud, axesGroup;

function init3D() {
  const container = document.getElementById("stage3d");
  const w = container.clientWidth, h = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08080c);

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000);
  camera.position.set(60, 60, 90);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(14, 14, 32);
  controls.enableDamping = true;

  window.addEventListener("resize", () => {
    const w2 = container.clientWidth, h2 = container.clientHeight;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function rebuild3D() {
  // remove previous cloud + axes
  if (pointCloud) { scene.remove(pointCloud); pointCloud.geometry.dispose(); pointCloud.material.dispose(); }
  if (axesGroup)  { scene.remove(axesGroup); }

  const [W, H, B] = state.shape;
  const vmax = state.volMax;
  const thr  = state.thr;
  const cmapFn = CMAPS[state.cmap];

  // count how many voxels pass the threshold to size the buffers
  let count = 0;
  for (let i = 0; i < state.volume.length; i++) if (state.volume[i] >= thr) count++;

  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);
  const alphas    = new Float32Array(count);
  let k = 0;
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      for (let z = 0; z < B; z++) {
        const v = state.volume[x*H*B + y*B + z];
        if (v < thr) continue;
        positions[3*k]   = x;
        positions[3*k+1] = y;
        positions[3*k+2] = z;
        const t = normalize(v, vmax);
        let r, g, b;
        if (state.cmap === "brightness") {
          // color encodes the brightness axis instead of the count
          const bt = z / (B - 1);
          [r, g, b] = CMAPS.magma(bt);
        } else {
          [r, g, b] = cmapFn(t);
        }
        colors[3*k]   = r;
        colors[3*k+1] = g;
        colors[3*k+2] = b;
        alphas[k]     = state.solid ? 1 : Math.min(1, t * state.opacity);
        k++;
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
  geom.setAttribute("alpha",    new THREE.BufferAttribute(alphas, 1));

  // custom shader material: per-voxel alpha in "transparent" mode,
  // opaque + depth-written (solid) in "solid" mode
  const mat = new THREE.ShaderMaterial({
    uniforms: { size: { value: state.pointSize }, uRound: { value: state.solid ? 0 : 1 } },
    vertexShader: `
      attribute float alpha;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float size;
      void main() {
        vColor = color;
        vAlpha = alpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mv.z);
        gl_Position  = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uRound;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 d = gl_PointCoord - vec2(0.5);
        if (uRound > 0.5 && dot(d,d) > 0.25) discard;  // round points (alpha mode)
        gl_FragColor = vec4(vColor, vAlpha);
      }
    `,
    vertexColors: true,
    transparent:  !state.solid,
    depthWrite:   state.solid,
  });

  pointCloud = new THREE.Points(geom, mat);
  scene.add(pointCloud);

  // axes
  if (state.showAxes) {
    axesGroup = new THREE.Group();
    const mkLine = (a, b, color) => {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...a), new THREE.Vector3(...b),
      ]);
      return new THREE.Line(g, new THREE.LineBasicMaterial({ color }));
    };
    axesGroup.add(mkLine([0,0,0], [W-1,0,0], 0xff4444));  // x = red
    axesGroup.add(mkLine([0,0,0], [0,H-1,0], 0x44ff44));  // y = green
    axesGroup.add(mkLine([0,0,0], [0,0,B-1], 0x4488ff));  // brightness = blue
    // bounding box
    const box = new THREE.Box3(new THREE.Vector3(0,0,0),
                               new THREE.Vector3(W-1,H-1,B-1));
    const helper = new THREE.Box3Helper(box, 0x333344);
    axesGroup.add(helper);
    scene.add(axesGroup);
  }
}

// -------- UI wiring --------
function buildDigitButtons() {
  const host = document.getElementById("digit-buttons");
  host.innerHTML = "";   // idempotent: safe to call again on Retry
  const mk = (digit, label) => {
    const b = document.createElement("button");
    b.className = "digit-btn";
    if (digit === state.currentDigit) b.classList.add("active");
    b.textContent = label;
    b.dataset.digit = digit;
    b.addEventListener("click", async () => {
      host.querySelectorAll("button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      state.currentDigit = digit;
      renderSamples(digit);
      try { await refreshData(); } catch (err) { showError(err); }
    });
    host.appendChild(b);
  };
  mk("total", "all");
  for (let d = 0; d < 10; d++) mk(String(d), String(d));
}

function renderSamples(digit) {
  const host = document.getElementById("samples");
  host.innerHTML = "";
  if (digit === "total") {
    // show a couple from each digit
    for (let d = 0; d < 10; d++) {
      const src = (state.samples[d] || [])[0];
      if (!src) continue;
      const img = document.createElement("img");
      img.src = src; img.title = `digit ${d}`;
      host.appendChild(img);
    }
  } else {
    (state.samples[digit] || []).slice(0, 16).forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      host.appendChild(img);
    });
  }
}

function wireControls() {
  document.getElementById("error-dismiss").addEventListener("click", () => {
    document.getElementById("error").hidden = true;
  });
  document.getElementById("error-retry").addEventListener("click", () => {
    document.getElementById("error").hidden = true;
    loadAll().catch(showError);
  });

  document.getElementById("variant").addEventListener("change", e => {
    state.variant = e.target.value;   // "aug", "raw" or "diff"
    refreshData().catch(showError);
  });

  const bind = (id, labelId, fn, rebuild3d=false) => {
    const el = document.getElementById(id);
    el.addEventListener("input", () => {
      if (labelId) document.getElementById(labelId).textContent = el.value;
      fn(el.value);
      if (rebuild3d) rebuild3D(); else redrawSlices();
    });
  };
  bind("sx", "sx-val", v => state.slice.x = +v);
  bind("sy", "sy-val", v => state.slice.y = +v);
  bind("sz", "sz-val", v => state.slice.z = +v);

  bind("thr", "thr-val", v => state.thr     = +v, true);
  bind("op",  "op-val",  v => state.opacity = +v, true);
  bind("ps",  "ps-val",  v => {
    state.pointSize = +v;
    if (pointCloud) pointCloud.material.uniforms.size.value = +v;
  }, false);

  document.getElementById("cmap").addEventListener("change", e => {
    state.cmap = e.target.value; redrawSlices(); rebuild3D();
  });
  document.getElementById("logscale").addEventListener("change", e => {
    state.log = e.target.value === "1"; redrawSlices(); rebuild3D();
  });
  document.getElementById("axes").addEventListener("change", e => {
    state.showAxes = e.target.value === "1"; rebuild3D();
  });
}

// -------- error handling --------
function showError(err) {
  document.getElementById("error-msg").textContent = err.message;
  document.getElementById("error").hidden = false;
  console.error("[mnist-foam]", err);
}

// -------- boot --------
(async function main() {
  init3D();
  wireControls();
  // optional URL params for shareable views: ?mode=points|surface|volume|mip&cam=front
  const qp = new URLSearchParams(location.search);
  const pm = qp.get("mode");
  if (pm && ["points", "surface", "volume", "mip"].includes(pm)) {
    state.renderMode = pm;
    const sel = document.getElementById("rendermode");
    if (sel) sel.value = pm;
  }
  if (qp.get("cam") === "front") { camera.position.set(14, 14, 100); controls.update(); }
  try {
    await loadAll();
  } catch (err) {
    showError(err);
  }
})();

// ======================================================================
// EXTRA TOOLS (purely additive) — distributions, voxel inspector,
// raw/aug/Δ lookup, snapshot, reset view, auto-rotate.
// Runs after init3D() (which ran synchronously inside main above).
// ======================================================================
(function initExtras() {
  if (!renderer || !camera || !controls) return;
  const bscale = () => (state.meta && state.meta.brightness_scale) || Math.round(256 / state.shape[2]);

  // ---- histograms: redraw only when their inputs change ----
  let _lastVol = null, _lastSig = "";
  function drawCountHist() {
    const cv = document.getElementById("hist-count"); if (!cv) return;
    const ctx = cv.getContext("2d"); const W = cv.width, Hh = cv.height;
    ctx.clearRect(0, 0, W, Hh);
    const vol = state.volume, NB = W, vmax = Math.max(1, state.volMax);
    const bins = new Float64Array(NB);
    for (let i = 0; i < vol.length; i++) {
      const t = state.log ? Math.log(1 + vol[i]) / Math.log(1 + vmax) : vol[i] / vmax;
      let b = Math.round(t * (NB - 1)); if (b < 0) b = 0; else if (b > NB - 1) b = NB - 1;
      bins[b]++;
    }
    let maxB = 0; for (let i = 0; i < NB; i++) if (bins[i] > maxB) maxB = bins[i];
    const cmap = CMAPS[state.cmap] || CMAPS.magma;
    for (let i = 0; i < NB; i++) {
      const h = maxB ? (bins[i] / maxB) * (Hh - 1) : 0;
      const [r, g, b] = cmap(i / (NB - 1));
      ctx.fillStyle = `rgb(${(r*255)|0},${(g*255)|0},${(b*255)|0})`;
      ctx.fillRect(i, Hh - h, 1, h);
    }
    const tT = state.log ? Math.log(1 + state.thr) / Math.log(1 + vmax) : state.thr / vmax;
    ctx.fillStyle = "#f44"; ctx.fillRect(Math.round(tT * (NB - 1)), 0, 1, Hh);   // threshold marker
  }
  function drawBrightHist() {
    const cv = document.getElementById("hist-bright"); if (!cv) return;
    const ctx = cv.getContext("2d"); const W = cv.width, Hh = cv.height;
    ctx.clearRect(0, 0, W, Hh);
    const vol = state.volume; const [Wd, Hd, B] = state.shape;
    const bins = new Float64Array(B);
    for (let x = 0; x < Wd; x++) for (let y = 0; y < Hd; y++)
      for (let z = 0; z < B; z++) bins[z] += vol[x*Hd*B + y*B + z];
    let maxB = 0; for (let z = 0; z < B; z++) if (bins[z] > maxB) maxB = bins[z];
    const perCol = W / (B - 1);
    for (let z = 0; z < B; z++) {
      const h = maxB ? (bins[z] / maxB) * (Hh - 1) : 0;
      const [r, g, b] = CMAPS.magma(z / (B - 1));
      ctx.fillStyle = `rgb(${(r*255)|0},${(g*255)|0},${(b*255)|0})`;
      ctx.fillRect(Math.round(z * perCol), Hh - h, Math.max(1, perCol), h);
    }
  }
  (function extrasLoop() {
    requestAnimationFrame(extrasLoop);
    const vol = state.volume; if (!vol) return;
    const sig = state.thr + "|" + state.log + "|" + state.cmap;
    if (vol === _lastVol && sig === _lastSig) return;
    _lastVol = vol; _lastSig = sig;
    drawCountHist(); drawBrightHist();
  })();

  // ---- voxel hover inspector (raycast the point cloud) ----
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.5;
  const pointer = new THREE.Vector2();
  let _lastRay = 0;
  renderer.domElement.addEventListener("pointermove", (e) => {
    const el = document.getElementById("hover-result");
    if (!el) return;
    if (!pointCloud) { el.textContent = "hover the 3D cloud…"; return; }
    const now = performance.now(); if (now - _lastRay < 40) return; _lastRay = now;
    const r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(pointCloud);
    if (hits.length) {
      const idx = hits[0].index, p = pointCloud.geometry.attributes.position;
      const x = Math.round(p.getX(idx)), y = Math.round(p.getY(idx)), z = Math.round(p.getZ(idx));
      const c = state.volume[x*state.shape[1]*state.shape[2] + y*state.shape[2] + z];
      el.textContent = `voxel (x=${x}, y=${y}, bin=${z})\ncount = ${c}\nbrightness ~${z*bscale()}–${(z+1)*bscale()}`;
    } else {
      el.textContent = "hover the 3D cloud…";
    }
  });

  // ---- voxel lookup: show raw / aug / Δ for an exact (x,y,bin) ----
  function doLookup() {
    const el = document.getElementById("lookup-result");
    const x = +document.getElementById("lx").value;
    const y = +document.getElementById("ly").value;
    const z = +document.getElementById("lz").value;
    const [W, H, B] = state.shape;
    if (!state.volume) { el.textContent = "no data loaded"; return; }
    if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= B) {
      el.textContent = `out of range (x 0–${W-1}, y 0–${H-1}, bin 0–${B-1})`; return;
    }
    const idx = x*H*B + y*B + z;
    const name = state.currentDigit === "total" ? "total" : `digit_${state.currentDigit}`;
    const sv = state.volume, sm = state.volMax, st = state.volTotal;  // save: don't disturb the view
    const val = { current: state.volume[idx] };
    (async () => {
      for (const v of ["raw", "aug"]) {
        try { await loadVolume(v, name); val[v] = volCache[v + ":" + name].vol[idx]; }
        catch (e) { val[v] = "n/a (file missing)"; }
      }
      state.volume = sv; state.volMax = sm; state.volTotal = st;      // restore
      val.diff = (typeof val.raw === "number" && typeof val.aug === "number") ? val.aug - val.raw : "n/a";
      el.textContent =
        `voxel (x=${x}, y=${y}, bin=${z})  brightness ~${z*bscale()}–${(z+1)*bscale()}\n` +
        `raw   = ${val.raw}\naug   = ${val.aug}\nΔ a−r = ${val.diff}\n` +
        `current (${state.variant}) = ${val.current}`;
    })();
  }
  ["lx", "ly", "lz"].forEach(id => document.getElementById(id).addEventListener("input", doLookup));

  // ---- view tools: snapshot, reset, auto-rotate ----
  document.getElementById("btn-snap").addEventListener("click", () => {
    renderer.render(scene, camera);                       // fresh frame in the buffer
    const a = document.createElement("a");
    a.href = renderer.domElement.toDataURL("image/png");
    a.download = `mnist_foam_${state.currentDigit}_${state.variant}.png`;
    a.click();
  });
  document.getElementById("btn-reset").addEventListener("click", () => {
    camera.position.set(60, 60, 90);
    controls.target.set(14, 14, 32);
    controls.update();
  });
  document.getElementById("autorot").addEventListener("change", (e) => {
    controls.autoRotate = e.target.value === "1";
    controls.autoRotateSpeed = 1.5;
  });
})();

// ======================================================================
// 3D CLIPPING + 2D FOCUS SLICE (purely additive)
//  - 3D clipping: saws the point cloud along x / y / brightness
//  - 2D focus: one 2D slice where you freely pick axis + position
// ======================================================================
(function initSlicing() {
  if (!renderer || !camera || !scene) return;

  const clip  = { axis: "off", pos: 14 };
  const focus = { axis: "x", pos: 14 };
  let sliceCloud = null;

  function pointMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: { size: { value: state.pointSize }, uRound: { value: state.solid ? 0 : 1 } },
      vertexShader: `
        attribute float alpha;
        varying vec3 vColor; varying float vAlpha; uniform float size;
        void main(){ vColor=color; vAlpha=alpha;
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_PointSize = size*(300.0/-mv.z); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `
        uniform float uRound;
        varying vec3 vColor; varying float vAlpha;
        void main(){ vec2 d=gl_PointCoord-vec2(0.5);
          if (uRound > 0.5 && dot(d,d)>0.25) discard;
          gl_FragColor=vec4(vColor,vAlpha); }`,
      vertexColors: true, transparent: !state.solid, depthWrite: state.solid
    });
  }

  // rebuild the (clipped) 3D cloud; hides the original while clipping
  function buildSliceCloud() {
    if (sliceCloud) { scene.remove(sliceCloud); sliceCloud.geometry.dispose(); sliceCloud.material.dispose(); sliceCloud = null; }
    const vol = state.volume;
    if (!vol || clip.axis === "off") { if (pointCloud) pointCloud.visible = true; return; }
    const [W, H, B] = state.shape;
    const vmax = Math.max(1, state.volMax), thr = state.thr, ax = clip.axis, pos = clip.pos;
    const coord = (x, y, z) => ax === "x" ? x : ax === "y" ? y : z;
    let n = 0;
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < B; z++) {
      if (coord(x, y, z) > pos) continue;
      if (vol[x*H*B + y*B + z] < thr) continue;
      n++;
    }
    const positions = new Float32Array(n*3), colors = new Float32Array(n*3), alphas = new Float32Array(n);
    const cmap = CMAPS[state.cmap] || CMAPS.magma; let k = 0;
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < B; z++) {
      if (coord(x, y, z) > pos) continue;
      const v = vol[x*H*B + y*B + z]; if (v < thr) continue;
      positions[k*3] = x; positions[k*3+1] = y; positions[k*3+2] = z;
      let r, g, b;
      if (state.cmap === "brightness") { const bt = z / (B - 1); [r, g, b] = CMAPS.magma(bt); }
      else { const t = state.log ? Math.log(1 + v) / Math.log(1 + vmax) : v / vmax; [r, g, b] = cmap(t); }
      colors[k*3] = r; colors[k*3+1] = g; colors[k*3+2] = b;
      alphas[k] = state.solid ? 1 : Math.min(1, (state.log ? Math.log(1 + v) / Math.log(1 + vmax) : v / vmax) * state.opacity);
      k++;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
    sliceCloud = new THREE.Points(geom, pointMaterial());
    scene.add(sliceCloud);
    if (pointCloud) pointCloud.visible = false;   // hide original, show sawn-off cloud
  }

  function drawFocus() {
    const cv = document.getElementById("focus-canvas");
    const vol = state.volume; if (!cv || !vol) return;
    const [W, H, B] = state.shape;
    let cols, rows, getVal;
    if (focus.axis === "x") { cols = H; rows = B; getVal = (c, r) => vol[focus.pos*H*B + c*B + r]; }
    else if (focus.axis === "y") { cols = W; rows = B; getVal = (c, r) => vol[c*H*B + focus.pos*B + r]; }
    else { cols = W; rows = H; getVal = (c, r) => vol[c*H*B + r*B + focus.pos]; }
    cv.width = cols; cv.height = rows;
    const ctx = cv.getContext("2d"), img = ctx.createImageData(cols, rows);
    const cmap = CMAPS[state.cmap] || CMAPS.magma, vmax = Math.max(1, state.volMax);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const v = getVal(c, r), t = state.log ? Math.log(1 + v) / Math.log(1 + vmax) : v / vmax;
      const [R, G, Bc] = cmap(t), i = ((rows - 1 - r) * cols + c) * 4;
      img.data[i] = R*255; img.data[i+1] = G*255; img.data[i+2] = Bc*255; img.data[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  // redraw only when the relevant inputs change
  let _clipVol = null, _clipSig = "", _focusVol = null, _focusSig = "";
  (function slicingLoop() {
    requestAnimationFrame(slicingLoop);
    const vol = state.volume; if (!vol) return;
    const cs = [state.thr, state.opacity, state.log, state.cmap, state.pointSize, state.solid, clip.axis, clip.pos].join("|");
    if (vol !== _clipVol || cs !== _clipSig) { _clipVol = vol; _clipSig = cs; buildSliceCloud(); }
    const fs = [focus.axis, focus.pos, state.log, state.cmap].join("|");
    if (vol !== _focusVol || fs !== _focusSig) { _focusVol = vol; _focusSig = fs; drawFocus(); }
  })();

  const setMax = (el, isZ) => { const m = isZ ? state.shape[2] - 1 : 27; el.max = m; if (+el.value > m) el.value = m; };
  document.getElementById("clip-axis").addEventListener("change", e => {
    clip.axis = e.target.value;
    setMax(document.getElementById("clip-pos"), e.target.value === "z");
    _clipSig = "";
  });
  document.getElementById("clip-pos").addEventListener("input", e => {
    clip.pos = +e.target.value;
    document.getElementById("clip-val").textContent = clip.pos;
    _clipSig = "";
  });
  document.getElementById("focus-axis").addEventListener("change", e => {
    focus.axis = e.target.value;
    setMax(document.getElementById("focus-pos"), e.target.value === "z");
    _focusSig = "";
  });
  document.getElementById("focus-pos").addEventListener("input", e => {
    focus.pos = +e.target.value;
    document.getElementById("focus-val").textContent = focus.pos;
    _focusSig = "";
  });
})();

// ======================================================================
// RENDER MODES (purely additive)
//
//   points  : alpha point cloud, depth-sorted back-to-front every time the
//             camera moves (painter's algorithm) so overlapping points
//             composite correctly — fixes the "washed-out front view"
//   surface : opaque shell — only voxels with at least one empty neighbour,
//             drawn as solid instanced boxes with depth testing
//   volume  : true ray-marched volume rendering (front-to-back alpha
//             compositing through a 3D texture, the standard CT/MRI style)
//   mip     : max-intensity projection — the strongest voxel on each view
//             ray (the "shadow" of the volume from the current angle)
// ======================================================================
(function initRenderModes() {
  if (!renderer || !camera || !scene || !controls) return;

  const NBINS = 4096;
  const BG = new THREE.Color(0x08080c);
  let surfaceMesh = null, surfaceSig = "";
  let volTex = null, lutTex = null, lutSig = "";
  let quad = null, quadMat = null;
  let camDirty = true;
  const _camPos = new THREE.Vector3(1e9, 0, 0);
  const _tgt = new THREE.Vector3(1e9, 0, 0);
  const tmpM = new THREE.Matrix4();
  const scratch = {
    d: new Float32Array(0), order: new Int32Array(0),
    counts: new Int32Array(0), binStart: new Int32Array(0), cur: new Int32Array(0),
    base: new WeakMap(),
  };
  const knownPointObjs = new WeakSet();

  const volKey = () => state.variant + ":" + (state.currentDigit === "total" ? "total" : "digit_" + state.currentDigit);
  const clipAxisVal = () => document.getElementById("clip-axis").value;
  const clipPosVal  = () => +document.getElementById("clip-pos").value;

  // ---------- points: painter's-algorithm depth sort ----------
  function baseFor(obj) {
    let b = scratch.base.get(obj);
    if (!b) {
      const p = obj.geometry.attributes.position.array;
      b = {
        pos: p.slice(),
        col: obj.geometry.attributes.color.array.slice(),
        alp: obj.geometry.attributes.alpha.array.slice(),
        n: p.length / 3,
      };
      scratch.base.set(obj, b);
    }
    return b;
  }

  function sortActivePoints() {
    if (!pointCloud) return;
    const pts = scene.children.filter(o => o.isPoints);
    const obj = pts.find(o => o.visible !== false) || pointCloud;
    if (!obj || !obj.visible) return;
    const b = baseFor(obj);
    const n = b.n;
    if (!n || n > 200000) return;
    if (scratch.d.length < n) { scratch.d = new Float32Array(n); scratch.order = new Int32Array(n); }
    if (scratch.counts.length < NBINS) {
      scratch.counts = new Int32Array(NBINS);
      scratch.binStart = new Int32Array(NBINS);
      scratch.cur = new Int32Array(NBINS);
    }
    const d = scratch.d, cp = camera.position;
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < n; i++) {
      const dx = b.pos[3*i] - cp.x, dy = b.pos[3*i+1] - cp.y, dz = b.pos[3*i+2] - cp.z;
      const s = dx*dx + dy*dy + dz*dz;
      d[i] = s;
      if (s < mn) mn = s; else if (s > mx) mx = s;
    }
    const span = (mx - mn) || 1;
    const counts = scratch.counts; counts.fill(0);
    for (let i = 0; i < n; i++) {
      let bi = ((d[i] - mn) / span * (NBINS - 1)) | 0;
      if (bi < 0) bi = 0; else if (bi >= NBINS) bi = NBINS - 1;
      d[i] = bi;                 // stash bin back, reuse buffer
      counts[bi]++;
    }
    // output order: far bin first (drawn first by the GPU), near last
    let cursor = n;
    for (let bi = NBINS - 1; bi >= 0; bi--) { cursor -= counts[bi]; scratch.binStart[bi] = cursor; }
    scratch.cur.set(scratch.binStart);
    const order = scratch.order, cur = scratch.cur;
    for (let i = 0; i < n; i++) order[cur[d[i]]++] = i;
    const P = obj.geometry.attributes.position, C = obj.geometry.attributes.color, A = obj.geometry.attributes.alpha;
    for (let o = 0; o < n; o++) {
      const i = order[o], j3 = 3 * i, o3 = 3 * o;
      P.array[o3] = b.pos[j3]; P.array[o3+1] = b.pos[j3+1]; P.array[o3+2] = b.pos[j3+2];
      C.array[o3] = b.col[j3]; C.array[o3+1] = b.col[j3+1]; C.array[o3+2] = b.col[j3+2];
      A.array[o] = b.alp[i];
    }
    P.needsUpdate = C.needsUpdate = A.needsUpdate = true;
  }

  // ---------- surface shell (opaque instanced boxes) ----------
  function buildSurface() {
    if (surfaceMesh) { scene.remove(surfaceMesh); surfaceMesh.geometry.dispose(); surfaceMesh.material.dispose(); surfaceMesh = null; }
    const vol = state.volume;
    if (!vol) return;
    const [W, H, B] = state.shape;
    const thr = state.thr, vmax = Math.max(1, state.volMax);
    const cax = clipAxisVal(), cpos = clipPosVal();
    const clipOk = (x, y, z) => {
      const c = cax === "x" ? x : cax === "y" ? y : cax === "z" ? z : -1;
      return c <= cpos;
    };
    const nb = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= B) ? 0 : vol[x*H*B + y*B + z];
    const isShell = (x, y, z) =>
      nb(x+1,y,z) < thr || nb(x-1,y,z) < thr || nb(x,y+1,z) < thr ||
      nb(x,y-1,z) < thr || nb(x,y,z+1) < thr || nb(x,y,z-1) < thr;
    let n = 0;
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < B; z++)
      if (vol[x*H*B + y*B + z] >= thr && clipOk(x, y, z) && isShell(x, y, z)) n++;
    if (!n) return;
    // 0.99 (not 1.0) avoids z-fighting on shared faces while still tiling solid
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.99, 0.99, 0.99), new THREE.MeshBasicMaterial(), n);
    const M = new THREE.Matrix4(), CC = new THREE.Color();
    const cmap = state.cmap === "brightness" ? CMAPS.magma : (CMAPS[state.cmap] || CMAPS.magma);
    let k = 0;
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < B; z++) {
      const v = vol[x*H*B + y*B + z];
      if (v < thr || !clipOk(x, y, z) || !isShell(x, y, z)) continue;
      M.makeTranslation(x, y, z);
      mesh.setMatrixAt(k, M);
      const t = state.cmap === "brightness" ? z / (B - 1)
              : (state.log ? Math.log(1 + v) / Math.log(1 + vmax) : v / vmax);
      const [r, g, bl] = cmap(t);
      mesh.setColorAt(k, CC.setRGB(r, g, bl));
      k++;
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
    surfaceMesh = mesh;
  }

  // ---------- 3D volume texture (r = log-norm count, g = linear-norm count) ----------
  function buildVolTexture() {
    if (volTex) { volTex.dispose(); volTex = null; }
    const vol = state.volume;
    if (!vol) return;
    const [W, H, B] = state.shape;
    const vmax = Math.max(1, state.volMax);
    const data = new Uint8Array(W * H * B * 4);
    for (let i = 0; i < vol.length; i++) {
      const v = vol[i];
      data[4*i]     = Math.min(255, Math.round(Math.log(1 + v) / Math.log(1 + vmax) * 255));
      data[4*i + 1] = Math.min(255, Math.round(v / vmax * 255));
      data[4*i + 2] = 0;
      data[4*i + 3] = 255;
    }
    volTex = new THREE.Data3DTexture(data, W, H, B);
    volTex.format = THREE.RGBAFormat;
    volTex.type = THREE.UnsignedByteType;
    volTex.wrapS = volTex.wrapT = volTex.wrapR = THREE.ClampToEdgeWrapping;
    volTex.needsUpdate = true;
    volTex.userData.vol = vol;
  }

  // ---------- 256-entry colormap LUT (1D texture) ----------
  function buildLUT() {
    if (lutTex) { lutTex.dispose(); lutTex = null; }
    const fn = state.cmap === "brightness" ? CMAPS.magma : (CMAPS[state.cmap] || CMAPS.magma);
    const data = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) {
      const [r, g, b] = fn(i / 255);
      data[4*i] = r * 255; data[4*i+1] = g * 255; data[4*i+2] = b * 255; data[4*i+3] = 255;
    }
    lutTex = new THREE.DataTexture(data, 256, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    lutTex.magFilter = THREE.LinearFilter;
    lutTex.minFilter = THREE.LinearFilter;
    lutTex.needsUpdate = true;
  }

  // ---------- ray-marched volume / MIP (fullscreen quad) ----------
  (function makeQuad() {
    const uniforms = {
      uVol:      { value: null },
      uLUT:      { value: null },
      uInvPV:    { value: new THREE.Matrix4() },
      uBoxMax:   { value: new THREE.Vector3(27, 27, 63) },
      uThr:      { value: 10 },
      uVmax:     { value: 1 },
      uLog:      { value: 1 },
      uByBin:    { value: 0 },
      uOpacity:  { value: 1 },
      uMode:     { value: 0 },   // 0 = front-to-back compositing, 1 = MIP
      uClipAxis: { value: 0 },   // 0 none, 1 x, 2 y, 3 z
      uClipPos:  { value: 999 },
      uBg:       { value: new THREE.Vector3(BG.r, BG.g, BG.b) },
    };
    quadMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vNdc;
        void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `
        varying vec2 vNdc;
        uniform sampler3D uVol;
        uniform sampler2D uLUT;
        uniform mat4 uInvPV;
        uniform vec3 uBoxMax, uBg;
        uniform float uThr, uVmax, uLog, uByBin, uOpacity, uMode, uClipPos;
        uniform int uClipAxis;
        #ifdef GL_ES
          #define TEX2(t, u) texture(t, u)
          #define TEX3(t, u) texture(t, u)
        #else
          #define TEX2(t, u) texture2D(t, u)
          #define TEX3(t, u) texture3D(t, u)
        #endif
        void main() {
          vec3 ro = cameraPosition;
          vec4 pf = uInvPV * vec4(vNdc, 1.0, 1.0);
          vec3 rd = normalize(pf.xyz / pf.w - ro);
          // slab intersection with the box [0, uBoxMax]
          vec3 inv = 1.0 / (rd + vec3(1e-7));
          vec3 ta = (-ro) * inv;
          vec3 tb = (uBoxMax - ro) * inv;
          vec3 t0 = min(ta, tb);
          vec3 t1 = max(ta, tb);
          float tN = max(max(t0.x, t0.y), t0.z);
          float tF = min(min(t1.x, t1.y), t1.z);
          if (tF < max(tN, 0.0)) { gl_FragColor = vec4(uBg, 1.0); return; }
          tN = max(tN, 0.0);
          const int N = 128;
          float dt = (tF - tN) / float(N);
          float logVmax = log(1.0 + uVmax);
          vec3 acc = vec3(0.0);
          float aAcc = 0.0;
          float tMax = 0.0;
          for (int i = 0; i < N; i++) {
            vec3 p = ro + rd * (tN + dt * (float(i) + 0.5));
            float c = uClipAxis == 1 ? p.x : (uClipAxis == 2 ? p.y : (uClipAxis == 3 ? p.z : -1.0));
            if (c > uClipPos) continue;
            vec3 uvw = p / uBoxMax;
            if (uvw.x < 0.0 || uvw.y < 0.0 || uvw.z < 0.0 || uvw.x > 1.0 || uvw.y > 1.0 || uvw.z > 1.0) continue;
            vec2 s = TEX3(uVol, uvw).rg;
            float v = uLog > 0.5 ? exp(s.r * logVmax) - 1.0 : s.g * uVmax;
            if (v < uThr) continue;
            float t = uLog > 0.5 ? s.r : s.g;
            float tt = uByBin > 0.5 ? p.z / uBoxMax.z : t;
            vec3 cc = TEX2(uLUT, vec2(tt, 0.5)).rgb;
            if (uMode > 0.5) { if (t > tMax) tMax = t; continue; }
            float a = min(uOpacity * (0.3 + 0.7 * t), 1.0);
            acc += (1.0 - aAcc) * cc * a;
            aAcc += (1.0 - aAcc) * a;
            if (aAcc > 0.999) break;
          }
          vec3 col;
          if (uMode > 0.5) col = tMax > 0.0 ? TEX2(uLUT, vec2(tMax, 0.5)).rgb : uBg;
          else             col = acc + uBg * (1.0 - aAcc);
          gl_FragColor = vec4(col, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat);
    quad.frustumCulled = false;
    quad.renderOrder = 999;   // fullscreen, drawn over the 3D scene
    quad.visible = false;
    scene.add(quad);
  })();

  // ---------- master sync loop ----------
  (function modeLoop() {
    requestAnimationFrame(modeLoop);
    if (!state.volume || !state.meta) return;
    const mode = state.renderMode;
    const [W, H, B] = state.shape;

    // did the camera move? (covers orbit, reset, auto-rotate)
    if (camera.position.distanceToSquared(_camPos) > 1e-6 ||
        controls.target.distanceToSquared(_tgt) > 1e-6) {
      _camPos.copy(camera.position);
      _tgt.copy(controls.target);
      camDirty = true;
    }
    // a freshly built point object is unsorted -> force a sort
    for (const o of scene.children) if (o.isPoints && !knownPointObjs.has(o)) { knownPointObjs.add(o); camDirty = true; }

    // mode gating
    if (mode !== "points") {
      for (const o of scene.children) if (o.isPoints) o.visible = false;
    } else {
      const clipOn = clipAxisVal() !== "off";
      const pts = scene.children.filter(o => o.isPoints);
      const sc = pts.find(o => o !== pointCloud) || null;
      if (pointCloud) pointCloud.visible = !clipOn || !sc;
      if (sc) sc.visible = clipOn;
    }
    if (surfaceMesh) surfaceMesh.visible = (mode === "surface");
    quad.visible = (mode === "volume" || mode === "mip");

    // axes as overlay in the fullscreen modes (orientation cue)
    if (axesGroup) {
      const overlay = mode === "volume" || mode === "mip";
      axesGroup.traverse(o => {
        if (!o.material) return;
        o.renderOrder = overlay ? 1000 : 0;
        o.material.depthTest = !overlay;
      });
    }

    // surface shell: rebuild only when its inputs change
    if (mode === "surface") {
      const sig = ["s", volKey(), state.thr, state.log, state.cmap, clipAxisVal(), clipPosVal()].join("|");
      if (sig !== surfaceSig) { surfaceSig = sig; buildSurface(); }
    }

    // volume / mip: keep texture + uniforms in sync
    if (mode === "volume" || mode === "mip") {
      if (!volTex || volTex.userData.vol !== state.volume) buildVolTexture();
      if (state.cmap !== lutSig) { lutSig = state.cmap; buildLUT(); }
      const u = quadMat.uniforms;
      u.uVol.value = volTex;
      u.uLUT.value = lutTex;
      u.uBoxMax.value.set(W - 1, H - 1, B - 1);
      u.uThr.value = state.thr;
      u.uVmax.value = Math.max(1, state.volMax);
      u.uLog.value = state.log ? 1 : 0;
      u.uByBin.value = state.cmap === "brightness" ? 1 : 0;
      u.uOpacity.value = state.opacity;
      u.uMode.value = mode === "mip" ? 1 : 0;
      const ca = clipAxisVal();
      u.uClipAxis.value = ca === "x" ? 1 : ca === "y" ? 2 : ca === "z" ? 3 : 0;
      u.uClipPos.value = clipPosVal();
      tmpM.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse).invert();
      u.uInvPV.value.copy(tmpM);
    }

    // points: re-sort only while the camera is actually moving
    // (opaque/solid points don't need an order — depth testing handles it)
    if (mode === "points" && !state.solid && camDirty) { camDirty = false; sortActivePoints(); }
  })();

  document.getElementById("rendermode").addEventListener("change", e => {
    if (e.target.value === "points") camDirty = true;   // re-sort on (re)entry
    state.renderMode = e.target.value;
  });
  document.getElementById("solid").addEventListener("change", e => {
    state.solid = e.target.value === "1";
    if (!state.solid) camDirty = true;
    rebuild3D();
  });
})();
