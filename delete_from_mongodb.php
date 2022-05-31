<?php
	include("functions.php");
	if(array_key_exists("session_id", $_COOKIE)) {

		$user = get_user_id_from_session_id($_COOKIE["session_id"]);
		if(is_null($user)) {
			print "User doesn't exist.";
		} else {
			$filters = [
				'$and' => [
					['_id' => new MongoDB\BSON\ObjectID($_GET["id"])]
				]
			];

			$options = array(
				"category" => true,
				"network_name" => true
			);

			$results = find_mongo("tfd.models", $filters, $options);

			if($results[0]["user"] == $user) {
				delete_mongo_models($_GET["id"]);
			} else {
				print "You do not own this model. You cannot delete models you don't own";
			}
		}
	} else {
		print "You are not logged in.";
	}
?>
