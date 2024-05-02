<?php
	try {
		$data = [
			[
				'heading' => 'Grobe Idee eines neuronalen Netzwerkes',
				'list' => [
					'Eine Funktion bildet Elemente einer Menge auf eine andere Menge ab.',
					'<span class="temml_me">f(x) = y</span>',
					'Mengen können alles beinhalten: Zahlen, Bilder, Personen, ...'
				]
			],
			[
				'heading' => 'Wie funktionieren künstliche Intelligenzen?',
				'list' => [
					'<span class="temml_me">f(</span>Katze<span class="temml_me">) = </span> Katze',
					'Neuronale Netze sind Funktionsapproximatoren'
				]
			],
			[
				'heading' => 'Einfaches Beispiel',
				'list' => [
					'Wir wollen die Funktion <span class="temml_me">f(x) = x + 1</span> approximieren. Dafür generieren wir einige Daten im CSV-Format:',
					"<pre>" .
					"Eingabe -> Ausgabe<br>" .
					"0 -> 1<br>" .
					"1 -> 2<br>" .
					"2 -> 3<br>" .
					"3 -> 4<br>" .
					"4 -> 5<br>" .
					"..." .
					"5 -> 6<br>" .
					"</pre>",
					"<pre>x -> x + 1</pre>",
					'Neuronale Netze sind Funktionsapproximatoren'
				]
			],
			[
				"heading" => "Ein Neuron",
				"list" => [
					
				],
				"html" => "Ein Neuron eines neuronalen Netzes. In Wahrheit führt es nur die Funktion <span class='temml_me'>f(X) = k * X + B</span> aus, während <span class='temml_me'>k</span> der Kernel und <span class='temml_me'>B</span> der Bias ist." .
					"<img style='width: -moz-available' src='presentation/ArtificialNeuronModel_deutsch.png' /><br>".
					"Mathematisch sieht das etwa so aus: <span class='temml_me'> \\text{Layer 0 (dense):} \\qquad h_{\\text{Shape: }[3]} = \\mathrm{\\underbrace{elu}_{\\mathrm{Activation}}}\\left(\\underbrace{\\begin{pmatrix}
x_{0}\\
x_{1}
\\end{pmatrix}}_{\\mathrm{Input}}
 \\times \\underbrace{\begin{pmatrix}
0.057 & -0.827 & -0.049\\\\
0.266 & -0.732 & -0.406
\\end{pmatrix}}_{\\mathrm{\\text{Gewichtungsmatrix}^{2 \\times 3}}}
 + \\underbrace{\\begin{pmatrix}
0 \\\\
0 \\\\
0
\\end{pmatrix}}_{\\mathrm{Bias}}
\\right)</span>"
			],
			[
				"heading" => "Fragen?",
				"html" => "Bei Fragen, wenden Sie sich an <a href='mailto:norman.koch@tu-dresden.de'>norman.koch@tu-dresden.de</a>."
			]
		];

		$htmlOutput = generateHTMLFromDataArray($data);
	} catch (Exception $e) {
		echo "An error occurred: " . $e->getMessage();
	}
?>

<div id="presentation" style="display: none">
	<div id="backgrounds">
		<img id="topleft_background" src="presentation/new_graphics/topleft_design.png" />
		<img id="bubble_background" src="presentation/new_graphics/Loops_Bubble_2.png" />
	</div>

	<div class="folie">
		<img src="presentation/new_graphics/logo/ScaDSAI_logo.png"><br>
		<h2 id="scads_title">Center for Scalable Data Analytics and Artificial Intelligence</h2><br><br>

		<span class="startseite_subtitles">
			<span class="scads_subtitle">Topic:</span> asanAI<br>
			<span class="scads_subtitle">Author:</span> Norman Koch
		</span>
	</div>
	<?php
		echo $htmlOutput;
	?>
	<div id="footer">
		<table style='width: 100%'>
			<tr>
				<td class="a_fifth"><img class="footer_logo" src="presentation/new_graphics/logo/ScaDSAI_logo.png"></td>
				<td class="a_fifth"><div id="shorttitle"></div></td>
				<td class="a_fifth"><span id="page_nr">1</span>/<span id="max_page_nr">1</span></td>
				<td class="a_fifth"><img class="footer_logo" src="presentation/new_graphics/logo/TU_Dresden_Logo_blau_HKS41.png"></td>
				<td class="a_fifth"><img class="footer_logo" src="presentation/new_graphics/logo/UniLeipzig-Logo-Neu_clean.png"></td>
			</tr>
		</table>
	</div>
</div>
