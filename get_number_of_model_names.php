<?php 
	include('functions.php');

	if(array_key_exists("name", $_GET)) {
		$name = $_GET["name"];

		$filters = [
		];
	
		$options = array(
			'network_name' => true
		);
	
		$results = find_mongo("tfd.models", $filters, $options);
	
		$nr = 0;
	
		foreach ($results as $doc) {
			if($name == $doc["network_name"]) {
				$nr++;
			}
		}
	
		print json_encode(array("number" => $nr));
	}
?>
