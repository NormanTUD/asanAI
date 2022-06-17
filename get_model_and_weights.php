<?php
    include('functions.php');

	if(array_key_exists("id", $_GET)) {
		$model_id = $_GET["id"];
		if(model_is_is_valid($model_id)) {
			//dier($model_id);
			if(model_is_public($model_id) || can_edit_models(get_user_from_model_id($model_id))) {
	
				$user = get_user_id_from_session_id($_COOKIE["session_id"]);
				if(is_null($user)) {
					print "User doesn't exist.";
				} else {
					
					$filters = [
						'$and' => [
							[
								'$or' => [
									["user" => ['$eq' => $user]],
									["is_public" => ['$eq' => 'true']],
								],
							],
							['_id' => new MongoDB\BSON\ObjectID(filter_str_int($model_id))]
						]
					];
		
					//TODO
					$options = array(
						"category" => true,
						"network_name" => true
					);
		
					$results = find_mongo("tfd.models", $filters, $options);
		
					if(count($results) > 0) {
						foreach($results as $doc) {
							$model_weights = $doc["model_weights"];
							print json_encode($model_weights);
						}
					} else {
						print "No data was found.";
					}
				}
			} else {
				print "You don't have the permission.";
			}
		} else {
			print "Id is not valid";
		}
	} else {
		print "No id given.";
	}
?>
