"use strict";

const ModelPlotter = (() => {
	const cameras = new Map();
	const _state = {};
	window.__ModelPlotterMeta = window.__ModelPlotterMeta || {};

	const get_state = id => _state[id] || {};
	const set_state = (id, obj) => _state[id] = obj;

	async function plot(div_id = 'plotly_predict', force = false) {
		//dbg(`[ModelPlotter] plotting ${div_id} (force=${force})`);
		const plot_div = document.getElementById(div_id);
		if (!plot_div) return dbg(`[ModelPlotter] No div: ${div_id}`);

		const state = get_state(div_id);

		if (!has_valid_model_shape())
			return hide_plot(plot_div);

		const in_shape = model?.input?.shape?.slice(1);
		const out_shape = model?.output?.shape?.slice(1);
		const shape_key = JSON.stringify({ in_shape, out_shape });
		if (window.__ModelPlotterMeta.last_shapes && window.__ModelPlotterMeta.last_shapes !== shape_key) {
			dbg('[ModelPlotter] model shape changed -> resetting UI and state');
			reset_for_shape_change(div_id, plot_div);
		}
		window.__ModelPlotterMeta.last_shapes = shape_key;

		const current_weights = get_weights_as_string?.() || "";
		if (!force && state.last_weights === current_weights)
			return; // dbg('[ModelPlotter] weights unchanged, skipping');

		set_state(div_id, { ...state, last_weights: current_weights });

		const { fallA, fallB1, fallB2 } = detect_case();
		if (!fallA && !fallB1 && !fallB2)
			return hide_plot(plot_div);

		const controls = ensure_controls(div_id, plot_div);
		const msg = ensure_message_box(controls);
		configure_plot_div(plot_div);

		const update_fn = async () =>
			await update_plot(plot_div, div_id, msg, state.fields || [], { fallA, fallB1, fallB2 });
		state.update_plot = update_fn;

		const fields = ensure_inputs(div_id, controls, state, { fallA, fallB1, fallB2 }, update_fn);
		state.fields = fields;
		state.controls = controls;

		set_state(div_id, state);

		if (force && typeof state.update_plot === 'function')
			await state.update_plot();

		//dbg('[ModelPlotter] UI ready');
	}

	function has_valid_model_shape() {
		return model?.input?.shape && model?.output?.shape;
	}

	function hide_plot(plot_div) {
		//dbg('[ModelPlotter] hide plot');
		try { Plotly.purge(plot_div); } catch {}
		plot_div.style.display = 'none';
	}

	function detect_case() {
		const in_shape = model?.input?.shape?.slice(1);
		const out_shape = model?.output?.shape?.slice(1);
		const fallA  = eq(in_shape, [1]) && eq(out_shape, [1]);
		const fallB1 = eq(in_shape, [2]) && eq(out_shape, [1]);
		const fallB2 = eq(in_shape, [1]) && eq(out_shape, [2]);
		//dbg(`[ModelPlotter] A=${fallA} B1=${fallB1} B2=${fallB2}`);
		return { fallA, fallB1, fallB2 };
	}

	const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

	function ensure_controls(div_id, plot_div) {
		let controls = document.getElementById(div_id + '_controls');
		if (!controls) {
			controls = document.createElement('div');
			controls.id = div_id + '_controls';
			plot_div.parentNode.insertBefore(controls, plot_div);
			dbg('Created controls');

			// default layout styles for inline inputs and headline
			controls.style.display = 'flex';
			controls.style.flexWrap = 'wrap';
			controls.style.alignItems = 'center';
			controls.style.gap = '8px';
			controls.style.marginBottom = '8px';

			// headline (if not present later)
			const headline = document.createElement('div');
			headline.className = 'plot-headline';
			headline.textContent = 'Plot Configuration';
			headline.style.cssText = 'font-weight:bold;margin-right:10px;min-width:160px';
			controls.appendChild(headline);
		}// else dbg('Reusing controls');

		controls.style.display = 'flex';
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

	function ensure_inputs(div_id, controls, state, { fallA, fallB1, fallB2 }, update_fn) {
		const sets = {
			A: ['x_min','x_max','step'],
			B1:['x_min','x_max','y_min','y_max','step'],
			B2:['x_min','x_max','step']
		};
		const keys = fallA ? sets.A : fallB1 ? sets.B1 : sets.B2;
		const old_vals = Object.fromEntries((state.fields || []).map(f => [f.id, parseFloat(f.value)]));
		const fields = [];

		// make sure message box is last child so we can insert inputs before it
		let msg = controls.querySelector('.plot-msg');
		if (!msg) {
			msg = ensure_message_box(controls);
		}

		for (const key of keys) {
			const id = div_id + '_' + key;
			let input = document.getElementById(id);
			if (!input) {
				const wrap = document.createElement('div');
				wrap.style.display = 'inline-flex';
				wrap.style.alignItems = 'center';
				wrap.style.margin = '4px 6px 4px 0';
				const l = document.createElement('label');
				l.textContent = key.replace('_', ' ') + ':';
				l.style.marginRight = '6px';
				input = document.createElement('input');
				Object.assign(input, { type: 'number', id });
				input.classList.add('no_red_bg_when_empty');
				input.classList.add('show_data');
				input.style.cssText = 'width:60px';
				input.addEventListener('input', debounce(update_fn, 300));
				wrap.append(l, input);
				controls.insertBefore(wrap, msg);
			}
			if (old_vals[id] && !isNaN(old_vals[id])) input.value = old_vals[id];
			fields.push(input);
		}
		return fields;
	}

	function configure_plot_div(div) {
		Object.assign(div.style, {
			width: '100%',
			height: '600px',
			maxHeight: '600px',
			display: 'block'
		});
	}

	async function update_plot(plot_div, div_id, msg, fields, { fallA, fallB1, fallB2 }) {
		msg.textContent = '';
		const vals = Object.fromEntries(fields.map(f => [f.id, parseFloat(f.value)]));
		if (Object.values(vals).some(isNaN)) return hide_plot(plot_div, {}, null);

		$(plot_div).show();

		const { x_min, x_max, step } = extract_vals(div_id, vals);
		if (x_min >= x_max) return msg.textContent = 'X min must be smaller than X max.';
		if (step <= 0 || step >= (x_max - x_min)) return msg.textContent = 'Invalid step value';

		let data = [];
		if (fallA) data = await caseA_batched(x_min, x_max, step);
		else if (fallB1) {
			const { y_min, y_max } = extract_vals(div_id, vals);
			if (y_min >= y_max) return msg.textContent = 'Y min must be smaller than Y max.';
			data = await caseB1_batched(x_min, x_max, y_min, y_max, step);
		} else if (fallB2) data = await caseB2_batched(x_min, x_max, step);

		const layout = base_layout(plot_div);
		await plot_preserve_camera(plot_div, data, layout, {}, div_id);
	}

	function extract_vals(div_id, vals) {
		const get = key => vals[div_id + '_' + key];
		return {
			x_min: get('x_min'), x_max: get('x_max'),
			y_min: get('y_min'), y_max: get('y_max'),
			step: get('step')
		};
	}

	// BATCHED versions: build batch arrays and call __predict exactly once per sweep

	async function caseA_batched(x_min, x_max, step) {
		const xs = range(x_min, x_max, step);
		if (xs.length === 0) return [{ x: xs, y: [], mode: 'lines', line: { width: 2 } }];
		const batch = xs.map(x => [x]); // shape [N,1]
		const preds = array_sync(await __predict(tensor(batch)));
		const ys = preds.map(p => p[0]);
		return [{ x: xs, y: ys, mode: 'lines', line: { width: 2 } }];
	}

	async function caseB1_batched(x_min, x_max, y_min, y_max, step) {
		const xs = range(x_min, x_max, step);
		const ys = range(y_min, y_max, step);
		if (xs.length === 0 || ys.length === 0) return [{ type: 'surface', x: xs, y: ys, z: [] }];

		const batch = [];
		for (const x of xs) for (const y of ys) batch.push([x, y]); // shape [N,2]
		const preds = array_sync(await __predict(tensor(batch))); // preds.length === xs.length * ys.length
		const zs = [];
		for (let i = 0; i < xs.length; i++) {
			const row = preds.slice(i * ys.length, (i + 1) * ys.length).map(p => p[0]);
			zs.push(row);
		}
		return [{ type: 'surface', x: xs, y: ys, z: zs }];
	}

	async function caseB2_batched(x_min, x_max, step) {
		const xs = range(x_min, x_max, step);
		if (xs.length === 0) return [{ type: 'surface', x: xs, y: [0,1], z: [[],[]] }];
		const batch = xs.map(x => [x]); // shape [N,1]
		const preds = array_sync(await __predict(tensor(batch)));
		const ys1 = preds.map(p => p[0]);
		const ys2 = preds.map(p => p[1]);
		return [{ type: 'surface', x: xs, y: [0, 1], z: [ys1, ys2] }];
	}

	const range = (start, end, step) => {
		const r = [];
		for (let v = start; v <= end; v += step) r.push(v);
		return r;
	};

	// Keep original single predict utility for backwards compatibility,
	// but the CASE functions above use batched __predict calls.
	async function predict_single(arr) {
		const pred = array_sync(await __predict(tensor([arr])));
		return pred[0];
	}

	async function plot_preserve_camera(dom, data, layout = {}, config = {}, key = 'default') {
		if (!dom) return;
		const is3D = data.some(d => ['surface','heatmap','scatter3d'].includes(d.type));
		layout.font ||= { color: is_dark_mode ? '#fff' : '#141414' };
		layout.uirevision ||= key;

		if (is3D) {
			layout.scene ||= {};
			layout.scene.uirevision ||= key;
			const cachedCam = cameras.get(key);
			if (cachedCam) layout.scene.camera = cachedCam;
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
			title: {
				text: `Model Plot (input: ${JSON.stringify(model?.input?.shape?.slice(1))}, output: ${JSON.stringify(model?.output?.shape?.slice(1))})`,
				font: { color }
			}
		};
	}

	function debounce(fn, delay = 300) {
		let t;
		return (...args) => {
			clearTimeout(t);
			t = setTimeout(() => fn(...args), delay);
		};
	}

	// helper: reset UI/state when shape changed
	function reset_for_shape_change(div_id, plot_div) {
		try { Plotly.purge(plot_div); } catch {}
		const controls = document.getElementById(div_id + '_controls');
		if (controls) controls.remove();
		delete _state[div_id];
		// keep last_shapes updated by caller; nothing else to do
	}

	return { plot };
})();
