<?php
declare(strict_types=1);

function tm_parse_sim_date(?string $raw): ?DateTimeImmutable {
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

$simRaw = $_GET['date'] ?? $_GET['datum'] ?? null;
$today = tm_parse_sim_date($simRaw) ?? new DateTimeImmutable('today');
$monthDay = $today->format('m-d');
$showSnow = ((int) $today->format('n') === 12) || ((int) $today->format('n') === 1 && (int) $today->format('j') <= 6);
$showSanta = $monthDay === '12-24';
$showFireworks = in_array($monthDay, ['12-31', '01-01'], true);
$showSeasonal = $showSnow || $showSanta || $showFireworks;
$unlockStart = new DateTimeImmutable('2026-12-01');
$unlocked = 31;
if ($today >= $unlockStart) {
	$daysSinceStart = (int) $unlockStart->diff($today->setTime(0, 0))->format('%a');
	$unlocked = min(31, max(1, $daysSinceStart + 1));
}
$isDecember2026 = $today->format('Y') === '2026' && $today->format('n') === '12';
$todayDay = $isDecember2026 ? (int) $today->format('j') : 0;

// Date-gated labels are generated per day, so they cannot live as fixed
// keys in lang/de/index.php; format them server-side instead.
$isDe = (function_exists('tm_lang') ? tm_lang() : strtolower((string) ($_GET['lang'] ?? ($_COOKIE['tm_lang'] ?? '')))) === 'de';
$lockedLabel = $isDe ? 'Gesperrt' : 'Locked';
$sectionPrefix = $isDe ? 'Abschnitt ' : 'Section ';
$monthNames = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
$opensOn = static function (DateTimeImmutable $date) use ($isDe, $monthNames): string {
	if (!$isDe) {
		return 'Opens on ' . $date->format('j F Y');
	}
	return 'Öffnet am ' . $date->format('j') . '. ' . $monthNames[(int) $date->format('n')] . ' ' . $date->format('Y');
};

$calendarHtml = '';
$adventPath = __DIR__ . '/advent.php';
if (is_file($adventPath)) {
	$source = file_get_contents($adventPath);
	$startMarker = '<!-- CALENDAR:START -->';
	$endMarker = '<!-- CALENDAR:END -->';
	$start = strpos($source, $startMarker);
	$end = strpos($source, $endMarker);
	if ($start !== false && $end !== false && $end > $start) {
		$calendarHtml = substr($source, $start + strlen($startMarker), $end - $start - strlen($startMarker));
	}
}

$calendarHtml = preg_replace_callback(
	'/<a class="day-card[^"]*"[^>]*data-day="(\d+)"[^>]*>.*?<\/a>/s',
	function (array $match) use ($unlocked, $todayDay, $unlockStart, $lockedLabel, $opensOn): string {
		$day = (int) $match[1];
		if ($day > $unlocked) {
			$number = str_pad((string) $day, 2, '0', STR_PAD_LEFT);
			$opens = $opensOn($unlockStart->modify('+' . ($day - 1) . ' days'));
			return '<div class="day-card is-locked" id="day-' . $day . '" data-day="' . $day . '">'
				. '<div class="dc-top"><span class="dc-num">' . $number . '</span><span class="dc-part">' . $lockedLabel . '</span></div>'
				. '<div class="dc-locked" aria-hidden="true">?</div>'
				. '<p class="dc-locked-note">' . htmlspecialchars($opens, ENT_QUOTES, 'UTF-8') . '</p>'
				. '<div class="dc-foot"><span class="dc-tag">' . $lockedLabel . '</span></div>'
				. '</div>';
		}
		$card = $match[0];
		if ($day === $todayDay) {
			$card = preg_replace('/class="day-card([^"]*)"/', 'class="day-card$1 is-today"', $card, 1);
			$card = str_replace('<span class="dc-today" hidden>', '<span class="dc-today">', $card);
		}
		return $card;
	},
	$calendarHtml
);

$chunks = preg_split('/(?=<p class="week-label">)/', $calendarHtml);
$calendarHtml = '';
foreach ($chunks as $chunk) {
	if (strpos($chunk, 'class="day-card') === false) {
		continue;
	}
	if (preg_match('/<p class="week-label">Section (\d+)[^<]*Days (\d+)-(\d+)<\/p>/u', $chunk, $label)) {
		$firstDay = (int) $label[2];
		if ($firstDay > $unlocked) {
			$sectionOpens = $opensOn($unlockStart->modify('+' . ($firstDay - 1) . ' days'));
			$chunk = preg_replace(
				'/<p class="week-label">.*?<\/p>/u',
				'<p class="week-label">' . $sectionPrefix . $label[1] . ' · ' . $lockedLabel . ' · ' . htmlspecialchars($sectionOpens, ENT_QUOTES, 'UTF-8') . '</p>',
				$chunk,
				1
			);
		}
	}
	$calendarHtml .= $chunk;
}

$preSeason = $today >= new DateTimeImmutable('2026-11-29') && $today < new DateTimeImmutable('2026-12-01');
if ($preSeason) {
	$calendarHtml = '<div class="calendar-notice">'
		. '<h3>The first door opens on 1 December 2026.</h3>'
		. '<p>Come back then for Day 1. From then on, one new door opens each day.</p>'
		. '</div>';
}

$simDateLabel = $today->format('j F Y');
?>
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="An end-of-year AI calendar from ScaDS.AI Dresden/Leipzig: one short article, roughly ten minutes, with an interactive demo for every day.">
	<meta name="theme-color" content="#ffffff">
	<title>End-of-Year AI Calendar | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-page="calendar" data-tm-reload-lang="1"<?php if ($showSnow) echo ' data-snow="1"'; ?><?php if ($showSanta) echo ' data-santa="1"'; ?><?php if ($showFireworks) echo ' data-fireworks="1"'; ?>>
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero">
				<div>
					<p class="hero-deck">
						A guided path for a curious person. Each day opens a short article, roughly ten
						minutes, with an interactive demo or something to try: a small daily dose of AI,
						one idea at a time.
					</p>
					<p class="hero-deck">
						The calendar follows the ideas behind modern AI, from next-token prediction to the
						larger questions. Read one door a day, or follow the thread at your own pace.
					</p>
					<p class="tm-ai-disclaimer">This series was created with AI and intensively curated and reviewed by humans.</p>
				</div>
			</section>

			<section class="section section--tight" id="calendar">
				<p class="kicker">The 31-door calendar</p>
				<div id="calendar-doors">
<?php echo $calendarHtml; ?>
				</div>
				<?php if ($showSanta): ?>
				<p class="season-credit"><?php echo $isDe ? 'Weihnachtsmann-Schlitten-Sprite: ' : 'Santa sleigh sprite: '; ?><a href="https://opengameart.org/content/holiday-expansion-set" rel="noopener">ZomBCool</a>, <a href="https://creativecommons.org/publicdomain/zero/1.0/" rel="noopener">CC0</a>.</p>
				<?php endif; ?>
			</section>
		</div>
	</main>

	<?php if ($showSnow): ?><canvas class="season-layer" id="season-snow" aria-hidden="true"></canvas><?php endif; ?>
	<?php if ($showFireworks): ?><canvas class="season-layer" id="season-fireworks" aria-hidden="true"></canvas><?php endif; ?>
	<?php if ($showSanta): ?><div class="season-santa" aria-hidden="true"><img src="../santa_sleigh_pixel.png" alt=""></div><?php endif; ?>

	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<?php if ($showSeasonal): ?><script src="assets/seasonal.js?v=<?php echo filemtime(__DIR__.'/assets/seasonal.js'); ?>"></script><?php endif; ?>
	<script>
	(function () {
		"use strict";
		var done = TM.done();
		document.querySelectorAll(".day-card").forEach(function (card) {
			var slug = card.getAttribute("data-slug");
			if (slug && done.indexOf(slug) !== -1) {
				card.classList.add("is-done");
			}
		});
	})();
	</script>
</body>
</html>
