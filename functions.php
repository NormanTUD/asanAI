<?php

    $GLOBALS['password'] = trim(file_get_contents('/etc/dbpw'));
    $GLOBALS['mysqli'] = new mysqli("localhost", "root", $GLOBALS['password']);
    if($GLOBALS['mysqli']->connect_errno) {
		die("Verbindung fehlgeschlagen: " . $GLOBALS['mysqli']->connect_error);
    }

    if (!mysqli_select_db($GLOBALS["mysqli"], "tfd_db")){
		$sql = "CREATE DATABASE tfd_db";
		if (run_query($sql) === TRUE) {
			mysqli_select_db($GLOBALS["mysqli"], "nachweis_db");
			load_sql_file_get_statements("nachweis.sql");
		} else {
			echo "Error creating database: " . $GLOBALS['mysqli']->error;
		}
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

    function dier ($data, $enable_html = 0) {
		$source_data = debug_backtrace()[0];
		@$source = 'Aufgerufen von <b>'.debug_backtrace()[1]['file'].'</b>::<i>'.debug_backtrace()[1]['function'].'</i>, line '.htmlentities($source_data['line'])."<br>\n";
		print $source;

		print "<pre>\n";
		ob_start();
		print_r($data);
		$buffer = ob_get_clean();
		if($enable_html) {
			print $buffer;
		} else {
			print htmlentities($buffer);
		}
		print "</pre>\n";

		print "Backtrace:\n";
		print "<pre>\n";
		foreach (debug_backtrace() as $trace) {
			print htmlentities(sprintf("\n%s:%s %s", $trace['file'], $trace['line'], $trace['function']));
		}
		print "</pre>\n";

		exit();
	}
?>