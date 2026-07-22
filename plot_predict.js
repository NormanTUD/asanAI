"use strict";

var ModelPlotter = (() => {
	const cameras = new Map();
	const _state = {};
	window.__ModelPlotterMeta = window.__ModelPlotterMeta || {};

	const get_state = id => _state[id] || {};
	const set_state = (id, obj) => _state[id] = obj;

	function check_and_reset_shape(div_id, plot_div, shape_key) {
		if (window.__ModelPlotterMeta.last_shapes && window.__ModelPlotterMeta.last_shapes !== shape_key) {
			reset_for_shape_change(div_id, plot_div);
		}
		window.__ModelPlotterMeta.last_shapes = shape_key;
	}

	function should_skip_update(div_id, state, force) {
		const current_weights = get_weights_as_string?.() || "";
		if (!force && state.last_weights === current_weights) return true;
		set_state(div_id, { ...state, last_weights: current_weights });
		return false;
	}

	function setup_controls_and_fields(div_id, plot_div, state, cases, update_fn) {
		const controls = ensure_controls(div_id, plot_div);
		controls.style.display = 'flex';
		const msg = ensure_message_box(controls);
		plot_div.style.display = 'none';
		const fields = ensure_inputs(div_id, controls, state, cases, update_fn);
		state.fields = fields;
		state.controls = controls;
		return { controls, msg, fields };
	}

	async function plot(div_id = 'plotly_predict', force = false) {
		const plot_div = document.getElementById(div_id);
		if (!plot_div) return;

		const state = get_state(div_id);

		if (!has_valid_model_shape()) {
			return total_hide(div_id, plot_div);
		}

		const in_shape = model?.input?.shape?.slice(1);
		const out_shape = model?.output?.shape?.slice(1);
		check_and_reset_shape(div_id, plot_div, JSON.stringify({ in_shape, out_shape }));

		if (should_skip_update(div_id, state, force)) return;

		const { fallA, fallB1, fallB2 } = detect_case();
		if (!fallA && !fallB1 && !fallB2) {
			return total_hide(div_id, plot_div);
		}

		const cases = { fallA, fallB1, fallB2 };
		const update_fn = async () =>
			await update_plot(plot_div, div_id, state.msg, state.fields || [], cases);
		state.update_plot = update_fn;

		const { msg, fields } = setup_controls_and_fields(div_id, plot_div, state, cases, update_fn);
		state.msg = msg;
		set_state(div_id, state);

		await state.update_plot();
	}

	function has_valid_model_shape() {
		return model?.input?.shape && model?.output?.shape;
	}

	// Hilfsfunktion: Versteckt nur die Grafik, lässt Controls da
	function hide_only_plot(plot_div) {
		try { Plotly.purge(plot_div); } catch {}
		plot_div.style.display = 'none';
	}

	// Hilfsfunktion: Versteckt alles (wenn Modell ungültig)
	function total_hide(div_id, plot_div) {
		hide_only_plot(plot_div);
		const controls = document.getElementById(div_id + '_controls');
		if (controls) controls.style.display = 'none';
	}

	function detect_case() {
		const in_shape = model?.input?.shape?.slice(1);
		const out_shape = model?.output?.shape?.slice(1);
		const fallA  = eq(in_shape, [1]) && eq(out_shape, [1]);
		const fallB1 = eq(in_shape, [2]) && eq(out_shape, [1]);
		const fallB2 = eq(in_shape, [1]) && eq(out_shape, [2]);
		return { fallA, fallB1, fallB2 };
	}

	const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

	function ensure_controls(div_id, plot_div) {
		let controls = document.getElementById(div_id + '_controls');
		if (!controls) {
			controls = document.createElement('div');
			controls.id = div_id + '_controls';
			plot_div.parentNode.insertBefore(controls, plot_div);

			controls.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px;';

			const headline = document.createElement('div');
			headline.textContent = 'Plot Configuration';
			headline.style.cssText = 'font-weight:bold;margin-right:10px;min-width:160px';
			controls.appendChild(headline);
		}
		return controls;
	}

	function ensure_message_box(controls) {
		let msg = controls.querySelector('.plot-msg');
		if (!msg) {
			msg = document.createElement('div');
			msg.className = 'plot-msg';
			msg.style.cssText = 'color:crimson;font-weight:bold;margin-top:4px';
			controls.appendChild(msg);
		}
		return msg;
	}

	function ensure_inputs(div_id, controls, state, cases, update_fn) {
		const sets = { A: ['x_min','x_max','step'], B1:['x_min','x_max','y_min','y_max','step'], B2:['x_min','x_max','step'] };
		const keys = cases.fallA ? sets.A : cases.fallB1 ? sets.B1 : sets.B2;
		const old_vals = Object.fromEntries((state.fields || []).map(f => [f.id, parseFloat(f.value)]));
		const fields = [];
		let msg = ensure_message_box(controls);

		for (const key of keys) {
			const id = div_id + '_' + key;
			let input = document.getElementById(id);
			if (!input) {
				const wrap = document.createElement('div');
				wrap.style.cssText = 'display:inline-flex;align-items:center;margin:4px 6px 4px 0';
				const l = document.createElement('label');
				l.textContent = key.replace('_', ' ') + ':';
				l.style.marginRight = '6px';
				input = document.createElement('input');
				Object.assign(input, { type: 'number', id });
				input.style.width = '60px';
				input.addEventListener('input', debounce(update_fn, 300));
				input.classList.add('no_red_on_error');
				input.classList.add('show_data');
				wrap.append(l, input);
				controls.insertBefore(wrap, msg);
			}
			if (old_vals[id] && !isNaN(old_vals[id])) input.value = old_vals[id];
			fields.push(input);
		}
		return fields;
	}

	async function run_case_prediction(msg, div_id, vals, cases) {
		const { x_min, x_max, step } = extract_vals(div_id, vals);
		if (x_min >= x_max || step <= 0 || step >= (x_max - x_min)) {
			msg.textContent = 'Check X range and Step.';
			return null;
		}

		if (cases.fallA) return caseA_batched(x_min, x_max, step);

		if (cases.fallB1) {
			const { y_min, y_max } = extract_vals(div_id, vals);
			if (y_min >= y_max) {
				msg.textContent = 'Y min < Y max required.';
				return null;
			}
			return caseB1_batched(x_min, x_max, y_min, y_max, step);
		}

		if (cases.fallB2) return caseB2_batched(x_min, x_max, step);
		return [];
	}

	async function update_plot(plot_div, div_id, msg, fields, cases) {
		msg.textContent = '';
		const vals = Object.fromEntries(fields.map(f => [f.id, parseFloat(f.value)]));

		if (fields.length === 0 || fields.some(f => f.value === "") || Object.values(vals).some(isNaN)) {
			return hide_only_plot(plot_div);
		}

		try {
			const data = await run_case_prediction(msg, div_id, vals, cases);
			if (data === null) return hide_only_plot(plot_div);

			plot_div.style.display = 'block';
			const layout = base_layout(plot_div);
			await plot_preserve_camera(plot_div, data, layout, {}, div_id);
		} catch (e) {
			console.error(e);
			hide_only_plot(plot_div);
		}
	}

	function extract_vals(div_id, vals) {
		const get = key => vals[div_id + '_' + key];
		return {
			x_min: get('x_min'), x_max: get('x_max'),
			y_min: get('y_min'), y_max: get('y_max'),
			step: get('step')
		};
	}

	async function caseA_batched(x_min, x_max, step) {
		const xs = range(x_min, x_max, step);
		const batch = xs.map(x => [x]);
		const preds = array_sync(await __predict(tensor(batch)));
		return [{ x: xs, y: preds.map(p => p[0]), mode: 'lines', line: { width: 2 } }];
	}

	async function caseB1_batched(x_min, x_max, y_min, y_max, step) {
		const xs = range(x_min, x_max, step);
		const ys = range(y_min, y_max, step);
		const batch = [];
		for (const x of xs) for (const y of ys) batch.push([x, y]);
		const preds = array_sync(await __predict(tensor(batch)));
		const zs = [];
		for (let i = 0; i < xs.length; i++) {
			zs.push(preds.slice(i * ys.length, (i + 1) * ys.length).map(p => p[0]));
		}
		return [{ type: 'surface', x: xs, y: ys, z: zs }];
	}

	async function caseB2_batched(x_min, x_max, step) {
		const xs = range(x_min, x_max, step);
		const batch = xs.map(x => [x]);
		const preds = array_sync(await __predict(tensor(batch)));
		return [{ type: 'surface', x: xs, y: [0, 1], z: [preds.map(p => p[0]), preds.map(p => p[1])] }];
	}

	const range = (start, end, step) => {
		const r = [];
		for (let v = start; v <= end; v += step) r.push(v);
		return r;
	};

	async function plot_preserve_camera(dom, data, layout = {}, config = {}, key = 'default') {
		if (!dom) return;
		const is3D = data.some(d => ['surface','heatmap','scatter3d'].includes(d.type));
		layout.uirevision = key;

		if (dom._fullLayout?.scene?._scene?.getCamera) {
			try {
				const cam = dom._fullLayout.scene._scene.getCamera();
				if (cam) cameras.set(key, cam);
			} catch {}
		}

		const cachedCam = cameras.get(key);
		if (is3D && cachedCam) {
			layout.scene = layout.scene || {};
			layout.scene.camera = cachedCam;
		}

		try { await Plotly.react(dom, data, layout, config); }
		catch(e) { console.error('Plotly.react failed', e); }

		if (is3D && !dom.__camera_listener) {
			dom.on?.('plotly_relayout', () => {
				const cam = dom._fullLayout?.scene?._scene?.getCamera?.();
				if (cam) cameras.set(key, cam);
			});
			dom.__camera_listener = true;
		}
	}

	function base_layout(plot_div) {
		const dark = typeof is_dark_mode !== 'undefined' && is_dark_mode;
		const color = dark ? '#fff' : '#000';
		return {
			margin: { t: 40 },
			width: plot_div.clientWidth,
			height: 600,
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
			font: { color },
			title: { text: `Model Prediction`, font: { color } }
		};
	}

	function debounce(fn, delay = 300) {
		let t;
		return (...args) => {
			clearTimeout(t);
			t = setTimeout(() => fn(...args), delay);
		};
	}

	function reset_for_shape_change(div_id, plot_div) {
		total_hide(div_id, plot_div);
		const controls = document.getElementById(div_id + '_controls');
		if (controls) controls.remove();
		delete _state[div_id];
	}

	return { plot };
})();
