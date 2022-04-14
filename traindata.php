<?php
	if(!function_exists("dier")) {
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
	}

	$start_dir = "./traindata";
	$traindata_contents = scandir($start_dir);

	$data = [];

	foreach ($traindata_contents as $content) {
		if(!preg_match("/^\.{1,2}$/", $content)) {
			$this_path = "$start_dir/$content";
			if(is_dir($this_path)) {
				$content_name = $content;
				if(is_file("$this_path/desc.txt")) {
					$content_name = trim(file_get_contents("$this_path/desc.txt"));
				}
				$data[$content_name]["category_name"] = $content;
				$category_contents = scandir($this_path);
				$category_contents = array_reverse($category_contents);
				foreach ($category_contents as $this_category_contents) {
					if(
						!preg_match("/^\.{1,2}$/", $this_category_contents) &&
						!preg_match("/_keras.json/", $this_category_contents) &&
						!preg_match("/_weights.json/", $this_category_contents) &&
						preg_match("/\.json$/", $this_category_contents) &&
						$this_category_contents != "default.json"
					) {
						$file_basename = $this_category_contents;
						$file_basename = preg_replace("/\.json$/", "", $file_basename);


						$json_data = json_decode(file_get_contents("$this_path/$this_category_contents"), true);

						$name = $json_data["name"];

						$data[$content_name]["datasets"][$name] = [
							"name" => $file_basename,
							"filename" => "$this_path/$this_category_contents"
						];

						$trainable_data = [];

						if(array_key_exists("trainable_data", $json_data)) {
							$trainable_data = $json_data["trainable_data"];
						}

						$trainable_data[] = $file_basename;

						foreach ($trainable_data as $this_trainable_data) {
							$weights_file = "$this_path/${this_trainable_data}_weights.json";
							if(!is_file($weights_file)) {
								$weights_file = "";
							}

							if($weights_file) {
								$data[$content_name]["datasets"][$name]["weights_file"][$this_trainable_data] = $weights_file;
							}
						}
					}
				}
			}
		}
	}

	print json_encode($data, JSON_PRETTY_PRINT);
?>
