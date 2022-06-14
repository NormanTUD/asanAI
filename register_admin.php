<?php
    $GLOBALS["use_db"] = 0;
	if(file_exists('/etc/dbpw')) {
		try {
			$GLOBALS['password'] = trim(file_get_contents('/etc/dbpw'));
			$GLOBALS['mysqli'] = new mysqli("localhost", "root", $GLOBALS['password']);
			if($GLOBALS['mysqli']->connect_errno) {
				throw new Exception("Verbindung fehlgeschlagen: " . $GLOBALS['mysqli']->connect_error);
			}
			$GLOBALS["use_db"] = 1;
			if (!mysqli_select_db($GLOBALS["mysqli"], "tfd_db")){
				$sql = "CREATE DATABASE tfd_db";
				if (run_query($sql) === TRUE) {
					mysqli_select_db($GLOBALS["mysqli"], "tfd_db");
					load_sql_file_get_statements("tfd.sql");

				} else {
					echo "Error creating database: " . $GLOBALS['mysqli']->error;
					$GLOBALS["use_db"] = 0;
				}
			}
		} catch (Exception $e) {
			error_log($e);
		}
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

    function admin_exists() {
		return !!get_single_value_from_query("select count(*) from tfd_db.login where role_id = 1");
	}

    function get_single_value_from_query ($query, $default = NULL) {
		$result = run_query($query);
		$return_value = $default;
		while ($row = $result->fetch_row()) {
			$return_value = $row[0];
		}
		return $return_value;
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

    function esc ($string) {
		if(!$GLOBALS["mysqli"]) {
			$GLOBALS["use_db"] = 0;
			return;
		}
		return "'".$GLOBALS["mysqli"]->real_escape_string($string)."'";
	}

    $status["status"] = "error";

    if(!admin_exists()) {
        if(array_key_exists("email", $_GET) && ($_GET["email"] != "")) {
            $email = $_GET["email"];
            if($email.preg_match("/^.*@.*\..*/")) {
                if(array_key_exists("admin_name", $_GET) && ($_GET["admin_name"] != "")) {
                    $name = $_GET["admin_name"];
                    if(array_key_exists("password", $_GET) && (strlen($_GET["password"]) > 7)) {
                        $password = $_GET["password"];
                        $salt = generateRandomString();
                        $query = "insert into tfd_db.login (username, email, pw, salt, role_id) 
                            values (".esc($name).", ".esc($email).", 
                            ".esc(hash("sha256", $password.$salt)).", ".esc($salt).", 1)";
                        if(run_query($query)) {
                            $status = [ "status" => "ok", "msg" => "You are now the admin." ];
                        } else {
                            $status["msg"] = "Something went wrong making you admin.";
                        }
                    } else {
                        $status["msg"] = "Password not provided or too short.";
                    }
                } else {
                    $status["msg"] = "Username is missing.";
                }
            } else {
                $status["msg"] = "Email is not valid.";
            }
        } else {
            $status["msg"] = "Email is missing.";
        }
    } else {
        $status["msg"] = "Admin already exists.";
    }

    header('Content-type: application/json');
    print json_encode($status);
?>