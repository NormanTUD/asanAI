// drop-in file. assumes global `neuron_outputs` may exist and may be {}
// main entry is first as requested
function plot_training_data_to_neurons(div_name, max_method) {
  if(!div_name) div_name = "#python_tab"
  if(!max_method) max_method = "sum"

  var target = document.querySelector(div_name)
  if(!target) {
    console.warn("plot_training_data_to_neurons: target not found", div_name)
    return
  }

  var layer_indices = collect_layer_indices()
  var collected = collect_all_layer_data(layer_indices)
  var image_samples = collect_images_from_first_layer()

  var layers_sorted = collected.slice().sort(function(a,b){
    return (b.num_filters||0)-(a.num_filters||0)
  })

  var prepared = prepare_canvases_data(layers_sorted, image_samples, max_method)
  render_prepared(prepared, target)
}

// helpers ---------------------------------------------------------

function collect_layer_indices(){
  if(typeof get_number_of_layers === "function"){
    try { var n = get_number_of_layers(); if(Number.isFinite(n) && n>0) {
      var arr = []; for(var i=0;i<n;i++) arr.push(i); return arr
    }}catch(e){}
  }
  if(typeof neuron_outputs === "object" && neuron_outputs){
    return Object.keys(neuron_outputs).map(function(k){ return Number(k) }).filter(function(n){ return !Number.isNaN(n) }).sort(function(a,b){return a-b})
  }
  return []
}

function collect_all_layer_data(indices){
  var out = []
  indices.forEach(function(idx){
    try {
      var entry = (neuron_outputs && neuron_outputs[idx]) || {}
      var input = entry.input || []
      var output = entry.output || []
      var fused = {layer_idx: idx, raw_input: input, raw_output: output}
      fused.num_filters = estimate_num_filters_from_tensor(output)
      fused.activation_per_filter = compute_activation_for_tensor(output)
      out.push(fused)
    } catch(e){
      console.warn("collect_all_layer_data failed for", idx, e)
    }
  })
  return out
}

function estimate_num_filters_from_tensor(tensor){
  if(!tensor) return 0
  try {
    var shape = get_shape_from_array(tensor)
    if(shape.length===0) return 0
    return shape[shape.length-1] || 0
  } catch(e){ return 0 }
}

function compute_activation_for_tensor(tensor, method="sum"){
  if(!tensor) return {scores:[], method:"none"}

  // extract activations
  var act = extract_filter_activations(tensor)
  if(!act || !act.per_filter || !Array.isArray(act.per_filter)) return {scores:[], method:"none"}

  // pro Filter einen Score berechnen
  var scores = act.per_filter.map(function(arr){
    if(!arr || arr.length===0) return {sum:0, avg:0, max:0, min:0}
    var s=0, mx=-Infinity, mn=Infinity
    for(var i=0;i<arr.length;i++){
      var x=arr[i]
      s+=x
      if(x>mx) mx=x
      if(x<mn) mn=x
    }
    return {
      sum: s,
      avg: s/arr.length,
      max: mx,
      min: mn
    }
  })

  return {scores:scores, method:method}
}

function collect_images_from_first_layer(){
  if(!(neuron_outputs && neuron_outputs[0] && neuron_outputs[0].input)) return []
  var inputs = neuron_outputs[0].input
  var samples = []
  if(!Array.isArray(inputs)) return []
  inputs.forEach(function(sample_node){
    try {
      var shape = get_shape_from_array(sample_node)
      var maybe_images = extract_images_from_sample_node(sample_node)
      maybe_images.forEach(function(img){ samples.push(img) })
    } catch(e){}
  })
  return samples
}

function get_shape_from_array(node){
  if(!Array.isArray(node)) return []
  var sh = []
  var cur = node
  while(Array.isArray(cur)){
    sh.push(cur.length)
    cur = cur[0]
  }
  return sh
}

function extract_images_from_sample_node(node){
  var images = []
  var shape = get_shape_from_array(node)
  if(shape.length<3) return images
  var channels = shape[shape.length-1]
  var h = shape[shape.length-3]
  var w = shape[shape.length-2]
  if(!(channels===3 || channels===1)) return images
  var rows_root = descend_to_image_rows(node, shape)
  if(!rows_root) return images
  var img = create_image_from_rows(rows_root, w, h, channels)
  if(img) images.push(img)
  return images
}

