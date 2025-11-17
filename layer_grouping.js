"use strict";

async function plot_training_data_to_neurons(div_name="#layer_input_groups", max_method="sum", max_neurons=32){
  dbg("Starting plot_training_data_to_neurons");

  const target = document.querySelector(div_name);
  if(!target){ wrn("Target container not found: "+div_name); return; }

  const layer_indices = collect_layer_indices();
  dbg("Layer indices: "+layer_indices.join(","));

  const layers_data = collect_all_layer_data(layer_indices, max_method);
  dbg("Collected data for "+layers_data.length+" layers");

  const image_samples = collect_images_from_first_layer();
  dbg("Collected "+image_samples.length+" image samples");

  const layers_sorted = sort_layers_by_filters(layers_data);
  const prepared = prepare_canvases_data(layers_sorted, image_samples, /*k=*/5, max_neurons);

  render_prepared(prepared, target, max_neurons);
  dbg("Rendering finished");
}

// --------------------- Data Collection ---------------------
function collect_layer_indices(){
  if(typeof get_number_of_layers === "function"){
    try{
      const n = get_number_of_layers();
      if(Number.isFinite(n) && n>0) return [...Array(n).keys()];
    } catch(e){ wrn("get_number_of_layers failed: "+e); }
  }
  if(typeof neuron_outputs === "object" && neuron_outputs){
    return Object.keys(neuron_outputs)
      .map(k=>Number(k))
      .filter(n=>!Number.isNaN(n))
      .sort((a,b)=>a-b);
  }
  return [];
}

function collect_all_layer_data(indices, method){
  return indices.map(idx=>{
    try{
      const entry = neuron_outputs[idx]||{};
      const input = entry.input||[];
      const output = entry.output||[];
      // IMPORTANT: keep both the per-filter/per-sample activations (raw)
      const activation_raw = extract_filter_activations(output); // {per_filter, per_sample}
      const num_filters = estimate_num_filters_from_tensor(output) || (activation_raw && activation_raw.per_filter ? activation_raw.per_filter.length : 0);
      const activation_summary = compute_activation_for_tensor(output, method); // legacy summary kept
      return {
        layer_idx: idx,
        raw_input: input,
        raw_output: output,
        num_filters: num_filters,
        activation_raw: activation_raw,
        activation_summary: activation_summary
      };
    }catch(e){
      wrn("Failed to collect data for layer "+idx+": "+e);
      return null;
    }
  }).filter(x=>x!==null);
}

function estimate_num_filters_from_tensor(tensor){
  if(!tensor) return 0;
  const shape = get_shape_from_array(tensor);
  return shape.length>0 ? shape[shape.length-1]||0 : 0;
}

function compute_activation_for_tensor(tensor, method="sum"){
  if(!tensor) return {scores:[], method:"none"};
  const act = extract_filter_activations(tensor);
  if(!act.per_filter) return {scores:[], method:"none"};
  const scores = act.per_filter.map(arr=>{
    if(!arr||arr.length===0) return {sum:0, avg:0, max:0, min:0};
    let s=0, mx=-Infinity, mn=Infinity;
    for(let v of arr){ s+=v; if(v>mx) mx=v; if(v<mn) mn=v; }
    return {sum:s, avg:s/arr.length, max:mx, min:mn};
  });
  return {scores, method};
}

function collect_images_from_first_layer(){
  if(!neuron_outputs || !neuron_outputs[0] || !Array.isArray(neuron_outputs[0].input)) return [];
  const images_per_sample = [];
  for(const sample of neuron_outputs[0].input){
    try{
      const imgs = extract_images_from_sample_node(sample) || [];
      images_per_sample.push(imgs);
    }catch(e){
      wrn("Failed to extract image sample: "+e);
      images_per_sample.push([]);
    }
  }
  return images_per_sample;
}

function flatten_images(images_per_sample){
  if(!Array.isArray(images_per_sample)) return [];
  if(images_per_sample.length===0) return [];
  // if nested arrays, flatten, otherwise assume it's already a flat list
  if(Array.isArray(images_per_sample[0])) return images_per_sample.flat();
  return images_per_sample;
}

