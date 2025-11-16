// loss_landscape_live.js (stable + dynamic grid + masking + stable 3D camera - FIXED)
// Requires: tf (TFJS), Plotly (global). Designed to run in browser.

// --- Utilities: flatten / metadata for weights ---
function sanitize_z_matrix(xs, ys, z) {
    if (!Array.isArray(xs) || !Array.isArray(ys) || !Array.isArray(z)) return { ok: false, reason: 'bad_inputs' };
    const [nx, ny] = [xs.length, ys.length];
    if (ny === 0) return { ok: false, reason: 'empty_z' };

    let sum = 0, finite_count = 0;
    const finite_values = [];

    for (let i = 0; i < ny; i++) {
        const row = z[i];
        if (!Array.isArray(row) || row.length !== nx) return { ok: false, reason: 'z_mismatch' };
        for (let j = 0; j < nx; j++) {
            const v = row[j];
            if (typeof v === 'number' && isFinite(v)) {
                finite_count++;
                sum += v;
                finite_values.push(v);
            }
        }
    }

    const total = nx * ny;
    const fraction_finite = finite_count / total;
    if (finite_count === 0 || fraction_finite < 0.05) return { ok: false, reason: 'too_many_missing', fraction: fraction_finite };

    const mean = (finite_count > 0) ? (sum / finite_count) : 0;
    let z_output = z;
    let filled = false;

    if (fraction_finite < 1.0) {
        filled = true;
        z_output = z.map(row =>
            row.map(v => (typeof v === 'number' && isFinite(v)) ? v : mean)
        );
    }

    return { ok: true, z: z_output, nx, ny, fraction: fraction_finite, filled, mean };
}

function product(arr){
  var p=1;
  for(var i=0;i<arr.length;i++) p*=arr[i];
  return p;
}

function get_shape_from_array(arr, shape=[]){
  if (!Array.isArray(arr)) return shape;
  shape.push(arr.length);
  if (arr.length > 0) return get_shape_from_array(arr[0], shape);
  return shape;
}

function flatten(arr, out=[]){
  for(var i=0;i<arr.length;i++){
    if(Array.isArray(arr[i])){
      flatten(arr[i], out);
    } else {
      out.push(arr[i]);
    }
  }
  return out;
}

function flatten_weights(weights_json){
  var meta = {shapes:[],sizes:[],offsets:[]};
  var total = 0;
  for(var i=0;i<weights_json.length;i++){
    var shape = get_shape_from_array(weights_json[i]);
    var size = product(shape);
    meta.shapes.push(shape);
    meta.sizes.push(size);
    meta.offsets.push(total);
    total += size;
  }
  var vec = new Float32Array(total);
  for(var i=0;i<weights_json.length;i++){
    var flat = flatten(weights_json[i], []);
    var off = meta.offsets[i];
    for(var j=0;j<meta.sizes[i];j++) vec[off+j] = flat[j];
  }
  meta.total = total;
  return {vector:vec,meta:meta};
}

function unflatten_to_tensors(vector, meta){
  var arr = [];
  for(var i=0;i<meta.shapes.length;i++){
    var off = meta.offsets[i];
    var size = meta.sizes[i];
    var slice = vector.subarray(off, off+size);
    var t = tf.tensor(slice, meta.shapes[i]);
    arr.push(t);
  }
  return arr;
}

function vector_to_weights_json(vector, meta){
  var out = [];
  for(var i=0;i<meta.shapes.length;i++){
    var off = meta.offsets[i];
    var size = meta.sizes[i];
    var flat = Array.prototype.slice.call(vector.subarray(off, off+size));
    var shape = meta.shapes[i];
    function build(shape, flat_ref){
      if(shape.length === 0) return flat_ref.shift();
      var n = shape[0];
      var subshape = shape.slice(1);
      var res = [];
      for(var j=0;j<n;j++) res.push(build(subshape, flat_ref));
      return res;
    }
    var copy = flat.slice();
    out.push(build(shape, copy));
  }
  return out;
}

// --- Snapshot store & helpers ---
function make_snapshot_store(max_snapshots = 200) {
    const store = {
        meta: null,
        snapshots: [], // Float32Array per snapshot
        losses: [],
        times: [],
        // NEU: Speichern der letzten Komponenten für die Stabilität
        last_comps: null,
        last_mean: null
    };

    store.add_snapshot = (vec, loss) => {
        if (!store.meta) throw new Error("meta not set. Call init_with_meta(meta) first.");
        if (store.snapshots.length >= max_snapshots) {
            store.snapshots.shift();
            store.losses.shift();
            store.times.shift();
        }
        store.snapshots.push(vec.slice());
        store.losses.push(typeof loss === 'number' ? loss : NaN);
        store.times.push(Date.now());
    };

    store.set_projection_basis = (comps, mean) => {
        store.last_comps = comps;
        store.last_mean = mean;
    };


    store.init_with_meta = (meta) => { store.meta = meta; };
    store.get_matrix = () => store.snapshots;
    store.get_n = () => store.snapshots.length;
    store.get_d = () => store.meta ? store.meta.total : 0;

    store.compute_proj_bbox = (proj_coords, pad_fraction = 0.12) => {
        if (!proj_coords || proj_coords.length === 0) return { x: [-1, 1], y: [-1, 1] };

        const xs = proj_coords.map(p => p[0]);
        const ys = proj_coords.map(p => p[1]);

        let min_x = Math.min(...xs), max_x = Math.max(...xs);
        let min_y = Math.min(...ys), max_y = Math.max(...ys);

        const min_span_limit = 1e-3;

        let span_x = Math.max(max_x - min_x, min_span_limit);
        let span_y = Math.max(max_y - min_y, min_span_limit);

        // Ensure minimal span for non-degenerate grid
        if (span_x === min_span_limit) { min_x -= 0.5; max_x += 0.5; span_x = 1.0; }
        if (span_y === min_span_limit) { min_y -= 0.5; max_y += 0.5; span_y = 1.0; }

        const pad_x = span_x * pad_fraction;
        const pad_y = span_y * pad_fraction;

        return {
            x: [min_x - pad_x, max_x + pad_x],
            y: [min_y - pad_y, max_y + pad_y],
            span_x, span_y
        };
    };

    return store;
}

