function transformer_tokenize() {
	const masterInput = document.getElementById('transformer-master-token-input');

	if (!masterInput) {
		console.error("'transformer-master-token-input' not found");
		return;
	}

	const text = masterInput.value;
	log("AAAA")

	transformer_tokenize_render(text);
}

function transformer_tokenize_render(text) {
	const container = document.getElementById(`transformer-viz-bpe`);
	// Falls der spezifische Container nicht existiert, überspringen
	if (!container) return;

	let tokens = [];

	const subUnits = ["tion", "ing", "haus", "er", "ly", "is", "ment", "ness", "ation"];
	const words = text.split(/\s+/);
	words.forEach(word => {
		let found = false;
		for (let unit of subUnits) {
			if (word.toLowerCase().endsWith(unit) && word.length > unit.length) {
				tokens.push(word.substring(0, word.length - unit.length));
				tokens.push("##" + unit);
				found = true;
				break;
			}
		}
		if (!found && word.length > 0) tokens.push(word);
	});

	// HTML Rendering mit konsistentem Hashing für Farben
	container.innerHTML = tokens.map(t => {
		const hash = t.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
		const hue = Math.abs(hash) % 360;
		const displayToken = (t === ' ') ? '␣' : t; 

		return `
	    <div style="background: hsl(${hue}, 65%, 40%); color: white; padding: 5px 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 0.85rem; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
		${displayToken}
		<span style="font-size: 0.6rem; opacity: 0.8; margin-top: 3px; border-top: 1px solid rgba(255,255,255,0.2); width: 100%; text-align: center;">
		    ID: ${Math.abs(hash) % 1000}
		</span>
	    </div>
	`;
	}).join('');
}

async function loadTransformerModule () {
	updateLoadingStatus("Loading section about transformers...");
	//TransformerLab.init();
	transformer_tokenize()
	return Promise.resolve();
}
