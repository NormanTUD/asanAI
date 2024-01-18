<?php
	header('Content-Type: application/javascript');

	$class_test = file_get_contents("class_test.html");

	$class_test_split = preg_split("/\r\n|\n|\r/", $class_test);

	foreach ($class_test_split as $ct_line) {
		if(preg_match('/script src=["\']([^"\']*?)["\']/', $ct_line, $matches)) {
			$fn = $matches[1];
			if(file_exists($fn)) {
				print file_get_contents($fn)."\n\n";
			} else {
				die("$fn could not be found!");
			}
		}
	}
?>