function should_skip_snapshot(new_vector, store) {
    const last = store.snapshots[store.snapshots.length - 1];
    if (!last || last.length !== new_vector.length) return false;

    for (let i = 0; i < last.length; i++) {
        if (last[i] !== new_vector[i]) return false;
    }
    return true;
}

// --- Dimension reduction ---
// ... (Die Funktionen `random_projection`, `compute_mean`, `pca_power_iteration` bleiben unverändert) ...

function compute_mean(rows){
  var n = rows.length, D = rows[0].length;
  var mean = new Float32Array(D);
  for(var i=0;i<n;i++){
    var r = rows[i];
    for(var j=0;j<D;j++) mean[j]+=r[j];
  }
  for(var j=0;j<D;j++) mean[j]/=n;
  return mean;
}

function pca_power_iteration(rows, k, iterations){
  var n = rows.length;
  var D = rows[0].length;
  var mean = compute_mean(rows);
  var X = [];
  for(var i=0;i<n;i++){
    var r = rows[i];
    var c = new Float32Array(D);
    for(var j=0;j<D;j++) c[j] = r[j] - mean[j];
    X.push(c);
  }
  function multiply_cov(v){
    var u = new Float32Array(n);
    for(var i=0;i<n;i++){
      var dot = 0;
      var xi = X[i];
      for(var j=0;j<D;j++) dot += xi[j]*v[j];
      u[i] = dot;
    }
    var w = new Float32Array(D);
    for(var i=0;i<n;i++){
      var factor = u[i];
      var xi = X[i];
      for(var j=0;j<D;j++) w[j] += xi[j]*factor;
    }
    return w;
  }
  var components = [];
  for(var comp_idx=0; comp_idx<k; comp_idx++){
    var v = new Float32Array(D);
    for(var i=0;i<D;i++) v[i] = Math.random() - 0.5;
    for(var it=0; it<(iterations||80); it++){
      var w = multiply_cov(v);
      for(var p=0;p<components.length;p++){
        var c = components[p];
        var dotcw = 0;
        for(var j=0;j<D;j++) dotcw += c[j]*w[j];
        for(var j=0;j<D;j++) w[j] -= dotcw*c[j];
      }
      var norm = 0;
      for(var j=0;j<D;j++) norm += w[j]*w[j];
      norm = Math.sqrt(norm)||1;
      for(var j=0;j<D;j++) v[j]=w[j]/norm;
    }
    components.push(v);
  }
  var proj = new Array(n);
  for(var i=0;i<n;i++){
    var xi = X[i];
    var coords = [];
    for(var cidx=0;cidx<components.length;cidx++){
      var c = components[cidx];
      var dot = 0;
      for(var j=0;j<D;j++) dot += xi[j]*c[j];
      coords.push(dot);
    }
    proj[i] = coords;
  }
  return {proj:proj,components:components,mean:mean};
}

// NEU: Stabilisierung der PCA-Komponenten
function stabilize_components(new_comps, last_comps) {
    if (!last_comps || new_comps.length !== last_comps.length) return new_comps;

    const D = new_comps[0].length;
    let stabilized_comps = [];

    for (let k = 0; k < new_comps.length; k++) {
        let new_v = new_comps[k];
        let last_v = last_comps[k];

        let dot = 0;
        for (let j = 0; j < D; j++) {
            dot += new_v[j] * last_v[j];
        }

        // Wenn die Komponenten in die entgegengesetzte Richtung zeigen (Dot-Produkt negativ), umkehren
        if (dot < 0) {
            new_v = new_v.map(val => -val);
        }
        stabilized_comps.push(new_v);
    }
    return stabilized_comps;
}

function project_with_stabilized_comps(X, comps, mean) {
    var n = X.length;
    var D = X[0].length;
    var proj = new Array(n);
    for(var i=0;i<n;i++){
        var xi = X[i];
        var coords = [];
        for(var cidx=0;cidx<comps.length;cidx++){
            var c = comps[cidx];
            var dot = 0;
            for(var j=0;j<D;j++) dot += (xi[j] - mean[j]) * c[j];
            coords.push(dot);
        }
        proj[i] = coords;
    }
    return proj;
}


