<?php
	include("functions.php");

	if(array_key_exists("session_id", $_COOKIE)) {

		if(array_key_exists("id", $_GET)) {
			$id = $_GET["id"];
			$user = get_user_id_from_session_id($_COOKIE["session_id"]);
			if(is_null($user)) {
				print "User doesn't exist.";
			} else {
				if(preg_match('/^[0-9a-f]{24}$/', $id)) {
					$filters = ['_id' => new MongoDB\BSON\ObjectID($id)];
					$options = [
						'projection' => ['_id' => 1]
					];
		
					$results = find_mongo("tfd.models", $filters, $options);
					if(array_key_exists("user_id", $_GET)) {
						if(array_key_exists(0, $results)) {
							if(delete_mongo_models($_GET["id"], $_GET["user_id"])) {
								print "A model was found.";
							} else {
								print "You can not edit this model.";
							}
						} else {
							print "No model found by the given ID -- OR -- you do not own this model. You cannot delete models you don't own";
						}
					} else {
						print "User is missing.";
					}
				} else {
					print "The id of the model is not valid.";
				}
			}
		} else {
			print "You need to choose a model.";
		}

	} else {
		print "You are not logged in.";
	}
?>
