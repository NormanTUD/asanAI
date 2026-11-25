<?php
	include("functions.php");

	$status = [ "status" => "error", "msg" => "Something went wrong while saving the model" ];
	if(array_key_exists("session_id", $_COOKIE)) {
		$user = get_user_id_from_session_id($_COOKIE["session_id"]);
		if(is_null($user)) {
			$status["msg"] = "User doesn't exist.";
		} else {
			if(array_key_exists("model_id", $_POST)) {
				$model_id = $_POST["model_id"];
				if(array_key_exists("data", $_POST)) {
					$data = $_POST["data"];
					if(save_to_training_db($model_id, $data)) {
						$status = [ "status" => "ok", "msg" => "Saving data was successful." ];
					} else {
						$status["msg"] = "Failed to save to the DB.";
					}
				} else {
					$status["msg"] = "No data given";
				}
			} else {
				$status["msg"] = "No model ID given";
			}
		}
	} else {
		$status["msg"] = "You are not logged in.";
	}

	header('Content-Type: application/json');
	print json_encode($status);

?>