function compute_projection(rows, dims, projection, iterations, store) {
    if(rows.length < 2) return null;
    if(projection === 'random'){
      var result = random_projection(rows, dims);
      store.set_projection_basis(result.components, null);
      return {proj: result.proj, comps: result.components, mean: null};
    } else {
      var p = pca_power_iteration(rows, dims, iterations);

      // Stabilisierung anwenden
      const stabilized_comps = stabilize_components(p.components, store.last_comps);
      const stabilized_proj = project_with_stabilized_comps(rows, stabilized_comps, p.mean);

      store.set_projection_basis(stabilized_comps, p.mean);
      return {proj: stabilized_proj, comps: stabilized_comps, mean: p.mean};
    }
}


// --- Plotting (Plotly) ---
// ANPASSUNG DER GRÖSSE AUF 600X500
const PLOT_WIDTH = 600;
const PLOT_HEIGHT = 500;


function plot_trajectory_2d(container_id, coords, losses, times){
  var x = coords.map(function(c){ return c[0]; });
  var y = coords.map(function(c){ return c[1]; });
  var trace = {
    x:x, y:y, mode:'lines+markers',
    marker:{size:4, color:losses, colorbar:{title:'loss'}, showscale:true},
    line:{width:2},
    text: times.map(function(t){ return new Date(t).toLocaleTimeString(); }),
    hovertemplate: 'loss: %{marker.color:.4f}<br>time: %{text}<extra></extra>'
  };
  var layout = {title:'Weight trajectory (2D)', xaxis:{title:'PC1'}, yaxis:{title:'PC2'}, width:PLOT_WIDTH, height:PLOT_HEIGHT};
  Plotly.react(container_id, [trace], layout, {responsive:false});
}

function plot_trajectory_3d(container_id, coords, losses, times){
  var x = coords.map(function(c){ return c[0]; });
  var y = coords.map(function(c){ return c[1]; });
  var z = coords.map(function(c){ return c[2]; });
  var trace = {
    x:x, y:y, z:z, mode:'lines+markers', type:'scatter3d',
    marker:{size:3, color:losses, colorbar:{title:'loss'}, showscale:true},
    line:{width:2},
    text: times.map(function(t){ return new Date(t).toLocaleTimeString(); }),
    hovertemplate: 'loss: %{marker.color:.4f}<br>time: %{text}<extra></extra>'
  };
  var layout = {title:'Weight trajectory (3D)', width:PLOT_WIDTH, height:PLOT_HEIGHT};
  Plotly.react(container_id, [trace], layout, {responsive:false});
}

function plot_surface_and_trajectory(container_id, grid_x, grid_y, z_vals, traj_coords, traj_losses, dims, saved_camera){
  try {
    if(!Array.isArray(traj_coords) || traj_coords.length===0){
      console.warn('plot_surface_and_trajectory: no trajectory coords, plotting surface only if possible.');
    }

    var is3d = (dims === 3);

    var sanitize = sanitize_z_matrix(grid_x, grid_y, z_vals);
    if(!sanitize.ok){
      console.warn('sanitize_z_matrix failed:', sanitize.reason, sanitize);
      // Fallback: Nur die Trajektorie plotten
      var fallback_traj = traj_coords.map(function(c){
        return (is3d && c.length >= 3) ? c : (c.length >= 2 ? [c[0], c[1], 0] : [c[0]||0, c[1]||0, c[2]||0]);
      });
      if(!is3d){
        var ttrace = { x: fallback_traj.map(c=>c[0]), y: fallback_traj.map(c=>c[1]), mode:'lines+markers', type:'scatter', marker:{size:4, color:traj_losses} };
        var layout = {title:'Loss surface (heatmap) + trajectory', width:PLOT_WIDTH, height:PLOT_HEIGHT};
        Plotly.react(container_id, [ttrace], layout, {responsive:false});
        return;
      } else {
        var t3 = { x: fallback_traj.map(c=>c[0]), y: fallback_traj.map(c=>c[1]), z: traj_losses,
                   mode:'lines+markers', type:'scatter3d', marker:{size:3, color:traj_losses}, line:{width:2} };
        var layout3 = {title:'Loss surface + trajectory', width:PLOT_WIDTH, height:PLOT_HEIGHT, scene: saved_camera ? {camera: saved_camera} : {}};
        Plotly.react(container_id, [t3], layout3, {responsive:false});
        return;
      }
    }

    var z_clean = sanitize.z;
    if(!is3d){
      var hm = {
        x: grid_x, y: grid_y, z: z_clean, type: 'heatmap', colorscale: 'RdBu', reversescale: true, zsmooth: 'best'
      };
      var traj2 = {
        x: traj_coords.map(c=>c[0]), y: traj_coords.map(c=>c[1]), mode: 'lines+markers', type: 'scatter',
        marker: { size: 4, color: traj_losses }, line: { width: 2 }
      };
      var layout = { title: 'Loss surface (heatmap) + trajectory', width:PLOT_WIDTH, height:PLOT_HEIGHT };
      Plotly.react(container_id, [hm, traj2], layout, {responsive:false});
      return;
    }

    var surface = {
      x: grid_x, y: grid_y, z: z_clean, type: 'surface', colorscale: 'RdBu', reversescale: true, showscale: true
    };
    var traj3 = {
      x: traj_coords.map(c=>c[0]),
      y: traj_coords.map(c=>c[1]),
      z: traj_losses, // Loss als Z-Koordinate für die Oberfläche
      mode: 'lines+markers', type: 'scatter3d', marker: { size: 3, color: traj_losses }, line: { width: 2 }
    };
    var layout3 = {
        title: 'Loss surface + trajectory',
        scene: {
            aspectmode: 'manual',
            aspectratio: { x: 1, y: 1, z: 0.8 },
            ...(saved_camera && { camera: saved_camera }),
        },
        width:PLOT_WIDTH,
        height:PLOT_HEIGHT
    };
    try {
      Plotly.react(container_id, [surface, traj3], layout3, {responsive:false});
    } catch(e) {
      console.error('Plotly.react failed while drawing 3D surface, falling back to trajectory-only', e);
      var layout3_fallback = {title:'Loss surface + trajectory', width:PLOT_WIDTH, height:PLOT_HEIGHT, scene: saved_camera ? {camera: saved_camera} : {}};
      Plotly.react(container_id, [traj3], layout3_fallback, {responsive:false});
    }
  } catch(e) {
    console.error('plot_surface_and_trajectory fatal error, drawing trajectory-only', e);
    try {
      var t = {
        x: traj_coords.map(c=>c[0]), y: traj_coords.map(c=>c[1]), z: traj_coords.map(c=>(is3d && c.length>=3) ? c[2] : 0),
        mode:'lines+markers',
        type: is3d ? 'scatter3d' : 'scatter',
        marker:{size:3}
      };
      Plotly.react(container_id, [t], {width:PLOT_WIDTH, height:PLOT_HEIGHT}, {responsive:false});
    } catch(e2) {
      console.error('Also failed to draw fallback trajectory', e2);
    }
  }
}

