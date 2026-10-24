<?php
/*
 * Anonymous analytics beacon endpoint.
 *
 * Accepted body (JSON, at most 4 KB):
 *   { event: "view"|"heartbeat"|"leave"|"optout",
 *     token: 32 hex chars,
 *     duration: seconds (0..14400),
 *     scroll: 0..100 or null }
 *
 * The request is deliberately not associated with an IP address, user agent,
 * cookie, referrer or any other client property. The token is the random
 * per-pageview value embedded in the page and is erased from the database
 * when the visit is finalized.
 */
declare(strict_types=1);

define('MN_ANALYTICS_DISABLED', true);
require_once __DIR__ . '/lib/analytics.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function mn_track_end(int $code = 204): void {
	http_response_code($code);
	if ($code !== 204) {
		echo '{}';
	}
	exit;
}

if (mn_analytics_is_kill_switched()) {
	mn_track_end(204);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
	header('Allow: POST');
	mn_track_end(405);
}

$fetchSite = strtolower((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? ''));
if ($fetchSite === 'cross-site') {
	mn_track_end(204);
}

$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '' && $fetchSite === '') {
	$originHost = (string)(parse_url($origin, PHP_URL_HOST) ?? '');
	$host = (string)($_SERVER['HTTP_HOST'] ?? '');
	$host = (string)preg_replace('/:\d+$/', '', $host);
	if ($originHost === '' || $host === '' || strcasecmp($originHost, $host) !== 0) {
		mn_track_end(204);
	}
}

$raw = file_get_contents('php://input', false, null, 0, 4096);
if ($raw === false || $raw === '') {
	mn_track_end(204);
}
$data = json_decode($raw, true);
if (!is_array($data)) {
	mn_track_end(204);
}

$token = isset($data['token']) && is_string($data['token'])
	? strtolower(trim($data['token']))
	: '';
if (!preg_match('/^[a-f0-9]{32}$/', $token)) {
	mn_track_end(204);
}

$event = isset($data['event']) && is_string($data['event'])
	? $data['event']
	: '';
if (!in_array($event, ['view', 'heartbeat', 'leave', 'optout'], true)) {
	mn_track_end(204);
}

$duration = isset($data['duration']) && is_numeric($data['duration'])
	? (int)$data['duration']
	: 0;
$duration = max(0, min(14400, $duration));

$scroll = null;
if (array_key_exists('scroll', $data) && $data['scroll'] !== null && is_numeric($data['scroll'])) {
	$scroll = max(0, min(100, (int)$data['scroll']));
}

if ($event === 'optout') {
	mn_analytics_delete_token($token);
	mn_track_end(204);
}
if ($event === 'view') {
	mn_track_end(204);
}

$sections = isset($data['sections']) && is_array($data['sections']) ? array_slice($data['sections'], 0, 16) : [];
$events = isset($data['events']) && is_array($data['events']) ? array_slice($data['events'], 0, 24) : [];
mn_analytics_update_token($token, $duration, $scroll, $event === 'leave', $sections, $events);
mn_track_end(204);
