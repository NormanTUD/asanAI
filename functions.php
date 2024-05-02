<?php
	$GLOBALS["use_db"] = 0;
	include_once('php/mailerload.php');
	$GLOBALS['smtpuser'] = "scads";
	$GLOBALS['smtppass'] = "test123";
	$GLOBALS['smtphost'] = "scads";
	$GLOBALS["mysqli"] = null;
	if(file_exists('/etc/dbpw') && 0) {
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
				if (run_query_safe($sql) === TRUE) {
					mysqli_select_db($GLOBALS["mysqli"], "tfd_db");
					load_sql_file_get_statements("tfd.sql");

					goto DBCONNECT;
				} else {
					echo "Error creating database: " . $GLOBALS['mysqli']->error;
					$GLOBALS["use_db"] = 0;
				}
			}
		} catch (Exception $e) {
			error_log($e);
		}

		if($GLOBALS["use_db"]) {
			delete_expiry_dates();
		}
	}

	function get_number_model_names($name) {
		_assert($name != "", "Parameter is empty.");
		return get_single_value_from_query("select count(*) from model where name = ".esc($name));
	}

	function show_admin_register() {
		if($GLOBALS["use_db"] && !admin_exists()) {
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


	function admin_exists() {
		return !!get_single_value_from_query("select count(*) from tfd_db.login where role_id = 1");
	}

	function change_is_public($network_name, $value) {
		_assert(($value == 'true') || ($value == 'false'), "Variable value is not a bool.");
		return $result;
	}

	function session_id_exists() {
		if(array_key_exists("session_id", $_COOKIE)) {
			$query = "select count(*) from tfd_db.session_ids where session_id = ".esc($_COOKIE["session_id"]);
			return get_single_value_from_query($query);
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

	function model_is_public($model_id) {
		$user_is_admin = is_admin() ? 1 : 0;
		$query = "select count(*) from model where ((is_public = 1 and reviewed = 1) or $user_is_admin) and id = ".esc($model_id);
		return !!get_single_value_from_query($query);
	}

	function can_edit_model($model_id) {
		_assert($model_id != "", "Parameter is empty.");

		if(is_admin()) {
			return true;
		}

		if(array_key_exists("session_id", $_COOKIE)) {
			$user = get_user_id_from_session_id($_COOKIE["session_id"]);
			$model_user = get_user_id_from_model_id($model_id);
			if($user == $model_user) {
				return true;
			}
		}
		return false;
	}

	function get_user_from_model_id($model_id) {
		return get_single_value_from_query("select user_id from model where id = ".esc($model_id));
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
		$query = "delete from tfd_db.session_ids where datediff(expiry_date, now()) < 0";
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

	function delete_model ($model_id) {
		return run_query("delete from model where id = ".esc($model_id));
	}

	function save_to_training_db ($model_id, $data) {
		$query = "insert into training_data (model_id, data) values (".esc($model_id).", ".esc($data).")";
		return run_query($query);
	}

	function save_to_db($model_structure, $model_weights, $model_data, $user, $is_public, $name) {
		if($is_public == "true") {
			$is_public = 1;
		} else {
			$is_public = 0;
		}
		$query = "insert into model (model_structure, model_weights, model_data, user_id, is_public, name) values (".esc($model_structure).", ".esc($model_weights).", ".esc($model_data).", ".esc($user).", ".esc($is_public).", ".esc($name).")";
		run_query($query);
		return mysqli_insert_id($GLOBALS["mysqli"]);
	}

	function get_usernames() {
		$query = "select username, role_id from login";
		$result = run_query($query);
		while($row = $result->fetch_assoc()) {
			$usernames[] = $row["username"];
		}
		return $usernames;
	}

	function get_category_from_table($query, $column) {
		$result = run_query($query);
		while($row = $result->fetch_assoc()) {
			$category_array[] = $row[$column];
		}
		return $category_array;
	}

	function public_is_requested($id) {
		return !!get_single_value_from_query("select count(*) from model where is_public = true and id = ".esc($id));
	}

	function set_is_public($model_id, $status) {
		if(is_admin()) {
			$query = "update model set reviewed = ".esc($status)." where id = ".esc($model_id);
			run_query($query);
		}
	}

	function run_query_safe ($query) {
		if($GLOBALS['mysqli']) {
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

	function run_query ($query) {
		if($GLOBALS['mysqli']) {
			mysqli_select_db($GLOBALS["mysqli"], "tfd_db");
			$start_time = microtime(true);
			$result = $GLOBALS['mysqli']->query($query);
			if($result === false) {
				if(file_exists("/etc/asanai_die_on_sql_error")) {
					dier("Query failed:\n$query\nError:\n".$GLOBALS["mysqli"]->error);
				} else {
					$GLOBALS["use_db"] = 0;
				}
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

	function _js ($file, $async=0, $defer=0) {
		if(!file_exists($file)) {
			die("$file does not exist");
		}

		$t = get_file_state_identifier($file);
		$file = $file . "?t=$t";

		if($async && $defer) {
			print "<script async defer crossorigin src='$file'></script>";
		} else if($async && !$defer) {
			print "<script async crossorigin src='$file'></script>";
		} else if(!$async && $defer) {
			print "<script defer defer crossorigin src='$file'></script>";
		} else {
			print "<script src='$file' crossorigin></script>";
		}

		print "\n";
	}

	function _css ($file, $id=null) {
		if(!file_exists($file)) {
			die("$file does not exist");
		}

		$t = get_file_state_identifier($file);
		$file = $file . "?t=$t";

		if($id) {
			print "<link href='$file' rel='stylesheet alternative' id='$id'>";
		} else {
			print "<link href='$file' rel='stylesheet'>";
		}

		print "\n";
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
		$query = "select user_id from tfd_db.session_ids where session_id = ".esc($session_id);
		$user_id = get_single_value_from_query($query);
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

	function get_user_id_from_model_id($model_id) {
		$q = "select user_id from model where id = ".esc($model_id);
		$res = get_single_value_from_query($q);
		return $res;
	}

	function has_custom_data ($id) {
		$query = "select count(*) from training_data where model_id = ".esc($id);
		return !!get_single_value_from_query($query);
	}

	function ssh_taurus ($command) {
		return 'ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=60 scads@taurus.hrsk.tu-dresden.de "'.$command.'"';
	}

	function get_last_commit_hash_of_file ($file) {
		if(file_exists($file)) {
			return chop(shell_exec("git log -n 1 --pretty=format:%H -- $file | cat"));
		} else {
			die("$file not found.");
		}
	}

	function get_file_state_identifier ($file) {
		$git_hash = ""; #get_last_commit_hash_of_file($file);
		if(!$git_hash) {
			if(file_exists($file)) {
				return filemtime($file);
			} else {
				die("$file not found");
			}
		}
		return $git_hash;
	}

	function get_git_hash () {
		$rev = "";
		if(file_exists("git_hash")) {
			$rev = chop(chop(file_get_contents("git_hash")));
			return $rev;
		}

		$git = shell_exec("git rev-parse HEAD");
		if($rev) {
			$rev = chop($git);
		}
		if(!$rev) {
			if(file_exists(".git/refs/heads/master")) {
				$rev = chop(file_get_contents(".git/refs/heads/master"));
				return $rev;
			}

			return "";
		} else {
			return $rev;
		}
	}

	function _include ($fn) {
		if(file_exists($fn)) {
			include($fn);
		} else {
?>
			<script>alert("<?php print $fn; ?> not found");</script>
<?php
		}
	}

	function generateHTMLFromDataArray($dataArray) {
		if (!is_array($dataArray)) {
			throw new InvalidArgumentException("Invalid input provided. Expected an array.");
		}

		$html = "";

		foreach ($dataArray as $data) {
			$html .= "<div class='folie' style='display: none'>";
			if (!isset($data['heading']) || ((!isset($data['list']) || !is_array($data['list'])) && (!isset($data["html"])))) {
				throw new InvalidArgumentException("Invalid structure for page data. Each item must have 'heading' and 'list'.");
			}

			$html .= "<h3>" . htmlspecialchars($data['heading']) . "</h3>\n";

			if (empty($data['list'])) {
				if(empty($data["html"])) {
					$html .= "<p>No items in the list.</p>\n";
				}
			} else {
				$html .= "<ul class='presentation_ul'>\n";
				foreach ($data['list'] as $item) {
					$html .= "  <li class='presentation_li'>" . $item . "</li>\n";
				}
				$html .= "</ul>\n";
			}
			$html .= "<p>".$data["html"]."</p>\n";

			$html .= "</div>";
		}

		return $html;
	}
?>