// --- Grid evaluation (dynamic ranges + masking) ---
async function evaluate_grid_on_plane(store, projection_components, mean_vector, grid_params, eval_fn){
    var steps = grid_params.steps || 25;
    var rx = grid_params.rangeX || [-1,1];
    var ry = grid_params.rangeY || [-1,1];
    var center_idx = (typeof grid_params.center_index === 'number') ? grid_params.center_index : (store.get_n()-1);
    var center_vec = store.snapshots[center_idx];
    var D = center_vec.length;
    var proj_coords = grid_params.proj_coords || null;
    var center_proj = grid_params.center_proj || [0,0];

    const use_masking = (grid_params.mask_threshold !== null) && (proj_coords && proj_coords.length >= 5);
    const max_allowed = use_masking ? grid_params.mask_threshold : Infinity;

    // produce grid axes
    var xs = new Array(steps);
    var ys = new Array(steps);
    for(var i=0;i<steps;i++){
        xs[i] = rx[0] + (rx[1]-rx[0]) * i / (steps-1);
        ys[i] = ry[0] + (ry[1]-ry[0]) * i / (steps-1);
    }
    var z = new Array(steps);
    for(var i=0;i<steps;i++) z[i] = new Array(steps);

    // serial evaluation, but skip distant grid points by writing NaN
    for(var ix=0; ix<steps; ix++){
        for(var iy=0; iy<steps; iy++){
            var gx = xs[ix], gy = ys[iy];
            var should_eval = true;

            // Masking check
            if(use_masking){
                var nearest_sq = Infinity;
                for(var pi=0; pi<proj_coords.length; pi++){
                    var dx = gx - proj_coords[pi][0];
                    var dy = gy - proj_coords[pi][1];
                    var d2 = dx*dx + dy*dy;
                    if(d2 < nearest_sq) nearest_sq = d2;
                }
                var dist = Math.sqrt(nearest_sq);
                if(dist > max_allowed){ should_eval = false; }
            }

            if(!should_eval){
                z[iy][ix] = NaN;
                continue;
            }

            // reconstruct vector: use center projection point as reference
            var compX = projection_components[0], compY = projection_components[1];
            var delta_x = gx - center_proj[0];
            var delta_y = gy - center_proj[1];
            var v = new Float32Array(D);
            for(var j=0;j<D;j++){
                v[j] = center_vec[j] + delta_x * compX[j] + delta_y * compY[j];
            }
            var weights_json = vector_to_weights_json(v, store.meta);
            try{
                var loss = await eval_fn(weights_json);
            }catch(e){
                console.error("eval_fn failed at grid point", e);
                var loss = NaN;
            }
            z[iy][ix] = loss;
        }
    }
    return {xs:xs, ys:ys, z:z};
}

