<?php
	include('function.php');

	if(array_key_exists("session_id", $_GET)) {
		$session_id = $_GET["session_id"];
		print get_user_id_from_session_id($session_id);
	}
?>
