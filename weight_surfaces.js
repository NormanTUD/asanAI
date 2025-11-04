let visualize_model_weights = async function(container_or_id, options={}, force = false) {
	const opts = Object.assign({
		max_slices: 3,
		plot3d: true,
		plot2d: true,
		use_mesh3d: false,
		container_width_pct: 0.9
	}, options);

	if(container_or_id) {
		if(!$("#" + container_or_id).is(":visible") && !force) {
			return;
		}
	}

	function dbg(msg){console.log("[TFJS DBG]",msg);}

	function make_id(prefix){return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random()*1e6).toString(36)}`;}

	function ensure_container(target){
		let parent;
		if(!target){
			parent = document.createElement('div'); parent.id=make_id('tfjs_weights_parent'); document.body.appendChild(parent); return parent;
		}
		if(typeof target==='string'){
			parent=document.getElementById(target);
			if(!parent){parent=document.createElement('div'); parent.id=target; document.body.appendChild(parent);}
		}else if(target instanceof Element) parent=target;
		else {parent=document.createElement('div'); parent.id=make_id('tfjs_weights_parent'); document.body.appendChild(parent);}
		return parent;
	}

	function show_message_in_container(container,msg){
		const el=document.createElement('div'); el.textContent=msg; el.style.margin='6px'; el.style.fontWeight='600'; container.appendChild(el);
	}

	function safe_get_layer_weights(layer){
		try{
			if(!layer) return [];
			const w=layer.weights||layer.trainableWeights||layer.getWeights?.()||[];
			if(!Array.isArray(w)) return [];
			return w.map(item=>{
				if(!item) return null;
				if(item.val!==undefined) return item.val;
				if(item.tensor!==undefined) return item.tensor;
				return item;
			});
		}catch(e){console.error(e); return [];}
	}

	function shape_from(obj){try{return get_shape_from_array_or_tensor(obj);}catch(e){console.error('shape_from failed',e); return null;}}

	function array_from_tensor_or_array(obj){
		try{
			if(!obj) return null;
			if(typeof array_sync==='function'){try{return array_sync(obj);}catch(e){}}
			if(obj.arraySync) return obj.arraySync();
			if(obj.dataSync){
				const data=Array.from(obj.dataSync());
				const s=shape_from(obj)||[data.length];
				return reshape_flat_array(data,s);
			}
			return obj;
		}catch(e){console.error(e); return null;}
	}

	function reshape_flat_array(data,shape){
		if(!shape||shape.length===0) return data[0];
		const out=[]; const stride=shape.slice(1).reduce((a,b)=>a*b,1);
		for(let i=0;i<shape[0];i++){
			const start=i*stride; const slice=data.slice(start,start+stride);
			if(shape.length===1) out.push(...slice);
			else out.push(reshape_flat_array(slice,shape.slice(1)));
		}
		return out;
	}

	function to_float_matrix(arr2d){
		if(!Array.isArray(arr2d)) return null;
		const m=arr2d.length;
		const n=arr2d[0]?arr2d[0].length:0;
		const z=[];
		for(let i=0;i<m;i++){
			const row=arr2d[i];
			const r=new Array(n); for(let j=0;j<n;j++) r[j]=parseFloat(row[j])||0; z.push(r);
		}
		return z;
	}

	function create_plot_div(parent,title_text){
		const wrapper=document.createElement('div'); wrapper.style.width=$("#right_side").width()*opts.container_width_pct+'px'; wrapper.style.marginBottom='16px';
		const title=document.createElement('div'); title.textContent=title_text; title.style.fontWeight='600'; title.style.marginBottom='4px'; wrapper.appendChild(title);
		const plotDiv=document.createElement('div'); plotDiv.style.width='100%'; plotDiv.style.height='400px'; wrapper.appendChild(plotDiv);
		parent.appendChild(wrapper); return plotDiv;
	}

	function plot_1d(dom,y,title){
		if(!dom) return;
		Plotly.react(dom,[{y,type:'scatter',mode:'lines+markers',marker:{color:'rgb(50,150,250)'}}],{
			title:{text:title,font:{size:14}},margin:{t:40,b:40,l:40,r:40},autosize:true,
			paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)'
		}, {responsive:true});
	}

	function plot_2d_heatmap(dom,z,title){
		if(!dom) return;
		Plotly.react(dom,[{z,type:'heatmap',hoverongaps:false,colorscale:'Viridis'}],{
			title:{text:title,font:{size:14}},margin:{t:40,b:40,l:40,r:40},autosize:true,
			paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)'
		}, {responsive:true});
	}

	function plot_3d_surface(dom,z,title,use_mesh=false){
		if(!dom) return;
		Plotly.react(dom,[{z,type:use_mesh?'mesh3d':'surface',hoverinfo:'all'}],{
			title:{text:title,font:{size:14}},margin:{t:40,b:40,l:40,r:40},autosize:true,scene:{aspectmode:'auto'},
			paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)'
		}, {responsive:true});
	}

	async function render_weight_array(parent,arr,title,shape,layerType){
		if(!arr || !shape) return;
		dbg(`Rendering: ${title} shape=${JSON.stringify(shape)}`);

		if(shape.length>=5){show_message_in_container(parent,'Too high dimension (rank >=5)'); return;}
		if(shape.length===0){plot_1d(create_plot_div(parent,title),[arr],title);}
		else if(shape.length===1){plot_1d(create_plot_div(parent,title),arr,title);}
		else if(shape.length===2){
			const plotDiv2d=create_plot_div(parent,title+" 2D heatmap"); plot_2d_heatmap(plotDiv2d,to_float_matrix(arr),title+" 2D heatmap");
			if(opts.plot3d){const plotDiv3d=create_plot_div(parent,title+" 3D surface"); plot_3d_surface(plotDiv3d,to_float_matrix(arr),title+" 3D surface",opts.use_mesh3d);}
		}
		else if(shape.length===3){
			const slices=Math.min(shape[2],opts.max_slices); // channels
			for(let i=0;i<slices;i++){
				await new Promise(r=>setTimeout(r,0));
				const slice=arr.map(r=>r.map(c=>c[i])); // pick channel i
				const plotDiv=create_plot_div(parent,`Filter ${i} (${shape[0]}x${shape[1]}x${shape[2]})`);
				plot_3d_surface(plotDiv,to_float_matrix(slice),`Filter ${i} 3D`);
			}
		}
		else if(shape.length===4){
			const slices=Math.min(shape[3],opts.max_slices); // output channels
			for(let i=0;i<slices;i++){
				await new Promise(r=>setTimeout(r,0));
				const slice=arr.map(f=>f.map(r=>r.map(c=>c[i]))); // HxWxIn
				const plotDiv=create_plot_div(parent,`Filter ${i} (${shape[0]}x${shape[1]}x${shape[2]})`);
				plot_3d_surface(plotDiv,to_float_matrix(slice),`Filter ${i} 3D`);
			}
		}
	}

	function clear_container(parent){while(parent.firstChild) parent.removeChild(parent.firstChild);}

	const parent=ensure_container(container_or_id);

	const containerDiv=document.createElement('div'); containerDiv.id=make_id('tfjs_weights_container');
	parent.appendChild(containerDiv); clear_container(containerDiv);

	const sliceControl=document.createElement('input');
	sliceControl.type='number'; sliceControl.min='1'; sliceControl.max='16'; sliceControl.value=opts.max_slices; sliceControl.style.margin='6px'; sliceControl.style.width='50px';
	sliceControl.addEventListener('change',e=>{opts.max_slices=parseInt(sliceControl.value); visualize_model_weights(container_or_id,opts);});
	const lbl=document.createElement('label'); lbl.textContent=' Max slices: '; lbl.appendChild(sliceControl);
	containerDiv.appendChild(lbl);

	if(typeof tf!=='undefined' && tf.engine && typeof tf.engine().startScope==='function'){try{tf.engine().startScope();}catch(e){}}

	try{
		if(!window.model){show_message_in_container(containerDiv,'No model found'); return;}
		const layers=model?.layers||[];
		if(!layers || layers.length===0){show_message_in_container(containerDiv,'Model has no layers'); return;}

		for(let li=0;li<layers.length;li++){
			const layer=layers[li];
			const layer_name=layer?.name||`layer_${li}`;
			const h=document.createElement('h1'); h.textContent=`Layer ${li}: ${layer_name}`; containerDiv.appendChild(h);

			const weights=safe_get_layer_weights(layer);
			if(!weights || weights.length===0){show_message_in_container(containerDiv,'No weights for this layer'); continue;}

			for(let wi=0;wi<weights.length;wi++){
				const w=weights[wi]; if(!w){show_message_in_container(containerDiv,'Cannot display'); continue;}
				const arr=array_from_tensor_or_array(w);
				const shape=shape_from(w)||[];
				let title=(wi===0?'weights':'bias'); // conv/dense convention
				await render_weight_array(containerDiv,arr,title,shape,layer?.className||'');
			}
		}
	}catch(e){console.error(e);}
	finally{try{tf.engine().endScope();}catch(e){}}
};

function create_weight_surfaces(force = false) {
	visualize_model_weights('weight_surfaces', {}, force);
}
