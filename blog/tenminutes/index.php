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
	$calendarHtml .= $chunk;
}

$simDateLabel = $today->format('j F Y');
?>
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="A compact, interactive companion to From Nothing to Large Language Models: 31 doors, ten minutes each.">
	<meta name="theme-color" content="#ffffff">
	<title>Ten Minutes | From Nothing to Large Language Models</title>
	<link rel="stylesheet" href="assets/site.css">
</head>
<body data-page="calendar">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero">
				<canvas class="constellation" id="constellation" aria-hidden="true"></canvas>
				<div>
					<p class="kicker">From Nothing to Large Language Models · compact edition</p>
					<h1>The whole course. <em>Ten minutes</em> at a time.</h1>
					<p class="hero-deck">
						A compact, interactive companion to the long textbook, made at
						<strong>ScaDS.AI Dresden/Leipzig</strong>. Each door is a self-contained lesson:
						one idea, something to try, and one clear takeaway.
					</p>
					<p class="hero-deck">
						The calendar is a reading route through the whole arc, from the first next-token
						prediction to the larger questions. Read one door a day, or follow the thread.
					</p>
					<div class="hero-meta">
						<span class="pill pill--green"><b id="doors-open"><?php echo $unlocked; ?></b> of 31 doors open</span>
						<span class="pill"><b id="advent-done">0</b> completed</span>
						<span class="pill pill--blue">Progress saved locally</span>
						<?php if (isset($_GET['date']) || isset($_GET['datum'])): ?>
						<span class="pill pill--blue">Simulated date: <?php echo htmlspecialchars($simDateLabel, ENT_QUOTES, 'UTF-8'); ?></span>
						<?php endif; ?>
					</div>
				</div>
			</section>

			<section class="section section--tight" id="calendar">
				<div class="section-head">
					<div>
						<p class="kicker">The 31-door calendar</p>
						<h2>One idea each. Ten minutes at a time.</h2>
					</div>
					<p>
						From 1 December 2026, one new door opens each day. Before then, every door is open.
						The arc starts with prediction and reaches the transformer around Day 22, then
						turns outward to the larger questions.
					</p>
				</div>
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
		var doneCount = 0;
		document.querySelectorAll(".day-card").forEach(function (card) {
			var slug = card.getAttribute("data-slug");
			if (slug && done.indexOf(slug) !== -1) {
				card.classList.add("is-done");
				doneCount++;
			}
		});
		var counter = document.getElementById("advent-done");
		if (counter) counter.textContent = doneCount;
	})();
	</script>
</body>
</html>