function unique_images(arr, maxCount){
  const seen = new Set();
  const out = [];
  for(const i of arr){
    const key = i && (i.src || (i.width+'x'+i.height+':'+(i.data && i.data.length))) || JSON.stringify(i);
    if(!seen.has(key) && i){
      seen.add(key);
      out.push(i);
      if(out.length>=maxCount) break;
    }
  }
  return out;
}

// --------------------- Image Extraction ---------------------
function extract_images_from_sample_node(node){
  const images = [];
  const shape = get_shape_from_array(node);
  if(shape.length<3){
    dbg("extract_images_from_sample_node: shape<3, skipping node");
    return images;
  }

  const channels = shape[shape.length-1];
  const h = shape[shape.length-3];
  const w = shape[shape.length-2];

  if(channels!==1 && channels!==3){
    dbg(`extract_images_from_sample_node: unsupported channels=${channels}`);
    return images;
  }

  dbg(`extract_images_from_sample_node: shape=${shape.join("x")}, w=${w}, h=${h}, channels=${channels}`);
  const rows = descend_to_image_rows(node, shape);
  if(!rows){
    wrn("extract_images_from_sample_node: descend_to_image_rows returned null");
    return images;
  }

  const img = create_image_from_rows(rows, w, h, channels);
  if(img){
    dbg(`extract_images_from_sample_node: created image ${w}x${h} with channels=${channels}`);
    images.push(img);
  } else {
    wrn("extract_images_from_sample_node: create_image_from_rows returned null");
  }

  return images;
}

function descend_to_image_rows(node, shape){
  if(!Array.isArray(node)){
    wrn("descend_to_image_rows: node is not array");
    return null;
  }
  let levels_to_drop = shape.length - 3, cur = node;
  for(let i=0;i<levels_to_drop;i++){
    if(!Array.isArray(cur) || cur.length===0){
      wrn(`descend_to_image_rows: failed at level ${i}`);
      return null;
    }
    cur = cur[0];
  }
  dbg(`descend_to_image_rows: descended to rows, length=${cur.length}`);
  return cur;
}

function create_image_from_rows(rows_root, w, h, channels){
  if(!Array.isArray(rows_root) || rows_root.length!==h){
    wrn("create_image_from_rows: invalid rows_root or height mismatch");
    return null;
  }

  if(channels==null){
    const sample = rows_root[0][0];
    if(Array.isArray(sample)) channels = sample.length;
    else channels = 1;
    dbg(`create_image_from_rows: auto-detected channels=${channels}`);
  }

  const pixels = new Uint8ClampedArray(w*h*4);
  const flat = [];

  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      let cell = rows_root[y][x];
      if(!Array.isArray(cell)) cell=[cell];
      for(let c=0;c<channels;c++){
        let val = Number(cell[c]);
        if(!Number.isFinite(val)) val = 0;
        flat.push(val);
      }
    }
  }

  if(flat.length===0){
    wrn("create_image_from_rows: flat array empty, returning null");
    return null;
  }

  const minv = Math.min(...flat);
  const maxv = Math.max(...flat);
  dbg(`create_image_from_rows: pixel min=${minv}, max=${maxv}, channels=${channels}`);

  let i=0;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      let cell = rows_root[y][x];
      if(!Array.isArray(cell)) cell=[cell];
      if(channels===3){
        pixels[i++] = norm_pixel(cell[0],minv,maxv);
        pixels[i++] = norm_pixel(cell[1],minv,maxv);
        pixels[i++] = norm_pixel(cell[2],minv,maxv);
      } else {
        const g = norm_pixel(cell[0],minv,maxv);
        pixels[i++] = g;
        pixels[i++] = g;
        pixels[i++] = g;
      }
      pixels[i++] = 255;
    }
  }

  return {width:w, height:h, data:pixels};
}

