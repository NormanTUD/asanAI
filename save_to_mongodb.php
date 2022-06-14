<?php
    include("functions.php");
    if(array_key_exists("session_id", $_COOKIE)) {
        $keys = ["model_structure", "model_weights", "model_data", "is_public", "category", "category_full", "network_name"];

        $data = array();
        foreach ($keys as $key) {
            if(array_key_exists($key, $_POST) && $_POST[$key]) {
                $data[$key] = $_POST[$key];
            } else {
                print "$key does not exist";
                exit(0);
            }
        }

        if(get_number_model_names($data["network_name"]) != 0) {
            print "Model name already exists.";
            exit(0);
        }

        $user = get_user_id_from_session_id($_COOKIE["session_id"]);
        if(is_null($user)) {
            print "User doesn't exist.";
        } else {
            $array = [
                "model_structure" => json_decode($data["model_structure"], true),
                "model_weights" => json_decode($data["model_weights"], true),
                "model_data" => json_decode($data["model_data"], true),
                "user" => $user,
                "is_public" => $data["is_public"],
                "category" => $data["category"],
                "category_full" => $data["category_full"],
                "network_name" => $data["network_name"]
            ];
    
            $results = array();

            save_mongo_models($array);
            $results["msg"] = "Saving data was successful.";
            
            header('Content-Type: application/json');
            print json_encode($results);
        }
    } else {
        print "You are not logged in.";
    }

?>
