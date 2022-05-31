<?php
    include('function.php');

    print get_user_id_from_session_id(esc($_GET["session_id"]));
?>