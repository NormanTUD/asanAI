<?php
    //anmelden, registrieren
    include('functions.php');
    
    if(array_key_exists("username", $_GET) && array_key_exists("email", $_GET) && array_key_exists("pw", $_GET)) {
        if(!get_single_value_from_query('select username from tfd_db.login where username = '.esc($_GET["username"])) && !get_single_value_from_query('select email from tfd_db.login where email = '.esc($_GET["email"]))) {
            $salt = generateRandomString();
            $query = 'insert into tfd_db.login (username, email, pw, salt) values ('.esc($_GET["username"]).', '.esc($_GET["email"]).', '.esc(hash("sha256", $_GET["pw"].$salt)).', '.esc($salt).')';
            run_query ($query);

            insert_session_id(esc($_GET["username"]), $_GET["days"]);

            $status = ["status" => "ok", "msg" => "Account created", "session_id" => get_session_id($_GET["username"]), "time" => get_single_value_from_query('select expiry_date from tfd_db.session_ids where user_id ='.get_user_id($_GET["username"]))];
        } else {
            $status = ["status" => "error", "msg" => "Invalid input"];
        }
    } else {
        $status = ["status" => "error", "msg" => "Missing information"];
    }
    header('Content-Type: application/json');
        print json_encode($status);
    
?>