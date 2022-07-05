<?php
	include('functions.php');

	$model_id = "";
	if(array_key_exists("id", $_GET)) {
		$model_id = $_GET["id"];
		if(can_edit_model($model_id)) {
			if($model_id == "") {
				print "This network doesn't exist.";
			} else {
				$user_id = get_user_id_from_session_id($_COOKIE["session_id"]);
				if(delete_model($model_id)) {
					print "Model was deleted.";
				} else {
					print "Deleting the model failed.";
				}
			}
		} else {
			print "You don't have the permission to delete.";
		}
	} else {
		print "Network name doesn't exist.";
	}
?>
