// viewer.js — MNIST Foam interactive viewer
// Loads sparse/dense JSON volumes and renders:
//   - three orthogonal 2D slices (canvas)
//   - a full 3D voxel point cloud (three.js)

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DATA_DIR = "data/";
const state = {
  meta: null,
  currentDigit: "total",
  variant: "aug",      // "aug" = rotation/shift augmented, "raw" = none, "diff" = aug - raw
  volume: null,        // Uint32Array of length 28*28*64
  shape: [28, 28, 64],
  samples: {},
  slice: { x: 14, y: 14, z: 32 },
  thr: 10, opacity: 1.0, cmap: "magma", log: true,
  pointSize: 2.0, showAxes: true,
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
  renderSamples("total");
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
        alphas[k]     = Math.min(1, t * state.opacity);
        k++;
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
  geom.setAttribute("alpha",    new THREE.BufferAttribute(alphas, 1));

  // custom shader material so per-voxel alpha works
  const mat = new THREE.ShaderMaterial({
    uniforms: { size: { value: state.pointSize } },
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
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 d = gl_PointCoord - vec2(0.5);
        if (dot(d,d) > 0.25) discard;         // round points
        gl_FragColor = vec4(vColor, vAlpha);
      }
    `,
    vertexColors: true,
    transparent:  true,
    depthWrite:   false,
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
    if (digit === "total") b.classList.add("active");
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
