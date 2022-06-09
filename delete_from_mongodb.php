<?php
			/*
				$options= [
				    'skip' => 20,
				    'limit' => 20,
				    'batchSize' => 20   
				];

				$filter= [
				'_id' => '5a8adcf335f6d112d00e46c8'
				];

				$query= new MongoDB\Driver\Query($filter, $options);
			 */
	include("functions.php");




	if(array_key_exists("session_id", $_COOKIE)) {

		$user = get_user_id_from_session_id($_COOKIE["session_id"]);
		if(is_null($user)) {
			print "User doesn't exist.";
		} else {
			$filters = ['_id' => new MongoDB\BSON\ObjectID($_GET["id"])];
			$options = [
				'projection' => ['_id' => 1]
			];

			$query = new MongoDB\Driver\Query($filters, $options);
			$cursor = $manager->executeQuery('tfd.models', $query);
			dier($cursor->toArray());

			// alter code ab hier:
			$results = find_mongo("tfd.models", $filters, $options);
			dier($results);

			if(array_key_exists("user_id", $_GET)) {
				if(array_key_exists(0, $results)) {
					delete_mongo_models($_GET["id"], $_GET["user_id"]);
					print "A model was found.";
				} else {
					print "No model found by the given ID -- OR -- you do not own this model. You cannot delete models you don't own";
				}
			} else {
				print "User is missing.";
			}
		}
	} else {
		print "You are not logged in.";
	}
?>
