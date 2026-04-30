// ══════════════════════════════════════════════════════════
// TORUS ↔ MUG MORPH — TRUE 3D SMOOTH PARAMETRIC SURFACE
// Uses Three.js with OrbitControls for free rotation
// ══════════════════════════════════════════════════════════

function initTorusMorph() {
  const container = document.getElementById('torus-3d-container');
  const slider = document.getElementById('torus-morph');
  const label = document.getElementById('morph-label');
  if (!container || !slider) return;

  const W = 700, H = 440;

  // ═══════════════════════════════════════════════════════
  // THREE.JS SETUP
  // ═══════════════════════════════════════════════════════

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a1a);

  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);
  camera.position.set(4, 3, 5);
  camera.lookAt(0, 0.4, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // OrbitControls — attached to renderer.domElement (Fix #10)
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 12;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;
  controls.target.set(0, 0.4, 0);

  let idleTimer = null;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    clearTimeout(idleTimer);
  });
  controls.addEventListener('end', () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { controls.autoRotate = true; }, 4000);
  });

  // Prevent slider from triggering orbit controls (Fix #10)
  slider.addEventListener('pointerdown', e => e.stopPropagation());

  // Lighting (Fix #6 — good lighting makes normals visible)
  scene.add(new THREE.AmbientLight(0x404060, 0.7));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(5, 8, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x6688cc, 0.3);
  fillLight.position.set(-4, -2, -3);
  scene.add(fillLight);
  const backLight = new THREE.DirectionalLight(0x00d4aa, 0.2);
  backLight.position.set(0, -4, -5);
  scene.add(backLight);

  // ═══════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function smoothstep(t) {
    t = clamp(t, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // ═══════════════════════════════════════════════════════
  // MUG GEOMETRY BUILDER (Fix #1, #2, #3, #7)
  //
  // We build the mug as a structured grid of vertices:
  //
  // The mug is divided into RINGS (horizontal slices).
  // Each ring is a circle of vertices at a specific (radius, height).
  //
  // Ring layout (bottom to top):
  //   Rings 0-1: Bottom (outer edge to inner edge at y=bottom)
  //   Rings 2-N: Outer wall (bottom to top, at r=outerR)
  //   Rings N+1-N+2: Rim (outer to inner at y=top)
  //   Rings N+3-2N: Inner wall (top to bottom, at r=innerR)
  //   Ring 2N+1: Inner bottom (connects to ring 1)
  //
  // This creates a closed surface (the mug body shell).
  //
  // The HANDLE is integrated by modifying vertices in a
  // specific angular range: instead of following the body
  // cylinder, those vertices follow the handle C-curve.
  //
  // CRITICAL INSIGHT: We DON'T build handle as separate geometry.
  // Instead, we use a TORUS-TOPOLOGY grid (NRings × NSegments)
  // where:
  //   - NSegments = vertices around the azimuth (like torus u)
  //   - NRings = vertices around the profile (like torus v)
  //
  // For the MUG, the "profile" at each azimuthal position is:
  //   - Away from handle: the mug wall cross-section
  //   - At handle: the profile detours through the handle
  //
  // For the TORUS, the profile is always a circle.
  //
  // Same topology → same index buffer → smooth morph!
  // ═══════════════════════════════════════════════════════

  // Grid resolution
  const N_SEG = 80;  // around azimuth (u direction)
  const N_RING = 60; // around profile (v direction)

  // Mug dimensions
  const MUG = {
    outerR: 0.82,
    innerR: 0.66,
    height: 1.7,
    bottomY: -0.3,
    bottomThick: 0.13,
    rimThick: 0.04,
    // Handle
    handleR: 0.52,       // how far handle center extends from body
    handleHalfH: 0.48,   // half vertical span
    handleCenterY: 0.55, // vertical center of handle
    handleTubeR: 0.085,  // tube radius
  };

  // Torus dimensions
  const TOR = {
    R: 1.05,  // major radius
    r: 0.36,  // minor radius
  };

  // Handle angular region (in segment-space)
  // Handle occupies segments in a range around segment 0
  const HANDLE_SEG_COUNT = 10; // number of segments dedicated to handle
  const HANDLE_BLEND_SEGS = 3; // transition segments on each side

  // ═══════════════════════════════════════════════════════
  // PROFILE DEFINITIONS
  //
  // The "profile" is the closed curve traced by v (ring index)
  // at a given azimuthal position u (segment index).
  //
  // BODY PROFILE (away from handle):
  //   Traces the mug wall cross-section. This is a tall thin
  //   closed loop:
  //     - Outer wall (going up)
  //     - Rim (going inward)
  //     - Inner wall (going down)
  //     - Bottom (going outward)
  //
  // HANDLE PROFILE (at handle position):
  //   Traces around the handle tube cross-section, with the
  //   tube center following the handle's C-curve skeleton.
  //
  // The profile is parameterized by ringT ∈ [0, 1).
  // ═══════════════════════════════════════════════════════

  // Body profile: returns {r, y} for a given ringT
  function bodyProfile(ringT) {
    const t = ringT;
    let r, y;

    // The profile traces a closed path that forms the mug cross-section:
    //
    //   Outer wall (up) → Rim (inward) → Inner wall (down) → 
    //   Inner bottom (inward to center) → Outer bottom (outward from center) → 
    //   Back to outer wall start
    //
    // Going through r=0 at the bottom creates a SOLID DISC (the mug's base).

    if (t < 0.28) {
      // Outer wall: bottom to top
      const lt = t / 0.28;
      r = MUG.outerR;
      y = lerp(MUG.bottomY, MUG.bottomY + MUG.height, lt);
    } else if (t < 0.34) {
      // Rim: outer to inner at top
      const lt = (t - 0.28) / 0.06;
      r = lerp(MUG.outerR, MUG.innerR, lt);
      y = MUG.bottomY + MUG.height - MUG.rimThick * Math.sin(lt * Math.PI);
    } else if (t < 0.62) {
      // Inner wall: top to bottom
      const lt = (t - 0.34) / 0.28;
      r = MUG.innerR;
      y = lerp(MUG.bottomY + MUG.height - MUG.rimThick, MUG.bottomY + MUG.bottomThick, lt);
    } else if (t < 0.78) {
      // Bottom inner surface: from inner wall down to center at bottom
      // This sweeps inward across the bottom, creating the inside of the base
      const lt = (t - 0.62) / 0.16;
      r = lerp(MUG.innerR, 0.0, lt);
      y = lerp(MUG.bottomY + MUG.bottomThick, MUG.bottomY + MUG.bottomThick, lt);
      // Slight sag toward center for realism:
      y = MUG.bottomY + MUG.bottomThick * (1.0 - 0.15 * Math.sin(lt * Math.PI));
    } else if (t < 0.94) {
      // Bottom outer surface: from center outward at the very bottom
      // This creates the underside of the mug
      const lt = (t - 0.78) / 0.16;
      r = lerp(0.0, MUG.outerR, lt);
      y = MUG.bottomY;
    } else {
      // Close the loop: outer edge of bottom back up to outer wall start
      // This is the thickness of the base at the outer edge
      const lt = (t - 0.94) / 0.06;
      r = MUG.outerR;
      y = lerp(MUG.bottomY, MUG.bottomY, lt);
      // They're at the same point (outer wall starts at bottomY), so this is just a seam
    }

    return { r, y };
  }

  // Handle skeleton: C-curve path for the handle center
  // handleT ∈ [0, 1]: position along the handle (0=top attach, 1=bottom attach)
  function handleSkeleton(handleT) {
    const angle = handleT * Math.PI; // 0 to π (C-shape)
    const r = MUG.outerR + MUG.handleR * Math.sin(angle);
    const y = MUG.handleCenterY + MUG.handleHalfH * Math.cos(angle);
    return { r, y };
  }

  // Handle tangent (for orienting the tube cross-section)
  function handleTangent(handleT) {
    const angle = handleT * Math.PI;
    const dr = MUG.handleR * Math.PI * Math.cos(angle);
    const dy = -MUG.handleHalfH * Math.PI * Math.sin(angle);
    const len = Math.sqrt(dr * dr + dy * dy) || 1;
    return { dr: dr / len, dy: dy / len };
  }

  // Handle profile: for a given position along the handle (handleT)
  // and ring position (ringT), return {r, y}
  function handleProfile(handleT, ringT) {
    const sk = handleSkeleton(handleT);
    const tan = handleTangent(handleT);

    // Normal perpendicular to tangent in the r-y plane
    const nr = -tan.dy;
    const ny = tan.dr;

    // Tube cross-section
    const phi = ringT * Math.PI * 2;
    const r = sk.r + MUG.handleTubeR * (Math.cos(phi) * nr);
    const y = sk.y + MUG.handleTubeR * (Math.cos(phi) * ny);
    // azimuthal offset (out of the r-y plane)
    const azOffset = MUG.handleTubeR * Math.sin(phi);

    return { r, y, azOffset };
  }

  // ═══════════════════════════════════════════════════════
  // COMPUTE VERTEX POSITIONS FOR EACH KEYFRAME
  // ═══════════════════════════════════════════════════════

  const vertexCount = N_SEG * N_RING;
  const NUM_KEYFRAMES = 5;

  // Pre-allocate keyframe arrays (Fix #9 — precompute everything)
  const keyframePositions = [];
  for (let k = 0; k < NUM_KEYFRAMES; k++) {
    keyframePositions.push(new Float32Array(vertexCount * 3));
  }

  // ─── KEYFRAME 0: Full mug ───
  function computeMugPositions(out) {
    for (let seg = 0; seg < N_SEG; seg++) {
      const segT = seg / N_SEG; // 0 to 1 (azimuthal position)
      const theta = segT * Math.PI * 2;

      // Determine if this segment is in the handle region
      // Handle is centered at seg=0 (segT=0 and segT≈1)
      const handleHalfFrac = (HANDLE_SEG_COUNT / 2) / N_SEG;
      const blendFrac = HANDLE_BLEND_SEGS / N_SEG;

      let segDist = segT; // distance from handle center (at 0)
      if (segDist > 0.5) segDist = 1.0 - segDist;

      let handleFactor = 0;
      if (segDist < handleHalfFrac) {
        handleFactor = 1.0;
      } else if (segDist < handleHalfFrac + blendFrac) {
        handleFactor = 1.0 - smoothstep((segDist - handleHalfFrac) / blendFrac);
      }

      // Map segment position within handle to handleT
      let handleT = 0.5; // default middle
      if (handleFactor > 0) {
        // Map: seg at handle start → handleT=0, seg at handle end → handleT=1
        let handleLocalT;
        if (segT <= 0.5) {
          // segT in [0, handleHalfFrac]
          handleLocalT = 0.5 + (segT / handleHalfFrac) * 0.5;
        } else {
          // segT in [1-handleHalfFrac, 1]
          handleLocalT = ((segT - (1.0 - handleHalfFrac)) / handleHalfFrac) * 0.5;
        }
        handleT = clamp(handleLocalT, 0, 1);
      }

      for (let ring = 0; ring < N_RING; ring++) {
        const ringT = ring / N_RING; // 0 to 1 (profile position)
        const idx = (seg * N_RING + ring) * 3;

        if (handleFactor < 0.001) {
          // Pure body
          const prof = bodyProfile(ringT);
          out[idx + 0] = prof.r * Math.cos(theta);
          out[idx + 1] = prof.y;
          out[idx + 2] = prof.r * Math.sin(theta);
        } else if (handleFactor > 0.999) {
          // Pure handle
          const hp = handleProfile(handleT, ringT);
          // USE THE SAME THETA as this segment's azimuthal position
          // The handle extends radially outward from the body at this theta
          out[idx + 0] = hp.r * Math.cos(theta) - hp.azOffset * Math.sin(theta);
          out[idx + 1] = hp.y;
          out[idx + 2] = hp.r * Math.sin(theta) + hp.azOffset * Math.cos(theta);
        } else {
          // Blend zone
          const bp = bodyProfile(ringT);
          const bx = bp.r * Math.cos(theta);
          const by = bp.y;
          const bz = bp.r * Math.sin(theta);

          const hp = handleProfile(handleT, ringT);
          // ALSO use theta here, not a fixed handleTheta
          const hx = hp.r * Math.cos(theta) - hp.azOffset * Math.sin(theta);
          const hy = hp.y;
          const hz = hp.r * Math.sin(theta) + hp.azOffset * Math.cos(theta);

          out[idx + 0] = lerp(bx, hx, handleFactor);
          out[idx + 1] = lerp(by, hy, handleFactor);
          out[idx + 2] = lerp(bz, hz, handleFactor);
        }
      }
    }
  }

  // ─── KEYFRAME 4: Perfect torus ───
  function computeTorusPositions(out) {
    for (let seg = 0; seg < N_SEG; seg++) {
      const theta = (seg / N_SEG) * Math.PI * 2;
      for (let ring = 0; ring < N_RING; ring++) {
        const phi = (ring / N_RING) * Math.PI * 2;
        const idx = (seg * N_RING + ring) * 3;

        out[idx + 0] = (TOR.R + TOR.r * Math.cos(phi)) * Math.cos(theta);
        out[idx + 1] = TOR.r * Math.sin(phi);
        out[idx + 2] = (TOR.R + TOR.r * Math.cos(phi)) * Math.sin(theta);
      }
    }
  }

  // ─── KEYFRAME 1: Mug shrinking (height 60%, walls 1.5x thicker) ───
  function computeShrinkPositions(out) {
    const shrinkH = 0.55;
    const thicken = 1.8;

    const savedOuter = MUG.outerR;
    const savedInner = MUG.innerR;
    const savedHeight = MUG.height;
    const savedHandleHH = MUG.handleHalfH;
    const savedHandleCY = MUG.handleCenterY;
    const savedHandleTR = MUG.handleTubeR;

    // Temporarily modify mug params
    const wallThick = savedOuter - savedInner;
    MUG.outerR = savedOuter + wallThick * (thicken - 1) * 0.3;
    MUG.innerR = savedInner - wallThick * (thicken - 1) * 0.7;
    MUG.height = savedHeight * shrinkH;
    MUG.handleHalfH = savedHandleHH * shrinkH * 0.9;
    MUG.handleCenterY = savedHandleCY * shrinkH * 0.7;
    MUG.handleTubeR = savedHandleTR * 1.4;

    computeMugPositions(out);

    // Restore
    MUG.outerR = savedOuter;
    MUG.innerR = savedInner;
    MUG.height = savedHeight;
    MUG.handleHalfH = savedHandleHH;
    MUG.handleCenterY = savedHandleCY;
    MUG.handleTubeR = savedHandleTR;
  }

  // ─── KEYFRAME 2: Collapsed to thick ring + thick handle ───
  function computeCollapsedPositions(out) {
    const ringR = lerp(MUG.outerR, TOR.R, 0.4);
    const ringr = lerp((MUG.outerR - MUG.innerR) * 2.5, TOR.r, 0.3);
    const remainH = 0.15; // slight remaining height

    const savedOuter = MUG.outerR;
    const savedInner = MUG.innerR;
    const savedHeight = MUG.height;
    const savedBottomY = MUG.bottomY;
    const savedHandleR = MUG.handleR;
    const savedHandleHH = MUG.handleHalfH;
    const savedHandleCY = MUG.handleCenterY;
    const savedHandleTR = MUG.handleTubeR;

    MUG.outerR = ringR + ringr;
    MUG.innerR = ringR - ringr;
    MUG.height = ringr * 2 + remainH;
    MUG.bottomY = -(ringr + remainH * 0.5);
    MUG.handleR = MUG.handleR * 0.6;
    MUG.handleHalfH = MUG.handleHalfH * 0.4;
    MUG.handleCenterY = 0;
    MUG.handleTubeR = ringr * 0.7;

    computeMugPositions(out);

    MUG.outerR = savedOuter;
    MUG.innerR = savedInner;
    MUG.height = savedHeight;
    MUG.bottomY = savedBottomY;
    MUG.handleR = savedHandleR;
    MUG.handleHalfH = savedHandleHH;
    MUG.handleCenterY = savedHandleCY;
    MUG.handleTubeR = savedHandleTR;
  }

  // ─── KEYFRAME 3: Almost torus (blend collapsed → torus) ───
  function computeAlmostTorusPositions(out) {
    const collapsed = new Float32Array(vertexCount * 3);
    const torus = new Float32Array(vertexCount * 3);
    computeCollapsedPositions(collapsed);
    computeTorusPositions(torus);

    for (let i = 0; i < vertexCount * 3; i++) {
      out[i] = lerp(collapsed[i], torus[i], 0.65);
    }
  }

  // Compute all keyframes (Fix #9 — done once at init)
  computeMugPositions(keyframePositions[0]);
  computeShrinkPositions(keyframePositions[1]);
  computeCollapsedPositions(keyframePositions[2]);
  computeAlmostTorusPositions(keyframePositions[3]);
  computeTorusPositions(keyframePositions[4]);

  // ═══════════════════════════════════════════════════════
  // BUILD MESH (Fix #8 — proper closed topology)
  // ═══════════════════════════════════════════════════════

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(vertexCount * 3);

  // Index buffer: connect adjacent segments and rings in a torus topology
  // Both u and v wrap around (closed in both directions)
  const indices = [];
  for (let seg = 0; seg < N_SEG; seg++) {
    const nextSeg = (seg + 1) % N_SEG; // wraps! (Fix #8)
    for (let ring = 0; ring < N_RING; ring++) {
      const nextRing = (ring + 1) % N_RING; // wraps! (Fix #8)

      const a = seg * N_RING + ring;
      const b = nextSeg * N_RING + ring;
      const c = seg * N_RING + nextRing;
      const d = nextSeg * N_RING + nextRing;

      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }

  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Material (Fix #6 — DoubleSide as safety, good normals via computeVertexNormals)
  const material = new THREE.MeshStandardMaterial({
    color: 0xddddee,
    roughness: 0.28,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // ═══════════════════════════════════════════════════════
  // INTERPOLATION (Fix #5 — Catmull-Rom for smooth motion)
  // ═══════════════════════════════════════════════════════

  const keyframeTimes = [0, 0.25, 0.50, 0.75, 1.0];

  function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * (
      (2 * p1) +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
  }

  function updateGeometry(t) {
    t = clamp(t, 0, 1);
    const posAttr = geometry.attributes.position;

    // Find which keyframe segment we're in
    let segIdx = 0;
    for (let i = 0; i < NUM_KEYFRAMES - 1; i++) {
      if (t >= keyframeTimes[i] && t <= keyframeTimes[i + 1]) {
        segIdx = i;
        break;
      }
    }
    if (t >= 1.0) segIdx = NUM_KEYFRAMES - 2;

    const segStart = keyframeTimes[segIdx];
    const segEnd = keyframeTimes[segIdx + 1];
    const localT = clamp((t - segStart) / (segEnd - segStart), 0, 1);
    const st = smoothstep(localT);

    // Get 4 keyframes for Catmull-Rom (clamp at boundaries)
    const k0 = Math.max(0, segIdx - 1);
    const k1 = segIdx;
    const k2 = Math.min(NUM_KEYFRAMES - 1, segIdx + 1);
    const k3 = Math.min(NUM_KEYFRAMES - 1, segIdx + 2);

    const kf0 = keyframePositions[k0];
    const kf1 = keyframePositions[k1];
    const kf2 = keyframePositions[k2];
    const kf3 = keyframePositions[k3];

    // Interpolate all vertex positions (Fix #9 — simple per-vertex math)
    for (let i = 0; i < vertexCount * 3; i++) {
      posAttr.array[i] = catmullRom(kf0[i], kf1[i], kf2[i], kf3[i], st);
    }

    posAttr.needsUpdate = true;
    geometry.computeVertexNormals(); // Fix #6 — recompute normals every frame

    // Color: white ceramic → golden brown donut
    const colorT = smoothstep(t);
    material.color.setRGB(
      lerp(0.88, 0.82, colorT),
      lerp(0.88, 0.52, colorT),
      lerp(0.93, 0.18, colorT)
    );
    material.roughness = lerp(0.28, 0.6, colorT);

    // Update label
    if (label) {
      if (t < 0.05) {
        label.textContent = '☕ Coffee Mug — genus 1 (one hole: the handle)';
      } else if (t > 0.95) {
        label.textContent = '🍩 Donut (Torus) — genus 1 (one hole: the center)';
      } else {
        label.textContent = `Smooth deformation (${Math.round(t * 100)}%) — genus 1 preserved throughout`;
      }
    }
  }

  // Set initial state
  updateGeometry(0);

  // Slider interaction (Fix #10 — stopPropagation already handled above)
  slider.addEventListener('input', () => {
    updateGeometry(slider.value / 100);
  });

  // ═══════════════════════════════════════════════════════
  // RENDER LOOP
  // ═══════════════════════════════════════════════════════

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
