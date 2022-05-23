<?php
	// await model.save('http://localhost/tf/upload.php?name=TEST&category=catTEST');
	include("functions.php");
	#dier($_FILES);

	if(array_key_exists("category", $_GET)) {
		if(array_key_exists("name", $_GET)) {
			$data["name"] = $_GET["name"];
			$data["category"] = $_GET["category"];

			if(array_key_exists("model_json", $_FILES)) {
				if(array_key_exists("model_weights_bin", $_FILES)) {
					$data["model_json"] = file_get_contents($_FILES["model_json"]["tmp_name"]);
					$data["model_weights_bin"] = base64_encode(file_get_contents($_FILES["model_weights_bin"]["tmp_name"]));

					print(json_encode($data));
				} else {
					dier("model_weights_bin does not exist");
				}
			} else {
				dier("model_json does not exist");
			}
		} else {
			dier("GET-param name not found");
		}
	} else {
		dier("GET-param category not found");
	}
?>
