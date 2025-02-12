<?php
    include('functions.php');

    $status["status"] = "error";
    if(array_key_exists("session_id", $_COOKIE)) {
        if(array_key_exists("username", $_GET) && $_GET["username"] != "") {
            $username = $_GET["username"];
            if(can_edit_user($username)) {

                $query = "select id from tfd_db.login where username = ".esc($username);
                $id = get_single_value_from_query($query);
                if($id) {
                    $query = "delete from tfd_db.login where username = ".esc($username);
                    if(run_query($query)) {
                        $status["status"] = "ok";
                        $status["msg"] = "User was deleted.";
                    } else {
                        $status["msg"] = "User could not be deleted.";
                    }
                    
                } else {
                    $status["msg"] = "The user doesn't exist.";
                }
            } else {
                $status["msg"] = "You don't have the permission to edit.";
            }
        } else {
            $status["msg"] = "Please select a user.";
        }
    } else {
        $status["msg"] = "You are not logged in.";
    }
    header('Content-type: application/json');
    print json_encode($status);
?>
