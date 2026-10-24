<?php
/*
 * Analytics storage configuration.
 *
 * Set db_path to an absolute path outside the web root, for example:
 *   'db_path' => '/var/lib/asanai-blog/analytics.sqlite',
 *
 * Leave it empty to use the default blog/analytics_data/analytics.sqlite.
 * The directory must be writable by the web server user. The admin dashboard
 * (Storage & backup) shows the active path and the exact commands to create it.
 */
return [
	'db_path' => '',
];
