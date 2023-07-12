<?php
// Get the current script's directory
$currentDirectory = dirname($_SERVER['SCRIPT_NAME']);

// Get the parent directory's URL
$parentDirectory = rtrim($currentDirectory, '/');
$parentDirectory = preg_replace('/cosmo\/?$/', '', $parentDirectory);

// Append the parent directory's URL with the index.php file and query parameters
$redirectURL = $parentDirectory . '/index.php?' . $_SERVER['QUERY_STRING'] . '&start_cosmo=1';

// Perform the redirect
header("Location: $redirectURL");
exit;
?>
