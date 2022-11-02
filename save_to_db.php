<?php
	include("functions.php");

	$status = [ "status" => "error", "msg" => "Something went wrong while saving the model" ];
	if(array_key_exists("session_id", $_COOKIE)) {
		$keys = ["model_structure", "model_weights", "model_data", "requests_public", "category_full", "network_name"];

		$data = array();
		foreach ($keys as $key) {
			if(array_key_exists($key, $_POST) && $_POST[$key]) {
				$data[$key] = $_POST[$key];
			} else {
				print "$key does not exist";
				exit(0);
			}
		}

		if(get_number_model_names($data["network_name"]) != 0) {
			$status["msg"] = "Model name already exists.";
			exit(0);
		}

		$user = get_user_id_from_session_id($_COOKIE["session_id"]);
		if(is_null($user)) {
			$status["msg"] = "User doesn't exist.";
		} else {
			$model_structure = $data["model_structure"];
			$model_weights = $data["model_weights"];
			$model_data = $data["model_data"];
			$is_public = $data["requests_public"];
			$category_full = $data["category_full"];
			$network_name = $data["network_name"];

			$new_id = save_to_db($model_structure, $model_weights, $model_data, $user, $is_public, $network_name);
			if($new_id) {
				$status = [ "status" => "ok", "msg" => "Saving data was successful.", "id" => $new_id ];
			} else {
				$status["msg"] = "Failed to save to the DB.";
			}
		}
	} else {
		$status["msg"] = "You are not logged in.";
	}

	header('Content-Type: application/json');
	print json_encode($status);

?>
