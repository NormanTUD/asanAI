<?php 
	include('functions.php');

	if(array_key_exists("name", $_GET)) {
		$name = $_GET["name"];

		$nr = get_number_model_names($name);

		if(is_null($nr)) {
			$nr = 0;
		}
	
		print json_encode(array("number" => $nr));
	}
?>
