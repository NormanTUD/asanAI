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
                    ['_id' => new MongoDB\BSON\ObjectID($_GET["id"])]
                ]
            ];
            $options = array(
                'user' => true,
                'is_public' => true,
                'category' => true,
                'model_weights' => 0,
                'model_structure' => 0,
                'network_name' => true
            );

            $results = find_mongo("tfd.models", $filters, $options);

            foreach ($results as $doc) {
                #dier($doc["model_structure"]);
                #header('Content-Type: application/json');
                print json_encode($doc["model_structure"]);
            }
        }
    } else {
        print "You are not logged in.";
    }
?>