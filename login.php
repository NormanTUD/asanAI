<?php
    //einloggen
    include('functions.php');

    if(array_key_exists("username", $_GET) && array_key_exists("email", $_GET) && array_key_exists("pw", $_GET)) {
        if(get_single_value_from_query('select username from tfd_db.login where username ='.esc($_GET["username"])) && get_single_value_from_query('select email from tfd_db.login where email ='.esc($_GET["email"]))) {
            print "True";
        } else {
            print "False";

        }
    }
?>