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

		function schedule_flush() {
			if (flush_scheduled) return;
			flush_scheduled = true;
			requestAnimationFrame(() => {
				flush_scheduled = false;

				if (fill_groups.size) {
					for (const [key, group] of fill_groups) {
						const props = group.__style;
						real_ctx.save();
						Object.assign(real_ctx, props);
						try { real_ctx.fill(group.path); } catch(e){}
						real_ctx.restore();
					}
					fill_groups.clear();
				}

				if (stroke_groups.size) {
					for (const [key, group] of stroke_groups) {
						const props = group.__style;
						real_ctx.save();
						Object.assign(real_ctx, props);
						try { real_ctx.stroke(group.path); } catch(e){}
						real_ctx.restore();
					}
					stroke_groups.clear();
				}
			});
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
					__style: isFill ? {
						fillStyle: ctx.fillStyle,
						globalAlpha: ctx.globalAlpha
					} : {
						strokeStyle: ctx.strokeStyle,
						lineWidth: ctx.lineWidth,
						globalAlpha: ctx.globalAlpha,
						lineCap: ctx.lineCap,
						lineJoin: ctx.lineJoin,
						miterLimit: ctx.miterLimit
					}
				});
			}

			current_path = new Path2D();
			schedule_flush();
		}

		const proxy = new Proxy(real_ctx, {
			get(target, prop) {
				if ([
					"moveTo","lineTo","rect","arc","ellipse",
					"bezierCurveTo","quadraticCurveTo","arcTo"
				].includes(prop)) {
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
					return function(x,y,w,h) {
						try {
							current_path.rect(x,y,w,h);
							push_group(target, false);
						} catch(e) {
							try { return target.strokeRect(x,y,w,h); } catch(e2){}
						}
						return target;
					};
				}

				if (prop === "fillRect") {
					return function(x,y,w,h) {
						try {
							current_path.rect(x,y,w,h);
							push_group(target, true);
						} catch(e) {
							try { return target.fillRect(x,y,w,h); } catch(e2){}
						}
						return target;
					};
				}

				if (prop === "stroke") {
					return function(){
						push_group(target, false);
						return target;
					};
				}

				// ⭐ NEW: Intercept fill() to preserve colors
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
