<?php
    include("functions.php");

    $array = [
        "model_structure" => json_decode($_GET["model_structure"], true),
        "model_weights" => json_decode($_GET["model_weights"], true),
        "user" => get_user_id_from_session_id($_COOKIES["session_id"]),
        "is_public" => $_GET["is_public"],
        "category" => $_GET["category"]
    ];

    header('Content-Type: application/json');
        print json_encode($array);

?>
