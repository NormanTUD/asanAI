// loss_landscape_live.js (stable + dynamic grid + masking)
// Requires: tf (TFJS), Plotly (global). Designed to run in browser.

// --- Utilities: flatten / metadata for weights ---
function sanitize_z_matrix(xs, ys, z) {
  if(!Array.isArray(xs) || !Array.isArray(ys) || !Array.isArray(z)) return {ok:false, reason:'bad_inputs'};
  var nx = xs.length;
  var ny = ys.length;
  if(z.length !== ny) return {ok:false, reason:'z_outer_mismatch', nx:nx, ny:ny, z0len: z[0] && z[0].length};

  var total = 0, finite_count = 0;
  for(var i=0;i<ny;i++){
    if(!Array.isArray(z[i])) return {ok:false, reason:'z_row_not_array', row:i};
    if(z[i].length !== nx) return {ok:false, reason:'z_inner_mismatch', row:i, expect:nx, got:z[i].length};
    for(var j=0;j<nx;j++){
      total++;
      var v = z[i][j];
      if(typeof v === 'number' && isFinite(v)) finite_count++;
    }
  }

  if(total === 0) return {ok:false, reason:'empty_z'};

  var fraction_finite = finite_count / total;

  if(fraction_finite === 1.0){
    return {ok:true, z:z, nx:nx, ny:ny, fraction:1.0};
  }

  // compute global mean of finite valuesf
  var sum = 0;
  for(var i=0;i<ny;i++){
    for(var j=0;j<nx;j++){
      var v=z[i][j];
      if(typeof v === 'number' && isFinite(v)) sum += v;
    }
  }
  var mean = (finite_count > 0) ? (sum / finite_count) : 0;

  // if almost all values are missing, signal failure (we'll skip surface)
  if(fraction_finite < 0.15) return {ok:false, reason:'too_many_missing', fraction:fraction_finite};

  // otherwise fill missing with mean (simple, robust)
  var z_filled = new Array(ny);
  for(var i=0;i<ny;i++){
    z_filled[i] = new Array(nx);
    for(var j=0;j<nx;j++){
      var v = z[i][j];
      if(typeof v === 'number' && isFinite(v)) z_filled[i][j] = v;
      else z_filled[i][j] = mean;
    }
  }
  return {ok:true, z:z_filled, nx:nx, ny:ny, fraction:fraction_finite, filled:true, mean:mean};
}

