<?php
    //einloggen
    include('functions.php');

    if(array_key_exists("username", $_GET) && array_key_exists("email", $_GET) && array_key_exists("pw", $_GET)) {
        if(get_single_value_from_query('select username from tfd_db.login where username ='.esc($_GET["username"])) && get_single_value_from_query('select email from tfd_db.login where email ='.esc($_GET["email"]))) {
            insert_session_id($_GET["username"], $_GET["days"]);
            $status = ["status" => "ok", "msg" => "Login succesful", "session_id" => get_session_id($_GET["username"]), "time" => get_expiry_date($_GET["username"])];
        } else {
            $status = ["status" => "error", "msg" => "Login failed"];
        }
        header('Content-Type: application/json');
            print json_encode($status);
    }
?>