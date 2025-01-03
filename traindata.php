<?php
	include_once("functions.php");
	
	if(!function_exists("dier")) {
		function dier ($data, $enable_html = 0) {
			$source_data = debug_backtrace()[0];
			@$source = 'Called by <b>'.debug_backtrace()[1]['file'].'</b>::<i>'.debug_backtrace()[1]['function'].'</i>, line '.htmlentities($source_data['line'])."<br>\n";
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
	}
	
	$start_dir = "./traindata";
	
	$this_path = "$start_dir/";
	if(is_dir($this_path)) {
		$category_contents = scandir($this_path);
		$category_contents = array_reverse($category_contents);
		foreach ($category_contents as $this_category_contents) {
			if(
				!preg_match("/^\.{1,2}$/", $this_category_contents) &&
				!preg_match("/_keras.json/", $this_category_contents) &&
				!preg_match("/_weights.json/", $this_category_contents) &&
				preg_match("/\.json$/", $this_category_contents)
			) {
				$file_basename = $this_category_contents;
				$file_basename = preg_replace("/\.json$/", "", $file_basename);

				$json_data = json_decode(file_get_contents("$this_path/$this_category_contents"), true);

				$name = $json_data["name"];

				$data[$name] = [
					"name" => $file_basename,
					"user_id" => "has no user",
					"filename" => "$this_path/$this_category_contents"
				];

				$trainable_data = [];

				if(array_key_exists("trainable_data", $json_data)) {
					$trainable_data = $json_data["trainable_data"];
				}

				$trainable_data[] = $file_basename;

				foreach ($trainable_data as $this_trainable_data) {
					$weights_file = "$this_path/".$this_trainable_data."_weights.json";
					if(!is_file($weights_file)) {
						$weights_file = "";
					}

					if($weights_file) {
						$data[$name]["weights_file"][$this_trainable_data] = $weights_file;
					}
				}
			}
		}
	}

	if($GLOBALS["use_db"]) {
		if(array_key_exists("session_id", $_COOKIE)) {
			$user = get_user_id_from_session_id($_COOKIE["session_id"]);
			if(is_admin()) {
				$query = "select id, category, category_full, name, user_id from model";
			} else {
				$query = "select id, category, category_full, name, user_id from model where (user_id = ".esc($user)." or (is_public = true and reviewed = true))";
			}
		} else { 
			$query = "select id, category, category_full, name, user_id from model where (is_public = true and reviewed = true)";
		}

		$result = run_query($query);

		while ($row = $result->fetch_row()) {
			$id = $row[0];
			$category = $row[1];
			$category_full = $row[2];
			$network_name = $row[3];
			$user = $row[4];

			$data[$network_name] = array(
				"name" => $network_name,
				"user_id" => $user,
				"data" => "get_model_data.php?id=".$id,
				"id" => $id,
				"filename" => "get_model_from_db.php?id=".$id,
				"weights_file" => array(
					$network_name => "get_weights.php?id=".$id
				),
				"has_custom_data" => has_custom_data($id)
			);
		}
	}

	print json_encode($data, JSON_PRETTY_PRINT);
?>
