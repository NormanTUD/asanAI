"use strict";

function LeNet() {
	function get_graph_width () {
		return document.getElementById("lenet_tab").offsetWidth;
	}
	var graph_width = get_graph_width();

	var h = 600;

	var svg = d3.select("#lenet").append("svg").attr("xmlns", "http://www.w3.org/2000/svg");
	var g = svg.append("g");
	svg.style("cursor", "move");

	var color1 = "#e0e0e0";
	var color2 = "#a0a0a0";
	var borderWidth = 1.0;
	var borderColor = "black";
	var rectOpacity = 0.8;
	var betweenSquares = 8;
	var betweenLayers = [];
	var betweenLayersDefault = 60;

	var architecture = [];
	var lenet = {};
	var layer_offsets = [];
	var largest_layer_width = 0;
	var showLabels = true;

	let textFn = (layer) => (typeof(layer) === "object" ? layer["numberOfSquares"] + "@" + layer["squareHeight"] + "x" + layer["squareWidth"] : "1x" + layer);

	var rect, conv, link, poly, line, text, info;

	function redraw(
		{
			architecture_=architecture,
			architecture2_=architecture2
		}={}
	) {
		architecture = architecture_;

		lenet.rects = architecture.map((layer, layer_index) => range(layer["numberOfSquares"]).map(rect_index => {
			return {
				"id":		"lenet_" + layer_index + "_" + rect_index,
				"layer":	layer_index,
				"rect_index":	rect_index,
				"width":	layer["squareWidth"],
				"height":	layer["squareHeight"]
			};
		}));

		lenet.rects = flatten(lenet.rects);

		lenet.convs = architecture.map((layer, layer_index) => Object.assign({"id": "conv_" + layer_index, "layer": layer_index}, layer)); lenet.convs.pop();
		seed = 1;
		lenet.convs = lenet.convs.map(conv => Object.assign({"x_rel": random(0.1, 0.9),"y_rel": random(0.1, 0.9)}, conv));

		lenet.conv_links = lenet.convs.map(conv => {
			return [Object.assign({
				"id":	"link_" + conv["layer"] + "_0",
				"i":	0
			}, conv), 
			Object.assign({
				"id":	"link_" + conv["layer"] + "_1",
				"i":	1
			}, conv)];
		});

		lenet.conv_links = flatten(lenet.conv_links);

		lenet.fc_layers = architecture2.map((size, fc_layer_index) => {
			return {
				"id":		"fc_" + fc_layer_index, 
				"layer":	fc_layer_index + architecture.length,
				"size":		size / Math.sqrt(2)
			};
		});

		lenet.fc_links = lenet.fc_layers.map(fc => {
			return [Object.assign({
				"id":		"link_" + fc["layer"] + "_0",
				"i":		0,
				"prevSize":	10
			}, fc), Object.assign({
				"id":		"link_" + fc["layer"] + "_1",
				"i":		1,
				"prevSize":	10
			}, fc)];
		});
		lenet.fc_links = flatten(lenet.fc_links);
		lenet.fc_links[0]["prevSize"] = 0;                            // hacks
		lenet.fc_links[1]["prevSize"] = lenet.rects.last()["width"];  // hacks

		var label = architecture.map((layer, layer_index) => {
			return {
				"id": "data_" + layer_index + "_label",
				"layer": layer_index,
				"text": textFn(layer)
			};
		}).concat(architecture2.map(
			(layer, layer_index) => {
				return {
					"id": "data_" + layer_index + architecture.length + "_label",
					"layer": layer_index + architecture.length,
					"text": textFn(layer)
				};
			})
		);

		g.selectAll("*").remove();

		rect = g.selectAll(".rect")
			.data(lenet.rects)
			.enter()
			.append("rect")
			.attr("class", "rect")
			.attr("id", d => d.id)
			.attr("width", d => d.width)
			.attr("height", d => d.height);

		conv = g.selectAll(".conv")
			.data(lenet.convs)
			.enter()
			.append("rect")
			.attr("class", "conv")
			.attr("id", d => d.id)
			.attr("width", d => d.filterWidth)
			.attr("height", d => d.filterHeight)
			.style("fill-opacity", 0);

		link = g.selectAll(".link")
			.data(lenet.conv_links)
			.enter()
			.append("line")
			.attr("class", "link")
			.attr("id", d => d.id);

		poly = g.selectAll(".poly")
			.data(lenet.fc_layers)
			.enter()
			.append("polygon")
			.attr("class", "poly")
			.attr("id", d => d.id);

		line = g.selectAll(".line")
			.data(lenet.fc_links)
			.enter()
			.append("line")
			.attr("class", "line")
			.attr("id", d => d.id);

		text = g.selectAll(".text")
			.data(architecture)
			.enter()
			.append("text")
			.text(d => (showLabels ? d.op : ""))
			.attr("class", "text")
			.attr("dy", ".35em")
			.attr("dx", "-6.5em")
			.style("font-size", "16px")
			.attr("font-family", "sans-serif");

		info = g.selectAll(".info")
			.data(label)
			.enter()
			.append("text")
			.text(d => (showLabels ? d.text : ""))
			.attr("class", "info")
			.attr("dy", "-0.3em")
			.style("font-size", "16px")
			.attr("font-family", "sans-serif");

		style();

		/*
		var lenet_width = real_width($("#lenet"));
		var lenet_height = real_height($("#lenet"));
		var g_width = real_widthG();
		var g_height = $("#lenet_frame")[0].getBoundingClientRect().height;

		var center_x_position = g_width / 2;
		var center_y_position = 0;

		$("#lenet_frame").attr("transform", "translate(" + center_x_position + "," + center_y_position + ")");
		log("translate(" + center_x_position + "," + center_y_position + ")");

		if(lenet_width < g_width || lenet_height < g_height) {
			log("lenet_width: " + lenet_width);
			log("lenet_height: " + lenet_height);
		}
		*/
	}

	function redistribute(
		{
			betweenLayers_=betweenLayers,
			betweenSquares_=betweenSquares
		}={}
	) {
		betweenLayers = betweenLayers_;
		betweenSquares = betweenSquares_;

		var layer_widths = architecture.map((layer, i) => (layer["numberOfSquares"] - 1) * betweenSquares + layer["squareWidth"]);
		layer_widths = layer_widths.concat(lenet.fc_layers.map((layer, i) => layer["size"]));

		largest_layer_width = Math.max(...layer_widths);

		var layer_x_offsets = layer_widths.reduce((offsets, layer_width, i) => offsets.concat([parseInt(offsets.last() + layer_width) + (betweenLayers[i] || betweenLayersDefault) ]), [0]);
		var layer_y_offsets = layer_widths.map(layer_width => (largest_layer_width - layer_width) / 2);

		var screen_center_x = (graph_width / 1) + (architecture.length * (largest_layer_width / 2));
		var screen_center_y = (h / 2) - (largest_layer_width / 2);

		let x = (layer, node_index) => layer_x_offsets[layer] + (node_index * betweenSquares) + screen_center_x;
		let y = (layer, node_index) => layer_y_offsets[layer] + (node_index * betweenSquares) + screen_center_y;

		rect.attr("x", d => x(d.layer, d.rect_index)).attr("y", d => y(d.layer, d.rect_index));

		let xc = (d) => (layer_x_offsets[d.layer]) + ((d["numberOfSquares"] - 1) * betweenSquares) + (d["x_rel"] * (d["squareWidth"] - d["filterWidth"])) + screen_center_x;
		let yc = (d) => (layer_y_offsets[d.layer]) + ((d["numberOfSquares"] - 1) * betweenSquares) + (d["y_rel"] * (d["squareHeight"] - d["filterHeight"])) + screen_center_y;


		var old_error = console.error;
		console.error = function () { };

		conv.attr("x", d => xc(d)).attr("y", d => yc(d));
		link.attr("x1", d => xc(d) + d["filterWidth"])
			.attr("y1", d => yc(d) + (d.i ? 0 : d["filterHeight"]))
			.attr("x2", d => (layer_x_offsets[d.layer + 1]) + ((architecture[d.layer + 1]["numberOfSquares"]-1) * betweenSquares) + architecture[d.layer + 1]["squareWidth"] * d.x_rel + screen_center_x)
			.attr("y2", d => (layer_y_offsets[d.layer + 1]) + ((architecture[d.layer + 1]["numberOfSquares"]-1) * betweenSquares) + architecture[d.layer + 1]["squareHeight"] * d.y_rel + screen_center_y);


		poly.attr("points", function(d) {
			return ((layer_x_offsets[d.layer] + screen_center_x)                   + "," + (layer_y_offsets[d.layer] + screen_center_y) +
				" " + (layer_x_offsets[d.layer]+screen_center_x + 10)          + "," + (layer_y_offsets[d.layer] + screen_center_y) +
				" " + (layer_x_offsets[d.layer]+screen_center_x + d.size + 10) + "," + (layer_y_offsets[d.layer] + screen_center_y + d.size) +
				" " + (layer_x_offsets[d.layer]+screen_center_x + d.size)      + "," + (layer_y_offsets[d.layer] + screen_center_y + d.size)
			);
		});

		line.attr("x1", d => layer_x_offsets[d.layer - 1] + (d.i ? 0 : layer_widths[d.layer - 1]) + d.prevSize + screen_center_x)
			.attr("y1", d => layer_y_offsets[d.layer - 1] + (d.i ? 0 : layer_widths[d.layer - 1]) + screen_center_y)
			.attr("x2", d => layer_x_offsets[d.layer] + (d.i ? 0 : d.size) + screen_center_x)
			.attr("y2", d => layer_y_offsets[d.layer] + (d.i ? 0 : d.size) + screen_center_y);


		text.attr("x", d => (layer_x_offsets[d.layer] + layer_widths[d.layer] + layer_x_offsets[d.layer + 1] + layer_widths[d.layer + 1]/2)/2 + screen_center_x - 15)
			.attr("y", d => layer_y_offsets[0] + screen_center_y + largest_layer_width);

		text.attr("x", d => (ddd("A", layer_x_offsets[d.layer]) + ddd("B", layer_widths[d.layer], d.layer) + ddd("C", layer_x_offsets[d.layer + 1], d.layer + 1) + ddd("E", layer_widths[d.layer + 1])/2)/2 + screen_center_x - 15)
			.attr("y", d => layer_y_offsets[0] + screen_center_y + largest_layer_width);


		console.error = old_error;

		info.attr("x", d => layer_x_offsets[d.layer] + screen_center_x).attr("y", d => layer_y_offsets[d.layer] + screen_center_y - 15);
	}

	function ddd (place, d, e) {
		if(typeof(d) === "undefined") {
			return 0;
			/*
			console.log(place + ": " + d + " (" + typeof(d) + ")");
			if(e) {
				log(e);
			}
			*/
		}
		return d;
	}

	function style(
		{
			color1_=color1,
			color2_=color2,
			borderWidth_=borderWidth,
			rectOpacity_=rectOpacity,
			showLabels_=showLabels
		}={}
	) {
		color1      = color1_;
		color2      = color2_;
		borderWidth = borderWidth_;
		rectOpacity = rectOpacity_;
		showLabels  = showLabels_;

		rect.style("fill", d => d.rect_index % 2 ? color1 : color2);
		poly.style("fill", color1);

		rect.style("stroke", borderColor);
		conv.style("stroke", borderColor);
		link.style("stroke", borderColor);
		poly.style("stroke", borderColor);
		line.style("stroke", borderColor);

		rect.style("stroke-width", borderWidth);
		conv.style("stroke-width", borderWidth);
		link.style("stroke-width", borderWidth / 2);
		poly.style("stroke-width", borderWidth);
		line.style("stroke-width", borderWidth / 2);

		rect.style("opacity", rectOpacity);
		conv.style("stroke-opacity", rectOpacity);
		link.style("stroke-opacity", rectOpacity);
		poly.style("opacity", rectOpacity);
		line.style("stroke-opacity", rectOpacity);

		text.text(d => (showLabels ? d.op : ""));
		info.text(d => (showLabels ? d.text : ""));
	}


	function zoomed() {
		g.attr("transform", d3.event.transform);
	}

	function resize() {
		graph_width = get_graph_width();
		svg.attr("width", graph_width).attr("height", h);
		g.attr("id", "lenet_frame");

		var move_left = $("#lenet_tab")[0].scrollWidth * 0.9;

		g.attr("transform", "translate(" + move_left + ",0) scale(1)");
	}

	var bscale = 100;
	d3.select(window).on("resize", resize);

	svg.call(d3.zoom().on("zoom", zoomed));

	resize();

	return {
		"redraw": redraw,
		"redistribute": redistribute,
		"style": style,
		"resize": resize
	};
}