function descend_to_image_rows(node, shape){
  var levels_to_drop = shape.length - 3
  var cur = node
  for(var i=0;i<levels_to_drop;i++){
    if(!Array.isArray(cur) || cur.length===0) return null
    cur = cur[0]
  }
  return cur
}

function create_image_from_rows(rows_root, w, h, channels){
  if(!Array.isArray(rows_root) || rows_root.length!==h) return null;

  // flatten to detect min/max
  var flat = [];
  for(let y=0;y<h;y++){
    var row = rows_root[y];
    if(!Array.isArray(row) || row.length!==w) return null;
    for(let x=0;x<w;x++){
      var cell = row[x];
      if(!Array.isArray(cell)) return null;
      for(let c=0;c<channels;c++){
        flat.push(Number(cell[c]) || 0);
      }
    }
  }

  var minv = Math.min.apply(null, flat);
  var maxv = Math.max.apply(null, flat);

  // handle constant tensors
  if(maxv === minv){
    maxv = minv + 1e-6;
  }

  function norm(v){
    return Math.round(( (v - minv) / (maxv - minv) ) * 255);
  }

  var pixels = new Uint8ClampedArray(w*h*4);
  var i = 0;

  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      let cell = rows_root[y][x];
      if(channels === 3){
        pixels[i++] = norm(cell[0]);
        pixels[i++] = norm(cell[1]);
        pixels[i++] = norm(cell[2]);
        pixels[i++] = 255;
      } else {
        let g = norm(cell[0]);
        pixels[i++] = g;
        pixels[i++] = g;
        pixels[i++] = g;
        pixels[i++] = 255;
      }
    }
  }

  return {width:w, height:h, data:pixels};
}

function clamp_color(v){
  var n = Number(v)
  if(Number.isNaN(n)) return 0
  if(n<0) return 0
  if(n>255) return 255
  return Math.round(n)
}

function extract_filter_activations(tensor){
  if(!tensor) return { per_filter: [], per_sample: [] };

  var shape = get_shape_from_array(tensor);
  // expected: [batch, ..., filters]
  if(shape.length < 2) return { per_filter: [], per_sample: [] };

  var batch = shape[0];
  var num_filters = shape[shape.length - 1];

  var per_filter = [];
  for(let f=0; f<num_filters; f++) per_filter.push([]);

  var per_sample = [];
  for(let b=0; b<batch; b++){
    per_sample.push( new Array(num_filters).fill(0) );
  }

  function walk(node, indices){
    if(!Array.isArray(node)) return;

    if(is_vector_of_numbers(node) && node.length === num_filters){
      let sample_idx = indices[0] || 0;
      for(let f=0; f<num_filters; f++){
        let v = Math.abs(node[f]);
        per_filter[f].push(v);
        per_sample[sample_idx][f] += v;  // aggregated per sample
      }
      return;
    }

    for(let i=0; i<node.length; i++){
      walk(node[i], indices.concat(i));
    }
  }

  walk(tensor, []);

  return { per_filter: per_filter, per_sample: per_sample };
}

function is_vector_of_numbers(x){
  if(!Array.isArray(x)) return false
  if(x.length===0) return false
  for(var i=0;i<x.length;i++) if(typeof x[i] !== "number") return false
  return true
}

function compute_score_from_metric(score_obj, metric){
  if(!score_obj) return 0
  if(metric==="sum") return score_obj.sum
  if(metric==="avg") return score_obj.avg
  if(metric==="max") return score_obj.max
  if(metric==="min") return score_obj.min
  return score_obj.sum
}

function prepare_canvases_data(layers_sorted, image_samples, metric){
  var prepared = [];

  layers_sorted.forEach(function(layer){
    var num_filters = layer.num_filters || 0;
    if(num_filters <= 0) return;

    var act = layer.activation_per_filter;
    if(!act || !act.per_sample) return;

    var per_sample = act.per_sample;
    var assignments = [];
    for(let b=0; b<per_sample.length; b++){
      let scores = per_sample[b];
      let best_score = -Infinity;
      let best_filters = [];

      for(let f=0; f<num_filters; f++){
        let v = scores[f];
        if(v > best_score){
          best_score = v;
          best_filters = [f];
        } else if(v === best_score){
          best_filters.push(f); // tie
        }
      }

      // assign image index b to these filters
      best_filters.forEach(f => {
        assignments.push({
          filter: f,
          sample_index: b,
          score: best_score
        });
      });
    }

    // group by filter
    var grouped = [];
    for(let f=0; f<num_filters; f++){
      grouped[f] = [];
    }
    assignments.forEach(a => {
      if(image_samples[a.sample_index])
        grouped[a.filter].push(image_samples[a.sample_index]);
    });

    prepared.push({
      layer_idx: layer.layer_idx,
      num_filters: num_filters,
      grouped_images: grouped
    });
  });

  return prepared;
}

