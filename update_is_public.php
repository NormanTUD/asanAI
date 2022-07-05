<?php
	include('functions.php');

	if(is_admin()) {
		if(array_key_exists("id", $_GET)) {
			if(array_key_exists("is_public", $_GET)) {
				$id = $_GET["id"];
				$is_public = $_GET["is_public"];
				if(public_is_requested($id)) {
					set_is_public($id, $is_public);
				} else {
					print "The user don't requested this network to be made public.";
				}
			} else {
				print "is_public must be either 0 or 1";
			}
		} else {
			print "There is no network name.";
		}
	} else {
		print "You don't have the permission to do edit.";
	}
?>
