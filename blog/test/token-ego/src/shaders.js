/* TOKEN / EGO — GLSL materials and the post-processing pass. */
(function (root) {
  "use strict";
  var TEGO = (root.TEGO = root.TEGO || {});
  var S = {};

  S.bgVert = [
    "varying vec3 vDir;",
    "void main() {",
    "  vDir = normalize(position);",
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
    "  gl_Position = projectionMatrix * mv;",
    "}",
  ].join("\n");

  S.bgFrag = [
    "precision highp float;",
    "varying vec3 vDir;",
    "uniform float uTime;",
    "uniform float uIntensity;",
    "uniform vec3 uA;",
    "uniform vec3 uB;",
    "uniform vec3 uC;",
    "float hash(vec3 p) {",
    "  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));",
    "  p *= 17.0;",
    "  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));",
    "}",
    "float noise(vec3 p) {",
    "  vec3 i = floor(p), f = fract(p);",
    "  f = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),",
    "                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),",
    "             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),",
    "                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);",
    "}",
    "float fbm(vec3 p) {",
    "  float v = 0.0, a = 0.55;",
    "  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec3(7.1, 3.7, 1.3); a *= 0.5; }",
    "  return v;",
    "}",
    "void main() {",
    "  vec3 d = normalize(vDir);",
    "  float t = uTime * 0.018;",
    "  float n1 = fbm(d * 2.6 + vec3(t, -t * 0.7, t * 0.4));",
    "  float n2 = fbm(d * 5.1 - vec3(t * 0.5, t * 0.3, -t * 0.6));",
    "  float band = smoothstep(0.15, 0.95, 0.5 + 0.5 * sin(d.y * 5.0 + n1 * 3.0 + t));",
    "  vec3 col = mix(vec3(0.008, 0.012, 0.032), uA, smoothstep(0.35, 0.95, n1));",
    "  col = mix(col, uB, smoothstep(0.45, 0.95, n2) * 0.55);",
    "  col += uC * band * 0.18;",
    "  float vign = smoothstep(1.0, 0.15, length(d.xy));",
    "  gl_FragColor = vec4(col * uIntensity * vign, 1.0);",
    "}",
  ].join("\n");

  S.starVert = [
    "attribute float aSize;",
    "attribute float aPhase;",
    "attribute vec3 aColor;",
    "uniform float uTime;",
    "uniform float uPixelRatio;",
    "uniform float uScale;",
    "varying vec3 vColor;",
    "varying float vAlpha;",
    "void main() {",
    "  vColor = aColor;",
    "  float tw = 0.62 + 0.38 * sin(uTime * 1.4 + aPhase * 6.283);",
    "  vAlpha = tw;",
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
    "  gl_PointSize = aSize * uPixelRatio * uScale / max(1.0, -mv.z);",
    "  gl_Position = projectionMatrix * mv;",
    "}",
  ].join("\n");

  S.starFrag = [
    "precision highp float;",
    "varying vec3 vColor;",
    "varying float vAlpha;",
    "void main() {",
    "  vec2 p = gl_PointCoord - 0.5;",
    "  float d = length(p);",
    "  float core = smoothstep(0.5, 0.0, d);",
    "  float halo = smoothstep(0.5, 0.1, d) * 0.45;",
    "  float a = (core + halo) * vAlpha;",
    "  if (a < 0.01) discard;",
    "  gl_FragColor = vec4(vColor * (1.2 + core * 1.6), a);",
    "}",
  ].join("\n");

  S.crystalVert = [
    "varying vec3 vN;",
    "varying vec3 vV;",
    "varying vec3 vP;",
    "void main() {",
    "  vN = normalize(normalMatrix * normal);",
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
    "  vV = normalize(-mv.xyz);",
    "  vP = position;",
    "  gl_Position = projectionMatrix * mv;",
    "}",
  ].join("\n");

  S.crystalFrag = [
    "precision highp float;",
    "varying vec3 vN;",
    "varying vec3 vV;",
    "varying vec3 vP;",
    "uniform vec3 uColor;",
    "uniform vec3 uRim;",
    "uniform float uTime;",
    "uniform float uIntensity;",
    "uniform float uPlayer;",
    "void main() {",
    "  vec3 n = normalize(vN);",
    "  float fres = pow(1.0 - clamp(dot(n, normalize(vV)), 0.0, 1.0), 2.2);",
    "  float facet = 0.5 + 0.5 * sin(vP.x * 22.0 + vP.y * 17.0 + vP.z * 19.0 + uTime * 2.0);",
    "  float pulse = 0.75 + 0.25 * sin(uTime * 3.0 + vP.y * 4.0);",
    "  vec3 col = uColor * (0.45 + fres * 1.9 + facet * 0.16) + uRim * fres * 1.3;",
    "  col *= pulse * uIntensity;",
    "  col += uColor * uPlayer * 0.12;",
    "  float a = 0.55 + fres * 0.45;",
    "  gl_FragColor = vec4(col, a);",
    "}",
  ].join("\n");

  S.beamVert = [
    "varying vec2 vUv;",
    "varying vec3 vN;",
    "varying vec3 vV;",
    "void main() {",
    "  vUv = uv;",
    "  vN = normalize(normalMatrix * normal);",
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
    "  vV = normalize(-mv.xyz);",
    "  gl_Position = projectionMatrix * mv;",
    "}",
  ].join("\n");

  S.beamFrag = [
    "precision highp float;",
    "varying vec2 vUv;",
    "varying vec3 vN;",
    "varying vec3 vV;",
    "uniform vec3 uColor;",
    "uniform float uTime;",
    "uniform float uWeight;",
    "uniform float uOpacity;",
    "uniform float uSpeed;",
    "void main() {",
    "  float flow = fract(vUv.x * 2.0 - uTime * uSpeed);",
    "  float pulse = pow(flow, 5.0) + pow(1.0 - flow, 9.0) * 0.35;",
    "  float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.2);",
    "  float a = (0.08 + pulse * 0.9 + rim * 0.35) * uOpacity * (0.28 + uWeight * 1.15);",
    "  vec3 col = uColor * (0.7 + pulse * 2.4) + vec3(1.0) * pulse * 0.18;",
    "  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));",
    "}",
  ].join("\n");

  S.pillarVert = [
    "varying vec2 vUv;",
    "varying vec3 vN;",
    "varying vec3 vV;",
    "void main() {",
    "  vUv = uv;",
    "  vN = normalize(normalMatrix * normal);",
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
    "  vV = normalize(-mv.xyz);",
    "  gl_Position = projectionMatrix * mv;",
    "}",
  ].join("\n");

  S.pillarFrag = [
    "precision highp float;",
    "varying vec2 vUv;",
    "varying vec3 vN;",
    "varying vec3 vV;",
    "uniform float uTime;",
    "uniform float uIntensity;",
    "uniform vec3 uA;",
    "uniform vec3 uB;",
    "float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
    "float noise(vec2 p) {",
    "  vec2 i = floor(p), f = fract(p);",
    "  f = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);",
    "}",
    "void main() {",
    "  float y = vUv.y;",
    "  float n = noise(vec2(vUv.x * 18.0, y * 9.0 - uTime * 0.7));",
    "  float bands = 0.5 + 0.5 * sin(y * 38.0 - uTime * 1.6 + n * 2.5);",
    "  float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.4);",
    "  vec3 col = mix(uA, uB, smoothstep(0.0, 1.0, y));",
    "  col *= 0.38 + bands * 0.38 + n * 0.22 + rim * 0.8;",
    "  float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);",
    "  gl_FragColor = vec4(col * uIntensity, edge * (0.22 + rim * 0.45 + bands * 0.18));",
    "}",
  ].join("\n");

  S.ringVert = [
    "varying vec2 vUv;",
    "varying vec3 vPos;",
    "void main() {",
    "  vUv = uv;",
    "  vPos = position;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}",
  ].join("\n");

  S.ringFrag = [
    "precision highp float;",
    "varying vec2 vUv;",
    "varying vec3 vPos;",
    "uniform float uTime;",
    "uniform float uAlpha;",
    "uniform vec3 uColor;",
    "uniform float uRadius;",
    "void main() {",
    "  vec2 p = vPos.xz;",
    "  float r = length(p);",
    "  float a = atan(p.y, p.x);",
    "  float spokes = smoothstep(0.92, 1.0, abs(sin(a * 24.0))) * 0.25;",
    "  float rings = smoothstep(0.96, 1.0, abs(sin(r * 5.0 - uTime * 0.6))) * 0.18;",
    "  float edge = smoothstep(0.0, 0.10, vUv.y) * smoothstep(1.0, 0.88, vUv.y);",
    "  float glow = pow(1.0 - abs(r - uRadius * 0.54) / (uRadius * 0.55), 3.0);",
    "  vec3 col = uColor * (0.4 + spokes + rings + glow * 0.9);",
    "  float alpha = (0.08 + spokes + rings + glow * 0.28) * uAlpha * edge;",
    "  gl_FragColor = vec4(col, alpha);",
    "}",
  ].join("\n");

  S.curtainVert = [
    "varying vec2 vUv;",
    "void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  ].join("\n");

  S.curtainFrag = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform float uTime;",
    "uniform vec3 uColor;",
    "uniform float uOpacity;",
    "float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",
    "void main() {",
    "  float n = hash(floor(vec2(vUv.x * 80.0, vUv.y * 12.0 + uTime * 0.4)));",
    "  float lines = smoothstep(0.9, 1.0, abs(sin(vUv.x * 90.0 + uTime * 0.8))) * 0.25;",
    "  float a = (0.025 + n * 0.035 + lines) * uOpacity;",
    "  gl_FragColor = vec4(uColor * (0.7 + lines * 2.0), a);",
    "}",
  ].join("\n");

  S.lensVert = [
    "varying vec2 vUv;",
    "void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  ].join("\n");

  S.lensFrag = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform float uTime;",
    "uniform vec3 uColor;",
    "uniform float uOpacity;",
    "void main() {",
    "  vec2 p = vUv * 2.0 - 1.0;",
    "  float r = length(p);",
    "  float ring1 = smoothstep(0.05, 0.0, abs(r - 0.72));",
    "  float ring2 = smoothstep(0.03, 0.0, abs(r - 0.48));",
    "  float ring3 = smoothstep(0.02, 0.0, abs(r - 0.22));",
    "  float spokes = smoothstep(0.96, 1.0, abs(sin(atan(p.y, p.x) * 12.0 + uTime))) * 0.22;",
    "  float a = (ring1 * 0.9 + ring2 * 0.6 + ring3 * 0.4 + spokes) * uOpacity;",
    "  vec3 col = uColor * (1.2 + ring1 * 2.0 + ring2);",
    "  gl_FragColor = vec4(col, a);",
    "}",
  ].join("\n");

  S.neuronVert = S.lensVert;
  S.neuronFrag = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform float uTime;",
    "uniform vec3 uColor;",
    "uniform float uActivation;",
    "void main() {",
    "  vec2 p = vUv * 2.0 - 1.0;",
    "  float d = length(p);",
    "  float core = smoothstep(0.5, 0.0, d);",
    "  float ring = smoothstep(0.55, 0.42, d) * 0.4;",
    "  float a = (core + ring) * (0.15 + uActivation);",
    "  gl_FragColor = vec4(uColor * (1.0 + uActivation * 2.5), a);",
    "}",
  ].join("\n");

  S.glyphVert = [
    "varying vec2 vUv;",
    "void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  ].join("\n");

  S.glyphFrag = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform sampler2D uMap;",
    "uniform vec3 uColor;",
    "uniform float uOpacity;",
    "void main() {",
    "  vec4 t = texture2D(uMap, vUv);",
    "  gl_FragColor = vec4(t.rgb * uColor, t.a * uOpacity);",
    "}",
  ].join("\n");

  S.ffnWebVert = [
    "attribute vec3 aColor;",
    "attribute float aWeight;",
    "varying vec3 vColor;",
    "varying float vW;",
    "void main() {",
    "  vColor = aColor;",
    "  vW = aWeight;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}",
  ].join("\n");

  S.ffnWebFrag = [
    "precision highp float;",
    "varying vec3 vColor;",
    "varying float vW;",
    "uniform float uTime;",
    "uniform float uOpacity;",
    "void main() {",
    "  float pulse = 0.62 + 0.38 * sin(uTime * 2.1 + vW * 11.0);",
    "  float a = uOpacity * (0.025 + 0.975 * pow(vW, 1.25)) * pulse;",
    "  gl_FragColor = vec4(vColor * (0.65 + pulse * 1.35), a);",
    "}",
  ].join("\n");

  S.makeFFNWebMaterial = function () {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.55 } },
      vertexShader: S.ffnWebVert,
      fragmentShader: S.ffnWebFrag,
    });
  };

  S.postVert = [
    "varying vec2 vUv;",
    "void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  ].join("\n");

  S.postFrag = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform sampler2D tDiffuse;",
    "uniform vec2 uResolution;",
    "uniform float uTime;",
    "uniform float uAberration;",
    "uniform float uGrain;",
    "uniform float uVignette;",
    "uniform float uScan;",
    "float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",
    "void main() {",
    "  vec2 uv = vUv;",
    "  vec2 d = uv - 0.5;",
    "  float r2 = dot(d, d);",
    "  vec2 off = d * r2 * uAberration;",
    "  float r = texture2D(tDiffuse, uv + off).r;",
    "  float g = texture2D(tDiffuse, uv).g;",
    "  float b = texture2D(tDiffuse, uv - off).b;",
    "  vec3 col = vec3(r, g, b);",
    "  float lum = dot(col, vec3(0.299, 0.587, 0.114));",
    "  col = mix(vec3(lum), col, 1.12);",
    "  vec3 shadow = vec3(0.012, 0.020, 0.055);",
    "  vec3 high = vec3(0.92, 0.97, 1.0);",
    "  col = mix(shadow, high, smoothstep(0.0, 1.0, lum)) * 0.18 + col * 0.92;",
    "  float vig = smoothstep(0.95, 0.18, length(d) * (1.0 + uVignette));",
    "  col *= mix(1.0, vig, 0.82);",
    "  float scan = sin(uv.y * uResolution.y * 1.35 + uTime * 1.6) * 0.006 * uScan;",
    "  col += scan;",
    "  float grain = (hash(uv * uResolution + uTime) - 0.5) * uGrain;",
    "  col += grain;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}",
  ].join("\n");

  S.makeBackground = function (quality) {
    var geo = new THREE.SphereGeometry(260, 48, 32);
    var mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: quality && quality.nebula === false ? 0.8 : 1.0 },
        uA: { value: new THREE.Color(0x0b1a3a) },
        uB: { value: new THREE.Color(0x2a0f3a) },
        uC: { value: new THREE.Color(0x0d4e66) },
      },
      vertexShader: S.bgVert,
      fragmentShader: S.bgFrag,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = -100;
    return mesh;
  };

  S.makeStars = function (count, rng) {
    var pos = new Float32Array(count * 3);
    var size = new Float32Array(count);
    var phase = new Float32Array(count);
    var color = new Float32Array(count * 3);
    var palette = [0x9fe9ff, 0xffffff, 0xd9c8ff, 0xffe7b0, 0x8fb6ff];
    for (var i = 0; i < count; i++) {
      var r = 55 + rng() * 180;
      var theta = rng() * Math.PI * 2;
      var phi = Math.acos(2 * rng() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      size[i] = 0.8 + Math.pow(rng(), 3) * 5.5;
      phase[i] = rng();
      var c = new THREE.Color(palette[(rng() * palette.length) | 0]);
      color[i * 3] = c.r; color[i * 3 + 1] = c.g; color[i * 3 + 2] = c.b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    var mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uScale: { value: 220 } },
      vertexShader: S.starVert,
      fragmentShader: S.starFrag,
    });
    var points = new THREE.Points(geo, mat);
    points.renderOrder = -90;
    return points;
  };

  S.makeCrystalMaterial = function (color, rim, player) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uRim: { value: new THREE.Color(rim || 0xffffff) },
        uTime: { value: 0 },
        uIntensity: { value: 1 },
        uPlayer: { value: player ? 1 : 0 },
      },
      vertexShader: S.crystalVert,
      fragmentShader: S.crystalFrag,
    });
  };

  S.makeBeamMaterial = function (color, weight, opacity, speed) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uTime: { value: 0 },
        uWeight: { value: weight },
        uOpacity: { value: opacity === undefined ? 1 : opacity },
        uSpeed: { value: speed === undefined ? 0.55 : speed },
      },
      vertexShader: S.beamVert,
      fragmentShader: S.beamFrag,
    });
  };

  S.makePillarMaterial = function (a, b) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1 },
        uA: { value: new THREE.Color(a) },
        uB: { value: new THREE.Color(b) },
      },
      vertexShader: S.pillarVert,
      fragmentShader: S.pillarFrag,
    });
  };

  S.makeRingMaterial = function (color, alpha, radius) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uAlpha: { value: alpha === undefined ? 1 : alpha },
        uColor: { value: new THREE.Color(color) },
        uRadius: { value: radius || 9 },
      },
      vertexShader: S.ringVert,
      fragmentShader: S.ringFrag,
    });
  };

  S.makeCurtainMaterial = function (color, opacity) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity === undefined ? 1 : opacity },
      },
      vertexShader: S.curtainVert,
      fragmentShader: S.curtainFrag,
    });
  };

  S.makeLensMaterial = function (color, opacity) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity === undefined ? 1 : opacity },
      },
      vertexShader: S.lensVert,
      fragmentShader: S.lensFrag,
    });
  };

  S.makeNeuronMaterial = function (color) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uActivation: { value: 0 },
      },
      vertexShader: S.neuronVert,
      fragmentShader: S.neuronFrag,
    });
  };

  S.makeGlyphMaterial = function (texture, color, opacity) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uMap: { value: texture },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity === undefined ? 1 : opacity },
      },
      vertexShader: S.glyphVert,
      fragmentShader: S.glyphFrag,
    });
  };

  S.makePostPass = function (composerSize) {
    return new THREE.ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: new THREE.Vector2(composerSize.x, composerSize.y) },
        uTime: { value: 0 },
        uAberration: { value: 0.35 },
        uGrain: { value: 0.018 },
        uVignette: { value: 0.55 },
        uScan: { value: 1.0 },
      },
      vertexShader: S.postVert,
      fragmentShader: S.postFrag,
    });
  };

  TEGO.Shaders = S;
})(typeof globalThis !== "undefined" ? globalThis : this);
