<html>
	<head>
		<style>
			body {
				margin: 0;
				padding: 0;
				font-family: sans-serif;
				color: #00305e;
				background-image: url(Graphics/Bubbles2.svg);
				background-repeat: no-repeat;
				background-position-x: 110%;
				background-position-y: -10em;
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
			
		</style>
	</head>
	<body>
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
