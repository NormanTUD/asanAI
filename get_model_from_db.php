<?php 
	include('functions.php');

	if(array_key_exists("session_id", $_COOKIE)) {
		$user = get_user_id_from_session_id($_COOKIE["session_id"]);
		if(is_null($user)) {
			print "User doesn't exist.";
		} else {
			if(array_key_exists("id", $_GET)) {
				$id = $_GET["id"];
				$query = "select json from model where (is_public = true or user_id = ".esc($id).") and id = ".esc($id);
				$doc = get_single_value_from_query($query);
				print json_encode($doc);
			} else {
				print "No id given.";
			}
		}
	} else {
		print "You are not logged in.";
	}
?>
