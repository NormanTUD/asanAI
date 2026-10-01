<div class="md">
## Saddles

Most critical points in high dimensions are saddles, not minima. A saddle curves up along some directions and down along others. \cite[Dauphin et al., 2014]{dauphin2014saddle}
</div>

<div class="ll-widget">
	<div class="ll-controls">
		<span class="ll-ctrl"><label>Loss level $\lambda$</label>
			<input type="range" id="ll-hess-lam" min="0" max="4" step="0.05" value="0.6" oninput="LossLandscape.drawHessian()">
		</span>
		<span class="ll-readout">negative: <b id="ll-hess-neg">0</b></span>
		<span class="ll-readout">type: <b id="ll-hess-type">Minimum</b></span>
	</div>
	<div id="ll-hessian" data-plot-theme="self" style="height:260px;"></div>
</div>

<div class="md" data-mathlevel="70" data-optionaltitle="Eigenvalues">
$$
H \;=\; \underbrace{H_{0}}_{\ge 0} \;+\; \underbrace{\lambda\, H_{1}}_{\text{error part}}
$$
As $\lambda$ increases, negative eigenvalues appear. \cite[Choromanska et al., 2015]{choromanska2015loss}
</div>
