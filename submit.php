<?php
	include_once("functions.php");

	if(array_key_exists("model_json", $_FILES)) {
		if(array_key_exists("model_json", $_FILES)) {
			$model_json_content = file_get_contents($_FILES["model_json"]["tmp_name"]);
			$model_weights_bin_content = file_get_contents($_FILES["model_weights_bin"]["tmp_name"]);
			dier($_FILES);
		} else {
			die("model_weights_bin not in files");
		}
	} else {
		die("model_json not in files");
	}
?>
