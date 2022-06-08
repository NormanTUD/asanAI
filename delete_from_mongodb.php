<?php
	include("functions.php");

	if(array_key_exists("session_id", $_COOKIE)) {

		$user = get_user_id_from_session_id($_COOKIE["session_id"]);
		if(is_null($user)) {
			print "User doesn't exist.";
		} else {
			$filters = [
				['_id' => new MongoDB\BSON\ObjectID($_GET["id"])]
			];

			$options = array(
				"category" => true,
				"network_name" => true
			);

			$results = find_mongo("tfd.models", $filters, $options);
			dier($results);

			if(array_key_exists(0, $results)) {
				delete_mongo_models($_GET["id"], $_GET["user_id"]);
			} else {
				print "No model found by the given ID -- OR -- you do not own this model. You cannot delete models you don't own";
			}
		}
	} else {
		print "You are not logged in.";
	}
?>
