<?php 
    include('functions.php');

    $status = ["status" => "error", "msg" => "Password is missing."];

    $username = null;

    if(array_key_exists("username", $_GET) || array_key_exists("email", $_GET)) {
        if(array_key_exists("email", $_GET)) {
            $username = get_single_value_from_query("select username from tfd_db.login where email = ".esc($_GET["email"]));
        } else if(array_key_exists("username", $_GET)) {
            $username = $_GET["username"];
        }
    }

    if(!is_null($username)) {
        if(can_edit_user($username)) {
            if(array_key_exists("password", $_GET) && ($_GET["password"] != "")) {
                $password = $_GET["password"];
        
                if(strlen($password) > 7) {

                    if(username_exists($username)) {
                        if($username != "") {
                            $salt = get_single_value_from_query("select salt from tfd_db.login where username = ".esc($username));
                            $query = "update tfd_db.login set pw = ".esc(hash("sha256", $password.$salt))." where username = ".esc($username);
                            run_query($query);
                            $status = ["status" => "ok", "msg" => "The password has changed."];
                        } else {
                            $status["msg"] = "The username is empty.";    
                        }
                    } else {
                        $status["msg"] = "This username doesn't exist.";
                    }
                } else {
                    $status["msg"] = "The password must be at least 8 characters long.";
                }
            } else {
                $status["msg"] = "Please insert a password.";
            }
        } else {
            $status["msg"] = "You don't have the permission to edit this user.";
        }
    } else {
        $status["msg"] = "Cannot determine username.";
    }

    header('Content-type: application/json');
    print json_encode($status);
?>


                