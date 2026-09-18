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
