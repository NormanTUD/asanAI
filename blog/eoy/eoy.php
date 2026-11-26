<?php
/*
 * Optional per-day article links. Empty means eoy/<day>?lang=<lang>.
 * Absolute URLs and {lang} placeholders are supported.
 *
 * $EOY_LINKS = [
 *     1 => 'https://scads.ai/...',
 *     2 => 'https://scads.ai/...',
 * ];
 */
$EOY_LINKS = [];

$advYear = 2026;
$lang = isset($_GET['lang']) ? strtolower((string) $_GET['lang']) : 'de';
$lang = $lang === 'en' ? 'en' : 'de';
$isDe = $lang === 'de';

function eoy_h($value) {
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function eoy_parse_date($raw) {
    $raw = trim((string) $raw);
    $raw = rtrim($raw, ". \t\n\r\0\x0B");
    if ($raw === '') return null;
    $day = null;
    $month = null;
    $year = null;
    if (preg_match('/^(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?$/', $raw, $m)) {
        $day = (int) $m[1];
        $month = (int) $m[2];
        $year = isset($m[3]) && $m[3] !== '' ? (int) $m[3] : 2026;
    } elseif (preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $raw, $m)) {
        $year = (int) $m[1];
        $month = (int) $m[2];
        $day = (int) $m[3];
    }
    if ($year !== null && $year < 100) $year += 2000;
    if (!$day || !$month || !$year || !checkdate($month, $day, $year)) return false;
    return new DateTimeImmutable(sprintf('%04d-%02d-%02d', $year, $month, $day));
}

function eoy_door_inner($dayLabel, $unlocked, $kicker, $title, $dateText, $isDe) {
    $state = $unlocked
        ? ($isDe ? 'Öffnen' : 'Open')
        : $dateText;
    $kickerText = $unlocked ? $kicker : ($isDe ? 'Noch verborgen' : 'Still hidden');
    ob_start();
    ?>
        <span class="adv-inside" aria-hidden="true">
            <span class="adv-inside-glow"></span>
            <span class="adv-inside-day"><?php echo eoy_h($dayLabel); ?></span>
        </span>
        <span class="adv-face">
            <span class="adv-face-top"><span class="adv-face-day"><?php echo eoy_h($dayLabel); ?></span><span class="adv-face-star" aria-hidden="true">✦</span></span>
            <span class="adv-face-kicker"><?php echo eoy_h($kickerText); ?></span>
            <?php if ($unlocked): ?>
                <span class="adv-face-title"><?php echo eoy_h($title); ?></span>
            <?php endif; ?>
            <span class="adv-face-state"><?php echo eoy_h($state); ?></span>
        </span>
    <?php
    return (string) ob_get_clean();
}

function eoy_article_link($day, $lang, $overrides) {
    $link = isset($overrides[$day]) ? trim((string) $overrides[$day]) : '';
    if ($link === '') {
        return $day . '?lang=' . rawurlencode($lang);
    }
    $link = str_replace('{lang}', rawurlencode($lang), $link);
    if (!preg_match('~^(https?://|/|\.\.?/)~i', $link) && strpos($link, '.') !== false) {
        $link = 'https://' . $link;
    }
    return $link;
}

$previewRaw = $_GET['datum'] ?? $_GET['date'] ?? null;
$previewDate = is_string($previewRaw) && trim($previewRaw) !== '' ? eoy_parse_date($previewRaw) : null;
$effective = ($previewDate instanceof DateTimeImmutable) ? $previewDate : new DateTimeImmutable('today');

$previewAll = [];
$previewFile = __DIR__ . '/text_preview.json';
if (is_file($previewFile)) {
    $decoded = json_decode((string) @file_get_contents($previewFile), true);
    if (is_array($decoded) && isset($decoded[$lang]) && is_array($decoded[$lang])) $previewAll = $decoded[$lang];
}

