(function(){
	const original_get_context = HTMLCanvasElement.prototype.getContext;
	HTMLCanvasElement.prototype.getContext = function(type, opts) {
		const real_ctx = original_get_context.call(this, type, opts);
		if (!real_ctx || type !== "2d") return real_ctx;

		if (this.id !== "fcnn_canvas") return real_ctx;

		let current_path = new Path2D();
		const stroke_groups = new Map();
		const fill_groups = new Map();
		let flush_scheduled = false;

		function make_style_key(ctx, isFill) {
			return [
				isFill ? ctx.fillStyle : ctx.strokeStyle,
				ctx.globalAlpha
			].join("|");
		}

		function flush_fill_groups() {
			for (const [key, group] of fill_groups) {
				const props = group.__style;
				real_ctx.save();
				Object.assign(real_ctx, props);
				try { real_ctx.fill(group.path); } catch(e){}
				real_ctx.restore();
			}
			fill_groups.clear();
		}

		function flush_stroke_groups() {
			for (const [key, group] of stroke_groups) {
				const props = group.__style;
				real_ctx.save();
				Object.assign(real_ctx, props);
				try { real_ctx.stroke(group.path); } catch(e){}
				real_ctx.restore();
			}
			stroke_groups.clear();
		}

		function schedule_flush() {
			if (flush_scheduled) return;
			flush_scheduled = true;
			requestAnimationFrame(() => {
				flush_scheduled = false;
				if (fill_groups.size) flush_fill_groups();
				if (stroke_groups.size) flush_stroke_groups();
			});
		}

		function capture_fill_style(ctx) {
			return { fillStyle: ctx.fillStyle, globalAlpha: ctx.globalAlpha };
		}

		function capture_stroke_style(ctx) {
			return {
				strokeStyle: ctx.strokeStyle,
				lineWidth: ctx.lineWidth,
				globalAlpha: ctx.globalAlpha,
				lineCap: ctx.lineCap,
				lineJoin: ctx.lineJoin,
				miterLimit: ctx.miterLimit
			};
		}

		function push_group(ctx, isFill) {
			const key = make_style_key(ctx, isFill);
			const groups = isFill ? fill_groups : stroke_groups;

			const existing = groups.get(key);
			if (existing) {
				existing.path.addPath(current_path);
			} else {
				const p = new Path2D();
				p.addPath(current_path);
				groups.set(key, {
					path: p,
					__style: isFill ? capture_fill_style(ctx) : capture_stroke_style(ctx)
				});
			}

			current_path = new Path2D();
			schedule_flush();
		}

		const PATH_METHODS = ["moveTo","lineTo","rect","arc","ellipse","bezierCurveTo","quadraticCurveTo","arcTo"];

		function proxy_rect(target, x, y, w, h, isFill) {
			try {
				current_path.rect(x, y, w, h);
				push_group(target, isFill);
			} catch(e) {
				try { return isFill ? target.fillRect(x,y,w,h) : target.strokeRect(x,y,w,h); } catch(e2){}
			}
			return target;
		}

		const proxy = new Proxy(real_ctx, {
			get(target, prop) {
				if (PATH_METHODS.includes(prop)) {
					return function(...args){
						try { current_path[prop](...args); } catch(e){}
						return target;
					};
				}

				if (prop === "beginPath") {
					return function(){
						current_path = new Path2D();
						return target;
					};
				}

				if (prop === "closePath") {
					return function(){
						try { current_path.closePath(); } catch(e){}
						return target;
					};
				}

				if (prop === "strokeRect") {
					return function(x,y,w,h) { return proxy_rect(target, x, y, w, h, false); };
				}

				if (prop === "fillRect") {
					return function(x,y,w,h) { return proxy_rect(target, x, y, w, h, true); };
				}

				if (prop === "stroke") {
					return function(){
						push_group(target, false);
						return target;
					};
				}

				if (prop === "fill") {
					return function(){
						push_group(target, true);
						return target;
					};
				}

				const val = target[prop];
				if (typeof val === "function") return val.bind(target);
				return val;
			},

			set(target, prop, value) {
				target[prop] = value;
				return true;
			}
		});

		return proxy;
	};
})();
