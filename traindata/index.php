<?php
header('Content-Type: application/json');

class DirectoryLister implements JsonSerializable{
	private $path;

	function __construct(string $path){
		if(file_exists($path)){
			$this->path = $path;
		} else {
			die("not found: >$path<");
		}
	}

	function walk(){
		foreach( scandir($this->path) as $basename){
			$new_path = $this->path.DIRECTORY_SEPARATOR.$basename ;
			if(!in_array($basename, ['.', '..']) && file_exists($new_path) ){
				yield $new_path;
			}
		}
	}

	function to_a(&$directories=null):array{
		if(!$directories){
			$directories = [];
		}

		foreach($this->walk() as $file){

			if(is_dir($file)){
				$sub_dir = new DirectoryLister($file);
				$name = basename($file) ;
				if($name != "example") {
					$directories[$name] = $sub_dir->to_a($directories[$name]);
				}
			} else {
				$name = basename($file) ;
				array_push($directories, $name);
			}  
		}
		return $directories;

	}

	function jsonSerialize(){
		$array = $this->to_a();
		return $array;
	}

	function get_basename():string{
		return basename($this->path);
	}
}

$dataset_category = $_GET['dataset_category'];
$dataset = $_GET['dataset'];

if(preg_match("/^\w+$/", $dataset_category)) {
	if(preg_match("/^\w+$/", $dataset)) {
		$folder = $dataset_category."/".$dataset;
		$dir = new DirectoryLister($folder);
		$json = json_encode($dir, JSON_PRETTY_PRINT);
		print $json;
	} else {
		die("Invalid dataset");
	}
} else {
	die("Invalid dataset_category");
}
?>
