<?php
    include('functions.php');

    if(array_key_exists("session_id", $_COOKIE)) {

        $user = get_user_id_from_session_id($_COOKIE["session_id"]);
        if(is_null($user)) {
            print "User doesn't exist.";
        } else {
            $filters = array(
                '$or' => array(
                    array("user" => array('$eq' => $user)),
                    array("is_public" => array('$eq' => 'true')),
            
                )
            );
            $options = array(
                "category" => true,
                "network_name" => true
            );
            
            $results = find_mongo("tfd.models", $filters, $options);
            
            //dier($results);
            #dier($results[0]["model_structure"]);
            $type = $_GET["type"];
            $weights_and_structure = array();
            foreach($results as $doc) {
                if($doc["_id"]['$oid'] == $_GET["id"]) {
                    $model_structure = $doc["model_structure"];
                    $model_weights = $doc["model_weights"];
                    if($type == "weights") {
                        print(json_encode($model_weights, JSON_PRETTY_PRINT));
                    } else {
                        print(json_encode($model_structure, JSON_PRETTY_PRINT));
                    
                    }
                    exit(0);
                    print json_encode($model_weights);
                }
            }

        }
    } else {
        print "You are not logged in.";
    }
?>