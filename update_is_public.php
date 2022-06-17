<?php
    include('functions.php');

    if(is_admin()) {
        if(array_key_exists("network_name", $_GET)) {
            $network_name = $_GET["network_name"];
            if(public_is_requested($network_name) == "true") {

                if(set_is_public_true($network_name)) {
                    change_is_public($network_name, 'true');
                    print "ok public is true";
                } else {
                    change_is_public($network_name, 'false');
                    print "ok public is false";
                }
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