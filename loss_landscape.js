// loss_landscape_live.js (stable + dynamic grid + masking)
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
    if (fraction_finite < 0.15) return { ok: false, reason: 'too_many_missing', fraction: fraction_finite };

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
        times: []
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
// Random projection (fast)
function random_projection(rows, k){
  var n = rows.length;
  var D = rows[0].length;
  var comps = [];
  for(var i=0;i<k;i++){
    var v = new Float32Array(D);
    for(var j=0;j<D;j++) v[j] = Math.random() - 0.5;
    for(var p=0;p<comps.length;p++){
      var c = comps[p];
      var dot = 0;
      for(var j=0;j<D;j++) dot += v[j]*c[j];
      for(var j=0;j<D;j++) v[j] -= dot*c[j];
    }
    var norm = 0; for(var j=0;j<D;j++) norm += v[j]*v[j];
    norm = Math.sqrt(norm)||1;
    for(var j=0;j<D;j++) v[j]/=norm;
    comps.push(v);
  }
  var proj = rows.map(function(r){
    var coords = [];
    for(var i=0;i<k;i++){
      var v = comps[i];
      var dot = 0;
      for(var j=0;j<D;j++) dot += r[j]*v[j];
      coords.push(dot);
    }
    return coords;
  });
  return {proj:proj,components:comps};
}

// PCA power iteration
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

function compute_projection(rows, dims, projection, iterations) {
    if(rows.length < 2) return null;
    if(projection === 'random'){
      var result = random_projection(rows, dims);
      return {proj: result.proj, comps: result.components, mean: null};
    } else {
      var p = pca_power_iteration(rows, dims, iterations);
      return {proj: p.proj, comps: p.components, mean: p.mean};
    }
}


// --- Plotting (Plotly) with fixed size 300x400 ---
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
  var layout = {title:'Weight trajectory (2D)', xaxis:{title:'PC1'}, yaxis:{title:'PC2'}, width:300, height:400};
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
  var layout = {title:'Weight trajectory (3D)', width:300, height:400};
  Plotly.react(container_id, [trace], layout, {responsive:false});
}

