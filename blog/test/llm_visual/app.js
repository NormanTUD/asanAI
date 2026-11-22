(() => {
"use strict";

const TAU = Math.PI * 2;
const V3 = THREE.Vector3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
	const t = clamp((x - a) / (b - a), 0, 1);
	return t * t * (3 - 2 * t);
};
const damp = (a, b, lambda, dt) => b + (a - b) * Math.exp(-lambda * dt);

function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const random = mulberry32(0x5eedc0de);
const rr = (a, b) => a + (b - a) * random();
const gaussian = () => {
	let u = 0;
	let v = 0;
	while (u === 0) u = random();
	while (v === 0) v = random();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
};
const unit = () => {
	const z = rr(-1, 1);
	const a = rr(0, TAU);
	const r = Math.sqrt(1 - z * z);
	return new V3(r * Math.cos(a), z, r * Math.sin(a));
};

const TOKEN_COLORS = [0x7df9ff, 0x8dffd6, 0xc0a6ff, 0xffd27a, 0xffa3c8, 0x8fc4ff];
const TOKEN_SIZES = [1.08, 0.82, 1.28, 0.92, 0.78, 1.16];
const TOKEN_COUNT = TOKEN_COLORS.length;

const TOKEN_PALETTE = TOKEN_COLORS.map((hex) => new THREE.Color(hex));
const REGION_PALETTE = [0x4c8fce, 0x4f72c6, 0x7868c8, 0x3e9997, 0x608bdc, 0x8b6bb7, 0x367c9a, 0x5b78c9];

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true,
	powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.getElementById("scene").appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 500);

const nebulaMaterial = new THREE.ShaderMaterial({
	uniforms: {
		uTime: { value: 0 }
	},
	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: `
		uniform float uTime;
		varying vec2 vUv;
		float hash(vec2 p) {
			return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
		}
		float noise(vec2 p) {
			vec2 i = floor(p);
			vec2 f = fract(p);
			f = f * f * (3.0 - 2.0 * f);
			float a = hash(i);
			float b = hash(i + vec2(1.0, 0.0));
			float c = hash(i + vec2(0.0, 1.0));
			float d = hash(i + vec2(1.0, 1.0));
			return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
		}
		float fbm(vec2 p) {
			float v = 0.0;
			float a = 0.5;
			for (int i = 0; i < 4; i++) {
				v += a * noise(p);
				p *= 2.03;
				a *= 0.5;
			}
			return v;
		}
		void main() {
			vec2 p = vUv * 2.0 - 1.0;
			vec2 q = p * vec2(1.0, 1.35);
			float n1 = fbm(q * 2.1 + vec2(uTime * 0.013, -uTime * 0.008));
			float n2 = fbm(q * 4.4 - vec2(uTime * 0.01, uTime * 0.015));
			vec3 a = vec3(0.02, 0.12, 0.2);
			vec3 b = vec3(0.12, 0.05, 0.24);
			vec3 c = vec3(0.03, 0.22, 0.2);
			vec3 color = mix(a, b, smoothstep(0.2, 0.85, n1));
			color = mix(color, c, smoothstep(0.55, 1.0, n2) * 0.6);
			float r = length(p * vec2(0.9, 1.1));
			float vignette = smoothstep(1.25, 0.15, r);
			float alpha = vignette * (0.035 + 0.15 * n1) * 0.55;
			gl_FragColor = vec4(color * (0.6 + 0.8 * n1), alpha);
		}
	`,
	transparent: true,
	blending: THREE.AdditiveBlending,
	depthWrite: false,
	depthTest: false
});
const nebula = new THREE.Mesh(new THREE.PlaneGeometry(320, 210), nebulaMaterial);
nebula.position.set(0, -3, -94);
nebula.renderOrder = -100;
scene.add(nebula);

function makeGlowTexture() {
	const size = 256;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	grad.addColorStop(0, "rgba(255,255,255,1)");
	grad.addColorStop(0.12, "rgba(255,255,255,0.96)");
	grad.addColorStop(0.32, "rgba(255,255,255,0.42)");
	grad.addColorStop(0.62, "rgba(255,255,255,0.1)");
	grad.addColorStop(1, "rgba(255,255,255,0)");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, size, size);
	const texture = new THREE.CanvasTexture(canvas);
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	return texture;
}

const glowTex = makeGlowTexture();

function makeFlareTexture() {
	const width = 512;
	const height = 128;
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	ctx.globalCompositeOperation = "lighter";
	const line = ctx.createLinearGradient(0, 0, width, 0);
	line.addColorStop(0, "rgba(255,255,255,0)");
	line.addColorStop(0.18, "rgba(255,255,255,0.08)");
	line.addColorStop(0.4, "rgba(255,255,255,0.7)");
	line.addColorStop(0.5, "rgba(255,255,255,1)");
	line.addColorStop(0.6, "rgba(255,255,255,0.7)");
	line.addColorStop(0.82, "rgba(255,255,255,0.08)");
	line.addColorStop(1, "rgba(255,255,255,0)");
	ctx.fillStyle = line;
	ctx.fillRect(0, height / 2 - 2, width, 4);
	const bloom = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 54);
	bloom.addColorStop(0, "rgba(255,255,255,0.95)");
	bloom.addColorStop(0.2, "rgba(255,255,255,0.36)");
	bloom.addColorStop(1, "rgba(255,255,255,0)");
	ctx.fillStyle = bloom;
	ctx.fillRect(0, 0, width, height);
	const texture = new THREE.CanvasTexture(canvas);
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	return texture;
}

const flareTex = makeFlareTexture();

function flareSprite(color, width, height, opacity) {
	const material = new THREE.SpriteMaterial({
		map: flareTex,
		color,
		transparent: true,
		opacity,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		depthTest: false
	});
	const sprite = new THREE.Sprite(material);
	sprite.scale.set(width, height, 1);
	sprite.renderOrder = 9;
	return sprite;
}

function glowSprite(color, scale, opacity) {
	const material = new THREE.SpriteMaterial({
		map: glowTex,
		color,
		transparent: true,
		opacity,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		depthTest: false
	});
	const sprite = new THREE.Sprite(material);
	sprite.scale.set(scale, scale, 1);
	sprite.renderOrder = 8;
	return sprite;
}

