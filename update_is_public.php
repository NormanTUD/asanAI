<?php
    include('functions.php');

    function public_is_requested($network_name) {
        $filters = ['network_name' => $network_name];
        $options = ['projection' => ['network_name' => true, 'is_public' => true, 'requests_public' => true]];
        $results = find_mongo("tfd.models", $filters, $options);
        dier($results);
    }

    if(is_admin()) {
        if(array_key_exists("network_name", $_GET)) {
            $network_name = $_GET["network_name"];
            if(public_is_requested($network_name)) {
                update_is_public($network_name);
                print "ok";
            } else {
                print "The user don't requested this network to be made public.";
            }
        } else {
            print "There is no network name.";
        }
    } else {
        print "You don't have the permission to do edit.";
    }
?>