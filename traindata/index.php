<?php
header('Content-Type: application/json');

function list_files_in_dir ($dir, $max_number_of_files_per_category) {
	$files = [];
	if(is_dir($dir)) {
		foreach (scandir($dir) as $this_file) {
			if($this_file != "." && $this_file != "..") {
				if($max_number_of_files_per_category == 0 || $max_number_of_files_per_category > count($files)) {
					$files[] = $this_file;
				}
			}
		}
	}
	return $files;
}

function list_dir ($folder, $max_number_of_files_per_category, $examples) {
	$struct = [];
	if(is_dir($folder)) {
		foreach (scandir($folder) as $this_folder) {
			if($this_folder != "." && $this_folder != ".." && ((!$examples && $this_folder != "example") || $examples)) {
				$struct[$this_folder] = list_files_in_dir("$folder/$this_folder", $max_number_of_files_per_category);
			}
		}
	}

	return $struct;
}

$dataset = $_GET['dataset'];
$examples = array_key_exists("examples", $_GET);

$max_number_of_files_per_category = 0;
if(array_key_exists("max_number_of_files_per_category", $_GET)) {
	$max_number_of_files_per_category = $_GET['max_number_of_files_per_category'];
	if(is_numeric($max_number_of_files_per_category)) {
		$max_number_of_files_per_category = (int)$max_number_of_files_per_category;
	}
}

if(preg_match("/^\w+$/", $dataset)) {
	$folder = $dataset;
	$dir = list_dir($folder, $max_number_of_files_per_category, $examples);
	$json = json_encode($dir, JSON_PRETTY_PRINT);
	print $json;
} else {
	print('{ "error": "Invalid Dataset" }');
}
?>
