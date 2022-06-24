<?php
	include('functions.php');

	if(array_key_exists("id", $_GET)) {
		$model_id = $_GET["id"];
		if(model_is_public($model_id) || can_edit_model(get_user_id_from_session_id($_COOKIE["session_id"]), $model_id)) {
			$query = "select data from training_data where model_id = ".esc($model_id);
			print get_single_value_from_query($query);
		} else {
			print "You don't have the permission to see this model.";
		}
	} else {
		print "No id given.";
	}
?>
