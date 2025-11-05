// Kamera-Cache global
window.__tfjs_weights_plot_cameras = window.__tfjs_weights_plot_cameras || new Map();

let visualize_model_weights = async function(container_or_id, options = {}, force = false) {
    const opts = Object.assign({
        max_slices: 8,
        plot3d: true,
        plot2d: true,
        use_mesh3d: false,
        container_width_pct: 0.9
    }, options);

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

            const titleEl = document.createElement('div');
            titleEl.textContent = title_text || '';
            titleEl.style.fontWeight = '600';
            titleEl.style.margin = '6px 0 4px 0';
            wrapper.appendChild(titleEl);

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

    // Plot with camera preservation using newPlot for first-time and update afterwards.
// Plot with camera preservation using newPlot for first-time and update afterwards.
	async function plot_preserve_camera(dom, data, layout = {}, config = {}, plotKey) {
		if (!dom) return;

		if (!layout.scene) layout.scene = {};

		// Load cached camera
		const cachedCam = (plotKey && window.__tfjs_weights_plot_cameras.has(plotKey)) 
			? window.__tfjs_weights_plot_cameras.get(plotKey) 
			: null;

		if (cachedCam) {
			layout.scene.camera = cachedCam;
		} else if (dom.__lastCamera) {
			layout.scene.camera = dom.__lastCamera;
		}

		const alreadyPlotted = !!(dom.data && dom.data.length > 0);

		try {
			if (alreadyPlotted) {
				await Plotly.update(dom, data, layout, config);
			} else {
				await Plotly.newPlot(dom, data, layout, config);
			}

			// Apply cached camera if it exists (Plotly may overwrite it)
			if (cachedCam) {
				await Plotly.relayout(dom, { 'scene.camera': cachedCam }).catch(err => {
					console.warn("relayout failed", err);
				});
			}

			// Store current camera
			try {
				const sceneObj = dom._fullLayout?.scene?._scene;
				if (sceneObj && typeof sceneObj.getCamera === 'function') {
					const cam = sceneObj.getCamera();
					dom.__lastCamera = cam;
					if (plotKey) window.__tfjs_weights_plot_cameras.set(plotKey, cam);
				}
			} catch (e) {
				console.warn("Storing camera failed", e);
			}

			// Ensure wrapper is visible and resize safely
			const wrapper = dom.parentNode;
			if (wrapper) wrapper.style.visibility = 'visible';
			safe_plotly_resize(dom);

		} catch (err) {
			console.error("Plotly update/newPlot failed", err);
		}
	}

    async function render_weight_array(parent, arr, title, shape, layerType) {
        if (!arr || !shape) return;
        if (shape.length >= 5) {
            show_message_in_container(parent, 'Too high dimension (rank >=5)');
            return;
        }

        // build a stable plotKey per title (you can extend this to include slice index)
        const baseKey = (title || "plot").replace(/\s+/g, '_').replace(/[^\w\-]/g, '');

        if (shape.length === 0) {
            const plotDiv = create_plot_div(parent, title, baseKey + "_1d");
            plot_preserve_camera(plotDiv, [{ y: [arr], type: 'scatter', mode: 'lines+markers' }], {
                title: { text: title, font: { size: 14 } },
                margin: { t: 40, b: 40, l: 40, r: 40 },
                autosize: true,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            }, { responsive: true }, plotDiv.dataset.plotKey);
        } else if (shape.length === 1) {
            const plotDiv = create_plot_div(parent, title, baseKey + "_1d");
            plot_preserve_camera(plotDiv, [{ y: arr, type: 'scatter', mode: 'lines+markers' }], {
                title: { text: title, font: { size: 14 } },
                margin: { t: 40, b: 40, l: 40, r: 40 },
                autosize: true,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            }, { responsive: true }, plotDiv.dataset.plotKey);
        } else if (shape.length === 2) {
            const k2d = baseKey + "_heat";
            const plotDiv2d = create_plot_div(parent, title + " 2D heatmap", k2d);
            plot_preserve_camera(plotDiv2d, [{ z: to_float_matrix(arr), type: 'heatmap', hoverongaps: false }], {
                title: { text: title + " 2D heatmap", font: { size: 14 } },
                margin: { t: 40, b: 40, l: 40, r: 40 },
                autosize: true,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            }, { responsive: true }, plotDiv2d.dataset.plotKey);

            const [h, w] = shape;
            if (opts.plot3d && h >= 2 && w >= 2) {
                const k3d = baseKey + "_surface";
                const plotDiv3d = create_plot_div(parent, title + " 3D surface", k3d);
                plot_preserve_camera(plotDiv3d, [{ z: to_float_matrix(arr), type: opts.use_mesh3d ? 'mesh3d' : 'surface' }], {
                    title: { text: title + " 3D surface", font: { size: 14 } },
                    margin: { t: 40, b: 40, l: 40, r: 40 },
                    autosize: true,
                    scene: { aspectmode: 'auto' },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)'
                }, { responsive: true }, plotDiv3d.dataset.plotKey);
            }
        } else if (shape.length === 3) {
            const slices = Math.min(shape[2], opts.max_slices);
            for (let i = 0; i < slices; i++) {
                await new Promise(r => setTimeout(r, 0));
                const slice = arr.map(r => r.map(c => c[i]));
                const key = baseKey + "_slice_" + i;
                const plotDiv = create_plot_div(parent, `Filter ${i} (${shape[0]}x${shape[1]}x${shape[2]})`, key);
                plot_preserve_camera(plotDiv, [{ z: to_float_matrix(slice), type: opts.use_mesh3d ? 'mesh3d' : 'surface' }], {
                    title: { text: `Filter ${i} 3D`, font: { size: 14 } },
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
                plot_preserve_camera(plotDiv4, [{ z: to_float_matrix(slice4), type: opts.use_mesh3d ? 'mesh3d' : 'surface' }], {
                    title: { text: `Filter ${j} 3D`, font: { size: 14 } },
                    margin: { t: 40, b: 40, l: 40, r: 40 },
                    autosize: true,
                    scene: { aspectmode: 'auto' },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)'
                }, { responsive: true }, plotDiv4.dataset.plotKey);
            }
        }
    }

    function clear_container(parent) {
        while (parent.firstChild) parent.removeChild(parent.firstChild);
    }

    const parent = ensure_container(container_or_id);

    // Spinner einfügen
    const spinnerWrapper = document.createElement('div');
    spinnerWrapper.innerHTML = `<center><div class="spinner"></div></center>`;
    parent.appendChild(spinnerWrapper);

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

    // control
    const sliceControl = document.createElement('input');
    sliceControl.type = 'number';
    sliceControl.min = '1';
    sliceControl.max = '64';
    sliceControl.value = opts.max_slices;
    sliceControl.style.margin = '6px';
    sliceControl.style.width = '50px';
    sliceControl.addEventListener('change', e => {
        opts.max_slices = parseInt(sliceControl.value) || opts.max_slices;
        try {
            visualize_model_weights(container_or_id, opts);
        } catch (err) {
            console.error("retrigger visualize_model_weights failed", err);
        }
    });
    const lbl = document.createElement('label');
    lbl.textContent = ' Max slices: ';
    lbl.appendChild(sliceControl);
    container.appendChild(lbl);

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
                show_message_in_container(container, 'No weights for this layer');
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
                const fullTitle = `Layer_${li}_${layer_name}_${title}`;
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

// convenience
window.create_weight_surfaces = function(force = false) {
    try {
        visualize_model_weights('weight_surfaces', {}, !!force);
    } catch (e) {
        console.error(e);
    }
};
