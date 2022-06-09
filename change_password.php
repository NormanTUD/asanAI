<?php 
    include('functions.php');

    $status = ["status" => "error", "msg" => "Password or username doesn't exist."];
    if(array_key_exists("email", $_GET)) {
        $username = get_single_value_from_query("select username from tfd_db.login where email = ".esc($_GET["email"]));
        $status["msg"] = "Password or email doesn't exist.";
    } else if (array_key_exists("username", $_GET)) {
        $username = $_GET["username"];

        if(array_key_exists("role", $_GET) && $_GET["role"] == "") {
            $role_number = "select id from tfd_db.role_table where name = ".esc($_GET["role"]);
            $query = "update tfd_db.login set role_id = ".esc($role_number)." where username = ".esc($_GET["username"]);
            run_query($query);
        }
    }
    if(($_GET["password"] != "")) {
        if($username != "") {
            $salt = get_single_value_from_query("select salt from tfd_db.login where username = ".esc($username));
            $query = "update tfd_db.login set pw = ".esc(hash("sha256", $_GET["password"].$salt))." where username = ".esc($username);
            run_query($query);
            $status = ["status" => "ok", "msg" => "The password has changed."];
        }
    } else {
        $status["msg"] = "Please insert a password.";
    }

    header('Content-type: application/json');
    print json_encode($status);
    //dier($query);
?>