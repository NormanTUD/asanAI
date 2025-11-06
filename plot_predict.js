async function plot_model_in_div(div_id) {
	const plot_div = document.getElementById(div_id)
	if (!plot_div) return

	// Remember last known training time per div
	if (!plot_model_in_div._state) plot_model_in_div._state = {}
	const state = plot_model_in_div._state[div_id] || {}
	const current_time = typeof last_training_time !== 'undefined' ? last_training_time : null

	// Model existence & shape checks
	if (!model?.input?.shape || !model?.output?.shape) {
		Plotly.purge(plot_div)
		plot_div.style.display = 'none'
		if (state.controls) state.controls.style.display = 'none'
		plot_model_in_div._state[div_id] = { last_training_time: current_time }
		return
	}

	// Detect model change
	if (state.last_training_time === current_time) {
		// Same model -> don't recreate, just return (UI already set up)
		return
	}

	// Save new timestamp
	plot_model_in_div._state[div_id] = { last_training_time: current_time }

	const input_shape = model.input.shape
	const output_shape = model.output.shape
	const fallA = JSON.stringify(input_shape) === '[1,1]' && JSON.stringify(output_shape) === '[null,1]'
	const fallB1 = JSON.stringify(input_shape) === '[1,2]' && JSON.stringify(output_shape) === '[null,1]'
	const fallB2 = JSON.stringify(input_shape) === '[1,1]' && JSON.stringify(output_shape) === '[1,2]'
	if (!fallA && !fallB1 && !fallB2) {
		Plotly.purge(plot_div)
		plot_div.style.display = 'none'
		return
	}

	// Setup or reuse controls
	let controls = document.getElementById(div_id + '_controls')
	if (!controls) {
		controls = document.createElement('div')
		controls.id = div_id + '_controls'
		plot_div.parentNode.insertBefore(controls, plot_div)
	} else {
		controls.innerHTML = ''
	}
	controls.style.display = 'block'
	state.controls = controls

	const msg = document.createElement('div')
	msg.style.color = 'crimson'
	msg.style.fontWeight = 'bold'
	msg.style.marginTop = '4px'
	controls.appendChild(msg)

	function create_input(label, id) {
		const wrap = document.createElement('div')
		wrap.style.margin = '4px 0'
		const l = document.createElement('label')
		l.textContent = label + ': '
		const i = document.createElement('input')
		i.type = 'number'
		i.id = id
		i.style.width = '90px'
		i.style.marginLeft = '4px'
		i.addEventListener('input', update_plot)
		wrap.appendChild(l)
		wrap.appendChild(i)
		controls.appendChild(wrap)
		return i
	}

	let fields = []
	if (fallA) {
		fields = [
			create_input('X min', div_id + '_x_min'),
			create_input('X max', div_id + '_x_max'),
			create_input('Step', div_id + '_step')
		]
	} else if (fallB1) {
		fields = [
			create_input('X min', div_id + '_x_min'),
			create_input('X max', div_id + '_x_max'),
			create_input('Y min', div_id + '_y_min'),
			create_input('Y max', div_id + '_y_max'),
			create_input('Step', div_id + '_step')
		]
	} else if (fallB2) {
		fields = [
			create_input('X min', div_id + '_x_min'),
			create_input('X max', div_id + '_x_max'),
			create_input('Step', div_id + '_step')
		]
	}

	plot_div.style.width = '100%'
	plot_div.style.height = '400px'
	plot_div.style.maxHeight = '400px'

	async function update_plot() {
		msg.textContent = ''
		const vals = Object.fromEntries(fields.map(f => [f.id, parseFloat(f.value)]))
		const all_filled = Object.values(vals).every(v => !isNaN(v))
		if (!all_filled) {
			Plotly.purge(plot_div)
			plot_div.style.display = 'none'
			return
		}

		const x_min = vals[div_id + '_x_min']
		const x_max = vals[div_id + '_x_max']
		const step = vals[div_id + '_step']
		if (x_min >= x_max) {
			msg.textContent = 'X min must be smaller than X max.'
			Plotly.purge(plot_div)
			plot_div.style.display = 'none'
			return
		}
		if (step <= 0 || step >= (x_max - x_min)) {
			msg.textContent = 'Step must be positive and smaller than (max - min).'
			Plotly.purge(plot_div)
			plot_div.style.display = 'none'
			return
		}
		if (fallB1) {
			const y_min = vals[div_id + '_y_min']
			const y_max = vals[div_id + '_y_max']
			if (y_min >= y_max) {
				msg.textContent = 'Y min must be smaller than Y max.'
				Plotly.purge(plot_div)
				plot_div.style.display = 'none'
				return
			}
		}

		plot_div.style.display = 'block'
		const dark = (typeof is_dark_mode !== 'undefined' && is_dark_mode)
		const font_color = dark ? '#fff' : '#000'
		const bg_color = 'rgba(0,0,0,0)'

		const base_layout = {
			margin: { t: 40 },
			width: plot_div.clientWidth,
			height: 400,
			paper_bgcolor: bg_color,
			plot_bgcolor: bg_color,
			font: { color: font_color },
			title: {
				text: `Model Plot (input: ${JSON.stringify(input_shape)}, output: ${JSON.stringify(output_shape)})`,
				font: { color: font_color }
			}
		}

		if (fallA) {
			const xs = []
			for (let x = x_min; x <= x_max; x += step) xs.push(x)
			const ys = []
			for (const x of xs) {
				const pred = array_sync(await __predict(tensor([x])))
				ys.push(pred[0][0])
			}
			await Plotly.newPlot(plot_div, [{
				x: xs,
				y: ys,
				mode: 'lines',
				line: { width: 2 }
			}], {
				...base_layout,
				xaxis: { title: 'Input (X)' },
				yaxis: { title: 'Model Output' }
			})
		}

		else if (fallB1) {
			const y_min = vals[div_id + '_y_min']
			const y_max = vals[div_id + '_y_max']
			const xs = [], ys = [], zs = []
			for (let x = x_min; x <= x_max; x += step) xs.push(x)
			for (let y = y_min; y <= y_max; y += step) ys.push(y)
			for (let xi = 0; xi < xs.length; xi++) {
				const row = []
				for (let yi = 0; yi < ys.length; yi++) {
					const pred = array_sync(await __predict(tensor([[xs[xi], ys[yi]]])))
					row.push(pred[0][0])
				}
				zs.push(row)
			}
			await Plotly.newPlot(plot_div, [{
				type: 'surface',
				x: xs,
				y: ys,
				z: zs
			}], {
				...base_layout,
				scene: {
					xaxis: { title: 'Input X', color: font_color },
					yaxis: { title: 'Input Y', color: font_color },
					zaxis: { title: 'Model Output', color: font_color }
				}
			})
		}

		else if (fallB2) {
			const xs = [], ys1 = [], ys2 = []
			for (let x = x_min; x <= x_max; x += step) xs.push(x)
			for (const x of xs) {
				const pred = array_sync(await __predict(tensor([x])))
				ys1.push(pred[0][0])
				ys2.push(pred[0][1])
			}
			await Plotly.newPlot(plot_div, [{
				type: 'surface',
				x: xs,
				y: [0, 1],
				z: [ys1, ys2]
			}], {
				...base_layout,
				scene: {
					xaxis: { title: 'Input (X)', color: font_color },
					yaxis: { title: 'Output Dimension', color: font_color },
					zaxis: { title: 'Value', color: font_color }
				}
			})
		}
	}

	// Store update_plot for possible manual refresh
	state.update_plot = update_plot
}
