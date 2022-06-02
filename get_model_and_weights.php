<?php
    include('functions.php');

    if(array_key_exists("session_id", $_COOKIE)) {

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
				['_id' => new MongoDB\BSON\ObjectID(filter_str_int($_GET["id"]))]
			]
		];

		$options = array(
			"category" => true,
			"network_name" => true
		);

		$results = find_mongo("tfd.models", $filters, $options);

		foreach($results as $doc) {
			$model_weights = $doc["model_weights"];
			print json_encode($model_weights);
		}

		}
    } else {
	    print "You are not logged in.";
    }
?>
