<?php 
	include('../functions.php');

	if(array_key_exists("name", $_GET) && $_GET["name"] != "") {
		$name = $_GET["name"];

		$nr = get_number_model_names($name);

		if(is_null($nr)) {
			$nr = 0;
		}
	
		header('Content-type: application/json');
		print json_encode(array("number" => $nr));
	}
?>
