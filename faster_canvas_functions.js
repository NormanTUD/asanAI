(function(){
	const original_get_context = HTMLCanvasElement.prototype.getContext;

	function make_style_key(ctx, isFill) {
		return [
			isFill ? ctx.fillStyle : ctx.strokeStyle,
			ctx.globalAlpha
		].join("|");
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

	function flush_ops(real_ctx, ops) {
		// Keep the original draw order: a later shape with an already-seen
		// style must still be painted after the shapes that came in between.
		for (const op of ops) {
			real_ctx.save();
			Object.assign(real_ctx, op.__style);
			try { op.isFill ? real_ctx.fill(op.path) : real_ctx.stroke(op.path); } catch(e){}
			real_ctx.restore();
		}
		ops.length = 0;
	}

	function schedule_flush(st) {
		if (st.flush_scheduled) return;
		st.flush_scheduled = true;
		requestAnimationFrame(() => {
			st.flush_scheduled = false;
			if (st.ops.length) flush_ops(st.real_ctx, st.ops);
		});
	}

	function push_group(st, ctx, isFill) {
		const key = (isFill ? "fill|" : "stroke|") + make_style_key(ctx, isFill);
		const ops = st.ops;
		const last = ops.length ? ops[ops.length - 1] : null;

		// Only merge with the immediately preceding op. Reusing an older group
		// would move this shape back in time and let shapes drawn in between
		// cover it (e.g. a dense neuron's black/white fill disappearing under
		// an earlier gray base circle).
		if (last && last.key === key) {
			last.path.addPath(st.current_path);
		} else {
			const p = new Path2D();
			p.addPath(st.current_path);
			ops.push({
				key: key,
				path: p,
				isFill: isFill,
				__style: isFill ? capture_fill_style(ctx) : capture_stroke_style(ctx)
			});
		}

		st.current_path = new Path2D();
		schedule_flush(st);
	}

	const PATH_METHODS = ["moveTo","lineTo","rect","arc","ellipse","bezierCurveTo","quadraticCurveTo","arcTo"];

	// Drawing calls that are not batched must see (and come after) every
	// pending fill/stroke; reads must see them too. State/transform changes are
	// included because a Path2D is transformed at fill/stroke time.
	const IMMEDIATE_METHODS = [
		"drawImage", "putImageData", "getImageData", "clearRect",
		"fillText", "strokeText", "clip",
		"save", "restore", "scale", "translate", "rotate", "transform",
		"setTransform", "resetTransform"
	];

	function proxy_rect(st, target, x, y, w, h, isFill) {
		try {
			st.current_path.rect(x, y, w, h);
			push_group(st, target, isFill);
		} catch(e) {
			try { return isFill ? target.fillRect(x,y,w,h) : target.strokeRect(x,y,w,h); } catch(e2){}
		}
		return target;
	}

	function create_proxy(st, real_ctx) {
		return new Proxy(real_ctx, {
			get(target, prop) {
				if (PATH_METHODS.includes(prop)) {
					return function(...args){
						try { st.current_path[prop](...args); } catch(e){}
						return target;
					};
				}

				if (prop === "beginPath") {
					return function(){
						st.current_path = new Path2D();
						return target;
					};
				}

				if (prop === "closePath") {
					return function(){
						try { st.current_path.closePath(); } catch(e){}
						return target;
					};
				}

				if (prop === "strokeRect") {
					return function(x,y,w,h) { return proxy_rect(st, target, x, y, w, h, false); };
				}

				if (prop === "fillRect") {
					return function(x,y,w,h) { return proxy_rect(st, target, x, y, w, h, true); };
				}

				if (prop === "stroke") {
					return function(){
						push_group(st, target, false);
						return target;
					};
				}

				if (prop === "fill") {
					return function(){
						push_group(st, target, true);
						return target;
					};
				}

				if (IMMEDIATE_METHODS.includes(prop)) {
					return function(...args){
						if (st.ops.length) flush_ops(st.real_ctx, st.ops);
						return target[prop](...args);
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
	}

	HTMLCanvasElement.prototype.getContext = function(type, opts) {
		const real_ctx = original_get_context.call(this, type, opts);
		if (!real_ctx || type !== "2d") return real_ctx;
		if (this.id !== "fcnn_canvas") return real_ctx;

		const st = {
			current_path: new Path2D(),
			ops: [],
			flush_scheduled: false,
			real_ctx: real_ctx
		};

		return create_proxy(st, real_ctx);
	};
})();
