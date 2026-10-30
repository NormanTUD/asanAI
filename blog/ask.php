<?php
declare(strict_types=1);

/* Public JSON proxy for the local RAG answer service.
 *
 * The service binds to 127.0.0.1; this endpoint is the only public entry. It
 * forwards the client IP for rate limiting and never exposes the service URL.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
set_time_limit(15);

$service = rtrim(getenv('ASANAI_RAG_URL') ?: 'http://127.0.0.1:8090', '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function rag_request(string $url, string $method = 'GET', ?string $body = null, array $headers = []): array {
	if (!function_exists('curl_init')) {
		$context = stream_context_create([
			'http' => [
				'method' => $method,
				'header' => implode("\r\n", $headers),
				'content' => $body === null ? '' : $body,
				'timeout' => 8,
				'ignore_errors' => true,
			],
		]);
		$raw = @file_get_contents($url, false, $context);
		if ($raw === false) {
			return [0, ['ok' => false, 'error' => 'unavailable']];
		}
		$code = 0;
		if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $match)) {
			$code = (int)$match[1];
		}
		$data = json_decode($raw, true);
		return [$code, is_array($data) ? $data : ['ok' => false, 'error' => 'bad_response']];
	}
	$ch = curl_init($url);
	$options = [
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_CONNECTTIMEOUT => 1,
		CURLOPT_TIMEOUT => 8,
		CURLOPT_CUSTOMREQUEST => $method,
		CURLOPT_HTTPHEADER => $headers,
	];
	if ($body !== null) {
		$options[CURLOPT_POSTFIELDS] = $body;
	}
	curl_setopt_array($ch, $options);
	$raw = curl_exec($ch);
	$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);
	if ($raw === false) {
		return [0, ['ok' => false, 'error' => 'unavailable']];
	}
	$data = json_decode($raw, true);
	if (!is_array($data)) {
		return [$code, ['ok' => false, 'error' => 'bad_response']];
	}
	return [$code, $data];
}

function rag_reply(int $code, array $data): void {
	http_response_code($code);
	echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
	exit;
}

function rag_client_ip(): string {
	$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
	if (getenv('ASANAI_RAG_TRUST_PROXY') === '1' && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
		$parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
		$candidate = trim($parts[0]);
		if (filter_var($candidate, FILTER_VALIDATE_IP)) {
			$ip = $candidate;
		}
	}
	return $ip;
}

if ($method === 'GET' && isset($_GET['health'])) {
	[, $data] = rag_request($service . '/health');
	/* A missing backend is not an error the browser should log. */
	rag_reply(200, $data);
}

if ($method === 'GET' && isset($_GET['status'])) {
	$id = preg_replace('/[^a-f0-9]/', '', (string)$_GET['status']);
	if ($id === '') {
		rag_reply(400, ['error' => 'invalid_id']);
	}
	[$code, $data] = rag_request($service . '/status?id=' . rawurlencode($id));
	rag_reply($code ?: 503, $data);
}

if ($method !== 'POST') {
	rag_reply(405, ['error' => 'method_not_allowed']);
}

$raw = file_get_contents('php://input', false, null, 0, 32769);
if ($raw === false || strlen($raw) > 32768) {
	rag_reply(413, ['error' => 'body_too_large']);
}
$payload = json_decode($raw, true);
if (!is_array($payload) || !isset($payload['question'])) {
	rag_reply(400, ['error' => 'invalid_json']);
}
$payload['question'] = (string)$payload['question'];
$payload['lang'] = (string)($payload['lang'] ?? 'en');
$payload['history'] = is_array($payload['history'] ?? null) ? $payload['history'] : [];
$body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
[$code, $data] = rag_request(
	$service . '/ask',
	'POST',
	$body,
	['Content-Type: application/json', 'X-Client-IP: ' . rag_client_ip()]
);
rag_reply($code ?: 503, $data);
