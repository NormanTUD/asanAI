<?php
	try {
		$data = [
			[
				'heading' => 'Beispielüberschrift',
				'list' => [
					'<a target="_blank" href="https://google.de">Element 1</a>',
					'Element 2',
					'Element <strong>3</strong>',
					'Mathematische Formel: <span class="temml_me">\\frac{a}{b}</span>'
				],
				"html" => "hallo <i>welt</i>"
			],
			[
				'heading' => 'Zweite Überschrift',
				'list' => [
					'Zweites Element 1',
					'Zweites Element 2',
					'Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
	
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere Formel: <span class="temml_me">\\int_0^1 x^2 dx</span>',
					'ENDE'
				]
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
