<?php 
	include('functions.php');

	$user = get_user_id_from_session_id($_COOKIE["session_id"]);
	if(array_key_exists("id", $_GET)) {
		$id = $_GET["id"];
		$user_id = get_user_id_from_session_id($_COOKIE["session_id"]);
		$is_admin = is_admin() ? 1 : 0;
		$query = "select model_structure from model where (((is_public = true and reviewed = true) or user_id = ".esc($user_id).") or $is_admin) and id = ".esc($id);
		$doc = get_single_value_from_query($query);
		print $doc;
	} else {
		print "No id given.";
	}
?>
