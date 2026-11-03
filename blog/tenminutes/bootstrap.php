<?php
declare(strict_types=1);

require_once __DIR__ . '/globals.php';

function tm_parse_date(?string $raw): ?DateTimeImmutable
{
	if ($raw === null) {
		return null;
	}
	$raw = trim($raw);
	if ($raw === '') {
		return null;
	}
	foreach (['!j.n.Y', '!j.n.y', '!Y-m-d', '!d.m.Y', '!d/m/Y', '!Y/m/d'] as $format) {
		$date = DateTimeImmutable::createFromFormat($format, $raw);
		if ($date instanceof DateTimeImmutable) {
			$errors = DateTimeImmutable::getLastErrors();
			if ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0)) {
				return $date;
			}
		}
	}
	$timestamp = strtotime($raw);
	if ($timestamp === false) {
		return null;
	}
	return (new DateTimeImmutable('@' . $timestamp))->setTimezone(new DateTimeZone(date_default_timezone_get()));
}

function tm_lang(): string
{
	$requested = strtolower((string) ($_GET['lang'] ?? ''));
	if ($requested === 'de' || $requested === 'en') {
		return $requested;
	}
	$cookie = strtolower((string) ($_COOKIE['tm_lang'] ?? ''));
	return $cookie === 'de' ? 'de' : 'en';
}

function tm_load_lang(string $slug): array
{
	$dict = ['lang' => 'en', 'blocks' => [], 'texts' => [], 'attrs' => [], 'title' => '', 'description' => ''];
	if (tm_lang() !== 'de') {
		return $dict;
	}
	$dict['lang'] = 'de';
	$files = [__DIR__ . '/lang/de/shared.php'];
	if ($slug === 'index' || $slug === 'advent') {
		$files[] = __DIR__ . '/lang/de/calendar.php';
	}
	$files[] = __DIR__ . '/lang/de/' . $slug . '.php';
	foreach ($files as $file) {
		if (!is_file($file)) {
			continue;
		}
		$part = require $file;
		if (!is_array($part)) {
			continue;
		}
		foreach (['blocks', 'texts', 'attrs'] as $key) {
			if (isset($part[$key]) && is_array($part[$key])) {
				$dict[$key] = array_merge($dict[$key], $part[$key]);
			}
		}
		if (!empty($part['title'])) {
			$dict['title'] = (string) $part['title'];
		}
		if (!empty($part['description'])) {
			$dict['description'] = (string) $part['description'];
		}
	}
	return $dict;
}

function tm_full_lesson_title(string $slug, string $lang = 'en'): string
{
	static $titles = [];
	$cacheKey = $slug . ':' . $lang;
	if (isset($titles[$cacheKey])) {
		return $titles[$cacheKey];
	}
	if ($lang === 'de' && isset(TM_FULL_LESSON_TITLES_DE[$slug])) {
		return $titles[$cacheKey] = TM_FULL_LESSON_TITLES_DE[$slug];
	}
	$title = $slug;
	$file = __DIR__ . '/../' . $slug . '.php';
	if (is_file($file)) {
		$head = file_get_contents($file, false, null, 0, 4096);
		if ($head !== false && preg_match('/^\s*title:\s*(.+)$/m', $head, $match)) {
			$title = trim($match[1]);
		}
	}
	$titles[$cacheKey] = $title;
	return $title;
}

function tm_full_article_html(string $compactSlug, string $lang): string
{
	$lessons = TM_FULL_LESSON_MAP[$compactSlug] ?? [$compactSlug];
	if ($lessons === []) {
		return '';
	}
	$kicker = $lang === 'de' ? 'Die Originallektionen' : 'The original lessons';
	$prefix = $lang === 'de' ? 'Die vollständige Lektion lesen: ' : 'Read the full lesson: ';
	$html = '<aside class="full-article">';
	$html .= '<span class="full-article-kicker">' . $kicker . '</span>';
	foreach ($lessons as $lesson) {
		$entry = tm_full_lesson_entry($lesson);
		if ($entry['page'] === '') {
			continue;
		}
		$page = $entry['page'];
		if ($lang === 'de') {
			$page .= (strpos($page, '?') === false ? '?' : '&') . 'lang=de';
		}
		$url = htmlspecialchars($page, ENT_QUOTES, 'UTF-8');
		$title = $entry['title_de'] ?? null;
		if ($lang !== 'de' || $title === null) {
			$title = $lang === 'de' && $entry['slug'] !== ''
				? tm_full_lesson_title($entry['slug'], 'de')
				: ($entry['title'] ?? ($entry['slug'] !== '' ? tm_full_lesson_title($entry['slug'], 'en') : $url));
		}
		$title = htmlspecialchars((string) $title, ENT_QUOTES, 'UTF-8');
		$html .= '<a class="full-article-main" href="' . $url . '" target="_blank" rel="noopener">' . $prefix . $title . '</a>';
	}
	$html .= '</aside>';
	return $html;
}

$tm_lang = tm_lang();
if (PHP_SAPI !== 'cli' && isset($_GET['lang']) && ($_GET['lang'] === 'de' || $_GET['lang'] === 'en')) {
	setcookie('tm_lang', $tm_lang, [
		'expires' => time() + 31536000,
		'path' => '/',
		'samesite' => 'Lax',
	]);
}

$tm_today = tm_parse_date($_GET['date'] ?? $_GET['datum'] ?? null) ?? new DateTimeImmutable('today');
$tm_in_advent = $tm_today >= new DateTimeImmutable('2026-12-01')
	&& $tm_today <= new DateTimeImmutable('2026-12-31');

if (PHP_SAPI !== 'cli') {
	$pageSlug = pathinfo((string) ($_SERVER['SCRIPT_FILENAME'] ?? ''), PATHINFO_FILENAME);
	$tm_dict = tm_load_lang($pageSlug);
	$tm_i18nJson = json_encode($tm_dict, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
	$tm_i18nScript = "\n<script type=\"application/json\" id=\"tm-i18n\">" . $tm_i18nJson . "</script>\n"
		. "<script src=\"assets/i18n.js\" defer></script>\n";

	ob_start(static function (string $buffer) use ($tm_in_advent, $tm_lang, $tm_i18nScript): string {
		$isHtml = stripos($buffer, '</body>') !== false;
		if ($isHtml && !$tm_in_advent
			&& strpos($buffer, 'data-page="lesson"') !== false
			&& strpos($buffer, 'data-no-full-article') === false
			&& preg_match('/data-lesson="([^"]+)"/', $buffer, $match)
			&& strpos($buffer, '</article>') !== false) {
			$block = tm_full_article_html($match[1], $tm_lang);
			if ($block !== '') {
				$buffer = preg_replace('/<\/article>/', $block . '</article>', $buffer, 1) ?? $buffer;
			}
		}
		if ($isHtml) {
			$buffer = preg_replace('/<\/body>/i', $tm_i18nScript . '</body>', $buffer, 1) ?? $buffer;
		}
		return $buffer;
	});
}
