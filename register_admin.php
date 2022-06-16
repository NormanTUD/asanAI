<?php
include('functions.php');

    $status["status"] = "error";

    if(!admin_exists()) {
        if(array_key_exists("email", $_GET) && ($_GET["email"] != "")) {
            $email = $_GET["email"];
            if(preg_match("/^.+@.*\..+/", $email)) {
                if(array_key_exists("admin_name", $_GET) && ($_GET["admin_name"] != "")) {
                    $name = $_GET["admin_name"];
                    if(array_key_exists("password", $_GET) && (strlen($_GET["password"]) > 7)) {
                        $password = $_GET["password"];
                        $salt = generateRandomString();
                        $query = "insert into tfd_db.login (username, email, pw, salt, role_id) 
                            values (".esc($name).", ".esc($email).", 
                            ".esc(hash("sha256", $password.$salt)).", ".esc($salt).", 1)";
                        if(run_query($query)) {
                            $status = [ "status" => "ok", "msg" => "You are now the admin." ];
                        } else {
                            $status["msg"] = "Something went wrong making you admin.";
                        }
                    } else {
                        $status["msg"] = "Password not provided or too short.";
                    }
                } else {
                    $status["msg"] = "Username is missing.";
                }
            } else {
                $status["msg"] = "Email is not valid.";
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