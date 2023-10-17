<?php
    include('functions.php');
    
    $query = "select name from model";
    $result = run_query($query);

    while ($row = $result->fetch_assoc()) {
        $names[] = $row["name"];
    }

    header('Content-type: application/json');
    print json_encode($names);

?>