window.onresize = () => {
	['lin-loss-chart', 'lin-data-chart', 'deep-loss-chart', 'deep-data-chart'].forEach(id => {
		const el = document.getElementById(id);
		if(el) Plotly.Plots.resize(el);
	});
	if(typeof restart_fcnn === 'function') restart_fcnn(1);
};

window.onload = () => {
	initBlock('lin'); initBlock('deep'); initVisionLab();

	const x=[], y=[]; for(let i=-4; i<=4; i+=0.1) { x.push(i); y.push(Math.exp(-0.5*i*i)/Math.sqrt(2*Math.PI)); }

	renderMarkdown();
	if (window.MathJax) MathJax.typeset();
};
