async function plot_model_in_div(div_id = 'plotly_predict') {
	dbg('[plot_model_in_div] called')

	const plot_div = document.getElementById(div_id)
	if (!plot_div) {
		dbg('[plot_model_in_div] No plot div found: ' + div_id)
		return
	}

	if (!plot_model_in_div._state) plot_model_in_div._state = {}
	const state = plot_model_in_div._state[div_id] || {}
	const last_time = Math.max(last_updated_page, last_training_time);
	const current_time = typeof last_time !== 'undefined' ? last_time : null
	dbg('[plot_model_in_div] Current training time: ' + current_time)

	if (!model?.input?.shape || !model?.output?.shape) {
		dbg('[plot_model_in_div] Model missing or has no valid shape')
		Plotly.purge(plot_div)
		plot_div.style.display = 'none'
		if (state.controls) state.controls.style.display = 'none'
		plot_model_in_div._state[div_id] = { last_time: current_time }
		return
	}

	if (state.last_time === current_time) {
		dbg('[plot_model_in_div] Model already plotted with same training time, skipping rebuild')
		return
	}

	plot_model_in_div._state[div_id] = { last_time: current_time }
	dbg('[plot_model_in_div] Model changed or first plot, initializing UI')

	const input_shape = model.input.shape.slice(1)  // <— ignore batch dimension
	const output_shape = model.output.shape.slice(1) // <— ignore batch dimension

	dbg('[plot_model_in_div] Detected real shapes: input=' + JSON.stringify(input_shape) + ' output=' + JSON.stringify(output_shape))

	const fallA = JSON.stringify(input_shape) === '[1]' && JSON.stringify(output_shape) === '[1]'
	const fallB1 = JSON.stringify(input_shape) === '[2]' && JSON.stringify(output_shape) === '[1]'
	const fallB2 = JSON.stringify(input_shape) === '[1]' && JSON.stringify(output_shape) === '[2]'
	dbg(`[plot_model_in_div] FallA=${fallA} FallB1=${fallB1} FallB2=${fallB2}`)

	if (!fallA && !fallB1 && !fallB2) {
		dbg('[plot_model_in_div] Shapes do not match any supported case, hiding plot')
		Plotly.purge(plot_div)
		plot_div.style.display = 'none'
		return
	}

	let controls = document.getElementById(div_id + '_controls')
	if (!controls) {
		controls = document.createElement('div')
		controls.id = div_id + '_controls'
		plot_div.parentNode.insertBefore(controls, plot_div)
		dbg('Created controls div')
	} else {
		controls.innerHTML = ''
		dbg('Reusing existing controls div')
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
		dbg('Configured UI for FallA')
	} else if (fallB1) {
		fields = [
			create_input('X min', div_id + '_x_min'),
			create_input('X max', div_id + '_x_max'),
			create_input('Y min', div_id + '_y_min'),
			create_input('Y max', div_id + '_y_max'),
			create_input('Step', div_id + '_step')
		]
		dbg('Configured UI for FallB1')
	} else if (fallB2) {
		fields = [
			create_input('X min', div_id + '_x_min'),
			create_input('X max', div_id + '_x_max'),
			create_input('Step', div_id + '_step')
		]
		dbg('Configured UI for FallB2')
	}

	plot_div.style.width = '100%'
	plot_div.style.height = '400px'
	plot_div.style.maxHeight = '400px'

	async function update_plot() {
		msg.textContent = ''
		const vals = Object.fromEntries(fields.map(f => [f.id, parseFloat(f.value)]))
		const all_filled = Object.values(vals).every(v => !isNaN(v))
		dbg('update_plot() triggered. All fields filled: ' + all_filled)

		if (!all_filled) {
			dbg('Not all fields have values, hiding plot')
			Plotly.purge(plot_div)
			plot_div.style.display = 'none'
			return
		}

		const x_min = vals[div_id + '_x_min']
		const x_max = vals[div_id + '_x_max']
		const step = vals[div_id + '_step']
		if (x_min >= x_max) {
			msg.textContent = 'X min must be smaller than X max.'
			dbg('Invalid range: x_min >= x_max')
			Plotly.purge(plot_div)
			plot_div.style.display = 'none'
			return
		}
		if (step <= 0 || step >= (x_max - x_min)) {
			msg.textContent = 'Step must be positive and smaller than (max - min).'
			dbg('Invalid step value')
			Plotly.purge(plot_div)
			plot_div.style.display = 'none'
			return
		}
		if (fallB1) {
			const y_min = vals[div_id + '_y_min']
			const y_max = vals[div_id + '_y_max']
			if (y_min >= y_max) {
				msg.textContent = 'Y min must be smaller than Y max.'
				dbg('Invalid y-range: y_min >= y_max')
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
			dbg('Plotting FallA (1D input → 1D output)')
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
			dbg('FallA plot complete')
		}

		else if (fallB1) {
			dbg('Plotting FallB1 (2D input → 1D output)')
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
			dbg('FallB1 surface complete')
		}

		else if (fallB2) {
			dbg('Plotting FallB2 (1D input → 2D output)')
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
			dbg('FallB2 surface complete')
		}
	}

	state.update_plot = update_plot
	dbg('UI initialized successfully, waiting for input')
}
