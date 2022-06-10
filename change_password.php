<?php 
    include('functions.php');

    function username_exists($username) {
        $db_username = get_single_value_from_query("select username from tfd_db.login where username = ".esc($username));
        if($username == $db_username) {
            return true;
        }
        return false;
    }

    $status = ["status" => "error", "msg" => "Password is missing."];

    if(($_GET["password"] != "")) {
        $username = "";
        $password = $_GET["password"];

        if(strlen($password) > 7) {

            if(array_key_exists("email", $_GET)) {
                $username = get_single_value_from_query("select username from tfd_db.login where email = ".esc($_GET["email"]));
            }
            if(array_key_exists("username", $_GET)) {
                $username = $_GET["username"];
            }
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
            $status["msg"] = "The password must be 8 characters long.";
        }
    } else {
        $status["msg"] = "Please insert a password.";
    }

    header('Content-type: application/json');
    print json_encode($status);
?>


                