// --- Main plotter factory ---
function make_loss_landscape_plotter(opts) {
    const {
        max_snapshots, container_id, projection = 'pca', dims = 2,
        pca_iterations = 80, auto_poll_ms = null, get_weights_fn,
        current_loss_fn, grid, eval_fn
    } = opts || {};

    const store = make_snapshot_store(max_snapshots || 200);
    let polling_handle = null;
    let render_pending = false;
    let saved_camera = null;

    function setup_camera_listener() {
        const container = document.getElementById(container_id);

        if (container) {
            if (container.hasAttribute('data-camera-listener-setup')) return;

            container.addEventListener('plotly_relayout', function(eventdata) {
                if (eventdata && eventdata['scene.camera']) {
                    saved_camera = eventdata['scene.camera'];
                }
            });
            container.setAttribute('data-camera-listener-setup', 'true');
        }
    }

    async function init_from_get_weights() {
        if (!get_weights_fn) return;
        const wjson = await get_weights_fn();
        const { vector, meta } = flatten_weights(wjson);
        store.init_with_meta(meta);
        store.add_snapshot(vector, NaN);
        setup_camera_listener();
    }

    async function add_current_snapshot(loss) {
        if (!get_weights_fn) {
             throw new Error("No get_weights_fn provided; call init_with_meta and add_snapshot manually.");
        }
        const wjson = await get_weights_fn();
        const { vector, meta } = flatten_weights(wjson);

        if (!store.meta) store.init_with_meta(meta);
        if (meta.total !== store.meta.total) {
             console.error("Weight vector length changed! Cannot snapshot.");
             return;
        }

        if (should_skip_snapshot(vector, store)) return;

        store.add_snapshot(vector, loss);
        update_plot();
    }

    function add_snapshot_manual(weights_json, loss) {
        const { vector, meta } = flatten_weights(weights_json);

        if (!store.meta) store.init_with_meta(meta);
        if (meta.total !== store.meta.total) {
             console.error("Weight vector length changed! Cannot snapshot.");
             return;
        }

        if (should_skip_snapshot(vector, store)) return;

        store.add_snapshot(vector, loss);
        update_plot();
    }

    async function update_plot() {
        if (render_pending) return;
        render_pending = true;

        requestAnimationFrame(async () => {
            render_pending = false;
            if (!store.meta || store.get_n() < 2) {
                if (store.get_n() === 1) {
                    // Für einen einzelnen Punkt verwenden wir random, da PCA 2 Punkte braucht
                    const [coord] = store.get_matrix().map(v => random_projection([v, v], dims).proj[0]);
                    const single_point = (dims === 2) ? plot_trajectory_2d : plot_trajectory_3d;
                    single_point(container_id, [coord], [store.losses[0]], [store.times[0]]);
                }
                return;
            }

            const projection_result = await compute_projection(store.get_matrix(), dims, projection, pca_iterations, store);
            if (!projection_result) return;

            const { proj: coords, comps, mean } = projection_result;
            const { losses, times } = store;

            // 1. Plot trajectory (Fallback)
            const plot_fn = (dims === 2) ? plot_trajectory_2d : plot_trajectory_3d;
            plot_fn(container_id, coords, losses, times);

            // 2. Handle grid (surface plotting)
            if (grid && grid.enabled && typeof eval_fn === 'function' && comps.length >= 2) {
                (async () => {
                    try {
                        const bbox = store.compute_proj_bbox(coords, grid.pad_fraction || 0.12);
                        const center_idx = (typeof grid.center_index === 'number') ? grid.center_index : (store.get_n() - 1);
                        const center_proj = coords[Math.max(0, Math.min(store.get_n() - 1, center_idx))];

                        let mask_threshold = grid.mask_threshold || null;
                        if(store.get_n() < 5) mask_threshold = null;

                        if(mask_threshold === null && coords.length >= 2) {
                            const typical_span = Math.max(bbox.span_x, bbox.span_y, 1e-6);
                            mask_threshold = typical_span * 1.8;
                        }

                        let grid_params = {
                            steps: grid.steps || 15,
                            rangeX: (grid.rangeX && grid.rangeX.length === 2) ? grid.rangeX : bbox.x,
                            rangeY: (grid.rangeY && grid.rangeY.length === 2) ? grid.rangeY : bbox.y,
                            center_index: center_idx,
                            proj_coords: coords,
                            center_proj: center_proj,
                            mask_threshold: mask_threshold
                        };

                        let grid_res = await evaluate_grid_on_plane(store, [comps[0], comps[1]], mean, grid_params, eval_fn);

                        const coords_for_plot = coords.map(c => (dims === 3) ? (c.length >= 3 ? c : [c[0], c[1], 0]) : (c.length >= 2 ? c : [c[0], 0]));
                        plot_surface_and_trajectory(container_id, grid_res.xs, grid_res.ys, grid_res.z, coords_for_plot, losses, dims, saved_camera);
                    } catch (e) {
                        console.error("Grid evaluation or plotting failed:", e);
                    }
                })();
            }
        });
    }

    function start_auto_poll() {
        if (!get_weights_fn) throw new Error("get_weights_fn required for auto poll.");
        if (polling_handle) return;
        setup_camera_listener();

        polling_handle = setInterval(async () => {
            try {
                const wjson = await get_weights_fn();
                const loss = (typeof current_loss_fn === 'function') ? await current_loss_fn() : NaN;
                const { vector, meta } = flatten_weights(wjson);

                if (!store.meta) store.init_with_meta(meta);

                if (should_skip_snapshot(vector, store)) return;

                store.add_snapshot(vector, loss);
                update_plot();
            } catch (e) {
                console.error("Auto poll error:", e);
            }
        }, auto_poll_ms);
    }

    function stop_auto_poll() {
        if (polling_handle) { clearInterval(polling_handle); polling_handle = null; }
    }

    return {
        store,
        init_from_get_weights,
        add_current_snapshot,
        add_snapshot_manual,
        update_plot,
        start_auto_poll,
        stop_auto_poll,
        set_projection: (p) => { projection = p; update_plot(); },
        set_dims: (d) => { dims = d; update_plot(); }
    };
}

