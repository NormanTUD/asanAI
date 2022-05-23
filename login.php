<?php
    //login in existing account
    include('functions.php');

    $status = ["status" => "error", "msg" => "Missing information"];
    if(array_key_exists("username", $_GET) && array_key_exists("pw", $_GET)) {
        $hash_password = esc(hash("sha256", $_GET["pw"].get_single_value_from_query('select salt from login where username = '.esc($_GET["username"]))));
        
        if(get_single_value_from_query('select username from tfd_db.login where username = '.esc($_GET["username"]).' and pw = '.$hash_password)) {
            
            if($hash_password == esc(get_single_value_from_query('select pw from tfd_db.login where username = '.esc($_GET["username"]).''))) {
                $status = ["status" => "ok", "msg" => "Login succesful", "session_id" => get_session_id($_GET["username"]), "time" => get_expiry_date($_GET["username"])];
                insert_session_id($_GET["username"], $_GET["days"]);
            }
        } else {
            $status = ["status" => "error", "msg" => "Login failed"];
        }
    }
    header('Content-Type: application/json');
        print json_encode($status);
?>