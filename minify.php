<?php
	$file = $_GET["file"];

	if(file_exists($file)) {
		if(preg_match("/^[\/\.a-zA-Z0-9-_]+\.js$/", $file)) {
			header("Content-Type: application/javascript");
			system("./minify/minify/bin/minifyjs $file");
		} else if(preg_match("/^[\/\.a-zA-Z0-9-_]+\.css$/", $file)) {
			system("./minify/minify/bin/minifycss $file");
		} else {
			die("Neither css nor js");
		}
	}
?>
