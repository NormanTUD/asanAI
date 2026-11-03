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
$unlockStart = new DateTimeImmutable('2026-12-01');
$unlocked = 31;
if ($today >= $unlockStart) {
	$daysSinceStart = (int) $unlockStart->diff($today->setTime(0, 0))->format('%a');
	$unlocked = min(31, max(1, $daysSinceStart + 1));
}
$isDecember2026 = $today->format('Y') === '2026' && $today->format('n') === '12';
$todayDay = $isDecember2026 ? (int) $today->format('j') : 0;

$calendarHtml = '';
$adventPath = __DIR__ . '/advent.html';
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
	function (array $match) use ($unlocked, $todayDay, $unlockStart): string {
		$day = (int) $match[1];
		if ($day > $unlocked) {
			$number = str_pad((string) $day, 2, '0', STR_PAD_LEFT);
			$opens = $unlockStart->modify('+' . ($day - 1) . ' days')->format('j F Y');
			return '<div class="day-card is-locked" id="day-' . $day . '" data-day="' . $day . '">'
				. '<div class="dc-top"><span class="dc-num">' . $number . '</span><span class="dc-part">Locked</span></div>'
				. '<div class="dc-locked" aria-hidden="true">?</div>'
				. '<p class="dc-locked-note">Opens on ' . htmlspecialchars($opens, ENT_QUOTES, 'UTF-8') . '</p>'
				. '<div class="dc-foot"><span class="dc-tag">Locked</span></div>'
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
			$sectionOpens = $unlockStart->modify('+' . ($firstDay - 1) . ' days')->format('j F Y');
			$chunk = preg_replace(
				'/<p class="week-label">.*?<\/p>/u',
				'<p class="week-label">Section ' . $label[1] . ' · Locked · Opens on ' . htmlspecialchars($sectionOpens, ENT_QUOTES, 'UTF-8') . '</p>',
				$chunk,
				1
			);
		}
	}
	$calendarHtml .= $chunk;
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
	<link rel="stylesheet" href="assets/site.css">
</head>
<body data-page="calendar">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero">
				<canvas class="constellation" id="constellation" aria-hidden="true"></canvas>
				<div>
					<p class="kicker">ScaDS.AI Dresden/Leipzig · end-of-year AI calendar</p>
					<h1>Learn something about AI <em>every day.</em></h1>
					<p class="hero-deck">
						A guided path for a curious person. Each day opens a short article, roughly ten
						minutes, with an interactive demo or something to try: a small daily dose of AI,
						one idea at a time.
					</p>
					<p class="hero-deck">
						The calendar follows the ideas behind modern AI, from next-token prediction to the
						larger questions. Read one door a day, or follow the thread at your own pace.
					</p>
				</div>
			</section>

			<section class="section section--tight" id="calendar">
				<p class="kicker">The 31-door calendar</p>
				<div id="calendar-doors">
<?php echo $calendarHtml; ?>
				</div>
			</section>
		</div>
	</main>

	<script src="assets/site.js"></script>
	<script>
	(function () {
		"use strict";
		var canvas = document.getElementById("constellation");
		if (canvas) {
			var pts = [];
			var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			for (var i = 0; i < 38; i++) {
				pts.push({
					x: Math.random(),
					y: Math.random(),
					r: 0.7 + Math.random() * 1.8,
					s: 0.004 + Math.random() * 0.012
				});
			}
			var api = TM.initCanvas(canvas, function (ctx, w, h) {
				var c = TM.colors();
				var now = performance.now() / 1000;
				ctx.clearRect(0, 0, w, h);
				var green = c.dark ? "143,217,119" : "61,140,47";
				var blue = c.dark ? "74,180,224" : "0,116,172";
				pts.forEach(function (p) {
					var y = reduce ? p.y : (p.y - now * p.s) % 1;
					if (y < 0) y += 1;
					ctx.beginPath();
					ctx.arc(p.x * w, y * h, p.r, 0, Math.PI * 2);
					ctx.fillStyle = "rgba(" + blue + ",0.42)";
					ctx.fill();
				});
				for (var a = 0; a < pts.length; a++) {
					var ay = reduce ? pts[a].y : ((pts[a].y - now * pts[a].s) % 1 + 1) % 1;
					for (var b = a + 1; b < pts.length; b++) {
						var by = reduce ? pts[b].y : ((pts[b].y - now * pts[b].s) % 1 + 1) % 1;
						var dx = (pts[a].x - pts[b].x) * w;
						var dy = (ay - by) * h;
						var d = Math.hypot(dx, dy);
						if (d < 128) {
							ctx.strokeStyle = "rgba(" + green + "," + (0.13 * (1 - d / 128)) + ")";
							ctx.lineWidth = 0.7;
							ctx.beginPath();
							ctx.moveTo(pts[a].x * w, ay * h);
							ctx.lineTo(pts[b].x * w, by * h);
							ctx.stroke();
						}
					}
				}
			});
			if (!reduce) {
				(function loop() { api.redraw(); requestAnimationFrame(loop); })();
			}
			window.addEventListener("tm:theme", function () { api.redraw(); });
		}

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
