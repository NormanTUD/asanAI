"use strict";

function AlexNet() {
	function get_graph_width () {
		return 0.99 * document.getElementById("graphs_here").scrollWidth;
	}

	var rotation_number = 0;

	var h = 600;

	var color1 = "#eeeeee"; // Blöcke
	var color2 = "#99ddff"; // Boden
	var color3 = "#ffbbbb"; // Spitze

	var rectOpacity = 0.4;
	var filterOpacity = 0.4;

	var line_material = new THREE.LineBasicMaterial({ "color":0x000000 });
	var box_material = new THREE.MeshBasicMaterial({"color":color1, "side":THREE.DoubleSide, "transparent":true, "opacity":rectOpacity, "depthWrite":false, "needsUpdate":true});
	var conv_material = new THREE.MeshBasicMaterial({"color":color2, "side":THREE.DoubleSide, "transparent":true, "opacity":filterOpacity, "depthWrite":false, "needsUpdate":true});
	var pyra_material = new THREE.MeshBasicMaterial({"color":color3, "side":THREE.DoubleSide, "transparent":true, "opacity":filterOpacity, "depthWrite":false, "needsUpdate":true});

	var architecture = [];
	var architecture2 = [];
	var betweenLayers = 30;

	var logDepth = true;
	var depthScale = 10;
	var logWidth = true;
	var widthScale = 10;
	var logConvSize = false;
	var convScale = 1;

	var showDims = true;
	var showConvDims = true;

	let depthFn = (depth) => logDepth ? (Math.log(depth) * depthScale) : (depth * depthScale);
	let widthFn = (width) => logWidth ? (Math.log(width) * widthScale) : (width * widthScale);
	let convFn = (conv) => logConvSize ? (Math.log(conv) * convScale) : (conv * convScale);

	function wf(layer) { return widthFn(layer["width"]); }
	function hf(layer) { return widthFn(layer["height"]); }

	var layers = new THREE.Group();
	var convs = new THREE.Group();
	var pyramids = new THREE.Group();
	var sprites = new THREE.Group();


	var scene = new THREE.Scene();
	scene.background = new THREE.Color(0xffffff);

	var factor = 10;
	var camera = new THREE.OrthographicCamera(get_graph_width() / -factor, get_graph_width() / factor, h / factor, h / - factor, -10000000, 10000000);
	camera.position.set(-219, 92, 84);

	var renderer;
	var rendererType = $("#alexnet_renderer > input[type=radio]:checked").val();

	var controls;


	// /////////////////////////////////////////////////////////////////////////////
	//                       ///////    Methods    ///////
	// /////////////////////////////////////////////////////////////////////////////

	function restartRenderer({rendererType_=rendererType}={}) {
		assert(rendererType_ === "webgl" || rendererType_ === "svg", "Ungültiger rendererType: Erwartet wird 'webgl' oder 'svg'.");
		var cookie_theme = get_cookie("theme");
		if(cookie_theme == "darkmode") {
			scene.background = new THREE.Color(0x363636);
		} else {
			scene.background = new THREE.Color(0xffffff);
		}

		rendererType = rendererType_;
		rendererType = $("#alexnet_renderer > input[type=radio]:checked").val();

		clearThree(scene);

		if (rendererType === "webgl") {
			renderer = new THREE.WebGLRenderer({ "alpha": true, "antialias": true });
			renderer.setClearColor( 0xffffff, 0 );
		} else if (rendererType === "svg") {
			renderer = new THREE.SVGRenderer();
		}

		renderer.setPixelRatio(window.devicePixelRatio || 1);
		renderer.setSize(get_graph_width(), h);

		var graph_container = document.getElementById("alexnet");
		while (graph_container.firstChild) {
			graph_container.removeChild(graph_container.firstChild);
		}

		var container = document.getElementById("graphs_here");
		renderer.setSize(Math.min(100, $(container).width()), Math.max($(container).height(), 500));

		graph_container.appendChild(renderer.domElement);

		if (controls) {
			controls.dispose();
		}

		controls = new THREE.OrbitControls(camera, renderer.domElement);

		animate();
	}

	async function animate() {
		while(has_zero_output_shape) {
			await delay(200);
		}

		try {
			while (is_hidden_or_has_hidden_parent($("#alexnet_tab"))) {
				await delay(200);
			}
			requestAnimationFrame(animate);
			var cookie_theme = get_cookie("theme");
			if(cookie_theme == "darkmode") {
				scene.background = new THREE.Color(0x363636);
			} else {
				scene.background = new THREE.Color(0xffffff);
			}
			renderer.render(scene, camera);
		} catch (e) {
			// log(e);
		}
	}

	restartRenderer();

	function redraw(
		{
			architecture_=architecture,
			architecture2_=architecture2,
			betweenLayers_=betweenLayers,
			logDepth_=logDepth,
			depthScale_=depthScale,
			logWidth_=logWidth,
			widthScale_=widthScale,
			logConvSize_=logConvSize,
			convScale_=convScale,
			showDims_=showDims,
			showConvDims_=showConvDims
		}={}
	) {
		assert(Array.isArray(architecture_), "Ungültige architecture_: Erwartet wird ein Array von Schichten.");
		assert(Array.isArray(architecture2_), "Ungültige architecture2_: Erwartet wird ein Array von Schichten.");

		var cookie_theme = get_cookie("theme");
		if(cookie_theme == "darkmode") {
			scene.background = new THREE.Color(0x363636);
		} else {
			scene.background = new THREE.Color(0xffffff);
		}

		rendererType = $("#alexnet_renderer > input[type=radio]:checked").val();

		architecture = architecture_;
		architecture2 = architecture2_;
		betweenLayers = betweenLayers_;
		logDepth = logDepth_;
		depthScale = depthScale_;
		logWidth = logWidth_;
		widthScale = widthScale_;
		logConvSize = logConvSize_;
		convScale = convScale_;
		showDims = showDims_;
		showConvDims = showConvDims_;

		clearThree(scene);

		var z_offset = -(sum(architecture.map(layer => depthFn(layer["depth"]))) + (betweenLayers * (architecture.length - 1))) / 3;
		var layer_offsets = pairWise(architecture).reduce((offsets, layers) => offsets.concat([offsets.last() + depthFn(layers[0]["depth"])/2 + betweenLayers + depthFn(layers[1]["depth"])/2]), [z_offset]);
		layer_offsets = layer_offsets.concat(architecture2.reduce((offsets, layer) => offsets.concat([offsets.last() + widthFn(2) + betweenLayers]), [layer_offsets.last() + depthFn(architecture.last()["depth"])/2 + betweenLayers + widthFn(2)]));

		architecture.forEach(function(layer, index) {
			// Layer
			assert(typeof layer === "object", "Ungültige Schicht (layer): Erwartet wird ein Objekt.");
			var layer_geometry = new THREE.BoxGeometry(wf(layer), hf(layer), depthFn(layer["depth"]));
			var layer_object = new THREE.Mesh(layer_geometry, box_material);
			layer_object.position.set(0, 0, layer_offsets[index]);
			layers.add(layer_object);

			var layer_edges_geometry = new THREE.EdgesGeometry(layer_geometry);
			var layer_edges_object = new THREE.LineSegments(layer_edges_geometry, line_material);
			layer_edges_object.position.set(0, 0, layer_offsets[index]);
			layers.add(layer_edges_object);

			if (index < architecture.length - 1) {
				// Conv
				var conv_geometry = new THREE.BoxGeometry(convFn(layer["filterWidth"]), convFn(layer["filterHeight"]), depthFn(layer["depth"]));
				var conv_object = new THREE.Mesh(conv_geometry, conv_material);
				conv_object.position.set(layer["rel_x"] * wf(layer), layer["rel_y"] * hf(layer), layer_offsets[index]);
				convs.add(conv_object);

				var conv_edges_geometry = new THREE.EdgesGeometry(conv_geometry);
				var conv_edges_object = new THREE.LineSegments(conv_edges_geometry, line_material);
				conv_edges_object.position.set(layer["rel_x"] * wf(layer), layer["rel_y"] * hf(layer), layer_offsets[index]);
				convs.add(conv_edges_object);

				// Pyramid
				var pyramid_geometry = new THREE.Geometry();

				var base_z = layer_offsets[index] + (depthFn(layer["depth"]) / 2);
				var summit_z = layer_offsets[index] + (depthFn(layer["depth"]) / 2) + betweenLayers;
				var next_layer_wh = widthFn(architecture[index+1]["width"]);

				pyramid_geometry.vertices = [
					new THREE.Vector3((layer["rel_x"] * wf(layer)) + (convFn(layer["filterWidth"])/2), (layer["rel_y"] * hf(layer)) + (convFn(layer["filterHeight"])/2), base_z),  // base
					new THREE.Vector3((layer["rel_x"] * wf(layer)) + (convFn(layer["filterWidth"])/2), (layer["rel_y"] * hf(layer)) - (convFn(layer["filterHeight"])/2), base_z),  // base
					new THREE.Vector3((layer["rel_x"] * wf(layer)) - (convFn(layer["filterWidth"])/2), (layer["rel_y"] * hf(layer)) - (convFn(layer["filterHeight"])/2), base_z),  // base
					new THREE.Vector3((layer["rel_x"] * wf(layer)) - (convFn(layer["filterWidth"])/2), (layer["rel_y"] * hf(layer)) + (convFn(layer["filterHeight"])/2), base_z),  // base
					new THREE.Vector3((layer["rel_x"] * next_layer_wh),                                (layer["rel_y"] * next_layer_wh),                                 summit_z) // summit
				];

				pyramid_geometry.faces = [new THREE.Face3(0, 1, 2),new THREE.Face3(0, 2, 3),new THREE.Face3(1, 0, 4),new THREE.Face3(2, 1, 4),new THREE.Face3(3, 2, 4),new THREE.Face3(0, 3, 4)];

				var pyramid_object = new THREE.Mesh(pyramid_geometry, pyra_material);
				pyramids.add(pyramid_object);

				var pyramid_edges_geometry = new THREE.EdgesGeometry(pyramid_geometry);
				var pyramid_edges_object = new THREE.LineSegments(pyramid_edges_geometry, line_material);
				pyramids.add(pyramid_edges_object);
			}

			if (showDims && rendererType === "webgl") {
				// Dims
				sprite = makeTextSprite(layer["depth"].toString());
				sprite.position.copy(layer_object.position).sub(new THREE.Vector3(wf(layer)/2 + 2, hf(layer)/2 + 2, 0));
				sprites.add(sprite);

				sprite = makeTextSprite(layer["width"].toString());
				sprite.position.copy(layer_object.position).sub(new THREE.Vector3(wf(layer)/2 + 3, 0, depthFn(layer["depth"])/2 + 3));
				sprites.add(sprite);

				sprite = makeTextSprite(layer["height"].toString());
				sprite.position.copy(layer_object.position).sub(new THREE.Vector3(0, -hf(layer)/2 - 3, depthFn(layer["depth"])/2 + 3));
				sprites.add(sprite);
			}

			if (showConvDims && index < architecture.length - 1 && rendererType === "webgl") {
				// Conv Dims
				var sprite = makeTextSprite(layer["filterHeight"].toString());
				sprite.position.copy(conv_object.position).sub(new THREE.Vector3(convFn(layer["filterWidth"])/2, -3, depthFn(layer["depth"])/2));
				sprites.add(sprite);

				sprite = makeTextSprite(layer["filterWidth"].toString());
				sprite.position.copy(conv_object.position).sub(new THREE.Vector3(-1, convFn(layer["filterHeight"])/2, depthFn(layer["depth"])/2));
				sprites.add(sprite);
			}
		});

		architecture2.forEach(function(layer, index) {
			// Dense
			assert(typeof layer === "number" && !isNaN(layer), "Ungültige Schicht (layer): Erwartet wird eine numerische Tiefe.");
			var layer_geometry = new THREE.BoxGeometry(widthFn(2), depthFn(layer), widthFn(2));
			var layer_object = new THREE.Mesh(layer_geometry, box_material);
			layer_object.position.set(0, 0, layer_offsets[architecture.length + index]);
			layers.add(layer_object);

			var layer_edges_geometry = new THREE.EdgesGeometry(layer_geometry);
			var layer_edges_object = new THREE.LineSegments(layer_edges_geometry, line_material);
			layer_edges_object.position.set(0, 0, layer_offsets[architecture.length + index]);
			layers.add(layer_edges_object);

			var direction = new THREE.Vector3(0, 0, 1);
			origin = new THREE.Vector3(0, 0, layer_offsets[architecture.length + index] - betweenLayers - widthFn(2)/2 + 1);
			length = betweenLayers - 2;
			var headLength = betweenLayers/3;
			var headWidth = 5;
			var arrow = new THREE.ArrowHelper(direction, origin, length, 0x000000, headLength, headWidth);
			pyramids.add(arrow);

			if (showDims && rendererType === "webgl") {
				// Dims
				var sprite = makeTextSprite(layer.toString());
				sprite.position.copy(layer_object.position).sub(new THREE.Vector3(3, depthFn(layer)/2 + 3, 3));
				sprites.add(sprite);
			}
		});

		scene.add(layers); // Causes weird problem
		scene.add(convs); // Causes weird problem
		scene.add(pyramids); // Causes weird problem
		scene.add(sprites);
	}

	function clearThree(obj) {
		while(obj.children.length > 0) {
			clearThree(obj.children[0]);
			obj.remove(obj.children[0]);
		}

		if (obj.geometry) {
			obj.geometry.dispose(); 
		}

		if (obj.material) {
			obj.material.dispose();
		}

		if (obj.texture) {
			obj.texture.dispose();
		}
	}


	function makeTextSprite(message, opts) {
		var parameters = opts || {};
		var fontface = parameters.fontface || "Helvetica";
		var fontsize = parameters.fontsize || 120;
		var canvas = document.createElement("canvas");
		var context = canvas.getContext("2d");
		context.font = fontsize + "px " + fontface;

		// get size data (height depends only on font size)
		var metrics = context.measureText(message);
		var textWidth = metrics.width;

		// text color
		context.fillStyle = "rgba(0, 0, 0, 1.0)";
		context.fillText(message, 0, fontsize);

		// canvas contents will be used for a texture
		var texture = new THREE.Texture(canvas);
		texture.minFilter = THREE.LinearFilter;
		texture.needsUpdate = true;

		var spriteMaterial = new THREE.SpriteMaterial({ map: texture });
		var sprite = new THREE.Sprite(spriteMaterial);
		sprite.scale.set(10, 5, 1.0);
		sprite.center.set(0, 1);
		return sprite;
	}

	function style(
		{
			color1_=color1,
			color2_=color2,
			color3_=color3,
			rectOpacity_=rectOpacity,
			filterOpacity_=filterOpacity
		}={}
	) {
		color1        = color1_;
		color2        = color2_;
		color3        = color3_;
		rectOpacity   = rectOpacity_;
		filterOpacity = filterOpacity_;

		// Beispiel-Assertion: Überprüfung, ob color1_, color2_, und color3_ gültige Farbwerte sind.
		assert(/^#[0-9A-F]{6}$/i.test(color1_), "Ungültige color1_: Erwartet wird eine hexadezimale Farbe.");
		assert(/^#[0-9A-F]{6}$/i.test(color2_), "Ungültige color2_: Erwartet wird eine hexadezimale Farbe.");
		assert(/^#[0-9A-F]{6}$/i.test(color3_), "Ungültige color3_: Erwartet wird eine hexadezimale Farbe.");

		// Beispiel-Assertion: Überprüfung, ob rectOpacity_ und filterOpacity_ numerische Werte zwischen 0 und 1 sind.
		assert(!isNaN(rectOpacity_) && rectOpacity_ >= 0 && rectOpacity_ <= 1, "Ungültige rectOpacity_: Erwartet wird ein Wert zwischen 0 und 1.");
		assert(!isNaN(filterOpacity_) && filterOpacity_ >= 0 && filterOpacity_ <= 1, "Ungültige filterOpacity_: Erwartet wird ein Wert zwischen 0 und 1.");

		box_material.color = new THREE.Color(color1);
		conv_material.color = new THREE.Color(color2);
		pyra_material.color = new THREE.Color(color3);

		box_material.opacity = rectOpacity;

		conv_material.opacity = filterOpacity;
		pyra_material.opacity = filterOpacity;
	}

	function rotate() {
		// TODO!!!
		requestAnimationFrame(rotate);
		camera.rotation.x = -0.5854 * rotation_number + 0.4197;
		camera.rotation.y = 0.5409 * rotation_number - 1.1625;
		camera.rotation.z = 1.1352 * rotation_number - 2.2595;
		rotation_number += 0.01;
		renderer.render(scene, camera);
	}


	///////////////////////////////////////////////////////////////////////////////
	//                  ///////    Window Resize    ///////
	///////////////////////////////////////////////////////////////////////////////

	function onWindowResize() {
		var graph_width = get_graph_width();
		renderer.setSize(graph_width, h);

		var camFactor = window.devicePixelRatio || 1;
		camera.left = -graph_width / camFactor;
		camera.right = graph_width / camFactor;
		camera.top = h / camFactor;
		camera.bottom = -h / camFactor;
		camera.updateProjectionMatrix();
	}

	window.addEventListener("resize", onWindowResize, false);

	/////////////////////////////////////////////////////////////////////////////
	///////    Return    ///////
	/////////////////////////////////////////////////////////////////////////////

	return {
		"redraw"           : redraw,
		"restartRenderer"  : restartRenderer,
		"style"            : style,
		"rotate"           : rotate,
		"camera": camera
	};
}
