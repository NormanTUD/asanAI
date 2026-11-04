/* TOKEN / EGO — the 3D world. */
(function (root) {
  "use strict";
  var TEGO = (root.TEGO = root.TEGO || {});
  var U = TEGO.U;
  var CFG = TEGO.CFG;
  var S = TEGO.Shaders;
  var THREE = root.THREE;

  var D = CFG.dModel;
  var H = CFG.nHeads;
  var L = CFG.nLayers;

  function SceneRig(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x03040a, 1);
    this.pixelRatio = Math.min(root.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(this.pixelRatio);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.05, 600);
    this.camera.rotation.order = "YXZ";
    this.scene.add(this.camera);

    this.size = new THREE.Vector2(1, 1);
    this.composer = new THREE.EffectComposer(this.renderer);
    this.renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(1, 1), 1.05, 0.62, 0.12);
    this.composer.addPass(this.bloomPass);
    this.postPass = S.makePostPass(new THREE.Vector2(1, 1));
    this.composer.addPass(this.postPass);

    this.clock = new THREE.Clock();
    this.time = 0;
    this.timeMaterials = [];

    this.R = 9;
    this.GAP = 7;
    this.topY = (L - 1) * this.GAP;
    this.skyY = this.topY + 9;

    this.world = new THREE.Group();
    this.scene.add(this.world);

    this.trace = null;
    this.model = null;
    this.T = 0;
    this.player = 0;
    this.currentLayer = 0;
    this.stage = "intro";
    this.phase = "intro";
    this.overview = false;
    this.phaseT = 0;
    this.activeHead = 0;

    this.ringGroups = [];
    this.tokenLayers = [];
    this._beamLayer = -1;
    this.ringMats = [];
    this.beamGroup = null;
    this.beamMeshes = [];
    this.topKTargets = [];
    this.skyLabelPool = [];
    this.skyStars = null;
    this.skyGroup = null;
    this.skyDome = null;
    this.finalBeam = null;
    this.topStar = null;

    this.introAngle = 0;
    this.orbit = false;
    this.orbitAzimuth = 0.6;
    this.orbitElevation = 0.32;
    this.orbitDistance = 26;

    this.cameraPos = new THREE.Vector3(0, 20, 45);
    this.cameraTarget = new THREE.Vector3(0, 17, 0);
    this.cameraGoalPos = this.cameraPos.clone();
    this.cameraGoalTarget = this.cameraTarget.clone();
    this.cameraFov = 58;
    this.cameraGoalFov = 58;
    this.userYaw = 0;
    this.userPitch = 0;
    this.dragYaw = 0;
    this.dragPitch = 0;
    this.zoom = 0;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.fade = { tokenLine: 1, embed: 1, sky: 1, ffn: 1 };

    this.buildBackground();
    this.buildTower();
    this.buildProjectionChamber();
    this.buildTokenLine();
    this.buildEmbedCloud();
    this.buildEmbeddingWall();
    this.buildPlayerCore();
    this.buildFFN();
    this.buildSky();
    this.resize();
    
  }

  SceneRig.prototype.setModel = function (model) {
    this.model = model;
  };

  SceneRig.prototype.track = function (mat) {
    if (mat && mat.uniforms && mat.uniforms.uTime) this.timeMaterials.push(mat);
    return mat;
  };

  /* ── background ────────────────────────────────────────────────────── */

  SceneRig.prototype.buildBackground = function () {
    this.bg = S.makeBackground(TEGO.QUALITY.high);
    this.track(this.bg.material);
    this.scene.add(this.bg);

    this.stars = S.makeStars(4200, U.mulberry32(0x51a2f));
    this.track(this.stars.material);
    this.stars.material.uniforms.uPixelRatio.value = this.pixelRatio;
    this.scene.add(this.stars);
  };

  /* ── tower ─────────────────────────────────────────────────────────── */

  SceneRig.prototype.buildTower = function () {
    this.tower = new THREE.Group();
    this.world.add(this.tower);

    // The vertical residual stream.
    var height = this.topY + 6;
    var pillarMat = this.track(S.makePillarMaterial(CFG.LAYER_COLORS[0], CFG.LAYER_COLORS[L - 1]));
    pillarMat.uniforms.uIntensity.value = 0.72;
    var pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, height, 64, 1, true), pillarMat);
    pillar.position.y = this.topY / 2;
    pillar.renderOrder = 2;
    this.tower.add(pillar);
    this.pillar = pillar;

    var coreMat = new THREE.MeshBasicMaterial({
      color: 0xbff6ff, transparent: true, opacity: 0.20,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    coreMat.opacity = 0.13;
    var core = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, height, 24, 1, true), coreMat);
    core.position.y = this.topY / 2;
    this.tower.add(core);

    // A braid of six coloured helices: the residual stream as a sum of writes.
    this.braidMeshes = [];
    for (var bl = 0; bl < L; bl++) {
      var pts = [];
      var turns = 1.6;
      for (var bt = 0; bt <= 64; bt++) {
        var u = bt / 64;
        var aa = u * Math.PI * 2 * turns + bl * (Math.PI * 2 / L) + 0.4;
        var rr2 = 1.48 + bl * 0.035;
        pts.push(new THREE.Vector3(Math.cos(aa) * rr2, u * this.topY, Math.sin(aa) * rr2));
      }
      var bcurve = new THREE.CatmullRomCurve3(pts);
      var bgeo = new THREE.TubeGeometry(bcurve, 120, 0.014, 4, false);
      var bmat = this.track(S.makeBeamMaterial(CFG.LAYER_COLORS[bl], 0.55, 0.16, 0.28 + bl * 0.045));
      var bmesh = new THREE.Mesh(bgeo, bmat);
      bmesh.renderOrder = 1;
      this.tower.add(bmesh);
      this.braidMeshes.push(bmesh);
    }

    var collarMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    var collarGeo = new THREE.BufferGeometry();
    collarGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(D * 2 * 3), 3));
    collarGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(D * 2 * 3), 3));
    this.collar = new THREE.LineSegments(collarGeo, collarMat);
    this.collar.renderOrder = 3;
    this.tower.add(this.collar);
    this.collarVec = new Float32Array(D);
    this.collarTarget = new Float32Array(D);
    this.collarReady = false;

    // Rings and their floors.
    for (var l = 0; l < L; l++) {
      var g = new THREE.Group();
      g.position.y = l * this.GAP;
      var color = CFG.LAYER_COLORS[l];
      var torusMat = new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      var torus = new THREE.Mesh(new THREE.TorusGeometry(this.R, 0.035, 8, 220), torusMat);
      torus.rotation.x = Math.PI / 2;
      g.add(torus);
      var outerMat = new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: 0.22,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      var outer = new THREE.Mesh(new THREE.TorusGeometry(this.R + 0.38, 0.018, 6, 220), outerMat);
      outer.rotation.x = Math.PI / 2;
      g.add(outer);

      var floorMat = this.track(S.makeRingMaterial(color, 0.65, this.R));
      var floor = new THREE.Mesh(new THREE.CircleGeometry(this.R + 0.85, 160), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.02;
      floor.renderOrder = 1;
      g.add(floor);

      // twelve small runes around each ring
      for (var k = 0; k < 12; k++) {
        var a = (k / 12) * Math.PI * 2 + l * 0.17;
        var rune = new THREE.Sprite(new THREE.SpriteMaterial({
          map: this.runeTexture(k),
          color: color, transparent: true, opacity: 0.20,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        rune.position.set(Math.cos(a) * (this.R + 0.55), 0.05, Math.sin(a) * (this.R + 0.55));
        rune.scale.set(0.42, 0.42, 1);
        g.add(rune);
      }

      this.ringGroups.push(g);
      this.ringMats.push({ torus: torusMat, outer: outerMat, floor: floorMat });
      this.tower.add(g);
    }

    // Thin vertical struts at the outer edge: the cage of the tower.
    var strutPos = [];
    var strutCol = [];
    for (var s = 0; s < 8; s++) {
      var ang = (s / 8) * Math.PI * 2;
      var x = Math.cos(ang) * (this.R + 0.62);
      var z = Math.sin(ang) * (this.R + 0.62);
      strutPos.push(x, 0, z, x, this.topY, z);
      var c = new THREE.Color(CFG.LAYER_COLORS[0]);
      strutCol.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    var strutGeo = new THREE.BufferGeometry();
    strutGeo.setAttribute("position", new THREE.Float32BufferAttribute(strutPos, 3));
    strutGeo.setAttribute("color", new THREE.Float32BufferAttribute(strutCol, 3));
    var strutMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.10,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.tower.add(new THREE.LineSegments(strutGeo, strutMat));

    // The player's vertical trail through the layers.
    var trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(L * 3), 3));
    trailGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(L * 3), 3));
    this.trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.tower.add(this.trail);

    // LayerNorm lens (repositioned for the player each layer).
    this.lensGroup = new THREE.Group();
    var lensRingMat = this.track(S.makeLensMaterial(0x9fe9ff, 0.9));
    var lensRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.18, 72), lensRingMat);
    this.lensGroup.add(lensRing);
    var lensTorus = new THREE.Mesh(
      new THREE.TorusGeometry(1.18, 0.025, 6, 72),
      new THREE.MeshBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.lensGroup.add(lensTorus);
    this.lensGroup.visible = false;
    this.tower.add(this.lensGroup);

    // W/Q/K/V holographic panels.
    this.qkvGroup = new THREE.Group();
    this.qkvGroup.visible = false;
    this.qkvPanels = {};
    var panelCols = { q: 0x5ff3ff, k: 0xff4fd8, v: 0xffc857 };
    var panelNames = ["q", "k", "v"];
    for (var pi = 0; pi < 3; pi++) {
      var name = panelNames[pi];
      var cw = U.canvas(360, 180);
      var tex = new THREE.CanvasTexture(cw);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      var mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.92,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      var plane = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.25), mat);
      plane.renderOrder = 6;
      this.qkvGroup.add(plane);
      this.qkvPanels[name] = { canvas: cw, texture: tex, mesh: plane, material: mat, color: panelCols[name] };
    }
    this.qkvWeightCanvas = U.canvas(512, 256);
    this.qkvWeightTexture = new THREE.CanvasTexture(this.qkvWeightCanvas);
    this.qkvWeightTexture.colorSpace = THREE.SRGBColorSpace;
    this.qkvWeightTexture.minFilter = THREE.LinearFilter;
    this.qkvWeightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 2.2),
      new THREE.MeshBasicMaterial({
        map: this.qkvWeightTexture, transparent: true, opacity: 0.82,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      })
    );
    this.qkvWeightMesh.renderOrder = 5;
    this.qkvGroup.add(this.qkvWeightMesh);
    this.qkvGroup.userData.weightTexture = this.qkvWeightTexture;
    this.tower.add(this.qkvGroup);

    this.residualLabel = this.makeAnnotation("RESIDUAL STREAM · 128 dims", "#9fe9ff", 0.38);
    this.tower.add(this.residualLabel);
    this.attentionLabel = this.makeAnnotation("ATTENTION · beam width = α", "#5ff3ff", 0.38);
    this.tower.add(this.attentionLabel);
    this.causalLabel = this.makeAnnotation("CAUSAL MASK · future = −∞", "#b9a7ff", 0.38);
    this.tower.add(this.causalLabel);

    // The masked future: a luminous curtain from just after the player to the
    // last future token. Beams cannot cross it.
    this.curtainMat = this.track(S.makeCurtainMaterial(0x8d5bff, 1));
    this.curtain = new THREE.Mesh(new THREE.BufferGeometry(), this.curtainMat);
    this.curtain.visible = false;
    this.curtain.renderOrder = 4;
    this.tower.add(this.curtain);

    // Attention beams (rebuilt for the current layer).
    this.beamRoot = new THREE.Group();
    this.tower.add(this.beamRoot);
    this.beamParticles = [];
    this.particleTexture = U.makeRadialSprite("rgba(255,255,255,1)", 64);

    // Q glyph.
    this.qGlyph = new THREE.Group();
    this.qGlyph.visible = false;
    var qCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.10, 0.42, 12),
      this.track(S.makeBeamMaterial(0x5ff3ff, 1, 0.95, 1.4))
    );
    qCone.rotation.x = Math.PI / 2;
    qCone.position.z = 0.21;
    this.qGlyph.add(qCone);
    var qStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.6, 6),
      this.track(S.makeBeamMaterial(0x5ff3ff, 1, 0.7, 1.4))
    );
    qStem.rotation.x = Math.PI / 2;
    qStem.position.z = -0.05;
    this.qGlyph.add(qStem);
    this.qGlyphMats = [qCone.material, qStem.material];
    this.tower.add(this.qGlyph);

    // The player token splits into Q, K and V during attention.
    this.splitGroup = new THREE.Group();
    this.splitGroup.visible = false;
    var splitColors = [0x5ff3ff, 0xff4fd8, 0xffc857];
    var splitNames = ["Q", "K", "V"];
    this.splitParts = [];
    for (var sp = 0; sp < 3; sp++) {
      var sg = new THREE.Group();
      var cmat = this.track(S.makeCrystalMaterial(splitColors[sp], 0xffffff, false));
      var cmesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.10, 1), cmat);
      sg.add(cmesh);
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.haloTexture(splitColors[sp]), color: splitColors[sp], transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55,
      }));
      halo.scale.set(0.48, 0.48, 1);
      sg.add(halo);
      var lab = this.makeAnnotation(splitNames[sp], "#" + splitColors[sp].toString(16).padStart(6, "0"), 0.34);
      lab.position.y = 0.28;
      sg.add(lab);
      this.splitGroup.add(sg);
      this.splitParts.push(sg);
    }
    this.tower.add(this.splitGroup);
  };
  SceneRig.prototype.runeTexture = function (i) {
    if (!this._runes) this._runes = {};
    if (this._runes[i]) return this._runes[i];
    var glyphs = ["∑", "∂", "λ", "⊗", "√", "π", "∇", "∞", "≈", "∈", "ℏ", "Ω"];
    var c = U.canvas(96, 96);
    var ctx = c.getContext("2d");
    ctx.font = "52px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 16;
    ctx.fillText(glyphs[i % glyphs.length], 48, 50);
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    this._runes[i] = t;
    return t;
  };

  /* ── Q/K/V projection chamber ──────────────────────────────────────── */

  SceneRig.prototype.buildProjectionChamber = function () {
    this.projGroup = new THREE.Group();
    this.projGroup.visible = false;
    this.tower.add(this.projGroup);
    var R = this.R, Dm = CFG.dModel;
    this.projInputPos = [];
    for (var d = 0; d < Dm; d++) {
      var a = (d / Dm) * Math.PI * 2;
      this.projInputPos.push(new THREE.Vector3(R, 0.45 + Math.cos(a) * 0.55, Math.sin(a) * 0.55));
    }
    function ring(cx, cy, cz, rad, n) {
      var out = [];
      for (var i = 0; i < n; i++) {
        var t = (i / n) * Math.PI * 2;
        out.push(new THREE.Vector3(cx, cy + Math.cos(t) * rad, cz + Math.sin(t) * rad));
      }
      return out;
    }
    var qPos = ring(R, 1.75, 1.55, 0.62, Dm);
    var kPos = ring(R, 1.75, -1.55, 0.62, Dm);
    var vPos = ring(R, -1.15, 0.0, 0.62, Dm);
    this.proj = {
      q: {
        points: this.buildWebPoints(this.projGroup, this.projInputPos, qPos, Dm, Dm, 1, 0.030, 0.55),
        top: this.buildWebTop(this.projGroup, this.projInputPos, qPos, Dm, Dm, 512, 0.80),
        ring: this.makeNodeRing(this.projGroup, qPos, 0x5ff3ff, 0.055),
        pos: qPos,
      },
      k: {
        points: this.buildWebPoints(this.projGroup, this.projInputPos, kPos, Dm, Dm, 1, 0.030, 0.55),
        top: this.buildWebTop(this.projGroup, this.projInputPos, kPos, Dm, Dm, 512, 0.80),
        ring: this.makeNodeRing(this.projGroup, kPos, 0xff4fd8, 0.055),
        pos: kPos,
      },
      v: {
        points: this.buildWebPoints(this.projGroup, this.projInputPos, vPos, Dm, Dm, 1, 0.030, 0.55),
        top: this.buildWebTop(this.projGroup, this.projInputPos, vPos, Dm, Dm, 512, 0.80),
        ring: this.makeNodeRing(this.projGroup, vPos, 0xffc857, 0.055),
        pos: vPos,
      },
    };
    this.projInputRing = this.makeNodeRing(this.projGroup, this.projInputPos, 0x9fe9ff, 0.045);
    this.projQLabel = this.makeAnnotation("W_Q · 16,384 weights", "#5ff3ff", 0.32);
    this.projQLabel.position.set(R, 3.05, 1.55);
    this.projGroup.add(this.projQLabel);
    this.projKLabel = this.makeAnnotation("W_K · 16,384 weights", "#ff4fd8", 0.32);
    this.projKLabel.position.set(R, 3.05, -1.55);
    this.projGroup.add(this.projKLabel);
    this.projVLabel = this.makeAnnotation("W_V · 16,384 weights", "#ffc857", 0.32);
    this.projVLabel.position.set(R, -2.20, 0.0);
    this.projGroup.add(this.projVLabel);
    this.projInLabel = this.makeAnnotation("LN(x) · 128", "#9fe9ff", 0.30);
    this.projInLabel.position.set(R, 1.20, 0.0);
    this.projGroup.add(this.projInLabel);

    // W_O: the attention write.  z (128) -> W_O z (128).
    this.outGroup = new THREE.Group();
    this.outGroup.visible = false;
    this.tower.add(this.outGroup);
    var zPos = [], attnPos = [];
    for (var zd = 0; zd < Dm; zd++) {
      var za = (zd / Dm) * Math.PI * 2;
      zPos.push(new THREE.Vector3(R, 0.35 + Math.cos(za) * 0.55, Math.sin(za) * 0.55));
      attnPos.push(new THREE.Vector3(R - 1.30, 0.35 + Math.cos(za) * 0.55, Math.sin(za) * 0.55));
    }
    this.outWeb = {
      points: this.buildWebPoints(this.outGroup, zPos, attnPos, Dm, Dm, 1, 0.030, 0.55),
      top: this.buildWebTop(this.outGroup, zPos, attnPos, Dm, Dm, 512, 0.80),
      ringIn: this.makeNodeRing(this.outGroup, zPos, 0x9fe9ff, 0.055),
      ringOut: this.makeNodeRing(this.outGroup, attnPos, 0x6bffb0, 0.055),
    };
    this.outLabel = this.makeAnnotation("W_O · 16,384 weights · z → attention write", "#6bffb0", 0.32);
    this.outLabel.position.set(R - 0.65, 1.25, 0.0);
    this.outGroup.add(this.outLabel);
  };

  SceneRig.prototype.updateProjectionWebs = function () {
    if (!this.trace || !this.model || !this.proj) return;
    var l = this.currentLayer, p = this.player;
    var wl = this.model.W.layers[l];
    var layer = this.trace.layers[l];
    var Dm = CFG.dModel;
    var maxQ = 1e-6, maxK = 1e-6, maxV = 1e-6;
    for (var i = 0; i < wl.wq.length; i++) maxQ = Math.max(maxQ, Math.abs(wl.wq[i]));
    for (var j = 0; j < wl.wk.length; j++) maxK = Math.max(maxK, Math.abs(wl.wk[j]));
    for (var k = 0; k < wl.wv.length; k++) maxV = Math.max(maxV, Math.abs(wl.wv[k]));
    this.updateWebPoints(this.proj.q.points, wl.wq, maxQ);
    this.updateWebPoints(this.proj.k.points, wl.wk, maxK);
    this.updateWebPoints(this.proj.v.points, wl.wv, maxV);
    this.updateWebTop(this.proj.q.top, wl.wq, maxQ);
    this.updateWebTop(this.proj.k.top, wl.wk, maxK);
    this.updateWebTop(this.proj.v.top, wl.wv, maxV);
    var inVals = [], qVals = [], kVals = [], vVals = [];
    for (var d = 0; d < Dm; d++) {
      inVals.push(layer.ln1[p * Dm + d]);
      qVals.push(layer.q[p * Dm + d]);
      kVals.push(layer.k[p * Dm + d]);
      vVals.push(layer.v[p * Dm + d]);
    }
    this.updateNodeRing(this.projInputRing, inVals, [0.37, 0.95, 1.0], [1.0, 0.31, 0.85], undefined);
    this.updateNodeRing(this.proj.q.ring, qVals, [0.37, 0.95, 1.0], [0.8, 0.5, 1.0], this.activeHead);
    this.updateNodeRing(this.proj.k.ring, kVals, [1.0, 0.31, 0.85], [0.8, 0.5, 1.0], this.activeHead);
    this.updateNodeRing(this.proj.v.ring, vVals, [1.0, 0.85, 0.35], [0.55, 0.43, 1.0], this.activeHead);

    var maxO = 1e-6;
    for (var oi = 0; oi < wl.wo.length; oi++) maxO = Math.max(maxO, Math.abs(wl.wo[oi]));
    this.updateWebPoints(this.outWeb.points, wl.wo, maxO);
    this.updateWebTop(this.outWeb.top, wl.wo, maxO);
    var zVals = [], attnVals = [];
    for (var od = 0; od < Dm; od++) {
      zVals.push(layer.z[p * Dm + od]);
      attnVals.push(layer.attnOut[p * Dm + od]);
    }
    this.updateNodeRing(this.outWeb.ringIn, zVals, [0.62, 0.43, 1.0], [1.0, 0.31, 0.85], undefined);
    this.updateNodeRing(this.outWeb.ringOut, attnVals, [0.42, 1.0, 0.69], [0.55, 0.43, 1.0], undefined);
  };

  /* ── token line (tokenization) ─────────────────────────────────────── */

  SceneRig.prototype.buildTokenLine = function () {
    this.tokenLine = new THREE.Group();
    this.tokenLine.visible = false;
    this.world.add(this.tokenLine);
    this.tokenLineItems = [];
  };

  SceneRig.prototype.rebuildTokenLine = function () {
    while (this.tokenLine.children.length) {
      var c = this.tokenLine.children.pop();
      U.disposeObject(c);
    }
    this.tokenLineItems = [];
    if (!this.trace) return;
    var T = this.T, spacing = Math.min(2.0, 20 / Math.max(1, T - 1));
    var total = spacing * (T - 1);
    for (var i = 0; i < T; i++) {
      var isPlayer = i === this.player;
      var isPast = i < this.player;
      var color = isPlayer ? 0xf4fbff : isPast ? 0xffc857 : 0x8d7bff;
      var lab = U.makeLabel(this.trace.tokens[i], {
        color: isPlayer ? "#f4fbff" : isPast ? "#ffd77a" : "#b9a7ff",
        size: isPlayer ? 72 : 52,
        glowColor: isPlayer ? "#ffffff" : isPast ? "#ffc857" : "#8d7bff",
      });
      var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: lab.texture, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: isPlayer ? 1 : 0.75,
      }));
      var aspect = lab.width / lab.height;
      sprite.scale.set(aspect * (isPlayer ? 1.2 : 0.8), isPlayer ? 1.2 : 0.8, 1);
      sprite.position.set(-total / 2 + i * spacing, 2.2, 0);
      this.tokenLine.add(sprite);
      var dot = new THREE.Mesh(
        new THREE.IcosahedronGeometry(isPlayer ? 0.22 : 0.12, 1),
        S.makeCrystalMaterial(color, isPlayer ? 0xffffff : color, isPlayer)
      );
      dot.position.set(-total / 2 + i * spacing, 1.55, 0);
      this.tokenLine.add(dot);
      this.track(dot.material);
      this.tokenLineItems.push({ sprite: sprite, dot: dot, index: i });
    }
    var lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-total / 2 - 1, 1.25, 0),
      new THREE.Vector3(total / 2 + 1, 1.25, 0),
    ]);
    var line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
      color: 0x5ff3ff, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.tokenLine.add(line);
  };

  /* ── embedding cloud ───────────────────────────────────────────────── */

  SceneRig.prototype.buildEmbedCloud = function () {
    this.embedGroup = new THREE.Group();
    this.embedGroup.position.set(0, 0, 0);
    this.embedGroup.visible = false;
    this.world.add(this.embedGroup);
    this.embedLabels = [];
    this.embedNeighborLabels = [];
    this.embedNeighborLines = null;
    this.embedPositions = [];
    this.embedNeighbors = [];
    this.embedLookTarget = new THREE.Vector3(0, 0, -10);
    this.embedVec = {};
    this.embedDirs = [];
    for (var ed = 0; ed < D; ed++) {
      var yy = 1 - 2 * (ed + 0.5) / D;
      var rr = Math.sqrt(Math.max(0, 1 - yy * yy));
      var th = ed * 2.399963229728653;
      this.embedDirs.push(new THREE.Vector3(Math.cos(th) * rr, yy, Math.sin(th) * rr));
    }

    var data = TEGO.DATA;
    var n = data.vocab.length;
    var pos = new Float32Array(n * 3);
    var col = new Float32Array(n * 3);
    var size = new Float32Array(n);
    var phase = new Float32Array(n);
    var promptSet = {};
    if (this.trace) for (var ti = 0; ti < this.T; ti++) promptSet[this.trace.tokens[ti]] = true;
    var palette = [0x5ff3ff, 0xff4fd8, 0xffc857, 0x6bffb0, 0x8d7bff];
    for (var i = 0; i < n; i++) {
      var s = data.sem3[i];
      pos[i * 3] = s[0] * 10;
      pos[i * 3 + 1] = s[2] * 7;
      pos[i * 3 + 2] = s[1] * 10;
      var isPrompt = !!promptSet[data.vocab[i]];
      var c = new THREE.Color(isPrompt ? 0xffe0a0 : palette[i % palette.length]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      size[i] = isPrompt ? 7 : 2.2;
      phase[i] = (i * 0.37) % 1;
      this.embedPositions.push(new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    var mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: this.pixelRatio }, uScale: { value: 22 } },
      vertexShader: S.starVert, fragmentShader: S.starFrag,
    });
    this.track(mat);
    this.embedPoints = new THREE.Points(geo, mat);
    this.embedGroup.add(this.embedPoints);

    // A soft cage to make the cloud readable.
    var dirSphere = new THREE.Mesh(
      new THREE.SphereGeometry(9, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0x5ff3ff, wireframe: true, transparent: true, opacity: 0.018, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.embedGroup.add(dirSphere);
    this.embedDirSphere = dirSphere;
    var cage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(10.5, 2),
      new THREE.MeshBasicMaterial({ color: 0x5ff3ff, wireframe: true, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.embedGroup.add(cage);
    this.embedCage = cage;
  };

  /* ── embedding matrix wall ─────────────────────────────────────────── */

  SceneRig.prototype.buildEmbeddingWall = function () {
    this.embeddingWall = new THREE.Group();
    this.embeddingWall.visible = false;
    this.world.add(this.embeddingWall);

    this.embeddingWallCanvas = U.canvas(512, 1024);
    this.embeddingWallTexture = new THREE.CanvasTexture(this.embeddingWallCanvas);
    this.embeddingWallTexture.colorSpace = THREE.SRGBColorSpace;
    this.embeddingWallTexture.minFilter = THREE.LinearFilter;
    this.embeddingWallTexture.magFilter = THREE.LinearFilter;

    var back = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 13.2),
      new THREE.MeshBasicMaterial({ color: 0x03050c, transparent: true, opacity: 0.94 })
    );
    back.position.set(0, 8, -0.04);
    this.embeddingWall.add(back);

    var wall = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 12.8),
      new THREE.MeshBasicMaterial({ map: this.embeddingWallTexture, transparent: true, opacity: 0.96, side: THREE.DoubleSide })
    );
    wall.position.set(0, 8, 0);
    this.embeddingWall.add(wall);

    var frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(6.5, 12.9)),
      new THREE.LineBasicMaterial({ color: 0x5ff3ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
    );
    frame.position.set(0, 8, 0.02);
    this.embeddingWall.add(frame);

    var titleLab = U.makeLabel("TOKEN EMBEDDING MATRIX E · 258 × 128", { color: "#9fe9ff", size: 36, glowColor: "#5ff3ff", bg: true, underline: true });
    this.embeddingWallTitle = new THREE.Sprite(new THREE.SpriteMaterial({
      map: titleLab.texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.embeddingWallTitle.scale.set((titleLab.width / titleLab.height) * 0.55, 0.55, 1);
    this.embeddingWallTitle.position.set(0, 15.15, 0.1);
    this.embeddingWall.add(this.embeddingWallTitle);

    var hintLab = U.makeLabel("row = token id", { color: "#ffd77a", size: 32, glowColor: "#ffc857", bg: true });
    this.embeddingWallHint = new THREE.Sprite(new THREE.SpriteMaterial({
      map: hintLab.texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.embeddingWallHint.scale.set((hintLab.width / hintLab.height) * 0.34, 0.34, 1);
    this.embeddingWallHint.position.set(-4.55, 8.0, 0.1);
    this.embeddingWall.add(this.embeddingWallHint);

    this.embeddingRowLabel = this.makeAnnotation("storm · id 0", "#ffe7b0", 0.40);
    this.embeddingRowLabel.position.set(4.55, 8, 0.12);
    this.embeddingWall.add(this.embeddingRowLabel);

    this.embeddingRowGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(6.55, 0.055),
      new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.embeddingRowGlow.position.set(0, 8, 0.06);
    this.embeddingWall.add(this.embeddingRowGlow);
  };

  SceneRig.prototype.updateEmbeddingWall = function (trace) {
    if (!trace || !this.embeddingWallCanvas) return;
    var ctx = this.embeddingWallCanvas.getContext("2d");
    var w = this.embeddingWallCanvas.width, h = this.embeddingWallCanvas.height;
    var V = TEGO.DATA.vocab.length, Dm = this.model ? this.model.dModel : D;
    var E = this.model ? this.model.W.E : null;
    if (!E) return;
    var pid = trace.ids[trace.player];
    var rows = V, cols = Dm;
    var cw = w / cols, ch = h / rows;
    var maxAbs = 1e-6;
    for (var i = 0; i < E.length; i++) maxAbs = Math.max(maxAbs, Math.abs(E[i]));
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var v = E[r * cols + c] / maxAbs;
        var t = 0.5 + v * 0.5;
        var col = U.heatColor(t);
        ctx.fillStyle = "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")";
        ctx.fillRect(c * cw, r * ch, Math.max(1, cw), Math.max(1, ch));
      }
    }
    // Highlight the selected token row.
    var ry = pid * ch;
    ctx.fillStyle = "rgba(255,220,120,0.28)";
    ctx.fillRect(0, ry, w, Math.max(2, ch));
    ctx.fillStyle = "rgba(255,250,220,0.95)";
    ctx.fillRect(0, ry + Math.max(1, ch * 0.5) - 0.5, w, 1.6);
    ctx.fillStyle = "rgba(255,200,87,0.9)";
    ctx.fillRect(0, ry, 5, Math.max(2, ch));
    ctx.strokeStyle = "rgba(143,180,230,0.18)";
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    this.embeddingWallTexture.needsUpdate = true;

    var rowY = 14.4 - ((pid + 0.5) / rows) * 12.8;
    this.embeddingRowGlow.position.y = rowY;
    this.embeddingRowLabel.position.y = rowY;
    if (this.embeddingRowLabel && this.embeddingRowLabel.material) {
      var text = "“" + trace.tokens[trace.player] + "” · id " + pid;
      var lab = U.makeLabel(text, { color: "#ffe7b0", size: 36, glowColor: "#ffc857", bg: true });
      var old = this.embeddingRowLabel.material.map;
      this.embeddingRowLabel.material.map = lab.texture;
      this.embeddingRowLabel.material.needsUpdate = true;
      this.embeddingRowLabel.scale.set((lab.width / lab.height) * 0.40, 0.40, 1);
      if (old) old.dispose();
    }
  };

  /* ── first-person embedding space ──────────────────────────────────── */

  SceneRig.prototype.makeAnnotation = function (text, color, scale) {
    var lab = U.makeLabel(text, { color: color || "#e9f3ff", size: 34, glowColor: color || "#9fe9ff", bg: true, pad: 12 });
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: lab.texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    sp.scale.set((lab.width / lab.height) * (scale || 0.42), scale || 0.42, 1);
    return sp;
  };

  SceneRig.prototype.buildPlayerCore = function () {
    this.playerCore = new THREE.Group();
    var mat = this.track(S.makeCrystalMaterial(0xffffff, 0x9fe9ff, true));
    var core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.085, 1), mat);
    this.playerCore.add(core);
    var halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.haloTexture(0xffffff), color: 0xffffff, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8,
    }));
    halo.scale.set(0.42, 0.42, 1);
    halo.material.opacity = 0.45;
    this.playerCore.add(halo);
    this.playerCore.position.set(0.34, -0.32, -0.95);
    this.playerCore.scale.setScalar(0.42);
    this.playerCore.visible = false;
    this.camera.add(this.playerCore);
    this.playerCoreCore = core;
    this.playerCoreHalo = halo;
  };

  SceneRig.prototype.cosine = function (a, b, oa, ob, Dm) {
    var dot = 0, na = 0, nb = 0;
    for (var i = 0; i < Dm; i++) {
      var av = a[oa + i], bv = b[ob + i];
      dot += av * bv; na += av * av; nb += bv * bv;
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  };

  SceneRig.prototype.setEmbeddingSpace = function (trace) {
    if (!trace || !this.embedPoints || !this.model) return;
    var data = TEGO.DATA;
    var V = data.vocab.length, Dm = this.model.dModel;
    var pid = trace.ids[trace.player];
    var base = data.sem3[pid];
    var positions = this.embedPoints.geometry.attributes.position.array;
    this.embedPositions = [];
    for (var i = 0; i < V; i++) {
      var s = data.sem3[i];
      var p = new THREE.Vector3((s[0] - base[0]) * 10, (s[2] - base[2]) * 7, (s[1] - base[1]) * 10);
      this.embedPositions.push(p);
      positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
    }
    this.embedPoints.geometry.attributes.position.needsUpdate = true;

    var E = this.model.W.E;
    var sims = [];
    for (var j = 0; j < V; j++) {
      if (j === pid) continue;
      sims.push({ id: j, sim: this.cosine(E, E, pid * Dm, j * Dm, Dm) });
    }
    sims.sort(function (a, b) { return b.sim - a.sim; });
    this.embedNeighbors = sims.slice(0, 14);
    var neighborSet = {};
    for (var k = 0; k < this.embedNeighbors.length; k++) neighborSet[this.embedNeighbors[k].id] = k;

    var promptSet = {};
    for (var t = 0; t < trace.T; t++) promptSet[trace.tokens[t]] = true;
    var col = this.embedPoints.geometry.attributes.aColor.array;
    var size = this.embedPoints.geometry.attributes.aSize.array;
    var palette = [0x5ff3ff, 0xff4fd8, 0xffc857, 0x6bffb0, 0x8d7bff];
    for (var ii = 0; ii < V; ii++) {
      var isPlayer = ii === pid;
      var isPrompt = !!promptSet[data.vocab[ii]];
      var rank = neighborSet[ii];
      var c = new THREE.Color(isPlayer ? 0xffffff : rank !== undefined ? 0xffe0a0 : isPrompt ? 0x9fe9ff : palette[ii % palette.length]);
      col[ii * 3] = c.r; col[ii * 3 + 1] = c.g; col[ii * 3 + 2] = c.b;
      size[ii] = isPlayer ? 0 : rank !== undefined ? 7.5 - rank * 0.32 : isPrompt ? 4.2 : 1.6;
    }
    this.embedPoints.geometry.attributes.aColor.needsUpdate = true;
    this.embedPoints.geometry.attributes.aSize.needsUpdate = true;

    // Look toward the centre of the nearest semantic neighbours.
    var look = new THREE.Vector3();
    for (var kk = 0; kk < Math.min(6, this.embedNeighbors.length); kk++) look.add(this.embedPositions[this.embedNeighbors[kk].id]);
    if (look.lengthSq() < 1e-6) look.set(0, 0, -10);
    look.normalize().multiplyScalar(10);
    this.embedLookTarget.copy(look);

    // Prompt labels follow the recentred cloud.
    this.rebuildEmbedLabels();
    // Neighbour labels and spokes.
    for (var nl = 0; nl < this.embedNeighborLabels.length; nl++) U.disposeObject(this.embedNeighborLabels[nl]);
    this.embedNeighborLabels = [];
    for (var nn = 0; nn < Math.min(9, this.embedNeighbors.length); nn++) {
      var nb = this.embedNeighbors[nn];
      var lab = U.makeLabel(data.vocab[nb.id] + "  " + nb.sim.toFixed(2), {
        color: nn < 3 ? "#ffe7b0" : "#bfe9ff", size: 34, glowColor: nn < 3 ? "#ffc857" : "#5ff3ff", bg: true, pad: 10,
      });
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: lab.texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.95,
      }));
      sp.scale.set((lab.width / lab.height) * 0.34, 0.34, 1);
      var np = this.embedPositions[nb.id];
      sp.position.copy(np).multiplyScalar(1.03);
      this.embedGroup.add(sp);
      this.embedNeighborLabels.push(sp);
    }
    if (this.embedNeighborLines) { U.disposeObject(this.embedNeighborLines); this.embedNeighborLines = null; }
    var linePos = new Float32Array(this.embedNeighbors.length * 6);
    var lineCol = new Float32Array(this.embedNeighbors.length * 6);
    for (var ll = 0; ll < this.embedNeighbors.length; ll++) {
      var nb2 = this.embedNeighbors[ll];
      var pp = this.embedPositions[nb2.id];
      linePos[ll * 6] = 0; linePos[ll * 6 + 1] = 0; linePos[ll * 6 + 2] = 0;
      linePos[ll * 6 + 3] = pp.x; linePos[ll * 6 + 4] = pp.y; linePos[ll * 6 + 5] = pp.z;
      var cc = new THREE.Color(0xffc857).lerp(new THREE.Color(0x5ff3ff), 1 - Math.max(0, nb2.sim));
      lineCol[ll * 6] = cc.r; lineCol[ll * 6 + 1] = cc.g; lineCol[ll * 6 + 2] = cc.b;
      lineCol[ll * 6 + 3] = cc.r; lineCol[ll * 6 + 4] = cc.g; lineCol[ll * 6 + 5] = cc.b;
    }
    var lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lg.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
    this.embedNeighborLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.embedGroup.add(this.embedNeighborLines);

    // A faint constellation between the nearest semantic neighbours.
    if (this.embedConstellation) { U.disposeObject(this.embedConstellation); this.embedConstellation = null; }
    var topN = this.embedNeighbors.slice(0, 10);
    var cPos = [], cCol = [];
    for (var a = 0; a < topN.length; a++) {
      for (var b = a + 1; b < topN.length; b++) {
        var sim = this.cosine(E, E, topN[a].id * Dm, topN[b].id * Dm, Dm);
        if (sim < 0.28) continue;
        var pa = this.embedPositions[topN[a].id], pb = this.embedPositions[topN[b].id];
        cPos.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
        var cc2 = new THREE.Color(0x5ff3ff).lerp(new THREE.Color(0xffc857), 1 - sim);
        cCol.push(cc2.r, cc2.g, cc2.b, cc2.r, cc2.g, cc2.b);
      }
    }
    if (cPos.length) {
      var cg = new THREE.BufferGeometry();
      cg.setAttribute("position", new THREE.Float32BufferAttribute(cPos, 3));
      cg.setAttribute("color", new THREE.Float32BufferAttribute(cCol, 3));
      this.embedConstellation = new THREE.LineSegments(cg, new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.20, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      this.embedGroup.add(this.embedConstellation);
    }

    this.updateEmbedVectors(trace, "E");
  };

  SceneRig.prototype.makeVecLines = function (colorPos) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(D * 2 * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(D * 2 * 3), 3));
    var mat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    var lines = new THREE.LineSegments(geo, mat);
    this.embedGroup.add(lines);
    return lines;
  };

  SceneRig.prototype.updateEmbedVectors = function (trace, mode) {
    if (!trace || !this.model) return;
    if (!this.embedVec.E) {
      this.embedVec.E = this.makeVecLines();
      this.embedVec.P = this.makeVecLines();
      this.embedVec.X = this.makeVecLines();
    }
    var Dm = this.model.dModel, p = trace.player;
    var E = trace.embed.tok, P = trace.embed.pos, X = trace.embed.x0;
    var maxAbs = 1e-6;
    for (var d = 0; d < Dm; d++) {
      maxAbs = Math.max(maxAbs, Math.abs(E[p * Dm + d]), Math.abs(P[p * Dm + d]), Math.abs(X[p * Dm + d]));
    }
    function write(lines, arr, positive, negative, startR) {
      var pos = lines.geometry.attributes.position.array;
      var col = lines.geometry.attributes.color.array;
      var cp = new THREE.Color(positive), cn = new THREE.Color(negative);
      for (var i = 0; i < Dm; i++) {
        var v = arr[p * Dm + i];
        var dir = this.embedDirs[i];
        var len = startR + 1.9 * Math.abs(v) / maxAbs;
        pos[i * 6] = dir.x * startR; pos[i * 6 + 1] = dir.y * startR; pos[i * 6 + 2] = dir.z * startR;
        pos[i * 6 + 3] = dir.x * len; pos[i * 6 + 4] = dir.y * len; pos[i * 6 + 5] = dir.z * len;
        var c = v >= 0 ? cp : cn;
        col[i * 6] = c.r; col[i * 6 + 1] = c.g; col[i * 6 + 2] = c.b;
        col[i * 6 + 3] = c.r; col[i * 6 + 4] = c.g; col[i * 6 + 5] = c.b;
      }
      lines.geometry.attributes.position.needsUpdate = true;
      lines.geometry.attributes.color.needsUpdate = true;
    }
    write.call(this, this.embedVec.E, E, 0x5ff3ff, 0xff4fd8, 0.18);
    write.call(this, this.embedVec.P, P, 0xffc857, 0xff8a3d, 0.52);
    write.call(this, this.embedVec.X, X, 0xffffff, 0x9fe9ff, 0.18);
    this.embedVec.E.visible = mode === "E" || mode === "EPX";
    this.embedVec.P.visible = mode === "EPX";
    this.embedVec.X.visible = mode === "EPX";

    // 128 glowing motes at the tips of the vector filaments: the dimensions.
    if (!this.embedMotes) {
      var mg = new THREE.BufferGeometry();
      mg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(Dm * 3), 3));
      mg.setAttribute("color", new THREE.BufferAttribute(new Float32Array(Dm * 3), 3));
      this.embedMotes = new THREE.Points(mg, new THREE.PointsMaterial({
        size: 0.055, vertexColors: true, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      }));
      this.embedGroup.add(this.embedMotes);
    }
    var useX = mode === "EPX";
    var src = useX ? X : E;
    var mp = this.embedMotes.geometry.attributes.position.array;
    var mc = this.embedMotes.geometry.attributes.color.array;
    for (var mi = 0; mi < Dm; mi++) {
      var mv = src[p * Dm + mi];
      var md = this.embedDirs[mi];
      var ml = 0.18 + 1.9 * Math.abs(mv) / maxAbs;
      mp[mi * 3] = md.x * ml; mp[mi * 3 + 1] = md.y * ml; mp[mi * 3 + 2] = md.z * ml;
      var mcol = mv >= 0 ? new THREE.Color(useX ? 0xffffff : 0x5ff3ff) : new THREE.Color(0xff4fd8);
      mc[mi * 3] = mcol.r; mc[mi * 3 + 1] = mcol.g; mc[mi * 3 + 2] = mcol.b;
    }
    this.embedMotes.geometry.attributes.position.needsUpdate = true;
    this.embedMotes.geometry.attributes.color.needsUpdate = true;
    this.embedMotes.visible = true;
  };

  SceneRig.prototype.rebuildEmbedLabels = function () {
    for (var i = 0; i < this.embedLabels.length; i++) U.disposeObject(this.embedLabels[i]);
    this.embedLabels = [];
    if (!this.trace) return;
    var data = TEGO.DATA;
    for (var t = 0; t < this.T; t++) {
      var id = this.trace.ids[t];
      var name = data.vocab[id];
      var p = this.embedPositions[id];
      if (!p) continue;
      var isPlayer = t === this.player;
      var lab = U.makeLabel(name, {
        color: isPlayer ? "#f4fbff" : "#ffd77a",
        size: isPlayer ? 62 : 44,
        glowColor: isPlayer ? "#ffffff" : "#ffc857",
      });
      var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: lab.texture, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: isPlayer ? 1 : 0.72,
      }));
      var aspect = lab.width / lab.height;
      sprite.scale.set(aspect * (isPlayer ? 0.9 : 0.58), isPlayer ? 0.9 : 0.58, 1);
      sprite.position.copy(p).multiplyScalar(1.06);
      this.embedGroup.add(sprite);
      this.embedLabels.push(sprite);
    }
  };

  /* ── FFN chamber ───────────────────────────────────────────────────── */

  SceneRig.prototype.buildFFN = function () {
    this.ffn = new THREE.Group();
    this.ffn.visible = false;
    this.world.add(this.ffn);

    var shellMat = new THREE.MeshBasicMaterial({ color: 0x02040c, side: THREE.BackSide, transparent: true, opacity: 1 });
    var shell = new THREE.Mesh(new THREE.SphereGeometry(6.4, 48, 32), shellMat);
    this.ffn.add(shell);
    this.ffnShell = shell;

    var gridMat = new THREE.MeshBasicMaterial({
      color: 0x1b9fc4, wireframe: true, transparent: true, opacity: 0.08,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    var grid = new THREE.Mesh(new THREE.SphereGeometry(6.18, 24, 16), gridMat);
    this.ffn.add(grid);
    this.ffnGrid = grid;

    // 512 neurons on a Fibonacci sphere.
    var n = CFG.dFf;
    var neuronGeo = new THREE.IcosahedronGeometry(0.055, 1);
    var neuronMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.neurons = new THREE.InstancedMesh(neuronGeo, neuronMat, n);
    this.neurons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.neuronPositions = [];
    var dummy = new THREE.Object3D();
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2;
      var r = Math.sqrt(1 - y * y);
      var theta = golden * i;
      var rad = 4.0 + U.hash(i + 7) * 1.25;
      var px = Math.cos(theta) * r * rad;
      var py = y * rad * 0.92;
      var pz = Math.sin(theta) * r * rad;
      dummy.position.set(px, py, pz);
      var sc = 0.6 + U.hash(i + 99) * 0.9;
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      this.neurons.setMatrixAt(i, dummy.matrix);
      this.neuronPositions.push(new THREE.Vector3(px, py, pz));
    }
    this.neurons.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    this.neurons.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.neurons.frustumCulled = false;
    this.ffn.add(this.neurons);

    // A glowing axis.
    var axis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 9, 8),
      new THREE.MeshBasicMaterial({ color: 0x9fe9ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.ffn.add(axis);

    // Input/output rings.
    this.inputRing = this.makeValueRing(0x5ff3ff);
    this.inputRing.position.y = -4.4;
    this.ffn.add(this.inputRing);
    this.outputRing = this.makeValueRing(0xffc857);
    this.outputRing.position.y = 4.4;
    this.ffn.add(this.outputRing);

    // The full W1 / W2 webs: every one of the 65,536 + 65,536 weights.
    this.ffnInputPos = [];
    this.ffnOutputPos = [];
    for (var ip = 0; ip < CFG.dModel; ip++) {
      var ia = (ip / CFG.dModel) * Math.PI * 2;
      this.ffnInputPos.push(new THREE.Vector3(Math.cos(ia) * 2.2, -4.4, Math.sin(ia) * 2.2));
      this.ffnOutputPos.push(new THREE.Vector3(Math.cos(ia) * 2.2, 4.4, Math.sin(ia) * 2.2));
    }
    this.ffnW1Points = this.buildFFNWebPoints(this.ffnInputPos, this.neuronPositions, CFG.dFf, CFG.dModel);
    this.ffnW1Top = this.buildFFNWebTop(this.ffnInputPos, this.neuronPositions, CFG.dFf, CFG.dModel, 1024);
    this.ffnW2Points = this.buildFFNWebPoints(this.neuronPositions, this.ffnOutputPos, CFG.dModel, CFG.dFf);
    this.ffnW2Top = this.buildFFNWebTop(this.neuronPositions, this.ffnOutputPos, CFG.dModel, CFG.dFf, 1024);

    // The wide door and the exit.
    this.ffnEntry = new THREE.Mesh(
      new THREE.RingGeometry(1.55, 2.35, 64),
      this.track(S.makeLensMaterial(0x5ff3ff, 0.82))
    );
    this.ffnEntry.rotation.x = -Math.PI / 2;
    this.ffnEntry.position.y = -4.4;
    this.ffn.add(this.ffnEntry);
    this.ffnExit = new THREE.Mesh(
      new THREE.RingGeometry(1.55, 2.35, 64),
      this.track(S.makeLensMaterial(0xffc857, 0.82))
    );
    this.ffnExit.rotation.x = -Math.PI / 2;
    this.ffnExit.position.y = 4.4;
    this.ffn.add(this.ffnExit);

    this.ffnInputLabel = this.makeAnnotation("LN(x_mid) · 128", "#9fe9ff", 0.40);
    this.ffnInputLabel.position.set(0, -5.35, 0);
    this.ffn.add(this.ffnInputLabel);
    this.ffnW1Label = this.makeAnnotation("W₁ · 65,536 weights in the matrix · all 65,536 weights as light points · 1,024 strongest filaments", "#5ff3ff", 0.32);
    this.ffnW1Label.position.set(0, -2.35, 2.7);
    this.ffn.add(this.ffnW1Label);
    this.ffnHiddenLabel = this.makeAnnotation("512 hidden · GELU", "#ffc857", 0.40);
    this.ffnHiddenLabel.position.set(0, 4.75, 0);
    this.ffn.add(this.ffnHiddenLabel);
    this.ffnW2Label = this.makeAnnotation("W₂ · 65,536 weights in the matrix · all 65,536 weights as light points · 1,024 strongest filaments", "#ff4fd8", 0.32);
    this.ffnW2Label.position.set(0, 2.35, 2.7);
    this.ffn.add(this.ffnW2Label);
    this.ffnOutputLabel = this.makeAnnotation("y · 128 · x_out = x_mid + y", "#ffe7b0", 0.38);
    this.ffnOutputLabel.position.set(0, 5.35, 0);
    this.ffn.add(this.ffnOutputLabel);

    // Weight planes.
    this.ffnWeightCanvasA = U.canvas(512, 256);
    this.ffnWeightTexA = new THREE.CanvasTexture(this.ffnWeightCanvasA);
    this.ffnWeightTexA.colorSpace = THREE.SRGBColorSpace;
    this.ffnWeightTexA.minFilter = THREE.LinearFilter;
    this.ffnWeightPlaneA = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 2.1),
      new THREE.MeshBasicMaterial({ map: this.ffnWeightTexA, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    this.ffnWeightPlaneA.position.set(-3.2, 1.4, -4.4);
    this.ffnWeightPlaneA.lookAt(0, 0, 0);
    this.ffn.add(this.ffnWeightPlaneA);

    this.ffnWeightCanvasB = U.canvas(512, 256);
    this.ffnWeightTexB = new THREE.CanvasTexture(this.ffnWeightCanvasB);
    this.ffnWeightTexB.colorSpace = THREE.SRGBColorSpace;
    this.ffnWeightTexB.minFilter = THREE.LinearFilter;
    this.ffnWeightPlaneB = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 2.1),
      new THREE.MeshBasicMaterial({ map: this.ffnWeightTexB, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    this.ffnWeightPlaneB.position.set(3.2, 1.4, -4.4);
    this.ffnWeightPlaneB.lookAt(0, 0, 0);
    this.ffn.add(this.ffnWeightPlaneB);

    // GELU curve plane.
    this.geluCanvas = U.canvas(512, 256);
    this.geluTexture = new THREE.CanvasTexture(this.geluCanvas);
    this.geluTexture.colorSpace = THREE.SRGBColorSpace;
    this.geluTexture.minFilter = THREE.LinearFilter;
    this.geluPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 2.1),
      new THREE.MeshBasicMaterial({ map: this.geluTexture, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    this.geluPlane.position.set(0, 2.1, -4.6);
    this.geluPlane.lookAt(0, 0, 0);
    this.ffn.add(this.geluPlane);

    // Connection lines for the strongest neurons.
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(48 * 4 * 3), 3));
    lineGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(48 * 4 * 3), 3));
    this.ffnLines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.ffn.add(this.ffnLines);
  };

  SceneRig.prototype.buildWebPoints = function (parent, starts, ends, rows, cols, stride, size, opacity) {
    stride = stride || 1;
    var ids = [];
    var total = rows * cols;
    for (var id = 0; id < total; id += stride) ids.push(id);
    var n = ids.length;
    var pos = new Float32Array(n * 3);
    var col = new Float32Array(n * 3);
    for (var k = 0; k < n; k++) {
      var r = Math.floor(ids[k] / cols), c = ids[k] % cols;
      var a = starts[c], b = ends[r];
      pos[k * 3] = (a.x + b.x) * 0.5;
      pos[k * 3 + 1] = (a.y + b.y) * 0.5;
      pos[k * 3 + 2] = (a.z + b.z) * 0.5;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var m = new THREE.PointsMaterial({
      size: size || 0.026, vertexColors: true, transparent: true, opacity: opacity === undefined ? 0.55 : opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    var p = new THREE.Points(g, m);
    p.renderOrder = 2;
    parent.add(p);
    p.userData = { rows: rows, cols: cols, ids: ids };
    return p;
  };

  SceneRig.prototype.updateWebPoints = function (points, W, maxW) {
    if (!points || !W) return;
    var col = points.geometry.attributes.color.array;
    var ids = points.userData.ids;
    for (var k = 0; k < ids.length; k++) {
      var w = W[ids[k]];
      var a = Math.pow(Math.min(1, Math.abs(w) / (maxW || 1)), 1.1);
      var cc = w >= 0 ? [0.37, 0.95, 1.0] : [1.0, 0.31, 0.85];
      col[k * 3] = cc[0] * a;
      col[k * 3 + 1] = cc[1] * a;
      col[k * 3 + 2] = cc[2] * a;
    }
    points.geometry.attributes.color.needsUpdate = true;
  };

  SceneRig.prototype.buildWebTop = function (parent, starts, ends, rows, cols, N, opacity) {
    var pos = new Float32Array(N * 2 * 3);
    var col = new Float32Array(N * 2 * 3);
    var wgt = new Float32Array(N * 2);
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aWeight", new THREE.BufferAttribute(wgt, 1));
    var m = this.track(S.makeFFNWebMaterial());
    m.uniforms.uOpacity.value = opacity === undefined ? 0.75 : opacity;
    var mesh = new THREE.LineSegments(g, m);
    mesh.renderOrder = 3;
    parent.add(mesh);
    mesh.userData = { starts: starts, ends: ends, rows: rows, cols: cols, N: N };
    return mesh;
  };

  SceneRig.prototype.updateWebTop = function (mesh, W, maxW) {
    if (!mesh || !W) return;
    var starts = mesh.userData.starts, ends = mesh.userData.ends, N = mesh.userData.N;
    var rows = mesh.userData.rows, cols = mesh.userData.cols;
    var count = rows * cols;
    var idx = new Array(count);
    for (var i = 0; i < count; i++) idx[i] = i;
    idx.sort(function (a, b) { return Math.abs(W[b]) - Math.abs(W[a]); });
    var pos = mesh.geometry.attributes.position.array;
    var col = mesh.geometry.attributes.aColor.array;
    var wgt = mesh.geometry.attributes.aWeight.array;
    for (var k = 0; k < N; k++) {
      var id = idx[k];
      var r = Math.floor(id / cols), c = id % cols;
      var a = starts[c], b = ends[r];
      pos[k * 6] = a.x; pos[k * 6 + 1] = a.y; pos[k * 6 + 2] = a.z;
      pos[k * 6 + 3] = b.x; pos[k * 6 + 4] = b.y; pos[k * 6 + 5] = b.z;
      var w = W[id];
      var inten = Math.min(1, Math.abs(w) / (maxW || 1));
      var cc = w >= 0 ? [0.37, 0.95, 1.0] : [1.0, 0.31, 0.85];
      col[k * 6] = cc[0]; col[k * 6 + 1] = cc[1]; col[k * 6 + 2] = cc[2];
      col[k * 6 + 3] = cc[0]; col[k * 6 + 4] = cc[1]; col[k * 6 + 5] = cc[2];
      wgt[k * 2] = inten; wgt[k * 2 + 1] = inten;
    }
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.aColor.needsUpdate = true;
    mesh.geometry.attributes.aWeight.needsUpdate = true;
  };

  SceneRig.prototype.makeNodeRing = function (parent, positions, color, size) {
    var n = positions.length;
    var pos = new Float32Array(n * 3);
    var col = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      pos[i * 3] = positions[i].x; pos[i * 3 + 1] = positions[i].y; pos[i * 3 + 2] = positions[i].z;
      var c = new THREE.Color(color);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var p = new THREE.Points(g, new THREE.PointsMaterial({
      size: size || 0.05, vertexColors: true, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    parent.add(p);
    return p;
  };

  SceneRig.prototype.updateNodeRing = function (points, values, posColor, negColor, activeHead) {
    if (!points || !values) return;
    var col = points.geometry.attributes.color.array;
    var max = 1e-6, n = values.length;
    for (var i = 0; i < n; i++) max = Math.max(max, Math.abs(values[i]));
    for (var j = 0; j < n; j++) {
      var v = values[j] / max;
      var inHead = activeHead === undefined ? true : (j >= activeHead * CFG.dHead && j < (activeHead + 1) * CFG.dHead);
      var c = v >= 0 ? posColor : negColor;
      var k = inHead ? 1 : 0.22;
      col[j * 3] = c[0] * (0.2 + Math.abs(v) * 0.8) * k;
      col[j * 3 + 1] = c[1] * (0.2 + Math.abs(v) * 0.8) * k;
      col[j * 3 + 2] = c[2] * (0.2 + Math.abs(v) * 0.8) * k;
    }
    points.geometry.attributes.color.needsUpdate = true;
  };

  SceneRig.prototype.buildFFNWebPoints = function (starts, ends, rows, cols) {
    var stride = 1;
    var ids = [];
    var total = rows * cols;
    for (var id = 0; id < total; id += stride) ids.push(id);
    var n = ids.length;
    var pos = new Float32Array(n * 3);
    var col = new Float32Array(n * 3);
    for (var k = 0; k < n; k++) {
      var r = Math.floor(ids[k] / cols), c = ids[k] % cols;
      var a = starts[c], b = ends[r];
      pos[k * 3] = (a.x + b.x) * 0.5;
      pos[k * 3 + 1] = (a.y + b.y) * 0.5;
      pos[k * 3 + 2] = (a.z + b.z) * 0.5;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var m = new THREE.PointsMaterial({
      size: 0.023, vertexColors: true, transparent: true, opacity: 0.52,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    var p = new THREE.Points(g, m);
    p.renderOrder = 2;
    this.ffn.add(p);
    p.userData = { rows: rows, cols: cols, ids: ids };
    return p;
  };

  SceneRig.prototype.updateFFNWebPoints = function (points, W, rows, cols, maxW) {
    if (!points || !W) return;
    var col = points.geometry.attributes.color.array;
    var ids = points.userData.ids;
    for (var k = 0; k < ids.length; k++) {
      var w = W[ids[k]];
      var a = Math.pow(Math.min(1, Math.abs(w) / (maxW || 1)), 1.1);
      var cc = w >= 0 ? [0.37, 0.95, 1.0] : [1.0, 0.31, 0.85];
      col[k * 3] = cc[0] * a;
      col[k * 3 + 1] = cc[1] * a;
      col[k * 3 + 2] = cc[2] * a;
    }
    points.geometry.attributes.color.needsUpdate = true;
  };

  SceneRig.prototype.buildFFNWebTop = function (starts, ends, rows, cols, N) {
    var pos = new Float32Array(N * 2 * 3);
    var col = new Float32Array(N * 2 * 3);
    var wgt = new Float32Array(N * 2);
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aWeight", new THREE.BufferAttribute(wgt, 1));
    var m = this.track(S.makeFFNWebMaterial());
    m.uniforms.uOpacity.value = 0.85;
    var mesh = new THREE.LineSegments(g, m);
    mesh.renderOrder = 3;
    this.ffn.add(mesh);
    mesh.userData = { starts: starts, ends: ends, rows: rows, cols: cols, N: N };
    return mesh;
  };

  SceneRig.prototype.updateFFNWebTop = function (mesh, W, rows, cols, maxW) {
    if (!mesh || !W) return;
    var starts = mesh.userData.starts, ends = mesh.userData.ends, N = mesh.userData.N;
    var count = rows * cols;
    var idx = new Array(count);
    for (var i = 0; i < count; i++) idx[i] = i;
    idx.sort(function (a, b) { return Math.abs(W[b]) - Math.abs(W[a]); });
    var pos = mesh.geometry.attributes.position.array;
    var col = mesh.geometry.attributes.aColor.array;
    var wgt = mesh.geometry.attributes.aWeight.array;
    for (var k = 0; k < N; k++) {
      var id = idx[k];
      var r = Math.floor(id / cols), c = id % cols;
      var a = starts[c], b = ends[r];
      pos[k * 6] = a.x; pos[k * 6 + 1] = a.y; pos[k * 6 + 2] = a.z;
      pos[k * 6 + 3] = b.x; pos[k * 6 + 4] = b.y; pos[k * 6 + 5] = b.z;
      var w = W[id];
      var inten = Math.min(1, Math.abs(w) / (maxW || 1));
      var cc = w >= 0 ? [0.37, 0.95, 1.0] : [1.0, 0.31, 0.85];
      col[k * 6] = cc[0]; col[k * 6 + 1] = cc[1]; col[k * 6 + 2] = cc[2];
      col[k * 6 + 3] = cc[0]; col[k * 6 + 4] = cc[1]; col[k * 6 + 5] = cc[2];
      wgt[k * 2] = inten; wgt[k * 2 + 1] = inten;
    }
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.aColor.needsUpdate = true;
    mesh.geometry.attributes.aWeight.needsUpdate = true;
  };

  SceneRig.prototype.makeValueRing = function (color) {
    var n = 128, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * 2.2;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = Math.sin(a) * 2.2;
      var c = new THREE.Color(color);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.075, vertexColors: true, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
  };

  /* ── logit sky ─────────────────────────────────────────────────────── */

  SceneRig.prototype.buildSky = function () {
    this.skyGroup = new THREE.Group();
    this.skyGroup.position.y = this.skyY;
    this.skyGroup.visible = false;
    this.world.add(this.skyGroup);

    var domeMat = new THREE.MeshBasicMaterial({
      color: 0x070316, side: THREE.BackSide, transparent: true, opacity: 0.72,
    });
    var dome = new THREE.Mesh(new THREE.SphereGeometry(22, 48, 32), domeMat);
    this.skyGroup.add(dome);
    this.skyDome = dome;

    var grid = new THREE.Mesh(
      new THREE.SphereGeometry(21.5, 30, 20),
      new THREE.MeshBasicMaterial({ color: 0x8d7bff, wireframe: true, transparent: true, opacity: 0.025, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.skyGroup.add(grid);

    var data = TEGO.DATA, n = data.vocab.length;
    var pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var s = data.sem3[i];
      pos[i * 3] = s[0] * 15;
      pos[i * 3 + 1] = 5 + (s[2] * 0.5 + 0.5) * 11;
      pos[i * 3 + 2] = s[1] * 15;
      var c = new THREE.Color(0x5c6f9a);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      size[i] = 1.2;
      phase[i] = (i * 0.17) % 1;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    var mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: this.pixelRatio }, uScale: { value: 46 } },
      vertexShader: S.starVert, fragmentShader: S.starFrag,
    });
    this.track(mat);
    this.skyStars = new THREE.Points(geo, mat);
    this.skyGroup.add(this.skyStars);
    this.skyStarPositions = [];
    for (var j = 0; j < n; j++) this.skyStarPositions.push(new THREE.Vector3(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]));

    // The tied unembedding: 128 final dimensions -> 258 vocabulary logits.
    this.unembedSourcePos = [];
    for (var ud = 0; ud < D; ud++) {
      var ua = (ud / D) * Math.PI * 2;
      this.unembedSourcePos.push(new THREE.Vector3(Math.cos(ua) * 2.6, 0, Math.sin(ua) * 2.6));
    }
    this.unembedPoints = this.buildWebPoints(this.skyGroup, this.unembedSourcePos, this.skyStarPositions, n, D, 1, 0.028, 0.40);
    this.unembedTop = this.buildWebTop(this.skyGroup, this.unembedSourcePos, this.skyStarPositions, n, D, 1024, 0.65);
    this.unembedRing = this.makeNodeRing(this.skyGroup, this.unembedSourcePos, 0xffffff, 0.065);
    this.unembedLabel = this.makeAnnotation("UNEMBEDDING · 258 × 128 = 33,024 weights · brightness ∝ |E[v,d]·LN(x)_d|", "#ffffff", 0.34);
    this.unembedLabel.position.set(0, 3.1, 0);
    this.skyGroup.add(this.unembedLabel);

    // Final vector beam.
    var bg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -9, 0), new THREE.Vector3(0, 5, 0)]);
    this.finalBeam = new THREE.Line(bg, new THREE.LineBasicMaterial({
      color: 0xfff4cf, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.skyGroup.add(this.finalBeam);

    this.topStar = new THREE.Sprite(new THREE.SpriteMaterial({
      map: U.makeRadialSprite("rgba(255,240,190,1)", 256),
      color: 0xfff4cf, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.topStar.scale.set(3, 3, 1);
    this.topStar.visible = false;
    this.skyGroup.add(this.topStar);

    // A pool of labels for the top-k tokens.
    for (var k = 0; k < 14; k++) {
      var lab = U.makeLabel("token", { color: "#ffe7b0", size: 44, glowColor: "#ffc857" });
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: lab.texture, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0.95,
      }));
      sp.visible = false;
      this.skyGroup.add(sp);
      this.skyLabelPool.push(sp);
    }
  };

  /* ── trace / layout ────────────────────────────────────────────────── */

  SceneRig.prototype.setTrace = function (trace) {
    this.trace = trace;
    this._beamLayer = -1;
    this.T = trace ? trace.T : 0;
    this.player = trace ? trace.player : 0;
    this.currentLayer = 0;
    if (!trace) return;

    // Remove old token entities.
    for (var l = 0; l < this.tokenLayers.length; l++) {
      var old = this.tokenLayers[l];
      if (old) { this.tower.remove(old); U.disposeObject(old, true); }
    }
    if (this._tokenLabelTextures) {
      for (var tl = 0; tl < this._tokenLabelTextures.length; tl++) {
        try { this._tokenLabelTextures[tl].dispose(); } catch (e) {}
      }
    }
    this._tokenLabelTextures = [];
    this.tokenLayers = [];
    for (var l2 = 0; l2 < L; l2++) {
      var g = new THREE.Group();
      g.position.y = l2 * this.GAP;
      g.userData.tokens = [];
      this.tower.add(g);
      this.tokenLayers.push(g);
    }

    var delta = this.T > 1 ? Math.min(0.46, (Math.PI * 1.55) / (this.T - 1)) : 0;
    this.delta = delta;
    this.tokenAngle = function (i, player) { return (i - player) * delta; };

    var labelTex = {};
    for (var t = 0; t < this.T; t++) {
      var name = trace.tokens[t];
      if (!labelTex[name]) {
        labelTex[name] = U.makeLabel(name, { color: "#e9f3ff", size: 46, glowColor: "#9fe9ff" });
        this._tokenLabelTextures.push(labelTex[name].texture);
      }
    }
    this.labelTextures = labelTex;

    for (var l3 = 0; l3 < L; l3++) {
      var layerGroup = this.tokenLayers[l3];
      var layerTrace = trace.layers[l3];
      for (var i = 0; i < this.T; i++) {
        var isPlayer = i === this.player;
        var isPast = i < this.player;
        var roleColor = isPlayer ? 0xf4fbff : isPast ? 0xffc857 : 0x8d7bff;
        var rim = isPlayer ? 0xffffff : isPast ? 0xffd77a : 0xb9a7ff;
        var ang = this.tokenAngle(i, this.player);
        var px = Math.cos(ang) * this.R;
        var pz = Math.sin(ang) * this.R;
        var vec = new Float32Array(D);
        var off = i * D;
        for (var d = 0; d < D; d++) vec[d] = layerTrace.xOut[off + d];
        var vnorm = U.norm(vec) || 1;
        var scale = (isPlayer ? 1.05 : 0.72) * (0.92 + Math.min(0.7, vnorm / 45));
        var grp = new THREE.Group();
        grp.position.set(px, 0, pz);
        var crystal = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.31, 1),
          this.track(S.makeCrystalMaterial(roleColor, rim, isPlayer))
        );
        crystal.scale.setScalar(scale);
        grp.add(crystal);
        var halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: this.haloTexture(roleColor),
          color: roleColor, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, opacity: isPlayer ? 0.55 : 0.48,
        }));
        halo.scale.set(isPlayer ? 1.7 : 1.5, isPlayer ? 1.7 : 1.5, 1);
        grp.add(halo);
        var labTex = labelTex[nameOf(trace.tokens[i])] || labelTex[trace.tokens[i]];
        var lab = new THREE.Sprite(new THREE.SpriteMaterial({
          map: labTex.texture, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, opacity: isPlayer ? 1 : 0.7,
          color: roleColor,
        }));
        var aspect = labTex.width / labTex.height;
        lab.scale.set(aspect * (isPlayer ? 0.72 : 0.48), isPlayer ? 0.72 : 0.48, 1);
        lab.position.y = isPlayer ? 0.95 : 0.66;
        grp.add(lab);
        var beamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-px, 0, -pz)]);
        var beam = new THREE.Line(beamGeo, new THREE.LineBasicMaterial({
          color: roleColor, transparent: true, opacity: isPlayer ? 0.30 : 0.08,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        grp.add(beam);
        // Invisible pick target, generously larger than the crystal.
        var pick = new THREE.Mesh(
          new THREE.SphereGeometry(0.80, 8, 6),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false })
        );
        pick.userData.tokenIndex = i;
        pick.userData.layer = l3;
        grp.add(pick);
        grp.userData = { token: i, layer: l3, crystal: crystal, halo: halo, label: lab, beam: beam, pick: pick, role: isPlayer ? "player" : isPast ? "past" : "future", vnorm: vnorm };
        layerGroup.add(grp);
        layerGroup.userData.tokens.push(grp);
        this.track(crystal.material);
      }
    }

    // Player trail through the layers.
    var posArr = this.trail.geometry.attributes.position.array;
    var colArr = this.trail.geometry.attributes.color.array;
    for (var lt = 0; lt < L; lt++) {
      var a = 0;
      var c = new THREE.Color(CFG.LAYER_COLORS[lt]);
      posArr[lt * 3] = Math.cos(a) * this.R;
      posArr[lt * 3 + 1] = lt * this.GAP + 0.35;
      posArr[lt * 3 + 2] = Math.sin(a) * this.R;
      colArr[lt * 3] = c.r; colArr[lt * 3 + 1] = c.g; colArr[lt * 3 + 2] = c.b;
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.color.needsUpdate = true;

    this.rebuildTokenLine();
    this.updateEmbeddingWall(trace);
    this.setEmbeddingSpace(trace);
    this.rebuildCurtain();
    this.setLayer(this.currentLayer);
    this.updateSky(trace.final.probs);
    this.updateUnembeddingWeb(trace);
  };

  function nameOf(x) { return x; }

  SceneRig.prototype.haloTexture = function (color) {
    if (!this._halos) this._halos = {};
    var key = color.toString(16);
    if (this._halos[key]) return this._halos[key];
    var c = new THREE.Color(color);
    var t = U.makeRadialSprite("rgba(" + Math.round(c.r * 255) + "," + Math.round(c.g * 255) + "," + Math.round(c.b * 255) + ",1)", 256);
    this._halos[key] = t;
    return t;
  };

  /* ── layer state ───────────────────────────────────────────────────── */

  SceneRig.prototype.setLayer = function (l) {
    this.currentLayer = U.clamp(l, 0, L - 1);
    for (var i = 0; i < L; i++) {
      var active = i === this.currentLayer;
      var mats = this.ringMats[i];
      mats.torus.opacity = active ? 0.85 : 0.12;
      mats.outer.opacity = active ? 0.35 : 0.06;
      mats.floor.uniforms.uAlpha.value = active ? 1.0 : 0.18;
      var g = this.ringGroups[i];
      g.scale.setScalar(active ? 1.0 : 0.985);
      if (g.children) {
        for (var c = 0; c < g.children.length; c++) {
          var ch = g.children[c];
          if (ch.isSprite) ch.material.opacity = active ? 0.24 : 0.05;
        }
      }
    }
    for (var l2 = 0; l2 < L; l2++) {
      var layerGroup = this.tokenLayers[l2];
      if (!layerGroup) continue;
      var current = l2 === this.currentLayer;
      for (var t = 0; t < layerGroup.userData.tokens.length; t++) {
        var tok = layerGroup.userData.tokens[t];
        var isPlayer = tok.userData.role === "player";
        tok.visible = current || isPlayer;
        tok.userData.crystal.material.uniforms.uIntensity.value = current ? (isPlayer ? 0.95 : 1.0) : 0.32;
        tok.userData.halo.material.opacity = current ? (isPlayer ? 0.55 : 0.42) : 0.08;
        tok.userData.label.material.opacity = current ? (isPlayer ? 1 : 0.72) : 0;
        tok.userData.beam.material.opacity = current ? (isPlayer ? 0.32 : 0.09) : 0.02;
      }
    }
    this.setCollarTargetForPhase(this.stage, this.currentLayer, this.phase);
    this.updateCollar();
    if (this.braidMeshes) {
      for (var bb2 = 0; bb2 < this.braidMeshes.length; bb2++) {
        var bmat2 = this.braidMeshes[bb2].material;
        if (bmat2.uniforms && bmat2.uniforms.uOpacity) bmat2.uniforms.uOpacity.value = bb2 === this.currentLayer ? 0.55 : 0.13;
      }
    }
    if (this._beamLayer !== this.currentLayer) {
      this._beamLayer = this.currentLayer;
      this.rebuildBeams();
    }
    this.rebuildCurtain();
    this.positionLens();
    this.positionQKV();
    this.updateQKV();
    this.positionQGlyph();
    if (this.residualLabel) {
      this.residualLabel.position.set(1.55, this.currentLayer * this.GAP + 0.75, 0);
    }
    if (this.attentionLabel) {
      this.attentionLabel.position.set(this.R - 2.2, this.currentLayer * this.GAP + 1.15, 0.5);
    }
    if (this.causalLabel && this.trace) {
      var midA = (this.delta * (1 + (this.T - 1 - this.player) * 0.5));
      this.causalLabel.position.set(Math.cos(midA) * (this.R + 0.35), this.currentLayer * this.GAP + 1.25, Math.sin(midA) * (this.R + 0.35));
    }
    this.applyPlayerTint();
    if (this.projGroup) this.projGroup.position.y = this.currentLayer * this.GAP;
    if (this.outGroup) this.outGroup.position.y = this.currentLayer * this.GAP;
    if (this.splitGroup) {
      var sy = this.currentLayer * this.GAP;
      var baseX = this.R, baseZ = 0;
      this.splitParts[0].position.set(baseX + 0.15, sy + 0.62, 0.75);
      this.splitParts[1].position.set(baseX + 0.15, sy + 0.48, -0.75);
      this.splitParts[2].position.set(baseX - 0.85, sy + 0.34, 0.0);
      this.splitGroup.visible = this.stage === "layer" && (this.phase === "qkv" || this.phase === "attn" || this.phase === "mix" || this.phase === "scores" || this.phase === "mask" || this.phase === "softmax");
    }
  };

  SceneRig.prototype.applyPlayerTint = function () {
    if (!this.trace) return;
    var group = this.tokenLayers[this.currentLayer] && this.tokenLayers[this.currentLayer].userData.tokens[this.player];
    if (!group) return;
    var color = new THREE.Color(0xffffff);
    if (this.stage === "layer" && this.phase === "mix") {
      var layer = this.trace.layers[this.currentLayer];
      var T = this.trace.T, p = this.player, h = this.activeHead;
      var sum = 0, r = 0, g = 0, b = 0;
      for (var j = 0; j < p; j++) {
        var a = layer.weights[(h * T + p) * T + j];
        sum += a; r += a; g += a * 0.784; b += a * 0.341;
      }
      if (sum > 1e-6) {
        r /= sum; g /= sum; b /= sum;
        var s = Math.min(0.8, sum);
        color.setRGB(1 - s + r * s, 1 - s + g * s, 1 - s + b * s);
      }
    }
    var mat = group.userData.crystal.material;
    if (mat.uniforms.uColor) mat.uniforms.uColor.value.copy(color);
    if (mat.uniforms.uRim) mat.uniforms.uRim.value.copy(color);
    if (group.userData.halo && group.userData.halo.material) group.userData.halo.material.color.copy(color);
  };

  SceneRig.prototype.setCollarTargetForPhase = function (stage, layer, phase) {
    if (!this.trace) return;
    var p = this.player, l = U.clamp(layer === undefined ? this.currentLayer : layer, 0, this.trace.layers.length - 1);
    var src = this.trace.embed.x0, off = p * D;
    if (stage === "layer") {
      var lay = this.trace.layers[l];
      if (phase === "write") { src = lay.xMid; }
      else if (phase === "write2") { src = lay.xOut; }
      else if (phase === "ffn" || phase === "ffn_w1" || phase === "ffn_gelu" || phase === "ffn_w2") { src = lay.xMid; }
      else { src = lay.xIn; }
    } else if (stage === "final" || stage === "epilogue") {
      src = this.trace.final.x; off = 0;
    }
    for (var d = 0; d < D; d++) this.collarTarget[d] = src[off + d];
    if (!this.collarReady) {
      for (var i = 0; i < D; i++) this.collarVec[i] = this.collarTarget[i];
      this.collarReady = true;
    }
  };

  SceneRig.prototype.updateCollar = function () {
    if (!this.trace) return;
    var vec = this.collarVec;
    var p = this.player, off = p * D;
    var maxAbs = 1e-6;
    for (var d = 0; d < D; d++) maxAbs = Math.max(maxAbs, Math.abs(vec[d]));
    var pos = this.collar.geometry.attributes.position.array;
    var col = this.collar.geometry.attributes.color.array;
    var y0 = this.currentLayer * this.GAP;
    for (var i = 0; i < D; i++) {
      var a = (i / D) * Math.PI * 2;
      var v = vec[i] / maxAbs;
      var h = 0.18 + 1.25 * Math.abs(v);
      var r = 1.32 + 0.10 * Math.abs(v);
      var x = Math.cos(a) * r, z = Math.sin(a) * r;
      pos[i * 6] = x; pos[i * 6 + 1] = y0 - h / 2; pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = x; pos[i * 6 + 4] = y0 + h / 2; pos[i * 6 + 5] = z;
      var c = v >= 0 ? new THREE.Color(0x5ff3ff) : new THREE.Color(0xff4fd8);
      var k = 0.35 + 0.65 * Math.abs(v);
      col[i * 6] = c.r * k; col[i * 6 + 1] = c.g * k; col[i * 6 + 2] = c.b * k;
      col[i * 6 + 3] = c.r * k; col[i * 6 + 4] = c.g * k; col[i * 6 + 5] = c.b * k;
    }
    this.collar.geometry.attributes.position.needsUpdate = true;
    this.collar.geometry.attributes.color.needsUpdate = true;
    this.collar.position.y = 0;
  };

  /* ── attention beams ───────────────────────────────────────────────── */

  SceneRig.prototype.playerAngle = function () { return 0; };

  SceneRig.prototype.rebuildBeams = function () {
    if (!this.trace) return;
    this._beamLayer = this.currentLayer;
    while (this.beamRoot.children.length) {
      var c = this.beamRoot.children.pop();
      U.disposeObject(c, true);
    }
    this.beamMeshes = [];
    this.beamParticles = [];
    var l = this.currentLayer, T = this.T, p = this.player;
    var y = l * this.GAP;
    var layerTrace = this.trace.layers[l];
    var delta = this.delta;
    var startAngle = 0;
    for (var h = 0; h < H; h++) {
      var wRow = layerTrace.weights;
      for (var j = 0; j <= p; j++) {
        var w = wRow[(h * T + p) * T + j];
        if (w < 0.004) continue;
        var a0 = j === p ? -0.11 : (j - p) * delta;
        var a1 = j === p ? 0.11 : startAngle;
        var pts = [];
        var steps = 10;
        for (var s = 0; s <= steps; s++) {
          var t = s / steps;
          var a = a0 + (a1 - a0) * t;
          var bump = Math.sin(t * Math.PI) * (0.22 + w * 0.65);
          pts.push(new THREE.Vector3(Math.cos(a) * (this.R - 0.15), 0.18 + bump, Math.sin(a) * (this.R - 0.15)));
        }
        var curve = new THREE.CatmullRomCurve3(pts);
        var radius = 0.010 + 0.062 * Math.sqrt(w);
        var geo = new THREE.TubeGeometry(curve, 20, radius, 6, false);
        var mat = this.track(S.makeBeamMaterial(CFG.HEAD_COLORS[h], w, h === this.activeHead ? 1 : 0.30, 0.45 + h * 0.12));
        var mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = 7;
        mesh.userData = { head: h, token: j, weight: w };
        mesh.position.y = y;
        this.beamRoot.add(mesh);
        this.beamMeshes.push(mesh);
        var pc = w > 0.06 ? 2 : 1;
        for (var pp = 0; pp < pc; pp++) {
          var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.particleTexture, color: CFG.HEAD_COLORS[h], transparent: true,
            depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.45 + w * 0.45,
          }));
          var ps = 0.09 + w * 0.20;
          sprite.scale.set(ps, ps, 1);
          this.beamRoot.add(sprite);
          this.beamParticles.push({
            sprite: sprite, curve: curve, y: y,
            offset: (pp / pc) + U.hash((j + 1) * (h + 3) + pp * 17) * 0.35,
            speed: 0.16 + w * 0.45, weight: w,
          });
        }
      }
    }
    // The future curtain lives on the current ring, too.
    this.curtain.position.y = y;
    this.positionQKV();
    this.positionLens();
  };

  SceneRig.prototype.setActiveHead = function (h) {
    this.activeHead = U.clamp(h, 0, H - 1);
    for (var i = 0; i < this.beamMeshes.length; i++) {
      var m = this.beamMeshes[i];
      if (!m.material.uniforms) continue;
      m.material.uniforms.uOpacity.value = m.userData.head === this.activeHead ? 1 : 0.30;
    }
    this.updateQKV();
    this.positionQGlyph();
    this.applyPlayerTint();
  };

  /* ── causal curtain ────────────────────────────────────────────────── */

  SceneRig.prototype.rebuildCurtain = function () {
    if (!this.trace) return;
    var T = this.T, p = this.player, delta = this.delta;
    if (p >= T - 1) { this.curtain.visible = false; return; }
    var aStart = delta * 0.55;
    var aEnd = (T - 1 - p) * delta;
    var steps = 32;
    var positions = [];
    var uvs = [];
    var indices = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var a = aStart + (aEnd - aStart) * t;
      var x = Math.cos(a) * (this.R + 0.05);
      var z = Math.sin(a) * (this.R + 0.05);
      positions.push(x, -0.95, z, x, 1.35, z);
      uvs.push(t, 0, t, 1);
      if (i < steps) {
        var b = i * 2;
        indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    this.curtain.geometry.dispose();
    this.curtain.geometry = geo;
    this.curtain.position.y = this.currentLayer * this.GAP;
    this.curtain.visible = true;
  };

  /* ── LayerNorm lens & QKV panels ───────────────────────────────────── */

  SceneRig.prototype.positionLens = function () {
    if (!this.trace) return;
    var y = this.currentLayer * this.GAP;
    var mid = new THREE.Vector3(Math.cos(0) * this.R * 0.48, y + 0.25, Math.sin(0) * this.R * 0.48);
    this.lensGroup.position.copy(mid);
    this.lensGroup.lookAt(new THREE.Vector3(0, y + 0.25, 0));
    this.lensGroup.visible = this.phase === "ln1" || this.phase === "qkv" || this.stage === "embed";
  };

  SceneRig.prototype.positionQGlyph = function () {
    if (!this.trace || !this.qGlyph) return;
    var l = this.currentLayer, p = this.player, h = this.activeHead;
    var layer = this.trace.layers[l];
    var q = [];
    for (var d = 0; d < CFG.dHead; d++) q.push(layer.q[p * CFG.dModel + h * CFG.dHead + d]);
    var dir = U.pca3(q);
    var v = new THREE.Vector3(dir[0], dir[1] * 0.7, dir[2]);
    if (v.lengthSq() < 1e-6) v.set(0, 0, 1);
    v.normalize();
    var y = l * this.GAP;
    var base = new THREE.Vector3(Math.cos(0) * this.R, y + 0.35, Math.sin(0) * this.R);
    this.qGlyph.position.copy(base).add(v.clone().multiplyScalar(0.75));
    this.qGlyph.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v);
    if (this.qGlyphMats) {
      var col = CFG.HEAD_COLORS[h];
      for (var m = 0; m < this.qGlyphMats.length; m++) {
        if (this.qGlyphMats[m].uniforms && this.qGlyphMats[m].uniforms.uColor) this.qGlyphMats[m].uniforms.uColor.value.setHex(col);
      }
    }
  };

  SceneRig.prototype.positionQKV = function () {
    if (!this.trace) return;
    var y = this.currentLayer * this.GAP;
    var ang = 0;
    var base = new THREE.Vector3(Math.cos(ang) * (this.R - 0.8), y + 1.55, Math.sin(ang) * (this.R - 0.8));
    this.qkvGroup.position.copy(base);
    // Panels face the player's eye (outside the ring).
    this.qkvGroup.lookAt(new THREE.Vector3(Math.cos(ang) * (this.R + 3), y + 1.4, Math.sin(ang) * (this.R + 3)));
    this.qkvPanels.q.mesh.position.set(-1.55, 0.38, 0.1);
    this.qkvPanels.k.mesh.position.set(0, 0.38, 0.1);
    this.qkvPanels.v.mesh.position.set(1.55, 0.38, 0.1);
    this.qkvWeightMesh.position.set(0, -0.95, 0.15);
  };

  SceneRig.prototype.updateQKV = function () {
    if (!this.trace) return;
    var l = this.currentLayer, p = this.player;
    var layer = this.trace.layers[l];
    var vecs = {
      q: this.trace.q ? this.trace.q : null,
    };
    var q = new Float32Array(D), k = new Float32Array(D), v = new Float32Array(D);
    for (var d = 0; d < D; d++) {
      q[d] = layer.q[p * D + d];
      k[d] = layer.k[p * D + d];
      v[d] = layer.v[p * D + d];
    }
    this.drawVectorPanel(this.qkvPanels.q, "query · Q", q, this.activeHead);
    this.drawVectorPanel(this.qkvPanels.k, "key · K", k, this.activeHead);
    this.drawVectorPanel(this.qkvPanels.v, "value · V", v, this.activeHead);
    if (this.model) this.drawWeightHeatmap(this.qkvWeightCanvas, null, this.model.W.layers[l], "W_Q · W_K · W_V");
    this.updateProjectionWebs();
  };

  SceneRig.prototype.drawVectorPanel = function (panel, title, vec, head) {
    var c = panel.canvas, ctx = c.getContext("2d");
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(3,6,16,0.55)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    ctx.font = "600 20px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#e9f3ff";
    ctx.fillText(title, 14, 28);
    ctx.font = "14px 'SF Mono', monospace";
    ctx.fillStyle = "rgba(233,243,255,0.55)";
    ctx.fillText("head " + (head + 1) + " · 32 dims", 14, 48);
    var n = 32, base = head * 32;
    var max = 1e-6;
    for (var i = 0; i < n; i++) max = Math.max(max, Math.abs(vec[base + i]));
    var bw = (w - 28) / n;
    for (var j = 0; j < n; j++) {
      var val = vec[base + j] / max;
      var bh = Math.abs(val) * 82;
      var x = 14 + j * bw;
      var y = 142 - bh / 2;
      ctx.fillStyle = val >= 0 ? panel.material.map ? "rgba(95,243,255,0.92)" : "rgba(95,243,255,0.92)" : "rgba(255,79,216,0.92)";
      ctx.fillRect(x, y, Math.max(1, bw - 1.4), bh);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath(); ctx.moveTo(14, 142); ctx.lineTo(w - 14, 142); ctx.stroke();
    panel.texture.needsUpdate = true;
  };

  SceneRig.prototype.drawWeightHeatmap = function (canvas, _unused, layer, title) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(3,6,16,0.72)";
    ctx.fillRect(0, 0, w, h);
    var W = layer.wq;
    var cols = D, rows = D;
    var cell = Math.max(1, w / cols);
    var max = 1e-6;
    for (var i = 0; i < rows; i++) for (var j = 0; j < cols; j++) max = Math.max(max, Math.abs(W[i * D + j]));
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var v = W[r * D + c] / max;
        var heat = Math.pow(Math.abs(v), 0.6);
        var col = U.heatColor(v >= 0 ? 0.35 + heat * 0.65 : 0.25 - heat * 0.2);
        ctx.fillStyle = "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")";
        ctx.fillRect(c * cell, r * (h / rows), cell, Math.max(1, h / rows));
      }
    }
    ctx.fillStyle = "rgba(3,6,16,0.72)";
    ctx.fillRect(0, 0, w, 44);
    ctx.font = "600 20px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#e9f3ff";
    ctx.fillText(title, 14, 28);
    ctx.font = "14px 'SF Mono', monospace";
    ctx.fillStyle = "rgba(233,243,255,0.6)";
    ctx.fillText("layer " + (this.currentLayer + 1) + " · 128 × 128 · Q/K/V weights", 14, 46);
    canvas._texture && (canvas._texture.needsUpdate = true);
    this.qkvWeightTexture.needsUpdate = true;
  };

  /* ── FFN update ────────────────────────────────────────────────────── */

  SceneRig.prototype.updateFFN = function () {
    if (!this.trace) return;
    var l = this.currentLayer, p = this.player;
    var layer = this.trace.layers[l];
    var wl = this.model ? this.model.W.layers[l] : null;
    if (wl) {
      var max1 = 1e-6, max2 = 1e-6;
      for (var wi = 0; wi < wl.w1.length; wi++) max1 = Math.max(max1, Math.abs(wl.w1[wi]));
      for (var wj = 0; wj < wl.w2.length; wj++) max2 = Math.max(max2, Math.abs(wl.w2[wj]));
      this.updateFFNWebPoints(this.ffnW1Points, wl.w1, CFG.dFf, CFG.dModel, max1);
      this.updateFFNWebPoints(this.ffnW2Points, wl.w2, CFG.dModel, CFG.dFf, max2);
      this.updateFFNWebTop(this.ffnW1Top, wl.w1, CFG.dFf, CFG.dModel, max1);
      this.updateFFNWebTop(this.ffnW2Top, wl.w2, CFG.dModel, CFG.dFf, max2);
      // input ring = LN(x_mid), output ring = y
      var ic = this.inputRing.geometry.attributes.color.array;
      var oc = this.outputRing.geometry.attributes.color.array;
      var maxI = 1e-6, maxO = 1e-6;
      for (var di = 0; di < CFG.dModel; di++) {
        maxI = Math.max(maxI, Math.abs(layer.ln2[p * CFG.dModel + di]));
        maxO = Math.max(maxO, Math.abs(layer.ffnOut[p * CFG.dModel + di]));
      }
      for (var dj = 0; dj < CFG.dModel; dj++) {
        var vI = layer.ln2[p * CFG.dModel + dj] / maxI;
        var vO = layer.ffnOut[p * CFG.dModel + dj] / maxO;
        var ci = vI >= 0 ? [0.37, 0.95, 1.0] : [1.0, 0.31, 0.85];
        var co = vO >= 0 ? [1.0, 0.85, 0.35] : [0.55, 0.43, 1.0];
        ic[dj * 3] = ci[0] * (0.25 + Math.abs(vI) * 0.75); ic[dj * 3 + 1] = ci[1] * (0.25 + Math.abs(vI) * 0.75); ic[dj * 3 + 2] = ci[2] * (0.25 + Math.abs(vI) * 0.75);
        oc[dj * 3] = co[0] * (0.25 + Math.abs(vO) * 0.75); oc[dj * 3 + 1] = co[1] * (0.25 + Math.abs(vO) * 0.75); oc[dj * 3 + 2] = co[2] * (0.25 + Math.abs(vO) * 0.75);
      }
      this.inputRing.geometry.attributes.color.needsUpdate = true;
      this.outputRing.geometry.attributes.color.needsUpdate = true;
    }
    var act = layer.gelu;
    var off = p * CFG.dFf;
    var max = 1e-6;
    for (var i = 0; i < CFG.dFf; i++) max = Math.max(max, act[off + i]);
    var colors = this.neurons.instanceColor.array;
    for (var j = 0; j < CFG.dFf; j++) {
      var a = act[off + j] / max;
      var c = U.heatColor(0.15 + 0.85 * a);
      colors[j * 3] = c[0] / 255;
      colors[j * 3 + 1] = c[1] / 255;
      colors[j * 3 + 2] = c[2] / 255;
    }
    this.neurons.instanceColor.needsUpdate = true;
    this.neurons.material.opacity = 0.9;

    if (this.model) {
      var wl = this.model.W.layers[l];
      this.drawFFNWeight(this.ffnWeightCanvasA, wl.w1, CFG.dFf, D, "W₁ · 512 × 128");
      this.drawFFNWeight(this.ffnWeightCanvasB, wl.w2, D, CFG.dFf, "W₂ · 128 × 512");
    }
    this.ffnWeightTexA.needsUpdate = true;
    this.ffnWeightTexB.needsUpdate = true;
    this.drawGELU(layer, p);
    this.geluTexture.needsUpdate = true;
    this.updateFFNLines(layer, p);
  };

  SceneRig.prototype.drawFFNWeight = function (canvas, W, rows, cols, title) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(3,6,16,0.72)";
    ctx.fillRect(0, 0, w, h);
    var max = 1e-6;
    for (var i = 0; i < W.length; i++) max = Math.max(max, Math.abs(W[i]));
    var cw = w / cols, chh = h / rows;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var v = W[r * cols + c] / max;
        var col = U.heatColor(v >= 0 ? 0.45 + Math.pow(v, 0.7) * 0.55 : 0.2 + Math.pow(-v, 0.7) * 0.3);
        ctx.fillStyle = "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")";
        ctx.fillRect(c * cw, r * chh, Math.max(1, cw), Math.max(1, chh));
      }
    }
    ctx.fillStyle = "rgba(3,6,16,0.72)";
    ctx.fillRect(0, 0, w, 44);
    ctx.font = "600 19px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#e9f3ff";
    ctx.fillText(title, 14, 28);
    ctx.font = "14px 'SF Mono', monospace";
    ctx.fillStyle = "rgba(233,243,255,0.6)";
    ctx.fillText("layer " + (this.currentLayer + 1) + " · actual seeded weights", 14, 46);
  };

  SceneRig.prototype.drawGELU = function (layer, p) {
    var c = this.geluCanvas, ctx = c.getContext("2d");
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(3,6,16,0.72)";
    ctx.fillRect(0, 0, w, h);
    var xmin = -4, xmax = 4, ymin = -1.2, ymax = 4.2;
    function px(x) { return 34 + ((x - xmin) / (xmax - xmin)) * (w - 60); }
    function py(y) { return h - 28 - ((y - ymin) / (ymax - ymin)) * (h - 56); }
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath(); ctx.moveTo(px(0), py(ymin)); ctx.lineTo(px(0), py(ymax)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px(xmin), py(0)); ctx.lineTo(px(xmax), py(0)); ctx.stroke();
    ctx.strokeStyle = "rgba(95,243,255,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 180; i++) {
      var x = xmin + (i / 180) * (xmax - xmin);
      var y = U.gelu(x);
      if (i === 0) ctx.moveTo(px(x), py(y)); else ctx.lineTo(px(x), py(y));
    }
    ctx.stroke();
    ctx.font = "600 18px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#e9f3ff";
    ctx.fillText("GELU · the soft gate", 14, 26);
    ctx.font = "13px 'SF Mono', monospace";
    ctx.fillStyle = "rgba(233,243,255,0.55)";
    ctx.fillText("512 neurons · layer " + (this.currentLayer + 1), 14, 44);
    var off = p * CFG.dFf;
    for (var j = 0; j < CFG.dFf; j++) {
      var pre = layer.hidden[off + j];
      var post = layer.gelu[off + j];
      if (pre < xmin || pre > xmax) continue;
      var a = post / 4.0;
      ctx.fillStyle = "rgba(255,200,87," + (0.15 + Math.min(0.8, a)) + ")";
      ctx.fillRect(px(pre) - 1, py(post) - 1, 2.2, 2.2);
    }
  };

  SceneRig.prototype.updateFFNLines = function (layer, p) {
    var n = CFG.dFf, off = p * n;
    var idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    idx.sort(function (a, b) { return layer.gelu[off + b] - layer.gelu[off + a]; });
    var pos = this.ffnLines.geometry.attributes.position.array;
    var col = this.ffnLines.geometry.attributes.color.array;
    for (var k = 0; k < 48; k++) {
      var ni = idx[k];
      var np = this.neuronPositions[ni];
      var a = Math.min(1, layer.gelu[off + ni] / 2.5);
      var c = new THREE.Color(0xffc857).lerp(new THREE.Color(0x5ff3ff), 1 - a);
      var base = k * 4 * 3;
      // input -> neuron
      pos[base] = 0; pos[base + 1] = -4.4; pos[base + 2] = 0;
      pos[base + 3] = np.x; pos[base + 4] = np.y; pos[base + 5] = np.z;
      // neuron -> output
      pos[base + 6] = np.x; pos[base + 7] = np.y; pos[base + 8] = np.z;
      pos[base + 9] = 0; pos[base + 10] = 4.4; pos[base + 11] = 0;
      for (var q = 0; q < 4; q++) {
        col[base + q * 3] = c.r * a;
        col[base + q * 3 + 1] = c.g * a;
        col[base + q * 3 + 2] = c.b * a;
      }
    }
    this.ffnLines.geometry.attributes.position.needsUpdate = true;
    this.ffnLines.geometry.attributes.color.needsUpdate = true;
  };

  /* ── sky update ────────────────────────────────────────────────────── */

  SceneRig.prototype.updateUnembeddingWeb = function (trace) {
    if (!trace || !this.model || !this.unembedPoints) return;
    var E = this.model.W.E;
    var V = TEGO.DATA.vocab.length, Dm = this.model.dModel;
    var ln = trace.final.ln;
    var scale = trace.final.logitScale || 0.9;
    var contrib = new Float32Array(V * Dm);
    var maxAbs = 1e-6;
    for (var v = 0; v < V; v++) {
      for (var d = 0; d < Dm; d++) {
        var c = E[v * Dm + d] * ln[d] * scale;
        contrib[v * Dm + d] = c;
        if (Math.abs(c) > maxAbs) maxAbs = Math.abs(c);
      }
    }
    this.updateWebPoints(this.unembedPoints, contrib, maxAbs);
    this.updateWebTop(this.unembedTop, contrib, maxAbs);
    this.updateNodeRing(this.unembedRing, ln, [1, 1, 1], [0.45, 0.8, 1.0], undefined);
  };

  SceneRig.prototype.updateSky = function (probs) {
    if (!probs || !this.skyStars) return;
    if (probs.final) probs = probs.final.probs;
    this._lastProbs = probs;
    var n = Math.min(probs.length, TEGO.DATA.vocab.length);
    var top = U.topK(probs, 14);
    var max = top[0] ? top[0].value : 1;
    var col = this.skyStars.geometry.attributes.aColor.array;
    var size = this.skyStars.geometry.attributes.aSize.array;
    for (var i = 0; i < n; i++) {
      var p = probs[i] / max;
      var c = new THREE.Color(0x5c6f9a).lerp(new THREE.Color(0xffe7b0), Math.pow(p, 0.6));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      size[i] = 1.0 + Math.pow(p, 0.5) * 7.5;
    }
    this.skyStars.geometry.attributes.aColor.needsUpdate = true;
    this.skyStars.geometry.attributes.aSize.needsUpdate = true;
    for (var k = 0; k < this.skyLabelPool.length; k++) {
      var sp = this.skyLabelPool[k];
      if (k < top.length) {
        var tok = top[k];
        var name = TEGO.DATA.vocab[tok.index];
        var lab = U.makeLabel(name + "  " + (tok.value * 100).toFixed(1) + "%", {
          color: k === 0 ? "#fff3c4" : "#cfe4ff", size: 40,
          glowColor: k === 0 ? "#ffc857" : "#5ff3ff",
        });
        var oldMap = sp.material.map;
        sp.material.map = lab.texture;
        sp.material.needsUpdate = true;
        if (oldMap) oldMap.dispose();
        var aspect = lab.width / lab.height;
        var s = k === 0 ? 0.95 : 0.62;
        sp.scale.set(aspect * s, s, 1);
        var pos = this.skyStarPositions[tok.index];
        sp.position.set(pos.x * 1.06, pos.y + 0.7, pos.z * 1.06);
        sp.visible = true;
        sp.material.opacity = k === 0 ? 1 : 0.78;
      } else {
        sp.visible = false;
      }
    }
    if (top.length) {
      var tp = this.skyStarPositions[top[0].index];
      this.finalBeam.geometry.dispose();
      this.finalBeam.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -9, 0), new THREE.Vector3(tp.x, tp.y, tp.z),
      ]);
      this.topStar.position.copy(tp);
      this.topStar.visible = true;
    }
    this.skyTop = top;
  };

  /* ── stage / camera ────────────────────────────────────────────────── */

  SceneRig.prototype.setStage = function (stage, layer, phase, phaseT) {
    this.stage = stage;
    this.phase = phase;
    this.phaseT = phaseT || 0;
    if (layer !== undefined && layer !== null) this.setLayer(layer);
    this.setCollarTargetForPhase(stage, layer, phase);
    this.updateCollar();
    var isEmbed = stage === "embed_matrix" || stage === "embed_space" || stage === "embed_position";
    this.tokenLine.visible = stage === "tokenize";
    this.embeddingWall.visible = stage === "embed_matrix";
    this.embedGroup.visible = stage === "embed_space" || stage === "embed_position";
    this.playerCore.visible = stage === "embed_space" || stage === "embed_position" || (stage === "layer" && (phase === "ffn" || phase === "ffn_w1" || phase === "ffn_gelu" || phase === "ffn_w2"));
    this.skyGroup.visible = stage === "final" || stage === "epilogue";
    this.ffn.visible = stage === "layer" && (phase === "ffn" || phase === "ffn_w1" || phase === "ffn_gelu" || phase === "ffn_w2");
    if (this.ffnShell) this.ffnShell.visible = !this.overview;
    this.qkvGroup.visible = stage === "layer" && (phase === "qkv");
    this.projGroup.visible = stage === "layer" && (phase === "qkv");
    this.outGroup.visible = stage === "layer" && (phase === "write");
    this.qGlyph.visible = stage === "layer" && (phase === "qkv" || phase === "attn" || phase === "mix");
    this.lensGroup.visible = stage === "layer" && (phase === "ln1" || phase === "qkv");
    this.curtain.visible = stage === "layer" && (phase === "attn" || phase === "mix" || phase === "scores" || phase === "mask" || phase === "softmax");
    if (this.splitGroup) this.splitGroup.visible = stage === "layer" && (phase === "qkv" || phase === "attn" || phase === "mix" || phase === "scores" || phase === "mask" || phase === "softmax");
    if (this.residualLabel) this.residualLabel.visible = stage === "layer";
    if (this.attentionLabel) this.attentionLabel.visible = stage === "layer" && (phase === "attn" || phase === "mix" || phase === "scores" || phase === "mask" || phase === "softmax");
    if (this.causalLabel) this.causalLabel.visible = stage === "layer" && (phase === "attn" || phase === "mix" || phase === "scores" || phase === "mask" || phase === "softmax");
    this.beamRoot.visible = stage === "layer" && (phase === "attn" || phase === "mix" || phase === "write" || phase === "qkv");
    this.trail.visible = !isEmbed && stage !== "tokenize";
    this.tower.visible = !isEmbed && stage !== "tokenize";
    this.embedGroup.position.set(0, 0, 0);
    this.embedGroup.rotation.set(0, 0, 0);
    if (stage === "embed_space") this.updateEmbedVectors(this.trace, "E");
    if (stage === "embed_position") this.updateEmbedVectors(this.trace, "EPX");
    if (stage === "final") this.updateSky(this._lastProbs || (this.trace && this.trace.final.probs));
    if (stage === "tokenize") {
      this.cueCamera(new THREE.Vector3(0, 4.2, 14.5), new THREE.Vector3(0, 2.0, 0), 55);
    } else if (stage === "embed_matrix") {
      this.cueCamera(new THREE.Vector3(0, 8, 14.2), new THREE.Vector3(0, 8, 0), 58);
    } else if (stage === "embed_space" || stage === "embed_position") {
      this.cueCamera(new THREE.Vector3(0, 0.18, 0), this.embedLookTarget, 72);
    } else if (stage === "layer") {
      this.cueCameraForLayerPhase(layer, phase);
      if (phase === "ffn") this.updateFFN();
    } else if (stage === "final") {
      this.cueCamera(new THREE.Vector3(0, this.skyY + 4.2, 17), new THREE.Vector3(0, this.skyY + 8.5, 0), 58);
    } else if (stage === "epilogue") {
      this.cueCamera(new THREE.Vector3(0, 26, 46), new THREE.Vector3(0, 17, 0), 52);
    } else {
      this.cueCamera(new THREE.Vector3(0, 20, 45), new THREE.Vector3(0, 17, 0), 58);
    }
    if (this.overview && stage === "layer") this.applyOverview(stage, layer, phase);
  };

  SceneRig.prototype.applyOverview = function (stage, layer, phase) {
    var y = (layer === undefined || layer === null ? this.currentLayer : layer) * this.GAP;
    this.ffn.visible = true;
    this.ffnShell.visible = false;
    this.beamRoot.visible = true;
    this.curtain.visible = true;
    this.tower.visible = true;
    this.trail.visible = true;
    this.qkvGroup.visible = false;
    this.projGroup.visible = false;
    this.outGroup.visible = true;
    this.outGroup.visible = false;
    this.lensGroup.visible = false;
    this.qGlyph.visible = false;
    this.skyGroup.visible = false;
    if (this.residualLabel) this.residualLabel.visible = true;
    if (this.attentionLabel) this.attentionLabel.visible = true;
    if (this.causalLabel) this.causalLabel.visible = true;
    this.updateFFN();
    this.cueCamera(new THREE.Vector3(this.R + 5.5, y + 6.0, 0.1), new THREE.Vector3(0, y + 0.4, 0), 60);
  };

  SceneRig.prototype.setOverview = function (on) {
    this.overview = !!on;
    if (on) this.applyOverview(this.stage, this.currentLayer, this.phase);
    else {
      this.ffnShell.visible = true;
      this.setStage(this.stage, this.currentLayer, this.phase, this.phaseT);
    }
  };

  SceneRig.prototype.positionEmbedCamera = function () {
    this.tokenLine.visible = false;
  };

  SceneRig.prototype.cueCameraForLayerPhase = function (l, phase) {
    l = l === undefined ? this.currentLayer : l;
    var y = l * this.GAP;
    var playerPos = new THREE.Vector3(Math.cos(0) * this.R, y, Math.sin(0) * this.R);
    var radial = new THREE.Vector3(playerPos.x, 0, playerPos.z).normalize();
    var center = new THREE.Vector3(0, y + 0.35, 0);
    if (phase === "ln1") {
      this.cueCamera(playerPos.clone().add(radial.clone().multiplyScalar(2.0)).add(new THREE.Vector3(0, 0.85, 0)), center, 62);
    } else if (phase === "qkv") {
      this.cueCamera(playerPos.clone().add(radial.clone().multiplyScalar(3.9)).add(new THREE.Vector3(0, 1.55, 0)), playerPos.clone().add(new THREE.Vector3(0, 0.55, 0)), 60);
    } else if (phase === "attn") {
      var mid = new THREE.Vector3(0, y + 0.25, 0);
      var pastCount = this.player;
      if (pastCount > 0) {
        var aMid = (-pastCount / 2) * this.delta;
        mid.set(Math.cos(aMid) * this.R, y + 0.25, Math.sin(aMid) * this.R);
      }
      this.cueCamera(playerPos.clone().add(radial.clone().multiplyScalar(2.6)).add(new THREE.Vector3(0, 1.1, 0)), mid, 60);
    } else if (phase === "mix") {
      this.cueCamera(playerPos.clone().add(radial.clone().multiplyScalar(2.3)).add(new THREE.Vector3(0, 0.85, 0)), playerPos.clone().add(new THREE.Vector3(0, 0.2, 0)), 60);
    } else if (phase === "write") {
      this.cueCamera(playerPos.clone().add(radial.clone().multiplyScalar(2.1)).add(new THREE.Vector3(0, 0.9, 0)), center, 62);
    } else if (phase === "ffn") {
      this.cueCamera(new THREE.Vector3(0, y - 4.2, 0.15), new THREE.Vector3(0, y + 4.2, 0), 72);
    } else if (phase === "write2") {
      var nextY = Math.min(this.topY, y + this.GAP);
      this.cueCamera(new THREE.Vector3(Math.cos(0) * (this.R + 2.2), nextY + 0.9, Math.sin(0) * (this.R + 2.2)), new THREE.Vector3(0, nextY + 0.4, 0), 60);
    } else {
      this.cueCamera(playerPos.clone().add(radial.clone().multiplyScalar(2.2)).add(new THREE.Vector3(0, 0.9, 0)), center, 60);
    }
  };

  SceneRig.prototype.cueCamera = function (pos, target, fov) {
    this.cameraGoalPos.copy(pos || this.cameraGoalPos);
    this.cameraGoalTarget.copy(target || this.cameraGoalTarget);
    this.cameraGoalFov = fov === undefined ? this.cameraGoalFov : fov;
    this.userYaw = 0;
    this.userPitch = 0;
    this.dragYaw = 0;
    this.dragPitch = 0;
  };

  SceneRig.prototype.snapCamera = function () {
    this.cameraPos.copy(this.cameraGoalPos);
    this.cameraTarget.copy(this.cameraGoalTarget);
    this.cameraFov = this.cameraGoalFov;
  };

  SceneRig.prototype.drag = function (dx, dy) {
    this.userYawTarget = (this.userYawTarget || 0) - dx * 0.0045;
    this.userPitchTarget = U.clamp((this.userPitchTarget || 0) - dy * 0.0045, -1.15, 1.15);
    if (this.stage === "intro") this.introAngle += dx * 0.0025;
  };

  SceneRig.prototype.wheel = function (delta) {
    this.zoom = U.clamp(this.zoom + delta * 0.0008, -0.35, 0.35);
  };

  /* ── picking ───────────────────────────────────────────────────────── */

  SceneRig.prototype.setSkyProbs = function (probs) {
    this.updateSky(probs);
  };

  SceneRig.prototype.pickToken = function (clientX, clientY) {
    if (!this.trace || this.stage !== "layer") return null;
    var rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    var layerGroup = this.tokenLayers[this.currentLayer];
    if (!layerGroup) return null;
    var picks = [];
    for (var i = 0; i < layerGroup.userData.tokens.length; i++) picks.push(layerGroup.userData.tokens[i].userData.pick);
    var hits = this.raycaster.intersectObjects(picks, false);
    if (hits.length) return { index: hits[0].object.userData.tokenIndex, layer: hits[0].object.userData.layer };
    return null;
  };

  SceneRig.prototype.pickSky = function (clientX, clientY) {
    if (!this.trace || !this.skyTop || (this.stage !== "final" && this.stage !== "epilogue")) return null;
    var rect = this.canvas.getBoundingClientRect();
    var x = clientX - rect.left, y = clientY - rect.top;
    var best = null, bestD = 60;
    for (var i = 0; i < Math.min(this.skyTop.length, 14); i++) {
      var t = this.skyTop[i];
      var p = this.skyStarPositions[t.index].clone();
      this.skyStars.localToWorld(p);
      p.project(this.camera);
      var sx = (p.x * 0.5 + 0.5) * rect.width;
      var sy = (-p.y * 0.5 + 0.5) * rect.height;
      var d = Math.hypot(sx - x, sy - y);
      if (d < bestD) { bestD = d; best = { index: t.index, token: TEGO.DATA.vocab[t.index], prob: t.value, rank: i }; }
    }
    return best;
  };

  /* ── update / render ───────────────────────────────────────────────── */

  SceneRig.prototype.update = function (dt, state) {
    this.time += dt;
    var t = this.time;
    this.phaseT = state && state.phaseT !== undefined ? state.phaseT : this.phaseT;

    for (var i = 0; i < this.timeMaterials.length; i++) {
      var m = this.timeMaterials[i];
      if (m.uniforms && m.uniforms.uTime) m.uniforms.uTime.value = t;
    }
    if (this.stars) this.stars.material.uniforms.uTime.value = t;
    if (this.bg) this.bg.material.uniforms.uTime.value = t;
    if (this.embedPoints) this.embedPoints.material.uniforms.uTime.value = t;
    if (this.skyStars) this.skyStars.material.uniforms.uTime.value = t;
    if (this.postPass) this.postPass.uniforms.uTime.value = t;

    // Camera.
    var lambda = this.zoom > 0.34 ? 2.5 : 3.2;
    this.cameraPos.lerp(this.cameraGoalPos, 1 - Math.exp(-lambda * dt));
    this.cameraTarget.lerp(this.cameraGoalTarget, 1 - Math.exp(-lambda * dt));
    this.cameraFov += (this.cameraGoalFov - this.cameraFov) * (1 - Math.exp(-3.3 * dt));
    this.userYaw = U.damp(this.userYaw, this.userYawTarget || 0, 8, dt);
    this.userPitch = U.damp(this.userPitch, this.userPitchTarget || 0, 8, dt);

    if (this.stage === "intro" && !this.orbit) {
      this.introAngle += dt * 0.085;
      var a = this.introAngle;
      this.camera.position.set(Math.cos(a) * 35, 19 + Math.sin(a * 0.7) * 2.6, Math.sin(a) * 35);
      this.camera.lookAt(0, 16.5, 0);
      this.camera.fov = 55;
      this.camera.updateProjectionMatrix();
    } else if (this.orbit) {
      var az = this.orbitAzimuth + (this.userYawTarget || 0);
      var el = U.clamp(this.orbitElevation + (this.userPitchTarget || 0), 0.06, 1.3);
      var dist = this.orbitDistance * (1 - this.zoom);
      var target = this.cameraTarget;
      this.camera.position.set(
        target.x + Math.cos(az) * Math.cos(el) * dist,
        target.y + Math.sin(el) * dist,
        target.z + Math.sin(az) * Math.cos(el) * dist
      );
      this.camera.lookAt(target);
      this.camera.fov = this.cameraFov;
      this.camera.updateProjectionMatrix();
    } else {
      var dir = new THREE.Vector3().subVectors(this.cameraTarget, this.cameraPos).normalize();
      var up = new THREE.Vector3(0, 1, 0);
      dir.applyAxisAngle(up, this.userYaw);
      var right = new THREE.Vector3().crossVectors(dir, up).normalize();
      dir.applyAxisAngle(right, this.userPitch);
      var fov = this.cameraFov * (1 - this.zoom * 0.22);
      this.camera.position.copy(this.cameraPos);
      this.camera.lookAt(this.cameraPos.clone().add(dir));
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    // When inside the FFN, the camera is the vector travelling through it.
    if (!this.overview && !this.orbit && this.stage === "layer" && (this.phase === "ffn" || this.phase === "ffn_w1" || this.phase === "ffn_gelu" || this.phase === "ffn_w2")) {
      var yy = this.currentLayer * this.GAP;
      var tp = U.clamp(this.phaseT, 0, 1);
      this.cameraGoalPos.set(0, yy - 4.65 + tp * 9.3, 0.18);
      this.cameraGoalTarget.set(0, yy - 4.65 + tp * 9.3 + 1.5, 0);
      this.cameraGoalFov = 78;
    }

    // Stage-specific animation.
    if (this.embedGroup && this.embedGroup.visible) {
      var ego = this.stage === "embed_space" || this.stage === "embed_position";
      this.embedGroup.rotation.y = ego ? 0 : t * 0.055;
      this.embedCage.rotation.x = t * (ego ? 0.008 : 0.035);
      this.embedCage.rotation.z = -t * (ego ? 0.005 : 0.021);
      var es = 1 + Math.sin(t * 0.7) * (ego ? 0.0015 : 0.008);
      this.embedGroup.scale.setScalar(es);
    }
    if (this.collarReady && this.trace) {
      var changed = false;
      for (var cd = 0; cd < D; cd++) {
        var nv = U.damp(this.collarVec[cd], this.collarTarget[cd], 4.5, dt);
        if (Math.abs(nv - this.collarVec[cd]) > 1e-5) changed = true;
        this.collarVec[cd] = nv;
      }
      if (changed) this.updateCollar();
    }
    if (this.splitGroup && this.splitGroup.visible) {
      this.splitGroup.rotation.y = Math.sin(t * 0.8) * 0.06;
      for (var sp2 = 0; sp2 < this.splitParts.length; sp2++) {
        this.splitParts[sp2].position.y += Math.sin(t * 1.8 + sp2 * 2.0) * 0.0006;
      }
    }
    if (this.playerCore && this.playerCore.visible) {
      this.playerCore.position.y = -0.32 + Math.sin(t * 1.7) * 0.012;
      this.playerCoreHalo.material.opacity = 0.68 + 0.20 * Math.sin(t * 2.1);
    }
    if (this.ffn.visible) {
      var y = this.currentLayer * this.GAP;
      this.ffn.position.y = y;
      this.ffnGrid.rotation.y = t * 0.05;
      this.ffnGrid.rotation.x = t * 0.02;
      this.inputRing.rotation.y = -t * 0.4;
      this.outputRing.rotation.y = t * 0.4;
      this.geluPlane.lookAt(this.camera.position);
      this.ffnWeightPlaneA.lookAt(this.camera.position);
      this.ffnWeightPlaneB.lookAt(this.camera.position);
    }
    if (this.skyGroup && this.skyGroup.visible) {
      this.skyGroup.rotation.y = Math.sin(t * 0.04) * 0.08;
      if (this.topStar) this.topStar.material.opacity = 0.65 + 0.35 * Math.sin(t * 2.1);
    }
    if (this.stage === "layer") {
      var lp = this.tokenLayers[this.currentLayer];
      if (lp) {
        for (var ti = 0; ti < lp.userData.tokens.length; ti++) {
          var tk = lp.userData.tokens[ti];
          var isP = tk.userData.role === "player";
          if (!isP) continue;
          var pulse = 1 + Math.sin(t * 2.4) * 0.045;
          tk.userData.crystal.scale.setScalar((1.05 * (0.92 + Math.min(0.7, tk.userData.vnorm / 45))) * pulse);
        }
      }
      if (this.lensGroup.visible) {
        this.lensGroup.rotation.z = t * 0.16;
      }
      if (this.beamRoot.visible) {
        for (var bi = 0; bi < this.beamMeshes.length; bi++) {
          var bm = this.beamMeshes[bi];
          if (bm.material.uniforms) bm.material.uniforms.uTime.value = t;
        }
        for (var bp = 0; bp < this.beamParticles.length; bp++) {
          var pp2 = this.beamParticles[bp];
          var ttt = (t * pp2.speed + pp2.offset) % 1;
          if (ttt < 0) ttt += 1;
          var pos2 = pp2.curve.getPointAt(ttt);
          pp2.sprite.position.set(pos2.x, pos2.y + pp2.y, pos2.z);
        }
      }
    }

    // Drift the background stars very slowly.
    if (this.stars) this.stars.rotation.y = t * 0.002;

    // Post-processing.
    var breathe = this.stage === "final" || this.stage === "epilogue" ? 1.15 : 1.0;
    this.bloomPass.strength = 0.95 * breathe;
    this.bloomPass.radius = 0.62;
    this.bloomPass.threshold = 0.12;
  };

  SceneRig.prototype.render = function () {
    this.composer.render();
  };

  SceneRig.prototype.resize = function () {
    var w = root.innerWidth || 1280, h = root.innerHeight || 720;
    this.size.set(w, h);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.composer.setPixelRatio(this.pixelRatio);
    this.composer.setSize(w, h);
    this.bloomPass.resolution.set(w, h);
    this.postPass.uniforms.uResolution.value.set(w, h);
    if (this.stars) this.stars.material.uniforms.uPixelRatio.value = this.pixelRatio;
    if (this.embedPoints) this.embedPoints.material.uniforms.uPixelRatio.value = this.pixelRatio;
    if (this.skyStars) this.skyStars.material.uniforms.uPixelRatio.value = this.pixelRatio;
  };

  SceneRig.prototype.setOrbit = function (on) {
    this.orbit = !!on;
    if (this.orbit) {
      this.orbitAzimuth = 0.6;
      this.orbitElevation = 0.35;
      this.orbitDistance = 26;
    }
  };

  SceneRig.prototype.setQuality = function (name) {
    var q = TEGO.QUALITY[name] || TEGO.QUALITY.high;
    this.pixelRatio = Math.min(root.devicePixelRatio || 1, q.pixelRatio);
    this.bloomPass.enabled = q.bloom;
    this.resize();
  };

  TEGO.SceneRig = SceneRig;
})(typeof globalThis !== "undefined" ? globalThis : this);
