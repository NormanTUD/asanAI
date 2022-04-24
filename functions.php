<?php
	$GLOBALS["use_db"] = 0;
	try {
		$GLOBALS['password'] = trim(file_get_contents('/etc/dbpw'));
		$GLOBALS['mysqli'] = new mysqli("localhost", "root", $GLOBALS['password']);
		if($GLOBALS['mysqli']->connect_errno) {
			throw new Exception("Verbindung fehlgeschlagen: " . $GLOBALS['mysqli']->connect_error);
		}
		if (!mysqli_select_db($GLOBALS["mysqli"], "tfd_db")){
			$sql = "CREATE DATABASE tfd_db";
			$GLOBALS["use_db"] = 1;
			if (run_query($sql) === TRUE) {
				mysqli_select_db($GLOBALS["mysqli"], "nachweis_db");
				load_sql_file_get_statements("nachweis.sql");
			} else {
				echo "Error creating database: " . $GLOBALS['mysqli']->error;
				$GLOBALS["use_db"] = 0;
			}
		}
	} catch (Exception $e) {
		error_log($e);
	}

	function run_query ($query) {
		$start_time = microtime(true);
		$result = $GLOBALS['mysqli']->query($query);
		if($result === false) {
			dier("Query failed:\n$query\nError:\n".$GLOBALS["mysqli"]->error);
		}
		$end_time = microtime(true);
		$bt = debug_backtrace();
		$caller = array_shift($bt);
		$GLOBALS["queries"][] = ["query" => $query, "runtime" => ($end_time - $start_time), "location" => $caller['file'].', '.$caller['line']];
		return $result;
	}

	function get_single_value_from_query ($query, $default = NULL) {
		$result = run_query($query);
		$return_value = $default;
		while ($row = $result->fetch_row()) {
			$return_value = $row[0];
		}
		return $return_value;
	}

	function esc ($string) {
		return "'".$GLOBALS["mysqli"]->real_escape_string($string)."'";
	}

	function generateRandomString($length = 50) {
		$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		$charactersLength = strlen($characters);
		$randomString = '';
		for ($i = 0; $i < $length; $i++) {
			$randomString .= $characters[rand(0, $charactersLength - 1)];
		}
		return $randomString;
	}

	function dier ($data, $enable_html = 0, $exception = 0) {
		$source_data = debug_backtrace()[0];
		@$source = 'Aufgerufen von <b>'.debug_backtrace()[1]['file'].'</b>::<i>'.debug_backtrace()[1]['function'].'</i>, line '.htmlentities($source_data['line'])."<br>\n";
		$print = $source;

		$print .= "<pre>\n";
		ob_start();
		print_r($data);
		$buffer = ob_get_clean();
		if($enable_html) {
			$print .= $buffer;
		} else {
			$print .= htmlentities($buffer);
		}
		$print .= "</pre>\n";

		$print .= "Backtrace:\n";
		$print .= "<pre>\n";
		foreach (debug_backtrace() as $trace) {
			$print .= htmlentities(sprintf("\n%s:%s %s", $trace['file'], $trace['line'], $trace['function']));
		}
		$print .= "</pre>\n";

		if(!$exception) {
			print $print;
			exit();
		} else {
			throw new Exception($print);
		}
	}

	function create_expiry_date($days) {
		$time = time();
		$timestamp = $days * 86400 + $time;
		return esc(date("y-m-d", $timestamp));
	}

	function get_user_id($username) {
		return get_single_value_from_query('select id from tfd_db.login where username ='.esc($_GET["username"]));
	}

	function get_session_id($username) {
		return get_single_value_from_query('select session_id from tfd_db.session_ids where user_id ='.get_user_id($username));
	}

	function insert_session_id($username, $days) {
		$session_id = generateRandomString();
		$query = 'insert into tfd_db.session_ids (user_id, session_id, expiry_date) values ('.get_user_id($username).', '.esc($session_id).','.create_expiry_date($days).')';
		run_query($query);
	}

	function get_expiry_date($username) {
		return get_single_value_from_query('select expiry_date from tfd_db.session_ids where user_id ='.get_user_id($username));
	}
?>