function orbMaterial(color) {
	return new THREE.ShaderMaterial({
		uniforms: {
			uColor: { value: color.clone() },
			uOpacity: { value: 0 }
		},
		vertexShader: `
			varying vec3 vN;
			varying vec3 vV;
			void main() {
				vec4 mv = modelViewMatrix * vec4(position, 1.0);
				vV = normalize(-mv.xyz);
				vN = normalize(normalMatrix * normal);
				gl_Position = projectionMatrix * mv;
			}
		`,
		fragmentShader: `
			uniform vec3 uColor;
			uniform float uOpacity;
			varying vec3 vN;
			varying vec3 vV;
			void main() {
				float f = 1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
				f = pow(f, 2.1);
				vec3 col = uColor * (0.5 + 1.7 * f);
				gl_FragColor = vec4(col, uOpacity);
			}
		`,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
}

const dustCount = 1900;
const dustGeometry = new THREE.BufferGeometry();
const dustPositions = new Float32Array(dustCount * 3);
const dustColors = new Float32Array(dustCount * 3);
const dustSizes = new Float32Array(dustCount);
const dustPhases = new Float32Array(dustCount);
const dustColorA = new THREE.Color(0x274b7a);
const dustColorB = new THREE.Color(0x75d7ff);
const dustColorC = new THREE.Color(0x8c6cff);

for (let i = 0; i < dustCount; i += 1) {
	const dir = unit();
	const radius = 14 + Math.pow(random(), 0.62) * 92;
	const pos = dir.multiplyScalar(radius);
	dustPositions[i * 3] = pos.x;
	dustPositions[i * 3 + 1] = pos.y * 0.72 - 2;
	dustPositions[i * 3 + 2] = pos.z * 0.8 - 8;
	const mix = random();
	const color = dustColorA.clone().lerp(mix < 0.55 ? dustColorB : dustColorC, rr(0.15, 0.8));
	color.multiplyScalar(rr(0.5, 1.15));
	dustColors[i * 3] = color.r;
	dustColors[i * 3 + 1] = color.g;
	dustColors[i * 3 + 2] = color.b;
	dustSizes[i] = rr(0.25, 1.35);
	dustPhases[i] = rr(0, TAU);
}

dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
dustGeometry.setAttribute("aColor", new THREE.BufferAttribute(dustColors, 3));
dustGeometry.setAttribute("aSize", new THREE.BufferAttribute(dustSizes, 1));
dustGeometry.setAttribute("aPhase", new THREE.BufferAttribute(dustPhases, 1));

const dustMaterial = new THREE.ShaderMaterial({
	uniforms: {
		uTime: { value: 0 },
		uOpacity: { value: 0.45 }
	},
	vertexShader: `
		attribute float aSize;
		attribute float aPhase;
		attribute vec3 aColor;
		uniform float uTime;
		uniform float uOpacity;
		varying vec3 vColor;
		varying float vAlpha;
		void main() {
			vec4 mv = modelViewMatrix * vec4(position, 1.0);
			float tw = 0.72 + 0.28 * sin(uTime * 0.62 + aPhase);
			gl_PointSize = aSize * tw * (250.0 / max(2.0, -mv.z));
			gl_Position = projectionMatrix * mv;
			vColor = aColor;
			vAlpha = uOpacity * (0.45 + 0.55 * tw);
		}
	`,
	fragmentShader: `
		varying vec3 vColor;
		varying float vAlpha;
		void main() {
			vec2 q = gl_PointCoord - 0.5;
			float d = length(q);
			if (d > 0.5) discard;
			float a = smoothstep(0.5, 0.0, d);
			gl_FragColor = vec4(vColor, vAlpha * a);
		}
	`,
	transparent: true,
	blending: THREE.AdditiveBlending,
	depthWrite: false
});

const dust = new THREE.Points(dustGeometry, dustMaterial);
scene.add(dust);

const SHEET_W = 98;
const SHEET_D = 64;
const SHEET_U = 88;
const SHEET_V = 48;

function sheetBaseY(x, z, t) {
	return -3.7 +
		1.15 * Math.sin(x * 0.13 + t * 0.24) +
		0.85 * Math.cos(z * 0.18 - t * 0.2) +
		0.52 * Math.sin((x + z) * 0.095 + t * 0.31);
}

const sheetX = new Float32Array((SHEET_U + 1) * (SHEET_V + 1));
const sheetZ = new Float32Array((SHEET_U + 1) * (SHEET_V + 1));
const sheetGeometry = new THREE.BufferGeometry();
const sheetPositions = new Float32Array((SHEET_U + 1) * (SHEET_V + 1) * 3);
const sheetColors = new Float32Array((SHEET_U + 1) * (SHEET_V + 1) * 3);
const sheetIndices = [];
const sheetColorA = new THREE.Color(0x0e6d7a);
const sheetColorB = new THREE.Color(0x4d338e);
const sheetColorC = new THREE.Color(0x103b5e);

for (let v = 0; v <= SHEET_V; v += 1) {
	for (let u = 0; u <= SHEET_U; u += 1) {
		const index = v * (SHEET_U + 1) + u;
		const x = -SHEET_W / 2 + (u / SHEET_U) * SHEET_W;
		const z = -SHEET_D / 2 + (v / SHEET_V) * SHEET_D - 3;
		const y = sheetBaseY(x, z, 0);
		sheetX[index] = x;
		sheetZ[index] = z;
		sheetPositions[index * 3] = x;
		sheetPositions[index * 3 + 1] = y;
		sheetPositions[index * 3 + 2] = z;
		const wave = 0.5 + 0.5 * Math.sin(x * 0.15 + z * 0.11);
		const color = sheetColorA.clone()
			.lerp(sheetColorB, clamp((x / SHEET_W + 0.5) * 0.55 + (z / SHEET_D + 0.5) * 0.25, 0, 1))
			.lerp(sheetColorC, wave * 0.22);
		color.multiplyScalar(0.4 + 0.6 * wave);
		sheetColors[index * 3] = color.r;
		sheetColors[index * 3 + 1] = color.g;
		sheetColors[index * 3 + 2] = color.b;
	}
}

for (let v = 0; v < SHEET_V; v += 1) {
	for (let u = 0; u < SHEET_U; u += 1) {
		const a = v * (SHEET_U + 1) + u;
		const b = a + 1;
		const c = a + SHEET_U + 1;
		const d = c + 1;
		sheetIndices.push(a, c, b, b, c, d);
	}
}

sheetGeometry.setAttribute("position", new THREE.BufferAttribute(sheetPositions, 3));
sheetGeometry.setAttribute("color", new THREE.BufferAttribute(sheetColors, 3));
sheetGeometry.setIndex(sheetIndices);

const sheetMaterial = new THREE.MeshBasicMaterial({
	vertexColors: true,
	transparent: true,
	opacity: 0,
	side: THREE.DoubleSide,
	depthWrite: false,
	blending: THREE.AdditiveBlending
});
const sheetWireMaterial = new THREE.MeshBasicMaterial({
	color: 0x83ebff,
	wireframe: true,
	transparent: true,
	opacity: 0,
	depthWrite: false,
	blending: THREE.AdditiveBlending
});
const sheetMesh = new THREE.Mesh(sheetGeometry, sheetMaterial);
const sheetWire = new THREE.Mesh(sheetGeometry, sheetWireMaterial);
sheetMesh.renderOrder = 1;
sheetWire.renderOrder = 2;
scene.add(sheetMesh);
scene.add(sheetWire);

const shockPoints = [];
for (let i = 0; i < 180; i += 1) {
	const a = (i / 180) * TAU;
	shockPoints.push(new V3(Math.cos(a), 0, Math.sin(a)));
}
const shockMaterial = new THREE.LineBasicMaterial({
	color: 0xa6f3ff,
	transparent: true,
	opacity: 0,
	blending: THREE.AdditiveBlending,
	depthWrite: false
});
const shockRing = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(shockPoints), shockMaterial);
shockRing.visible = false;
scene.add(shockRing);

const shellGroup = new THREE.Group();
shellGroup.position.set(0, -2, -7);
scene.add(shellGroup);
const shellMaterial = new THREE.LineBasicMaterial({
	color: 0x78d8ff,
	transparent: true,
	opacity: 0,
	blending: THREE.AdditiveBlending,
	depthWrite: false
});

function addShellCircle(rotationX, rotationY, radius) {
	const points = [];
	for (let i = 0; i < 180; i += 1) {
		const a = (i / 180) * TAU;
		points.push(new V3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
	}
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const line = new THREE.LineLoop(geometry, shellMaterial);
	line.rotation.x = rotationX;
	line.rotation.y = rotationY;
	shellGroup.add(line);
}

addShellCircle(-Math.PI / 2, 0, 38);
addShellCircle(0.32, 0.5, 38);
addShellCircle(0.9, -0.8, 38);

const cloudGroup = new THREE.Group();
scene.add(cloudGroup);
const clusters = [];

function cloudMaterial() {
	return new THREE.ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			uOpacity: { value: 0 }
		},
		vertexShader: `
			attribute float aSize;
			attribute float aPhase;
			attribute vec3 aColor;
			uniform float uTime;
			uniform float uOpacity;
			varying vec3 vColor;
			varying float vAlpha;
			void main() {
				vec4 mv = modelViewMatrix * vec4(position, 1.0);
				float tw = 0.7 + 0.3 * sin(uTime * 0.74 + aPhase);
				gl_PointSize = aSize * tw * (235.0 / max(2.0, -mv.z));
				gl_Position = projectionMatrix * mv;
				vColor = aColor;
				vAlpha = uOpacity * (0.4 + 0.6 * tw);
			}
		`,
		fragmentShader: `
			varying vec3 vColor;
			varying float vAlpha;
			void main() {
				vec2 q = gl_PointCoord - 0.5;
				float d = length(q);
				if (d > 0.5) discard;
				float a = smoothstep(0.5, 0.0, d);
				gl_FragColor = vec4(vColor, vAlpha * a);
			}
		`,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
}

function addCluster(cx, cz, lift, paletteIndex) {
	const cy = sheetBaseY(cx, cz, 0) + lift;
	const baseColor = new THREE.Color(REGION_PALETTE[paletteIndex % REGION_PALETTE.length]);
	baseColor.offsetHSL(rr(-0.025, 0.025), rr(-0.08, 0.08), rr(-0.08, 0.07));

	const group = new THREE.Group();
	group.position.set(cx, cy, cz);

	const count = 80;
	const positions = new Float32Array(count * 3);
	const colors = new Float32Array(count * 3);
	const sizes = new Float32Array(count);
	const phases = new Float32Array(count);

	for (let k = 0; k < count; k += 1) {
		const dir = unit();
		const spread = Math.abs(gaussian()) * rr(0.7, 2.4);
		positions[k * 3] = dir.x * spread * 1.2;
		positions[k * 3 + 1] = dir.y * spread * 0.72;
		positions[k * 3 + 2] = dir.z * spread;
		const color = baseColor.clone().offsetHSL(rr(-0.05, 0.05), rr(-0.1, 0.1), rr(-0.16, 0.12));
		color.lerp(new THREE.Color(0xeafcff), rr(0, 0.22));
		color.multiplyScalar(rr(0.45, 1.15));
		colors[k * 3] = color.r;
		colors[k * 3 + 1] = color.g;
		colors[k * 3 + 2] = color.b;
		sizes[k] = rr(0.35, 1.45);
		phases[k] = rr(0, TAU);
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
	geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
	geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

	const material = cloudMaterial();
	const points = new THREE.Points(geometry, material);
	points.renderOrder = 3;

	const glow = glowSprite(baseColor, rr(6, 12), 0);
	group.add(points);
	group.add(glow);
	cloudGroup.add(group);

	const cluster = {
		group,
		points,
		material,
		glow,
		color: baseColor,
		base: { x: cx, z: cz, lift },
		phase: rr(0, TAU),
		flare: 0,
		flareV: 0,
		isSource: false,
		sourceToken: -1,
		isTarget: false,
		glowScale: glow.scale.x
	};
	clusters.push(cluster);
	return cluster;
}

const CLOUD_COUNT = 30;
for (let i = 0; i < CLOUD_COUNT; i += 1) {
	const angle = i * 2.399963229728653 + rr(-0.2, 0.2);
	const radius = 12 + Math.sqrt((i + 0.5) / CLOUD_COUNT) * 31;
	const cx = Math.cos(angle) * radius * 1.14;
	const cz = -9 + Math.sin(angle) * radius * 0.44;
	const lift = rr(-4.5, 14.5);
	addCluster(cx, cz, lift, i);
}

const sourceBases = [
	{ x: -24, y: 7.0, z: -22 },
	{ x: -16, y: -4.5, z: -11 },
	{ x: -6, y: 10.0, z: -26 },
	{ x: 5, y: -2.0, z: -8 },
	{ x: 16, y: 8.0, z: -20 },
	{ x: 25, y: 1.5, z: -5 }
];

const sourceClusters = [];
for (let i = 0; i < TOKEN_COUNT; i += 1) {
	const base = sourceBases[i];
	const lift = base.y - sheetBaseY(base.x, base.z, 0);
	const cluster = addCluster(base.x, base.z, lift, 6 + i);
	cluster.isSource = true;
	cluster.sourceToken = i;
	sourceClusters.push(cluster);
}

const tokens = [];
const tokenGroup = new THREE.Group();
scene.add(tokenGroup);
const RAY_COUNT = 64;

for (let i = 0; i < TOKEN_COUNT; i += 1) {
	const cluster = sourceClusters[i];
	const color = TOKEN_PALETTE[i].clone();
	const size = TOKEN_SIZES[i];
	const group = new THREE.Group();
	group.position.copy(cluster.group.position);
	tokenGroup.add(group);

	const core = new THREE.Mesh(new THREE.SphereGeometry(0.33 * size, 28, 20), orbMaterial(color));
	group.add(core);

	const halo = glowSprite(color, 4.4 * size, 0);
	group.add(halo);
	const haloOuter = glowSprite(color, 13 * size, 0);
	group.add(haloOuter);
	const flare = flareSprite(color, 17 * size, 2.1 * size, 0);
	group.add(flare);

	const rayPositions = new Float32Array(RAY_COUNT * 6);
	const rayColors = new Float32Array(RAY_COUNT * 6);
	const rayDirs = [];
	const rayLengths = [];
	const rayPhases = [];
	for (let k = 0; k < RAY_COUNT; k += 1) {
		const dir = unit();
		dir.y *= 0.82;
		dir.normalize();
		rayDirs.push(dir);
		rayLengths.push(rr(1.2, 4.6));
		rayPhases.push(rr(0, TAU));
		const base = color.clone().multiplyScalar(rr(0.55, 1.05));
		const tip = color.clone().multiplyScalar(0.06);
		rayColors[k * 6] = base.r;
		rayColors[k * 6 + 1] = base.g;
		rayColors[k * 6 + 2] = base.b;
		rayColors[k * 6 + 3] = tip.r;
		rayColors[k * 6 + 4] = tip.g;
		rayColors[k * 6 + 5] = tip.b;
	}
	const rayGeometry = new THREE.BufferGeometry();
	rayGeometry.setAttribute("position", new THREE.BufferAttribute(rayPositions, 3));
	rayGeometry.setAttribute("color", new THREE.BufferAttribute(rayColors, 3));
	const rayMaterial = new THREE.LineBasicMaterial({
		vertexColors: true,
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const rays = new THREE.LineSegments(rayGeometry, rayMaterial);
	group.add(rays);

	const rootMarker = glowSprite(color, 2.8 * size, 0);
	scene.add(rootMarker);

	const baseStemGeometry = new THREE.BufferGeometry();
	const baseStemPositions = new Float32Array(6);
	baseStemGeometry.setAttribute("position", new THREE.BufferAttribute(baseStemPositions, 3));
	const baseStemMaterial = new THREE.LineBasicMaterial({
		color,
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const baseStem = new THREE.Line(baseStemGeometry, baseStemMaterial);
	scene.add(baseStem);

	const baseCrossGeometry = new THREE.BufferGeometry();
	const baseCrossPositions = new Float32Array(18);
	baseCrossGeometry.setAttribute("position", new THREE.BufferAttribute(baseCrossPositions, 3));
	const baseCrossMaterial = new THREE.LineBasicMaterial({
		color,
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const baseCross = new THREE.LineSegments(baseCrossGeometry, baseCrossMaterial);
	scene.add(baseCross);

	const residualGeometry = new THREE.BufferGeometry();
	const residualPositions = new Float32Array(24 * 3);
	const residualColors = new Float32Array(24 * 3);
	for (let k = 0; k < 24; k += 1) {
		const t = k / 23;
		const col = color.clone().multiplyScalar(0.08 + 0.92 * t * t);
		residualColors[k * 3] = col.r;
		residualColors[k * 3 + 1] = col.g;
		residualColors[k * 3 + 2] = col.b;
	}
	residualGeometry.setAttribute("position", new THREE.BufferAttribute(residualPositions, 3));
	residualGeometry.setAttribute("color", new THREE.BufferAttribute(residualColors, 3));
	const residualMaterial = new THREE.LineBasicMaterial({
		vertexColors: true,
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const residual = new THREE.Line(residualGeometry, residualMaterial);
	scene.add(residual);

	const FIBER_STRANDS = 12;
	const FIBER_SEGMENTS = 26;
	const fiberPositions = new Float32Array(FIBER_STRANDS * FIBER_SEGMENTS * 6);
	const fiberColors = new Float32Array(FIBER_STRANDS * FIBER_SEGMENTS * 6);
	const fiberStrands = [];
	for (let s = 0; s < FIBER_STRANDS; s += 1) {
		const strand = {
			ox: rr(-1.1, 1.1),
			oz: rr(-1.1, 1.1),
			phase: rr(0, TAU),
			speed: rr(0.55, 1.2)
		};
		fiberStrands.push(strand);
		for (let k = 0; k < FIBER_SEGMENTS; k += 1) {
			const t1 = k / FIBER_SEGMENTS;
			const t2 = (k + 1) / FIBER_SEGMENTS;
			const c1 = color.clone().multiplyScalar(0.06 + 0.82 * Math.pow(t1, 1.5));
			const c2 = color.clone().multiplyScalar(0.06 + 0.82 * Math.pow(t2, 1.5));
			const index = (s * FIBER_SEGMENTS + k) * 6;
			fiberColors[index] = c1.r;
			fiberColors[index + 1] = c1.g;
			fiberColors[index + 2] = c1.b;
			fiberColors[index + 3] = c2.r;
			fiberColors[index + 4] = c2.g;
			fiberColors[index + 5] = c2.b;
		}
	}
	const fiberGeometry = new THREE.BufferGeometry();
	fiberGeometry.setAttribute("position", new THREE.BufferAttribute(fiberPositions, 3));
	fiberGeometry.setAttribute("color", new THREE.BufferAttribute(fiberColors, 3));
	const fiberMaterial = new THREE.LineBasicMaterial({
		vertexColors: true,
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const fibers = new THREE.LineSegments(fiberGeometry, fiberMaterial);
	scene.add(fibers);

	const echoes = [];
	for (let k = 0; k < 3; k += 1) {
		const sprite = glowSprite(color, (2.5 - k * 0.45) * size, 0);
		scene.add(sprite);
		echoes.push({ sprite, fraction: 0.24 + k * 0.22 });
	}

	const rootX = cluster.base.x;
	const rootZ = cluster.base.z;
	rootMarker.position.copy(cluster.group.position);

	const token = {
		i,
		cluster,
		color,
		size,
		group,
		core,
		coreMat: core.material,
		halo,
		haloOuter,
		flare,
		rays,
		rayGeometry,
		rayMaterial,
		rayDirs,
		rayLengths,
		rayPhases,
		pos: group.position.clone(),
		flowDir: new V3(),
		rootX,
		rootZ,
		rootMarker,
		baseStem,
		baseStemGeometry,
		baseStemMaterial,
		baseCross,
		baseCrossGeometry,
		baseCrossMaterial,
		residualGeometry,
		residualMaterial,
		fibers,
		fiberGeometry,
		fiberMaterial,
		fiberStrands,
		echoes,
		fiberBend: new V3(rr(-2.2, 2.2), 0, rr(-1.9, 1.9)),
		phase: rr(0, TAU)
	};
	token.pos.copy(cluster.group.position);
	tokens.push(token);

	cluster.glow.material.color.copy(color);
	const attr = cluster.points.geometry.getAttribute("aColor");
	for (let k = 0; k < attr.count; k += 1) {
		const original = new THREE.Color(attr.getX(k), attr.getY(k), attr.getZ(k));
		original.lerp(color, 0.42);
		attr.setXYZ(k, original.r, original.g, original.b);
	}
	attr.needsUpdate = true;
}

const subspaceGroup = new THREE.Group();
subspaceGroup.position.set(0, 0.6, 0);
scene.add(subspaceGroup);
const subspaces = [];
const subspaceSpecs = [
	{ radius: 11.5, color: 0x66e4ff, rot: [-0.35, 0.5, 0.25], theta: 0.58 },
	{ radius: 15, color: 0xb795ff, rot: [0.72, 1.15, -0.38], theta: 0.5 },
	{ radius: 18.5, color: 0xffc477, rot: [1.68, -0.52, 0.74], theta: 0.43 }
];

for (let i = 0; i < subspaceSpecs.length; i += 1) {
	const spec = subspaceSpecs[i];
	const group = new THREE.Group();
	const geometry = new THREE.SphereGeometry(spec.radius, 48, 28, 0, TAU, 0, Math.PI * spec.theta);
	const colorB = new THREE.Color(spec.color).offsetHSL(0.1, 0.12, 0.12);
	const material = new THREE.ShaderMaterial({
		uniforms: {
			uColorA: { value: new THREE.Color(spec.color) },
			uColorB: { value: colorB },
			uOpacity: { value: 0 }
		},
		vertexShader: `
			varying vec3 vN;
			varying vec3 vV;
			void main() {
				vec4 mv = modelViewMatrix * vec4(position, 1.0);
				vN = normalize(normalMatrix * normal);
				vV = normalize(-mv.xyz);
				gl_Position = projectionMatrix * mv;
			}
		`,
		fragmentShader: `
			uniform vec3 uColorA;
			uniform vec3 uColorB;
			uniform float uOpacity;
			varying vec3 vN;
			varying vec3 vV;
			void main() {
				vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
				float f = 1.0 - abs(dot(n, normalize(vV)));
				f = pow(f, 2.15);
				vec3 color = mix(uColorA, uColorB, smoothstep(0.0, 0.92, f));
				float alpha = (0.008 + f * 0.18) * uOpacity;
				gl_FragColor = vec4(color, alpha);
			}
		`,
		transparent: true,
		side: THREE.DoubleSide,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const mesh = new THREE.Mesh(geometry, material);
	const rimPoints = [];
	const rimRadius = spec.radius * Math.sin(Math.PI * spec.theta);
	const rimY = spec.radius * Math.cos(Math.PI * spec.theta);
	for (let k = 0; k < 100; k += 1) {
		const a = (k / 100) * TAU;
		rimPoints.push(new V3(Math.cos(a) * rimRadius, rimY, Math.sin(a) * rimRadius));
	}
	const rimMaterial = new THREE.LineBasicMaterial({
		color: spec.color,
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const rim = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(rimPoints), rimMaterial);
	mesh.add(rim);
	group.add(mesh);
	group.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
	subspaceGroup.add(group);
	subspaces.push({ group, material, rimMaterial, baseRot: spec.rot, speed: rr(-0.08, 0.08), phase: rr(0, TAU) });
}

const sliceGroup = new THREE.Group();
scene.add(sliceGroup);
const slices = [];
const sliceSpecs = [
	{ color: 0x67efff, radius: 10.5, phase: 0.0, normal: new V3(1, 0.16, 0.22) },
	{ color: 0xb38cff, radius: 12.0, phase: 2.1, normal: new V3(1, -0.28, -0.18) },
	{ color: 0xffc36e, radius: 9.2, phase: 4.2, normal: new V3(1, 0.42, -0.3) }
];

for (let i = 0; i < sliceSpecs.length; i += 1) {
	const spec = sliceSpecs[i];
	const material = new THREE.ShaderMaterial({
		uniforms: {
			uColor: { value: new THREE.Color(spec.color) },
			uOpacity: { value: 0 },
			uTime: { value: 0 },
			uPhase: { value: spec.phase }
		},
		vertexShader: `
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: `
			uniform vec3 uColor;
			uniform float uOpacity;
			uniform float uTime;
			uniform float uPhase;
			varying vec2 vUv;
			void main() {
				vec2 p = vUv * 2.0 - 1.0;
				float r = length(p);
				float edge = smoothstep(0.985, 1.0, r) * (1.0 - smoothstep(1.0, 1.001, r));
				float fill = smoothstep(1.0, 0.0, r) * 0.022;
				float ringA = smoothstep(0.014, 0.0, abs(r - 0.72)) * 0.15;
				float ringB = smoothstep(0.012, 0.0, abs(r - 0.46)) * 0.08;
				float bands = 0.016 * (0.5 + 0.5 * sin(r * 34.0 - uTime * 1.4 + uPhase)) * smoothstep(1.0, 0.2, r);
				float alpha = (fill + edge * 0.94 + ringA + ringB + bands) * uOpacity;
				gl_FragColor = vec4(uColor, alpha);
			}
		`,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		side: THREE.DoubleSide
	});
	const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 112), material);
	mesh.scale.setScalar(spec.radius);
	const quaternion = new THREE.Quaternion().setFromUnitVectors(new V3(0, 0, 1), spec.normal.clone().normalize());
	mesh.quaternion.copy(quaternion);
	sliceGroup.add(mesh);
	slices.push({ mesh, material, spec });
}

const ATTENTION_W = [
	[0, 0.92, 0.34, 0.16, 0.22, 0.1],
	[0.74, 0, 0.56, 0.26, 0.12, 0.4],
	[0.24, 0.84, 0, 0.38, 0.48, 0.14],
	[0.14, 0.3, 0.62, 0, 0.78, 0.22],
	[0.2, 0.16, 0.52, 0.68, 0, 0.88],
	[0.1, 0.46, 0.2, 0.32, 0.9, 0]
];

const arcs = [];
const arcGroup = new THREE.Group();
scene.add(arcGroup);
const ARC_SEGMENTS = 26;

for (let i = 0; i < TOKEN_COUNT; i += 1) {
	for (let j = 0; j < TOKEN_COUNT; j += 1) {
		if (i === j) continue;
		const weight = ATTENTION_W[i][j];
		if (weight < 0.14) continue;
		const positions = new Float32Array(ARC_SEGMENTS * 3);
		const colors = new Float32Array(ARC_SEGMENTS * 3);
		const from = TOKEN_PALETTE[i];
		const to = TOKEN_PALETTE[j];
		for (let k = 0; k < ARC_SEGMENTS; k += 1) {
			const t = k / (ARC_SEGMENTS - 1);
			const color = from.clone().lerp(to, t).multiplyScalar(0.55 + 0.45 * Math.sin(Math.PI * t));
			colors[k * 3] = color.r;
			colors[k * 3 + 1] = color.g;
			colors[k * 3 + 2] = color.b;
		}
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
		const material = new THREE.LineBasicMaterial({
			vertexColors: true,
			transparent: true,
			opacity: 0,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});
		const line = new THREE.Line(geometry, material);
		line.renderOrder = 5;
		arcGroup.add(line);
		arcs.push({
			i,
			j,
			weight,
			geometry,
			material,
			phase: rr(0, TAU),
			side: rr(-1, 1)
		});
	}
}

const queryRays = [];
for (let i = 0; i < TOKEN_COUNT; i += 1) {
	const positions = new Float32Array(6);
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	const material = new THREE.LineBasicMaterial({
		color: TOKEN_PALETTE[i],
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const line = new THREE.Line(geometry, material);
	arcGroup.add(line);
	const tip = glowSprite(TOKEN_PALETTE[i], 1.8, 0);
	arcGroup.add(tip);
	queryRays.push({ line, geometry, material, tip, phase: rr(0, TAU) });
}

const sparkleCount = arcs.length * 2;
const sparkleGeometry = new THREE.BufferGeometry();
const sparklePositions = new Float32Array(sparkleCount * 3);
const sparkleColors = new Float32Array(sparkleCount * 3);
const sparkleSizes = new Float32Array(sparkleCount);
const sparkleAlphas = new Float32Array(sparkleCount);
for (let i = 0; i < sparkleCount; i += 1) {
	const arc = arcs[Math.floor(i / 2)];
	const color = TOKEN_PALETTE[arc.i].clone().lerp(new THREE.Color(0xffffff), 0.35);
	sparkleColors[i * 3] = color.r;
	sparkleColors[i * 3 + 1] = color.g;
	sparkleColors[i * 3 + 2] = color.b;
	sparkleSizes[i] = rr(1.2, 2.2);
	sparkleAlphas[i] = 0;
}
sparkleGeometry.setAttribute("position", new THREE.BufferAttribute(sparklePositions, 3));
sparkleGeometry.setAttribute("aColor", new THREE.BufferAttribute(sparkleColors, 3));
sparkleGeometry.setAttribute("aSize", new THREE.BufferAttribute(sparkleSizes, 1));
sparkleGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(sparkleAlphas, 1));

const sparkleMaterial = new THREE.ShaderMaterial({
	uniforms: {},
	vertexShader: `
		attribute float aAlpha;
		attribute float aSize;
		attribute vec3 aColor;
		varying vec3 vColor;
		varying float vAlpha;
		void main() {
			vec4 mv = modelViewMatrix * vec4(position, 1.0);
			gl_PointSize = aSize * (250.0 / max(2.0, -mv.z));
			gl_Position = projectionMatrix * mv;
			vColor = aColor;
			vAlpha = aAlpha;
		}
	`,
	fragmentShader: `
		varying vec3 vColor;
		varying float vAlpha;
		void main() {
			vec2 q = gl_PointCoord - 0.5;
			float d = length(q);
			if (d > 0.5) discard;
			float a = smoothstep(0.5, 0.0, d);
			gl_FragColor = vec4(vColor, vAlpha * a);
		}
	`,
	transparent: true,
	blending: THREE.AdditiveBlending,
	depthWrite: false
});
const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
sparkles.renderOrder = 6;
scene.add(sparkles);

const residualSparkCount = TOKEN_COUNT * 2;
const residualSparkGeometry = new THREE.BufferGeometry();
const residualSparkPositions = new Float32Array(residualSparkCount * 3);
const residualSparkColors = new Float32Array(residualSparkCount * 3);
const residualSparkSizes = new Float32Array(residualSparkCount);
const residualSparkAlphas = new Float32Array(residualSparkCount);
for (let i = 0; i < residualSparkCount; i += 1) {
	const tokenIndex = Math.floor(i / 2);
	const color = TOKEN_PALETTE[tokenIndex].clone().lerp(new THREE.Color(0xffffff), 0.45);
	residualSparkColors[i * 3] = color.r;
	residualSparkColors[i * 3 + 1] = color.g;
	residualSparkColors[i * 3 + 2] = color.b;
	residualSparkSizes[i] = rr(1.5, 2.6);
}
residualSparkGeometry.setAttribute("position", new THREE.BufferAttribute(residualSparkPositions, 3));
residualSparkGeometry.setAttribute("aColor", new THREE.BufferAttribute(residualSparkColors, 3));
residualSparkGeometry.setAttribute("aSize", new THREE.BufferAttribute(residualSparkSizes, 1));
residualSparkGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(residualSparkAlphas, 1));
const residualSparks = new THREE.Points(residualSparkGeometry, sparkleMaterial);
residualSparks.renderOrder = 7;
scene.add(residualSparks);

const ffnGroup = new THREE.Group();
scene.add(ffnGroup);
const ffnMaterial = new THREE.LineBasicMaterial({
	vertexColors: true,
	transparent: true,
	opacity: 0,
	blending: THREE.AdditiveBlending,
	depthWrite: false
});
const ffnStreaks = [];
const FFN_STREAKS = 136;
const FFN_POINTS = 8;
const ffnBounds = { x: 22, y: 9, z: 12, yMin: -7, yMax: 13 };
const ffnPalette = [0x69d5ff, 0x9e8cff, 0x6affc4, 0xffc86a];
const ffnHalos = [];

function flowAt(x, y, z, t, out) {
	out.set(
		Math.sin(y * 0.36 + t * 0.55) + Math.cos(z * 0.27 - t * 0.35) * 0.9,
		Math.sin(z * 0.31 - t * 0.45) + Math.cos(x * 0.24 + t * 0.3) * 0.78,
		Math.sin(x * 0.21 + t * 0.4) + Math.cos(y * 0.29 + t * 0.32) * 0.78
	);
	return out.multiplyScalar(0.55);
}

for (let i = 0; i < FFN_STREAKS; i += 1) {
	const color = new THREE.Color(ffnPalette[i % ffnPalette.length]);
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array(FFN_POINTS * 3);
	const colors = new Float32Array(FFN_POINTS * 3);
	for (let k = 0; k < FFN_POINTS; k += 1) {
		const fade = 0.25 + 0.75 * (k / (FFN_POINTS - 1));
		const c = color.clone().multiplyScalar(fade);
		colors[k * 3] = c.r;
		colors[k * 3 + 1] = c.g;
		colors[k * 3 + 2] = c.b;
	}
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
	const line = new THREE.Line(geometry, ffnMaterial);
	line.renderOrder = 4;
	ffnGroup.add(line);
	ffnStreaks.push({
		line,
		geometry,
		positions,
		seed: new V3(rr(-ffnBounds.x, ffnBounds.x), rr(ffnBounds.yMin, ffnBounds.yMax), rr(-ffnBounds.z, ffnBounds.z)),
		phase: rr(0, TAU)
	});
}

for (let i = 0; i < 2; i += 1) {
	const color = new THREE.Color(i === 0 ? 0x6fe8ff : 0xb18cff);
	const halo = glowSprite(color, 16, 0);
	halo.position.set(i === 0 ? -6.6 : 6.8, i === 0 ? 4.2 : -2.6, -1);
	scene.add(halo);
	ffnHalos.push(halo);
}

const layerRingGroup = new THREE.Group();
layerRingGroup.position.set(0, 0.2, 0);
scene.add(layerRingGroup);
const layerRings = [];

for (let i = 0; i < 3; i += 1) {
	const radius = 10.5 + i * 3.4;
	const points = [];
	for (let k = 0; k < 140; k += 1) {
		const a = (k / 140) * TAU;
		points.push(new V3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
	}
	const material = new THREE.LineBasicMaterial({
		color: i === 0 ? 0x6fe7ff : i === 1 ? 0x9b8cff : 0xffc16b,
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material);
	ring.position.y = -2.2 + i * 2.1;
	ring.rotation.x = -Math.PI / 2;
	ring.rotation.z = rr(-0.06, 0.06);
	layerRingGroup.add(ring);
	layerRings.push({ ring, material, phase: rr(0, TAU) });
}

const dirOrigin = new V3(0, 0.85, 0);
const lastLayout = new V3(-9.6 + 5 * 3.84, 0.85 + Math.sin(5 * 1.25) * 0.34, Math.cos(5 * 1.35) * 1.15);
const lastDirection = lastLayout.clone().sub(dirOrigin).normalize();
const scoredClusters = clusters
	.filter((cluster) => !cluster.isSource)
	.map((cluster) => {
		const direction = cluster.group.position.clone().sub(dirOrigin);
		const distance = direction.length();
		direction.normalize();
		return { cluster, direction, distance, score: direction.dot(lastDirection) };
	})
	.filter((item) => item.distance > 12)
	.sort((a, b) => b.score - a.score);

let predictionTarget = null;
let candidates = [];
if (scoredClusters.length > 0) {
	const visible = scoredClusters.filter((item) =>
		item.cluster.base.x > 1 &&
		item.cluster.base.x < 34 &&
		item.cluster.base.z > -28 &&
		item.cluster.base.z < 8
	);
	const pool = visible.length > 3 ? visible : scoredClusters;
	predictionTarget = pool[0].cluster;
	candidates = pool.slice(0, 12);
	predictionTarget.isTarget = true;
	predictionTarget.glow.material.color.set(0xffe7ae);
	const attr = predictionTarget.points.geometry.getAttribute("aColor");
	for (let k = 0; k < attr.count; k += 1) {
		const original = new THREE.Color(attr.getX(k), attr.getY(k), attr.getZ(k));
		original.lerp(new THREE.Color(0xffe7ae), 0.38);
		attr.setXYZ(k, original.r, original.g, original.b);
	}
	attr.needsUpdate = true;
}

const dirGroup = new THREE.Group();
scene.add(dirGroup);

const originCore = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), orbMaterial(new THREE.Color(0xfff3c4)));
originCore.position.copy(dirOrigin);
dirGroup.add(originCore);
const originHalo = glowSprite(new THREE.Color(0xffedb0), 4.2, 0);
originHalo.position.copy(dirOrigin);
dirGroup.add(originHalo);
const originFlare = flareSprite(new THREE.Color(0xffedb0), 24, 2.6, 0);
originFlare.position.copy(dirOrigin);
dirGroup.add(originFlare);

const tokenDirRays = [];
for (let i = 0; i < TOKEN_COUNT; i += 1) {
	const positions = new Float32Array(10 * 3);
	const colors = new Float32Array(10 * 3);
	const color = TOKEN_PALETTE[i];
	for (let k = 0; k < 10; k += 1) {
		const t = k / 9;
		const c = color.clone().multiplyScalar(0.22 + 0.78 * Math.sin(Math.PI * Math.min(1, t * 1.25)));
		colors[k * 3] = c.r;
		colors[k * 3 + 1] = c.g;
		colors[k * 3 + 2] = c.b;
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
	const material = new THREE.LineBasicMaterial({
		vertexColors: true,
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const line = new THREE.Line(geometry, material);
	dirGroup.add(line);
	tokenDirRays.push({ line, geometry, material });
}

const candidateRays = [];
for (let i = 0; i < candidates.length; i += 1) {
	const item = candidates[i];
	const geometry = new THREE.BufferGeometry();
	const positions = new Float32Array(2 * 3);
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	const material = new THREE.LineBasicMaterial({
		color: item.cluster.isTarget ? 0xffe9b3 : item.cluster.color,
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const line = new THREE.Line(geometry, material);
	dirGroup.add(line);
	candidateRays.push({ line, geometry, material, item, phase: rr(0, TAU) });
}

const DIR_ARC_SEGMENTS = 28;
const dirArcGeometry = new THREE.BufferGeometry();
const dirArcPositions = new Float32Array(DIR_ARC_SEGMENTS * 3);
dirArcGeometry.setAttribute("position", new THREE.BufferAttribute(dirArcPositions, 3));
const dirArcMaterial = new THREE.LineBasicMaterial({
	color: 0xffe9ad,
	transparent: true,
	opacity: 0,
	blending: THREE.AdditiveBlending,
	depthWrite: false
});
const dirArc = new THREE.Line(dirArcGeometry, dirArcMaterial);
dirGroup.add(dirArc);

const dirSectorGeometry = new THREE.BufferGeometry();
const dirSectorPositions = new Float32Array((DIR_ARC_SEGMENTS - 1) * 9);
dirSectorGeometry.setAttribute("position", new THREE.BufferAttribute(dirSectorPositions, 3));
const dirSectorMaterial = new THREE.MeshBasicMaterial({
	color: 0xffdf92,
	transparent: true,
	opacity: 0,
	side: THREE.DoubleSide,
	blending: THREE.AdditiveBlending,
	depthWrite: false
});
const dirSector = new THREE.Mesh(dirSectorGeometry, dirSectorMaterial);
dirGroup.add(dirSector);

function slerpDirection(a, b, t, out) {
	const dot = clamp(a.dot(b), -1, 1);
	const theta = Math.acos(dot);
	if (theta < 0.0001) return out.copy(a);
	const sinTheta = Math.sin(theta);
	const wa = Math.sin((1 - t) * theta) / sinTheta;
	const wb = Math.sin(t * theta) / sinTheta;
	return out.copy(a).multiplyScalar(wa).addScaledVector(b, wb);
}

const HYPER_RADIUS = 17.6;
const hyperMaterial = new THREE.ShaderMaterial({
	uniforms: {
		uColorA: { value: new THREE.Color(0x5fe7ff) },
		uColorB: { value: new THREE.Color(0xb38cff) },
		uOpacity: { value: 0 },
		uTime: { value: 0 }
	},
	vertexShader: `
		varying vec3 vPos;
		varying vec3 vN;
		varying vec3 vV;
		void main() {
			vPos = position;
			vec4 mv = modelViewMatrix * vec4(position, 1.0);
			vN = normalize(normalMatrix * normal);
			vV = normalize(-mv.xyz);
			gl_Position = projectionMatrix * mv;
		}
	`,
	fragmentShader: `
		uniform vec3 uColorA;
		uniform vec3 uColorB;
		uniform float uOpacity;
		uniform float uTime;
		varying vec3 vPos;
		varying vec3 vN;
		varying vec3 vV;
		void main() {
			vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
			float fresnel = 1.0 - abs(dot(n, normalize(vV)));
			fresnel = pow(fresnel, 2.3);
			vec3 p = normalize(vPos);
			float latitude = 0.5 + 0.5 * sin(p.y * 23.0 + uTime * 0.24);
			float longitude = 0.5 + 0.5 * sin(atan(p.z, p.x) * 13.0 - uTime * 0.16);
			float grid = smoothstep(0.93, 1.0, latitude) * 0.55 + smoothstep(0.955, 1.0, longitude) * 0.28;
			vec3 color = mix(uColorA, uColorB, clamp(fresnel * 0.84 + latitude * 0.16, 0.0, 1.0));
			float alpha = (0.0025 + fresnel * 0.075 + grid * 0.018) * uOpacity;
			gl_FragColor = vec4(color, alpha);
		}
	`,
	transparent: true,
	blending: THREE.AdditiveBlending,
	depthWrite: false,
	side: THREE.DoubleSide
});
const hyperSphere = new THREE.Mesh(new THREE.SphereGeometry(HYPER_RADIUS, 64, 42), hyperMaterial);
hyperSphere.position.copy(dirOrigin);
dirGroup.add(hyperSphere);

const hyperRingMaterial = new THREE.LineBasicMaterial({
	color: 0x8be9ff,
	transparent: true,
	opacity: 0,
	blending: THREE.AdditiveBlending,
	depthWrite: false
});
const hyperRings = [];
for (let i = 0; i < 3; i += 1) {
	const points = [];
	for (let k = 0; k < 170; k += 1) {
		const a = (k / 170) * TAU;
		points.push(new V3(Math.cos(a) * HYPER_RADIUS, 0, Math.sin(a) * HYPER_RADIUS));
	}
	const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), hyperRingMaterial);
	line.position.copy(dirOrigin);
	line.rotation.x = i === 0 ? Math.PI / 2 : i === 1 ? 0.55 : 1.15;
	line.rotation.y = i === 1 ? 0.7 : -0.4;
	dirGroup.add(line);
	hyperRings.push(line);
}

const hyperProjections = [];
for (let i = 0; i < TOKEN_COUNT; i += 1) {
	const sprite = glowSprite(TOKEN_PALETTE[i], 2.9 * TOKEN_SIZES[i], 0);
	dirGroup.add(sprite);
	hyperProjections.push(sprite);
}

const pathArcs = [];
const PATH_ARC_SEGMENTS = 9;
const LAYER_FRACTIONS = [0, 0.24, 0.46, 0.68, 1];
for (let i = 0; i < TOKEN_COUNT; i += 1) {
	const positions = new Float32Array(4 * PATH_ARC_SEGMENTS * 6);
	const colors = new Float32Array(4 * PATH_ARC_SEGMENTS * 6);
	const color = TOKEN_PALETTE[i];
	for (let arc = 0; arc < 4; arc += 1) {
		for (let k = 0; k < PATH_ARC_SEGMENTS; k += 1) {
			const t = (arc + k / PATH_ARC_SEGMENTS) / 4;
			const c = color.clone().multiplyScalar(0.1 + 0.72 * t);
			const index = (arc * PATH_ARC_SEGMENTS + k) * 6;
			colors[index] = c.r;
			colors[index + 1] = c.g;
			colors[index + 2] = c.b;
			colors[index + 3] = c.r;
			colors[index + 4] = c.g;
			colors[index + 5] = c.b;
		}
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
	const material = new THREE.LineBasicMaterial({
		vertexColors: true,
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const line = new THREE.LineSegments(geometry, material);
	dirGroup.add(line);
	pathArcs.push({ line, geometry, material, positions });
}

const angleRingMaterial = new THREE.LineBasicMaterial({
	color: 0xffdfa0,
	transparent: true,
	opacity: 0,
	blending: THREE.AdditiveBlending,
	depthWrite: false
});
const angleRings = [];
const ANGLE_RING_POINTS = 100;
for (let r = 0; r < 3; r += 1) {
	const positions = new Float32Array(ANGLE_RING_POINTS * 3);
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	const line = new THREE.LineLoop(geometry, angleRingMaterial);
	dirGroup.add(line);
	angleRings.push({ line, geometry, positions, angle: 0.13 + r * 0.13 });
}

const angleItems = scoredClusters.slice(0, 18);
const angleDotCount = angleItems.length;
const angleDotGeometry = new THREE.BufferGeometry();
const angleDotPositions = new Float32Array(angleDotCount * 3);
const angleDotColors = new Float32Array(angleDotCount * 3);
const angleDotSizes = new Float32Array(angleDotCount);
const angleDotAlphas = new Float32Array(angleDotCount);
for (let i = 0; i < angleDotCount; i += 1) {
	const item = angleItems[i];
	const color = item.cluster.isTarget ? new THREE.Color(0xffe7ae) : item.cluster.color;
	angleDotColors[i * 3] = color.r;
	angleDotColors[i * 3 + 1] = color.g;
	angleDotColors[i * 3 + 2] = color.b;
	angleDotSizes[i] = item.cluster.isTarget ? 3.2 : rr(1.2, 2.1);
}
angleDotGeometry.setAttribute("position", new THREE.BufferAttribute(angleDotPositions, 3));
angleDotGeometry.setAttribute("aColor", new THREE.BufferAttribute(angleDotColors, 3));
angleDotGeometry.setAttribute("aSize", new THREE.BufferAttribute(angleDotSizes, 1));
angleDotGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(angleDotAlphas, 1));
const angleDots = new THREE.Points(angleDotGeometry, sparkleMaterial);
angleDots.renderOrder = 7;
dirGroup.add(angleDots);

const predictGroup = new THREE.Group();
scene.add(predictGroup);
const predictionBeams = [];
for (let i = 0; i < candidates.length; i += 1) {
	const item = candidates[i];
	const positions = new Float32Array(20 * 3);
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	const material = new THREE.LineBasicMaterial({
		color: item.cluster.isTarget ? 0xffe7ae : item.cluster.color,
		transparent: true,
		opacity: 0,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const line = new THREE.Line(geometry, material);
	predictGroup.add(line);
	predictionBeams.push({
		line,
		geometry,
		material,
		item,
		weight: item.cluster.isTarget ? 1 : Math.pow(Math.max(0.02, item.score), 4) * 0.56,
		phase: rr(0, TAU)
	});
}

const nextGroup = new THREE.Group();
scene.add(nextGroup);
const nextColor = new THREE.Color(0xffefba);
const nextCore = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 18), orbMaterial(nextColor));
nextGroup.add(nextCore);
const nextHalo = glowSprite(nextColor, 5.2, 0);
nextGroup.add(nextHalo);
const nextHaloOuter = glowSprite(nextColor, 15, 0);
nextGroup.add(nextHaloOuter);
const nextFlare = flareSprite(nextColor, 19, 2.2, 0);
nextGroup.add(nextFlare);
const NEXT_SLOT = new V3(13.15, 0.9, 0.75);

const PARAM_KEYS = [
	"cloud", "regions", "tokens", "base", "residual", "rays", "manifold", "shell",
	"subspaces", "attention", "slices", "ffn", "fibers", "layers", "dirs", "hyper", "pred"
];
const DEFAULT_PARAMS = {};
for (let i = 0; i < PARAM_KEYS.length; i += 1) DEFAULT_PARAMS[PARAM_KEYS[i]] = 0;

const STEPS = [
	{
		cam: [0, 17, 65],
		look: [0, -1.5, -6],
		fov: 55,
		orbit: 1.2,
		params: { cloud: 0.58, regions: 0.17, manifold: 0.34, shell: 0.38 }
	},
	{
		cam: [22, 13, 50],
		look: [0, -1, -5],
		fov: 52,
		orbit: 1.8,
		params: { cloud: 0.82, regions: 1, manifold: 0.55, shell: 0.58 }
	},
	{
		cam: [18, 13, 54],
		look: [0, 1.2, -9],
		fov: 52,
		orbit: 1.6,
		params: { cloud: 0.58, regions: 0.72, tokens: 1, base: 1, residual: 0.14, manifold: 0.6, shell: 0.6 }
	},
	{
		cam: [0, 7, 42],
		look: [0, 0, -4],
		fov: 50,
		orbit: 0.5,
		params: { cloud: 0.48, regions: 0.52, tokens: 1, base: 0.62, residual: 0.46, manifold: 0.75, shell: 0.5 }
	},
	{
		cam: [18, 11, 37],
		look: [0, 0, -2],
		fov: 48,
		orbit: 2.0,
		params: { cloud: 0.4, regions: 0.4, tokens: 1, base: 0.18, residual: 0.44, rays: 1, manifold: 1, shell: 0.52, subspaces: 0.15 }
	},
	{
		cam: [24, 19, 33],
		look: [0, 0, -1],
		fov: 50,
		orbit: 2.4,
		params: { cloud: 0.34, regions: 0.36, tokens: 1, base: 0.1, residual: 0.28, rays: 0.55, manifold: 0.62, shell: 0.52, subspaces: 0.65, attention: 1, slices: 1 }
	},
	{
		cam: [-23, 9, 35],
		look: [0, -0.2, -2],
		fov: 52,
		orbit: 1.6,
		params: { cloud: 0.34, regions: 0.36, tokens: 1, base: 0.08, residual: 0.38, rays: 0.7, manifold: 0.56, shell: 0.46, subspaces: 0.8, attention: 0.12, ffn: 1, fibers: 0.12 }
	},
	{
		cam: [21, 1, 39],
		look: [0, -1.4, -2],
		fov: 48,
		orbit: 2.2,
		params: { cloud: 0.34, regions: 0.38, tokens: 1, base: 0.18, residual: 0.66, rays: 0.4, manifold: 0.9, shell: 0.5, subspaces: 0.38, ffn: 0.2, fibers: 1, layers: 1 }
	},
	{
		cam: [16, 11, 44],
		look: [4, -1, -4],
		fov: 50,
		orbit: 1.0,
		params: { cloud: 0.44, regions: 0.55, tokens: 1, base: 0.12, residual: 0.3, rays: 0.18, manifold: 0.76, shell: 0.78, subspaces: 0.45, attention: 0.08, fibers: 0.55, layers: 0.55, dirs: 1, hyper: 1 }
	},
	{
		cam: [0, 8, 44],
		look: [5, -0.5, -2],
		fov: 48,
		orbit: 0.4,
		params: { cloud: 0.54, regions: 0.55, tokens: 1, base: 0.1, residual: 0.3, rays: 0.18, manifold: 0.7, shell: 0.56, subspaces: 0.34, fibers: 0.5, layers: 0.4, dirs: 0.45, hyper: 0.66, pred: 1 }
	},
	{
		cam: [0, 21, 64],
		look: [0, -1.5, -5],
		fov: 55,
		orbit: 1.8,
		params: { cloud: 0.95, regions: 0.85, tokens: 0.9, base: 0.2, residual: 0.35, rays: 0.23, manifold: 0.95, shell: 0.95, subspaces: 0.28, attention: 0.12, ffn: 0.08, fibers: 0.65, layers: 0.55, dirs: 0.5, hyper: 0.88, pred: 0.3 }
	}
];

STEPS.forEach((step) => {
	step.params = Object.assign({}, DEFAULT_PARAMS, step.params);
});

const current = Object.assign({}, STEPS[0].params);
let targetParams = STEPS[0].params;
let stepIndex = 0;
let stepStartedAt = performance.now() * 0.001;

const camGoal = new V3().fromArray(STEPS[0].cam);
const lookGoal = new V3().fromArray(STEPS[0].look);
const camPos = camGoal.clone();
const camLook = lookGoal.clone();
let fovGoal = STEPS[0].fov;
let fov = fovGoal;
let orbitGoal = STEPS[0].orbit;
let orbit = orbitGoal;
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
const userOrbit = { yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 };
let shockStart = -100;
renderer.domElement.style.cursor = "grab";

const dotsElement = document.getElementById("dots");
const dotButtons = [];
for (let i = 0; i < STEPS.length; i += 1) {
	const dot = document.createElement("button");
	dot.type = "button";
	dot.className = "dot";
	dot.setAttribute("aria-label", `Step ${i + 1}`);
	dot.addEventListener("click", () => {
		hideHint();
		applyStep(i, false);
	});
	dotsElement.appendChild(dot);
	dotButtons.push(dot);
}

const hint = document.getElementById("hint");
hint.addEventListener("click", () => {
	hideHint();
	navigate(1);
});

function hideHint() {
	hint.classList.add("is-hidden");
}

function updateDots() {
	for (let i = 0; i < dotButtons.length; i += 1) {
		dotButtons[i].classList.toggle("is-active", i === stepIndex);
		dotButtons[i].classList.toggle("is-done", i < stepIndex);
	}
}

function linePosition(i) {
	return new V3(
		-9.6 + i * 3.84,
		0.85 + Math.sin(i * 1.25) * 0.34,
		Math.cos(i * 1.35) * 1.15
	);
}

const FFN_POSITIONS = [
	new V3(-7.6, 3.2, 0.8),
	new V3(5.6, -2.8, -1.2),
	new V3(8.2, -4.6, -1.8),
	new V3(-6.0, 4.8, 0.2),
	new V3(-5.2, 2.1, 1.4),
	new V3(7.0, -1.4, -0.4)
];

function layerPosition(i) {
	const position = linePosition(i);
	position.y += 2.1;
	position.z += Math.sin(i * 1.9) * 0.8;
	return position;
}

function layoutFor(i, index = stepIndex) {
	if (index <= 2) return tokens[i].cluster.group.position;
	if (index === 6) return FFN_POSITIONS[i];
	if (index === 7) return layerPosition(i);
	return linePosition(i);
}

function applyStep(index, snap) {
	const count = STEPS.length;
	stepIndex = ((index % count) + count) % count;
	const step = STEPS[stepIndex];
	targetParams = step.params;
	camGoal.fromArray(step.cam);
	lookGoal.fromArray(step.look);
	fovGoal = step.fov;
	orbitGoal = step.orbit;
	stepStartedAt = performance.now() * 0.001;
	shockStart = performance.now() * 0.001;
	userOrbit.targetYaw = 0;
	userOrbit.targetPitch = 0;

	if (snap) {
		for (let i = 0; i < PARAM_KEYS.length; i += 1) {
			const key = PARAM_KEYS[i];
			current[key] = targetParams[key];
		}
		camPos.copy(camGoal);
		camLook.copy(lookGoal);
		fov = fovGoal;
		orbit = orbitGoal;
		userOrbit.yaw = 0;
		userOrbit.pitch = 0;
		for (let i = 0; i < tokens.length; i += 1) {
			tokens[i].pos.copy(layoutFor(i, stepIndex));
			tokens[i].group.position.copy(tokens[i].pos);
		}
	}
	updateDots();
}

function navigate(delta) {
	applyStep(stepIndex + delta, false);
}

window.addEventListener("keydown", (event) => {
	const key = event.key;
	if (key === "ArrowRight" || key === "ArrowDown" || key === " " || key === "PageDown" || key === "Enter") {
		event.preventDefault();
		hideHint();
		navigate(1);
	} else if (key === "ArrowLeft" || key === "ArrowUp" || key === "PageUp" || key === "Backspace") {
		event.preventDefault();
		hideHint();
		navigate(-1);
	} else if (key === "Home") {
		event.preventDefault();
		hideHint();
		applyStep(0, false);
	} else if (key === "End") {
		event.preventDefault();
		hideHint();
		applyStep(STEPS.length - 1, false);
	}
});

let dragging = false;
let lastPointer = null;
let hintHiddenByDrag = false;

window.addEventListener("pointerdown", (event) => {
	if (event.target.closest("#dots") || event.target.closest("#hint")) return;
	dragging = true;
	lastPointer = { x: event.clientX, y: event.clientY };
	renderer.domElement.style.cursor = "grabbing";
	if (!hintHiddenByDrag) {
		hintHiddenByDrag = true;
		hideHint();
	}
});

window.addEventListener("pointerup", () => {
	dragging = false;
	lastPointer = null;
	renderer.domElement.style.cursor = "grab";
});

window.addEventListener("pointercancel", () => {
	dragging = false;
	lastPointer = null;
	renderer.domElement.style.cursor = "grab";
});

window.addEventListener("pointermove", (event) => {
	if (dragging && lastPointer) {
		const dx = event.clientX - lastPointer.x;
		const dy = event.clientY - lastPointer.y;
		userOrbit.targetYaw -= dx * 0.0052;
		userOrbit.targetPitch = clamp(userOrbit.targetPitch - dy * 0.0038, -1.08, 1.08);
		lastPointer.x = event.clientX;
		lastPointer.y = event.clientY;
		return;
	}
	if (event.pointerType === "touch") return;
	mouse.tx = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.ty = -((event.clientY / window.innerHeight) * 2 - 1);
});

window.addEventListener("dblclick", (event) => {
	if (event.target.closest("#dots") || event.target.closest("#hint")) return;
	userOrbit.targetYaw = 0;
	userOrbit.targetPitch = 0;
});

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.setSize(window.innerWidth, window.innerHeight);
});

const tmpFlow = new V3();
const tmpDir = new V3();
const tmpPoint = new V3();
const tmpA = new V3();
const tmpB = new V3();
const tmpMid = new V3();
const tmpSide = new V3();
const tmpUp = new V3(0, 1, 0);
const tmpRoot = new V3();
const tmpC = new V3();
const hypQuery = new V3();
const hypSide = new V3();
const hypUp = new V3();
const hypRef = new V3();
const hypA = new V3();
const hypB = new V3();
const hypC = new V3();
const hypD = new V3();

function attentionOffsets() {
	const offsets = [];
	for (let i = 0; i < TOKEN_COUNT; i += 1) {
		let weightSum = 0;
		const sum = new V3();
		for (let j = 0; j < TOKEN_COUNT; j += 1) {
			if (i === j) continue;
			const weight = ATTENTION_W[i][j];
			sum.addScaledVector(tmpA.copy(tokens[j].pos).sub(tokens[i].pos), weight);
			weightSum += weight;
		}
		if (weightSum > 0) sum.multiplyScalar(1 / weightSum);
		offsets.push(sum);
	}
	return offsets;
}

function updateParams(dt) {
	for (let i = 0; i < PARAM_KEYS.length; i += 1) {
		const key = PARAM_KEYS[i];
		current[key] = damp(current[key], targetParams[key], 2.1, dt);
	}
}

function cycleInfo(now) {
	if (stepIndex === 9) {
		const phase = ((now - stepStartedAt) % 6.8 + 6.8) % 6.8;
		const beams = smoothstep(0.15, 1.1, phase) * (1 - smoothstep(6.1, 6.8, phase));
		const flare = smoothstep(0.5, 1.4, phase) * (1 - smoothstep(6.0, 6.7, phase));
		const orb = smoothstep(1.35, 3.7, phase) * (1 - smoothstep(6.1, 6.8, phase));
		const settle = smoothstep(3.3, 4.6, phase);
		return { phase, beams, flare, orb, settle, visible: 1 - smoothstep(6.15, 6.8, phase) };
	}
	if (stepIndex === 10) {
		return { phase: 4.8, beams: 0.45, flare: 0.6, orb: 1, settle: 1, visible: 1 };
	}
	return { phase: 0, beams: 0, flare: 0, orb: 0, settle: 0, visible: 0 };
}

function updateClusters(now, dt, cycle) {
	for (let i = 0; i < clusters.length; i += 1) {
		const cluster = clusters[i];
		cluster.group.position.y = sheetBaseY(cluster.base.x, cluster.base.z, now) + cluster.base.lift;
		const shimmer = 0.5 + 0.5 * Math.sin(now * (0.52 + (i % 7) * 0.04) + cluster.phase);
		let lit = current.regions * (0.3 + 0.7 * shimmer);
		if (cluster.isSource) {
			lit += current.tokens * 0.36 * (0.55 + 0.45 * Math.sin(now * 1.15 + cluster.phase * 1.8));
		}
		let flareTarget = 0;
		if (cluster === predictionTarget && stepIndex >= 8) {
			flareTarget = current.dirs * 0.44 * (0.62 + 0.38 * Math.sin(now * 1.35));
			flareTarget += current.pred * cycle.flare * 0.9;
		}
		cluster.flare = damp(cluster.flare, flareTarget, 2.4, dt);
		lit += cluster.flare;
		cluster.material.uniforms.uTime.value = now;
		cluster.material.uniforms.uOpacity.value = 0.035 + 0.52 * lit;
		const glowOpacity = 0.012 + 0.14 * lit + cluster.flare * 0.18;
		cluster.glow.material.opacity = glowOpacity;
		const pulse = 1 + 0.055 * Math.sin(now * 0.85 + cluster.phase);
		cluster.glow.scale.setScalar(cluster.glowScale * pulse * (1 + cluster.flare * 0.35));
	}
}

function updateTokens(dt, now) {
	const offsets = attentionOffsets();
	for (let i = 0; i < tokens.length; i += 1) {
		const token = tokens[i];
		const desired = layoutFor(i);
		desired.addScaledVector(offsets[i], current.attention * 0.42);
		desired.y += Math.sin(now * 0.8 + token.phase) * 0.035;
		desired.z += Math.cos(now * 0.62 + token.phase * 1.4) * 0.03;
		token.pos.x = damp(token.pos.x, desired.x, 1.85, dt);
		token.pos.y = damp(token.pos.y, desired.y, 1.85, dt);
		token.pos.z = damp(token.pos.z, desired.z, 1.85, dt);
		token.group.position.copy(token.pos);
		token.group.visible = current.tokens > 0.002;
		token.coreMat.uniforms.uOpacity.value = current.tokens;
		const aura = current.tokens * (i === 5 ? 1 + current.pred * 0.35 : 1);
		token.halo.material.opacity = aura * (0.58 + 0.08 * Math.sin(now * 1.2 + token.phase));
		token.haloOuter.material.opacity = aura * (0.12 + 0.02 * Math.sin(now * 0.8 + token.phase));
		token.halo.scale.setScalar(4.4 * token.size * (1 + 0.035 * Math.sin(now * 1.5 + token.phase)));
		token.haloOuter.scale.setScalar(13 * token.size * (1 + 0.025 * Math.sin(now * 0.7 + token.phase)));
		const flareBoost = i === 5 ? current.pred * 0.25 : 0;
		token.flare.material.opacity = current.tokens * (0.16 + 0.035 * Math.sin(now * 1.1 + token.phase)) + flareBoost;
		token.flare.scale.set(17 * token.size * (1 + 0.03 * Math.sin(now * 1.4 + token.phase)), 2.1 * token.size, 1);

		token.rayMaterial.opacity = current.rays * 0.52;
		token.rays.visible = current.rays > 0.002;
		const rayPositions = token.rayGeometry.getAttribute("position");
		flowAt(token.pos.x, token.pos.y, token.pos.z, now, token.flowDir);
		token.flowDir.normalize();
		for (let k = 0; k < RAY_COUNT; k += 1) {
			const baseDir = token.rayDirs[k];
			tmpDir.copy(baseDir).lerp(token.flowDir, current.ffn * 0.74);
			if (tmpDir.lengthSq() < 0.0001) tmpDir.copy(baseDir);
			tmpDir.normalize();
			const pulse = 0.58 + 0.42 * Math.sin(now * 0.85 + token.rayPhases[k]);
			const length = token.rayLengths[k] * pulse * token.size * (0.8 + current.rays * 0.6);
			rayPositions.setXYZ(k * 2, 0, 0, 0);
			rayPositions.setXYZ(k * 2 + 1, tmpDir.x * length, tmpDir.y * length, tmpDir.z * length);
		}
		rayPositions.needsUpdate = true;
	}
}

function updateRoots(now) {
	for (let i = 0; i < tokens.length; i += 1) {
		const token = tokens[i];
		tmpRoot.copy(token.cluster.group.position);
		token.rootMarker.position.copy(tmpRoot);
		const distance = token.pos.distanceTo(tmpRoot);
		const moved = smoothstep(0.8, 6, distance);
		token.rootMarker.material.opacity = current.tokens * (0.12 + 0.34 * current.base + 0.18 * moved) * (0.8 + 0.2 * Math.sin(now * 0.9 + token.phase));
		token.rootMarker.scale.setScalar(2.8 * token.size * (1 + 0.05 * Math.sin(now * 0.7 + token.phase)));
		token.rootMarker.visible = current.tokens > 0.002;

		const stemPositions = token.baseStemGeometry.getAttribute("position");
		const sheetY = sheetBaseY(token.rootX, token.rootZ, now) + 0.16;
		stemPositions.setXYZ(0, token.rootX, sheetY, token.rootZ);
		stemPositions.setXYZ(1, tmpRoot.x, tmpRoot.y, tmpRoot.z);
		stemPositions.needsUpdate = true;
		token.baseStemMaterial.opacity = current.tokens * current.base * 0.3;
		token.baseStem.visible = token.baseStemMaterial.opacity > 0.002;

		const cross = token.baseCrossGeometry.getAttribute("position");
		const arm = 0.85 * token.size;
		cross.setXYZ(0, tmpRoot.x - arm, tmpRoot.y, tmpRoot.z);
		cross.setXYZ(1, tmpRoot.x + arm, tmpRoot.y, tmpRoot.z);
		cross.setXYZ(2, tmpRoot.x, tmpRoot.y - arm, tmpRoot.z);
		cross.setXYZ(3, tmpRoot.x, tmpRoot.y + arm, tmpRoot.z);
		cross.setXYZ(4, tmpRoot.x, tmpRoot.y, tmpRoot.z - arm);
		cross.setXYZ(5, tmpRoot.x, tmpRoot.y, tmpRoot.z + arm);
		cross.needsUpdate = true;
		token.baseCrossMaterial.opacity = current.tokens * current.base * 0.5;
		token.baseCross.visible = token.baseCrossMaterial.opacity > 0.002;

		const positions = token.residualGeometry.getAttribute("position");
		for (let k = 0; k < 24; k += 1) {
			const t = k / 23;
			tmpPoint.copy(tmpRoot).lerp(token.pos, t);
			const bow = Math.sin(Math.PI * t) * (0.65 + 0.25 * Math.sin(now * 0.6 + token.phase));
			tmpPoint.y += bow;
			tmpPoint.x += Math.sin(now * 0.52 + token.phase + t * 2.4) * 0.12 * Math.sin(Math.PI * t);
			tmpPoint.z += Math.cos(now * 0.47 + token.phase * 1.3 + t * 2.2) * 0.1 * Math.sin(Math.PI * t);
			positions.setXYZ(k, tmpPoint.x, tmpPoint.y, tmpPoint.z);
		}
		positions.needsUpdate = true;
		token.residualMaterial.opacity = current.residual * 0.55;
		token.residualMaterial.visible = token.residualMaterial.opacity > 0.002;
	}
}

function updateResidualSparks(now) {
	const base = current.residual * 0.8 + current.fibers * 0.8;
	residualSparks.visible = base > 0.002;
	if (!residualSparks.visible) return;
	const positions = residualSparkGeometry.getAttribute("position");
	const alphas = residualSparkGeometry.getAttribute("aAlpha");
	for (let i = 0; i < residualSparkCount; i += 1) {
		const token = tokens[Math.floor(i / 2)];
		const sub = i % 2;
		tmpRoot.copy(token.cluster.group.position);
		const t = (now * (0.16 + sub * 0.022) + token.phase * 0.09 + sub * 0.52) % 1;
		tmpPoint.copy(tmpRoot).lerp(token.pos, t);
		const bow = Math.sin(Math.PI * t) * (0.65 + 0.25 * Math.sin(now * 0.6 + token.phase));
		tmpPoint.y += bow;
		tmpPoint.x += Math.sin(now * 0.52 + token.phase + t * 2.4) * 0.12 * Math.sin(Math.PI * t);
		tmpPoint.z += Math.cos(now * 0.47 + token.phase * 1.3 + t * 2.2) * 0.1 * Math.sin(Math.PI * t);
		positions.setXYZ(i, tmpPoint.x, tmpPoint.y, tmpPoint.z);
		alphas.setX(i, base * Math.pow(Math.sin(Math.PI * t), 1.25) * (0.65 + 0.35 * Math.sin(now * 2.1 + sub * 3.1)));
	}
	positions.needsUpdate = true;
	alphas.needsUpdate = true;
}

function updateSheet(now) {
	const positions = sheetGeometry.getAttribute("position");
	for (let i = 0; i < positions.count; i += 1) {
		const x = sheetX[i];
		const z = sheetZ[i];
		let y = sheetBaseY(x, z, now);
		for (let k = 0; k < tokens.length; k += 1) {
			const token = tokens[k];
			const dx = x - token.pos.x;
			const dz = z - token.pos.z;
			const bump = Math.exp(-(dx * dx + dz * dz) / 38) * current.tokens * 0.55 * token.size;
			y += bump;
		}
		positions.setY(i, y);
	}
	positions.needsUpdate = true;
	sheetMaterial.opacity = current.manifold * 0.17;
	sheetWireMaterial.opacity = current.manifold * 0.085;
	sheetMesh.visible = current.manifold > 0.002;
	sheetWire.visible = sheetMesh.visible;
}

function fiberPoint(token, strand, t, now, out) {
	tmpRoot.copy(token.cluster.group.position);
	out.copy(tmpRoot).lerp(token.pos, t);
	const envelope = Math.sin(Math.PI * t);
	const bend = envelope * 0.9;
	out.x += token.fiberBend.x * bend;
	out.z += token.fiberBend.z * bend;
	const swayX = (
		Math.sin(now * 0.5 + strand.phase + t * 3.0 + token.rootX * 0.05) * 0.9 +
		Math.sin(now * 0.83 + strand.phase * 1.6 + t * 5.1) * 0.32
	) * envelope * (0.7 + t * 1.5);
	const swayZ = (
		Math.cos(now * 0.43 + strand.phase * 1.2 + t * 2.6 + token.rootZ * 0.05) * 0.8 +
		Math.cos(now * 0.71 + strand.phase * 2.1 + t * 4.2) * 0.28
	) * envelope * (0.65 + t * 1.35);
	out.x += swayX + strand.ox * envelope * 1.05;
	out.z += swayZ + strand.oz * envelope * 1.05;
	out.y += Math.sin(now * 0.38 + strand.phase + t * 2.2) * 0.12 * envelope;
	return out;
}

function layerStage(now) {
	if (stepIndex !== 7) return -1;
	const progress = clamp((now - stepStartedAt) / 6.2, 0, 1);
	if (progress >= 0.97) return -1;
	return progress * 3;
}

function updateFibers(now) {
	const opacity = current.fibers * 0.34;
	const stage = layerStage(now);
	for (let i = 0; i < tokens.length; i += 1) {
		const token = tokens[i];
		token.fiberMaterial.opacity = opacity;
		token.fibers.visible = opacity > 0.002;
		if (token.fibers.visible) {
			const positions = token.fiberGeometry.getAttribute("position");
			for (let s = 0; s < token.fiberStrands.length; s += 1) {
				const strand = token.fiberStrands[s];
				for (let k = 0; k < 26; k += 1) {
					fiberPoint(token, strand, k / 26, now, tmpA);
					fiberPoint(token, strand, (k + 1) / 26, now, tmpB);
					const index = (s * 26 + k) * 2;
					positions.setXYZ(index, tmpA.x, tmpA.y, tmpA.z);
					positions.setXYZ(index + 1, tmpB.x, tmpB.y, tmpB.z);
				}
			}
			positions.needsUpdate = true;
		}
		for (let k = 0; k < token.echoes.length; k += 1) {
			const echo = token.echoes[k];
			const strand = token.fiberStrands[0];
			fiberPoint(token, strand, echo.fraction, now, tmpA);
			echo.sprite.position.copy(tmpA);
			const highlight = stage < 0 ? 0.32 : Math.exp(-Math.pow((stage - (k + 0.5)) * 1.75, 2));
			echo.sprite.material.opacity = current.fibers * (0.08 + highlight * 0.56);
			echo.sprite.scale.setScalar((2.5 - k * 0.45) * token.size * (1 + 0.06 * Math.sin(now * 0.9 + token.phase + k) + highlight * 0.18));
			echo.sprite.visible = current.fibers > 0.002;
		}
	}
}

function updateAttention(now) {
	const planePositions = slices.map((slice) => Math.sin(now * 0.3 + slice.spec.phase) * 14);
	for (let i = 0; i < arcs.length; i += 1) {
		const arc = arcs[i];
		const a = tokens[arc.i].pos;
		const b = tokens[arc.j].pos;
		tmpMid.copy(a).add(b).multiplyScalar(0.5);
		tmpA.copy(b).sub(a);
		tmpSide.crossVectors(tmpA, tmpUp);
		if (tmpSide.lengthSq() < 0.001) tmpSide.set(1, 0, 0);
		tmpSide.normalize();
		const distance = a.distanceTo(b);
		tmpMid.y += 2.2 + distance * 0.2;
		tmpMid.addScaledVector(tmpSide, arc.side * 1.3);
		const positions = arc.geometry.getAttribute("position");
		for (let k = 0; k < ARC_SEGMENTS; k += 1) {
			const t = k / (ARC_SEGMENTS - 1);
			const inv = 1 - t;
			tmpPoint.set(0, 0, 0)
				.addScaledVector(a, inv * inv)
				.addScaledVector(tmpMid, 2 * inv * t)
				.addScaledVector(b, t * t);
			positions.setXYZ(k, tmpPoint.x, tmpPoint.y, tmpPoint.z);
		}
		positions.needsUpdate = true;
		let sweep = 0.7;
		for (let s = 0; s < planePositions.length; s += 1) {
			const diff = planePositions[s] - (a.x + b.x) * 0.5;
			sweep = Math.max(sweep, 0.72 + 0.55 * Math.exp(-(diff * diff) / 24));
		}
		const shimmer = 0.62 + 0.38 * Math.sin(now * 1.75 + arc.phase);
		arc.material.opacity = current.attention * (0.055 + 0.72 * Math.pow(arc.weight, 1.35)) * shimmer * sweep;
		arc.material.visible = current.attention > 0.002;
	}

	for (let i = 0; i < queryRays.length; i += 1) {
		const gaze = queryRays[i];
		const token = tokens[i];
		const sum = tmpB.set(0, 0, 0);
		let weightSum = 0;
		for (let j = 0; j < TOKEN_COUNT; j += 1) {
			if (i === j) continue;
			const weight = ATTENTION_W[i][j];
			sum.addScaledVector(tmpA.copy(tokens[j].pos).sub(token.pos), weight);
			weightSum += weight;
		}
		if (weightSum > 0) sum.multiplyScalar(1 / weightSum);
		if (sum.lengthSq() < 0.0001) sum.set(1, 0, 0);
		sum.normalize();
		const end = tmpC.copy(token.pos).addScaledVector(sum, 3.3);
		const positions = gaze.geometry.getAttribute("position");
		positions.setXYZ(0, token.pos.x, token.pos.y, token.pos.z);
		positions.setXYZ(1, end.x, end.y, end.z);
		positions.needsUpdate = true;
		gaze.material.opacity = current.attention * (0.2 + 0.24 * Math.sin(now * 1.4 + gaze.phase));
		gaze.tip.position.copy(end);
		gaze.tip.material.opacity = current.attention * (0.3 + 0.18 * Math.sin(now * 1.7 + gaze.phase));
		gaze.line.visible = current.attention > 0.002;
		gaze.tip.visible = gaze.line.visible;
	}

	const sparklePositionsAttr = sparkleGeometry.getAttribute("position");
	const sparkleAlphaAttr = sparkleGeometry.getAttribute("aAlpha");
	for (let i = 0; i < sparkleCount; i += 1) {
		const arc = arcs[Math.floor(i / 2)];
		const sub = i % 2;
		const a = tokens[arc.i].pos;
		const b = tokens[arc.j].pos;
		tmpMid.copy(a).add(b).multiplyScalar(0.5);
		tmpA.copy(b).sub(a);
		tmpSide.crossVectors(tmpA, tmpUp);
		if (tmpSide.lengthSq() < 0.001) tmpSide.set(1, 0, 0);
		tmpSide.normalize();
		const distance = a.distanceTo(b);
		tmpMid.y += 2.2 + distance * 0.2;
		tmpMid.addScaledVector(tmpSide, arc.side * 1.3);
		const phase = (now * 0.48 + arc.phase + sub * 0.5) % 1;
		const t = phase;
		const inv = 1 - t;
		tmpPoint.set(0, 0, 0)
			.addScaledVector(a, inv * inv)
			.addScaledVector(tmpMid, 2 * inv * t)
			.addScaledVector(b, t * t);
		sparklePositionsAttr.setXYZ(i, tmpPoint.x, tmpPoint.y, tmpPoint.z);
		sparkleAlphaAttr.setX(i, current.attention * arc.weight * Math.pow(Math.sin(Math.PI * t), 2) * 0.9);
	}
	sparklePositionsAttr.needsUpdate = true;
	sparkleAlphaAttr.needsUpdate = true;
	sparkles.visible = current.attention > 0.002;

	for (let i = 0; i < slices.length; i += 1) {
		const slice = slices[i];
		slice.mesh.position.set(planePositions[i], 0.8 + Math.sin(now * 0.4 + slice.spec.phase) * 0.5, 0.3);
		slice.material.uniforms.uTime.value = now;
		slice.material.uniforms.uOpacity.value = current.slices;
		slice.mesh.visible = current.slices > 0.002;
	}

	subspaceGroup.visible = current.subspaces > 0.002;
	for (let i = 0; i < subspaces.length; i += 1) {
		const sub = subspaces[i];
		sub.group.rotation.x = sub.baseRot[0] + Math.sin(now * 0.12 + sub.phase) * 0.16;
		sub.group.rotation.y = sub.baseRot[1] + now * sub.speed;
		sub.group.rotation.z = sub.baseRot[2] + Math.cos(now * 0.1 + sub.phase) * 0.12;
		sub.material.uniforms.uOpacity.value = current.subspaces;
		sub.rimMaterial.opacity = current.subspaces * 0.22;
	}
}

function updateFFN(now, dt) {
	ffnGroup.visible = current.ffn > 0.002;
	ffnMaterial.opacity = current.ffn * 0.24;
	for (let i = 0; i < ffnHalos.length; i += 1) {
		ffnHalos[i].material.opacity = current.ffn * (0.09 + 0.03 * Math.sin(now * 0.8 + i));
		ffnHalos[i].scale.setScalar(16 * (1 + 0.05 * Math.sin(now * 0.6 + i * 1.4)));
	}
	if (!ffnGroup.visible) return;
	for (let i = 0; i < ffnStreaks.length; i += 1) {
		const streak = ffnStreaks[i];
		flowAt(streak.seed.x, streak.seed.y, streak.seed.z, now, tmpFlow);
		streak.seed.addScaledVector(tmpFlow, dt * 0.32);
		if (
			Math.abs(streak.seed.x) > ffnBounds.x ||
			streak.seed.y < ffnBounds.yMin ||
			streak.seed.y > ffnBounds.yMax ||
			Math.abs(streak.seed.z) > ffnBounds.z
		) {
			streak.seed.set(rr(-ffnBounds.x, ffnBounds.x), rr(ffnBounds.yMin, ffnBounds.yMax), rr(-ffnBounds.z, ffnBounds.z));
		}
		tmpPoint.copy(streak.seed);
		const positions = streak.geometry.getAttribute("position");
		for (let k = 0; k < FFN_POINTS; k += 1) {
			positions.setXYZ(k, tmpPoint.x, tmpPoint.y, tmpPoint.z);
			flowAt(tmpPoint.x, tmpPoint.y, tmpPoint.z, now, tmpFlow);
			tmpPoint.addScaledVector(tmpFlow, 0.62);
		}
		positions.needsUpdate = true;
	}
}

function updateDirs(now, cycle) {
	dirGroup.visible = current.dirs > 0.002 || current.hyper > 0.002;
	if (!dirGroup.visible) return;
	originCore.material.uniforms.uOpacity.value = current.dirs * 0.85;
	originHalo.material.opacity = current.dirs * (0.3 + 0.1 * Math.sin(now * 1.4));
	originHalo.scale.setScalar(4.2 * (1 + 0.06 * Math.sin(now * 1.1)));
	originFlare.material.opacity = current.dirs * (0.15 + 0.04 * Math.sin(now * 1.2));

	for (let i = 0; i < tokens.length; i += 1) {
		const token = tokens[i];
		const direction = tmpDir.copy(token.pos).sub(dirOrigin);
		const distance = direction.length();
		direction.normalize();
		const end = Math.max(17, distance * 1.8);
		const positions = tokenDirRays[i].geometry.getAttribute("position");
		for (let k = 0; k < 10; k += 1) {
			const t = k / 9;
			tmpPoint.copy(dirOrigin).addScaledVector(direction, end * t);
			positions.setXYZ(k, tmpPoint.x, tmpPoint.y, tmpPoint.z);
		}
		positions.needsUpdate = true;
		const isQuery = i === 5;
		tokenDirRays[i].material.opacity = current.dirs * (isQuery ? 0.62 : 0.13) * (0.7 + 0.3 * Math.sin(now * 1.3 + i));
		tokenDirRays[i].line.visible = true;
	}

	const queryDir = tmpDir.copy(tokens[5].pos).sub(dirOrigin).normalize();
	let bestCandidate = null;
	for (let i = 0; i < candidateRays.length; i += 1) {
		const candidate = candidateRays[i];
		const direction = tmpA.copy(candidate.item.cluster.group.position).sub(dirOrigin);
		direction.normalize();
		const end = 22;
		const positions = candidate.geometry.getAttribute("position");
		positions.setXYZ(0, dirOrigin.x, dirOrigin.y, dirOrigin.z);
		positions.setXYZ(1, dirOrigin.x + direction.x * end, dirOrigin.y + direction.y * end, dirOrigin.z + direction.z * end);
		positions.needsUpdate = true;
		const alignment = Math.max(0, direction.dot(queryDir));
		const isTarget = candidate.item.cluster === predictionTarget;
		candidate.material.opacity = current.dirs * (0.045 + 0.38 * Math.pow(alignment, 7)) * (0.7 + 0.3 * Math.sin(now * 1.1 + candidate.phase));
		if (isTarget) {
			candidate.material.opacity = Math.max(candidate.material.opacity, current.dirs * 0.52);
			bestCandidate = candidate;
		}
	}

	if (bestCandidate) {
		const targetDir = tmpC.copy(bestCandidate.item.cluster.group.position).sub(dirOrigin).normalize();
		const radius = 10.4;
		const arcPositions = dirArcGeometry.getAttribute("position");
		for (let k = 0; k < DIR_ARC_SEGMENTS; k += 1) {
			const t = k / (DIR_ARC_SEGMENTS - 1);
			slerpDirection(queryDir, targetDir, t, tmpA).multiplyScalar(radius).add(dirOrigin);
			arcPositions.setXYZ(k, tmpA.x, tmpA.y, tmpA.z);
		}
		arcPositions.needsUpdate = true;
		dirArcMaterial.opacity = current.dirs * 0.58;

		const sectorPositions = dirSectorGeometry.getAttribute("position");
		for (let k = 0; k < DIR_ARC_SEGMENTS - 1; k += 1) {
			const t1 = k / (DIR_ARC_SEGMENTS - 1);
			const t2 = (k + 1) / (DIR_ARC_SEGMENTS - 1);
			slerpDirection(queryDir, targetDir, t1, tmpA).multiplyScalar(radius).add(dirOrigin);
			slerpDirection(queryDir, targetDir, t2, tmpB).multiplyScalar(radius).add(dirOrigin);
			const base = k * 9;
			sectorPositions.setXYZ(base, dirOrigin.x, dirOrigin.y, dirOrigin.z);
			sectorPositions.setXYZ(base + 1, tmpA.x, tmpA.y, tmpA.z);
			sectorPositions.setXYZ(base + 2, tmpB.x, tmpB.y, tmpB.z);
		}
		sectorPositions.needsUpdate = true;
		const angle = Math.acos(clamp(queryDir.dot(targetDir), -1, 1));
		dirSectorMaterial.opacity = current.dirs * (0.035 + angle * 0.09);
		dirArc.visible = true;
		dirSector.visible = true;
	} else {
		dirArc.visible = false;
		dirSector.visible = false;
	}

	dirArcMaterial.opacity *= 0.85 + 0.15 * Math.sin(now * 1.6);
}

function updateHypersphere(now) {
	const amount = current.hyper;
	const visible = amount > 0.002;
	hyperSphere.visible = visible;
	angleDots.visible = visible;
	for (let i = 0; i < hyperRings.length; i += 1) hyperRings[i].visible = visible;
	for (let i = 0; i < angleRings.length; i += 1) angleRings[i].line.visible = visible;
	for (let i = 0; i < hyperProjections.length; i += 1) hyperProjections[i].visible = visible;
	for (let i = 0; i < pathArcs.length; i += 1) pathArcs[i].line.visible = visible;
	if (!visible) return;

	hyperMaterial.uniforms.uOpacity.value = amount;
	hyperMaterial.uniforms.uTime.value = now;
	hyperRingMaterial.opacity = amount * 0.055;
	angleRingMaterial.opacity = amount * (0.2 + 0.03 * Math.sin(now * 0.8));

	hypQuery.copy(tokens[5].pos).sub(dirOrigin);
	if (hypQuery.lengthSq() < 0.0001) hypQuery.set(1, 0, 0);
	hypQuery.normalize();
	hypRef.set(0, 1, 0);
	if (Math.abs(hypQuery.y) > 0.92) hypRef.set(1, 0, 0);
	hypSide.crossVectors(hypQuery, hypRef).normalize();
	hypUp.crossVectors(hypSide, hypQuery).normalize();

	for (let r = 0; r < angleRings.length; r += 1) {
		const ring = angleRings[r];
		const positions = ring.geometry.getAttribute("position");
		const cosAngle = Math.cos(ring.angle);
		const sinAngle = Math.sin(ring.angle);
		for (let k = 0; k < ANGLE_RING_POINTS; k += 1) {
			const phi = (k / ANGLE_RING_POINTS) * TAU;
			hypA.copy(hypQuery).multiplyScalar(cosAngle);
			hypA.addScaledVector(hypSide, Math.cos(phi) * sinAngle);
			hypA.addScaledVector(hypUp, Math.sin(phi) * sinAngle);
			hypA.normalize();
			positions.setXYZ(
				k,
				dirOrigin.x + hypA.x * HYPER_RADIUS,
				dirOrigin.y + hypA.y * HYPER_RADIUS,
				dirOrigin.z + hypA.z * HYPER_RADIUS
			);
		}
		positions.needsUpdate = true;
	}

	const dotPositions = angleDotGeometry.getAttribute("position");
	const dotAlphas = angleDotGeometry.getAttribute("aAlpha");
	for (let i = 0; i < angleDotCount; i += 1) {
		const item = angleItems[i];
		hypA.copy(item.cluster.group.position).sub(dirOrigin);
		if (hypA.lengthSq() < 0.0001) hypA.set(0, 1, 0);
		hypA.normalize();
		const alignment = Math.max(0, hypA.dot(hypQuery));
		dotPositions.setXYZ(
			i,
			dirOrigin.x + hypA.x * HYPER_RADIUS,
			dirOrigin.y + hypA.y * HYPER_RADIUS,
			dirOrigin.z + hypA.z * HYPER_RADIUS
		);
		let alpha = amount * (0.015 + 0.92 * Math.pow(alignment, 6)) * (0.7 + 0.3 * Math.sin(now * 1.25 + i));
		if (item.cluster === predictionTarget) alpha = Math.max(alpha, amount * 0.88);
		dotAlphas.setX(i, alpha);
	}
	dotPositions.needsUpdate = true;
	dotAlphas.needsUpdate = true;

	for (let i = 0; i < tokens.length; i += 1) {
		const token = tokens[i];
		hypA.copy(token.pos).sub(dirOrigin);
		if (hypA.lengthSq() < 0.0001) hypA.set(0, 1, 0);
		hypA.normalize();
		const projection = hyperProjections[i];
		projection.position.set(
			dirOrigin.x + hypA.x * HYPER_RADIUS,
			dirOrigin.y + hypA.y * HYPER_RADIUS,
			dirOrigin.z + hypA.z * HYPER_RADIUS
		);
		projection.material.opacity = amount * (0.38 + 0.1 * Math.sin(now * 1.3 + token.phase));
		projection.scale.setScalar(2.9 * token.size * (1 + 0.06 * Math.sin(now * 1.1 + token.phase)));
	}

	for (let i = 0; i < tokens.length; i += 1) {
		const token = tokens[i];
		const arc = pathArcs[i];
		const positions = arc.geometry.getAttribute("position");
		for (let a = 0; a < 4; a += 1) {
			fiberPoint(token, token.fiberStrands[0], LAYER_FRACTIONS[a], now, hypA);
			fiberPoint(token, token.fiberStrands[0], LAYER_FRACTIONS[a + 1], now, hypB);
			hypC.copy(hypA).sub(dirOrigin).normalize();
			hypD.copy(hypB).sub(dirOrigin).normalize();
			for (let k = 0; k < PATH_ARC_SEGMENTS; k += 1) {
				const t1 = k / PATH_ARC_SEGMENTS;
				const t2 = (k + 1) / PATH_ARC_SEGMENTS;
				slerpDirection(hypC, hypD, t1, hypA);
				slerpDirection(hypC, hypD, t2, hypB);
				const index = (a * PATH_ARC_SEGMENTS + k) * 2;
				positions.setXYZ(
					index,
					dirOrigin.x + hypA.x * HYPER_RADIUS,
					dirOrigin.y + hypA.y * HYPER_RADIUS,
					dirOrigin.z + hypA.z * HYPER_RADIUS
				);
				positions.setXYZ(
					index + 1,
					dirOrigin.x + hypB.x * HYPER_RADIUS,
					dirOrigin.y + hypB.y * HYPER_RADIUS,
					dirOrigin.z + hypB.z * HYPER_RADIUS
				);
			}
		}
		positions.needsUpdate = true;
		arc.material.opacity = amount * (i === 5 ? 0.38 : 0.16);
	}
}

function updateLayerRings(now) {
	layerRingGroup.visible = current.layers > 0.002;
	const stage = layerStage(now);
	for (let i = 0; i < layerRings.length; i += 1) {
		const ring = layerRings[i];
		const highlight = stage < 0 ? 0.25 : Math.exp(-Math.pow((stage - (i + 0.5)) * 1.9, 2));
		ring.material.opacity = current.layers * (0.045 + 0.2 * highlight + 0.02 * Math.sin(now * 0.7 + ring.phase));
		ring.ring.rotation.z = Math.sin(now * 0.13 + ring.phase) * 0.08;
		ring.ring.rotation.y = now * 0.02 + i * 0.4;
	}
}

function updatePrediction(now, cycle) {
	const last = tokens[5].pos;
	for (let i = 0; i < predictionBeams.length; i += 1) {
		const beam = predictionBeams[i];
		const target = beam.item.cluster.group.position;
		const positions = beam.geometry.getAttribute("position");
		tmpMid.copy(last).add(target).multiplyScalar(0.5);
		tmpMid.y += 2.0;
		tmpA.copy(target).sub(last);
		tmpSide.crossVectors(tmpA, tmpUp);
		if (tmpSide.lengthSq() < 0.001) tmpSide.set(0, 0, 1);
		tmpSide.normalize();
		tmpMid.addScaledVector(tmpSide, beam.phase > Math.PI ? 1.1 : -1.1);
		for (let k = 0; k < 20; k += 1) {
			const t = k / 19;
			const inv = 1 - t;
			tmpPoint.set(0, 0, 0)
				.addScaledVector(last, inv * inv)
				.addScaledVector(tmpMid, 2 * inv * t)
				.addScaledVector(target, t * t);
			positions.setXYZ(k, tmpPoint.x, tmpPoint.y, tmpPoint.z);
		}
		positions.needsUpdate = true;
		const shimmer = 0.55 + 0.45 * Math.sin(now * 1.7 + beam.phase);
		beam.material.opacity = current.pred * cycle.beams * beam.weight * shimmer * 0.6;
		beam.line.visible = beam.material.opacity > 0.002;
	}

	let visible = false;
	let opacity = 0;
	if (stepIndex === 10) {
		visible = true;
		opacity = current.pred * 1.25;
		nextGroup.position.copy(NEXT_SLOT);
	} else if (stepIndex === 9) {
		visible = cycle.orb > 0.001;
		opacity = current.pred * cycle.orb * cycle.visible;
		const target = predictionTarget ? predictionTarget.group.position : NEXT_SLOT;
		const t = smoothstep(0, 1, cycle.settle);
		tmpMid.copy(target).add(NEXT_SLOT).multiplyScalar(0.5);
		tmpMid.y += 3.2;
		const inv = 1 - t;
		tmpPoint.set(0, 0, 0)
			.addScaledVector(target, inv * inv)
			.addScaledVector(tmpMid, 2 * inv * t)
			.addScaledVector(NEXT_SLOT, t * t);
		nextGroup.position.copy(tmpPoint);
	}
	nextGroup.visible = visible;
	if (!visible) return;
	nextCore.material.uniforms.uOpacity.value = opacity;
	nextHalo.material.opacity = opacity * 0.75;
	nextHaloOuter.material.opacity = opacity * 0.18;
	nextFlare.material.opacity = opacity * 0.2;
	nextHalo.scale.setScalar(5.2 * (1 + 0.06 * Math.sin(now * 1.3)));
	nextHaloOuter.scale.setScalar(15 * (1 + 0.04 * Math.sin(now * 0.8)));
	nextFlare.scale.set(19 * (1 + 0.04 * Math.sin(now * 1.1)), 2.2, 1);
}

function updateBackground(now) {
	nebulaMaterial.uniforms.uTime.value = now;
	dust.material.uniforms.uTime.value = now;
	dust.material.uniforms.uOpacity.value = 0.16 + current.cloud * 0.42;
	dust.rotation.y = now * 0.004;
	shellMaterial.opacity = current.shell * 0.055;
	shellGroup.rotation.y = now * 0.006;
	shellGroup.rotation.x = Math.sin(now * 0.04) * 0.06;
	const shock = (now - shockStart) / 1.65;
	if (shock >= 0 && shock < 1) {
		shockRing.visible = true;
		shockRing.position.y = sheetBaseY(0, 0, now) + 0.24;
		shockRing.scale.setScalar(3.5 + shock * 34);
		shockMaterial.opacity = Math.pow(1 - shock, 2.2) * 0.23;
	} else {
		shockRing.visible = false;
	}
}

const camOffset = new V3();
const camSpherical = new THREE.Spherical();
const camFinal = new V3();

function updateCamera(now, dt) {
	camPos.x = damp(camPos.x, camGoal.x, 1.35, dt);
	camPos.y = damp(camPos.y, camGoal.y, 1.35, dt);
	camPos.z = damp(camPos.z, camGoal.z, 1.35, dt);
	camLook.x = damp(camLook.x, lookGoal.x, 1.75, dt);
	camLook.y = damp(camLook.y, lookGoal.y, 1.75, dt);
	camLook.z = damp(camLook.z, lookGoal.z, 1.75, dt);
	fov = damp(fov, fovGoal, 1.5, dt);
	orbit = damp(orbit, orbitGoal, 1.4, dt);
	mouse.x = damp(mouse.x, mouse.tx, 2.2, dt);
	mouse.y = damp(mouse.y, mouse.ty, 2.2, dt);
	userOrbit.yaw = damp(userOrbit.yaw, userOrbit.targetYaw, 2.6, dt);
	userOrbit.pitch = damp(userOrbit.pitch, userOrbit.targetPitch, 2.6, dt);
	if (Math.abs(camera.fov - fov) > 0.001) {
		camera.fov = fov;
		camera.updateProjectionMatrix();
	}
	camOffset.copy(camPos).sub(camLook);
	camSpherical.setFromVector3(camOffset);
	const interaction = clamp((Math.abs(userOrbit.yaw) + Math.abs(userOrbit.pitch)) / 1.15, 0, 1);
	const autoOrbit = Math.sin(now * 0.055 + stepIndex * 0.62) * orbit * 0.024 * (1 - interaction * 0.88);
	camSpherical.theta += autoOrbit + userOrbit.yaw;
	camSpherical.phi = clamp(camSpherical.phi + userOrbit.pitch, 0.18, Math.PI - 0.18);
	camFinal.setFromSpherical(camSpherical).add(camLook);
	camera.position.set(
		camFinal.x + mouse.x * 0.32 * (1 - interaction) + Math.sin(now * 0.21) * 0.22,
		camFinal.y + mouse.y * 0.2 * (1 - interaction) + Math.cos(now * 0.17) * 0.16,
		camFinal.z
	);
	camera.lookAt(camLook);
}

let last = performance.now() * 0.001;
let revealed = false;
const veil = document.getElementById("veil");

function frame(millis) {
	const now = millis * 0.001;
	const dt = Math.min(0.05, Math.max(0.0005, now - last));
	last = now;
	updateParams(dt);
	const cycle = cycleInfo(now);
	updateBackground(now);
	updateClusters(now, dt, cycle);
	updateTokens(dt, now);
	updateRoots(now);
	updateResidualSparks(now);
	updateSheet(now);
	updateFibers(now);
	updateAttention(now);
	updateFFN(now, dt);
	updateDirs(now, cycle);
	updateHypersphere(now);
	updatePrediction(now, cycle);
	updateLayerRings(now);
	updateCamera(now, dt);
	renderer.render(scene, camera);
	if (!revealed) {
		revealed = true;
		requestAnimationFrame(() => veil.classList.add("gone"));
	}
	requestAnimationFrame(frame);
}

const params = new URLSearchParams(window.location.search);
const rawStep = Number.parseInt(params.get("step") || "0", 10);
const requestedStep = Number.isFinite(rawStep) ? clamp(rawStep, 0, STEPS.length - 1) : 0;
applyStep(requestedStep, true);
window.__llmStep = (index) => applyStep(index, false);
requestAnimationFrame(frame);

})();
