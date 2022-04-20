<?php

    $GLOBALS['password'] = trim(file_get_contents('/etc/dbpw'));
    $GLOBALS['mysqli'] = new mysqli("localhost", "root", $GLOBALS['password']);
    if($GLOBALS['mysqli']->connect_errno) {
		die("Verbindung fehlgeschlagen: " . $GLOBALS['mysqli']->connect_error);
    }
?>