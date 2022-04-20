<?php
    include('functions.php');

    if(get_single_value_from_query('select username from tfd_db.login where username = "'.esc($_GET["username"]).'"') && get_single_value_from_query('select email from tfd_db.login where email = "'.esc($_GET["email"]).'"')
    && get_single_value_from_query('select pw from tfd_db.login where pw = "'.esc($_GET["pw"]).'"')) {
        print "True";
    } else {
        print "False";
    }
?>