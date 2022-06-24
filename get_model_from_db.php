<?php 
	include('functions.php');

	if(array_key_exists("session_id", $_COOKIE)) {
		$user = get_user_id_from_session_id($_COOKIE["session_id"]);
		if(is_null($user)) {
			print "User doesn't exist.";
		} else {
			if(array_key_exists("id", $_GET)) {
				$id = $_GET["id"];
				$user_id = get_user_id_from_session_id($_COOKIE["session_id"]);
				$query = "select model_structure from model where ((is_public = true and reviewed = true) or user_id = ".esc($user_id).") and id = ".esc($id);
				$doc = get_single_value_from_query($query);
				print $doc;
			} else {
				print "No id given.";
			}
		}
	} else {
		print "You are not logged in.";
	}
?>