function render_prepared(prepared, target){
  var container = ensure_container(target)
  prepared.forEach(function(layer_p){
    try {
      var box = create_layer_box(layer_p)
      container.appendChild(box)
    } catch(e){
      console.warn("render_prepared error:", e)
    }
  })
}

function ensure_container(target){
  var wrapper = document.createElement("div")
  wrapper.style.display = "flex"
  wrapper.style.flexDirection = "column"
  wrapper.style.gap = "12px"
  target.appendChild(wrapper)
  return wrapper
}

function create_layer_box(layer_p){
  var holder = document.createElement("div")
  holder.style.border = "1px solid #ddd"
  holder.style.padding = "6px"

  var title = document.createElement("div")
  title.textContent = "Layer " + layer_p.layer_idx + " — filters: " + layer_p.num_filters
  title.style.fontWeight = "600"
  title.style.marginBottom = "6px"
  holder.appendChild(title)

  var canvas = document.createElement("canvas")
  var spacing = 8
  var sample_w = 0, sample_h = 0

  if(layer_p.images && layer_p.images.length>0){
    sample_w = layer_p.images[0].width
    sample_h = layer_p.images[0].height
  } else {
    sample_w = 28; 
    sample_h = 28
  }

  var col_count = Math.max(1, layer_p.num_filters)
  var col_w = sample_w + 6
  var width = Math.max(300, 100 + col_count * (col_w + spacing))
  var rows_for_images = 1
  var height = 30 + rows_for_images * (sample_h + 6) + 40

  canvas.width = width
  canvas.height = height
  canvas.style.width = width + "px"
  canvas.style.height = height + "px"
  holder.appendChild(canvas)

  var ctx = canvas.getContext("2d")
  ctx.fillStyle = "#fff"
  ctx.fillRect(0,0,canvas.width,canvas.height)

  ctx.font = "12px sans-serif"
  ctx.fillStyle = "#333"
  ctx.fillText("Layer " + layer_p.layer_idx, 6, 14)

  ctx.strokeStyle = "#bbb"
  ctx.lineWidth = 1

  var left = 10
  var top = 30

  for(var c=0;c<col_count;c++){
    var col_x = left + c*(col_w+spacing)

    ctx.strokeRect(col_x-2, top-2, col_w+4, sample_h+10)

    if(c>0){
      ctx.beginPath()
      ctx.moveTo(col_x - spacing/2, top-6)
      ctx.lineTo(col_x - spacing/2, top + sample_h + 16)
      ctx.stroke()
    }

    var score_obj = (layer_p.scored && layer_p.scored[c]) || {idx:c, score:0}

    ctx.fillStyle = "#000"
    ctx.fillText("F" + score_obj.idx + " s:" + Math.round(score_obj.score*100)/100, col_x, top-10)

    var img = layer_p.images[c] || null
    var dx = col_x
    var dy = top

    if(img){
      var off = document.createElement("canvas")
      off.width = img.width
      off.height = img.height
      var offctx = off.getContext("2d")
      var id = new ImageData(img.data, img.width, img.height)
      offctx.putImageData(id, 0, 0)
      ctx.drawImage(off, dx, dy, sample_w, sample_h)
    } else {
      ctx.fillStyle = "#eee"
      ctx.fillRect(dx, dy, sample_w, sample_h)
    }
  }

  return holder
}

function draw_image_on_ctx(ctx, img, dx, dy, w, h){
  var off = document.createElement("canvas");
  off.width = img.width;
  off.height = img.height;
  var offctx = off.getContext("2d");
  var id = new ImageData(img.data, img.width, img.height);
  offctx.putImageData(id, 0, 0);
  ctx.drawImage(off, dx, dy, w, h);
}
