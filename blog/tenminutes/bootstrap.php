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

function tm_full_lesson_title(string $slug): string
{
	static $titles = [];
	if (isset($titles[$slug])) {
		return $titles[$slug];
	}
	$title = $slug;
	$file = __DIR__ . '/../' . $slug . '.php';
	if (is_file($file)) {
		$head = file_get_contents($file, false, null, 0, 4096);
		if ($head !== false && preg_match('/^\s*title:\s*(.+)$/m', $head, $match)) {
			$title = trim($match[1]);
		}
	}
	$titles[$slug] = $title;
	return $title;
}

function tm_full_article_html(string $compactSlug): string
{
	$lessons = TM_FULL_LESSON_MAP[$compactSlug] ?? [$compactSlug];
	if ($lessons === []) {
		return '';
	}
	$html = '<aside class="full-article">';
	$html .= '<span class="full-article-kicker">The original lessons</span>';
	foreach ($lessons as $lesson) {
		$url = htmlspecialchars(tm_blog_lesson_url($lesson), ENT_QUOTES, 'UTF-8');
		$title = htmlspecialchars(tm_full_lesson_title($lesson), ENT_QUOTES, 'UTF-8');
		$html .= '<a class="full-article-main" href="' . $url . '">Read the full lesson: ' . $title . '</a>';
	}
	$html .= '</aside>';
	return $html;
}

$tm_today = tm_parse_date($_GET['date'] ?? $_GET['datum'] ?? null) ?? new DateTimeImmutable('today');
$tm_in_advent = $tm_today >= new DateTimeImmutable('2026-12-01')
	&& $tm_today <= new DateTimeImmutable('2026-12-31');

if (PHP_SAPI !== 'cli') {
	ob_start(static function (string $buffer) use ($tm_in_advent): string {
		if ($tm_in_advent) {
			return $buffer;
		}
		if (strpos($buffer, 'data-page="lesson"') === false) {
			return $buffer;
		}
		if (strpos($buffer, 'data-no-full-article') !== false) {
			return $buffer;
		}
		if (!preg_match('/data-lesson="([^"]+)"/', $buffer, $match)) {
			return $buffer;
		}
		if (strpos($buffer, '</article>') === false) {
			return $buffer;
		}
		$block = tm_full_article_html($match[1]);
		if ($block === '') {
			return $buffer;
		}
		return preg_replace('/<\/article>/', $block . '</article>', $buffer, 1) ?? $buffer;
	});
}
