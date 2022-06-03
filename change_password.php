<?php 
    include('functions.php');

    $status = ["status" => "error", "msg" => "Password or username is wrong"];
    if(($_GET["password"] != "") && ($_GET["username"] != "")) {
        $salt = get_single_value_from_query("select salt from tfd_db.login where username = ".esc($_GET["username"]));
        $query = "update tfd_db.login set pw = ".esc(hash("sha256", $_GET["password"].$salt))." where username = ".esc($_GET["username"]);
        run_query($query);
        $status = ["status" => "ok", "msg" => "The password has changed."];
    } else {
        $status = ["status" => "error", "msg" => "Please insert a password."];
    }

    header('Content-type: application/json');
    print json_encode($status);
    //dier($query);
?>