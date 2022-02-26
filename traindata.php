<?php
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

						$weights_file = "$this_path/${file_basename}_weights.json";
						if(!is_file($weights_file)) {
							$weights_file = "";
						}

						$name = json_decode(file_get_contents("$this_path/$this_category_contents"), true)["name"];

						$data[$content_name]["datasets"][$name] = [
							"name" => $file_basename,
							"filename" => "$this_path/$this_category_contents"
						];

						if($weights_file) {
							$data[$content_name]["datasets"][$name]["weights_file"] = $weights_file;
						}
					}
				}
			}
		}
	}

	print json_encode($data, JSON_PRETTY_PRINT);
?>