// Hilfsfunktion zum Warten auf die Daten und das Modell
function waitForData(check_fn, timeout_ms = 10000, interval_ms = 200) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = () => {
            if (check_fn()) {
                resolve();
            } else if (Date.now() - startTime > timeout_ms) {
                reject(new Error("Timeout: Erforderliche globale Daten/Modell sind nicht verfügbar."));
            } else {
                setTimeout(check, interval_ms);
            }
        };
        check();
    });
}

/**
 * Erstellt eine Kopie des Modells, setzt die Gewichte, kompiliert und evaluiert.
 */
async function copy_model_and_evaluate(weights_json) {
    if (!model_config_json || !X_eval || !Y_eval) {
        console.error("Modellkonfiguration oder Kompilierungskonfiguration fehlen.");
        return NaN;
    }

    // --- ASYNCHRONER TEIL 1: MODELL KLONEN ---
    const cloned_model = await tf.models.modelFromJSON(model_config_json);
    const expected_weight_count = cloned_model.weights.length;

    let loss_value = [NaN];
    let tensors_to_dispose = null;
    let success = false;

    // --- SYNCHRONER TEIL (GPU/CPU-Operationen) in tf.tidy ---
    tf.tidy(() => {
        try {
            // ... (Restlicher Code für flatten_weights, unflatten_to_tensors, setWeights und evaluate) ...

            // 1. Gewichte entflachen und Tensoren erstellen
            const {vector, meta} = flatten_weights(weights_json);
            const tensors = unflatten_to_tensors(vector, meta);
            tensors_to_dispose = tensors;

            // 2. KRITISCHER CHECK (für den älteren Fehler)
            if (!Array.isArray(tensors) || tensors.length !== expected_weight_count) {
                console.error(`!!! KRITISCHER FEHLER: UNFLATTEN FEHLGESCHLAGEN. Erwartet: ${expected_weight_count} Tensoren. Erhalten: ${tensors.length} Tensoren.`);
                return;
            }

            // 3. Gewichte setzen und evaluieren
            cloned_model.setWeights(tensors);

            cloned_model.compile(global_model_data);

            const loss_tensor = cloned_model.evaluate(X_eval, Y_eval, {verbose: 0}); // <-- FEHLER WIRD HIER BEHOBEN
            loss_value = loss_tensor.dataSync();
            success = true;

        } catch (e) {
            console.error("Fehler im synchronen tf.tidy-Block (SetWeights/Evaluate):", e);
        }
    });

    // --- MANUELLES DISPOSING ---
    if (cloned_model) cloned_model.dispose();
    if (tensors_to_dispose) tensors_to_dispose.forEach(t => t.dispose());

    return success ? loss_value[0] : NaN;
}

// =================================================================
// 🌎 GLOBALE VARIABLEN
// =================================================================

// Globale Variable für die Modell-Architektur-Konfiguration
let model_config_json = null;

// NEU: Globale Variable für die Kopie der Kompilierungskonfiguration (zur Isolierung)
let plotter_compiled_config = null;

// NEU: Speichere die Daten als reine JavaScript-Arrays, um Disposing-Fehler zu vermeiden.
let X_data_array = null;
let Y_data_array = null;

// GLOBALE VARIABLE ZUR FEHLERDROSSELUNG
let landscapeEvaluationErrorCount = 0;
let backendLogged = false;

// =================================================================
// 🛡️ SICHERER GEWICHTSABRUF (mit erhöhtem Retry)
// =================================================================

/**
 * Versucht, die Länge der Gewichte abzurufen, und wiederholt den Versuch bei DisposedError.
 */
