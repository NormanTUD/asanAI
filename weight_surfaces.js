// Kamera-Cache global
window.__tfjs_weights_plot_cameras = window.__tfjs_weights_plot_cameras || new Map();

var visualize_model_weights = async function(container_or_id, options = {}, force = false) {
	const opts = Object.assign({
		max_slices: 8,
		plot3d: true,
		plot2d: true,
		container_width_pct: 0.92
	}, options);

	// ─── CI / Test Environment Detection ────────────────────────────────────────
	// In headless CI (e.g. GitHub Actions with Playwright), 3D Plotly surfaces
	// are extremely slow due to lack of GPU acceleration. Disable them and
	// reduce slice count to prevent 6h+ timeouts.
	if (typeof is_running_test !== 'undefined' && is_running_test) {
		opts.plot3d = false;
		opts.max_slices = 1;
	}

	const title_font_config = { size: 15, family: 'Inter, system-ui, sans-serif' };

	if (container_or_id) {
		try {
			if (!$("#" + container_or_id).is(":visible") && !force) {
				return;
			}
		} catch (e) {}
	}

	// ─── Helpers ────────────────────────────────────────────────────────────────

	function _dark() {
		return typeof is_dark_mode !== 'undefined' && is_dark_mode === true;
	}

	function _colors() {
		const dark = _dark();
		return {
			paper: 'rgba(0,0,0,0)',
			plot: dark ? 'rgba(20,20,30,0.35)' : 'rgba(255,255,255,0.5)',
			font: dark ? '#e4e4e8' : '#1a1a2e',
			grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
			axis_line: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
			tick: dark ? '#b0b0c0' : '#4a4a5a',
			title: dark ? '#f0f0ff' : '#111128',
			marker_line: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.3)',
			colorbar_bg: dark ? 'rgba(30,30,50,0.7)' : 'rgba(255,255,255,0.85)'
		};
	}

	function make_id(prefix) {
		return prefix + "_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 1e6).toString(36);
	}

	function ensure_container(target) {
		let parent;
		if (!target) {
			parent = document.createElement('div');
			parent.id = make_id('tfjs_weights_parent');
			document.body.appendChild(parent);
			return parent;
		}
		if (typeof target === 'string') {
			parent = document.getElementById(target);
			if (!parent) {
				parent = document.createElement('div');
				parent.id = target;
				document.body.appendChild(parent);
			}
		} else if (target instanceof Element) {
			parent = target;
		} else {
			parent = document.createElement('div');
			parent.id = make_id('tfjs_weights_parent');
			document.body.appendChild(parent);
		}
		return parent;
	}

	function show_message_in_container(container, msg) {
		const el = document.createElement('div');
		el.textContent = msg;
		el.style.cssText = 'margin:8px 0;padding:8px 14px;font-weight:600;font-size:13px;border-radius:6px;' +
			'background:' + (_dark() ? 'rgba(255,180,60,0.12)' : 'rgba(0,0,0,0.04)') + ';' +
			'color:' + (_dark() ? '#ffcc80' : '#555') + ';' +
			'border-left:3px solid ' + (_dark() ? '#ffb74d' : '#ccc') + ';';
		container.appendChild(el);
	}

	function safe_get_layer_weights(layer) {
		try {
			if (!layer) return [];
			const w = layer.weights || layer.trainableWeights || (typeof layer.getWeights === 'function' ? layer.getWeights() : []);
			if (!Array.isArray(w)) return [];
			return w.map(item => {
				if (!item) return null;
				if (item.val !== undefined) return item.val;
				if (item.tensor !== undefined) return item.tensor;
				return item;
			});
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	function shape_from(obj) {
		try {
			return get_shape_from_array_or_tensor(obj);
		} catch (e) {
			console.error('shape_from failed', e);
			return null;
		}
	}

	function array_from_tensor_or_array(obj) {
		try {
			if (!obj) return null;
			if (typeof array_sync === 'function') {
				try {
					if (tensor_is_disposed(obj)) return null;
					return array_sync(obj);
				} catch (e) {}
			}
			if (obj.arraySync) return obj.arraySync();
			if (obj.dataSync) {
				const data = Array.from(obj.dataSync());
				const s = shape_from(obj) || [data.length];
				return reshape_flat_array(data, s);
			}
			return obj;
		} catch (e) {
			console.error("array_from_tensor_or_array failed", e);
			return null;
		}
	}



	function to_float_matrix(arr2d) {
		if (!Array.isArray(arr2d)) return null;
		const m = arr2d.length;
		const n = arr2d[0] ? arr2d[0].length : 0;
		const z = [];
		for (let i = 0; i < m; i++) {
			const row = arr2d[i];
			const r = new Array(n);
			for (let j = 0; j < n; j++) r[j] = parseFloat(row[j]) || 0;
			z.push(r);
		}
		return z;
	}

	function safe_plotly_resize(div) {
		if (!div || !div.offsetParent) return;
		requestAnimationFrame(() => {
			if (div && div.offsetParent) Plotly.Plots.resize(div);
		});
	}

	// ─── Axis Templates ─────────────────────────────────────────────────────────

	function _axis2d(label) {
		const c = _colors();
		return {
			title: { text: label, font: { size: 12, color: c.font, family: 'Inter, system-ui, sans-serif' } },
			gridcolor: c.grid,
			gridwidth: 1,
			zerolinecolor: c.axis_line,
			zerolinewidth: 1.5,
			linecolor: c.axis_line,
			linewidth: 1,
			tickfont: { size: 10, color: c.tick },
			showgrid: true,
			showline: true
		};
	}

	function _axis3d(label) {
		const c = _colors();
		return {
			title: { text: label, font: { size: 11, color: c.font, family: 'Inter, system-ui, sans-serif' } },
			gridcolor: c.grid,
			gridwidth: 1,
			zerolinecolor: c.axis_line,
			tickfont: { size: 9, color: c.tick },
			backgroundcolor: _dark() ? 'rgba(15,15,25,0.4)' : 'rgba(245,245,255,0.5)',
			showbackground: true
		};
	}

	function _scene(xLabel, yLabel, zLabel) {
		return {
			xaxis: _axis3d(xLabel || 'X'),
			yaxis: _axis3d(yLabel || 'Y'),
			zaxis: _axis3d(zLabel || 'Z (value)'),
			aspectmode: 'auto',
			dragmode: 'turntable'
		};
	}

	function _base_layout(titleText, is3d) {
		const c = _colors();
		const layout = {
			title: {
				text: titleText,
				font: Object.assign({}, title_font_config, { color: c.title }),
				x: 0.5,
				xanchor: 'center'
			},
			margin: is3d ? { t: 50, b: 30, l: 30, r: 30 } : { t: 50, b: 55, l: 60, r: 30 },
			autosize: true,
			paper_bgcolor: c.paper,
			plot_bgcolor: c.plot,
			font: { color: c.font, family: 'Inter, system-ui, sans-serif' }
		};
		if (!is3d) {
			layout.xaxis = _axis2d('Index');
			layout.yaxis = _axis2d('Value');
		}
		return layout;
	}

	// ─── Plot Div Creation ──────────────────────────────────────────────────────

	function create_plot_div(parent, title_text, plotKey) {
		try {
			let safeKey = plotKey;
			if (!safeKey) {
				safeKey = (title_text || "plot").replace(/\s+/g, '_').replace(/[^\w-]/g, '');
			}
			try {
				const existing = parent.querySelector('[data-plot-key="' + safeKey + '"]');
				if (existing) return existing;
			} catch (e) {}

			const wrapper = document.createElement('div');
			const right = document.querySelector("#right_side");
			const width = right ? right.clientWidth * opts.container_width_pct : 640;
			wrapper.style.cssText = `
    width: ${width}px;
    height: 560px;
    margin-bottom: 20px;
    box-sizing: border-box;
    position: relative;
    border-radius: 10px;
    box-shadow: ${_dark()
		    ? '0 2px 16px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.06)'
		    : '0 2px 12px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1)'};
    overflow: hidden;
    background: ${_dark() ? 'rgba(22,22,35,0.6)' : 'rgba(255,255,255,0.7)'};
    backdrop-filter: blur(4px);
`;

			const spinnerPlaceholder = document.createElement('div');
			spinnerPlaceholder.className = 'plot-spinner-placeholder';
			spinnerPlaceholder.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
`;
			spinnerPlaceholder.innerHTML = `<div class="spinner"></div>`;
			wrapper.appendChild(spinnerPlaceholder);

			const plotDiv = document.createElement('div');
			plotDiv.style.width = '100%';
			plotDiv.style.height = '560px';
			plotDiv.style.opacity = '0';
			plotDiv.style.position = 'relative';
			plotDiv.style.zIndex = '2';
			plotDiv.__lastCamera = null;
			plotDiv.dataset.plotKey = safeKey;

			try {
				const ro = new ResizeObserver(() => {
					const newWidth = right ? right.clientWidth * opts.container_width_pct : 640;
					wrapper.style.width = newWidth + 'px';
					safe_plotly_resize(plotDiv);
				});
				ro.observe(right || document.body);
			} catch (e) {}

			wrapper.appendChild(plotDiv);
			parent.appendChild(wrapper);
			return plotDiv;
		} catch (e) {
			console.error("create_plot_div failed", e);
			return null;
		}
	}

	// ─── Plot with Camera Preservation ──────────────────────────────────────────

	async function _plot_preserve_camera(dom, data, layout = {}, config = {}, plotKey) {
		if (!dom) return;

		const c = _colors();
		layout.font = layout.font || {};
		layout.font.color = c.font;
		layout.font.family = layout.font.family || 'Inter, system-ui, sans-serif';

		config = Object.assign({
			responsive: true,
			displayModeBar: true,
			modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'],
			displaylogo: false,
			toImageButtonOptions: {
				format: 'png',
				filename: plotKey || 'weight_plot',
				scale: 2
			}
		}, config);

		const is3D = data.some(d => ['surface', 'heatmap', 'scatter3d', 'isosurface'].includes(d.type) && d.type !== 'heatmap');
		const uirevKey = plotKey || (dom.__uirevisionKey = dom.__uirevisionKey || ("uirev_" + Math.random().toString(36).slice(2)));

		layout.uirevision = layout.uirevision || uirevKey;
		if (is3D) {
			layout.scene = layout.scene || {};
			layout.scene.uirevision = layout.scene.uirevision || uirevKey;
		}

		const cachedCam = plotKey && window.__tfjs_weights_plot_cameras.has(plotKey)
			? window.__tfjs_weights_plot_cameras.get(plotKey)
			: dom.__lastCamera || null;

		if (is3D && cachedCam && !layout.scene.camera) {
			layout.scene.camera = cachedCam;
		}

		try {
			await Plotly.react(dom, data, layout, config);
		} catch (err) {
			console.error("Plotly.react failed", err);
		}

		if (is3D && cachedCam) {
			try {
				const currentCam = dom._fullLayout?.scene?.camera;
				if (JSON.stringify(currentCam) !== JSON.stringify(cachedCam)) {
					await Plotly.relayout(dom, { 'scene.camera': cachedCam });
				}
			} catch (e) {
				console.warn("Forcing cached camera failed", e);
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
				} catch (e) { console.warn("Camera save failed", e); }
			};

			try {
				if (typeof dom.on === 'function') {
					dom.on('plotly_relayout', saveCamera);
				} else if (Plotly && typeof Plotly.Plots.addListener === 'function') {
					Plotly.Plots.addListener(dom, 'plotly_relayout', saveCamera);
				}
			} catch (e) {
				console.warn("Failed to attach camera listener", e);
			}
			dom.__plotly_camera_listeners_attached = true;
		}

		if (dom.parentNode) {
			dom.parentNode.style.visibility = 'visible';
			dom.style.opacity = '1';
			const spinner = dom.parentNode.querySelector('.plot-spinner-placeholder');
			if (spinner) spinner.remove();
		}

		try { safe_plotly_resize(dom); } catch (e) {}
	}

	// ─── Main Render Logic ──────────────────────────────────────────────────────

	// ─── Render Helpers (split from render_weight_array) ────────────────────────





	async function _render_3d_slice(parent, arr, shape, title, baseKey, sliceIndex) {
		const c = _colors();
		const slice = arr.map(r => r.map(col => col[sliceIndex]));
		const key = baseKey + "_slice_" + sliceIndex;
		const sliceTitle = `${title} — Filter ${sliceIndex}/${shape[2]} [${shape[0]}×${shape[1]}]`;
		const plotDiv = create_plot_div(parent, sliceTitle, key);
		const layout = _base_layout(sliceTitle, true);
		layout.scene = _scene('Kernel X', 'Kernel Y', 'Weight Value');

		await _plot_preserve_camera(plotDiv, [{
			z: to_float_matrix(slice),
			type: 'surface',
			colorscale: 'Electric',
			lighting: { ambient: 0.55, diffuse: 0.65, specular: 0.4, roughness: 0.4, fresnel: 0.2 },
			contours: { z: { show: true, usecolormap: true, project: { z: true } } },
			hovertemplate: 'X: %{x}<br>Y: %{y}<br>Weight: %{z:.6f}<extra></extra>',
			colorbar: {
				title: { text: 'Weight', side: 'right', font: { size: 10, color: c.font } },
				thickness: 12, tickfont: { size: 9, color: c.tick }
			}
		}], layout, {}, plotDiv.dataset.plotKey);
	}

	async function _render_3d(parent, arr, shape, title, baseKey) {
		const slices = Math.min(shape[2], opts.max_slices);
		for (let i = 0; i < slices; i++) {
			await new Promise(r => setTimeout(r, 0));
			await _render_3d_slice(parent, arr, shape, title, baseKey, i);
		}
	}

	async function _render_4d_slice(parent, arr, shape, title, baseKey, filterIndex) {
		const c = _colors();
		const [h, w, inCh] = shape;
		const slice4 = arr.map(f => f.map(r => r.map(col => col[filterIndex])));
		const surfaceData = slice4.map(row => row.map(col => col[0]));

		const key = baseKey + "_slice4_" + filterIndex;
		const sliceTitle = `${title} — Output Filter ${filterIndex}/${shape[3]} [${h}×${w}×${inCh}]`;
		const plotDiv4 = create_plot_div(parent, sliceTitle, key);
		const layout = _base_layout(sliceTitle, true);
		layout.scene = _scene('Kernel Width', 'Kernel Height', 'Weight Value');

		await _plot_preserve_camera(plotDiv4, [{
			z: to_float_matrix(surfaceData),
			type: 'surface',
			colorscale: 'Plasma',
			lighting: { ambient: 0.5, diffuse: 0.7, specular: 0.35, roughness: 0.45, fresnel: 0.25 },
			contours: {
				z: { show: true, usecolormap: true, project: { z: true } },
				x: { show: true, usecolormap: true, highlightcolor: 'rgba(255,255,255,0.1)', project: { x: false } }
			},
			hovertemplate: 'W: %{x}<br>H: %{y}<br>Weight: %{z:.6f}<extra></extra>',
			colorbar: {
				title: { text: 'Weight', side: 'right', font: { size: 10, color: c.font } },
				thickness: 12, tickfont: { size: 9, color: c.tick }
			}
		}], layout, {}, plotDiv4.dataset.plotKey);
	}

	async function _render_4d(parent, arr, shape, title, baseKey) {
		const slices = Math.min(shape[3], opts.max_slices);
		for (let j = 0; j < slices; j++) {
			await new Promise(r => setTimeout(r, 0));
			await _render_4d_slice(parent, arr, shape, title, baseKey, j);
		}
	}





	async function _render_5d(parent, arr, shape, title, baseKey) {
		const [kx, ky, kz, in_ch, out_ch] = shape;
		const slices_out = Math.min(out_ch, opts.max_slices);
		const slices_in = Math.min(in_ch, opts.max_slices);

		for (let oc = 0; oc < slices_out; oc++) {
			for (let ic = 0; ic < slices_in; ic++) {
				await new Promise(r => setTimeout(r, 0));
				await _render_5d_volume(parent, arr, shape, title, baseKey, ic, oc);
			}
		}
	}

	// ─── Main Render Logic ──────────────────────────────────────────────────────

	// ─── Safe min/max that doesn't use spread operator ──────────────────────────

	function safe_min(arr) {
		if (!arr || arr.length === 0) return 0;
		let min = arr[0];
		for (let i = 1; i < arr.length; i++) {
			if (arr[i] < min) min = arr[i];
		}
		return min;
	}

	function safe_max(arr) {
		if (!arr || arr.length === 0) return 0;
		let max = arr[0];
		for (let i = 1; i < arr.length; i++) {
			if (arr[i] > max) max = arr[i];
		}
		return max;
	}

	// ─── Safe flat that uses iteration instead of recursion ─────────────────────

	function safe_flat(arr, depth = 1) {
		const result = [];
		const stack = [{ arr: arr, depth: depth }];

		while (stack.length > 0) {
			const { arr: current, depth: d } = stack.pop();
			for (let i = 0; i < current.length; i++) {
				if (Array.isArray(current[i]) && d > 0) {
					stack.push({ arr: current[i], depth: d - 1 });
				} else {
					result.push(current[i]);
				}
			}
		}
		return result;
	}

	// ─── Iterative reshape (replaces recursive reshape_flat_array) ──────────────

	function reshape_flat_array(data, shape) {
		if (!shape || shape.length === 0) return data[0];
		if (shape.length === 1) return data.slice(0, shape[0]);

		// Guard against excessive rank
		if (shape.length > 10) {
			console.warn('reshape_flat_array: shape rank too high (' + shape.length + '), truncating to rank 5');
			shape = shape.slice(0, 5);
		}

		// Iterative approach: build from innermost dimension outward
		let current = Array.from(data);

		// Work from the innermost dimension to the outermost
		for (let dim = shape.length - 1; dim >= 1; dim--) {
			const size = shape[dim];
			const grouped = [];
			for (let i = 0; i < current.length; i += size) {
				grouped.push(current.slice(i, i + size));
			}
			current = grouped;
		}

		return current;
	}

	// ─── Fixed _render_1d ───────────────────────────────────────────────────────

	function _render_1d(parent, arr, shape, title, baseKey) {
		const c = _colors();
		const values = shape.length === 0 ? [arr] : arr;
		const n = values.length;

		// Guard: cap the number of rendered points to prevent performance issues
		const MAX_1D_POINTS = 50000;
		let renderValues = values;
		let renderIndices;

		if (n > MAX_1D_POINTS) {
			// Downsample evenly
			const step = Math.ceil(n / MAX_1D_POINTS);
			renderValues = [];
			renderIndices = [];
			for (let i = 0; i < n; i += step) {
				renderValues.push(values[i]);
				renderIndices.push(i);
			}
		} else {
			renderIndices = Array.from({ length: n }, (_, i) => i);
		}

		// Use safe iterative min/max instead of spread operator
		const minV = safe_min(renderValues);
		const maxV = safe_max(renderValues);
		const range = maxV - minV || 1;
		const normed = renderValues.map(v => (v - minV) / range);

		const plotDiv = create_plot_div(parent, title, baseKey + "_1d");
		const layout = _base_layout(title, false);
		layout.xaxis.title.text = shape.length === 0 ? '' : 'Neuron / Parameter Index';
		layout.yaxis.title.text = 'Weight Value';
		layout.shapes = [{
			type: 'line', x0: 0, x1: n - 1, y0: 0, y1: 0,
			line: { color: c.axis_line, width: 1.5, dash: 'dot' }
		}];

		const numPoints = renderValues.length;

		return _plot_preserve_camera(plotDiv, [{
			x: renderIndices,
			y: renderValues,
			type: 'scatter',
			mode: numPoints > 200 ? 'markers' : 'markers+lines',
			marker: {
				size: numPoints > 500 ? 4 : numPoints > 100 ? 6 : 9,
				color: normed,
				colorscale: 'Viridis',
				showscale: numPoints > 1,
				colorbar: numPoints > 1 ? {
					title: { text: 'Value', side: 'right', font: { size: 10, color: c.font } },
					thickness: 12, len: 0.6, tickfont: { size: 9, color: c.tick }
				} : undefined,
				line: { width: 0.5, color: c.marker_line },
				opacity: 0.88
			},
			line: { width: 1.2, color: _dark() ? 'rgba(120,180,255,0.3)' : 'rgba(60,60,180,0.2)' },
			hovertemplate: 'Index: %{x}<br>Value: %{y:.6f}<extra></extra>'
		}], layout, {}, plotDiv.dataset.plotKey);
	}

	// ─── Fixed _render_2d_heatmap ───────────────────────────────────────────────

	function _render_2d_heatmap(parent, arr, shape, title, baseKey) {
		const c = _colors();
		const k2d = baseKey + "_heat";
		const plotDiv2d = create_plot_div(parent, title + " (Heatmap)", k2d);
		const layout = _base_layout(title + ' — Weight Matrix Heatmap', false);
		layout.xaxis.title.text = 'Output Neuron';
		layout.yaxis.title.text = 'Input Neuron';

		let zData = to_float_matrix(arr);

		if (!zData || zData.length === 0) {
			show_message_in_container(parent, `⚠ "${title}": empty matrix, skipping heatmap.`);
			return Promise.resolve();
		}

		// Guard: downsample if matrix is too large for rendering
		const MAX_HEATMAP_DIM = 2048;
		const [h, w] = [zData.length, zData[0] ? zData[0].length : 0];

		if (h > MAX_HEATMAP_DIM || w > MAX_HEATMAP_DIM) {
			const stepH = Math.ceil(h / MAX_HEATMAP_DIM);
			const stepW = Math.ceil(w / MAX_HEATMAP_DIM);
			const downsampled = [];
			for (let i = 0; i < h; i += stepH) {
				const row = [];
				for (let j = 0; j < w; j += stepW) {
					row.push(zData[i][j]);
				}
				downsampled.push(row);
			}
			zData = downsampled;
		}

		// Use safe iterative flat + min/max instead of spread operator
		const flatVals = safe_flat(zData, 1);
		const minVal = safe_min(flatVals);
		const maxVal = safe_max(flatVals);
		const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal)) || 1;

		return _plot_preserve_camera(plotDiv2d, [{
			z: zData,
			type: 'heatmap',
			colorscale: _dark()
			? [[0, '#0d0887'], [0.25, '#7201a8'], [0.5, '#bd3786'], [0.75, '#ed7953'], [1, '#fdca26']]
			: 'RdBu',
			reversescale: !_dark(),
			zmid: _dark() ? undefined : 0,
			zmin: _dark() ? undefined : -absMax,
			zmax: _dark() ? undefined : absMax,
			hoverongaps: false,
			hovertemplate: 'In: %{y}<br>Out: %{x}<br>Weight: %{z:.6f}<extra></extra>',
			colorbar: {
				title: { text: 'Weight', side: 'right', font: { size: 11, color: c.font } },
				thickness: 14, tickfont: { size: 9, color: c.tick }, outlinewidth: 0
			}
		}], layout, {}, plotDiv2d.dataset.plotKey);
	}

	// ─── Fixed _render_2d_surface ───────────────────────────────────────────────

	function _render_2d_surface(parent, arr, shape, title, baseKey) {
		const c = _colors();
		const k3d = baseKey + "_surf";
		const plotDiv3d = create_plot_div(parent, title + " (3D Surface)", k3d);
		const layout3d = _base_layout(title + ' — Weight Surface', true);
		layout3d.scene = _scene('Output Neuron', 'Input Neuron', 'Weight Value');

		let zData = to_float_matrix(arr);

		if (!zData || zData.length === 0) {
			return Promise.resolve();
		}

		// Guard: downsample for 3D surfaces (even more aggressive since surfaces are heavier)
		const MAX_SURFACE_DIM = 512;
		const [h, w] = [zData.length, zData[0] ? zData[0].length : 0];

		if (h > MAX_SURFACE_DIM || w > MAX_SURFACE_DIM) {
			const stepH = Math.ceil(h / MAX_SURFACE_DIM);
			const stepW = Math.ceil(w / MAX_SURFACE_DIM);
			const downsampled = [];
			for (let i = 0; i < h; i += stepH) {
				const row = [];
				for (let j = 0; j < w; j += stepW) {
					row.push(zData[i][j]);
				}
				downsampled.push(row);
			}
			zData = downsampled;
		}

		return _plot_preserve_camera(plotDiv3d, [{
			z: zData,
			type: 'surface',
			colorscale: 'Viridis',
			lighting: { ambient: 0.6, diffuse: 0.7, specular: 0.3, roughness: 0.5, fresnel: 0.3 },
			lightposition: { x: 1000, y: 1000, z: 2000 },
			contours: {
				z: { show: true, usecolormap: true, highlightcolor: _dark() ? '#ffffff' : '#333333', project: { z: true } }
			},
			hovertemplate: 'In: %{y}<br>Out: %{x}<br>Weight: %{z:.6f}<extra></extra>',
			colorbar: {
				title: { text: 'Weight', side: 'right', font: { size: 10, color: c.font } },
				thickness: 12, tickfont: { size: 9, color: c.tick }
			}
		}], layout3d, {}, plotDiv3d.dataset.plotKey);
	}

	// ─── Fixed _render_2d ───────────────────────────────────────────────────────

	async function _render_2d(parent, arr, shape, title, baseKey) {
		const [h, w] = shape;
		if (h < 1 || w < 1) return;

		// Guard: skip rendering if total elements exceed a sane limit
		const MAX_TOTAL_ELEMENTS = 25_000_000; // 25M
		if (h * w > MAX_TOTAL_ELEMENTS) {
			show_message_in_container(parent, 
				`⚠ "${title}": matrix too large (${h}×${w} = ${(h*w).toLocaleString()} elements). Showing downsampled version.`);
		}

		await _render_2d_heatmap(parent, arr, shape, title, baseKey);

		if (h >= 3 && w >= 3 && opts.plot3d) {
			await _render_2d_surface(parent, arr, shape, title, baseKey);
		}
	}

	// ─── Fixed _build_5d_volume_data ────────────────────────────────────────────

	function _build_5d_volume_data(arr, shape, ic, oc) {
		const [kx, ky, kz] = shape;
		const x = [], y = [], z = [], value = [];

		// Guard: cap volume size to prevent stack/memory issues
		const MAX_VOLUME_ELEMENTS = 500_000;
		if (kx * ky * kz > MAX_VOLUME_ELEMENTS) {
			console.warn(`_build_5d_volume_data: volume too large (${kx}×${ky}×${kz}), sampling.`);
			const step = Math.ceil(Math.cbrt((kx * ky * kz) / MAX_VOLUME_ELEMENTS));
			for (let i = 0; i < kx; i += step) {
				for (let j = 0; j < ky; j += step) {
					for (let k = 0; k < kz; k += step) {
						x.push(i);
						y.push(j);
						z.push(k);
						value.push(arr[i][j][k][ic][oc]);
					}
				}
			}
			return { x, y, z, value };
		}

		for (let i = 0; i < kx; i++) {
			for (let j = 0; j < ky; j++) {
				for (let k = 0; k < kz; k++) {
					x.push(i);
					y.push(j);
					z.push(k);
					value.push(arr[i][j][k][ic][oc]);
				}
			}
		}
		return { x, y, z, value };
	}

	// ─── Fixed _render_5d_volume ────────────────────────────────────────────────

	async function _render_5d_volume(parent, arr, shape, title, baseKey, ic, oc) {
		const c = _colors();
		const [kx, ky, kz] = shape;
		const { x, y, z, value } = _build_5d_volume_data(arr, shape, ic, oc);

		if (value.length === 0) return;

		const key = baseKey + "_5d_" + ic + "_" + oc;
		const volTitle = `${title} — 3D Volume (Out=${oc}, In=${ic}) [${kx}×${ky}×${kz}]`;
		const plotDiv = create_plot_div(parent, volTitle, key);
		const layout = _base_layout(volTitle, true);
		layout.scene = _scene('Kernel X', 'Kernel Y', 'Kernel Z');
		layout.scene.aspectmode = 'cube';

		// Use safe min/max
		const vMin = safe_min(value);
		const vMax = safe_max(value);
		const vRange = vMax - vMin || 1;

		await _plot_preserve_camera(plotDiv, [{
			type: 'isosurface',
			x, y, z, value,
			colorscale: 'Viridis',
			isomin: vMin + vRange * 0.1,
			isomax: vMax - vRange * 0.1,
			surface: { show: true, count: 5, fill: 0.7 },
			caps: { x: { show: false }, y: { show: false }, z: { show: false } },
			opacity: 0.6,
			hovertemplate: 'X: %{x}<br>Y: %{y}<br>Z: %{z}<br>Value: %{value:.6f}<extra></extra>',
			colorbar: {
				title: { text: 'Weight', side: 'right', font: { size: 10, color: c.font } },
				thickness: 12, tickfont: { size: 9, color: c.tick }
			}
		}], layout, {}, plotDiv.dataset.plotKey);
	}

	// ─── Fixed render_weight_array with total element guard ─────────────────────

	async function render_weight_array(parent, arr, title, shape, layerType) {
		if (!arr || !shape || !finished_loading) return;

		// Guard: reject tensors with rank > 5
		if (shape.length > 5) {
			show_message_in_container(parent, `Skipping "${title}": rank ${shape.length} too high (max 5)`);
			return;
		}

		// Guard: reject shapes with any zero or negative dimension
		if (shape.some(d => d <= 0)) {
			show_message_in_container(parent, `Skipping "${title}": invalid shape [${shape.join('×')}]`);
			return;
		}

		// Guard: total element count sanity check
		const totalElements = shape.reduce((a, b) => a * b, 1);
		const MAX_ELEMENTS = 100_000_000; // 100M
		if (totalElements > MAX_ELEMENTS) {
			show_message_in_container(parent, 
				`⚠ "${title}": tensor too large (${totalElements.toLocaleString()} elements). Skipping visualization.`);
			return;
		}

		const baseKey = (title || "plot").replace(/\s+/g, '_').replace(/[^\w-]/g, '');

		try {
			if (shape.length <= 1) {
				await _render_1d(parent, arr, shape, title, baseKey);
			} else if (shape.length === 2) {
				await _render_2d(parent, arr, shape, title, baseKey);
			} else if (shape.length === 3) {
				await _render_3d(parent, arr, shape, title, baseKey);
			} else if (shape.length === 4) {
				await _render_4d(parent, arr, shape, title, baseKey);
			} else if (shape.length === 5) {
				await _render_5d(parent, arr, shape, title, baseKey);
			}
		} catch (e) {
			// Catch any remaining stack overflow at the top level
			if (e instanceof RangeError && e.message.includes('call stack')) {
				console.warn(`render_weight_array: stack overflow for "${title}" [${shape.join('×')}], skipping.`);
				show_message_in_container(parent, 
					`⚠ "${title}": too complex to render (stack overflow). Consider reducing layer size.`);
			} else {
				throw e;
			}
		}
	}

	// ─── Main Execution ─────────────────────────────────────────────────────────

	const parent = ensure_container(container_or_id);

	let container = parent.querySelector('#tfjs_weights_container');
	if (!container) {
		container = document.createElement('div');
		container.id = 'tfjs_weights_container';
		container.style.display = 'block';
		container.style.padding = '8px 0';
		parent.appendChild(container);
	} else {
		Array.from(container.children).forEach(child => {
			if (!child.querySelector || !child.querySelector('[data-plot-key]')) {
				container.removeChild(child);
			}
		});
	}

	try {
		if (!window.model) {
			show_message_in_container(container, 'No model found — please load or train a model first.');
			return;
		}
		const layers = model?.layers || [];
		if (!layers || layers.length === 0) {
			show_message_in_container(container, 'Model has no layers.');
			return;
		}

		// Summary header
		let summaryEl = container.querySelector('#tfjs_weights_summary');
		if (!summaryEl) {
			summaryEl = document.createElement('div');
			summaryEl.id = 'tfjs_weights_summary';
			summaryEl.style.cssText = `
				margin: 0 0 18px 0;
				padding: 12px 18px;
				border-radius: 8px;
				font-size: 13px;
				line-height: 1.7;
				background: ${_dark() ? 'rgba(40,40,65,0.5)' : 'rgba(240,240,255,0.7)'};
				border: 1px solid ${_dark() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
				color: ${_colors().font};
				font-family: Inter, system-ui, sans-serif;
			`;
			container.insertBefore(summaryEl, container.firstChild);
		}

		let totalParams = 0;
		let layerSummaries = [];
		for (let li = 0; li < layers.length; li++) {
			const layer = layers[li];
			const weights = safe_get_layer_weights(layer);
			if (weights && weights.length > 0) {
				weights.forEach(w => {
					const s = shape_from(w);
					if (s) totalParams += s.reduce((a, b) => a * b, 1);
				});
				layerSummaries.push(`<span style="opacity:0.7">L${li}</span> ${layer?.name || 'unnamed'} <span style="opacity:0.5">(${weights.length} tensor${weights.length > 1 ? 's' : ''})</span>`);
			}
		}
		summaryEl.innerHTML = `
			<strong style="font-size:14px;">Weight Surfaces</strong> &nbsp;—&nbsp;
			<span>${layers.length} layers, ${totalParams.toLocaleString()} parameters</span><br>
			<span style="font-size:11px;opacity:0.7">${layerSummaries.join(' · ')}</span>
		`;

		// Render each layer's weights
		for (let li = 0; li < layers.length; li++) {
			const layer = layers[li];
			const layer_name = layer?.name || `layer_${li}`;
			const weights = safe_get_layer_weights(layer);
			if (!weights || weights.length === 0) {
				continue;
			}

			for (let wi = 0; wi < weights.length; wi++) {
				let result = null;
				// Robustly attempt to read tensor with retries
				for (let attempt = 0; attempt < 6 && !result; attempt++) {
					result = await (async () => {
						try {
							const w = weights[wi];
							if (!w) return null;
							const arr = array_from_tensor_or_array(w);
							const shape = shape_from(w) || [];
							if (!arr) return null;
							return { arr, shape };
						} catch (e) {
							return null;
						}
					})();
					if (!result) await new Promise(r => setTimeout(r, 50));
				}

				if (!result) {
					show_message_in_container(container, `⚠ Layer ${li} (${layer_name}) weight ${wi}: could not read tensor.`);
					continue;
				}

				const { arr, shape } = result;

				let weightLabel = (wi === 0 ? 'Kernel' : wi === 1 ? 'Bias' : `Weight[${wi}]`);
				const fullTitle = `L${li} "${layer_name}" — ${weightLabel} [${shape.join('×')}]`;
				await render_weight_array(container, arr, fullTitle, shape, layer?.className || '');
			}
		}
	} catch (e) {
		console.error("visualize_model_weights error:", e);
		show_message_in_container(container, '❌ Error visualizing weights: ' + e.message);
	}
};

// ─── Utility: Get model structure string for change detection ────────────────

function get_model_structure_string() {
	const num_of_layers = model?.layers?.length;

	if (!num_of_layers) {
		dbg("get_model_structure_string: No layers found");
		return null;
	}

	var strs = [];

	for (var i = 0; i < num_of_layers; i++) {
		const layer_name = model?.layers[i]?.name;
		const nr_of_weights = model?.layers[i]?.weights?.length;
		const use_bias = model.layers[i].useBias;

		var weight_shapes = [];
		for (var k = 0; k < nr_of_weights; k++) {
			const weight_shape = model?.layers[i]?.weights[k]?.shape;
			if (weight_shape) {
				const stringified_weight_shape = JSON.stringify(weight_shape);
				weight_shapes.push(`weight_${k}_shape=${stringified_weight_shape}`);
			}
		}

		var this_layer = `${layer_name}={nr_of_weights:${nr_of_weights},use_bias=${use_bias}, weight_shapes: >${weight_shapes.join(",")}<}`;

		strs.push(this_layer);
	}

	return strs.join("\n");
}

// ─── Entry point: create or update weight surfaces ───────────────────────────

function create_weight_surfaces(force = false) {
	try {
		const current_model_structure_string = get_model_structure_string();
		if (force || current_model_structure_string != last_model_structure_string) {
			$("#weight_surfaces_content").html("");
		}

		last_model_structure_string = current_model_structure_string;

		visualize_model_weights('weight_surfaces_content', {}, !!force);
	} catch (e) {
		console.error("create_weight_surfaces error:", e);
	}
}
