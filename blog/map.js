/* ============================================================
   THE ATLAS — From Big Bang to ChatGPT
   A single continuous camera: from a street on Earth, out past
   the Moon, the solar system, the galaxies, to the CMB backdrop.
   Every named person, place, institution, author and event in
   the course is a dot; every influence / journey / signal is a
   thread. Drag to look around, scroll to zoom, click to explore.
   ============================================================ */
(function () {
	'use strict';

	var canvas = document.getElementById('atlas-canvas');
	if (!canvas || !window.THREE) { return; }

	// ── constants ─────────────────────────────────────────────
	var DEG = Math.PI / 180;
	var EARTH_R = 1;
	var MOON_R = 0.27, MOON_POS = [7.2, 0.6, 2.4];
	var SUN_DIST = 85;
	var GALAXY_R = 210;
	var CMB_R = 520;
	var STAR_R = 470;
	var MIN_D = 1.45, MAX_D = 470;

	var THEME = {};
	function readTheme() {
		var light = document.documentElement.classList.contains('light');
		THEME.light = light;
		THEME.ocean = light ? '#b8d4e6' : '#0d1b2e';
		THEME.land = light ? '#dce8d0' : '#20344c';
		THEME.border = light ? '#ffffff' : '#3c557a';
		THEME.graticule = light ? 'rgba(60,90,120,.18)' : 'rgba(120,150,200,.10)';
		THEME.bg = light ? '#eef2f8' : '#05070d';
	}
	readTheme();

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
		Promise.all([
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

	function buildDots() {
		state.dots = [];
		state.entities.forEach(function (e) {
			if (e.lat === null || e.lng === null) { return; }
			state.dots.push({
				ref: e, type: e.type, lat: e.lat, lng: e.lng,
				yearA: (e.active || [null, null])[0],
				yearB: (e.active || [null, null])[1],
				isMoon: isMoonEntity(e),
				isAuthor: false
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
	var renderer, scene, camera, earth, earthTex, moon, sun, planets = [];
	var dotMesh, dotInstance = [];
	var threadGroup, threadObjs = [];
	var starField, cmb, galaxyGroup, atmosphere;
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

	function drawEarthCanvas() {
		var W = 2048, H = 1024;
		var c = document.createElement('canvas');
		c.width = W; c.height = H;
		var g = c.getContext('2d');
		g.fillStyle = THEME.ocean;
		g.fillRect(0, 0, W, H);
		var world = window.ATLAS_WORLD || { land: [], borders: [] };

		function project(lat, lng) {
			return [(lng + 180) / 360 * W, (90 - lat) / 180 * H];
		}
		function drawRing(ring, fill) {
			// date-line aware: keep x continuous by shifting whole run when a
			// segment jumps more than half the map.
			var pts = ring.map(function (p) { return project(p[1], p[0]); });
			var off = 0, prevX = null;
			g.beginPath();
			for (var i = 0; i < pts.length; i++) {
				var x = pts[i][0] + off, y = pts[i][1];
				if (prevX !== null) {
					var dx = x - prevX;
					if (dx > W / 2) { off -= W; x -= W; }
					else if (dx < -W / 2) { off += W; x += W; }
				}
				if (i === 0) { g.moveTo(x, y); } else { g.lineTo(x, y); }
				prevX = x;
			}
			g.closePath();
			if (fill) { g.fill(); }
		}
		// land
		g.fillStyle = THEME.land;
		(world.land || []).forEach(function (poly) {
			poly.forEach(function (ring, ri) { drawRing(ring, ri === 0); });
		});
		// borders
		g.strokeStyle = THEME.border;
		g.lineWidth = 1;
		(world.borders || []).forEach(function (ring) {
			var pts = ring.map(function (p) { return project(p[1], p[0]); });
			var off = 0, prevX = null;
			g.beginPath();
			for (var i = 0; i < pts.length; i++) {
				var x = pts[i][0] + off, y = pts[i][1];
				if (prevX !== null) {
					var dx = x - prevX;
					if (dx > W / 2) { off -= W; x -= W; }
					else if (dx < -W / 2) { off += W; x += W; }
				}
				if (i === 0) { g.moveTo(x, y); } else { g.lineTo(x, y); }
				prevX = x;
			}
			g.stroke();
		});
		// graticule
		g.strokeStyle = THEME.graticule;
		g.lineWidth = 1;
		for (var la = -60; la <= 60; la += 30) {
			var y = (90 - la) / 180 * H;
			g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
		}
		for (var lo = -150; lo <= 150; lo += 30) {
			var x = (lo + 180) / 360 * W;
			g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
		}
		if (earthTex) {
			earthTex.image = c;
			earthTex.needsUpdate = true;
		}
		return c;
	}

	function buildScene() {
		renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(new THREE.Color(THEME.bg), 1);

		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.01, 4000);
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
	}

	function buildEarth() {
		earthTex = new THREE.CanvasTexture(drawEarthCanvas());
		var geo = new THREE.SphereGeometry(EARTH_R, 64, 48);
		var mat = new THREE.MeshPhongMaterial({
			map: earthTex, shininess: 8, specular: new THREE.Color(0x1a2333)
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
		var tex = new THREE.TextureLoader().load('ranger7_moon.jpg');
		var geo = new THREE.SphereGeometry(MOON_R, 40, 30);
		var mat = new THREE.MeshPhongMaterial({ map: tex, shininess: 2 });
		moon = new THREE.Mesh(geo, mat);
		moon.position.set(MOON_POS[0], MOON_POS[1], MOON_POS[2]);
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

		// CMB backdrop
		var cmbTex = new THREE.TextureLoader().load('wmap_cmb.png');
		cmb = new THREE.Mesh(
			new THREE.SphereGeometry(CMB_R, 48, 32),
			new THREE.MeshBasicMaterial({
				map: cmbTex, side: THREE.BackSide, transparent: true,
				opacity: 0, depthWrite: false
			})
		);
		scene.add(cmb);

		// galaxies
		galaxyGroup = new THREE.Group();
		var webTex = new THREE.TextureLoader().load('cosmic_web.jpg');
		var spiralTex = makeSpiralTexture();
		for (var gi = 0; gi < 9; gi++) {
			var tex = (gi % 3 === 0) ? webTex : spiralTex;
			var sp = new THREE.Sprite(new THREE.SpriteMaterial({
				map: tex, transparent: true, opacity: 0, depthWrite: false
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
		var sunSp = new THREE.Sprite(new THREE.SpriteMaterial({
			map: makeRadialTexture('rgba(255,250,230,1)', 'rgba(255,190,90,.5)', 256),
			transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
		}));
		sunSp.position.set(SUN_DIST, 6, -20);
		sunSp.scale.set(26, 26, 1);
		scene.add(sunSp);

		// planets (stylized, not to scale)
		var palette = [0x9c8f84, 0xe8c46a, 0xc1440e, 0xd8a25a, 0xe0c9a6, 0x9ad1e8, 0x4a6fd0];
		var names = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
		for (var pi = 0; pi < names.length; pi++) {
			var pr = 0.5 + Math.random() * 1.6;
			var pm = new THREE.Mesh(
				new THREE.SphereGeometry(pr, 20, 14),
				new THREE.MeshPhongMaterial({ color: palette[pi], shininess: 6 })
			);
			var pa = Math.random() * Math.PI * 2;
			var pd = 30 + pi * 9 + Math.random() * 6;
			pm.position.set(Math.cos(pa) * pd, (Math.random() - 0.5) * 14, Math.sin(pa) * pd);
			pm.userData.angle = pa;
			pm.userData.dist = pd;
			pm.userData.speed = 0.02 / (pi + 2);
			pm.visible = false;
			planets.push(pm);
			scene.add(pm);
		}
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
			var on = state.show[d.type] && yearRange(d.yearA, d.yearB);
			if (d.isAuthor) { on = on && (state.year >= (d.year || 0) - 2); }
			if (on) {
				var r = d.isMoon ? MOON_R : EARTH_R;
				var base = latLngToVec3(d.lat, d.lng, r + 0.004);
				dummy.position.copy(base);
				var sc = d.isAuthor ? 0.7 : 1.0;
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
	function dotPos(d) {
		var r = d.isMoon ? MOON_R : EARTH_R;
		return latLngToVec3(d.lat, d.lng, r + 0.01);
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

	// ── camera ────────────────────────────────────────────────
	function applyCamera() {
		state.theta += (state.tTheta - state.theta) * 0.12;
		state.phi += (state.tPhi - state.phi) * 0.12;
		state.d += (state.tD - state.d) * 0.12;
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
		var cmbO = THREE.MathUtils.smoothstep(d, 120, 320);
		if (cmb) { cmb.material.opacity = cmbO * 0.9; }
		var starO = 0.35 + 0.6 * THREE.MathUtils.smoothstep(d, 6, 40);
		if (starField) { starField.material.opacity = starO; }
		var galO = THREE.MathUtils.smoothstep(d, 24, 120) * (1 - THREE.MathUtils.smoothstep(d, 360, 470));
		galaxyGroup.children.forEach(function (s) { s.material.opacity = galO * 0.7; });
		var sunO = THREE.MathUtils.smoothstep(d, 14, 40) * (1 - THREE.MathUtils.smoothstep(d, 400, 470));
		var showPlanets = d > 12 && d < 400;
		planets.forEach(function (p) { p.visible = showPlanets; });
		var atmO = 1 - THREE.MathUtils.smoothstep(d, 2.6, 6);
		if (atmosphere) { atmosphere.material.opacity = atmO; }
	}

	// ── interaction ───────────────────────────────────────────
	var dragging = false, lastX = 0, lastY = 0, moved = 0;
	function bindInput() {
		canvas.addEventListener('mousedown', function (e) {
			dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
			canvas.classList.add('dragging');
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
		window.addEventListener('resize', function () {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});
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
		mouseNDC.x = (px / window.innerWidth) * 2 - 1;
		mouseNDC.y = -(py / window.innerHeight) * 2 + 1;
		raycaster.setFromCamera(mouseNDC, camera);
		raycaster.params.Points = { threshold: 0.02 };
		var hits = raycaster.intersectObject(dotMesh);
		var found = null;
		for (var i = 0; i < hits.length; i++) {
			var iid = hits[i].instanceId;
			if (iid === undefined) { continue; }
			var d = dotInstance[iid];
			if (state.show[d.type] && yearRange(d.yearA, d.yearB)) { found = d; break; }
		}
		if (isClick) {
			if (found) { selectDot(found); }
			else { clearSelection(); }
		} else {
			setHover(found, px, py);
		}
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
			html += '<div class="d-label">Cited in these lessons</div><div class="d-links">';
			slugs.forEach(function (s) {
				html += '<a class="d-link" href="' + esc(s) + '.php">' + esc(s) + '</a>';
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
		state.tTheta = -((d.lng + 180) * DEG) ;
		// derive from latLngToVec3: position angle = atan2(z, x)
		var v = latLngToVec3(d.lat, d.lng, 1);
		state.tTheta = Math.atan2(v.z, v.x);
		state.tPhi = Math.acos(THREE.MathUtils.clamp(v.y, -1, 1));
		state.tD = d.isMoon ? 4.5 : 3.1;
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
		var html = '<h3>Layer</h3>';
		Object.keys(TYPE_LABEL).forEach(function (k) {
			html += '<label class="atlas-check"><input type="checkbox" data-t="' + k +
				'" checked><span class="sw" style="background:' + TYPE_COLOR[k] +
				'"></span>' + TYPE_LABEL[k] + '</label>';
		});
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
		buildLegend();
		buildSearch();
		bindTime();
		bindButtons();
		bindInput();
		updateDots();
	}
	function buildLegend() {
		var lg = document.getElementById('atlas-legend');
		var html = '';
		Object.keys(TYPE_LABEL).forEach(function (k) {
			html += '<label class="atlas-check"><span class="sw" style="background:' +
				TYPE_COLOR[k] + '"></span>' + TYPE_LABEL[k] + '</label>';
		});
		lg.innerHTML = html;
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
			state.tD = 3.2; state.tPhi = 1.15;
		});
		document.getElementById('atlas-theme').addEventListener('click', function () {
			var light = document.documentElement.classList.contains('light');
			window.__atlasSetTheme(light ? 'dark' : 'light');
		});
		document.getElementById('atlas-journey').addEventListener('click', startJourney);
	}

	// ── cosmic journey ────────────────────────────────────────
	var JOURNEY = [
		{ d: 1.7, era: 'Earth', text: 'The home of every idea in this course. Drag to look around, click any dot to see where it is cited.' },
		{ d: 3.4, era: 'The whole planet', text: 'Threads of influence cross continents and millennia. Use the time slider to travel through history.' },
		{ d: 9, era: 'The Moon', text: 'Ranger 7’s 1964 lunar photos became the first images ever processed by a computer — an untold chapter of AI’s origins.' },
		{ d: 60, era: 'The solar system', text: 'Every atom of silicon in a GPU was forged in a star. Technology, ultimately, is astrophysics.' },
		{ d: 220, era: 'The galaxies', text: '13.8 billion years of cosmic structure — the stage on which everything happened.' },
		{ d: 460, era: 'The Big Bang', text: 'The cosmic microwave background: the oldest light in the universe, 380,000 years after the beginning. It all starts here.' }
	];
	var tourStep = -1;
	function startJourney() {
		state.touring = true;
		tourStep = 0;
		nextTourStep();
	}
	function nextTourStep() {
		if (tourStep >= JOURNEY.length) {
			state.touring = false;
			var cap = document.getElementById('atlas-caption');
			setTimeout(function () { cap.classList.remove('show'); }, 2500);
			return;
		}
		var step = JOURNEY[tourStep];
		state.tD = step.d;
		var cap = document.getElementById('atlas-caption');
		document.getElementById('cap-era').textContent = step.era;
		document.getElementById('cap-text').textContent = step.text;
		cap.classList.add('show');
		tourStep++;
		setTimeout(nextTourStep, 6500);
	}

	// ── theme reactivity ──────────────────────────────────────
	window.__atlasOnTheme = function () {
		readTheme();
		if (renderer) { renderer.setClearColor(new THREE.Color(THEME.bg), 1); }
		if (earthTex) {
			earthTex.image = drawEarthCanvas();
			earthTex.needsUpdate = true;
		}
	};

	// ── main loop ─────────────────────────────────────────────
	var frame = 0;
	function tick() {
		requestAnimationFrame(tick);
		applyCamera();
		// slow planet orbits
		if (frame % 2 === 0) {
			planets.forEach(function (p) {
				if (!p.visible) { return; }
				p.userData.angle += p.userData.speed * 0.01;
				p.position.x = Math.cos(p.userData.angle) * p.userData.dist;
				p.position.z = Math.sin(p.userData.angle) * p.userData.dist;
			});
			// keep hover tooltip in place
		}
		frame++;
		renderer.render(scene, camera);
	}

	start();
})();
