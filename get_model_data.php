<?php
	include('functions.php');

	// überprüfen auf berechtigung is_public, is_admin, is_owner 
	if(array_key_exists("id", $_GET)) {
		if(array_key_exists("session_id", $_COOKIE)) {
			$user = get_user_id_from_session_id($_COOKIE["session_id"]);
			if(is_null($user)) {
				print "User doesn't exist.";
			} else {
					$model_id = $_GET["id"];
					if(can_edit_or_is_public($model_id)) {
						
						$filters = [
							'$and' => [
								[
									'$or' => [
										["user" => ['$eq' => $user]],
										["is_public" => ['$eq' => 'true']],
									],
								],
								['_id' => new MongoDB\BSON\ObjectID(filter_str_int($id))]
							]
						];
						// TODO
						$options = array(
							'user' => true,
							'is_public' => true,
							'category' => true,
							'model_data' => true,
							'model_weights' => 0,
							'model_structure' => 0,
							'network_name' => true
						);
			
						$results = find_mongo("tfd.models", $filters, $options);
						if(count($results) > 0) {
							foreach($results as $doc) {
								if($doc["_id"]['$oid'] == filter_str_int($id)) {
									print json_encode($doc["model_data"]);
								}
							}
						} else {
							print "No data was found.";
						}
					}
				} else {
					print "No id given.";
				}
			}
	} else {
		print "You are not logged in.";
	}
?>
