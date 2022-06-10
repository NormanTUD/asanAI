<?php
    include('functions.php');

    $status["status"] = "error";
    if($_GET["username"]) {
        $query = "select id from tfd_db.login where username = ".esc($_GET["username"]);
        $id = get_single_value_from_query($query);
        if($id) {
            // wenn die daten wie $id aus der db kommen müssen sie dann escaped werden?
            $query = "delete from tfd_db.session_ids where user_id = ".esc($id);
            run_query($query);
            $query = "delete from tfd_db.login where username = ".esc($_GET["username"]);
            run_query($query);
            
            $status["status"] = "ok";
            $status["msg"] = "User was deleted.";
        } else {
            $status["msg"] = "The user doesen't exist.";
        }
    } else {
        $status["msg"] = "Please select a user.";
    }
    header('Content-type: application/json');
    print json_encode($status);
?>