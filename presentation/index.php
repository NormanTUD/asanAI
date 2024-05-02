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

			#folie {
				margin: 12vw;
			}
		</style>
	</head>
	<body>
		<div id="backgrounds">
			<img id="topleft_background" src="new_graphics/topleft_design.png" />
			<img id="bubble_background" src="new_graphics/Loops_Bubble_2.png" />
		</div>
		<div id="folie">
<?php
			include("1.php");
?>
		</div>
		<div id="footer">
			footer
		</div>
	</body>
</html>
