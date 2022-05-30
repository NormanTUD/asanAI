<?php
    include("functions.php");
    if(array_key_exists("session_id", $_COOKIE)) {
        
        $user = get_user_id_from_session_id($_COOKIE["session_id"]);
        if(is_null($user)) {
            print "User doesn't exist.";
        } else {
            $array = [
                "model_structure" => json_decode($_POST["model_structure"], true),
                "model_weights" => json_decode($_POST["model_weights"], true),
                "model_data" => json_decode($_POST["model_data"], true),
                "user" => $user,
                "is_public" => $_POST["is_public"],
                "category" => $_POST["category"],
                "category_full" => $_POST["category_full"],
                "network_name" => $_POST["network_name"]
            ];
    
            #dier($array);
            save_mongo_models($array);
            
            header('Content-Type: application/json');
            print json_encode($array);
        }
    } else {
        print "You are not logged in.";
    }

    // die save_to_mongodb() sollte beim klicken auf "Save" aufgerufen werden, aber bisher werden
    // die Daten noch nicht in der DB gespeichert
?>