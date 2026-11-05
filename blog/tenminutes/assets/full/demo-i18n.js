/* TEN MINUTES — German overlay for the copied transformer demos. */
(function () {
	"use strict";

	var lang = (window.TM && TM.lang) ? TM.lang() : "en";
	if (lang !== "de") return;

	var MAP = {
		"Model Dimension ($d_{\\text{model}}$):": "Modell-Dimension ($d_{\\text{model}}$):",
		"Dependency:": "Abhängigkeit:",
		"Must be a multiple of Heads.": "Muss ein Vielfaches der Heads sein.",
		"Reason:": "Grund:",
		"Each head needs an equal integer-sized slice ($d_k = \\frac{d_{\\text{model}}}{h}$) of the vector to perform dot products.": "Jeder Head braucht einen gleich großen ganzzahligen Ausschnitt ($d_k = \\frac{d_{\\text{model}}}{h}$) des Vektors für die Skalarprodukte.",
		"Attention Heads ($h$):": "Attention-Heads ($h$):",
		"$d_{\\text{model}}$ must be a multiple of $h$.": "$d_{\\text{model}}$ muss ein Vielfaches von $h$ sein.",
		"Multi-head attention splits the main vector into $h$ parallel “viewpoints.” If $d_{\\text{model}}$ is 4 and $h$ is 2, each head looks at 2 dimensions.": "Multi-Head-Attention teilt den Hauptvektor in $h$ parallele „Blickwinkel“. Ist $d_{\\text{model}}$ 4 und $h$ 2, betrachtet jeder Head 2 Dimensionen.",
		"Network Depth ($N$ layers):": "Netz-Tiefe ($N$ Schichten):",
		"How many transformer blocks are stacked. More layers allow more abstract reasoning.": "Wie viele Transformer-Blöcke gestapelt werden. Mehr Schichten erlauben abstrakteres Reasoning.",
		"Context Size:": "Kontextgröße:",
		"Effect:": "Wirkung:",
		"Sets the maximum number of tokens the model can “see” at once during training and inference.": "Legt die maximale Zahl an Tokens fest, die das Modell während Training und Inferenz auf einmal „sieht“.",
		"A larger context window lets the model capture longer-range dependencies, but the attention score matrix has size $\\text{Context}^2$, so a full forward pass costs quadratically in": "Ein größeres Kontextfenster erlaubt weiter reichende Abhängigkeiten, aber die Attention-Score-Matrix hat die Größe $\\text{Context}^2$; ein voller Vorwärtspass kostet also quadratisch in",
		"avoids recomputing past keys and values during generation — it lowers per-step work and trades it for linear memory — but it does not make attention sub-quadratic.": "vermeidet das Neuberechnen vergangener Keys und Values während der Generierung: Es senkt die Arbeit pro Schritt und tauscht sie gegen linearen Speicher, macht Attention aber nicht subquadratisch.",
		"Tokenizer:": "Tokenizer:",
		"Words (Non-Alphanumeric Split)": "Wörter (nicht-alphanumerisch getrennt)",
		"Byte-Pair Encoding (BPE)": "Byte-Pair-Encoding (BPE)",
		"Show Parameter Breakdown": "Parameter-Aufschlüsselung zeigen",
		"Training Data (Corpus):": "Trainingsdaten (Korpus):",
		"Epochs": "Epochen",
		"Learning Rate": "Lernrate",
		"Optimizer": "Optimizer",
		"Adam": "Adam",
		"SGD": "SGD",
		"RMSProp": "RMSProp",
		"An adaptive optimizer that gives every parameter its own learning rate based on the history of its gradients.": "Ein adaptiver Optimizer, der jedem Parameter eine eigene Lernrate auf Basis der Gradientenhistorie gibt.",
		"Stochastic Gradient Descent, gradient descent performed on small random batches of data rather than the full dataset.": "Stochastic Gradient Descent: Gradientenabstieg auf kleinen zufälligen Datenbatches statt auf dem gesamten Datensatz.",
		"Root Mean Square Propagation, adapts the learning rate per parameter using a moving average of recent squared gradients, which keeps updates stable even when gradients vary wildly in magnitude.": "Root Mean Square Propagation: passt die Lernrate pro Parameter über einen gleitenden Mittelwert der letzten quadrierten Gradienten an, was Updates auch bei stark schwankenden Gradienten stabil hält.",
		"Train Model": "Modell trainieren",
		"Stop Training": "Training stoppen",
		"Show training windows": "Trainingsfenster zeigen",
		"Current Training Windows:": "Aktuelle Trainingsfenster:",
		"Training Complete!": "Training abgeschlossen!",
		"Training Stopped.": "Training gestoppt.",
		"Perform math on the current vocabulary tokens to see how concepts align in the dynamic vector space.": "Rechne mit den Tokens des aktuellen Vokabulars, um zu sehen, wie Konzepte im dynamischen Vektorraum zueinander liegen.",
		"Enter an equation and press Enter...": "Gib eine Gleichung ein und drücke Enter …",
		"Temperature ($T$):": "Temperatur ($T$):",
		"Controls the “sharpness” of the probability distribution.": "Steuert die „Schärfe“ der Wahrscheinlichkeitsverteilung.",
		"Low values ($T < 1$) force the model to be deterministic; high values ($T > 1$) increase diversity by making unlikely words more probable.": "Kleine Werte ($T < 1$) machen das Modell deterministischer; große Werte ($T > 1$) erhöhen die Vielfalt, indem unwahrscheinliche Wörter wahrscheinlicher werden.",
		"Input (Inference):": "Eingabe (Inferenz):",
		"Parameters": "Parameter",
		"Parameter count": "Parameteranzahl",
		"Embedding": "Embedding",
		"Attention": "Attention",
		"FFN": "FFN",
		"Norm": "Norm",
		"Total": "Gesamt",
		"Window": "Fenster",
		"Expected vs Predicted:": "Erwartet vs. vorhergesagt:",
		"Target:": "Ziel:",
		"Predicted:": "Vorhergesagt:",
		"🧭 TDA Live, Attractors in the Residual Stream": "🧭 TDA live, Attraktoren im Residual Stream",
		"Controls": "Steuerung",
		"Residual stream": "Residual Stream",
		"Weight deltas (ΔW)": "Gewichts-Deltas (ΔW)",
		"Weights (W)": "Gewichte (W)",
		"3D (drag to rotate)": "3D (ziehen zum Drehen)",
		"Auto (native / PCA)": "Auto (nativ / PCA)",
		"Force PCA": "PCA erzwingen",
		"Native dims": "Native Dimensionen",
		"Slice dims (choose axes)": "Dimensions-Schnitt (Achsen wählen)",
		"axes": "Achsen",
		"Layer:": "Schicht:",
		"Token": "Token",
		"Layer": "Schicht",
		"Density (attractor)": "Dichte (Attraktor)",
		"Flow magnitude": "Flussstärke",
		"Solo point (phase map)": "Einzelpunkt (Phasenkarte)",
		"In context (sentence)": "Im Kontext (Satz)",
		"Vector field": "Vektorfeld",
		"Streamlines": "Stromlinien",
		"Epoch trails": "Epochen-Spuren",
		"Attractor / repeller": "Attraktor / Repeller",
		"Basins (2D)": "Einzugsgebiete (2D)",
		"Attention flow": "Attention-Fluss",
		"Auto-update": "Auto-Update",
		"Grid": "Raster",
		"Eps steps": "Eps-Schritte",
		"History": "Verlauf",
		"⟳ Recompute": "⟳ Neu berechnen",
		"↺ Trace from now": "↺ Ab jetzt verfolgen",
		"Clear history": "Verlauf löschen",
		"Explainer (live, updated by tda_live.js)": "Erklärung (live, von tda_live.js aktualisiert)",
		"Stats": "Statistik",
		"Legend": "Legende",
		"Main phase space": "Haupt-Phasenraum",
		"Attractor & repeller emergence across layers": "Entstehung von Attraktoren und Repellern über die Schichten",
		"Persistence diagram, shape of attractors (H₀ red, H₁ blue)": "Persistenzdiagramm, Form der Attraktoren (H₀ rot, H₁ blau)",
		"Persistence barcode": "Persistenz-Barcode",
		"Betti curves β₀ / β₁ over scale ε": "Betti-Kurven β₀ / β₁ über Skala ε",
		"Topology by layer, β₀ / β₁": "Topologie pro Schicht, β₀ / β₁",
		"Learning field, ‖ΔW‖ per matrix (weight deltas)": "Lernfeld, ‖ΔW‖ pro Matrix (Gewichts-Deltas)",
		"How to read the phase diagram": "Wie du das Phasendiagramm liest"
	};

	var RE = [
		[/^Epoch (\d+): Loss = ([\d.]+) \| ETA: ([\d:]+)$/, "Epoche $1: Fehler = $2 | Restzeit: $3"],
		[/^Parameters: ([\d,]+)$/, "Parameter: $1"],
		[/^Window (\d+):$/, "Fenster $1:"],
		[/^Epoch (\d+)$/, "Epoche $1"],
		[/^Loss: ([\d.]+)$/, "Fehler: $1"]
	];

	function norm(value) { return String(value).replace(/\s+/g, " ").trim(); }
	function skip(el) {
		return !el || !el.closest || el.closest("script,style,code,pre,textarea,math,[data-tex],[data-no-i18n],.no-i18n");
	}
	function translateTextNode(node) {
		var raw = node.nodeValue;
		if (!raw || !/\S/.test(raw)) return;
		var match = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
		if (!match) return;
		var key = norm(match[2]);
		if (MAP[key] != null) { node.nodeValue = match[1] + MAP[key] + match[3]; return; }
		for (var i = 0; i < RE.length; i++) {
			if (RE[i][0].test(key)) {
				node.nodeValue = match[1] + key.replace(RE[i][0], RE[i][1]) + match[3];
				return;
			}
		}
	}
	function translateAttrs(el) {
		if (skip(el)) return;
		["aria-label", "title", "placeholder", "alt"].forEach(function (name) {
			if (!el.hasAttribute(name)) return;
			var value = el.getAttribute(name);
			var key = norm(value);
			if (MAP[key] != null) el.setAttribute(name, MAP[key]);
			else {
				for (var i = 0; i < RE.length; i++) {
					if (RE[i][0].test(key)) { el.setAttribute(name, key.replace(RE[i][0], RE[i][1])); break; }
				}
			}
		});
	}
	function walk(el) {
		if (!(el instanceof Element) || skip(el)) return;
		translateAttrs(el);
		for (var child = el.firstChild; child; child = child.nextSibling) {
			if (child.nodeType === 3) translateTextNode(child);
			else if (child.nodeType === 1) walk(child);
		}
	}
	function watch(id) {
		var el = document.getElementById(id);
		if (!el || !window.MutationObserver) return;
		new MutationObserver(function () { walk(el); }).observe(el, {
			childList: true, subtree: true, characterData: true
		});
	}
	function start() {
		walk(document.body);
		[
			"training-status", "show_training_sentences", "current_training_sentence",
			"nr_params", "param-breakdown-table", "transformer-vector-math-result"
		].forEach(watch);
		var btn = document.querySelector(".train-btn");
		if (btn && window.MutationObserver) {
			new MutationObserver(function () { walk(btn); }).observe(btn, {
				childList: true, subtree: true, characterData: true
			});
		}
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
	else start();
	[400, 1200, 2600, 5000].forEach(function (ms) { setTimeout(function () { walk(document.body); }, ms); });
})();