async function get_safe_weights_length(max_retries = 15, delay_ms = 200) {
    for (let i = 0; i < max_retries; i++) {
        try {
            // Führe den riskanten Aufruf in einem tf.tidy Block aus
            const length = tf.tidy(() => {
                const initial_weights = window.model.getWeights();
                // Hier könnte der Disposed-Fehler auftreten
                const len = initial_weights.length;
                return len; // Tensoren werden von tf.tidy disposed
            });
            // Erfolg: Rückgabe der Länge
            return length;
        } catch (e) {
            if (e.message && e.message.includes('already disposed')) {
                // Bei "disposed" Fehler: Kurz warten und wiederholen
                console.warn(`WARN: Model weights disposed during read attempt ${i + 1}. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, delay_ms));
            } else {
                // Bei einem anderen Fehler (z.B. TypeError): Den Fehler werfen
                console.error("Unerwarteter Fehler beim Abrufen der Gewichte:", e);
                return 0; // Fehlerfall: 0 Gewichte
            }
        }
    }
    // Nach maximalen Wiederholungen
    console.error(`KRITISCHER FEHLER: Konnte Gewichte nach ${max_retries} Versuchen nicht stabil abrufen.`);
    return 0;
}

// =================================================================
// 📋 MODELL KOPIEREN & EVALUIEREN (mit Kompilierungssicherung)
// =================================================================

/**
 * Erstellt eine Kopie des Modells, setzt die Gewichte und evaluiert den Verlust.
 */
async function copy_model_and_evaluate(arg1, arg2) {
    // Checkt jetzt auf die gesicherte Kompilierungskonfiguration
    if (!model_config_json || !X_data_array || !Y_data_array || !plotter_compiled_config) {
        console.error("Modellkonfiguration, Daten oder Kompilierungskonfiguration fehlen.");
        return NaN;
    }

    let current_vector;
    let current_meta;

    // Logik zur Unterscheidung zwischen den beiden Aufruf-Szenarien
    if (arg1 instanceof Float32Array && arg2) {
        current_vector = arg1;
        current_meta = arg2;
    } else if (Array.isArray(arg1) && arg2 === undefined) {
        try {
            const result = flatten_weights(arg1);
            current_vector = result.vector;
            current_meta = result.meta;
        } catch (e) {
            console.error("Fehler beim Abflachen der initialen Gewichts-JSON-Struktur:", e);
            return NaN;
        }
    } else {
        console.error("Ungültige Eingabe für copy_model_and_evaluate.");
        return NaN;
    }

    // KRITISCHE PRÜFUNG: Sicherstellen, dass die Datenstruktur gültig ist.
    if (!current_meta || current_meta.total === 0) {
        if (landscapeEvaluationErrorCount === 0) {
            console.error("KRITISCHER FEHLER (Internal): Gewichtstruktur konnte nicht abgeflacht/rekonstruiert werden (meta.total ist 0). Weitere Meldungen dieser Art werden unterdrückt.");
        }
        landscapeEvaluationErrorCount++;
        return NaN;
    }

    // Backend-Check (Debugging)
    if (!backendLogged) {
        console.log(`DEBUG: Aktives TF Backend: ${tf.getBackend()}`);
        backendLogged = true;
    }

    // ASYNCHRONER TEIL 1: MODELL KLONEN
    const cloned_model = await tf.models.modelFromJSON(model_config_json);

    // Kompilierungsdaten kopieren, um Isolation zu gewährleisten (NEU: Gesicherte Konfiguration verwenden)
    const compiled_data_copy = { ...plotter_compiled_config };

    // Modell SOFORT nach dem Klonen kompilieren.
    try {
        cloned_model.compile(compiled_data_copy);
    } catch (e) {
        console.error("Fehler beim Kompilieren des geklonten Modells:", e);
        cloned_model.dispose();
        return NaN;
    }

    let loss_value = [NaN];
    let tensors_to_dispose = null;
    let successful = false;

    // SYNCHRONER TEIL (GPU/CPU-Operationen) in tf.tidy
    tf.tidy(() => {
        let prediction = null;
        let loss_tensor = null;
        let X_temp_tensor = null;
        let Y_temp_tensor = null;
        try {
            // WICHTIG: Erzeuge die Tensoren aus den globalen Arrays nur für diesen Lauf.
            X_temp_tensor = tf.tensor(X_data_array, X_data_array.shape, 'float32');
            Y_temp_tensor = tf.tensor(Y_data_array, Y_data_array.shape, 'float32');


            // 1. Tensoren direkt aus Vektor und Meta-Daten erstellen
            const tensors = unflatten_to_tensors(current_vector, current_meta);
            tensors_to_dispose = tensors;

            // 2. Gewichte setzen
            cloned_model.setWeights(tensors);

            // Debug Logging der Shapes vor der fehleranfälligen Operation
            if (landscapeEvaluationErrorCount === 0) {
                 console.log(`DEBUG: X_temp_tensor Shape vor Predict: ${X_temp_tensor.shape}`);
            }

            // 3. Verlust manuell berechnen (mit MSE)
            prediction = cloned_model.predict(X_temp_tensor);

            // Check der Prediction Shape, wenn sie erfolgreich war
            if (landscapeEvaluationErrorCount === 0) {
                 console.log(`DEBUG: Prediction Shape: ${prediction.shape}`);
            }

            loss_tensor = tf.losses.meanSquaredError(Y_temp_tensor, prediction);

            loss_value = loss_tensor.dataSync();
            successful = true;

        } catch (e) {
            // Dieser Catch-Block fängt den TypeError: 'backend' Fehler ab.
            if (landscapeEvaluationErrorCount === 0) {
                console.error("Fehler im synchronen tf.tidy-Block (SetWeights/Predict):", e);
                console.log(`DEBUG: Aktives TF Backend während des Fehlers: ${tf.getBackend()}`);
            }
            landscapeEvaluationErrorCount++;

            // Manuelles Disposing im Fehlerfall
            if (tensors_to_dispose) {
                 tensors_to_dispose.forEach(t => {
                     if (!t.isDisposed) t.dispose();
                 });
                 tensors_to_dispose = null;
            }
            loss_value = [NaN];
        } finally {
             // prediction und loss_tensor müssen manuell entsorgt werden.
             if (prediction && !prediction.isDisposed) prediction.dispose();
             if (loss_tensor && !loss_tensor.isDisposed) loss_tensor.dispose();
             // X_temp_tensor und Y_temp_tensor werden von tf.tidy entsorgt.
        }
    }); // Ende von tf.tidy()

    // MANUELLES DISPOSING
    if (cloned_model && !cloned_model.isDisposed) cloned_model.dispose();

    // Entsorge die Weight-Tensoren, falls nicht in tf.tidy entsorgt.
    if (tensors_to_dispose) tensors_to_dispose.forEach(t => {
        if (!t.isDisposed) t.dispose();
    });

    // Zähler nur zurücksetzen, wenn die Berechnung erfolgreich war
    if (successful && landscapeEvaluationErrorCount > 0) {
        landscapeEvaluationErrorCount = 0;
    }

    return loss_value[0];
}

// =================================================================
// ▶️ START PLOTTER (Hauptfunktion)
// =================================================================

async function start_landscape_plotter(d=3) {
    const container = document.getElementById('python_tab');
    if (container) {
        Plotly.purge(container);
        container.innerHTML = '';
    }

    // Zähler zurücksetzen, wenn der Plotter neu gestartet wird
    landscapeEvaluationErrorCount = 0;
    backendLogged = false;

    // --- 1. AUF DATEN UND MODELL WARTEN UND ARCHITEKTUR SPEICHERN ---
    console.log("Warte auf globale Daten und Modell und speichere Architektur...");
    try {
        await waitForData(() =>
            typeof array_sync === 'function' &&
            xy_data_global &&
            xy_data_global["x"] && xy_data_global["y"] &&
            xy_data_global["x"].shape && xy_data_global["y"].shape &&
            window.model &&
            typeof window.model.getWeights === 'function' &&
            window.global_model_data // Sicherstellen, dass die Kompilierungsdaten existieren
        );

        // SICHERER GEWICHTSABRUF MIT RETRY-LOGIK
        const weights_length = await get_safe_weights_length();

        if (weights_length === 0) {
             console.error("KRITISCHER FEHLER: Das globale Modell (window.model) enthält 0 Gewichte oder ist instabil.");
             return;
        }

        // ARCHITEKTUR SPEICHERN
        // HINWEIS: 'model' muss global oder als Alias von 'window.model' verfügbar sein.
        const full_model_json_string = window.model.toJSON();

        try {
            model_config_json = JSON.parse(full_model_json_string);
        } catch (e) {
            model_config_json = full_model_json_string;
        }

        // Optional: Entferne das Gewichts-Manifest
        if (model_config_json && model_config_json.weightsManifest) {
             delete model_config_json.weightsManifest;
        }

        // NEU: KOMPILIERUNGSKONFIGURATION SPEICHERN
        plotter_compiled_config = { ...window.global_model_data };
        console.log("Kompilierungskonfiguration gesichert.");

        console.log("Modell-Architektur gespeichert für das Klonen.");
    } catch (error) {
        console.error("Plotter kann nicht gestartet werden:", error);
        return;
    }

    // --- 2. EVALUATIONSDATEN LADEN UND ALS ARRAY SPEICHERN ---
    X_data_array = null;
    Y_data_array = null;

    console.log("Lade und konvertiere Evaluierungsdaten in JS-Arrays...");

    // Lese die Tensoren einmal aus
    const X_tensor_to_dispose = xy_data_global["x"];
    const Y_tensor_to_dispose = xy_data_global["y"];

    // Speichere die Daten in den globalen Arrays
    X_data_array = array_sync(X_tensor_to_dispose);
    Y_data_array = array_sync(Y_tensor_to_dispose);

    // Speichere die Shapes in den Arrays für die spätere Tensorerzeugung
    X_data_array.shape = X_tensor_to_dispose.shape;
    Y_data_array.shape = Y_tensor_to_dispose.shape;

    // WICHTIG: Die ursprünglichen globalen Tensoren MÜSSEN freigegeben werden.
    X_tensor_to_dispose.dispose();
    Y_tensor_to_dispose.dispose();

    // Alte globale Referenzen nullen (nur für Konsistenz)
    X_eval = null;
    Y_eval = null;


    console.log(`X_data_array Shape: ${X_data_array.shape}, Y_data_array Shape: ${Y_data_array.shape}`);

    // --- 3. PLOTTER INITIALISIEREN ---
    var plotter = make_loss_landscape_plotter({
      container_id:'python_tab',
      get_weights_fn: async ()=> await get_weights_as_json(),
      current_loss_fn: async ()=> current_loss_value,

      // EVAL_FN ruft copy_model_and_evaluate auf
      eval_fn: async (arg1, arg2) => {
             try {
                 return await copy_model_and_evaluate(arg1, arg2);
             } catch(e) {
                 // UNERWARTETER FEHLER: Drosselung
                 if (landscapeEvaluationErrorCount === 0) {
                      console.error("UNERWARTETER FEHLER im asynchronen Evaluierungsfluss:", e);
                      console.warn("Weitere Fehler während der Gitterauswertung werden unterdrückt, bis der Plotter neu gestartet wird.");
                 }
                 landscapeEvaluationErrorCount++;
                 return NaN;
             }
      },
      projection:'pca',
      dims:d,
      auto_poll_ms:1000,
      grid:{ enabled:true, steps:15 }
    });

    // Aufräumfunktion für die globalen Arrays
    plotter.dispose_eval_data = () => {
        X_data_array = null;
        Y_data_array = null;
        model_config_json = null;
        plotter_compiled_config = null; // NEU: Kompilierungskonfiguration freigeben
        console.log("Evaluierungsdaten (Arrays) und Modellkonfiguration freigegeben.");
    };

    await plotter.init_from_get_weights();
    plotter.start_auto_poll();

    return plotter;
}
