<?php
	//login in existing account
	include('functions.php');

	$status = ["status" => "error", "msg" => "Missing information"];
	if(array_key_exists("username", $_GET) && array_key_exists("pw", $_GET)) {
		if($_GET["username"] != "" && $_GET["pw"] != "") {
			$username = $_GET["username"];
			$password = $_GET["pw"];
			$hash_password = esc(hash("sha256", $password.get_single_value_from_query('select salt from login where username = '.esc($username))));
			if(get_single_value_from_query('select username from tfd_db.login where username = '.esc($username).' and pw = '.$hash_password)) {
				if($hash_password == esc(get_single_value_from_query('select pw from tfd_db.login where username = '.esc($username)))) {
					if(array_key_exists("days", $_GET) && is_numeric($_GET["days"])) {
						$days = $_GET["days"];
						insert_session_id($username, $days);
						$session_id = get_session_id($username);
						$status = [
							"status" => "ok",
							"msg" => "Login successful ",
							"username" => $username,
							"session_id" => $session_id,
							"time" => get_expiry_date($session_id),
							"user_id" => get_user_id($username)
						];
					}
				}
			} else {
				$status = ["status" => "error", "msg" => "Login failed."];
			}
		} else {
			$status = ["status" => "error", "msg" => "Type in a username and password."];
		}
	} else {
		$status = ["status" => "error", "msg" => "Missing Information."];
	}

	header('Content-Type: application/json');
	print json_encode($status);
?>