function plot_surface_and_trajectory(container_id, grid_x, grid_y, z_vals, traj_coords, traj_losses){
  try {
    if(!Array.isArray(traj_coords) || traj_coords.length===0){
      console.warn('plot_surface_and_trajectory: no trajectory coords, plotting surface only if possible.');
    }

    var is3d = (traj_coords && traj_coords[0] && traj_coords[0].length >= 3);

    var sanitize = sanitize_z_matrix(grid_x, grid_y, z_vals);
    if(!sanitize.ok){
      console.warn('sanitize_z_matrix failed:', sanitize.reason, sanitize);
      var fallback_traj = traj_coords.map(function(c){ return (c.length>=2) ? c : [c[0]||0,c[1]||0,c[2]||0]; });
      if(!is3d){
        var ttrace = { x: fallback_traj.map(c=>c[0]), y: fallback_traj.map(c=>c[1]), mode:'lines+markers', type:'scatter', marker:{size:4} };
        Plotly.react(container_id, [ttrace], {width:300, height:400}, {responsive:false});
        return;
      } else {
        var t3 = { x: fallback_traj.map(c=>c[0]), y: fallback_traj.map(c=>c[1]), z: fallback_traj.map(c=>c[2]),
                   mode:'lines+markers', type:'scatter3d', marker:{size:3}, line:{width:2} };
        Plotly.react(container_id, [t3], {width:300, height:400}, {responsive:false});
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
      var layout = { title: 'Loss surface (heatmap) + trajectory', width:300, height:400 };
      Plotly.react(container_id, [hm, traj2], layout, {responsive:false});
      return;
    }

    var surface = {
      x: grid_x, y: grid_y, z: z_clean, type: 'surface', colorscale: 'RdBu', reversescale: true, showscale: true
    };
    var traj3 = {
      x: traj_coords.map(c=>c[0]), y: traj_coords.map(c=>c[1]), z: traj_coords.map(c=>c[2]||0),
      mode: 'lines+markers', type: 'scatter3d', marker: { size: 3, color: traj_losses }, line: { width: 2 }
    };
    var layout3 = { title: 'Loss surface + trajectory', scene: { aspectmode: 'auto' }, width:300, height:400 };
    try {
      Plotly.react(container_id, [surface, traj3], layout3, {responsive:false});
    } catch(e) {
      console.error('Plotly.react failed while drawing 3D surface, falling back to trajectory-only', e);
      Plotly.react(container_id, [traj3], {width:300, height:400}, {responsive:false});
    }
  } catch(e) {
    console.error('plot_surface_and_trajectory fatal error, drawing trajectory-only', e);
    try {
      var t = {
        x: traj_coords.map(c=>c[0]), y: traj_coords.map(c=>c[1]), z: traj_coords.map(c=>c[2]||0),
        mode:'lines+markers',
        type: (traj_coords[0] && traj_coords[0].length>=3) ? 'scatter3d' : 'scatter',
        marker:{size:3}
      };
      Plotly.react(container_id, [t], {width:300, height:400}, {responsive:false});
    } catch(e2) {
      console.error('Also failed to draw fallback trajectory', e2);
    }
  }
}

// --- Grid evaluation (dynamic ranges + masking) ---
// grid_params: {rangeX:[min,max], rangeY:[min,max], steps:int, center_index:int, proj_coords:[], center_proj:[x,y], mask_threshold: number}
async function evaluate_grid_on_plane(store, projection_components, mean_vector, grid_params, eval_fn){
    var steps = grid_params.steps || 25;
    var rx = grid_params.rangeX || [-1,1];
    var ry = grid_params.rangeY || [-1,1];
    var center_idx = (typeof grid_params.center_index === 'number') ? grid_params.center_index : (store.get_n()-1);
    var center_vec = store.snapshots[center_idx];
    var D = center_vec.length;
    var proj_coords = grid_params.proj_coords || null;
    var center_proj = grid_params.center_proj || [0,0];
    // produce grid axes
    var xs = new Array(steps);
    var ys = new Array(steps);
    for(var i=0;i<steps;i++){
        xs[i] = rx[0] + (rx[1]-rx[0]) * i / (steps-1);
        ys[i] = ry[0] + (ry[1]-ry[0]) * i / (steps-1);
    }
    var z = new Array(steps);
    for(var i=0;i<steps;i++) z[i] = new Array(steps);

    // precompute point distances if proj_coords provided
    var max_allowed = null;
    if(proj_coords && proj_coords.length > 0){
        var xs_only = proj_coords.map(function(p){ return p[0]; });
        var ys_only = proj_coords.map(function(p){ return p[1]; });
        var span_x = Math.max.apply(null, xs_only) - Math.min.apply(null, xs_only);
        var span_y = Math.max.apply(null, ys_only) - Math.min.apply(null, ys_only);
        var typical = Math.max(span_x, span_y, 1e-6);
        // allow grid points up to factor * typical away from nearest snapshot
        max_allowed = (typeof grid_params.mask_threshold === 'number') ? grid_params.mask_threshold : (typical * 1.8);
    }

    // serial evaluation, but skip distant grid points by writing NaN
    for(var ix=0; ix<steps; ix++){
        for(var iy=0; iy<steps; iy++){
            var gx = xs[ix], gy = ys[iy];
            var should_eval = true;
            if(proj_coords && proj_coords.length > 0 && max_allowed !== null){
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

    async function init_from_get_weights() {
        if (!get_weights_fn) return;
        const wjson = await get_weights_fn();
        const { vector, meta } = flatten_weights(wjson);
        store.init_with_meta(meta);
        store.add_snapshot(vector, NaN);
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
                // Plot trajectory-only even for single point if dims>2 or if grid disabled
                if (store.get_n() === 1) {
                    const [coord] = store.get_matrix().map(v => compute_projection([v, v], dims, 'random', 1).proj[0]);
                    const single_point = (dims === 2) ? plot_trajectory_2d : plot_trajectory_3d;
                    single_point(container_id, [coord], [store.losses[0]], [store.times[0]]);
                }
                return;
            }

            const projection_result = await compute_projection(store.get_matrix(), dims, projection, pca_iterations);
            if (!projection_result) return;

            const { proj: coords, comps, mean } = projection_result;
            const { losses, times } = store;

            // 1. Plot trajectory
            const plot_fn = (dims === 2) ? plot_trajectory_2d : plot_trajectory_3d;
            plot_fn(container_id, coords, losses, times);

            // 2. Handle grid (surface plotting)
            if (grid && grid.enabled && typeof eval_fn === 'function' && comps.length >= 2) {
                (async () => {
                    try {
                        const bbox = store.compute_proj_bbox(coords, grid.pad_fraction || 0.12);
                        const center_idx = (typeof grid.center_index === 'number') ? grid.center_index : (store.get_n() - 1);
                        const center_proj = coords[Math.max(0, Math.min(store.get_n() - 1, center_idx))];

                        let grid_params = {
                            steps: grid.steps || 15,
                            rangeX: (grid.rangeX && grid.rangeX.length === 2) ? grid.rangeX : bbox.x,
                            rangeY: (grid.rangeY && grid.rangeY.length === 2) ? grid.rangeY : bbox.y,
                            center_index: center_idx,
                            proj_coords: coords,
                            center_proj: center_proj,
                            mask_threshold: grid.mask_threshold || null
                        };

                        let grid_res = await evaluate_grid_on_plane(store, [comps[0], comps[1]], mean, grid_params, eval_fn);

                        const total = (grid_res.z.length || 0) * (grid_res.z[0]?.length || 0);
                        const nan_count = total > 0 ? grid_res.z.flat().filter(isNaN).length : 0;

                        if (total > 0 && (nan_count / total) > 0.85) {
                            const [radx, rady] = [Math.max(bbox.span_x, 1e-3) * 0.6, Math.max(bbox.span_y, 1e-3) * 0.6];
                            const fallback_steps = Math.min(9, Math.max(5, grid.steps || 15));

                            grid_params = {
                                steps: fallback_steps,
                                rangeX: [center_proj[0] - radx, center_proj[0] + radx],
                                rangeY: [center_proj[1] - rady, center_proj[1] + rady],
                                center_index: center_idx,
                                proj_coords: coords,
                                center_proj: center_proj,
                                mask_threshold: Math.max(radx, rady) * 1.5
                            };
                            grid_res = await evaluate_grid_on_plane(store, [comps[0], comps[1]], mean, grid_params, eval_fn);
                        }

                        const coords_for_plot = coords.map(c => (dims === 3) ? (c.length >= 3 ? c : [c[0], c[1], 0]) : (c.length >= 2 ? c : [c[0], 0]));
                        plot_surface_and_trajectory(container_id, grid_res.xs, grid_res.ys, grid_res.z, coords_for_plot, losses);
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

async function start_landscape_plotter(d=3) {
    // NOTE: get_weights_as_json and current_loss_value are assumed to be global/provided by the environment.
    // The default eval_fn below simply computes the squared L2-norm (sum of squares) of the weight vector.

    const container = document.getElementById('python_tab');
    if (container) {
        Plotly.purge(container); // Plotly-Plot explizit entfernen
        container.innerHTML = ''; // Container leeren
    }

    var plotter = make_loss_landscape_plotter({
      container_id:'python_tab',
      get_weights_fn: async ()=> await get_weights_as_json(),
      current_loss_fn: async ()=> current_loss_value,
      eval_fn: async (weights_json)=>{ var f = flatten_weights(weights_json); var v=f.vector,s=0; for(var i=0;i<v.length;i++) s+=v[i]*v[i]; return s; },
      projection:'pca', // or 'random' (random is faster)
      dims:d,
      auto_poll_ms:1000,
      grid:{ enabled:true, steps:15, /* optional: pad_fraction:0.12, mask_threshold: <number> */ }
    });
    await plotter.init_from_get_weights();
    plotter.start_auto_poll();
}
