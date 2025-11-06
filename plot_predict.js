async function plot_model_in_div(div_id = 'plotly_predict') {
	dbg('[plot_model_in_div] called');

	const plot_div = document.getElementById(div_id);
	if (!plot_div) {
		dbg('[plot_model_in_div] No plot div found: ' + div_id);
		return;
	}

	if (!plot_model_in_div._state) plot_model_in_div._state = {};
	const state = plot_model_in_div._state[div_id] || {};
	const last_time = Math.max(last_updated_page, last_training_time);
	const current_time = typeof last_time !== 'undefined' ? last_time : null;
	dbg('[plot_model_in_div] Current training time: ' + current_time);

	if (!model?.input?.shape || !model?.output?.shape) {
		dbg('[plot_model_in_div] Model missing or has no valid shape');
		Plotly.purge(plot_div);
		plot_div.style.display = 'none';
		if (state.controls) state.controls.style.display = 'none';
		plot_model_in_div._state[div_id] = { last_time: current_time };
		return;
	}

	if (state.last_time === current_time) {
		dbg('[plot_model_in_div] Model already plotted with same training time, skipping rebuild');
		return;
	}

	plot_model_in_div._state[div_id] = { last_time: current_time };
	dbg('[plot_model_in_div] Model changed or first plot, initializing UI');

	const input_shape = model.input.shape.slice(1);
	const output_shape = model.output.shape.slice(1);

	const fallA = JSON.stringify(input_shape) === '[1]' && JSON.stringify(output_shape) === '[1]';
	const fallB1 = JSON.stringify(input_shape) === '[2]' && JSON.stringify(output_shape) === '[1]';
	const fallB2 = JSON.stringify(input_shape) === '[1]' && JSON.stringify(output_shape) === '[2]';
	dbg(`[plot_model_in_div] FallA=${fallA} FallB1=${fallB1} FallB2=${fallB2}`);

	if (!fallA && !fallB1 && !fallB2) {
		dbg('[plot_model_in_div] Unsupported shape combination, hiding plot');
		Plotly.purge(plot_div);
		plot_div.style.display = 'none';
		return;
	}

	let controls = document.getElementById(div_id + '_controls');
	if (!controls) {
		controls = document.createElement('div');
		controls.id = div_id + '_controls';
		plot_div.parentNode.insertBefore(controls, plot_div);
		dbg('Created controls div');
	} else {
		dbg('Reusing existing controls div');
	}
	controls.style.display = 'block';
	state.controls = controls;

	const msg = document.createElement('div');
	msg.style.color = 'crimson';
	msg.style.fontWeight = 'bold';
	msg.style.marginTop = '4px';
	controls.innerHTML = '';
	controls.appendChild(msg);

	function create_input(label, id, default_value) {
		const wrap = document.createElement('div');
		wrap.style.margin = '4px 0';
		const l = document.createElement('label');
		l.textContent = label + ': ';
		const i = document.createElement('input');
		i.type = 'number';
		i.id = id;
		i.style.width = '90px';
		i.style.marginLeft = '4px';
		if (default_value !== undefined && !isNaN(default_value)) i.value = default_value;
		i.addEventListener('input', update_plot);
		wrap.appendChild(l);
		wrap.appendChild(i);
		controls.appendChild(wrap);
		return i;
	}

	let old_values = {};
	if (state.fields) {
		for (const f of state.fields) old_values[f.id] = parseFloat(f.value);
	}

	let fields = [];
	if (fallA) {
		fields = [
			create_input('X min', div_id + '_x_min', old_values[div_id + '_x_min']),
			create_input('X max', div_id + '_x_max', old_values[div_id + '_x_max']),
			create_input('Step', div_id + '_step', old_values[div_id + '_step'])
		];
	} else if (fallB1) {
		fields = [
			create_input('X min', div_id + '_x_min', old_values[div_id + '_x_min']),
			create_input('X max', div_id + '_x_max', old_values[div_id + '_x_max']),
			create_input('Y min', div_id + '_y_min', old_values[div_id + '_y_min']),
			create_input('Y max', div_id + '_y_max', old_values[div_id + '_y_max']),
			create_input('Step', div_id + '_step', old_values[div_id + '_step'])
		];
	} else if (fallB2) {
		fields = [
			create_input('X min', div_id + '_x_min', old_values[div_id + '_x_min']),
			create_input('X max', div_id + '_x_max', old_values[div_id + '_x_max']),
			create_input('Step', div_id + '_step', old_values[div_id + '_step'])
		];
	}

	state.fields = fields;

	plot_div.style.width = '100%';
	plot_div.style.height = '400px';
	plot_div.style.maxHeight = '400px';

	// --- CAMERA SUPPORT ---
	if (!window.__tfjs_weights_plot_cameras)
		window.__tfjs_weights_plot_cameras = new Map();

	async function plot_preserve_camera(dom, data, layout = {}, config = {}, plotKey) {
		if (!dom) return;

		if (!layout.font) layout.font = {};
		layout.font.color = is_dark_mode ? "#fff" : "#141414";

		const is3D = data.some(d => ['surface','heatmap','scatter3d'].includes(d.type));
		const uirevKey = plotKey || (dom.__uirevisionKey = dom.__uirevisionKey || ("uirev_" + Math.random().toString(36).slice(2)));

		layout.uirevision = layout.uirevision || uirevKey;
		if (is3D) {
			layout.scene = layout.scene || {};
			layout.scene.uirevision = layout.scene.uirevision || uirevKey;
		}

		const cachedCam = plotKey && window.__tfjs_weights_plot_cameras.has(plotKey)
			? window.__tfjs_weights_plot_cameras.get(plotKey)
			: dom.__lastCamera || null;

		if (is3D && cachedCam && !layout.scene.camera)
			layout.scene.camera = cachedCam;

		try {
			await Plotly.react(dom, data, layout, config);
		} catch(e) {
			console.error("Plotly.react failed", e);
		}

		if (is3D && cachedCam) {
			try {
				const currentCam = dom._fullLayout?.scene?.camera;
				if (JSON.stringify(currentCam) !== JSON.stringify(cachedCam))
					await Plotly.relayout(dom, {'scene.camera': cachedCam});
			} catch(e) {
				console.warn("Restoring cached camera failed", e);
			}
		}

		if (is3D && !dom.__plotly_camera_listeners_attached) {
			const saveCamera = () => {
				try {
					const sceneObj = dom._fullLayout?.scene?._scene;
					if (sceneObj && typeof sceneObj.getCamera === 'function') {
						const cam = sceneObj.getCamera();
						dom.__lastCamera = cam;
						if (plotKey) window.__tfjs_weights_plot_cameras.set(plotKey, cam);
					}
				} catch(e) { console.warn("Camera save failed", e); }
			};
			try {
				if (typeof dom.on === 'function')
					dom.on('plotly_relayout', saveCamera);
				else if (Plotly?.Plots?.addListener)
					Plotly.Plots.addListener(dom, 'plotly_relayout', saveCamera);
			} catch(e) {
				console.warn("Failed to attach camera listener", e);
			}
			dom.__plotly_camera_listeners_attached = true;
		}
	}

	async function update_plot() {
		msg.textContent = '';
		const vals = Object.fromEntries(fields.map(f => [f.id, parseFloat(f.value)]));
		const all_filled = Object.values(vals).every(v => !isNaN(v));
		if (!all_filled) {
			Plotly.purge(plot_div);
			plot_div.style.display = 'none';
			return;
		}

		const x_min = vals[div_id + '_x_min'];
		const x_max = vals[div_id + '_x_max'];
		const step = vals[div_id + '_step'];

		if (x_min >= x_max) { msg.textContent = 'X min must be smaller than X max.'; return; }
		if (step <= 0 || step >= (x_max - x_min)) { msg.textContent = 'Invalid step value'; return; }

		const dark = typeof is_dark_mode !== 'undefined' && is_dark_mode;
		const font_color = dark ? '#fff' : '#000';
		const bg_color = 'rgba(0,0,0,0)';

		const base_layout = {
			margin: { t: 40 },
			width: plot_div.clientWidth,
			height: 400,
			paper_bgcolor: bg_color,
			plot_bgcolor: bg_color,
			font: { color: font_color },
			title: {
				text: `Model Plot (input: ${JSON.stringify(input_shape)}, output: ${JSON.stringify(output_shape)})`,
				font: { color: font_color }
			}
		};

		let data = [];

		if (fallA) {
			const xs = [], ys = [];
			for (let x = x_min; x <= x_max; x += step) xs.push(x);
			for (const x of xs) {
				const pred = array_sync(await __predict(tensor([x])));
				ys.push(pred[0][0]);
			}
			data = [{ x: xs, y: ys, mode: 'lines', line: { width: 2 } }];
			await plot_preserve_camera(plot_div, data, { ...base_layout, xaxis: { title: 'Input (X)' }, yaxis: { title: 'Output' } });
		}

		else if (fallB1) {
			const y_min = vals[div_id + '_y_min'];
			const y_max = vals[div_id + '_y_max'];
			if (y_min >= y_max) { msg.textContent = 'Y min must be smaller than Y max.'; return; }
			const xs = [], ys = [], zs = [];
			for (let x = x_min; x <= x_max; x += step) xs.push(x);
			for (let y = y_min; y <= y_max; y += step) ys.push(y);
			for (let xi = 0; xi < xs.length; xi++) {
				const row = [];
				for (let yi = 0; yi < ys.length; yi++) {
					const pred = array_sync(await __predict(tensor([[xs[xi], ys[yi]]])));
					row.push(pred[0][0]);
				}
				zs.push(row);
			}
			data = [{ type: 'surface', x: xs, y: ys, z: zs }];
			await plot_preserve_camera(plot_div, data, {
				...base_layout,
				scene: {
					xaxis: { title: 'X', color: font_color },
					yaxis: { title: 'Y', color: font_color },
					zaxis: { title: 'Output', color: font_color }
				}
			});
		}

		else if (fallB2) {
			const xs = [], ys1 = [], ys2 = [];
			for (let x = x_min; x <= x_max; x += step) xs.push(x);
			for (const x of xs) {
				const pred = array_sync(await __predict(tensor([x])));
				ys1.push(pred[0][0]);
				ys2.push(pred[0][1]);
			}
			data = [{ type: 'surface', x: xs, y: [0, 1], z: [ys1, ys2] }];
			await plot_preserve_camera(plot_div, data, {
				...base_layout,
				scene: {
					xaxis: { title: 'Input (X)', color: font_color },
					yaxis: { title: 'Output Dim', color: font_color },
					zaxis: { title: 'Value', color: font_color }
				}
			});
		}
	}

	state.update_plot = update_plot;
	dbg('UI initialized successfully, waiting for input');
}
