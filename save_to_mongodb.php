<?php
    include("functions.php");

    $array = [
        "model_structure" => json_decode($_GET["model_structure"], true),
        "model_weights" => json_decode($_GET["model_weights"], true),
        "user" => get_user_id_from_session_id($_COOKIES["session_id"]),
        "is_public" => $_GET["is_public"],
        "category" => $_GET["category"]
    ];

    save_mongo_models($array);

    header('Content-Type: application/json');
        print json_encode($array);

?>

// die save_to_mongodb() sollte beim klicken auf "Save" aufgerufen werden, aber bisher werden
// die Daten noch nicht in der DB gespeichert