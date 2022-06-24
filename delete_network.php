<?php
	include('functions.php');

	$id = "";
	if(array_key_exists("id", $_GET)) {
		$id = $_GET["id"];
		if(can_edit_models(get_user_id_from_model_id($id))) {
			if($id == "") {
				print "This network doesn't exist.";
			} else {
				$user_id = get_user_id_from_session_id($_COOKIE["session_id"]);
				delete_model($id, $user_id);
			}
		} else {
			print "You don't have the permission to delete.";
		}
	} else {
		print "Network name doesn't exist.";
	}
?>
