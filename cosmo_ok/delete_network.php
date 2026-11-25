<?php
	include('functions.php');

	if(!array_key_exists("id", $_GET)) {
		print "No id given.";
		exit(1);
	}

	$model_id = $_GET["id"];

	$model_is_public = model_is_public($model_id);
	$user_id = get_user_id_from_session_id($_COOKIE["session_id"]);
	$user_is_admin = is_admin() ? 1 : 0;
	$can_edit_model = can_edit_model($model_id);

	if(!($model_is_public || $can_edit_model)) {
		if(!$model_is_public && $can_edit_model) {
			print "Model is not public, but you can edit it. So you are allowed to see it.";
		} else if ($model_is_public && !$can_edit_model) {
			print "Model is public, but you cannot edit it";
		} else if (!$model_is_public && !$can_edit_model) {
			print "Model is not public, you cannot edit it";
		}
		exit(2);
	}


	if(delete_model($model_id)) {
		print "Model was deleted.";
	} else {
		print "Deleting the model failed.";
	}
?>
