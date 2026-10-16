<?php
require_once(__DIR__ . '/../_bootstrap.php');
feedback_require_method('POST');
feedback_admin_authed() or feedback_json_error('Not authenticated', 401);

$pdo = feedback_bootstrap();
$tok = $_COOKIE[FEEDBACK_ADMIN_COOKIE] ?? '';
$pdo->prepare('DELETE FROM admin_sessions WHERE token = ?')->execute([$tok]);
setcookie(FEEDBACK_ADMIN_COOKIE, '', time() - 3600, '/');
feedback_json_response(['ok' => true]);
