<?php
    include('functions.php');

    $status["status"] = "error";

    if(!admin_exists()) {
        if(array_key_exists("email", $_GET) && ($_GET["email"] != "")) {
            if(array_key_exists("admin_name", $_GET) && ($_GET["admin_name"] != "")) {
                if(array_key_exists("password", $_GET) && (strlen($_GET["password"]) > 7)) {
                    $salt = generateRandomString();
                    $query = "insert into tfd_db.login (username, email, pw, salt, role_id) values (".esc($_GET["admin_name"]).", ".esc($_GET["email"]).", ".esc(hash("sha256", $_GET["pw"].$salt)).", ".$salt.", 1)";
                    run_query ($query);
                    
                    $status = [ "status" => "ok", "msg" => "You are now the admin." ];
                } else {
                    $status["msg"] = "Password is too short.";
                }
            } else {
                $status["msg"] = "Username is missing.";
            }
        } else {
            $status["msg"] = "Email is missing.";
        }
    } else {
        $status["msg"] = "Admin already exists.";
    }

    header('Content-type: application/json');
    print json_encode($status);
?>