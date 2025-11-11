// Kamera-Cache global
window.__tfjs_weights_plot_cameras = window.__tfjs_weights_plot_cameras || new Map();

let visualize_model_weights = async function(container_or_id, options = {}, force = false) {
	const opts = Object.assign({
		max_slices: 8,
		plot3d: true,
		plot2d: true,
		container_width_pct: 0.9
	}, options);

	const font_size = 14;
	const title_font_config = { size: font_size };

	if (container_or_id) {
		try {
			if (!$("#" + container_or_id).is(":visible") && !force) {
				return;
			}
		} catch (e) {
			// jQuery ggf. nicht da -> ignore
		}
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
		} else if (target instanceof Element) parent = target;
		else {
			parent = document.createElement('div');
			parent.id = make_id('tfjs_weights_parent');
			document.body.appendChild(parent);
		}
		return parent;
	}

	function show_message_in_container(container, msg) {
		const el = document.createElement('div');
		el.textContent = msg;
		el.style.margin = '6px';
		el.style.fontWeight = '600';
		container.appendChild(el);
	}

	function safe_get_layer_weights(layer) {
		try {
			if (!layer) return [];
			const w = layer.weights || layer.trainableWeights || (typeof layer.getWeights === 'function' ? layer.getWeights() : []);
			if (!Array.isArray(w)) return [];
			const ret = w.map(item => {
				if (!item) return null;
				if (item.val !== undefined) return item.val;
				if (item.tensor !== undefined) return item.tensor;
				return item;
			});

			return ret;
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
					if(tensor_is_disposed(obj)) {
						return null;
					}

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

	function reshape_flat_array(data, shape) {
		if (!shape || shape.length === 0) return data[0];
		const out = [];
		const stride = shape.slice(1).reduce((a, b) => a * b, 1);
		for (let i = 0; i < shape[0]; i++) {
			const start = i * stride;
			const slice = data.slice(start, start + stride);
			if (shape.length === 1) out.push(...slice);
			else out.push(reshape_flat_array(slice, shape.slice(1)));
		}
		return out;
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

	// create_plot_div: reuse existing plotDiv by stable key if present
	function create_plot_div(parent, title_text, plotKey) {
		try {
			// stable key generation
			let safeKey = plotKey;
			if (!safeKey) {
				safeKey = (title_text || "plot").replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
			}
			// try to find existing in parent
			try {
				const existing = parent.querySelector('[data-plot-key="' + safeKey + '"]');
				if (existing) {
					return existing;
				}
			} catch (e) {
				// selector escape issues -> ignore and create new
			}

			const wrapper = document.createElement('div');
			const right = document.querySelector("#right_side");
			const width = right ? right.clientWidth * opts.container_width_pct : 600;
			wrapper.style.width = width + 'px';
			wrapper.style.marginBottom = '16px';
			wrapper.style.boxSizing = 'border-box';
			wrapper.style.visibility = 'hidden';

			const plotDiv = document.createElement('div');
			plotDiv.style.width = '100%';
			plotDiv.style.height = '600px';
			plotDiv.__lastCamera = null;
			plotDiv.dataset.plotKey = safeKey;

			// keep wrapper responsive
			try {
				const ro = new ResizeObserver(() => {
					const newWidth = right ? right.clientWidth * opts.container_width_pct : 600;
					wrapper.style.width = newWidth + 'px';
					safe_plotly_resize(plotDiv);
				});
				ro.observe(right || document.body);
			} catch (e) {
				// ignore
			}

			wrapper.appendChild(plotDiv);
			parent.appendChild(wrapper);
			return plotDiv;
		} catch (e) {
			console.error("create_plot_div failed", e);
			return null;
		}
	}

	async function _plot_preserve_camera(dom, data, layout = {}, config = {}, plotKey) {
		if (!dom) return;
		
		if (!Object.keys(layout).includes("font")) {
				layout["font"] = {};
		}
		layout["font"]["color"] = is_dark_mode == true ? "#ffffff" : "#141414";

		const is3D = data.some(d => ['surface','heatmap','scatter3d'].includes(d.type));
		const uirevKey = plotKey || (dom.__uirevisionKey = dom.__uirevisionKey || ("uirev_" + Math.random().toString(36).slice(2)));

		// Setze uirevision einmalig (wird zwischen Updates beibehalten)
		layout.uirevision = layout.uirevision || uirevKey;
		if (is3D) {
			layout.scene = layout.scene || {};
			layout.scene.uirevision = layout.scene.uirevision || uirevKey;
		}

		// Lade Kamera aus Cache
		const cachedCam = plotKey && window.__tfjs_weights_plot_cameras.has(plotKey)
			? window.__tfjs_weights_plot_cameras.get(plotKey)
			: dom.__lastCamera || null;

		if (is3D && cachedCam && !layout.scene.camera) {
			// Setze Kamera nur, wenn layout.scene.camera noch nicht existiert
			layout.scene.camera = cachedCam;
		}

		// Render Plot
		try {
			await Plotly.react(dom, data, layout, config);
		} catch(err) {
			console.error("Plotly.react failed", err);
		}

		// **Force Kamera nach react**, falls Plotly sie zurückgesetzt hat
		if (is3D && cachedCam) {
			try {
				const currentCam = dom._fullLayout?.scene?.camera;
				// Wenn Kamera unterschiedlich, erzwinge Relayout
				if (JSON.stringify(currentCam) !== JSON.stringify(cachedCam)) {
					await Plotly.relayout(dom, {'scene.camera': cachedCam});
				}
			} catch(e) {
				console.warn("Forcing cached camera failed", e);
			}
		}

		// Event Listener zum sofortigen Speichern von Kamera
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
				if (typeof dom.on === 'function') {
					dom.on('plotly_relayout', saveCamera);
				} else if (Plotly && typeof Plotly.Plots.addListener === 'function') {
					Plotly.Plots.addListener(dom, 'plotly_relayout', saveCamera);
				}
			} catch(e) {
				console.warn("Failed to attach camera listener", e);
			}

			dom.__plotly_camera_listeners_attached = true;
		}

		// Wrapper sichtbar & resize
		if (dom.parentNode) dom.parentNode.style.visibility = 'visible';
		try { safe_plotly_resize(dom); } catch(e) {}
	}

	async function render_weight_array(parent, arr, title, shape, layerType) {
		if (!arr || !shape) return;
		if (shape.length > 5) {
			show_message_in_container(parent, 'Too high dimension (rank >=5)');
			return;
		}

		// build a stable plotKey per title (you can extend this to include slice index)
		const baseKey = (title || "plot").replace(/\s+/g, '_').replace(/[^\w\-]/g, '');

		if (shape.length === 0) {
			const plotDiv = create_plot_div(parent, title, baseKey + "_1d");
			_plot_preserve_camera(plotDiv, [{ y: [arr], type: 'scatter', mode: 'lines+markers' }], {
				title: { text: title, font: title_font_config },
				margin: { t: 40, b: 40, l: 40, r: 40 },
				autosize: true,
				paper_bgcolor: 'rgba(0,0,0,0)',
				plot_bgcolor: 'rgba(0,0,0,0)'
			}, { responsive: true }, plotDiv.dataset.plotKey);
		} else if (shape.length === 1) {
			const plotDiv = create_plot_div(parent, title, baseKey + "_1d");
			_plot_preserve_camera(plotDiv, [{ y: arr, type: 'scatter', mode: 'lines+markers' }], {
				title: { text: title, font: title_font_config },
				margin: { t: 40, b: 40, l: 40, r: 40 },
				autosize: true,
				paper_bgcolor: 'rgba(0,0,0,0)',
				plot_bgcolor: 'rgba(0,0,0,0)'
			}, { responsive: true }, plotDiv.dataset.plotKey);
		} else if (shape.length === 2) {
			const [h, w] = shape;

			if (h >= 1 && w >= 1) {
				const k2d = baseKey + "_heat";
				const plotDiv2d = create_plot_div(parent, title + " 2D heatmap", k2d);
				_plot_preserve_camera(plotDiv2d, [{ z: to_float_matrix(arr), type: 'heatmap', hoverongaps: false }], {
					title: { text: title + " 2D heatmap", font: title_font_config },
					margin: { t: 40, b: 40, l: 40, r: 40 },
					autosize: true,
					paper_bgcolor: 'rgba(0,0,0,0)',
					plot_bgcolor: 'rgba(0,0,0,0)'
				}, { responsive: true }, plotDiv2d.dataset.plotKey);
			}
		} else if (shape.length === 3) {
			const slices = Math.min(shape[2], opts.max_slices);
			for (let i = 0; i < slices; i++) {
				await new Promise(r => setTimeout(r, 0));
				const slice = arr.map(r => r.map(c => c[i]));
				const key = baseKey + "_slice_" + i;
				const plotDiv = create_plot_div(parent, `Filter ${i} (${shape[0]}x${shape[1]}x${shape[2]})`, key);
				_plot_preserve_camera(plotDiv, [{ z: to_float_matrix(slice), type: 'surface' }], {
					title: { text: `${title}, Filter ${i} 3D`, font: title_font_config },
					margin: { t: 40, b: 40, l: 40, r: 40 },
					autosize: true,
					scene: { aspectmode: 'auto' },
					paper_bgcolor: 'rgba(0,0,0,0)',
					plot_bgcolor: 'rgba(0,0,0,0)'
				}, { responsive: true }, plotDiv.dataset.plotKey);
			}
		} else if (shape.length === 4) {
			const slices = Math.min(shape[3], opts.max_slices);
			for (let j = 0; j < slices; j++) {
				await new Promise(r => setTimeout(r, 0));
				const slice4 = arr.map(f => f.map(r => r.map(c => c[j])));
				const key = baseKey + "_slice4_" + j;
				const plotDiv4 = create_plot_div(parent, `Filter ${j} (${shape[0]}x${shape[1]}x${shape[2]}x${shape[3]})`, key);
				_plot_preserve_camera(plotDiv4, [{ z: to_float_matrix(slice4), type: 'surface' }], {
					title: { text: `${title}, Filter ${j} 3D`, font: title_font_config },
					margin: { t: 40, b: 40, l: 40, r: 40 },
					autosize: true,
					scene: { aspectmode: 'auto' },
					paper_bgcolor: 'rgba(0,0,0,0)',
					plot_bgcolor: 'rgba(0,0,0,0)'
				}, { responsive: true }, plotDiv4.dataset.plotKey);
			}
		} else if (shape.length === 5) {
			const [kx, ky, kz, in_ch, out_ch] = shape;
			const slices_out = Math.min(out_ch, opts.max_slices);
			const slices_in = Math.min(in_ch, opts.max_slices);

			for (let oc = 0; oc < slices_out; oc++) {
				for (let ic = 0; ic < slices_in; ic++) {
					await new Promise(r => setTimeout(r, 0));
					const volume = arr.map(x =>
						x.map(y =>
							y.map(z =>
								z[ic][oc]
							)
						)
					);

					const x = [], y = [], z = [], value = [];
					for (let i = 0; i < kx; i++)
						for (let j = 0; j < ky; j++)
							for (let k = 0; k < kz; k++) {
								x.push(i);
								y.push(j);
								z.push(k);
								value.push(volume[i][j][k]);
							}

					const key = baseKey + "_5d_" + ic + "_" + oc;
					const plotDiv = create_plot_div(parent, `Kernel ${oc}, Input ${ic}`, key);

					await _plot_preserve_camera(plotDiv, [{
						type: 'isosurface',
						x, y, z,
						value,
						colorscale: 'Viridis',
						isomin: Math.min(...value),
						isomax: Math.max(...value),
						surface: { show: true, count: 5 },
						caps: { x: { show: false }, y: { show: false }, z: { show: false } }
					}], {
						title: { text: `${title} 3D Volume (in=${ic}, out=${oc})`, font: title_font_config },
						margin: { t: 40, b: 40, l: 40, r: 40 },
						scene: { aspectmode: 'cube' },
						autosize: true,
						paper_bgcolor: 'rgba(0,0,0,0)',
						plot_bgcolor: 'rgba(0,0,0,0)'
					}, { responsive: true }, plotDiv.dataset.plotKey);
				}
			}
		}
	}

	const parent = ensure_container(container_or_id);

	var spinnerWrapper = null;

	if($("#weight_surfaces_content").html() == "") {
		spinnerWrapper = document.createElement('div');
		spinnerWrapper.innerHTML = `<center><div class="spinner"></div></center>`;
		parent.appendChild(spinnerWrapper);
	}

	// Reuse container if exists, otherwise create
	let container = parent.querySelector('#tfjs_weights_container');
	if (!container) {
		container = document.createElement('div');
		container.id = 'tfjs_weights_container';
		container.style.display = 'block';
		parent.appendChild(container);
	} else {
		// do not remove existing plot DIVs — we reuse by plotKey in create_plot_div
		// but remove other non-plot children (like header list) to avoid duplication
		// keep existing plot wrappers intact
		// remove everything that is not a descendant plot wrapper with data-plot-key
		Array.from(container.children).forEach(child => {
			// keep child if it contains at least one node with data-plot-key
			if (!child.querySelector || !child.querySelector('[data-plot-key]')) {
				container.removeChild(child);
			}
		});
	}

	try {
		if (!window.model) {
			show_message_in_container(container, 'No model found');
			return;
		}
		const layers = model?.layers || [];
		if (!layers || layers.length === 0) {
			show_message_in_container(container, 'Model has no layers');
			return;
		}

		for (let li = 0; li < layers.length; li++) {
			const layer = layers[li];
			const layer_name = layer?.name || `layer_${li}`;
			const weights = safe_get_layer_weights(layer);
			if (!weights || weights.length === 0) {
				continue;
			}

			for (let wi = 0; wi < weights.length; wi++) {
				let result = null;
				// robustly attempt to read tensor
				for (let attempt = 0; attempt < 6 && !result; attempt++) {
					result = await (async () => {
						try {
							const w = weights[wi];
							if (!w) return null;
							const arr = array_from_tensor_or_array(w);
							const shape = shape_from(w) || [];
							return { arr, shape };
						} catch (e) {
							return null;
						}
					})();
					if (!result) await new Promise(r => setTimeout(r, 50));
				}

				if (!result) {
					show_message_in_container(container, 'Cannot display');
					continue;
				}

				const { arr, shape } = result;

				let title = (wi === 0 ? 'weights' : 'bias');
				const fullTitle = `Layer ${li} (${layer_name}) ${title}`;
				await render_weight_array(container, arr, fullTitle, shape, layer?.className || '');
			}
		}
	} catch (e) {
		console.error(e);
	} finally {
		try {
			if (spinnerWrapper && spinnerWrapper.parentNode) {
				spinnerWrapper.parentNode.removeChild(spinnerWrapper);
			}
		} catch (e) {}
	}
};

function get_model_structure_string() {
	const num_of_layers = model?.layers?.length;

	if (!num_of_layers) {
		dbg("get_model_structure_md5: No layers found");
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


function create_weight_surfaces(force = false) {
	try {
		const current_model_structure_string = get_model_structure_string();
		if(force || current_model_structure_string != last_model_structure_string) {
			$("#weight_surfaces_content").html("");
		}

		last_model_structure_string = current_model_structure_string;

		visualize_model_weights('weight_surfaces_content', {}, !!force);
	} catch (e) {
		console.error(e);
	}
};
