<?php

    include('functions.php');

    $search_filters = [];
    $search_options = [];

    $search_results = find_mongo("tfd.models", $search_filters, $search_options);
    
    $id = "";
    if(array_key_exists("network_name", $_GET)) {
        $network_name = $_GET["network_name"];
        foreach($search_results as $doc) {
            if($doc["network_name"] == $_GET["network_name"]) {
                $id = $doc["_id"]["\$oid"];
                if($id == "") {
                    print "This network doesn't exist.";
                } else {
                    $filters = [
                        ['_id' => new MongoDB\BSON\ObjectID(filter_str_int($id))]
                    ];
                    $options = [];
                    $user_id = get_user_id_from_session_id($_COOKIE["session_id"]);
                    $results = delete_mongo_models($id, $user_id);
                
                    print htmlentities($_GET["network_name"])." was deleted";
                }
            }
        }
    } else {
        print "Network name doesn't exist.";
    }

    
?>