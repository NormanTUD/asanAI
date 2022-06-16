<?php
	$GLOBALS["use_db"] = 0;
	include_once('php/mailerload.php');
	$GLOBALS['smtpuser'] = "scads";
	$GLOBALS['smtppass'] = "test123";
	$GLOBALS['smtphost'] = "scads";
	$GLOBALS["mysqli"] = null;
	if(file_exists('/etc/dbpw')) {
		try {
			$GLOBALS['password'] = trim(file_get_contents('/etc/dbpw'));
			$GLOBALS['mysqli'] = new mysqli("localhost", "root", $GLOBALS['password']);
			if($GLOBALS['mysqli']->connect_errno) {
				throw new Exception("Verbindung fehlgeschlagen: " . $GLOBALS['mysqli']->connect_error);
			}
			$GLOBALS["use_db"] = 1;
			DBCONNECT:
			try {
				mysqli_select_db($GLOBALS["mysqli"], "tfd_db");
			} catch (Exception $e) {
				$sql = "CREATE DATABASE tfd_db";
				if (run_query($sql) === TRUE) {
					mysqli_select_db($GLOBALS["mysqli"], "tfd_db");
					load_sql_file_get_statements("tfd.sql");

					goto DBCONNECT;
				} else {
					echo "Error creating database: " . $GLOBALS['mysqli']->error;
					$GLOBALS["use_db"] = 0;
				}
			}

			if($GLOBALS["use_db"]) {
				try {
					$listdatabases = new MongoDB\Driver\Command(["listCollections" => 1]);
					$res = $manager->executeCommand("mydatabasename", $listdatabases);
					$collections = current($res->toArray());
				} catch (throwable $e) {
					$GLOBALS["use_db"] = 1;
				}
			}
		} catch (Exception $e) {
			error_log($e);
		}
	}

	function get_number_model_names($name) {
		$filters = [];
	
		$options = ['projection' => ['network_name' => true]];
	
		$results = find_mongo("tfd.models", $filters, $options);
		$nr = 0;
	
		if(!is_null($results)) {
			foreach ($results as $doc) {
				if($name == $doc["network_name"]) {
					$nr++;
				}
			}
			return $nr;
		}
		return 0;
	}

	function show_admin_register() {
		if(!admin_exists()) {
			print "<!DOCTYPE html>\n<h1>Set Admin</h1>\n";
			print "<p>There is no admin yet. Please set an admin.</p>\n";
			print "<input id='admin_email' placeholder='email'>\n";
			print "<input id='admin_name' placeholder='username'>\n";
			print "<input id='admin_password' type='password' placeholder='password'>\n";
			print "<button onclick='set_admin()'>Save</button><br/><br/>\n";
			print "<span id='msg'></span>\n";

			print "<script src='jquery.js'></script>\n";
			//Daten mit ajax übertragen anstatt form

			print "<script>\n function set_admin() {
				var email = document.getElementById('admin_email').value;
				var name = document.getElementById('admin_name').value;
				var password = document.getElementById('admin_password').value;
				$.ajax({
					url: 'register_admin.php?email=' + email + '&admin_name=' + name + '&password=' + password,
					success: function(data) {
						if(data['status'] == 'ok') {
							document.getElementById('msg').style = 'background-color: green';
						}
						if(data['status'] == 'error') {
							document.getElementById('msg').style = 'background-color: red';
						}
						console.log(data);
						document.getElementById('msg').innerText = data['msg'];
					}
				});
			}
			</script>";
			exit(0);
		}
		return;
	}

	$GLOBALS["manager"] = null;

	try {
		$port = 27017;
		$GLOBALS["manager"] = new MongoDB\Driver\Manager("mongodb://localhost:$port");
	} catch (\Throwable $e) {
		error_log($e);
		$GLOBALS["use_db"] = 0;
	}

	function admin_exists() {
		return !!get_single_value_from_query("select count(*) from tfd_db.login where role_id = 1");
	}

    function change_is_public($network_name, $value) {
	_assert(($value == 'true') || ($value == 'false'), "Variable value is not a bool.");
        $collection = "tfd.models";
        $bulk = new \MongoDB\Driver\BulkWrite();
        $bulk->update(
            ['network_name' => $network_name],
            ['$set' => ['is_public' => $value]],
        );
        $result = $GLOBALS["manager"]->executeBulkWrite($collection, $bulk);
        return $result;
    }

	function get_network_names() {
        $filters = [];
        $options = [];

        $results = find_mongo("tfd.models", $filters, $options);
		$array = [];
		if($results) {
			foreach($results as $doc) {
				$array[] = $doc["network_name"];
			}
		}
		return $array;
    }

	function get_network_data() {
        $filters = [];
        $options = [];

        $results = find_mongo("tfd.models", $filters, $options);
		$array = [];
		if($results) {
			foreach($results as $doc) {
				$array[] = $doc;
			}
		}
		// dier($array);
		return $array;
    }

	function session_id_exists() {
		if(array_key_exists("session_id", $_COOKIE)) {
			$query = "select count(*) from tfd_db.session_ids where session_id = ".esc($_COOKIE["session_id"]);
			return !!get_single_value_from_query($query);
		}
		return false;
	}

	function is_admin() {
		if(session_id_exists()) {
			$user_id = get_user_id_from_session_id($_COOKIE["session_id"]);
			_assert($user_id > 0, "id is too low");
			$role = get_single_value_from_query("select role_id from login where id = ".esc($user_id));
			if($role == 1){
				return true;
			}
		}
		return false;
	}

	// funktion unfertig morgen weiter siehe notizen
	function can_edit_or_is_public($model_id) {
		if(session_id_exists($user_id)) {
			$user_id = get_user_id_from_session_id($_COOKIE["session_id"]);

			if(can_edit_models($user_id, $model_id)) {
				if(can_edit_models()) {
					return true;
				}
				$filters = ['_id' => new MongoDB\BSON\ObjectId($model_id)];
				$options = ['projection' => ['is_public' => true, '']];
				$result = find_mongo("tfd.models", $filters, $options);
				if(is_public()) {
					return true;
				}
			}
		}
		return false;
	}

	function can_edit_models($model_user_id) {
		if(is_admin()) {
			return true;
		} else {
			if(array_key_exists("session_id", $_COOKIE)) {
				if(get_user_id_from_session_id($_COOKIE["session_id"]) == $model_user_id) {
					return true;
				}
			}
		}
		return false;
	}

	function get_model_user_id($network_name) {
		_assert($network_name != "", "Network name must contain a value.");
		$filters = ['network_name' => $network_name];
        $options = ['projection' => ['user' => true]];
        $results = find_mongo("tfd.models", $filters, $options);
		if($results) {
			return $results[0]["user"];
		} 
		return false;
	}

	function can_edit_user($username) {
		_assert(is_string($username), "Variable username has wrong datatype must be string.");
		if(is_admin()) {
			return true;
		}
		if(session_id_exists()) {
			$session_user_id = get_user_id_from_session_id($_COOKIE["session_id"]);
			$username_user_id = get_single_value_from_query("select id from tfd_db.login where username = ".esc($username));
			if($session_user_id == $username_user_id) {
				return true;
			}
		}
		return false;
	}

	function delete_expiry_dates() {
		$query = "delete from session_ids where datediff(expiry_date, now()) < 0";
		run_query($query);
	}

	function contains_null_values ($array) {
		foreach ($array as $key => $value) {
			if(is_null($value)) {
				return true;
			}
		}
		return false;
	}

	function delete_mongo ($collection, $id, $user_id) {
		if(can_edit_models($user_id)) {
			$bulk = new \MongoDB\Driver\BulkWrite();
			$bulk->delete(array('_id' => new MongoDB\BSON\ObjectId($id)));
			$result = $GLOBALS["manager"]->executeBulkWrite($collection, $bulk);
			return $result;
		}
		return false;
	}

	function delete_mongo_models ($id, $user_id) {
		delete_mongo('tfd.models', $id, $user_id);
	}

	function save_mongo ($collection, $data) {
		if (!is_string($collection) || strlen($collection) < 3 || strpos($collection, '.') < 1) {
			throw new \InvalidArgumentException('The collection name to be filled on the database must be given as "database.collection"');
		}
		if (!is_array($data) && !$data instanceof CollectionInterface) {
			throw new \InvalidArgumentException('The data to be written on the database must be given as a collection');
		}
		$adaptedData = $data instanceof GenericCollection ? $data->all() : $data;
		$bulk = new \MongoDB\Driver\BulkWrite();
		try {
			$nativeID = $bulk->insert($adaptedData);
			$result = $GLOBALS["manager"]->executeBulkWrite($collection, $bulk);
		} catch (\MongoDB\Driver\Exception\BulkWriteException $ex) {
			throw new DatabaseException('Insertion failed due to a write error', 3);
		} catch (\MongoDB\Driver\Exception\InvalidArgumentException $ex) {
			throw new DatabaseException('Insertion failed due to an error occurred while parsing data', 3);
		} catch (\MongoDB\Driver\Exception\ConnectionException $ex) {
			throw new DatabaseException('Insertion failed due to an error on authentication', 3);
		} catch (\MongoDB\Driver\Exception\AuthenticationException $ex) {
			throw new DatabaseException('Insertion failed due to an error on connection', 3);
		} catch (\MongoDB\Driver\Exception\RuntimeException $ex) {
			throw new DatabaseException('Insertion failed due to an unknown error', 3);
		}
		if ($result->getInsertedCount() <= 0) {
			throw new DatabaseException('Insertion failed due to an unknown error', 3);
		}
	}

	function find_mongo ($table, $filter, $options) {
		try {
			$query = new MongoDB\Driver\Query($filter, $options);
			$rows = $GLOBALS["manager"]->executeQuery($table, $query);

			$r = array();
			foreach($rows as $row){
				$r[] = json_decode(json_encode($row), true);
			}

			return $r;
		} catch (\Throwable $e) {
			$GLOBALS["use_db"] = 0;
			return null;
		}
	}

	function save_mongo_models ($array) {
		save_mongo("tfd.models", $array);
	}

	#save_mongo_models(array("hallo" => 12323));                                                                                                                                                                                     
	#dier(find_mongo("tfd.models", array("hallo" => array('$exists' => true)), array()));   
	#save_mongo("abc.testabc", array("hallo" => 12323));
	#dier(find_mongo("tfd.models", array(), array()));

	function run_query ($query) {
		if($GLOBALS['mysqli']) {
			mysqli_select_db($GLOBALS["mysqli"], "tfd_db");
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
		return null;
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
		if(!$GLOBALS["mysqli"]) {
			$GLOBALS["use_db"] = 0;
			return;
		}
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
		return get_single_value_from_query('select id from tfd_db.login where username ='.esc($username));
	}

	function get_session_id($username) {
		return get_single_value_from_query('select session_id from tfd_db.session_ids where user_id ='.esc(get_user_id($username)));
	}

	function insert_session_id($username, $days) {
		$session_id = generateRandomString();
		$query = 'insert into tfd_db.session_ids (user_id, session_id, expiry_date) values ('.esc(get_user_id($username)).', '.esc($session_id).','.create_expiry_date($days).')';
		run_query($query);
	}

	function get_expiry_date($session_id) {
		return get_single_value_from_query('select expiry_date from tfd_db.session_ids where session_id = '.esc($session_id));
	}

	function get_js_user_id_from_session_id($session_id) {
		$user_id = get_user_id_from_session_id($session_id);
		if(is_null($user_id)) {
			return "null";
		} else {
			return $user_id;
		}
	}

	function minify_js ($file) {
		if(0 && ($GLOBALS["minify"] || $file == "style.css") && $file != "ribbon.css" && $file != 'visualizations/d3.v5.min.js' && $file != "visualizations/three.min.js") {
			print "<script src='minify.php?file=$file'></script>";
		} else {
			print "<script src='$file'></script>";
		}
	}

	function minify_css ($file) {
		if(($GLOBALS["minify"] || $file == "style.css") && $file != "ribbon.css") {
			print "<link href='minify.php?file=$file' rel='stylesheet' />\n";
		} else {
			print "<link href='$file' rel='stylesheet' />\n";
		}
	}

	function get_string_between($string, $start, $end){
		$string = ' ' . $string;
		$ini = strpos($string, $start);
		if ($ini == 0) return '';
		$ini += strlen($start);
		$len = strpos($string, $end, $ini) - $ini;
		return substr($string, $ini, $len);
	}

	function parse_markdown_links ($markdown) {
		$str = "<ul>\n";
		foreach(preg_split("/((\r?\n)|(\r\n?))/", $markdown) as $line){
			if(!preg_match("/^\s*$/", $line)) {
				if(preg_match("/^\s*-\s*\[(.*?)\]\((.*?)\)\s*$/", $line, $matches)) {
					$str .= "<li><a target='_blank' class='sources_popup_link' href='".$matches[2]."'>".$matches[1]."</a></li>\n";
				}
			}
		}
		$str .= "</ul>\n";
		return $str;
	}

	function get_user_id_from_session_id ($session_id) {
		$user_id = get_single_value_from_query("select user_id from tfd_db.session_ids where session_id = ".esc($session_id));
		if(is_null($user_id)) {
			return null;
		}
		return (int) $user_id;
	}

	function is_logged_in () {
		if(array_key_exists("session_id", $_COOKIE)) {
			$user = get_user_id_from_session_id($_COOKIE["session_id"]);
			if($user != "") {
				return $user;
			}
		}
		return null;
	}

	function username_exists($username) {
        return !!get_single_value_from_query("select count(*) from tfd_db.login where username = ".esc($username));
    }
	 
	function load_sql_file_get_statements ($file) {
		$contents = file_get_contents($file);
		$contents = "SET FOREIGN_KEY_CHECKS=0;\n$contents";
		$contents = preg_replace("/--.*/", "", $contents);
		$contents = preg_replace("/\/\*.*?\*\/;/", "", $contents);
		$contents = preg_replace("/(^[\r\n]*|[\r\n]+)[\s\t]*[\r\n]+/", "\n", $contents);
		$contents = "$contents\nSET FOREIGN_KEY_CHECKS=0;\n";

		$queries = explode(";", $contents);
		foreach ($queries as $query) {
			if(!preg_match("/^\s*$/", $query)) {
				run_query($query);
			}
		}
	}

	function filter_str_int ($data) {
		if(is_array($data)) {
			return null;
		}

		return $data;
	}

	function _assert ($condition, $message) {
		if(!$condition) {
			die($message);
		}
	}

	#_assert(false, "hallo");

	delete_expiry_dates();
?>
