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
				position: absolute;
				bottom: 0px;
				height: 100px;
				width: 100%;
				margin: 0;
				padding: 0;
				background-color: red;
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
				margin: 12vw;
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
		include("1.php");
		include("1.php");
		include("1.php");
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
		}

		$(document).ready(function() {
			set_page_footer();
		});
	</script>
</html>
