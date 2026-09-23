/* ============================================================
   THE ATLAS — From Big Bang to ChatGPT
   A single continuous camera: from a street on Earth, out past
   the Moon, the solar system, the galaxies, to the CMB backdrop.
   Every named person, place, institution, author and event in
   the course is a dot; every influence / journey / signal is a
   thread. Drag to look around, scroll to zoom, click to explore.
   ============================================================ */
var __atlasBooted = false;

function bootAtlas() {
	'use strict';

	var wrap = document.getElementById('atlas-canvas-wrap');
	var canvas = document.getElementById('atlas-canvas');
	if (!wrap || !canvas || !window.THREE) { return Promise.resolve(); }

	function stageSize() {
		return { w: wrap.clientWidth || 800, h: wrap.clientHeight || 600 };
	}
	function resizeToStage() {
		var s = stageSize();
		camera.aspect = s.w / s.h;
		camera.updateProjectionMatrix();
		renderer.setSize(s.w, s.h);
	}

	// ── constants ─────────────────────────────────────────────
	var DEG = Math.PI / 180;
	var EARTH_R = 1;
	var MOON_R = 0.27;
	var MOON_DIST = 3.4;         // Moon's distance from Earth's center
	var SUN_POS = [85, 6, -20];
	var GALAXY_R = 210;
	var FILAMENT_R = [260, 440]; // cosmic-web shell
	var QUESTION_R = [380, 600]; // "?" world shell
	var WEB_PHOTO_DIST = 300;    // flat cosmic-web photo, in front of camera
	var CMB_PHOTO_DIST = 320;    // flat CMB photo, always in front of camera
	var STAR_R = 470;
	var MIN_D = 1.45, MAX_D = 620;

	var THEME = {};
	function readTheme() {
		// UI chrome (panels, text) follows the course theme; the 3D scene
		// itself is always "space" — dark around the Earth in both themes,
		// with an earth-like blue/green palette.
		THEME.light = !document.documentElement.classList.contains('dark');
		THEME.ocean = '#123a5e';
		THEME.land = '#3f5d3a';
		THEME.border = 'rgba(200,220,240,.35)';
		THEME.graticule = 'rgba(140,170,210,.12)';
		THEME.bg = '#05070d';
	}
	readTheme();

	var lessonTitle = {};
	(function () {
		var nav = window.__moduleNavData && window.__moduleNavData.modules;
		if (!nav) { return; }
		for (var i = 0; i < nav.length; i++) { lessonTitle[nav[i].slug] = nav[i].title; }
	})();

	var TYPE_COLOR = {
		person: '#ff7a6b',
		place: '#38bdf8',
		institution: '#fbbf24',
		event: '#c084fc',
		artifact: '#34d399',
		author: '#8ab4ff'
	};
	var TYPE_LABEL = {
		person: 'People', place: 'Places', institution: 'Institutions',
		event: 'Events', artifact: 'Artifacts', author: 'Cited authors'
	};
	var THREAD_COLOR = { influence: '#8ab4ff', journey: '#f472b6', signal: '#34d399' };
	var THREAD_LABEL = { influence: 'Influence', journey: 'Journeys', signal: 'Signals' };

	// ── state ─────────────────────────────────────────────────
	var state = {
		entities: [],
		authors: [],
		threads: [],
		dots: [],           // flattened: {ref, type, lat, lng, yearA, yearB, isMoon}
		theta: -0.4, phi: 1.15, d: 3.2,
		tTheta: -0.4, tPhi: 1.15, tD: 3.2,
		year: 2026,
		show: { person: true, place: true, institution: true, event: true, artifact: true, author: true },
		showBg: false,
		tshow: { influence: true, journey: true, signal: true },
		selected: null,
		hovered: null,
		touring: false
	};

	// ── data loading ──────────────────────────────────────────
	var loader = document.getElementById('atlas-loader');
	function loadJSON(url) {
		return fetch(url, { cache: 'no-cache' }).then(function (r) {
			if (!r.ok) { throw new Error(url + ' ' + r.status); }
			return r.json();
		});
	}
	function start() {
		readTheme();
		return Promise.all([
			loadJSON('atlas/entities.json'),
			loadJSON('atlas/authors.json'),
			loadJSON('atlas/world.json'),
			loadJSON('atlas/threads.json').catch(function () { return []; })
		]).then(function (data) {
			state.entities = data[0] || [];
			state.authors = data[1] || [];
			window.ATLAS_WORLD = data[2] || { land: [], borders: [] };
			state.threads = data[3] || [];
			buildDots();
			buildScene();
			buildUI();
			requestAnimationFrame(tick);
			setTimeout(function () { loader.classList.add('hide'); }, 300);
		}).catch(function (err) {
			console.error('[atlas] failed to start:', err);
			loader.querySelector('p').textContent =
				'Could not load atlas data (' + err.message + ').';
		});
	}

	// ── helpers ───────────────────────────────────────────────
	function latLngToVec3(lat, lng, r) {
		var phi = (lng + 180) * DEG;
		var th = (90 - lat) * DEG;
		var st = Math.sin(th);
		return new THREE.Vector3(-r * st * Math.cos(phi), r * Math.cos(th), r * st * Math.sin(phi));
	}
	function isMoonEntity(e) {
		var t = (e.name + ' ' + (e.loc || '')).toLowerCase();
		return t.indexOf('moon') !== -1 || t.indexOf('lunar') !== -1 ||
			t.indexOf('tranquility') !== -1 || t.indexOf('apollo') !== -1;
	}
	function yearRange(a, b) {
		// "exists at state.year"; the slider's max position means "all time"
		var T = state.year;
		if (T >= 2026) { return true; }
		if (a !== null && a !== undefined && a > T) { return false; }
		if (b !== null && b !== undefined && b < T) { return false; }
		return true;
	}
	function isActive(e) {
		var a = e.active || [null, null];
		return yearRange(a[0], a[1]);
	}
	function dotVisible(d) {
		if (!state.show[d.type]) { return false; }
		if (d.bg && !state.showBg) { return false; }
		if (!yearRange(d.yearA, d.yearB)) { return false; }
		if (d.isAuthor && state.year < 2026 && state.year < (d.year || 0) - 2) { return false; }
		return true;
	}

	function buildDots() {
		state.dots = [];
		state.entities.forEach(function (e) {
			if (e.lat === null || e.lng === null) { return; }
			state.dots.push({
				ref: e, type: e.type, lat: e.lat, lng: e.lng,
				yearA: (e.active || [null, null])[0],
				yearB: (e.active || [null, null])[1],
				isMoon: isMoonEntity(e),
				isAuthor: false,
				bg: e.type === 'place' && e.bg === true
			});
		});
		state.authors.forEach(function (a) {
			if (a.lat === null || a.lng === null) { return; }
			var yr = a.year || a.maxyear || 2000;
			state.dots.push({
				ref: a, type: 'author', lat: a.lat, lng: a.lng,
				yearA: null, yearB: null,
				year: yr,
				isMoon: false, isAuthor: true
			});
		});
	}

	// ── scene ─────────────────────────────────────────────────
	var renderer, scene, camera, earth, moon, sun, planets = [];
	var dotMesh, dotInstance = [], dotBaseColor = [], spotTargetIdx = -1;
	var threadGroup, threadObjs = [];
	var starField, galaxyGroup, atmosphere, sunSp;
	var raycaster = new THREE.Raycaster();
	var mouseNDC = new THREE.Vector2();

	function makeRadialTexture(inner, outer, size) {
		var c = document.createElement('canvas');
		c.width = c.height = size;
		var g = c.getContext('2d');
		var grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
		grad.addColorStop(0, inner);
		grad.addColorStop(0.5, outer);
		grad.addColorStop(1, 'rgba(0,0,0,0)');
		g.fillStyle = grad;
		g.fillRect(0, 0, size, size);
		var t = new THREE.CanvasTexture(c);
		return t;
	}

	function makeSpiralTexture() {
		var c = document.createElement('canvas');
		c.width = c.height = 256;
		var g = c.getContext('2d');
		g.translate(128, 128);
		for (var arm = 0; arm < 4; arm++) {
			g.beginPath();
			for (var t = 0; t < 90; t++) {
				var a = t * 0.13 + arm * (Math.PI / 2);
				var r = 2 + t * 1.35;
				var x = Math.cos(a) * r, y = Math.sin(a) * r;
				if (t === 0) { g.moveTo(x, y); } else { g.lineTo(x, y); }
			}
			g.strokeStyle = 'rgba(150,170,255,.5)';
			g.lineWidth = 3;
			g.stroke();
		}
		var grad = g.createRadialGradient(0, 0, 0, 0, 0, 60);
		grad.addColorStop(0, 'rgba(255,240,220,.9)');
		grad.addColorStop(1, 'rgba(255,240,220,0)');
		g.fillStyle = grad;
		g.fillRect(-128, -128, 256, 256);
		return new THREE.CanvasTexture(c);
	}

	function buildScene() {
		scene = new THREE.Scene();
		var sz = stageSize();
		camera = new THREE.PerspectiveCamera(48, sz.w / sz.h, 0.01, 4000);
		scene.add(camera);

		renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		renderer.setClearColor(new THREE.Color(THEME.bg), 1);
		new THREE.TextureLoader().load('starfield_eso.jpg', function (tex) {
			if (THREE.sRGBEncoding !== undefined) { tex.encoding = THREE.sRGBEncoding; }
			scene.background = tex;
		});
		resizeToStage();
		scene.add(new THREE.AmbientLight(0xffffff, 0.85));
		var sun = new THREE.DirectionalLight(0xffffff, 0.9);
		sun.position.set(2, 1.4, 1.6);
		scene.add(sun);

		buildEarth();
		buildMoon();
	buildCelestial();
		buildDotsMesh();
		buildThreads();
		applyCamera();

		window.__ATLAS_DEBUG = {
			state: state,
			scene: function () { return scene; },
			sun: function () { return sunSp; },
			planets: planets,
			goStep: goStep,
			startTour: startTour,
			stopTour: stopTour,
			dotMesh: function () { return dotMesh; },
			findDot: findDot,
			setSpotHighlight: setSpotHighlight,
			clearSpotHighlight: clearSpotHighlight,
			asparagus: function () { return asparagusSprite; },
			revealAsparagus: revealAsparagus,
			asparagusSetGate: function (ms) { qWorldEnteredAt = Date.now() - ms; },
			camera: function () { return camera; }
		};
	}

	function buildEarth() {
		var geo = new THREE.SphereGeometry(EARTH_R, 64, 48);
		var mat = new THREE.MeshPhongMaterial({
			color: 0x14315a, shininess: 8, specular: new THREE.Color(0x1a2333)
		});
		new THREE.TextureLoader().load('earth_texture.png', function (tex) {
			if (THREE.sRGBEncoding !== undefined) { tex.encoding = THREE.sRGBEncoding; }
			mat.map = tex;
			mat.color.set(0xffffff);
			mat.needsUpdate = true;
		});
		earth = new THREE.Mesh(geo, mat);
		scene.add(earth);

		atmosphere = new THREE.Sprite(new THREE.SpriteMaterial({
			map: makeRadialTexture('rgba(120,170,255,.55)', 'rgba(60,110,220,.18)', 256),
			transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
		}));
		atmosphere.scale.set(2.9, 2.9, 1);
		scene.add(atmosphere);
	}

	function buildMoon() {
		// grey fallback first so the Moon is always visible even if the
		// Ranger 7 texture is missing or fails to load
		var mat = new THREE.MeshPhongMaterial({ color: 0x8a8f9a, shininess: 2 });
		new THREE.TextureLoader().load('moon_texture.png', function (tex) {
			if (THREE.sRGBEncoding !== undefined) { tex.encoding = THREE.sRGBEncoding; }
			mat.map = tex;
			mat.color.set(0xffffff);
			mat.needsUpdate = true;
		});
		var geo = new THREE.SphereGeometry(MOON_R, 40, 30);
		moon = new THREE.Mesh(geo, mat);
		// park the Moon inside the initial view: a bit to the right and
		// above the Earth, along the camera's own look direction
		var dir = new THREE.Vector3(
			Math.sin(state.phi) * Math.cos(state.theta),
			Math.cos(state.phi),
			Math.sin(state.phi) * Math.sin(state.theta)
		);
		var right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
		var moonDir = dir.clone().addScaledVector(right, 0.55).add(new THREE.Vector3(0, 0.32, 0)).normalize();
		moon.position.copy(moonDir.multiplyScalar(MOON_DIST));
		scene.add(moon);
	}

	function buildCelestial() {
		// starfield
		var n = 2600, pos = new Float32Array(n * 3);
		for (var i = 0; i < n; i++) {
			var u = Math.random() * 2 - 1;
			var a = Math.random() * Math.PI * 2;
			var s = Math.sqrt(1 - u * u);
			pos[i * 3] = s * Math.cos(a) * STAR_R;
			pos[i * 3 + 1] = u * STAR_R;
			pos[i * 3 + 2] = s * Math.sin(a) * STAR_R;
		}
		var sg = new THREE.BufferGeometry();
		sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		starField = new THREE.Points(sg, new THREE.PointsMaterial({
			color: 0xcfd8ff, size: 1.4, sizeAttenuation: true,
			transparent: true, opacity: 0.9, depthWrite: false
		}));
		scene.add(starField);

		buildFilaments();
		buildWebPhoto();
		buildCmbPhoto();
		buildQuestionWorld();

		// galaxies (stylized spirals)
		galaxyGroup = new THREE.Group();
		var spiralTex = makeSpiralTexture();
		for (var gi = 0; gi < 9; gi++) {
			var sp = new THREE.Sprite(new THREE.SpriteMaterial({
				map: spiralTex, transparent: true, opacity: 0, depthWrite: false
			}));
			var u = Math.random() * 2 - 1;
			var a = Math.random() * Math.PI * 2;
			var s = Math.sqrt(1 - u * u);
			var dist = GALAXY_R * (0.75 + Math.random() * 0.35);
			sp.position.set(s * Math.cos(a) * dist, u * dist * 0.8, s * Math.sin(a) * dist);
			var sc = 40 + Math.random() * 70;
			sp.scale.set(sc, sc, 1);
			galaxyGroup.add(sp);
		}
		scene.add(galaxyGroup);

		// sun
		sunSp = new THREE.Sprite(new THREE.SpriteMaterial({
			map: makeRadialTexture('rgba(255,250,230,1)', 'rgba(255,190,90,.5)', 256),
			transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false
		}));
		sunSp.position.set(SUN_POS[0], SUN_POS[1], SUN_POS[2]);
		sunSp.scale.set(26, 26, 1);
		scene.add(sunSp);

		// planets: real order, log-scaled orbits around the sun, sizes by
		// radius^0.45 (stylized but ordered); coplanar orbits through SUN_POS
		var palette = [0x9c8f84, 0xe8c46a, 0x4a90d9, 0xc1440e, 0xd8a25a, 0xe0c9a6, 0x9ad1e8, 0x4a6fd0];
		var radii = [0.58, 0.88, 0.9, 0.68, 2.65, 2.44, 1.67, 1.66];
		var orbits = [16.5, 19.8, 21.5, 23.8, 30.4, 33.6, 37.3, 39.7];
		var planetTex = ['solsys_mercury.jpg', 'solsys_venus.jpg', 'solsys_earth.jpg', 'solsys_mars.jpg', 'solsys_jupiter.jpg', 'solsys_saturn.jpg', 'solsys_uranus.jpg', 'solsys_neptune.jpg'];
		var texLoader = new THREE.TextureLoader();
		for (var pi = 0; pi < 8; pi++) {
			var pmat = new THREE.MeshPhongMaterial({ color: palette[pi], shininess: 6, transparent: true, opacity: 0 });
			texLoader.load(planetTex[pi], (function (m) {
				return function (tex) {
					if (THREE.sRGBEncoding !== undefined) { tex.encoding = THREE.sRGBEncoding; }
					m.map = tex;
					m.needsUpdate = true;
				};
			})(pmat));
			var pm = new THREE.Mesh(new THREE.SphereGeometry(radii[pi], 20, 14), pmat);
			var pa = pi * 2.399963;
			pm.position.set(
				SUN_POS[0] + Math.cos(pa) * orbits[pi],
				SUN_POS[1],
				SUN_POS[2] + Math.sin(pa) * orbits[pi]
			);
			pm.userData.angle = pa;
			pm.userData.dist = orbits[pi];
			pm.userData.speed = 0.02 * Math.pow(16.5 / orbits[pi], 1.5);
			pm.visible = false;
			planets.push(pm);
			scene.add(pm);
		}
	}

	// ── deep space: filaments, CMB photo, the question world ──
	var filamentGroup, filamentLines, filamentNodes = [];
	var webPhoto;
	var cmbPhoto;
	var questionGroup, questionSprites = [], asparagusSprite, asparagusFound = false, qWorldEnteredAt = null;

	function buildFilaments() {
		// a procedurally generated cosmic web: ~110 glowing nodes in a
		// shell, each linked to its two nearest neighbours
		filamentGroup = new THREE.Group();
		var N = 110, nodes = [];
		for (var i = 0; i < N; i++) {
			var u = Math.random() * 2 - 1;
			var a = Math.random() * Math.PI * 2;
			var s = Math.sqrt(1 - u * u);
			var r = FILAMENT_R[0] + Math.random() * (FILAMENT_R[1] - FILAMENT_R[0]);
			nodes.push(new THREE.Vector3(s * Math.cos(a) * r, u * r * 0.75, s * Math.sin(a) * r));
		}
		var seen = {}, pts = [];
		for (i = 0; i < N; i++) {
			var dists = [];
			for (var j = 0; j < N; j++) {
				if (j === i) { continue; }
				dists.push([nodes[i].distanceTo(nodes[j]), j]);
			}
			dists.sort(function (p, q) { return p[0] - q[0]; });
			for (var k = 0; k < 2; k++) {
				var lo = Math.min(i, dists[k][1]), hi = Math.max(i, dists[k][1]);
				var key = lo + '-' + hi;
				if (seen[key]) { continue; }
				seen[key] = 1;
				pts.push(nodes[lo].clone(), nodes[hi].clone());
			}
		}
		filamentLines = new THREE.LineSegments(
			new THREE.BufferGeometry().setFromPoints(pts),
			new THREE.LineBasicMaterial({
				color: 0x6f86c8, transparent: true, opacity: 0, depthWrite: false
			})
		);
		filamentGroup.add(filamentLines);

		var nodeTex = makeRadialTexture('rgba(200,215,255,.9)', 'rgba(120,150,255,.3)', 64);
		nodes.forEach(function (p) {
			var sp = new THREE.Sprite(new THREE.SpriteMaterial({
				map: nodeTex, transparent: true, opacity: 0, depthWrite: false
			}));
			sp.position.copy(p);
			var sc = 6 + Math.random() * 14;
			sp.scale.set(sc, sc, 1);
			filamentNodes.push(sp);
			filamentGroup.add(sp);
		});
		scene.add(filamentGroup);
	}

	function buildCmbPhoto() {
		// the WMAP map shown as a flat 2:1 photograph floating in front
		// of the camera — no 3D sphere, just the photo
		var tex = new THREE.TextureLoader().load('wmap_cmb.png');
		cmbPhoto = new THREE.Mesh(
			new THREE.PlaneGeometry(830, 415),
			new THREE.MeshBasicMaterial({
				map: tex, transparent: true, opacity: 0,
				depthWrite: false, side: THREE.DoubleSide
			})
		);
		scene.add(cmbPhoto);
	}

	function buildWebPhoto() {
		// a real large-scale-structure render (Springel / MPA Garching) shown
		// as a flat photograph at the cosmic-web stage
		var tex = new THREE.TextureLoader().load('cosmic_web_foam.jpg');
		webPhoto = new THREE.Mesh(
			new THREE.PlaneGeometry(720, 480),
			new THREE.MeshBasicMaterial({
				map: tex, transparent: true, opacity: 0,
				depthWrite: false, side: THREE.DoubleSide
			})
		);
		scene.add(webPhoto);
	}

	function makeQuestionTexture() {
		var c = document.createElement('canvas');
		c.width = c.height = 128;
		var g = c.getContext('2d');
		g.font = '900 100px Georgia, serif';
		g.textAlign = 'center';
		g.textBaseline = 'middle';
		g.fillStyle = '#ffffff';
		g.fillText('?', 64, 70);
		return new THREE.CanvasTexture(c);
	}

	function makeAsparagusTexture() {
		var c = document.createElement('canvas');
		c.width = 512; c.height = 128;
		var g = c.getContext('2d');
		g.font = '700 40px Georgia, "Times New Roman", serif';
		g.textAlign = 'center';
		g.textBaseline = 'middle';
		g.fillStyle = '#ffffff';
		var word = 'ASPARAGUS';
		var n = word.length;
		var margin = 42, midY = 66, amp = 15;
		var totalW = 512 - margin * 2;
		var step = totalW / (n - 1);
		for (var i = 0; i < n; i++) {
			var t = i / (n - 1);
			var phase = Math.PI * t;
			var x = margin + i * step;
			var y = midY - amp * Math.sin(phase);
			var ang = Math.atan2(-amp * Math.PI * Math.cos(phase), totalW);
			g.save();
			g.translate(x, y);
			g.rotate(ang);
			g.fillText(word.charAt(i), 0, 0);
			g.restore();
		}
		return new THREE.CanvasTexture(c);
	}

	function buildQuestionWorld() {
		// the final zoom: a field of question marks, one giant "?" where
		// everything used to be
		questionGroup = new THREE.Group();
		var qTex = makeQuestionTexture();
		var n = 240;
		for (var i = 0; i < n; i++) {
			var u = Math.random() * 2 - 1;
			var a = Math.random() * Math.PI * 2;
			var s = Math.sqrt(1 - u * u);
			var r = QUESTION_R[0] + Math.random() * (QUESTION_R[1] - QUESTION_R[0]);
			var sp = new THREE.Sprite(new THREE.SpriteMaterial({
				map: qTex, color: (Math.random() < 0.03 ? 0xff5a5a : 0x9fb4ff),
				transparent: true, opacity: 0, depthWrite: false
			}));
			sp.position.set(s * Math.cos(a) * r, u * r * 0.8, s * Math.sin(a) * r);
			var sc = 14 + Math.random() * 26;
			sp.scale.set(sc, sc, 1);
			questionSprites.push(sp);
			questionGroup.add(sp);
		}
		var big = new THREE.Sprite(new THREE.SpriteMaterial({
			map: qTex, color: 0xcdd8ff,
			transparent: true, opacity: 0, depthWrite: false
		}));
		big.scale.set(140, 140, 1);
		questionSprites.push(big);
		questionGroup.add(big);

		asparagusSprite = new THREE.Sprite(new THREE.SpriteMaterial({
			map: makeAsparagusTexture(), color: 0xcdeab4,
			transparent: true, opacity: 0, depthWrite: false
		}));
		asparagusSprite.position.set(0, 40, -460);
		asparagusSprite.scale.set(100, 25, 1);
		camera.add(asparagusSprite);

		scene.add(questionGroup);
	}

	// ── dots (instanced) ──────────────────────────────────────
	function buildDotsMesh() {
		var geo = new THREE.SphereGeometry(0.012, 8, 6);
		var mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
		dotMesh = new THREE.InstancedMesh(geo, mat, state.dots.length);
		dotMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		var dummy = new THREE.Object3D();
		var col = new THREE.Color();
		for (var i = 0; i < state.dots.length; i++) {
			var d = state.dots[i];
			dotInstance[i] = d;
			col.set(TYPE_COLOR[d.type] || '#ffffff');
			dotBaseColor[i] = col.clone();
			dotMesh.setColorAt(i, col);
			dummy.position.set(0, 0, -9999);
			dummy.updateMatrix();
			dotMesh.setMatrixAt(i, dummy.matrix);
		}
		if (dotMesh.instanceColor) { dotMesh.instanceColor.needsUpdate = true; }
		scene.add(dotMesh);
	}

	function updateDots() {
		var dummy = new THREE.Object3D();
		var shown = 0;
		for (var i = 0; i < state.dots.length; i++) {
			var d = dotInstance[i];
			var on = dotVisible(d);
			if (on) {
				var base = dotWorldPos(d, 0.004);
				dummy.position.copy(base);
				var sc = d.isAuthor ? 0.7 : 1.0;
				if (i === spotTargetIdx) { sc *= 2.8; }
				dummy.scale.set(sc, sc, sc);
				shown++;
			} else {
				dummy.position.set(0, 0, -9999);
				dummy.scale.set(0.0001, 0.0001, 0.0001);
			}
			dummy.updateMatrix();
			dotMesh.setMatrixAt(i, dummy.matrix);
		}
		dotMesh.instanceMatrix.needsUpdate = true;
		updateCount(shown);
	}

	// ── threads ───────────────────────────────────────────────
	function greatCircle(a, b, lift, n) {
		var A = a.clone().normalize(), B = b.clone().normalize();
		var ang = Math.acos(THREE.MathUtils.clamp(A.dot(B), -1, 1));
		var pts = [];
		for (var i = 0; i <= n; i++) {
			var t = i / n;
			var s1 = Math.sin((1 - t) * ang) / Math.sin(ang || 1e-6);
			var s2 = Math.sin(t * ang) / Math.sin(ang || 1e-6);
			var v = A.multiplyScalar(s1).add(B.multiplyScalar(s2)).normalize();
			var r = EARTH_R + 0.01 + lift * ang * Math.sin(Math.PI * t);
			pts.push(v.multiplyScalar(r));
		}
		return pts;
	}
	function dotWorldPos(d, pad) {
		var r = (d.isMoon ? MOON_R : EARTH_R) + pad;
		var base = latLngToVec3(d.lat, d.lng, r);
		if (d.isMoon) {
			return moon.position.clone().add(base);
		}
		return base;
	}
	function dotPos(d) {
		return dotWorldPos(d, 0.01);
	}
	function findDot(id) {
		for (var i = 0; i < state.dots.length; i++) {
			var d = state.dots[i];
			if (d.ref && d.ref.id === id) { return d; }
		}
		return null;
	}
	function buildThreads() {
		threadGroup = new THREE.Group();
		threadObjs = [];
		state.threads.forEach(function (t) {
			var kind = t.kind || 'influence';
			var pts = [];
			if (kind === 'journey') {
				var seq = (t.path || []);
				var first = findDot(t.person);
				var nodes = [];
				if (first) { nodes.push(first); }
				seq.forEach(function (id) { var d = findDot(id); if (d) { nodes.push(d); } });
				for (var i = 0; i < nodes.length - 1; i++) {
					pts = pts.concat(greatCircle(dotPos(nodes[i]), dotPos(nodes[i + 1]), 0.5, 24));
				}
			} else {
				var A = findDot(t.from), B = findDot(t.to);
				if (A && B) {
					pts = greatCircle(dotPos(A), dotPos(B), kind === 'signal' ? 0.9 : 0.5, 32);
				}
			}
			if (pts.length < 2) { return; }
			var geo = new THREE.BufferGeometry().setFromPoints(pts);
			var mat = new THREE.LineBasicMaterial({
				color: THREAD_COLOR[kind] || '#888888',
				transparent: true, opacity: 0.5, depthWrite: false
			});
			var line = new THREE.Line(geo, mat);
			line.userData.thread = t;
			line.visible = false;
			threadGroup.add(line);
			threadObjs.push(line);
		});
		scene.add(threadGroup);
		updateThreads();
	}
	function updateThreads() {
		threadObjs.forEach(function (ln) {
			var t = ln.userData.thread;
			var ok = state.tshow[t.kind || 'influence'] &&
				yearRange(t.y1, t.y2) && state.d < 26;
			ln.visible = ok;
			if (ok) {
				ln.material.opacity = 0.5 * (1 - THREE.MathUtils.smoothstep(state.d, 18, 26));
			}
		});
	}
	function highlightThreads(id) {
		threadObjs.forEach(function (ln) {
			var t = ln.userData.thread;
			var hit = t.person === id || t.from === id || t.to === id ||
				(t.path && t.path.indexOf(id) !== -1);
			ln.material.opacity = hit ? 0.95 : (ln.visible ? 0.15 : 0.15);
		});
	}

	var spotHi = new THREE.Color();
	var SPOT_BG = new THREE.Color('#05070d');
	function setSpotHighlight(id) {
		if (!dotMesh || !dotMesh.instanceColor) { return; }
		var hot = findDot(id);
		spotTargetIdx = hot ? state.dots.indexOf(hot) : -1;
		for (var i = 0; i < dotInstance.length; i++) {
			var base = dotBaseColor[i];
			if (!base) { continue; }
			if (i === spotTargetIdx) {
				spotHi.copy(base).lerp(new THREE.Color(0xffffff), 0.5);
			} else {
				spotHi.copy(base).lerp(SPOT_BG, 0.72);
			}
			dotMesh.setColorAt(i, spotHi);
		}
		dotMesh.instanceColor.needsUpdate = true;
		updateDots();
	}
	function clearSpotHighlight() {
		if (!dotMesh || !dotMesh.instanceColor) { return; }
		spotTargetIdx = -1;
		for (var i = 0; i < dotInstance.length; i++) {
			if (dotBaseColor[i]) { dotMesh.setColorAt(i, dotBaseColor[i]); }
		}
		dotMesh.instanceColor.needsUpdate = true;
		updateDots();
	}

	// ── camera ────────────────────────────────────────────────
	function applyCamera() {
		// the tour flies slower and more cinematically than hand control
		var k = state.touring ? 0.04 : 0.12;
		state.theta += (state.tTheta - state.theta) * k;
		state.phi += (state.tPhi - state.phi) * k;
		state.d += (state.tD - state.d) * k;
		var sp = Math.sin(state.phi);
		camera.position.set(
			state.d * sp * Math.cos(state.theta),
			state.d * Math.cos(state.phi),
			state.d * sp * Math.sin(state.theta)
		);
		camera.lookAt(0, 0, 0);
		updateZoomFade();
	}
	function updateZoomFade() {
		var d = state.d;
		var starO = (0.35 + 0.6 * THREE.MathUtils.smoothstep(d, 6, 40))
			* (1 - THREE.MathUtils.smoothstep(d, 470, 560));
		if (starField) { starField.material.opacity = starO; }
		// galaxies are a mid-zoom view; fully gone well before the web
		var galO = THREE.MathUtils.smoothstep(d, 24, 90) * (1 - THREE.MathUtils.smoothstep(d, 160, 280));
		galaxyGroup.children.forEach(function (s) { s.material.opacity = galO * 0.8; });
		// the cosmic web sits between the galaxies and the CMB photo
		var filO = THREE.MathUtils.smoothstep(d, 120, 220) * (1 - THREE.MathUtils.smoothstep(d, 330, 430));
		if (filamentLines) { filamentLines.material.opacity = filO * 0.3; }
		filamentNodes.forEach(function (s) { s.material.opacity = filO * 0.85; });
		// the real cosmic-web photo appears at the web stage, then gives
		// way to the CMB photo
		var webO = THREE.MathUtils.smoothstep(d, 150, 240) * (1 - THREE.MathUtils.smoothstep(d, 330, 380));
		if (webPhoto) { webPhoto.material.opacity = webO; }
		// the CMB photo appears only at the very end, and gives way to
		// the question world
		var cmbO = THREE.MathUtils.smoothstep(d, 320, 400) * (1 - THREE.MathUtils.smoothstep(d, 480, 560));
		if (cmbPhoto) { cmbPhoto.material.opacity = cmbO; }
		// the question-mark world is the final stop
		var qO = THREE.MathUtils.smoothstep(d, 490, 570);
		questionSprites.forEach(function (s) { s.material.opacity = qO * (s === questionSprites[questionSprites.length - 1] ? 0.95 : 0.55); });
		if (asparagusSprite) {
			if (qO > 0.1) {
				if (qWorldEnteredAt === null) { qWorldEnteredAt = Date.now(); }
			} else if (qO < 0.05) {
				qWorldEnteredAt = null;
			}
			var asparagusGate = 0;
			if (qWorldEnteredAt !== null) {
				asparagusGate = THREE.MathUtils.clamp((Date.now() - qWorldEnteredAt - 30000) / 2000, 0, 1);
			}
			asparagusSprite.material.opacity = qO * asparagusGate;
		}
		// the solar system (sun + planets) is a mid-zoom view: it fades in
		// as we pull off the Moon and is fully gone before the galaxies stop
		var solarO = THREE.MathUtils.smoothstep(d, 14, 45) * (1 - THREE.MathUtils.smoothstep(d, 90, 135));
		if (sunSp) { sunSp.material.opacity = solarO; sunSp.visible = solarO > 0.01; }
		planets.forEach(function (p) { p.material.opacity = solarO; p.visible = solarO > 0.01; });
		var atmO = 1 - THREE.MathUtils.smoothstep(d, 2.6, 6);
		if (atmosphere) { atmosphere.material.opacity = atmO; }
	}

	// ── interaction ───────────────────────────────────────────
	var dragging = false, lastX = 0, lastY = 0, moved = 0;
	function bindInput() {
		canvas.addEventListener('mousedown', function (e) {
			dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
			canvas.classList.add('dragging');
			resetTourTimer();
		});
		window.addEventListener('mouseup', function () {
			dragging = false; canvas.classList.remove('dragging');
		});
		window.addEventListener('mousemove', function (e) {
			if (dragging) {
				var dx = e.clientX - lastX, dy = e.clientY - lastY;
				moved += Math.abs(dx) + Math.abs(dy);
				state.tTheta -= dx * 0.005;
				state.tPhi = THREE.MathUtils.clamp(state.tPhi - dy * 0.005, 0.15, Math.PI - 0.15);
				lastX = e.clientX; lastY = e.clientY;
				resetTourTimer();
			}
			onMove(e);
		});
		canvas.addEventListener('wheel', function (e) {
			e.preventDefault();
			state.tD = THREE.MathUtils.clamp(
				state.tD * Math.pow(1.0015, e.deltaY), MIN_D, MAX_D);
		}, { passive: false });
		canvas.addEventListener('click', function (e) {
			if (moved > 6) { return; }
			pick(e.clientX, e.clientY, true);
		});
		window.addEventListener('resize', resizeToStage);
		if (typeof ResizeObserver !== 'undefined') {
			new ResizeObserver(function () {
				if (!wrap.clientWidth) { return; }
				requestAnimationFrame(resizeToStage);
			}).observe(wrap);
		}
		// touch
		var tId = null, pinch = null;
		canvas.addEventListener('touchstart', function (e) {
			if (e.touches.length === 1) {
				tId = e.touches[0].identifier;
				lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; moved = 0;
			} else if (e.touches.length === 2) {
				pinch = touchDist(e);
			}
		}, { passive: true });
		canvas.addEventListener('touchmove', function (e) {
			if (e.touches.length === 1 && tId !== null) {
				var t = e.touches[0];
				var dx = t.clientX - lastX, dy = t.clientY - lastY;
				moved += Math.abs(dx) + Math.abs(dy);
				state.tTheta -= dx * 0.006;
				state.tPhi = THREE.MathUtils.clamp(state.tPhi - dy * 0.006, 0.15, Math.PI - 0.15);
				lastX = t.clientX; lastY = t.clientY;
			} else if (e.touches.length === 2) {
				var nd = touchDist(e);
				if (pinch) {
					state.tD = THREE.MathUtils.clamp(state.tD * (pinch / nd), MIN_D, MAX_D);
				}
				pinch = nd;
			}
			e.preventDefault();
		}, { passive: false });
		canvas.addEventListener('touchend', function (e) {
			if (e.touches.length < 2) { pinch = null; }
			if (e.touches.length === 0) {
				if (moved <= 8) { pick(lastX, lastY, true); }
				tId = null;
			}
		}, { passive: true });
	}
	function touchDist(e) {
		var a = e.touches[0], b = e.touches[1];
		return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
	}
	function onMove(e) {
		if (dragging) { return; }
		pick(e.clientX, e.clientY, false);
	}
	function pick(px, py, isClick) {
		var rect = canvas.getBoundingClientRect();
		mouseNDC.x = ((px - rect.left) / rect.width) * 2 - 1;
		mouseNDC.y = -((py - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(mouseNDC, camera);
		raycaster.params.Points = { threshold: 0.02 };
		if (isClick && asparagusSprite && asparagusSprite.material.opacity > 0.05) {
			if (raycaster.intersectObject(asparagusSprite).length) { revealAsparagus(); }
		}
		var hits = raycaster.intersectObject(dotMesh);
		var found = null;
		for (var i = 0; i < hits.length; i++) {
			var iid = hits[i].instanceId;
			if (iid === undefined) { continue; }
			var d = dotInstance[iid];
			if (dotVisible(d)) { found = d; break; }
		}
		if (isClick) {
			if (found) { selectDot(found); }
			else { clearSelection(); }
		} else {
			setHover(found, px, py);
		}
	}
	function revealAsparagus() {
		if (asparagusFound) { return; }
		asparagusFound = true;
		if (asparagusSprite) {
			asparagusSprite.material.color.set(0xffffff);
			asparagusSprite.scale.set(120, 30, 1);
		}
		var el = document.getElementById('atlas-easter');
		if (el) { el.style.display = 'block'; }
	}

	// ── selection / detail ────────────────────────────────────
	var detail = document.getElementById('atlas-detail');
	var tip = document.getElementById('atlas-tip');
	function selectDot(d) {
		state.selected = d;
		var ref = d.ref;
		var html = '';
		html += '<button class="d-close" id="d-close" title="Close">&times;</button>';
		var tcol = TYPE_COLOR[d.type] || '#fff';
		html += '<span class="type-chip" style="color:' + tcol + '">' +
			TYPE_LABEL[d.type] + '</span>';
		html += '<h2></h2>';
		var meta = [];
		if (ref.loc) { meta.push('<b>Where:</b> ' + esc(ref.loc)); }
		if (d.isAuthor) { meta.push('<b>Active:</b> ~' + esc(String(d.year))); }
		else if (ref.years) { meta.push('<b>When:</b> ' + esc(ref.years)); }
		if (ref.conf) { meta.push('<span style="opacity:.6">(' + esc(ref.conf) + ')</span>'); }
		html += '<div class="d-meta">' + meta.join(' &middot; ') + '</div>';
		if (ref.blurb) { html += '<p class="d-blurb"></p>'; }
		// lessons it is cited from
		var slugs = ref.cited_in || [];
		if (slugs.length) {
			html += '<div class="d-label">Cited in this Chautauqua</div><div class="d-links">';
			slugs.forEach(function (s) {
				html += '<a class="d-link" href="' + esc(s) + '.php">' +
					esc(lessonTitle[s] || s) + '</a>';
			});
			html += '</div>';
		}
		// cited works (authors / persons with bibkeys)
		var keys = (d.isAuthor ? ref.keys : ref.bibkeys) || [];
		if (keys.length) {
			html += '<div class="d-label">Works on the map (' + keys.length +
				')</div><div id="d-works"><div class="d-none">Loading…</div></div>';
		}
		// threads count
		var tc = 0;
		state.threads.forEach(function (t) {
			if (t.person === ref.id || t.from === ref.id || t.to === ref.id ||
				(t.path && t.path.indexOf(ref.id) !== -1)) { tc++; }
		});
		if (tc) {
			html += '<div class="d-label">' + tc + ' thread' + (tc > 1 ? 's' : '') +
				' connect here</div>';
			html += '<button class="atlas-btn d-threadbtn" id="d-threads">Show threads</button>';
		}
		detail.innerHTML = html;
		detail.querySelector('h2').textContent = ref.name;
		if (ref.blurb) { detail.querySelector('.d-blurb').textContent = ref.blurb; }
		detail.classList.add('open');
		detail.querySelector('#d-close').addEventListener('click', clearSelection);
		var tb = detail.querySelector('#d-threads');
		if (tb) {
			tb.addEventListener('click', function () {
				highlightThreads(ref.id);
				if (state.d > 8) { state.tD = 3.4; }
			});
			setTimeout(function () { highlightThreads(null); }, 4000);
		}
		if (keys.length) { loadWorks(keys); }
		flyTo(d);
	}
	function esc(s) {
		return String(s).replace(/[&<>"']/g, function (m) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
		});
	}
	function loadWorks(keys) {
		loadJSON('atlas/bibliography.json').then(function (bib) {
			var box = detail.querySelector('#d-works');
			if (!box) { return; }
			var html = '';
			keys.forEach(function (k) {
				var e = bib.entries && bib.entries[k];
				if (!e) { return; }
				var y = e.year ? '<span class="wy">(' + esc(e.year) + ')</span> ' : '';
				var link = e.url
					? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.title) + '</a>'
					: esc(e.title);
				html += '<div class="d-work">' + y + link + '</div>';
			});
			box.innerHTML = html || '<div class="d-none">No works recorded.</div>';
		}).catch(function () {
			var box = detail.querySelector('#d-works');
			if (box) { box.innerHTML = '<div class="d-none">Bibliography unavailable.</div>'; }
		});
	}
	function clearSelection() {
		state.selected = null;
		detail.classList.remove('open');
		highlightThreads(null);
	}
	function flyTo(d) {
		// orient so the dot faces the camera, at a comfortable distance
		var v = dotWorldPos(d, 0);
		state.tTheta = Math.atan2(v.z, v.x);
		state.tPhi = Math.acos(THREE.MathUtils.clamp(v.y / v.length(), -1, 1));
		state.tD = d.isMoon ? 4.8 : 3.1;
	}
	function setHover(d, px, py) {
		state.hovered = d;
		if (d) {
			var sub = d.isAuthor ? '~' + d.year : (d.ref.years || '');
			tip.innerHTML = '<div class="t-name"></div><div class="t-sub"></div>';
			tip.querySelector('.t-name').textContent = d.ref.name;
			tip.querySelector('.t-sub').textContent =
				TYPE_LABEL[d.type] + (sub ? ' · ' + sub : '');
			tip.style.display = 'block';
			tip.style.left = (px + 14) + 'px';
			tip.style.top = (py + 14) + 'px';
			canvas.style.cursor = 'pointer';
		} else {
			tip.style.display = 'none';
			canvas.style.cursor = 'grab';
		}
	}

	// ── UI ────────────────────────────────────────────────────
	function buildUI() {
		var filters = document.getElementById('atlas-filters');
		var html = '<h3>Legend</h3>';
		Object.keys(TYPE_LABEL).forEach(function (k) {
			html += '<label class="atlas-check"><input type="checkbox" data-t="' + k +
				'" checked><span class="sw" style="background:' + TYPE_COLOR[k] +
				'"></span>' + TYPE_LABEL[k] + '</label>';
		});
		html += '<label class="atlas-check" style="margin-top:6px"><input type="checkbox" id="atlas-bg-places">' +
			'<span class="sw" style="background:#8892a8"></span>Background places</label>';
		html += '<h3 style="margin-top:12px">Threads</h3>';
		Object.keys(THREAD_LABEL).forEach(function (k) {
			html += '<label class="atlas-check"><input type="checkbox" data-th="' + k +
				'" checked><span class="sw" style="background:' + THREAD_COLOR[k] +
				'"></span>' + THREAD_LABEL[k] + '</label>';
		});
		filters.innerHTML = html;
		filters.querySelectorAll('[data-t]').forEach(function (cb) {
			cb.addEventListener('change', function () {
				state.show[cb.dataset.t] = cb.checked;
				updateDots();
			});
		});
		filters.querySelectorAll('[data-th]').forEach(function (cb) {
			cb.addEventListener('change', function () {
				state.tshow[cb.dataset.th] = cb.checked;
				updateThreads();
			});
		});
		document.getElementById('atlas-bg-places').addEventListener('change', function () {
			state.showBg = this.checked;
			updateDots();
		});
		buildSearch();
		bindTime();
		bindButtons();
		bindInput();
		updateDots();
	}
	function updateCount(shown) {
		var el = document.getElementById('atlas-count');
		if (el) {
			el.textContent = shown + ' of ' + state.dots.length + ' points shown';
		}
	}
	function buildSearch() {
		var input = document.getElementById('atlas-search');
		var box = document.getElementById('atlas-results');
		function render(q) {
			if (!q || q.length < 2) { box.classList.remove('open'); box.innerHTML = ''; return; }
			var ql = q.toLowerCase(), out = [], seen = 0;
			var push = function (name, type, dot) {
				if (seen >= 14) { return; }
				out.push('<div class="atlas-res" data-i="' + dot +
					'"><span class="sw" style="background:' + TYPE_COLOR[type] +
					'"></span><span class="rn"></span><span class="rt">' +
					TYPE_LABEL[type] + '</span></div>');
				render._map[dot] = name; seen++;
			};
			render._map = {};
			state.dots.forEach(function (d, i) {
				if (state.show[d.type] &&
					d.ref.name.toLowerCase().indexOf(ql) !== -1) {
					push(d.ref.name, d.type, i);
				}
			});
			box.innerHTML = out.join('');
			box.querySelectorAll('.rn').forEach(function (el, idx) {
				// names set separately to avoid HTML injection
			});
			// set names safely
			var resEls = box.querySelectorAll('.atlas-res');
			resEls.forEach(function (el) {
				var i = el.dataset.i;
				el.querySelector('.rn').textContent = state.dots[i].ref.name;
				el.addEventListener('click', function () {
					box.classList.remove('open');
					input.value = state.dots[i].ref.name;
					selectDot(state.dots[i]);
				});
			});
			box.classList.toggle('open', out.length > 0);
		}
		input.addEventListener('input', function () { render(input.value.trim()); });
		input.addEventListener('blur', function () {
			setTimeout(function () { box.classList.remove('open'); }, 180);
		});
	}
	function bindTime() {
		var slider = document.getElementById('atlas-time');
		var yearEl = document.getElementById('atlas-year');
		slider.addEventListener('input', function () {
			state.year = parseInt(slider.value, 10);
			yearEl.firstChild.textContent = state.year < 0
				? Math.abs(state.year) + ' BCE' : String(state.year);
			yearEl.querySelector('small').textContent =
				state.year >= 2026 ? 'all time' : 'time machine';
			updateDots();
			updateThreads();
			if (state.selected) {
				if (!yearRange(state.selected.yearA, state.selected.yearB)) {
					clearSelection();
				}
			}
		});
	}
	function bindButtons() {
		document.getElementById('atlas-reset').addEventListener('click', function () {
			stopTour();
			state.tD = 3.2; state.tTheta = -0.4; state.tPhi = 1.15;
		});
		document.getElementById('atlas-journey').addEventListener('click', function () {
			if (tour.active) { stopTour(); } else { startTour(); }
		});
		buildTourDots();
		tourEls().prev.addEventListener('click', prevStep);
		tourEls().next.addEventListener('click', nextStep);
		tourEls().close.addEventListener('click', stopTour);
		tourEls().earth.addEventListener('click', stopTour);
		document.addEventListener('keydown', function (e) {
			if (!tour.active) { return; }
			var t = e.target;
			if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) { return; }
			if (e.key === 'Escape') { stopTour(); }
			else if (e.key === 'ArrowRight') { nextStep(); }
			else if (e.key === 'ArrowLeft') { prevStep(); }
		});
	}

	// ── cosmic journey ────────────────────────────────────────
	var JOURNEY = [
		{ d: 3.2, era: 'Earth', text: 'The home of almost every idea in this course.' },
		{ d: 3.4, era: 'The whole planet', text: 'Threads of influence cross continents and millennia. Before we pull away, a tiny selection — only a handful of the thousands of steps that led to language models, but the ones that matter most.' },
		{ d: 3.2, face: latLngToVec3(37.39, -122.08, EARTH_R), dot: 'person-ashish-vaswani', img: 'transformer_architecture.png', era: 'The transformer · 2017', text: '“Attention is all you need” — Vaswani and colleagues, Mountain View. Replacing sequential memory with attention is what finally made language models possible.' },
		{ d: 3.2, face: latLngToVec3(42.44, -76.5, EARTH_R), dot: 'person-dean-edmonds', img: 'FrankRosenblattWiringPerceptron.jpg', era: 'The perceptron · 1958', text: 'Frank Rosenblatt’s Perceptron at Cornell — the first machine that learns from its own mistakes by adjusting its weights. The ancestor of every neural network.' },
		{ d: 3.2, face: latLngToVec3(40.72, -74.41, EARTH_R), dot: 'person-john-bardeen', img: 'first_transistor.jpg', era: 'The transistor · 1947', text: 'Bell Labs, New Jersey. Bardeen, Brattain and Shockley’s transistor shrinks computation from a room to a grain — and lets it scale to billions on a chip.' },
		{ d: 3.2, face: latLngToVec3(52.52, 13.4, EARTH_R), dot: 'person-konrad-zuse', img: 'zuse.jpg', era: 'The computer · 1941', text: 'Konrad Zuse’s Z3 in Berlin — the first working, programmable, fully automatic digital computer, built from telephone relays. The machine that made computation physical.' },
		{ d: 3.2, face: latLngToVec3(-25.9, 31.52, EARTH_R), dot: 'place-lebombo-mountains', img: 'lebombo.jpg', era: 'Counting · c. 42,000 BCE', text: 'The Lebombo bone, Eswatini — a baboon fibula with 29 notches, the oldest known counting tool. No counting, no mathematics, no code, no model.' },
		{ d: 4.8, face: 'moon', era: 'The Moon', text: 'Ranger 7’s 1964 lunar photos became the first images ever processed by a computer — an untold chapter of AI’s origins.' },
		{ d: 60, face: SUN_POS, era: 'The solar system', text: 'Every atom of silicon in a GPU was forged in a star. Technology, ultimately, is astrophysics.' },
		{ d: 140, era: 'The galaxies', text: 'Island universes drifting in the dark — 13.8 billion years of cosmic structure.' },
		{ d: 260, era: 'The cosmic web', text: 'Gravity sculpted the void into a hierarchy: stars form galaxies, galaxies form clusters, clusters form superclusters, superclusters form walls and sheets — all strung along filaments that meet at giant nodes, with vast empty voids between. These are the largest structures that exist. And the same foam-like geometry may shape the space of meaning itself — see <a href="foam_of_meaning.php">The foam of meaning</a>.' },
		{ d: 400, era: 'The Big Bang', text: 'The cosmic microwave background, here as a flat photograph: the oldest light in the universe, 380,000 years after the beginning.' },
		{ d: 560, era: 'Why is there anything at all?', text: 'Why is there something rather than nothing? Jocax’s answer: nothing has no rules — so nothing forbids something. An absolute void is inherently unstable and dissolves. What could prevent something from existing? Nothing, because nothingness has no causal power.' }
	];
	var TOUR_STEP_MS = 9000;
	var tour = { active: false, step: 0, startedAt: 0 };

	function tourEls() {
		return {
			root: document.getElementById('atlas-tour'),
			era: document.getElementById('tour-era'),
			text: document.getElementById('tour-text'),
			img: document.getElementById('tour-img'),
			dots: document.getElementById('tour-dots'),
			fill: document.getElementById('tour-timer-fill'),
			prev: document.getElementById('tour-prev'),
			next: document.getElementById('tour-next'),
			close: document.getElementById('tour-close'),
			earth: document.getElementById('tour-earth')
		};
	}
	function buildTourDots() {
		var els = tourEls();
		els.dots.innerHTML = '';
		JOURNEY.forEach(function (s, i) {
			var b = document.createElement('button');
			b.className = 'tour-dot';
			b.type = 'button';
			b.title = s.era;
			b.addEventListener('click', function () { goStep(i); });
			els.dots.appendChild(b);
		});
	}
	function goStep(i) {
		tour.step = i;
		var s = JOURNEY[i];
		state.tD = s.d;
		if (s.face) {
			var v = (s.face === 'moon')
				? moon.position.clone()
				: (s.face.isVector3 ? s.face : new THREE.Vector3(s.face[0], s.face[1], s.face[2]));
			state.tTheta = Math.atan2(v.z, v.x);
			state.tPhi = Math.acos(THREE.MathUtils.clamp(v.y / v.length(), -1, 1));
		}
		var els = tourEls();
		els.era.textContent = s.era;
		els.text.innerHTML = s.text;
		if (s.img && els.img) {
			els.img.src = s.img;
			els.img.alt = s.era;
			els.img.style.display = 'block';
		} else if (els.img) {
			els.img.style.display = 'none';
		}
		if (s.dot) { setSpotHighlight(s.dot); } else { clearSpotHighlight(); }
		var dotEls = els.dots.children;
		for (var k = 0; k < dotEls.length; k++) {
			dotEls[k].classList.toggle('on', k === i);
		}
		els.prev.style.visibility = i === 0 ? 'hidden' : 'visible';
		els.next.textContent = (i === JOURNEY.length - 1) ? 'Finish' : 'Next →';
		tour.startedAt = performance.now();
		els.fill.style.width = '0%';
	}
	function startTour() {
		tour.active = true;
		state.touring = true;
		var els = tourEls();
		els.root.classList.add('open');
		goStep(0);
	}
	function resetTourTimer() {
		if (!tour.active) { return; }
		tour.startedAt = performance.now();
		tourEls().fill.style.width = '0%';
	}
	function stopTour() {
		tour.active = false;
		state.touring = false;
		tourEls().root.classList.remove('open');
		var img = tourEls().img;
		if (img) { img.style.display = 'none'; }
		clearSpotHighlight();
		state.tD = 3.2; state.tTheta = -0.4; state.tPhi = 1.15;
	}
	function nextStep() {
		if (tour.step < JOURNEY.length - 1) { goStep(tour.step + 1); }
		else { stopTour(); }
	}
	function prevStep() {
		if (tour.step > 0) { goStep(tour.step - 1); }
	}
	function tickTour() {
		if (!tour.active) { return; }
		var last = tour.step === JOURNEY.length - 1;
		var p = last ? 1 : (performance.now() - tour.startedAt) / TOUR_STEP_MS;
		tourEls().fill.style.width = Math.min(100, p * 100) + '%';
		if (!last && p >= 1) { nextStep(); }
	}

	// ── theme reactivity ──────────────────────────────────────
	if (window.__MN_DARK && window.__MN_DARK.onChange) {
		window.__MN_DARK.onChange(function () {
			readTheme();
			if (renderer) { renderer.setClearColor(new THREE.Color(THEME.bg), 1); }
		});
	}

	// ── main loop ─────────────────────────────────────────────
	var frame = 0;
	function tick() {
		requestAnimationFrame(tick);
		applyCamera();
		tickTour();
		// the web + CMB photos hover in front of the camera, photo-parallel
		if (webPhoto || cmbPhoto) {
			var fwd = new THREE.Vector3();
			camera.getWorldDirection(fwd);
			if (webPhoto) {
				webPhoto.position.copy(camera.position).addScaledVector(fwd, WEB_PHOTO_DIST);
				webPhoto.quaternion.copy(camera.quaternion);
			}
			cmbPhoto.position.copy(camera.position).addScaledVector(fwd, CMB_PHOTO_DIST);
			cmbPhoto.quaternion.copy(camera.quaternion);
		}
		// slow cosmic drift
		if (frame % 2 === 0) {
			planets.forEach(function (p) {
				if (!p.visible) { return; }
				p.userData.angle += p.userData.speed * 0.01;
				p.position.x = SUN_POS[0] + Math.cos(p.userData.angle) * p.userData.dist;
				p.position.z = SUN_POS[2] + Math.sin(p.userData.angle) * p.userData.dist;
			});
			if (filamentGroup) { filamentGroup.rotation.y += 0.00025; }
			if (questionGroup) { questionGroup.rotation.y += 0.0002; }
			if (asparagusSprite) {
				asparagusSprite.position.x = 110 * Math.sin(frame * 0.0016);
				asparagusSprite.position.y = 40 + 28 * Math.sin(frame * 0.0011 + 1.3);
			}
		}
		frame++;
		renderer.render(scene, camera);
	}

	return start();
}

async function loadMapModule() {
	if (__atlasBooted) { return Promise.resolve(); }
	__atlasBooted = true;
	if (typeof updateLoadingStatus === 'function') {
		updateLoadingStatus("Loading section about The Atlas...");
	}
	return bootAtlas();
}
