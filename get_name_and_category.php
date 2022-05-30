<?php
    include_once("functions.php");

    if(array_key_exists("session_id", $_COOKIE)) {
        
        $user = get_user_id_from_session_id($_COOKIE["session_id"]);
        if(is_null($user)) {
            print "User doesn't exist.";
        } else {
            $filters = array(
                '$or' => array(
                    array("user" => array('$eq' => $user)),
                    array("is_public" => array('$eq' => 'true'))
                )
            );
            $options = array(
                "category" => true,
                "network_name" => true
            );

            $results = find_mongo("tfd.models", $filters, $options);

            #dier($results);
            
            $names_and_sets = array();
            foreach ($results as $doc) {
                $category = $doc["category"];
                $category_full = $doc["category_full"];
                $names_and_sets[$category_full]["category_name"] = $category;
                $names_and_sets[$category_full]["datasets"][$doc["network_name"]] = array(
                    "name" => $doc["network_name"],
                    "filename" => "get_model_from_db.php?id=".$doc["_id"]['$oid'],
                    "weights_file" => array(
                        $doc["network_name"] => "get_model_and_weights.php?id=".$doc["_id"]['$oid']
                    )
                );
                $doc["network_name"];
            }

            print json_encode($names_and_sets, JSON_PRETTY_PRINT);
        }
    } else {
        print "You are not logged in.";
    }
?>