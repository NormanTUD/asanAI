<?php 
    include('functions.php');
    if($_GET["password"] && $_GET["username"]) {
        $salt = get_single_value_from_query("select salt from tfd_db.login where username = ".esc($_GET["username"]));
        $query = "update tfd_db.login set pw = ".esc(hash("sha256", $_GET["password"].$salt))." where username = ".esc($_GET["username"]);
        run_query($query);
    } else {
        print "Please insert a password";
    }
?>