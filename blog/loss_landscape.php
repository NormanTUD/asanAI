<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Loss Landscape
description: The terrain of a network: for each choice of parameters, a loss value.
icon: &#129518;
part: 3
order: 2
color: sky
topics: training, math-i, math-ii, architecture
tags: math-heavy, code-heavy
math: 55
-->

<div class="image-row md">
	<figure>
		<img src="saddle_hyperbolic_paraboloid.png" alt="A saddle shape: z = x squared minus y squared" />
		<figcaption class="md">A saddle: $z = x^{2} - y^{2}$ curves up along one axis and down along the other. \cite[Rectas, Wikimedia Commons, CC0]{hyperbolic_paraboloid_saddle}</figcaption>
	</figure>
</div>

<div class="md" data-lesson-id="loss_landscape">
For every possible combination of parameters of a network with fixed data, there is a loss value.
This is the **loss landscape**.
It is usually high-dimensional, so we cannot easily visualize it.
</div>

<div class="md">
## A Simple View

The weights are a point in parameter space. The loss is a single number at that point. Training moves that point to smaller loss values.
</div>

<!-- ─── Interactive 1: REAL loss surface of a small network ─── -->
<div class="ll-widget">
	<div class="ll-controls">
		<span class="ll-ctrl"><label>Data</label>
			<button class="ll-chip on" data-ll="line" onclick="LossLandscape.setData('line')">Line</button>
			<button class="ll-chip" data-ll="parabola" onclick="LossLandscape.setData('parabola')">Parabola</button>
			<button class="ll-chip" data-ll="sine" onclick="LossLandscape.setData('sine')">Sine</button>
		</span>
		<span class="ll-ctrl"><label>Bend (activation)</label>
			<select id="ll-real-act" onchange="LossLandscape.redrawSurface()">
				<option value="linear">linear</option>
				<option value="relu">ReLU</option>
				<option value="tanh">tanh</option>
			</select>
		</span>
		<span class="ll-ctrl"><label>Optimizer</label>
			<select id="ll-real-opt" onchange="LossLandscape.redrawSurface()">
				<option value="sgd">Gradient descent</option>
				<option value="momentum">+ Momentum</option>
				<option value="adam">+ Adam</option>
			</select>
		</span>
		<span class="ll-ctrl"><label>Steps</label><input type="range" id="ll-real-steps" min="20" max="400" value="160" oninput="LossLandscape.redrawSurface()"></span>
	</div>
	<div id="ll-real-surface" data-plot-theme="self" style="height:430px;"></div>
	<p class="ll-cap">Loss over two parameters $(w,b)$. The line shows a descent path.</p>
</div>
