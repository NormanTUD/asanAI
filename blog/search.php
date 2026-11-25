<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

require_once __DIR__ . '/search_lib.php';

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$data = runSearch($q, __DIR__, search_excludes(), true);

echo json_encode($data, JSON_UNESCAPED_UNICODE);
