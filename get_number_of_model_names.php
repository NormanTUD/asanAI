<?php 
	include('functions.php');

	$filters = [
	];

	$options = array(
		'network_name' => true
	);

	$results = find_mongo("tfd.models", $filters, $options);

	$nr = 0;

	foreach ($results as $doc) {
		if($_GET["name"] == $doc["network_name"]) {
			$nr++;
		}
	}

	print json_encode(array("number" => $nr));
?>