function product(arr){
  var p=1;
  for(var i=0;i<arr.length;i++) p*=arr[i];
  return p;
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
function make_snapshot_store(max_snapshots){
  var store = {
    meta: null,
    snapshots: [], // Float32Array per snapshot
    losses: [],
    times: []
  };
  store.add_snapshot = function(vec, loss){
    if(!this.meta) throw new Error("meta not set. call init_with_meta(meta) first.");
    if(this.snapshots.length >= (max_snapshots||200)){
      this.snapshots.shift();
      this.losses.shift();
      this.times.shift();
    }
    this.snapshots.push(vec.slice());
    this.losses.push(typeof loss === 'number' ? loss : NaN);
    this.times.push(Date.now());
  };
  store.init_with_meta = function(meta){
    this.meta = meta;
  };
  store.get_matrix = function(){
    return this.snapshots.map(function(s){ return s; });
  };
  store.get_n = function(){ return this.snapshots.length; };
  store.get_d = function(){ return this.meta ? this.meta.total : 0; };

  // helper to compute projected bounding box for first two dims
  store.compute_proj_bbox = function(proj_coords, pad_fraction){
    pad_fraction = (typeof pad_fraction === 'number') ? pad_fraction : 0.12;
    if(!proj_coords || proj_coords.length===0) return {x:[-1,1], y:[-1,1]};
    var xs = proj_coords.map(function(p){ return p[0]; });
    var ys = proj_coords.map(function(p){ return p[1]; });
    var min_x = Math.min.apply(null,xs), max_x = Math.max.apply(null,xs);
    var min_y = Math.min.apply(null,ys), max_y = Math.max.apply(null,ys);
    var span_x = Math.max(max_x - min_x, 1e-6);
    var span_y = Math.max(max_y - min_y, 1e-6);
    var pad_x = span_x * pad_fraction;
    var pad_y = span_y * pad_fraction;
    // ensure minimal visible span so grid is not degenerate
    var min_span = 1e-3;
    if(span_x < min_span){ min_x -= 0.5; max_x += 0.5; }
    if(span_y < min_span){ min_y -= 0.5; max_y += 0.5; }
    return { x:[min_x - pad_x, max_x + pad_x], y:[min_y - pad_y, max_y + pad_y], span_x:span_x, span_y:span_y };
  };

  return store;
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

    // detect 2D vs 3D by length of first coord (safe guard)
    var is3d = (traj_coords && traj_coords[0] && traj_coords[0].length >= 3);

    // ensure grid shapes are consistent with Plotly expectations:
    // xs length = nx, ys length = ny, z is ny x nx (rows->y, cols->x)
    var sanitize = sanitize_z_matrix(grid_x, grid_y, z_vals);
    if(!sanitize.ok){
      console.warn('sanitize_z_matrix failed:', sanitize.reason, sanitize);
      // fallback: if 2D prefer heatmap of trajectory-projected region (no grid)
      var fallback_traj = traj_coords.map(function(c){ return (c.length>=2) ? c : [c[0],0]; });
      if(!is3d){
        var hm_trace = {
          x: [0], y: [0], z: [[0]], type:'heatmap'
        };
        var ttrace = {
          x: fallback_traj.map(c=>c[0]), y: fallback_traj.map(c=>c[1]), mode:'lines+markers', type:'scatter', marker:{size:4}
        };
        Plotly.react(container_id, [ttrace], {width:300, height:400}, {responsive:false});
        return;
      } else {
        // 3D fallback: only plot trajectory as scatter3d
        var t3 = { x: fallback_traj.map(c=>c[0]), y: fallback_traj.map(c=>c[1]), z: fallback_traj.map(c=>c[2]||0),
                   mode:'lines+markers', type:'scatter3d', marker:{size:3}, line:{width:2} };
        Plotly.react(container_id, [t3], {width:300, height:400}, {responsive:false});
        return;
      }
    }

    // now we have numeric z matrix (filled if needed)
    var z_clean = sanitize.z;
    if(!is3d){
      // 2D: use heatmap (no WebGL), overlay 2D scatter
      var hm = {
        x: grid_x,
        y: grid_y,
        z: z_clean,
        type: 'heatmap',
        colorscale: 'RdBu',
        reversescale: true,
        zsmooth: 'best'
      };
      var traj2 = {
        x: traj_coords.map(c=>c[0]),
        y: traj_coords.map(c=>c[1]),
        mode: 'lines+markers',
        type: 'scatter',
        marker: { size: 4, color: traj_losses },
        line: { width: 2 }
      };
      var layout = { title: 'Loss surface (heatmap) + trajectory', width:300, height:400 };
      Plotly.react(container_id, [hm, traj2], layout, {responsive:false});
      return;
    }

    // 3D case: make sure z_clean is rectangular and finite (sanitize ensured that)
    var surface = {
      x: grid_x,
      y: grid_y,
      z: z_clean,
      type: 'surface',
      colorscale: 'RdBu',
      reversescale: true,
      showscale: true
    };
    var traj3 = {
      x: traj_coords.map(c=>c[0]),
      y: traj_coords.map(c=>c[1]),
      z: traj_coords.map(c=>c[2]||0),
      mode: 'lines+markers',
      type: 'scatter3d',
      marker: { size: 3, color: traj_losses },
      line: { width: 2 }
    };
    var layout3 = { title: 'Loss surface + trajectory', scene: { aspectmode: 'auto' }, width:300, height:400 };
    // try/catch around Plotly to prevent one bad render from crashing everything
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
        x: traj_coords.map(c=>c[0]),
        y: traj_coords.map(c=>c[1]),
        z: traj_coords.map(c=>c[2]||0),
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
function make_loss_landscape_plotter(opts){
  var o = opts||{};
  var store = make_snapshot_store(o.max_snapshots||200);
  var container_id = o.container_id || 'loss_landscape_plot';
  var projection = o.projection || 'pca';
  var dims = o.dims || 2;
  var pca_iterations = o.pca_iterations || 80;
  var auto_poll_ms = o.auto_poll_ms || null;
  var polling_handle = null;
  var render_pending = false;

  async function init_from_get_weights(){
    if(!o.get_weights_fn) return;
    var wjson = await o.get_weights_fn();
    var f = flatten_weights(wjson);
    store.init_with_meta(f.meta);
    store.add_snapshot(f.vector, NaN);
  }

  async function add_current_snapshot(loss){
    if(!o.get_weights_fn) throw new Error("No get_weights_fn provided; call init_with_meta and add_snapshot manually.");
    var wjson = await o.get_weights_fn();
    var f = flatten_weights(wjson);
    if(!store.meta) store.init_with_meta(f.meta);
    if(f.meta.total !== store.meta.total) console.error("weight vector length changed! can't snapshot.");
    // change detection
    var last = store.snapshots[store.snapshots.length-1];
    if(last && last.length === f.vector.length){
      var identical = true;
      for(var i=0;i<last.length;i++){ if(last[i] !== f.vector[i]){ identical = false; break; } }
      if(identical) return;
    }
    store.add_snapshot(f.vector, loss);
    update_plot();
  }

  function add_snapshot_manual(weights_json, loss){
    var f = flatten_weights(weights_json);
    if(!store.meta) store.init_with_meta(f.meta);
    if(f.meta.total !== store.meta.total) console.error("weight vector length changed! can't snapshot.");
    var last = store.snapshots[store.snapshots.length-1];
    if(last && last.length === f.vector.length){
      var identical = true;
      for(var i=0;i<last.length;i++){ if(last[i] !== f.vector[i]){ identical = false; break; } }
      if(identical) return;
    }
    store.add_snapshot(f.vector, loss);
    update_plot();
  }

  async function compute_projection(){
    var rows = store.get_matrix();
    if(rows.length < 2) return null;
    var result;
    if(projection === 'random'){
      result = random_projection(rows, dims);
      return {proj: result.proj, comps: result.components, mean: null};
    } else {
      var p = pca_power_iteration(rows, dims, pca_iterations);
      return {proj: p.proj, comps: p.components, mean: p.mean};
    }
  }

  async function update_plot(){
    if(render_pending) return;
    render_pending = true;
    requestAnimationFrame(async function(){
      render_pending = false;
      if(!store.meta) return;
      if(store.get_n() === 0) return;
      var projection_result = await compute_projection();
      if(!projection_result) return;
      var coords = projection_result.proj;
      var losses = store.losses;
      var times = store.times;

      // plot trajectory
      if(dims === 2){
        plot_trajectory_2d(container_id, coords, losses, times);
      } else {
        plot_trajectory_3d(container_id, coords, losses, times);
      }

      // handle grid: dynamic range and masking
      if(o.grid && o.grid.enabled && typeof o.eval_fn === 'function' && projection_result.comps.length >= 2){
        (async function(){
          try{
            // compute proj bbox based on actual projected coords
            var bbox = store.compute_proj_bbox(coords, (typeof o.grid.pad_fraction === 'number') ? o.grid.pad_fraction : 0.12);
            var rangeX = (o.grid.rangeX && o.grid.rangeX.length===2) ? o.grid.rangeX : bbox.x;
            var rangeY = (o.grid.rangeY && o.grid.rangeY.length===2) ? o.grid.rangeY : bbox.y;
            var grid_params = {
              steps: o.grid.steps || 15,
              rangeX: rangeX,
              rangeY: rangeY,
              center_index: (typeof o.grid.center_index === 'number') ? o.grid.center_index : (store.get_n()-1),
              proj_coords: coords,
              center_proj: coords[Math.max(0, Math.min(store.get_n()-1, (typeof o.grid.center_index === 'number') ? o.grid.center_index : (store.get_n()-1)))],
              mask_threshold: (typeof o.grid.mask_threshold === 'number') ? o.grid.mask_threshold : null
            };
            var comps = projection_result.comps;
            var grid_res = await evaluate_grid_on_plane(store, [comps[0], comps[1]], projection_result.mean, grid_params, o.eval_fn);
            // if grid produces mostly NaN (too aggressive), fall back to smaller grid around center
            var nan_count = 0, total = 0;
            for(var i=0;i<grid_res.z.length;i++){
              for(var j=0;j<grid_res.z[i].length;j++){
                total++;
                if(isNaN(grid_res.z[i][j])) nan_count++;
              }
            }
            if(total>0 && (nan_count / total) > 0.85){
              // fallback: make tiny local grid around center proj with small radius
              var c = grid_params.center_proj || [0,0];
              var radx = Math.max(bbox.span_x, 1e-3) * 0.6;
              var rady = Math.max(bbox.span_y, 1e-3) * 0.6;
              var fallback = {
                steps: Math.min(9, Math.max(5, o.grid.steps||15)),
                rangeX: [c[0]-radx, c[0]+radx],
                rangeY: [c[1]-rady, c[1]+rady],
                center_index: grid_params.center_index,
                proj_coords: coords,
                center_proj: c,
                mask_threshold: Math.max(radx, rady) * 1.5
              };
              grid_res = await evaluate_grid_on_plane(store, [comps[0], comps[1]], projection_result.mean, fallback, o.eval_fn);
            }

            var coords_for_plot = coords.map(function(c){ return (c.length>=2) ? c : [c[0],0]; });
            if(dims === 2){
              plot_surface_and_trajectory(container_id, grid_res.xs, grid_res.ys, grid_res.z, coords_for_plot, losses);
            } else {
              var coords3 = coords.map(function(c){ return (c.length>=3) ? c : [c[0], c[1], 0]; });
              plot_surface_and_trajectory(container_id, grid_res.xs, grid_res.ys, grid_res.z, coords3, losses);
            }
          }catch(e){
            console.error("grid eval failed:", e);
          }
        })();
      }
    });
  }

  function start_auto_poll(){
    if(!o.get_weights_fn) throw new Error("get_weights_fn required for auto poll.");
    if(polling_handle) return;
    polling_handle = setInterval(async function(){
      try{
        var wjson = await o.get_weights_fn();
        var loss = (typeof o.current_loss_fn === 'function') ? await o.current_loss_fn() : NaN;
        var f = flatten_weights(wjson);
        if(!store.meta) store.init_with_meta(f.meta);
        // change detection
        var last = store.snapshots[store.snapshots.length-1];
        var skip = false;
        if(last && last.length === f.vector.length){
          skip = true;
          for(var i=0;i<last.length;i++){ if(last[i] !== f.vector[i]){ skip = false; break; } }
        }
        if(skip) return;
        store.add_snapshot(f.vector, loss);
        update_plot();
      }catch(e){
        console.error("auto poll error:", e);
      }
    }, auto_poll_ms);
  }

  function stop_auto_poll(){
    if(polling_handle){ clearInterval(polling_handle); polling_handle = null; }
  }

  return {
    store:store,
    init_from_get_weights:init_from_get_weights,
    add_current_snapshot:add_current_snapshot,
    add_snapshot_manual:add_snapshot_manual,
    update_plot:update_plot,
    start_auto_poll:start_auto_poll,
    stop_auto_poll:stop_auto_poll,
    set_projection:function(p){ projection = p; update_plot(); },
    set_dims:function(d){ dims = d; update_plot(); }
  };
}

async function start_landscape_plotter() {
	var plotter = make_loss_landscape_plotter({
	  container_id:'python_tab',
	  get_weights_fn: async ()=> await get_weights_as_json(),
	  current_loss_fn: async ()=> current_loss_value,
	  eval_fn: async (weights_json)=>{ var f = flatten_weights(weights_json); var v=f.vector,s=0; for(var i=0;i<v.length;i++) s+=v[i]*v[i]; return s; },
	  projection:'pca', // or 'random' (random is faster)
	  dims:3,
	  auto_poll_ms:1000,
	  grid:{ enabled:true, steps:15, /* optional: pad_fraction:0.12, mask_threshold: <number> */ }
	});
	await plotter.init_from_get_weights();
	plotter.start_auto_poll();
}
