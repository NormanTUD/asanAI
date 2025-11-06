"use strict";

const ModelPlotter = (() => {

	const cameras = new Map();
	const _state = {};

	async function plot(div_id = 'plotly_predict') {
		dbg(`[ModelPlotter] plotting ${div_id}`);

		const plot_div = document.getElementById(div_id);
		if (!plot_div) return dbg(`[ModelPlotter] No div: ${div_id}`);

		const current_time = get_current_training_time();
		const state = get_state(div_id);

		if (!has_valid_model_shape(model))
			return hide_plot(plot_div, state, current_time);

		if (state.last_time === current_time)
			return dbg('[ModelPlotter] unchanged, skipping');

		set_state(div_id, { last_time: current_time });
		const { fallA, fallB1, fallB2 } = detect_case(model);
		if (!fallA && !fallB1 && !fallB2)
			return hide_plot(plot_div, state);

		const controls = ensure_controls(div_id, plot_div);
		const msg = create_message_box(controls);
		const fields = build_inputs(div_id, controls, state, { fallA, fallB1, fallB2 });
		state.fields = fields;
		state.controls = controls;

		configure_plot_div(plot_div);

		state.update_plot = debounce(async () =>
			await update_plot(plot_div, div_id, msg, fields, { fallA, fallB1, fallB2 }), 250);

		// Trigger initial plot
		state.update_plot();

		dbg('[ModelPlotter] UI ready');
	}

	// ---------------- core logic ----------------

	function get_current_training_time() {
		const last_time = Math.max(last_updated_page ?? 0, last_training_time ?? 0);
		return typeof last_time !== 'undefined' ? last_time : null;
	}

	function get_state(id) { return _state[id] || {}; }
	function set_state(id, obj) { _state[id] = obj; }

	function has_valid_model_shape(model) {
		return model?.input?.shape && model?.output?.shape;
	}

	function hide_plot(plot_div, state, current_time = null) {
		dbg('[ModelPlotter] hide plot');
		Plotly.purge(plot_div);
		plot_div.style.display = 'none';
		if (state.controls) state.controls.style.display = 'none';
		state.last_time = current_time;
	}

	function detect_case(model) {
		const in_shape = model.input.shape.slice(1);
		const out_shape = model.output.shape.slice(1);
		const fallA  = eq(in_shape, [1]) && eq(out_shape, [1]);
		const fallB1 = eq(in_shape, [2]) && eq(out_shape, [1]);
		const fallB2 = eq(in_shape, [1]) && eq(out_shape, [2]);
		dbg(`[ModelPlotter] A=${fallA} B1=${fallB1} B2=${fallB2}`);
		return { fallA, fallB1, fallB2 };
	}

	const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

	// ---------------- UI helpers ----------------

	function ensure_controls(div_id, plot_div) {
		let controls = document.getElementById(div_id + '_controls');
		if (!controls) {
			controls = document.createElement('div');
			controls.id = div_id + '_controls';
			plot_div.parentNode.insertBefore(controls, plot_div);
			dbg('Created controls');
		} else dbg('Reusing controls');
		controls.style.display = 'block';
		return controls;
	}

	function create_message_box(controls) {
		const msg = document.createElement('div');
		msg.style.cssText = 'color:crimson;font-weight:bold;margin-top:4px';
		controls.innerHTML = '';
		controls.appendChild(msg);
		return msg;
	}

	function create_input(controls, label, id, default_value, on_change) {
		const wrap = document.createElement('div');
		wrap.style.margin = '4px 0';
		const l = document.createElement('label');
		l.textContent = label + ': ';
		const i = document.createElement('input');
		Object.assign(i, { type: 'number', id });
		i.style.cssText = 'width:90px;margin-left:4px';
		if (!isNaN(default_value)) i.value = default_value;
		if (on_change) i.addEventListener('input', on_change);
		wrap.append(l, i);
		controls.appendChild(wrap);
		return i;
	}

	function build_inputs(div_id, controls, state, { fallA, fallB1, fallB2 }) {
		const old_vals = Object.fromEntries((state.fields || []).map(f => [f.id, parseFloat(f.value)]));
		const fields = [];
		const sets = {
			A: ['x_min','x_max','step'],
			B1:['x_min','x_max','y_min','y_max','step'],
			B2:['x_min','x_max','step']
		};
		const keys = fallA ? sets.A : fallB1 ? sets.B1 : sets.B2;
		for (const key of keys) {
			const id = div_id + '_' + key;
			const val = old_vals[id];
			const input = create_input(
				controls,
				key.replace('_', ' ').toUpperCase(),
				id,
				val,
				() => state.update_plot && state.update_plot()
			);
			fields.push(input);
		}
		return fields;
	}

	function configure_plot_div(div) {
		Object.assign(div.style, {
			width: '100%',
			height: '400px',
			maxHeight: '400px',
			display: 'block'
		});
	}

	// ---------------- plot update ----------------

	async function update_plot(plot_div, div_id, msg, fields, { fallA, fallB1, fallB2 }) {
		msg.textContent = '';
		const vals = Object.fromEntries(fields.map(f => [f.id, parseFloat(f.value)]));
		if (Object.values(vals).some(isNaN)) return hide_plot(plot_div, {}, null);

		const { x_min, x_max, step } = extract_vals(div_id, vals);
		if (x_min >= x_max) return msg.textContent = 'X min must be smaller than X max.';
		if (step <= 0 || step >= (x_max - x_min)) return msg.textContent = 'Invalid step value';

		let data = [];
		try {
			if (fallA) data = await caseA(x_min, x_max, step);
			else if (fallB1) {
				const { y_min, y_max } = extract_vals(div_id, vals);
				if (y_min >= y_max) return msg.textContent = 'Y min must be smaller than Y max.';
				data = await caseB1(x_min, x_max, y_min, y_max, step);
			} else if (fallB2) data = await caseB2(x_min, x_max, step);
		} catch (e) {
			console.error('update_plot failed', e);
			msg.textContent = 'Error during prediction';
			return;
		}

		const layout = base_layout(plot_div, model);
		await plot_preserve_camera(plot_div, data, layout);
		plot_div.style.display = 'block';
	}

	function extract_vals(div_id, vals) {
		const get = key => vals[div_id + '_' + key];
		return {
			x_min: get('x_min'), x_max: get('x_max'),
			y_min: get('y_min'), y_max: get('y_max'),
			step: get('step')
		};
	}

	// ---------------- data builders ----------------

	async function caseA(x_min, x_max, step) {
		const xs = range(x_min, x_max, step);
		const ys = await Promise.all(xs.map(async x => (await predict_single([x]))[0]));
		return [{ x: xs, y: ys, mode: 'lines', line: { width: 2 } }];
	}

	async function caseB1(x_min, x_max, y_min, y_max, step) {
		const xs = range(x_min, x_max, step);
		const ys = range(y_min, y_max, step);
		const zs = [];
		for (const x of xs) {
			const row = [];
			for (const y of ys) row.push((await predict_single([x, y]))[0]);
			zs.push(row);
		}
		return [{ type: 'surface', x: xs, y: ys, z: zs }];
	}

	async function caseB2(x_min, x_max, step) {
		const xs = range(x_min, x_max, step);
		const ys1 = [], ys2 = [];
		for (const x of xs) {
			const pred = await predict_single([x]);
			ys1.push(pred[0]);
			ys2.push(pred[1]);
		}
		return [{ type: 'surface', x: xs, y: [0, 1], z: [ys1, ys2] }];
	}

	const range = (start, end, step) => {
		const r = [];
		for (let v = start; v <= end; v += step) r.push(v);
		return r;
	};

	async function predict_single(arr) {
		try {
			if (typeof __predict === 'function' && typeof tensor === 'function' && typeof array_sync === 'function') {
				const pred = array_sync(await __predict(tensor([arr])));
				if (Array.isArray(pred) && Array.isArray(pred[0])) return pred[0];
			}
		} catch (e) {
			console.warn('predict_single failed, using fallback', e);
		}
		// fallback dummy model: simple math to visualize
		return [Math.sin(arr[0]) + (arr[1] ? Math.cos(arr[1]) : 0)];
	}

	// ---------------- plot + camera ----------------

	async function plot_preserve_camera(dom, data, layout = {}, config = {}, key = 'default') {
		if (!dom) return;
		const is3D = data.some(d => ['surface','heatmap','scatter3d'].includes(d.type));
		layout.font ||= { color: is_dark_mode ? '#fff' : '#141414' };
		layout.uirevision ||= key;

		if (is3D) {
			layout.scene ||= {};
			layout.scene.uirevision ||= key;
			const cachedCam = cameras.get(key);
			if (cachedCam && !layout.scene.camera)
				layout.scene.camera = cachedCam;
		}

		try { await Plotly.react(dom, data, layout, config); }
		catch(e) { console.error('Plotly.react failed', e); }

		if (is3D && !dom.__camera_listener) {
			const save = () => {
				try {
					const cam = dom._fullLayout?.scene?._scene?.getCamera?.();
					if (cam) cameras.set(key, cam);
				} catch {}
			};
			dom.on?.('plotly_relayout', save);
			dom.__camera_listener = true;
		}
	}

	function base_layout(plot_div, model) {
		const dark = typeof is_dark_mode !== 'undefined' && is_dark_mode;
		const color = dark ? '#fff' : '#000';
		return {
			margin: { t: 40 },
			width: plot_div.clientWidth,
			height: 400,
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
			font: { color },
			title: {
				text: `Model Plot (input: ${JSON.stringify(model.input.shape.slice(1))}, output: ${JSON.stringify(model.output.shape.slice(1))})`,
				font: { color }
			}
		};
	}

	// ---------------- utils ----------------

	function debounce(fn, delay = 300) {
		let t;
		return (...args) => {
			clearTimeout(t);
			t = setTimeout(() => fn(...args), delay);
		};
	}

	// ---------------- public API ----------------

	return { plot };

})();
