<?php
    include('functions.php');

    if(array_key_exists("session_id", $_COOKIE)) {

        $user = get_user_id_from_session_id($_COOKIE["session_id"]);
        if(is_null($user)) {
            print "User doesn't exist.";
        } else {
			if(array_key_exists("id", $_GET)) {
				$id = $_GET["id"];
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
			} else {
				print "No id given.";
			}
		}
    } else {
	    print "You are not logged in.";
    }
?>
