window.onresize = () => {
	['lin-loss-chart', 'lin-data-chart', 'gauss-chart', 'deep-loss-chart', 'deep-data-chart'].forEach(id => {
		const el = document.getElementById(id);
		if(el) Plotly.Plots.resize(el);
	});
	if(typeof restart_fcnn === 'function') restart_fcnn(1);
};

window.onload = () => {
	initBlock('lin'); initBlock('deep'); initVisionLab();

	const x=[], y=[]; for(let i=-4; i<=4; i+=0.1) { x.push(i); y.push(Math.exp(-0.5*i*i)/Math.sqrt(2*Math.PI)); }
	Plotly.newPlot('gauss-chart', [{x,y,fill:'tozeroy', line:{color:'#3b82f6'}}], {
		margin:{t:30, b:30, l:40, r:10}, 
		title: 'Standardnormalverteilung',
		autosize: true
	}, {responsive: true});

	renderMarkdown();
	if (window.MathJax) MathJax.typeset();
};
