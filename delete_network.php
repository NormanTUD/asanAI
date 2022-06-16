<?php

    include('functions.php');

    
    
    $id = "";
    if(array_key_exists("network_name", $_GET)) {
        $network_name = $_GET["network_name"];
        if(can_edit_models(get_model_user_id($network_name))) {
            $search_filters = ['network_name' => $network_name];
            $search_options = [];
            
            $search_results = find_mongo("tfd.models", $search_filters, $search_options);

            foreach($search_results as $doc) {
                if($doc["network_name"] == $network_name) {
                    $id = $doc["_id"]["\$oid"];
                    if($id == "") {
                        print "This network doesn't exist.";
                    } else {
                        $filters = [
                            ['_id' => new MongoDB\BSON\ObjectID(filter_str_int($id))]
                        ];
                        $options = [];
                        $user_id = get_user_id_from_session_id($_COOKIE["session_id"]);
                        if($results = delete_mongo_models($id, $user_id)) {
                            print htmlentities($network_name)." was deleted";
                        } else {
                            print "Deleting the network failed.";
                        }
                    }
                } else {
                    print "The network doesn't exist.";
                }
            }
        } else {
            print "You don't have the permission to delete.";
        }
    } else {
        print "Network name doesn't exist.";
    }
    
?>