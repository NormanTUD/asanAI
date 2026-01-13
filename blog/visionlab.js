async function runConv() {
	const resCanvas = document.getElementById('conv-res');
	const srcCanvas = document.getElementById('conv-src-display');
	if (!srcCanvas || srcCanvas.width === 0) return;

	const size = parseInt(document.getElementById('k-size').value) || 3;
	const kValues = Array.from(document.querySelectorAll('.k-inp')).map(i => parseFloat(i.value) || 0);

	try {
		tf.tidy(() => {
			const t = tf.browser.fromPixels(srcCanvas).toFloat();
			const ker = tf.tensor2d(kValues, [size, size]).reverse(0).reverse(1).expandDims(-1).expandDims(-1);

			const channels = tf.split(t, 3, 2);
			const processed = channels.map(ch => 
				tf.conv2d(ch.expandDims(0), ker, 1, 'same').squeeze()
			);

			const combined = tf.stack(processed, 2).clipByValue(0, 255).cast('int32');
			tf.browser.toPixels(combined, resCanvas);
		});
	} catch (err) {
		warn('visionlab', `TFJS noch nicht bereit: ${err}`);
	}
}

function setKernel(matrix) {
	document.getElementById('k-size').value = matrix.length;
	initVisionLab();
	const inps = document.querySelectorAll('.k-inp');
	matrix.flat().forEach((val, i) => { if(inps[i]) inps[i].value = val; });
	runConv();
}

function updateConvMath(x, y, size) {
	const srcCanvas = document.getElementById('conv-src-display');
	const ctx = srcCanvas.getContext('2d', {willReadFrequently: true});
	const kValues = Array.from(document.querySelectorAll('.k-inp')).map(i => parseFloat(i.value) || 0);
	const offset = Math.floor(size/2);

	const imgData = ctx.getImageData(x - offset, y - offset, size, size).data;
	const targetDiv = document.getElementById('conv-math-step');

	let sums = { r: 0, g: 0, b: 0 };
	let latexParts = [];

	for(let i = 0; i < kValues.length; i++) {
		const weight = kValues[i];
		const localX = (x - offset) + (i % size);
		const localY = (y - offset) + Math.floor(i / size);

		const r = imgData[i * 4];
		const g = imgData[i * 4 + 1];
		const b = imgData[i * 4 + 2];

		sums.r += r * weight;
		sums.g += g * weight;
		sums.b += b * weight;

		// Create a vector for the RGB values at this specific coordinate
		const vector = `\\begin{bmatrix} ${r} \\\\ ${g} \\\\ ${b} \\end{bmatrix}`;
		latexParts.push(`\\underbrace{${vector}}_{${localX}, ${localY}} \\cdot ${weight.toFixed(1)}`);
	}

	const formula = `
    \\begin{bmatrix} y_\\text{Red} \\\\ y_\\text{Green} \\\\ y_\\text{Blue} \\end{bmatrix} = 
    ${latexParts.join(" + ")} = 
    \\mathbf{\\begin{bmatrix} ${Math.round(sums.r)} \\\\ ${Math.round(sums.g)} \\\\ ${Math.round(sums.b)} \\end{bmatrix}}`;

	targetDiv.innerHTML = `$$ ${formula} $$`;

	if (window.MathJax && window.MathJax.typesetPromise) {
		MathJax.typesetPromise([targetDiv]).catch((err) => console.log("visionlab", err.message));
	}
}

function initVisionLab() {
	const size = parseInt(document.getElementById('k-size').value) || 3;
	const kt = document.getElementById('kernel-table');
	kt.innerHTML = "";

	for(let i=0; i<size; i++) {
		let tr = kt.insertRow();
		for(let j=0; j<size; j++) {
			let td = tr.insertCell();
			let inp = document.createElement('input');
			inp.type="number"; inp.className="k-inp"; inp.style.width="40px";
			inp.value = (i === Math.floor(size/2) && j === Math.floor(size/2)) ? 1 : 0;
			inp.oninput = runConv;
			td.appendChild(inp);
		}
	}

	const img = document.getElementById('conv-src-hidden');
	const srcCanvas = document.getElementById('conv-src-display');
	const focus = document.getElementById('conv-focus');
	const cross = document.getElementById('conv-crosshair');
	const resCanvas = document.getElementById('conv-res');

	const setupCanvas = () => {
		const ctx = srcCanvas.getContext('2d', {willReadFrequently: true});
		ctx.drawImage(img, 0, 0, 50, 50);
		setTimeout(runConv, 100); 
	};

	if(img.complete) setupCanvas(); else img.onload = setupCanvas;

	srcCanvas.onmousemove = (e) => {
		const rect = srcCanvas.getBoundingClientRect();
		const scale = rect.width / 50;

		const x = Math.floor((e.clientX - rect.left) / scale);
		const y = Math.floor((e.clientY - rect.top) / scale);
		const offset = Math.floor(size/2);

		focus.style.display = 'block';
		focus.style.width = (size * scale) + "px";
		focus.style.height = (size * scale) + "px";
		focus.style.left = ((x - offset) * scale) + "px";
		focus.style.top = (srcCanvas.offsetTop + (y - offset) * scale) + "px";

		cross.style.display = 'block';
		cross.style.left = (x * scale + scale/2) + "px";
		cross.style.top = (resCanvas.offsetTop + y * scale + scale/2) + "px";

		updateConvMath(x, y, size);
	};

	srcCanvas.onmouseleave = () => {
		focus.style.display = 'none';
		cross.style.display = 'none';
	};
}

document.addEventListener('DOMContentLoaded', () => {
	initVisionLab();
});
