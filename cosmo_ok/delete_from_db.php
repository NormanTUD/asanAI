<?php
	include("functions.php");

	if(array_key_exists("session_id", $_COOKIE)) {

		if(array_key_exists("id", $_GET)) {
			$id = $_GET["id"];
			$user = get_user_id_from_session_id($_COOKIE["session_id"]);
			if(is_null($user)) {
				print "User doesn't exist.";
			} else {
				if(is_admin() || get_user_id_from_model_id($id) == $user) {
					$query = "delete from model where id = ".esc($id);
					if(run_query($query)) {
						print "Successfully deleted";
					} else {
						print "NOT successfully deleted";
					}
				} else {
					print "You cannot edit this model";
				}
			}
		} else {
			print "You need to choose a model.";
		}

	} else {
		print "You are not logged in.";
	}
?>