// --------------------- Tensor Activations ---------------------
function extract_filter_activations(tensor){
  if(!tensor) return { per_filter: [], per_sample: [] };
  const shape=get_shape_from_array(tensor);
  if(shape.length<2) return { per_filter: [], per_sample: [] };
  const batch=shape[0], num_filters=shape[shape.length-1];
  let per_filter=Array.from({length:num_filters},()=>[]), per_sample=Array.from({length:batch},()=>Array(num_filters).fill(0));

  function walk(node, indices){
    if(!Array.isArray(node)) return;
    if(is_vector_of_numbers(node)&&node.length===num_filters){
      let b=indices[0]||0;
      node.forEach((v,f)=>{
        const av = Math.abs(Number(v)) || 0;
        per_filter[f].push(av);
        per_sample[b][f] += av;
      });
      return;
    }
    node.forEach((n,i)=>walk(n, indices.concat(i)));
  }

  walk(tensor, []);
  return {per_filter, per_sample};
}

function is_vector_of_numbers(x){ return Array.isArray(x)&&x.length>0&&x.every(v=>typeof v==="number"); }

// --------------------- Layer Sorting & Canvas Preparation ---------------------
function sort_layers_by_filters(layers){ return layers.slice().sort((a,b)=> (b.num_filters||0)-(a.num_filters||0)); }

function prepare_canvases_data(layers_sorted, image_samples_per_sample, k=3, max_neurons=32){
  dbg(`[prepare_canvases_data] Starting, layers=${layers_sorted.length}`);

  const is_nested = Array.isArray(image_samples_per_sample) && Array.isArray(image_samples_per_sample[0]);
  const images_per_sample = is_nested ? image_samples_per_sample : (Array.isArray(image_samples_per_sample) ? image_samples_per_sample.map(i=> Array.isArray(i) ? i : [i]) : []);
  const flat_images = flatten_images(images_per_sample);

  layers_sorted.sort((a,b)=>a.layer_idx - b.layer_idx);

  const prepared = [];

  layers_sorted.forEach(layer=>{
    const idx = layer.layer_idx;
    const nf = layer.num_filters || 1;

    dbg(`[prepare_canvases_data] Layer ${idx} has ${nf} filters`);

    if(nf > max_neurons){
      dbg(`[prepare_canvases_data] Layer ${idx} has too many neurons (${nf} > ${max_neurons}), marking as too_many`);
      prepared.push({
        layer_idx: idx,
        num_filters: nf,
        grouped_images: [],
        too_many: true
      });
      return;
    }

    const acts_raw = layer.activation_raw || {};
    const per_filter = Array.isArray(acts_raw.per_filter) ? acts_raw.per_filter : null;
    const per_sample = Array.isArray(acts_raw.per_sample) ? acts_raw.per_sample : null;

    let grouped = Array.from({length:nf}, ()=>[]);

    if(per_sample && per_sample.length>0){
      dbg(`[prepare_canvases_data] Layer ${idx} using per_sample (len=${per_sample.length})`);
      for(let f=0; f<nf; f++){
        const pairs = [];
        for(let s=0; s<per_sample.length; s++){
          const score = Number(per_sample[s][f]) || 0;
          const imgs_for_sample = (images_per_sample[s] && images_per_sample[s].slice()) || [];
          const flat_img = flat_images[s] || null;
          // keep both in case one is empty
          pairs.push({score, imgs: imgs_for_sample, flat_img});
        }
        pairs.sort((a,b)=>b.score - a.score);

        const candidates = [];
        for(let p=0; p<pairs.length && candidates.length < k; p++){
          // prefer explicit imgs, else flat_img
          const imgs = (pairs[p].imgs && pairs[p].imgs.length>0) ? pairs[p].imgs : (pairs[p].flat_img ? [pairs[p].flat_img] : []);
          for(const im of imgs){
            if(!im) continue;
            // push until we reach k unique images
            const key = im && (im.src || (im.width+'x'+im.height+':'+(im.data && im.data.length))) || JSON.stringify(im);
            if(!candidates.some(ci => {
              const k2 = ci && (ci.src || (ci.width+'x'+ci.height+':'+(ci.data && ci.data.length))) || JSON.stringify(ci);
              return k2 === key;
            })){
              candidates.push(im);
              if(candidates.length >= k) break;
            }
          }
        }
        grouped[f] = unique_images(candidates, k);
        dbg(`[prepare_canvases_data] Layer ${idx} filter ${f}: selected ${grouped[f].length} images`);
      }
    } else if(per_filter && per_filter.length >= nf){
      dbg(`[prepare_canvases_data] Layer ${idx} using per_filter (len=${per_filter.length})`);
      const total_images = flat_images.length;
      for(let f=0; f<nf; f++){
        const arr = (per_filter[f] || []).map(x=>Number(x)||0);
        let sample_scores = [];
        if(total_images>0 && arr.length>0){
          const block = Math.max(1, Math.floor(arr.length / total_images));
          for(let s=0; s<total_images; s++){
            let start = s*block;
            let end = Math.min(arr.length, start+block);
            if(start>=arr.length){ sample_scores.push(0); continue; }
            let sum=0, cnt=0;
            for(let i=start;i<end;i++){ sum += arr[i]; cnt++; }
            sample_scores.push(cnt?sum/cnt:0);
          }
        } else {
          sample_scores = new Array(total_images).fill(0);
        }
        const pairs = (flat_images.map((img,i)=>({score: sample_scores[i] || 0, img})));
        pairs.sort((a,b)=>b.score - a.score);

        const top_imgs = [];
        for(let p=0;p<pairs.length && top_imgs.length<k;p++){
          if(pairs[p].img) top_imgs.push(pairs[p].img);
        }
        grouped[f] = unique_images(top_imgs, k);
        dbg(`[prepare_canvases_data] Layer ${idx} filter ${f}: selected ${grouped[f].length} images`);
      }
    } else {
      dbg(`[prepare_canvases_data] Layer ${idx}: activation format not understood, using flat images fallback`);
      grouped = Array.from({length:nf}, ()=> flat_images.slice(0,k));
    }

    prepared.push({
      layer_idx: idx,
      num_filters: nf,
      grouped_images: grouped,
      too_many: false
    });
  });

  return prepared;
}

