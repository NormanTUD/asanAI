<?php

    //die object id mit dem network_name suchen, mit der id das model löschen
    include('functions.php');

    $search_filters = [];
    $search_options = array();

    $search_results = find_mongo("tfd.models", $search_filters, $search_options);

    $id = "";
    foreach($search_results as $doc) {
        if($doc["network_name"] == $_GET["network_name"]) {
            $id = $doc["_id"]["\$oid"];
            $filters = [
                ['_id' => new MongoDB\BSON\ObjectID(filter_str_int($id))]
            ];
            $options = [];
            $user_id = get_user_id_from_session_id($_COOKIE["session_id"]);
            $results = delete_mongo_models($id, $user_id);
        
            print $_GET["network_name"]." was deleted";
        }
    }

    if($id == "") {
        print "This network doesn't exist.";
    }
?>