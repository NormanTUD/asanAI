// drop-in file: abstracted, debug-ready
// global neuron_outputs assumed

function plot_training_data_to_neurons(div_name="#python_tab", max_method="sum"){
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
  const prepared = prepare_canvases_data(layers_sorted, image_samples, max_method);

  render_prepared(prepared, target);
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
      return {
        layer_idx: idx,
        raw_input: input,
        raw_output: output,
        num_filters: estimate_num_filters_from_tensor(output),
        activation_per_filter: compute_activation_for_tensor(output, method)
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
  let images = [];
  for(const sample of neuron_outputs[0].input){
    try{
      const shape = get_shape_from_array(sample);
      const imgs = extract_images_from_sample_node(sample);
      images.push(...imgs);
    }catch(e){ wrn("Failed to extract image sample: "+e); }
  }
  return images;
}

function get_shape_from_array(node){
  if(!Array.isArray(node)) return [];
  let sh=[], cur=node;
  while(Array.isArray(cur)){ sh.push(cur.length); cur=cur[0]; }
  return sh;
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
        let val = Number(cell[c]) || 0;
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
      if(!Array.isArray(cell)) cell=[cell[0]];
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
      node.forEach((v,f)=>{ per_filter[f].push(Math.abs(v)); per_sample[b][f]+=Math.abs(v); });
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

function prepare_canvases_data(layers_sorted, image_samples){
  dbg(`[prepare_canvases_data] Preparing ${layers_sorted.length} layers`);
  layers_sorted.sort((a,b)=>a.layer_idx - b.layer_idx);

  const prepared = [];

  layers_sorted.forEach(layer=>{
    const num_filters = layer.num_filters || 1;
    const grouped = Array.from({length:num_filters}, ()=>[...image_samples]); // einfach alle Bilder pro Filter

    dbg(`[prepare_canvases_data] Layer ${layer.layer_idx} -> ${num_filters} filters, ${image_samples.length} images each`);

    prepared.push({
      layer_idx: layer.layer_idx,
      num_filters,
      grouped_images: grouped
    });
  });

  return prepared;
}

// --------------------- Rendering ---------------------
function render_prepared(prepared, target){
  // Ziel-Div komplett leeren
  target.innerHTML = "";
  dbg("render_prepared: target cleared");

  const container = ensure_container(target);
  prepared.forEach(layer_p=>{
    try{
      container.appendChild(create_layer_box(layer_p));
    }
    catch(e){ wrn("Rendering layer "+layer_p.layer_idx+" failed: "+e); }
  });
  dbg("render_prepared: finished appending "+prepared.length+" layers");
}

function ensure_container(target){
  // Ein einfacher flex-column wrapper
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

function create_layer_box(layer){
  const holder=document.createElement("div"); holder.style.border="1px solid #ddd"; holder.style.padding="6px";
  const title=document.createElement("div"); title.textContent=`Layer ${layer.layer_idx} — filters: ${layer.num_filters}`; title.style.fontWeight="600"; title.style.marginBottom="6px"; holder.appendChild(title);

  const canvas=document.createElement("canvas"); holder.appendChild(canvas);
  const ctx=canvas.getContext("2d");
  const sample_w=layer.grouped_images[0]&&layer.grouped_images[0][0]?layer.grouped_images[0][0].width:28;
  const sample_h=layer.grouped_images[0]&&layer.grouped_images[0][0]?layer.grouped_images[0][0].height:28;
  const col_count=layer.num_filters;
  const spacing=8;
  canvas.width=Math.max(300, 100 + col_count*(sample_w+spacing));
  canvas.height=30 + (sample_h+10) + 40;
  ctx.fillStyle="#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.font="12px sans-serif"; ctx.fillStyle="#333"; ctx.fillText("Layer "+layer.layer_idx,6,14);
  ctx.strokeStyle="#bbb"; ctx.lineWidth=1;

  layer.grouped_images.forEach((imgs,f)=>{
    const dx = 10 + f*(sample_w+spacing), dy = 30;
    ctx.strokeRect(dx-2, dy-2, sample_w+4, sample_h+4);

    if(imgs.length>0){
      draw_image_on_ctx(ctx, imgs[0], dx, dy, sample_w, sample_h);
    } else {
      ctx.fillStyle="#eee";
      ctx.fillRect(dx,dy,sample_w,sample_h);
    }

    // Score-Text: nur schreiben, wenn Canvas noch ok
    try{
      ctx.fillStyle="#000";
      ctx.fillText("F"+f, dx, dy-4);
    }catch(e){
      wrn("fillText failed for filter "+f+": "+e);
    }
  });

  return holder;
}

function draw_image_on_ctx(ctx, img, dx, dy, w, h){
  try {
    if(!img || !img.data || !img.width || !img.height) throw "Invalid image data";
    if(img.data.length !== img.width*img.height*4) throw "ImageData length mismatch";

    const off = document.createElement("canvas");
    off.width = img.width;
    off.height = img.height;
    const offctx = off.getContext("2d");
    offctx.putImageData(new ImageData(img.data,img.width,img.height),0,0);
    ctx.drawImage(off, dx, dy, w, h);
  } catch(e){
    wrn("draw_image_on_ctx failed: "+e);
    ctx.fillStyle="#ccc";
    ctx.fillRect(dx,dy,w,h);
  }
}
