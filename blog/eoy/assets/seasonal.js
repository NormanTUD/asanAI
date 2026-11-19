/* TEN MINUTES — non-interactive seasonal overlays for the calendar page. */
(function () {
	"use strict";

	var body = document.body;
	if (!body) return;
	var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

	function colors() {
		if (window.TM && TM.colors) return TM.colors();
		var dark = document.documentElement.getAttribute("data-theme") === "dark";
		return {
			dark: dark,
			sky: "#5c9baf",
			green: "#63a44b",
			blue: "#1275ac",
			petrol: "#004b6f",
			gold: "#9f9700",
			coral: "#9185be"
		};
	}

	function fit(canvas) {
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		var w = window.innerWidth;
		var h = window.innerHeight;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		canvas.style.width = w + "px";
		canvas.style.height = h + "px";
		var ctx = canvas.getContext("2d");
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		return { ctx: ctx, w: w, h: h };
	}

	/* ── snow ────────────────────────────────────────────────── */
	var snowCanvas = document.getElementById("season-snow");
	if (snowCanvas) {
		var snow = fit(snowCanvas);
		var flakes = [];
		var count = Math.max(36, Math.round(snow.w / 12));
		for (var i = 0; i < count; i++) {
			flakes.push({
				x: Math.random() * snow.w,
				y: Math.random() * snow.h,
				r: 0.8 + Math.random() * 2.2,
				s: 0.25 + Math.random() * 0.85,
				d: -0.35 + Math.random() * 0.7,
				a: 0.35 + Math.random() * 0.5
			});
		}
		function drawSnow() {
			var c = colors();
			snow.ctx.clearRect(0, 0, snow.w, snow.h);
			snow.ctx.fillStyle = c.dark ? "rgba(238,247,244,.85)" : "rgba(92,155,175,.55)";
			flakes.forEach(function (f) {
				snow.ctx.globalAlpha = f.a;
				snow.ctx.beginPath();
				snow.ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
				snow.ctx.fill();
			});
			snow.ctx.globalAlpha = 1;
		}
		var snowRaf = null;
		var lastSnow = 0;
		function tickSnow(now) {
			snowRaf = requestAnimationFrame(tickSnow);
			if (document.hidden || now - lastSnow < 33) return;
			lastSnow = now;
			flakes.forEach(function (f) {
				f.y += f.s;
				f.x += f.d * 0.35;
				if (f.y > snow.h + 4) { f.y = -4; f.x = Math.random() * snow.w; }
				if (f.x < -4) f.x = snow.w + 4;
				if (f.x > snow.w + 4) f.x = -4;
			});
			drawSnow();
		}
		function startSnow() {
			snow = fit(snowCanvas);
			drawSnow();
			if (!reduce && !snowRaf) snowRaf = requestAnimationFrame(tickSnow);
		}
		window.addEventListener("resize", function () {
			if (snowRaf) cancelAnimationFrame(snowRaf);
			snowRaf = null;
			startSnow();
		});
		window.addEventListener("tm:theme", drawSnow);
		if (reduce) drawSnow();
		else startSnow();
	}

	/* ── fireworks ───────────────────────────────────────────── */
	var fwCanvas = document.getElementById("season-fireworks");
	if (fwCanvas) {
		var fw = fit(fwCanvas);
		var parts = [];
		var nextBurst = 0;
		function burst(x, y, now) {
			var c = colors();
			var palette = [c.green, c.sky, c.gold, c.coral, c.blue, c.petrol];
			var color = palette[Math.floor(Math.random() * palette.length)];
			var n = 34 + Math.floor(Math.random() * 28);
			for (var i = 0; i < n; i++) {
				var a = (Math.PI * 2 * i) / n;
				var speed = 1.2 + Math.random() * 2.8;
				parts.push({
					x: x, y: y,
					vx: Math.cos(a) * speed,
					vy: Math.sin(a) * speed,
					life: 1,
					color: color,
					size: 1 + Math.random() * 1.6
				});
			}
		}
		function drawFw() {
			fw.ctx.clearRect(0, 0, fw.w, fw.h);
			parts.forEach(function (p) {
				fw.ctx.globalAlpha = Math.max(0, p.life);
				fw.ctx.fillStyle = p.color;
				fw.ctx.fillRect(p.x, p.y, p.size, p.size);
			});
			fw.ctx.globalAlpha = 1;
		}
		var fwRaf = null;
		var lastFw = 0;
		function tickFw(now) {
			fwRaf = requestAnimationFrame(tickFw);
			if (document.hidden || now - lastFw < 33) return;
			lastFw = now;
			if (now > nextBurst) {
				burst(fw.w * (0.18 + Math.random() * 0.64), fw.h * (0.18 + Math.random() * 0.38), now);
				nextBurst = now + 1800 + Math.random() * 2200;
			}
			for (var i = parts.length - 1; i >= 0; i--) {
				var p = parts[i];
				p.x += p.vx;
				p.y += p.vy;
				p.vy += 0.035;
				p.vx *= 0.992;
				p.vy *= 0.992;
				p.life -= 0.012;
				if (p.life <= 0) parts.splice(i, 1);
			}
			drawFw();
		}
		function startFw() {
			fw = fit(fwCanvas);
			parts = [];
			drawFw();
			if (reduce) {
				burst(fw.w * 0.32, fw.h * 0.24, 0);
				burst(fw.w * 0.68, fw.h * 0.32, 0);
				parts.forEach(function (p) { p.life = 0.9; });
				drawFw();
				return;
			}
			nextBurst = 0;
			if (!fwRaf) fwRaf = requestAnimationFrame(tickFw);
		}
		window.addEventListener("resize", function () {
			if (fwRaf) cancelAnimationFrame(fwRaf);
			fwRaf = null;
			startFw();
		});
		startFw();
	}
})();
