<?php
	function generateHTMLFromDataArray($dataArray) {
		if (!is_array($dataArray)) {
			throw new InvalidArgumentException("Invalid input provided. Expected an array.");
		}

		$html = "";

		foreach ($dataArray as $data) {
			$html .= "<div class='folie' style='display: none'>";
			if (!isset($data['heading']) || !isset($data['list']) || !is_array($data['list'])) {
				throw new InvalidArgumentException("Invalid structure for page data. Each item must have 'heading' and 'list'.");
			}

			$html .= "<h3>" . htmlspecialchars($data['heading']) . "</h3>\n";

			if (empty($data['list'])) {
				if(empty($data["html"])) {
					$html .= "<p>No items in the list.</p>\n";
				}
			} else {
				$html .= "<ul>\n";
				foreach ($data['list'] as $item) {
					$html .= "  <li>" . $item . "</li>\n";
				}
				$html .= "</ul>\n";
			}
			$html .= "<p>".$data["html"]."</p>\n";

			$html .= "</div>";
		}

		return $html;
	}

	// Beispiel für die Verwendung der Funktion
	try {
		$data = [
			[
				'heading' => 'Beispielüberschrift',
				'list' => [
					'Element 1',
					'Element 2',
					'Element <strong>3</strong>',
					'Mathematische Formel: $\\frac{a}{b}$'
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
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere <em>Betonung</em>',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'Weitere Formel: $\\int_0^1 x^2 dx$',
					'ENDE'
				]
			]
		];

		$htmlOutput = generateHTMLFromDataArray($data);
	} catch (Exception $e) {
		echo "An error occurred: " . $e->getMessage();
	}
?>
<html>
	<head>
		<style>
			body {
				margin: 0;
				padding: 0;
				font-family: sans-serif;
				color: #00305e;
			}

			li::marker {
				color: #51b02f;
			}

			#footer {
				position: fixed;
				bottom: 0px;
				height: 100px;
				width: 100%;
				margin: 0;
				padding: 0;
				background-color: white;
				box-shadow: 0px -2px 0px 0px #888888; /* X-Offset, Y-Offset, Blur-Radius, Spread-Radius, Farbe */
			}

			#backgrounds {
				position: fixed; /* oder absolute, je nach Bedarf */
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				overflow: hidden; /* Dies wird beibehalten, um sicherzustellen, dass Überläufe nicht sichtbar sind */
			}

			#bubble_background {
				position: absolute;
				width: 50em;
				top: 11%;
				left: 104%;
				transform: translate(-50%, -50%);
				padding-left: 0;
				min-width: 100px;
				max-width: 500px;
			}

			#topleft_background {
				position: absolute;
				left: 0px;
				top: 0px;
			}

			.folie {
				margin: max(120px, 12vw);
			}

			.footer_logo {
				max-width: 80%;
			}

			.a_fifth {
				width: 20%;
				text-align: center;
			}
		</style>
		<script src='../libs/jquery.js' crossorigin></script>
	</head>
	<body>
		<div id="backgrounds">
			<img id="topleft_background" src="new_graphics/topleft_design.png" />
			<img id="bubble_background" src="new_graphics/Loops_Bubble_2.png" />
		</div>
<?php
		echo $htmlOutput;
?>
		<div id="footer">
			<table style='width: 100%'>
				<tr>
					<td class="a_fifth"><img class="footer_logo" src="new_graphics/logo/ScaDSAI_logo.png"></td>
					<td class="a_fifth"><div id="shorttitle"></div></td>
					<td class="a_fifth"><span id="page_nr">1</span>/<span id="max_page_nr">1</span></td>
					<td class="a_fifth"><img class="footer_logo" src="new_graphics/logo/TU_Dresden_Logo_blau_HKS41.png"></td>
					<td class="a_fifth"><img class="footer_logo" src="new_graphics/logo/UniLeipzig-Logo-Neu_clean.png"></td>
				</tr>
			</table>
		</div>
	</body>

	<script>
		function get_max_page () {
			return $(".folie").length;
		}

		function set_page_footer () {
			var max_page = get_max_page();

			$("#max_page_nr").html(max_page);

			$("#page_nr").html(get_current_page() + 1);
		}

		function get_current_page() {
			var page_id = null;
			$(".folie").each(function (i, e) { 
				if($(e).is(":visible")) {
					page_id = i;
				}
			});

			return page_id;
		}

		function show_folie_nr(i)  {
			$(".folie").hide();

			if(i < 0) {
				i = 0;
			}

			if(i >= get_max_page()) {
				i = 0;
			}

			if($($(".folie")[i]).length) {
				$($(".folie")[i]).show()
			} else {
				console.error(`Invalid i for show_folie_nr: ${i}`);
			}
		}

		function show_prev_folie() {
			var current = get_current_page();

			show_folie_nr(current - 1);

			set_page_footer();
		}

		function show_next_folie() {
			var current = get_current_page();

			show_folie_nr(current + 1);

			set_page_footer();
		}

		// Funktion zur Behandlung von Tastendrücken
		function handleKeyPress(event) {
			// Prüfen, welche Taste gedrückt wurde
			switch (event.key) {
			case "ArrowRight":
				show_next_folie();
				break;
			case "ArrowLeft":
				show_prev_folie();
				break;
			default:
				// Nichts tun, wenn andere Tasten gedrückt werden
				break;
			}
		}

		// Funktion zur Behandlung von Mausklicks
		function handleMouseClick(event) {
			show_next_folie();
		}

		// Event-Listener für Tastendrücke
		document.addEventListener("keydown", handleKeyPress);

		// Event-Listener für Mausklicks
		document.addEventListener("click", handleMouseClick);

		$(document).ready(function() {
			show_folie_nr(0)
			set_page_footer();
		});
	</script>
</html>
