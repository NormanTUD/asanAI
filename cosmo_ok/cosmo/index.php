<?php
// Get the parent directory's URL
$parentDirectory = dirname($_SERVER['SCRIPT_NAME']);

// Append the parent directory's URL with the index.php file and query parameters
$redirectURL = rtrim($parentDirectory, '/') . '/../index.php?' . $_SERVER['QUERY_STRING'] . '&start_cosmo=1';

// Perform the redirect
header("Location: $redirectURL");
exit;
?>