// --------------------- Rendering ---------------------
function render_prepared(prepared, target, max_neurons=32){
  target.innerHTML = "";
  dbg("render_prepared: target cleared");

  const container = ensure_container(target);
  prepared.forEach(layer_p=>{
    try{
      container.appendChild(create_layer_box(layer_p, max_neurons));
    }
    catch(e){ wrn("Rendering layer "+layer_p.layer_idx+" failed: "+e); }
  });
  dbg("render_prepared: finished appending "+prepared.length+" layers");
}

function ensure_container(target){
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "12px";
  target.appendChild(wrapper);
  return wrapper;
}

function norm_pixel(v, minv, maxv){
  if(typeof v!=="number" || Number.isNaN(v)) v=0;
  if(maxv===minv) return 128; // fallback für konstante Pixel
  let n = Math.round((v - minv)/(maxv - minv)*255);
  return Math.max(0, Math.min(255, n));
}

function create_layer_box(layer, max_neurons=32){
  const holder = document.createElement("div");
  holder.style.border = "1px solid #ddd";
  holder.style.padding = "6px";

  const title = document.createElement("div");
  title.textContent = `Layer ${layer.layer_idx} — filters: ${layer.num_filters}`;
  title.style.fontWeight = "600";
  title.style.marginBottom = "6px";
  holder.appendChild(title);

  if(layer.too_many){
    const note = document.createElement("div");
    note.textContent = `Too many neurons (${layer.num_filters}). Increase max_neurons if you want to attempt rendering. Current limit: ${max_neurons}.`;
    note.style.color = "#a33";
    holder.appendChild(note);
    return holder;
  }

  function safe_get_size(){
    for(let i=0;i<layer.grouped_images.length;i++){
      const img = layer.grouped_images[i] && layer.grouped_images[i][0];
      if(img && img.width && img.height) return [img.width, img.height];
    }
    return [28,28];
  }

  const [sample_w, sample_h] = safe_get_size();
  const col_count = Math.max(1, Math.min(layer.num_filters, max_neurons));
  const spacing = 8;

  let max_stack = 0;
  for(let f=0; f<layer.grouped_images.length; f++){
    max_stack = Math.max(max_stack, (layer.grouped_images[f] || []).length);
  }
  if(max_stack === 0) max_stack = 1;

  const width  = Math.max(300, 100 + col_count * (sample_w + spacing));
  const height = 30 + max_stack * (sample_h + 6) + 40;

  const canvas = document.createElement("canvas");
  canvas.width = Math.min(width, 4000);
  canvas.height = Math.min(height, 3000);
  canvas.style.width = Math.min(width, 4000) + "px";
  canvas.style.height = Math.min(height, 3000) + "px";
  holder.appendChild(canvas);

  const ctx = canvas.getContext("2d", { willReadFrequently: false });

  ctx.fillStyle = "#fff";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  try {
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#333";
    ctx.fillText("Layer " + layer.layer_idx, 6, 14);
  } catch(_) {}

  ctx.strokeStyle = "#bbb";
  ctx.lineWidth = 1;

  function draw_safe_image(img, dx, dy, w, h){
    if(!img || !img.data || !img.width || !img.height) {
      ctx.fillStyle = "#ccc";
      ctx.fillRect(dx,dy,w,h);
      return;
    }

    const expected_len = img.width * img.height * 4;
    if(img.data.length !== expected_len){
      ctx.fillStyle = "#ccc";
      ctx.fillRect(dx,dy,w,h);
      return;
    }

    try {
      const id = new ImageData(
        img.data instanceof Uint8ClampedArray ? img.data : new Uint8ClampedArray(img.data),
        img.width,
        img.height
      );
      const off = document.createElement("canvas");
      off.width = img.width;
      off.height = img.height;
      const offctx = off.getContext("2d");
      offctx.putImageData(id, 0, 0);
      ctx.drawImage(off, dx, dy, w, h);
    } catch(e){
      ctx.fillStyle = "#ccc";
      ctx.fillRect(dx,dy,w,h);
    }
  }

  for(let f=0; f<col_count; f++){
    const col_x = 10 + f * (sample_w + spacing);

    try {
      ctx.strokeRect(col_x-2, 30-2, sample_w+4, max_stack*(sample_h+6)+4);
    } catch(_) {}

    const imgs = layer.grouped_images[f] || [];

    if(imgs.length === 0){
      ctx.fillStyle = "#eee";
      ctx.fillRect(col_x, 30, sample_w, sample_h);
    } else {
      for(let sidx=0; sidx<imgs.length; sidx++){
        const img = imgs[sidx];
        const dy  = 30 + sidx * (sample_h + 6);
        draw_safe_image(img, col_x, dy, sample_w, sample_h);
      }
    }

    try {
      ctx.fillStyle="#000";
      ctx.fillText("F"+f, col_x, 30 - 6);
    } catch(_) {}
  }

  return holder;
}

function draw_image_on_ctx(ctx, img, dx, dy, w, h){
  try {
    if(!img || !img.data || !img.width || !img.height) throw "Invalid image data";
    if(!(img.data instanceof Uint8ClampedArray) && !(img.data instanceof Uint8Array) && !Array.isArray(img.data)) {
      throw "Image data not array-like";
    }
    if(img.data.length !== img.width*img.height*4) throw "ImageData length mismatch";

    const off = document.createElement("canvas");
    off.width = img.width;
    off.height = img.height;
    const offctx = off.getContext("2d");
    offctx.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
    ctx.drawImage(off, dx, dy, w, h);
  } catch(e){
    wrn("draw_image_on_ctx failed: "+e);
    ctx.fillStyle="#ccc";
    ctx.fillRect(dx,dy,w,h);
  }
}
