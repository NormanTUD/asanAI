<?php
    include('functions.php');

    function public_is_requested($network_name) {
        $filters = ['network_name' => $network_name];
        $options = ['projection' => ['requests_public' => true]];
        $results = find_mongo("tfd.models", $filters, $options);
        return $results[0]["requests_public"];
    }

    function set_is_public_true($network_name) {
        $filters = ['network_name' => $network_name];
        $options = ['projection' => ['is_public' => true]];
        $results = find_mongo("tfd.models", $filters, $options);
        if($results[0]["is_public"] == "true") {
            return false;
        }
        return true;
    }

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