$titles = [];
$kickers = [];
for ($day = 1; $day <= 31; $day++) {
    $entry = $previewAll[(string) $day] ?? null;
    $titles[$day] = is_array($entry) && isset($entry['title']) && trim((string) $entry['title']) !== ''
        ? trim(strip_tags((string) $entry['title']))
        : ($isDe ? 'Kapitel ' . $day : 'Chapter ' . $day);
    $kickers[$day] = is_array($entry) && isset($entry['kicker']) ? trim(strip_tags((string) $entry['kicker'])) : '';
}

$unlockDates = [];
for ($day = 1; $day <= 31; $day++) {
    $unlockDates[$day] = new DateTimeImmutable(sprintf('%04d-12-%02d', $advYear, $day));
}
$pageTitle = $isDe ? 'Adventskalender 2026' : 'Advent calendar 2026';
?>
<!DOCTYPE html>
<html lang="<?php echo eoy_h($lang); ?>" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="description" content="<?php echo eoy_h($isDe ? '31 Tage vom 1. bis 31. Dezember 2026: ein interaktiver Adventskalender durch die Ideen hinter großen Sprachmodellen.' : '31 days from 1 to 31 December 2026: an interactive advent calendar through the ideas behind large language models.'); ?>">
    <meta name="theme-color" content="#004b6f">
    <title><?php echo eoy_h($pageTitle); ?></title>
    <link rel="stylesheet" href="assets/site.css?v=<?php echo (int) @filemtime(__DIR__ . '/assets/site.css'); ?>">
    <link rel="stylesheet" href="advent.css?v=<?php echo (int) @filemtime(__DIR__ . '/advent.css'); ?>">
    <link rel="stylesheet" href="scads-theme.css?v=<?php echo (int) @filemtime(__DIR__ . '/scads-theme.css'); ?>">
</head>
<body class="adv-page">
    <main class="adv-shell">
        <section class="adv-calendar" aria-label="<?php echo eoy_h($isDe ? 'Adventskalender' : 'Advent calendar'); ?>">
            <div class="adv-grid">
                <?php for ($day = 1; $day <= 31; $day++):
                    $unlocked = $effective >= $unlockDates[$day];
                    $isToday = $effective->format('Y-m-d') === sprintf('%04d-12-%02d', $advYear, $day);
                    $link = eoy_article_link($day, $lang, $EOY_LINKS);
                    $title = $titles[$day];
                    $kicker = $kickers[$day];
                    $dayLabel = sprintf('%02d', $day);
                    $aria = $unlocked
                        ? ($isDe ? 'Tag ' . $day . ': ' . $title . '. Artikel öffnen.' : 'Day ' . $day . ': ' . $title . '. Open article.')
                        : ($isDe ? 'Tag ' . $day . ': noch geschlossen. Öffnet am ' . $day . '. Dezember 2026.' : 'Day ' . $day . ': still closed. Opens on ' . $day . ' December 2026.');
                    $dateText = $isDe ? ('Öffnet am ' . $day . '. Dez.') : ('Opens ' . $day . ' Dec');
                ?>
                    <?php $inner = eoy_door_inner($dayLabel, $unlocked, $kicker, $title, $dateText, $isDe); ?>
                    <?php if ($unlocked): ?>
                        <a class="adv-door<?php echo $isToday ? ' is-today' : ''; ?>" style="--i:<?php echo $day; ?>" href="<?php echo eoy_h($link); ?>" target="_blank" rel="noopener" data-day="<?php echo $day; ?>" data-url="<?php echo eoy_h($link); ?>" aria-label="<?php echo eoy_h($aria); ?>"><?php echo $inner; ?></a>
                    <?php else: ?>
                        <button class="adv-door is-locked<?php echo $isToday ? ' is-today' : ''; ?>" style="--i:<?php echo $day; ?>" type="button" data-day="<?php echo $day; ?>" aria-label="<?php echo eoy_h($aria); ?>" aria-disabled="true"><?php echo $inner; ?></button>
                    <?php endif; ?>
                <?php endfor; ?>
            </div>
        </section>

    </main>
    <script src="advent.js?v=<?php echo (int) @filemtime(__DIR__ . '/advent.js'); ?>"></script>
</body>
</html>
