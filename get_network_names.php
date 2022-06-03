<?php
    include('functions.php');

    $filters = [];
    $options = [];

    $results = find_mongo("tfd.models", $filters, $options);

    foreach($results as $doc) {
        $array[] = $doc["network_name"];
    }
    
    header('Content-type: application/json');
    print json_encode($array);
?>  