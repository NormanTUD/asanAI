<?php
	$file = $_GET["file"];

	if(file_exists($file)) {
		if(preg_match("/^[\/\.a-zA-Z0-9-_]+\.js$/", $file)) {
			header('Cache-Control: max-age=86400');
			header("Content-Type: application/javascript");
			system("./minify/minify/bin/minifyjs $file");
		} else if(preg_match("/^[\/\.a-zA-Z0-9-_]+\.css$/", $file)) {
			header('Cache-Control: max-age=86400');
			header("Content-Type: text/css");
			$css = file_get_contents($file);
			$css = preg_replace(
				array('/\s*(\w)\s*{\s*/','/\s*(\S*:)(\s*)([^;]*)(\s|\n)*;(\n|\s)*/','/\n/','/\s*}\s*/'),
				array('$1{ ','$1$3;',"",'} '),
				$css
			);
			print($css);
		} else {
			die("Neither css nor js");
		}
	}
?>
