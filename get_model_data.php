<?php
	include('functions.php');

	if(array_key_exists("id", $_GET)) {
		$model_id = $_GET["id"];
		if(model_is_public($model_id) || can_edit_models($model_id)) {

			$filters = ['_id' => new MongoDB\BSON\ObjectID(filter_str_int($model_id))];
			$options = ['projection' => ['_id' => true, 'model_data' => true]];

			$results = find_mongo("tfd.models", $filters, $options);

			if(count($results) > 0) {
				foreach($results as $doc) {
					if($doc["_id"]['$oid'] == filter_str_int($model_id)) {
						header('Content-type: application/json');
						print json_encode($doc["model_data"]);
					}
				}
			} else {
				print "No model was found.";
			}
		} else {
			print "You don't have the permission to see this model.";
		}
	} else {
		print "No id given.";
	}
?>
