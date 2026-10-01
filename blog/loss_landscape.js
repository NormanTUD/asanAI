// loss_landscape.js
(function() {
	'use strict';

	var LossLandscape = window.LossLandscape || {};
	window.LossLandscape = LossLandscape;

	var state = {
		real: {
			data: 'line',
			act: 'linear',
			opt: 'sgd',
			steps: 160,
			theta: [0.0, 0.0],
			path: []
		},
		preset: {
			type: 'wide',
			rough: 0.35,
			traj: true,
			seed: Date.now()
		},
		resnet: {
			arch: 'vanilla',
			depth: 5
		},
		hess: {
			lam: 0.6
		}
	};

	function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
	function randn(rng) { var u=0,v=0; while(u===0) u=rng(); while(v===0) v=rng(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

	function makeRng(seed) {
		var s = (seed >>> 0) || 123456789;
		return function() {
			s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
			return (s >>> 0) / 4294967295;
		};
	}

	function themeColor(c) {
		if (window.__MN_DARK && window.__MN_DARK.isDark) {
			switch(c) {
				case 'bg': return '#0f172a';
				case 'grid': return 'rgba(255,255,255,0.12)';
				case 'axis': return 'rgba(255,255,255,0.72)';
				case 'text': return 'rgba(255,255,255,0.92)';
				case 'line': return '#60a5fa';
				case 'surf': return 'Viridis';
				default: return c;
			}
		}
		switch(c) {
			case 'bg': return '#FAF8F1';
			case 'grid': return 'rgba(15,23,42,0.10)';
			case 'axis': return 'rgba(15,23,42,0.72)';
			case 'text': return 'rgba(15,23,42,0.92)';
			case 'line': return '#2563eb';
			case 'surf': return 'Viridis';
			default: return c;
		}
	}

	function baseLayout(title, ztitle) {
		return {
			title: title || '',
			paper_bgcolor: themeColor('bg'),
			plot_bgcolor: themeColor('bg'),
			font: { color: themeColor('text') },
			scene: {
				xaxis: { color: themeColor('axis'), gridcolor: themeColor('grid') },
				yaxis: { color: themeColor('axis'), gridcolor: themeColor('grid') },
				zaxis: { title: ztitle||'loss', color: themeColor('axis'), gridcolor: themeColor('grid') },
				bgcolor: themeColor('bg')
			},
			margin: { l:0,r:0,t:20,b:0 }
		};
	}

	function baseLayout2D(title) {
		return {
			title: title||'',
			paper_bgcolor: themeColor('bg'),
			plot_bgcolor: themeColor('bg'),
			font: { color: themeColor('text') },
			xaxis: { color: themeColor('axis'), gridcolor: themeColor('grid') },
			yaxis: { color: themeColor('axis'), gridcolor: themeColor('grid') },
			margin: { l:40,r:20,t:20,b:40 }
		};
	}

	function updateChips(group, key) {
		var chips = document.querySelectorAll('.ll-chip[data-ll="'+group+'"]');
		for (var i=0;i<chips.length;i++) chips[i].classList.remove('on');
		var on = document.querySelector('.ll-chip[data-ll="'+key+'"]');
		if (on) on.classList.add('on');
	}

	function ensurePlotly(cb) {
		if (window.Plotly) { cb(); return; }
		var t = setInterval(function(){ if (window.Plotly){ clearInterval(t); cb(); }}, 50);
	}

	LossLandscape.setData = function(d) {
		state.real.data = d;
		updateChips('line', d==='line'?d:null);
		updateChips('parabola', d==='parabola'?d:null);
		updateChips('sine', d==='sine'?d:null);
		LossLandscape.redrawSurface();
	};

	LossLandscape.setPreset = function(p) {
		state.preset.type = p;
		updateChips('wide', p==='wide'?p:null);
		updateChips('deep', p==='deep'?p:null);
		updateChips('spur', p==='spur'?p:null);
		updateChips('saddle', p==='saddle'?p:null);
		LossLandscape.redrawPreset();
	};

	LossLandscape.newSeed = function() {
		state.preset.seed = Date.now();
		LossLandscape.redrawPreset();
	};

	LossLandscape.setArch = function(a) {
		state.resnet.arch = a;
		updateChips('vanilla', a==='vanilla'?a:null);
		updateChips('residual', a==='residual'?a:null);
		LossLandscape.redrawResnet();
	};

	function sample2D(n, m, f) {
		var x=[],y=[],z=[];
		var x0=-2,x1=2,y0=-2,y1=2;
		for (var i=0;i<n;i++) {
			var xi = x0 + (x1-x0)*(i/(n-1));
			x.push(xi);
		}
		for (var j=0;j<m;j++) {
			var yj = y0 + (y1-y0)*(j/(m-1));
			y.push(yj);
		}
		for (var j=0;j<m;j++) {
			var row=[];
			var yj = y[(j+n)%m>=0?j:y.length-1];
			for (var i=0;i<n;i++) {
				var xi = x[i];
				row.push(f(xi,yj));
			}
			z.push(row);
		}
		return {x:x,y:y,z:z};
	}

	function realLoss(w,b) {
		var act = document.getElementById('ll-real-act');
		var a = act ? act.value : state.real.act;
		state.real.act = a;
		var data = state.real.data;
		var N=40, sx=0,sy=0;
		for (var k=0;k<N;k++) {
			var t = k/(N-1)*Math.PI;
			var xv, yv;
			if (data==='line'){ xv=t; yv=0.8*t; }
			else if (data==='parabola'){ xv=t; yv=0.6*t*t-0.2; }
			else { xv=t; yv=Math.sin(1.5*t); }
			var h;
			if (a==='linear') h = w*xv + b;
			else if (a==='relu') h = Math.max(0, w*xv + b);
			else { var v=w*xv+b; h = (Math.exp(v)-Math.exp(-v))/(Math.exp(v)+Math.exp(-v)); }
			var e = h-yv; sx += e*e;
		}
		return sx/(2*N);
	}

	LossLandscape.redrawSurface = function() {
		var el = document.getElementById('ll-real-surface');
		if (!el) return;
		var stepsEl = document.getElementById('ll-real-steps');
		state.real.steps = stepsEl ? parseInt(stepsEl.value)||160 : state.real.steps;
		var optEl = document.getElementById('ll-real-opt');
		state.real.opt = optEl ? optEl.value : state.real.opt;

		ensurePlotly(function(){
			var s = sample2D(40,40, realLoss);
			var path = simulatePath(realLoss, state.real.steps, state.real.opt);
			var traceS = { type:'surface', x:s.x,y:s.y,z:s.z, colorscale: themeColor('surf'), showscale:true, opacity:0.95 };
			var px=[],py=[],pz=[];
			for (var i=0;i<path.length;i++){ px.push(path[i][0]); py.push(path[i][1]); pz.push(realLoss(path[i][0],path[i][1])); }
			var traceP = { type:'scatter3d', x:px,y:py,z:pz, mode:'lines', line:{ width:4, color: themeColor('line') }, marker:{ size:2 } };
			var layout = baseLayout('Real 2-parameter loss surface', 'loss');
			Plotly.newPlot(el, [traceS, traceP], layout, { responsive:true });
		});
	};

	function gradReal(w,b,h){
		var act = state.real.act;
		var data = state.real.data;
		var N=30, gw=0, gb=0;
		for (var k=0;k<N;k++){
			var t=k/(N-1)*Math.PI;
			var xv,yv; if(data==='line'){xv=t;yv=0.8*t;} else if(data==='parabola'){xv=t;yv=0.6*t*t-0.2;} else {xv=t;yv=Math.sin(1.5*t);}
			var z=w*xv+b, hpred;
			if(act==='linear'){ hpred=z; var d=1; }
			else if(act==='relu'){ hpred=Math.max(0,z); var d=(z>0?1:0); }
			else { var ez=(Math.exp(z)-Math.exp(-z))/(Math.exp(z)+Math.exp(-z)); hpred=ez; var d=1-ez*ez; }
			var e=hpred-yv; gw += e*d*xv; gb += e*d;
		}
		return [gw/(N), gb/(N)];
	}

	function simulatePath(f, steps, opt){
		var w=0.5,b=-0.5, v1=0,v2=0,m1=0,m2=0,b1=0,b2=0;
		var lr=0.05, beta=0.9, eps=1e-8;
		var t=0, path=[[w,b]];
		for (var i=0;i<steps;i++){
			var g=gradReal(w,b);
			if(opt==='sgd'){ w-=lr*g[0]; b-=lr*g[1]; }
			else if(opt==='momentum'){ v1=beta*v1 + lr*g[0]; v2=beta*v2 + lr*g[1]; w-=v1; b-=v2; }
			else {
				t++; m1=0.9*m1+0.1*g[0]; m2=0.9*m2+0.1*g[1]; b1=0.999*b1+0.001*g[0]*g[0]; b2=0.999*b2+0.001*g[1]*g[1];
				var mc1=m1/(1-Math.pow(0.9,t)), mc2=m2/(1-Math.pow(0.9,t));
				var bc1=b1/(1-Math.pow(0.999,t)), bc2=b2/(1-Math.pow(0.999,t));
				w -= lr*mc1/(Math.sqrt(bc1)+eps); b -= lr*mc2/(Math.sqrt(bc2)+eps);
			}
			path.push([w,b]);
			if (Math.abs(g[0])+Math.abs(g[1]) < 1e-4 && i>10) break;
		}
		return path;
	}

	function presetLoss(x,y){
		var p = state.preset;
		var rng = makeRng(p.seed);
		var v=0;
		if (p.type==='wide'){ v = 0.15*(x*x + 0.25*y*y); }
		else if (p.type==='deep'){ v = 0.2*(x*x + 4*y*y); }
		else if (p.type==='spur'){ v = 0.1*x*x + 0.4*Math.max(0, -y-0.5) + 0.05*Math.sin(6*x+y); }
		else { v = 0.25*(x*x - y*y) + 0.05*(x*x+y*y)*(x*x+y*y); }
		var r=p.rough||0; for (var i=0;i<4;i++) v += r*0.02*randn(rng);
		return Math.max(0, v);
	}

	LossLandscape.redrawPreset = function(){
		var el=document.getElementById('ll-preset-surface'); if(!el) return;
		var cb=document.getElementById('ll-preset-traj'); if(cb) state.preset.traj = cb.checked;
		var rr=document.getElementById('ll-preset-r'); if(rr) state.preset.rough = parseFloat(rr.value)||0;
		ensurePlotly(function(){
			var s=sample2D(36,36,presetLoss);
			var traces=[{type:'surface',x:s.x,y:s.y,z:s.z,colorscale:themeColor('surf'),opacity:0.95}];
			if (state.preset.traj){
				var path=[[0.8,1.0],[0.4,0.6],[0,-0.2],[0,-0.4]];
				var px=[],py=[],pz=[];
				for (var i=0;i<path.length;i++){ px.push(path[i][0]); py.push(path[i][1]); pz.push(presetLoss(path[i][0],path[i][1])+0.01); }
				traces.push({type:'scatter3d',x:px,y:py,z:pz,mode:'lines',line:{width:4,color:themeColor('line')}});
			}
			var info=document.getElementById('ll-preset-info'); if(info){
				var t=state.preset.type; info.textContent = (t==='wide'?'Wide, flat valley.':t==='deep'?'Narrow, steep valley.':t==='spur'?'Spurious region.':'Saddle-like structure.');
			}
			Plotly.newPlot(el,traces,baseLayout('Conceptual terrain','loss'),{responsive:true});
		});
	};

	LossLandscape.drawHessian = function(){
		var el=document.getElementById('ll-hessian'); if(!el) return;
		var lm=document.getElementById('ll-hess-lam'); if(lm) state.hess.lam=parseFloat(lm.value)||0;
		var lam=state.hess.lam;
		var evals=[1.0, 1.0 - lam, 0.4 - 0.3*lam, 0.1];
		var neg=0; for (var i=0;i<evals.length;i++) if (evals[i]<0) neg++;
		var typeEl=document.getElementById('ll-hess-type'); if(typeEl) typeEl.textContent = (neg===0?'Minimum':'Saddle ('+neg+' negative)');
		var negEl=document.getElementById('ll-hess-neg'); if(negEl) negEl.textContent = neg;
		ensurePlotly(function(){
			var data=[{ x:['e1','e2','e3','e4'], y:evals.map(function(v){return v;}), type:'bar', marker:{ color: evals.map(function(v){return v<0?'#f87171':'#60a5fa';}) } }];
			Plotly.newPlot(el,data,baseLayout2D('Hessian eigenvalues'),{responsive:true});
		});
	};

	LossLandscape.redrawResnet = function(){
		var el=document.getElementById('ll-resnet-surface'); if(!el) return;
		var d=document.getElementById('ll-resnet-depth'); if(d) state.resnet.depth=parseInt(d.value)||5;
		var arch=state.resnet.arch, depth=state.resnet.depth;
		function f(x,y){
			var base = 0.25*x*x + 0.25*y*y;
			var rough = 0.01*Math.sin(2*x+3*y) + 0.01*Math.cos(1.5*x-2*y);
			if (arch==='residual') return base * (1.0/(1.0 + 0.15*depth)) + rough*0.2;
			return base * (1.0 + 0.15*depth*0.5) + rough*0.8;
		}
		var info=document.getElementById('ll-resnet-info'); if(info){
			info.textContent = (arch==='residual'?'Residual (identity path) flattens with depth.':'Plain stack tends to steepen with depth.');
		}
		ensurePlotly(function(){
			var s=sample2D(36,36,f);
			Plotly.newPlot(el,[{type:'surface',x:s.x,y:s.y,z:s.z,colorscale:themeColor('surf'),opacity:0.95}], baseLayout('Surface smoothing','loss'),{responsive:true});
		});
	};

	function initAll(){
		LossLandscape.redrawSurface();
		LossLandscape.redrawPreset();
		LossLandscape.drawHessian();
		LossLandscape.redrawResnet();
	}

	function registerDark(){
		if (window.__MN_DARK && typeof window.__MN_DARK.onChange === 'function') {
			window.__MN_DARK.onChange(function(){ initAll(); });
		}
	}

	function lazyInitAll(){
		if (document.getElementById('ll-real-surface')) lazyInit('ll-real-surface', LossLandscape.redrawSurface);
		if (document.getElementById('ll-preset-surface')) lazyInit('ll-preset-surface', LossLandscape.redrawPreset);
		if (document.getElementById('ll-hessian')) lazyInit('ll-hessian', LossLandscape.drawHessian);
		if (document.getElementById('ll-resnet-surface')) lazyInit('ll-resnet-surface', LossLandscape.redrawResnet);
	}

	function loadLossLandscapeModule(){
		registerDark();
		lazyInitAll();
	}

	window.loadLossLandscapeModule = loadLossLandscapeModule;

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', loadLossLandscapeModule);
	} else {
		loadLossLandscapeModule();
	}
})();
