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
    
            if(!!$_POST["model_structure"] && !!$_POST["model_weights"] && !!$_POST["model_data"] && !!$_POST["is_public"]
            && !!$_POST["category"] && !!$_POST["category_full"] && !!$_POST["network_name"]) {
                save_mongo_models($array);
                $array["msg"] = "Saving data was successful.";
            } else {
                $array["msg"] = "Some data is missing.";
            }
            
            header('Content-Type: application/json');
            print json_encode($array);
        }
    } else {
        print "You are not logged in.";
    }

?>
