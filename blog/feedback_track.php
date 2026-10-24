<?php
/*
 * Reader block-feedback endpoint.
 *
 * Accepts a JSON body (at most 96 KB) with the selected passage, the
 * reaction, an optional comment/email, and — only for explicit bug
 * reports — an opt-in snapshot of console output and recent clicks.
 *
 * No IP address, user agent, cookie or referrer is stored. The only
 * client properties kept are those the reader explicitly consents to
 * in the feedback panel.
 */
declare(strict_types=1);

define('MN_ANALYTICS_DISABLED', true);
require_once __DIR__ . '/lib/analytics.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function mn_feedback_end(int $code, array $payload = []): void {
	http_response_code($code);
	if ($code !== 204) {
		echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
	}
	exit;
}

if (mn_feedback_is_disabled()) {
	mn_feedback_end(204);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
	header('Allow: POST');
	mn_feedback_end(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

$fetchSite = strtolower((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? ''));
if ($fetchSite === 'cross-site') {
	mn_feedback_end(204);
}

$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '' && $fetchSite === '') {
	$originHost = (string)(parse_url($origin, PHP_URL_HOST) ?? '');
	$host = (string)($_SERVER['HTTP_HOST'] ?? '');
	$host = (string)preg_replace('/:\d+$/', '', $host);
	if ($originHost === '' || $host === '' || strcasecmp($originHost, $host) !== 0) {
		mn_feedback_end(204);
	}
}

$raw = file_get_contents('php://input', false, null, 0, 98304);
if ($raw === false || $raw === '') {
	mn_feedback_end(204);
}
$data = json_decode($raw, true);
if (!is_array($data)) {
	mn_feedback_end(400, ['ok' => false, 'error' => 'invalid_json']);
}

if (!empty($data['website'])) {
	mn_feedback_end(204);
}

$token = isset($data['token']) && is_string($data['token']) ? trim($data['token']) : '';
if (!mn_feedback_verify_token($token)) {
	mn_feedback_end(400, ['ok' => false, 'error' => 'invalid_token']);
}

$result = mn_feedback_store($data);
if (empty($result['ok'])) {
	$error = (string)($result['error'] ?? 'unavailable');
	if ($error === 'invalid_reaction' || $error === 'invalid_path' || $error === 'invalid_email') {
		mn_feedback_end(400, ['ok' => false, 'error' => $error]);
	}
	mn_feedback_end(503, ['ok' => false, 'error' => 'unavailable']);
}

mn_feedback_end(200, [
	'ok' => true,
	'id' => (int)($result['id'] ?? 0),
	'duplicate' => !empty($result['duplicate']),
]);
