var restart_fcnn_timeout = null;
var is_setting_config = false;
var model = null; 

function get_layer_classname_by_nr(idx) {
	if(!model || !model.layers[idx]) return "Unknown";
	return model.layers[idx].getClassName();
}
function get_units_at_layer(idx) {
	if(!model || !model.layers[idx]) return 0;
	return model.layers[idx].units || model.layers[idx].filters || 0; 
}

async function restart_fcnn() {
	const el = $("#fcnn_canvas");
	if(el.length) { 
		if(restart_fcnn_timeout) clearTimeout(restart_fcnn_timeout);
		restart_fcnn_timeout = setTimeout(() => {
			restart_fcnn_internal(); 
			restart_fcnn_timeout = null;
		}, 100);
	}
}

async function restart_fcnn_internal () {
	if(!$("#fcnn_canvas").is(":visible")) return;

	var fcnn_data = get_fcnn_data(); 
	if(!fcnn_data) { return; }

	var [names, units, meta_infos] = fcnn_data;
	await draw_fcnn(units, names, meta_infos);
	return true;
}

function get_fcnn_data () {
	var names = [];
	var units = [];
	var meta_infos = [];

	if(!model || !model.layers) return;
	var nr_layers = model.layers.length;
	if(!nr_layers) return;

	var start_layer = 0;

	for (var layer_idx = 0; layer_idx < nr_layers; layer_idx++) {
		var class_name = get_layer_classname_by_nr(layer_idx);

		if(!["Dense", "Flatten", "LayerNormalization"].includes(class_name) && !(typeof class_name === "string" && class_name.toLowerCase().includes("conv2d"))) {
			continue;
		}

		var _unit = get_units_at_layer(layer_idx);

		if(layer_idx === 0 && model.layers[0].input.shape) {
			let inShape = model.layers[0].input.shape;
			let inputs = inShape[inShape.length - 1];
			if(inputs && inputs < 100) { 
				names.push("Input");
				units.push(inputs);
				meta_infos.push({ layer_type: "Input", nr: -1, input_shape: inShape, output_shape: inShape });
			}
		}

		if(layer_idx == nr_layers - 1) names.push("Output Layer");
		else names.push(`${class_name} ${layer_idx}`);

		units.push(_unit);

		var kernel_size_x = 3, kernel_size_y = 3;
		meta_infos.push({
			layer_type: class_name,
			nr: start_layer + layer_idx,
			input_shape: "",
			output_shape: "",
			kernel_size_x: kernel_size_x,
			kernel_size_y: kernel_size_y
		});
	}

	return [names, units, meta_infos];
}

function _draw_custom_simple(ctx, layers, meta_infos, w, h, radius, spacing) {
	const layerCount = layers.length;
	const xStep = w / (layerCount);
	const nodePositions = [];

	for(let i=0; i<layerCount; i++) {
		const neuronCount = layers[i];
		const x = (i * xStep) + (xStep/2);
		const layerNodes = [];

		const maxVis = 32;
		const drawCount = Math.min(neuronCount, maxVis);
		const totalH = (drawCount-1) * spacing;
		const startY = (h/2) - (totalH/2);

		ctx.fillStyle = "#1e293b";
		ctx.font = "bold 12px Arial";
		ctx.textAlign = "center";
		let lType = meta_infos[i] ? meta_infos[i].layer_type : "Layer";
		if(lType === "Input") ctx.fillText("Input", x, 20);
		else if(i === layerCount-1) ctx.fillText("Output", x, 20);
		else ctx.fillText(lType, x, 20);

		ctx.font = "10px Arial";
		ctx.fillStyle = "#64748b";
		ctx.fillText(neuronCount + " units", x, h - 10);

		for(let j=0; j<drawCount; j++) {
			const y = startY + (j * spacing);
			layerNodes.push({x, y});

			ctx.beginPath();
			ctx.arc(x, y, radius, 0, 2*Math.PI);
			ctx.fillStyle = (i===0) ? "#10b981" : (i===layerCount-1) ? "#8b5cf6" : "#3b82f6";
			ctx.fill();
			ctx.strokeStyle = "#000000"; // Schwarze Umrandung der Knoten
			ctx.lineWidth = 1;
			ctx.stroke();
		}
		nodePositions.push(layerNodes);
	}

	ctx.globalCompositeOperation = 'destination-over';
	for(let i=0; i<nodePositions.length-1; i++) {
		const curr = nodePositions[i];
		const next = nodePositions[i+1];

		ctx.strokeStyle = "#000000"; // Schwarze Linien

		if(curr.length * next.length > 1000) ctx.globalAlpha = 0.1;
		else ctx.globalAlpha = 0.4;

		ctx.lineWidth = 0.8;

		for(let c of curr) {
			for(let n of next) {
				ctx.beginPath();
				ctx.moveTo(c.x, c.y);
				ctx.lineTo(n.x, n.y);
				ctx.stroke();
			}
		}
	}
	ctx.globalAlpha = 1.0;
}

async function draw_fcnn(...args) {
	if(is_setting_config) return;

	var layers = args[0];
	var _labels = args[1];
	var meta_infos = args[2];

	var canvas = document.getElementById("fcnn_canvas");
	if (!canvas) return;

	var ctx = canvas.getContext("2d", { willReadFrequently: true });
	var container = $("#fcnn_wrapper");
	var ghw = container.width() || 800;

	var canvasWidth = Math.max(600, ghw);
	var canvasHeight = 400; 

	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	var maxNeurons = Math.max(...layers);
	var maxRadius = Math.min(15, (canvasHeight * 0.8) / maxNeurons / 2, (canvasWidth * 0.8) / (layers.length) / 2);
	var layerSpacing = canvasWidth / (layers.length + 0.5); 
	var startX = layerSpacing / 2;
	var maxSpacing = Math.min(maxRadius * 2.5, (canvasHeight * 0.9) / maxNeurons);

	_draw_custom_simple(ctx, layers, meta_infos, canvasWidth, canvasHeight, maxRadius, maxSpacing);
}
