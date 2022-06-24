<?php
    include('functions.php');

	if(array_key_exists("id", $_GET)) {
		$model_id = $_GET["id"];
		if(model_is_public($model_id) || can_edit_model(get_user_from_model_id($model_id), $model_id)) {
			$user = get_user_id_from_session_id($_COOKIE["session_id"]);
			if(is_null($user)) {
				print "User doesn't exist.";
			} else {
				print get_single_value_from_query("select model_weights from model where id = ".esc($model_id)." and ((is_public = true and reviewed = true) or user_id = ".esc($user).")");
			}
		} else {
			print "You don't have the permission.";
		}
	} else {
		print "No id given.";
	}
?>
