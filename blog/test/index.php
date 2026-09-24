<?php
declare(strict_types=1);

$ROOT = __DIR__;
$self = basename(__FILE__);

const TEXT_EXTS = ['html','htm','md','markdown','txt','log','rst','tex','adoc',
    'js','ts','jsx','tsx','py','php','rb','go','rs','c','cpp','cc','h','hpp','java','sh','bash','css','scss','vue',
    'json','csv','tsv','xml','gexf','yml','yaml','toml','ini','conf'];
const READ_MAX = 4 * 1024 * 1024;

const ICONS  = ['image'=>'🖼️','html'=>'📄','code'=>'💻','data'=>'📊','text'=>'📝','doc'=>'📑','archive'=>'🗜️','binary'=>'📦','other'=>'📎'];
const COLORS = ['image'=>'#f59e0b','html'=>'#3b82f6','code'=>'#10b981','data'=>'#8b5cf6','text'=>'#0ea5e9','doc'=>'#ec4899','archive'=>'#94a3b8','binary'=>'#64748b','other'=>'#cbd5e1'];
const LABELS = ['image'=>'Bild','html'=>'HTML','code'=>'Code','data'=>'Daten','text'=>'Text','doc'=>'Doku','archive'=>'Archiv','binary'=>'Binär','other'=>'Sonstiges'];

function to_utf8(string $s): string {
    if (preg_match('//u', $s)) return $s;
    $r = @iconv('UTF-8', 'UTF-8//IGNORE', $s);
    return $r === false ? '' : $r;
}

function categoryFor(string $name, string $ext): string {
    $map = [
        'image'   => ['jpg','jpeg','png','gif','webp','svg','avif','bmp','ico','heic','tiff','tif'],
        'html'    => ['html','htm'],
        'code'    => ['js','ts','jsx','tsx','py','php','rb','go','rs','c','cpp','cc','h','hpp','java','sh','bash','css','scss','vue'],
        'data'    => ['json','csv','tsv','xml','gexf','sqlite','db','parquet','ndjson'],
        'text'    => ['md','markdown','txt','log','rst','tex','adoc'],
        'doc'     => ['pdf','doc','docx','ppt','pptx','xls','xlsx','odt','epub'],
        'archive' => ['zip','tar','gz','tgz','bz2','7z','rar','zst'],
        'binary'  => ['xcf','pnm','ubyte','pyc','class','o','a','so','bin','exe','dll','dat','mp3','mp4','wav','mov','avi','mkv'],
    ];
    foreach ($map as $cat => $exts) {
        if ($ext !== '' && in_array($ext, $exts, true)) return $cat;
    }
    return 'other';
}

function readTextIf(string $abs, string $ext, int $size): ?string {
    if ($size >= READ_MAX) return null;
    if (!in_array($ext, TEXT_EXTS, true)) {
        if ($ext !== '') return null;
        $head = (string) @file_get_contents($abs, false, null, 0, 8192);
        if ($head === '' || strpos($head, "\0") !== false) return null;
    }
    $c = @file_get_contents($abs);
    return $c === false ? null : to_utf8($c);
}

function htmlToText(string $c): string {
    $c = preg_replace('/<(script|style|noscript)[^>]*>.*?<\/\1>/is', ' ', $c);
    $c = preg_replace('/<head.*?<\/head>/is', ' ', $c);
    $c = preg_replace('/<[^>]+>/', ' ', $c);
    $c = html_entity_decode($c, ENT_QUOTES, 'UTF-8');
    $c = preg_replace('/\s+/', ' ', trim($c));
    return $c;
}

function extractMeta(string $ext, string $content): array {
    $title = null; $headings = []; $snippet = null;
    if ($ext === 'html' || $ext === 'htm') {
        if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $content, $m)) $title = trim($m[1]);
        if (preg_match_all('/<h([1-4])[^>]*>(.*?)<\/h\1>/is', $content, $mm, PREG_SET_ORDER)) {
            foreach ($mm as $h) {
                $t = html_entity_decode(trim(strip_tags($h[2])), ENT_QUOTES, 'UTF-8');
                $t = preg_replace('/\s+/', ' ', $t);
                if ($t !== '' && !in_array($t, $headings, true) && count($headings) < 30) $headings[] = $t;
            }
        }
        $c = htmlToText($content);
        $snippet = $c === '' ? null : mb_substr($c, 0, 260);
    } elseif ($ext === 'md' || $ext === 'markdown') {
        foreach (preg_split('/\r?\n/', $content) as $ln) {
            if (preg_match('/^#{1,4}\s+(.*)$/', $ln, $m)) {
                $t = trim($m[1]);
                if ($title === null) $title = $t;
                if (!in_array($t, $headings, true) && count($headings) < 30) $headings[] = $t;
            }
        }
        foreach (preg_split('/\r?\n/', $content) as $ln) {
            $t = trim($ln);
            if ($t !== '' && $t[0] !== '#' && $t[0] !== '<' && $t[0] !== '|' && $t[0] !== '`') { $snippet = mb_substr($t, 0, 260); break; }
        }
    } else {
        $first = strtok($content, "\r\n");
        if ($first !== false && trim($first) !== '') $title = mb_substr(trim($first), 0, 140);
        $c = preg_replace('/\s+/', ' ', trim($content));
        $snippet = $c === '' ? null : mb_substr($c, 0, 260);
    }
    if ($title !== null) $title = preg_replace('/\s+/', ' ', trim($title));
    if ($title !== null && mb_strlen($title) > 160) $title = mb_substr($title, 0, 160) . '…';
    if ($title !== null && $title === '') $title = null;
    return ['title' => $title, 'headings' => $headings, 'snippet' => $snippet];
}

$items = [];
$rii = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($ROOT, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::LEAVES_ONLY
);
foreach ($rii as $f) {
    if (!$f->isFile()) continue;
    $base = $f->getFilename();
    if ($base === $self) continue;
    $abs = $f->getPathname();
    $rel = str_replace('\\', '/', ltrim(substr($abs, strlen($ROOT)), '/'));
    $size = $f->getSize();
    $ext = strtolower($f->getExtension());
    $cat = categoryFor($base, $ext);
    $row = [
        'path' => $rel, 'name' => $base, 'ext' => $ext, 'cat' => $cat,
        'icon' => ICONS[$cat], 'color' => COLORS[$cat], 'label' => LABELS[$cat],
        'size' => $size, 'mtime' => $f->getMTime(),
        'title' => null, 'headings' => [], 'snippet' => null,
    ];
    $content = readTextIf($abs, $ext, $size);
    if ($content !== null) {
        $row = array_merge($row, extractMeta($ext, $content));
    }
    $items[] = $row;
}
usort($items, fn($a, $b) => ($b['mtime'] <=> $a['mtime']) ?: strcmp($a['path'], $b['path']));

function runSearch(array $items, string $root, string $q): array {
    if (mb_strlen($q) < 2) return [];
    $re = '/' . preg_quote($q, '/') . '/iu';
    $qL = mb_strtolower($q);
    $files = [];
    foreach ($items as $it) {
        $nameL = mb_strtolower($it['name']);
        $titleL = $it['title'] ? mb_strtolower($it['title']) : '';
        $inTitle = (strpos($nameL, $qL) !== false) || ($titleL !== '' && strpos($titleL, $qL) !== false);
        $count = 0; $snips = [];
        $content = readTextIf($root . '/' . $it['path'], $it['ext'], $it['size']);
        if ($content !== null) {
            $isHtml = ($it['ext'] === 'html' || $it['ext'] === 'htm');
            $st = $isHtml ? htmlToText($content) : $content;
            $hasLines = !$isHtml;
            if (preg_match_all($re, $st, $m, PREG_OFFSET_CAPTURE)) {
                $count = count($m[0]);
                foreach ($m[0] as $mm) {
                    if (count($snips) >= 3) break;
                    $p = $mm[1];
                    $start = max(0, $p - 90);
                    $end = min(strlen($st), $p + strlen($q) + 90);
                    $line = $hasLines ? substr_count(substr($st, 0, $p), "\n") + 1 : 0;
                    $s = substr($st, $start, $end - $start);
                    $s = to_utf8($s);
                    $s = trim(preg_replace('/\s+/', ' ', $s));
                    if ($start > 0) $s = '…' . $s;
                    if ($end < strlen($st)) $s .= '…';
                    $snips[] = ['line' => $line, 'text' => $s];
                }
            }
        }
        $total = ($inTitle ? 1 : 0) + $count;
        if ($total <= 0) continue;
        $files[] = [
            'path' => $it['path'], 'name' => $it['name'], 'ext' => $it['ext'], 'cat' => $it['cat'],
            'icon' => $it['icon'], 'color' => $it['color'], 'label' => $it['label'],
            'size' => $it['size'], 'mtime' => $it['mtime'], 'title' => $it['title'],
            'headings' => $it['headings'], 'snippet' => $it['snippet'],
            'inTitle' => $inTitle, 'matches' => $total, 'snippets' => $snips,
        ];
    }
    usort($files, fn($a, $b) => ($b['matches'] <=> $a['matches']) ?: ($b['mtime'] <=> $a['mtime']) ?: strcmp($a['path'], $b['path']));
    return $files;
}

if (isset($_GET['api'])) {
    header('Content-Type: application/json; charset=utf-8');
    $q = isset($_GET['q']) ? trim((string) $_GET['q']) : '';
    $res = runSearch($items, $ROOT, $q);
    echo json_encode(['q' => $q, 'total' => count($res), 'files' => $res], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

$dataJson = json_encode($items, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES);
$folderName = htmlspecialchars(basename($ROOT), ENT_QUOTES, 'UTF-8');
?>
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Index — <?php echo $folderName; ?></title>
<style>
:root{
  --bg0:#0a0e15; --bg1:#0d131d; --card:rgba(255,255,255,.035); --card2:rgba(255,255,255,.07);
  --line:rgba(255,255,255,.09); --tx:#e6edf6; --mut:#93a0b4; --mut2:#5c6b80;
  --acc1:#5b8cff; --acc2:#a78bfa; --mark:#f5c518; --ok:#34d399;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:radial-gradient(1200px 600px at 15% -10%, rgba(91,140,255,.10), transparent 60%),
             radial-gradient(1000px 500px at 100% 0%, rgba(167,139,250,.08), transparent 55%),
             linear-gradient(180deg,var(--bg0),var(--bg1));
  color:var(--tx); font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,system-ui,sans-serif;
  min-height:100vh; -webkit-font-smoothing:antialiased;
}
.wrap{max-width:1180px;margin:0 auto;padding:26px 20px 80px}
a{color:inherit}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
::selection{background:rgba(91,140,255,.35)}
::-webkit-scrollbar{width:11px;height:11px}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:20px;border:3px solid transparent;background-clip:content-box}
::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.24);background-clip:content-box}

header{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
.brand{font-size:26px;font-weight:700;letter-spacing:-.02em}
.brand .fname{background:linear-gradient(90deg,var(--acc1),var(--acc2));-webkit-background-clip:text;background-clip:text;color:transparent}
.tag{color:var(--mut);font-size:13.5px}
.scan{color:var(--mut2);font-size:12.5px}

.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;transition:transform .12s,background .12s}
.stat:hover{background:var(--card2);transform:translateY(-2px)}
.stat .k{font-size:12px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em}
.stat .v{font-size:22px;font-weight:700;margin-top:4px;letter-spacing:-.01em;word-break:break-word}
.stat .s{font-size:12px;color:var(--mut2);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.recent{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.recent .rl{display:inline-flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:12.5px;color:var(--mut);text-decoration:none;transition:border-color .12s,background .12s,color .12s}
.recent .rl:hover{border-color:var(--acc1);color:var(--tx);background:var(--card2)}
.recent .rl b{color:var(--tx);font-weight:600}
.recent .rl .rt{color:var(--mut2);font-size:11.5px}

.typebar{display:flex;height:14px;border-radius:999px;overflow:hidden;border:1px solid var(--line);margin-bottom:12px;background:rgba(255,255,255,.03)}
.typebar .seg{height:100%;cursor:pointer;transition:filter .12s,flex .2s}
.typebar .seg:hover{filter:brightness(1.25)}
.typebar .seg.active{outline:2px solid #fff;outline-offset:-2px}

.chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.chip-f{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--card);color:var(--mut);border-radius:999px;padding:6px 12px;font-size:13px;cursor:pointer;transition:all .12s;user-select:none}
.chip-f:hover{color:var(--tx);border-color:rgba(255,255,255,.2)}
.chip-f.active{color:#0a0e15;font-weight:600}
.chip-f .n{opacity:.7;font-size:12px}

.toolbar{position:sticky;top:0;z-index:20;display:flex;gap:10px;align-items:center;flex-wrap:wrap;
  padding:12px;margin:0 -12px 16px;background:rgba(10,14,21,.82);backdrop-filter:blur(12px);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.searchwrap{flex:1 1 340px;position:relative;display:flex;align-items:center}
.searchwrap .sicon{position:absolute;left:14px;pointer-events:none;opacity:.6}
.searchwrap .spin{position:absolute;left:14px;width:14px;height:14px;border:2px solid rgba(255,255,255,.2);border-top-color:var(--acc1);border-radius:50%;animation:spin .7s linear infinite;display:none}
.searchwrap.searching .sicon{display:none}
.searchwrap.searching .spin{display:block}
input#q{width:100%;background:var(--card);border:1px solid var(--line);color:var(--tx);border-radius:12px;padding:12px 40px 12px 40px;font-size:15px;outline:none;transition:border-color .12s,box-shadow .12s}
input#q:focus{border-color:var(--acc1);box-shadow:0 0 0 3px rgba(91,140,255,.18)}
input#q::placeholder{color:var(--mut2)}
#clear{position:absolute;right:6px;background:none;border:none;color:var(--mut);font-size:16px;cursor:pointer;padding:6px;border-radius:8px;display:none}
#clear:hover{color:var(--tx);background:var(--card2)}
select,.vbtn,.ghost{background:var(--card);border:1px solid var(--line);color:var(--mut);border-radius:11px;padding:10px 12px;font-size:13.5px;cursor:pointer;transition:all .12s;font-family:inherit}
select:hover,.vbtn:hover,.ghost:hover{color:var(--tx);border-color:rgba(255,255,255,.2)}
select:focus{outline:none;border-color:var(--acc1)}
.views{display:flex;gap:6px}
.views .vbtn.active{background:linear-gradient(90deg,var(--acc1),var(--acc2));color:#fff;border-color:transparent;font-weight:600}
.ghost{font-size:13.5px}
#count{color:var(--mut);font-size:12.5px;white-space:nowrap}
#count b{color:var(--tx)}

main.results{animation:fade .25s ease}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}

.row{display:flex;align-items:flex-start;gap:12px;padding:12px 12px;border-radius:12px;border:1px solid transparent;cursor:pointer;transition:background .1s,border-color .1s}
.row:hover{background:var(--card);border-color:var(--line)}
.row .ico{font-size:20px;width:26px;text-align:center;flex:0 0 auto;margin-top:1px;filter:saturate(1.1)}
.row .c{flex:1 1 auto;min-width:0}
.row .l1{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.row .title{font-weight:600;font-size:15px;text-decoration:none;color:var(--tx)}
.row .title:hover{color:#fff;text-decoration:underline}
.row .nm{color:var(--mut2);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:42ch}
.row .l2{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;color:var(--mut2);font-size:12px}
.row .right{flex:0 0 auto;display:flex;align-items:center;gap:8px}
.row .t{color:var(--mut2);font-size:12px;white-space:nowrap;min-width:74px;text-align:right}
.row .open{font-size:13px;color:var(--mut2);text-decoration:none;border:1px solid var(--line);border-radius:8px;padding:4px 8px;opacity:0;transition:opacity .12s}
.row:hover .open{opacity:1}
.row .open:hover{color:var(--tx);border-color:var(--acc1)}
.chev{background:none;border:1px solid var(--line);color:var(--mut);border-radius:8px;width:26px;height:26px;cursor:pointer;font-size:12px;transition:all .12s}
.chev:hover{color:var(--tx);border-color:var(--acc1)}
.chev.open{transform:rotate(180deg);color:var(--acc1)}
.badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;letter-spacing:.02em}
.extchip{font-size:11px;color:var(--mut2);border:1px solid var(--line);border-radius:6px;padding:1px 6px}
.matchpill{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:var(--mark);background:rgba(245,197,24,.12);border:1px solid rgba(245,197,24,.3);border-radius:999px;padding:1px 8px}

.inlinesnip{margin-top:7px;font-size:12.5px;color:var(--mut);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.inlinesnip .ln{color:var(--mut2);font-size:11px}

.detail{display:none;margin:10px 0 2px 38px;padding-top:10px;border-top:1px dashed var(--line)}
.detail.open{display:block;animation:fade .2s ease}
.detail .snip{font-size:13px;color:var(--mut);margin-bottom:10px;line-height:1.5}
.heads{list-style:none;margin:0;padding:0;columns:2;column-gap:24px}
.heads li{font-size:13px;color:var(--mut);padding:3px 0;break-inside:avoid;display:flex;gap:7px}
.heads li::before{content:"›";color:var(--acc1)}
.snips{margin-top:10px;display:flex;flex-direction:column;gap:8px}
.snips .s{font-size:12.5px;color:var(--mut);background:rgba(255,255,255,.02);border:1px solid var(--line);border-left:3px solid var(--acc1);border-radius:8px;padding:7px 10px;line-height:1.5}
.snips .s .ln{color:var(--acc1);font-size:11px;font-weight:600;margin-right:6px}
mark{background:rgba(245,197,24,.28);color:#ffe08a;border-radius:3px;padding:0 2px;box-shadow:0 0 0 1px rgba(245,197,24,.25)}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;cursor:pointer;transition:transform .12s,border-color .12s,background .12s;display:flex;flex-direction:column}
.card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.18);background:var(--card2)}
.thumb{height:120px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.03);border-bottom:1px solid var(--line);overflow:hidden}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
.thumb .bigico{font-size:46px}
.card .body{padding:12px 13px 13px;display:flex;flex-direction:column;gap:6px;flex:1}
.card .title{font-weight:600;font-size:14.5px;text-decoration:none;color:var(--tx);line-height:1.35}
.card .title:hover{color:#fff}
.card .nm{color:var(--mut2);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card .meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;color:var(--mut2);font-size:11.5px;margin-top:auto}
.card .heads3{font-size:12px;color:var(--mut);display:flex;flex-direction:column;gap:2px;margin-top:2px}
.card .heads3 span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card .detail{margin:0 13px 12px;border-top:1px dashed var(--line);padding-top:10px}

.sec{margin-bottom:8px;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:rgba(255,255,255,.02)}
.sec>h3{margin:0;padding:11px 15px;font-size:13px;font-weight:600;color:var(--mut);display:flex;align-items:center;gap:9px;cursor:pointer;background:var(--card);user-select:none}
.sec>h3:hover{color:var(--tx)}
.sec>h3 .n{color:var(--mut2);font-weight:400;font-size:12px}
.sec>h3 .fold{margin-left:auto;font-size:11px;color:var(--mut2);transition:transform .15s}
.sec.collapsed .fold{transform:rotate(-90deg)}
.sec.collapsed .secbody{display:none}
.sec .secbody{padding:6px 6px 8px}

.empty{text-align:center;padding:70px 20px;color:var(--mut)}
.empty .big{font-size:46px;margin-bottom:12px}
.empty p{color:var(--mut);font-size:15px}
.empty b{color:var(--tx)}

footer{margin-top:40px;padding-top:18px;border-top:1px solid var(--line);color:var(--mut2);font-size:12.5px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
footer kbd{background:var(--card);border:1px solid var(--line);border-bottom-width:2px;border-radius:5px;padding:1px 6px;font-size:11px;color:var(--mut)}

@media(max-width:720px){
  .stats{grid-template-columns:repeat(2,1fr)}
  .row .nm{max-width:22ch}
  .heads{columns:1}
  .row .t{display:none}
}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="brand">🗂️ <span class="fname" id="fname"><?php echo $folderName; ?></span></div>
    <div class="tag">Kein Kehrichthaufen mehr — automatisch indexiert, durchsuchbar, sortiert.</div>
  </header>
  <section class="stats" id="stats"></section>
  <section class="recent" id="recent"></section>
  <div class="typebar" id="typebar"></div>
  <div class="chips" id="chips"></div>
  <div class="toolbar" id="toolbar">
    <div class="searchwrap" id="sw">
      <span class="sicon">🔎</span><span class="spin"></span>
      <input id="q" type="search" placeholder="Suchen: Name, Titel, Überschriften oder Volltext …   ( / )" autocomplete="off" spellcheck="false">
      <button id="clear" title="Leeren (Esc)">✕</button>
    </div>
    <select id="sort" title="Sortierung">
      <option value="relevance">↯ Relevanz</option>
      <option value="newest">🕒 Neueste zuerst</option>
      <option value="oldest">🕓 Älteste zuerst</option>
      <option value="name">A–Z Name</option>
      <option value="name_desc">Z–A Name</option>
      <option value="size_desc">↓ Größe</option>
      <option value="size_asc">↑ Größe</option>
      <option value="cat">Typ</option>
    </select>
    <select id="dir" title="Ordner filtern"></select>
    <div class="views" id="views">
      <button data-v="list" class="vbtn">☰ Liste</button>
      <button data-v="grid" class="vbtn">▦ Raster</button>
      <button data-v="folders" class="vbtn">🗀 Ordner</button>
    </div>
    <button id="export" class="ghost" title="Ansicht als CSV herunterladen">⬇ CSV</button>
    <button id="rescan" class="ghost" title="Neu scannen (neue Dateien laden)">↻</button>
    <span id="count"></span>
  </div>
  <main class="results list" id="results"></main>
  <div class="empty" id="empty" hidden>
    <div class="big">🕵️</div>
    <p>Keine Treffer für <b id="emptyq"></b>.</p>
    <p>Probier's kürzer oder ohne Tippfehler — z.&nbsp;B. „garben", „attention" oder „topology".</p>
  </div>
  <footer>
    <span><span id="ftotal"></span> Dateien · neu gescannt bei jedem Aufruf — neue Dateien erscheinen automatisch.</span>
    <span><kbd>/</kbd> suchen · <kbd>Esc</kbd> leeren · <kbd>↻</kbd> neu scannen</span>
  </footer>
</div>
<script>
const DATA = <?php echo $dataJson; ?>;
const CAT_ORDER = ['html','image','code','data','text','doc','archive','binary','other'];
const ICONS  = <?php echo json_encode(ICONS, JSON_UNESCAPED_UNICODE|JSON_HEX_TAG); ?>;
const COLORS = <?php echo json_encode(COLORS, JSON_UNESCAPED_UNICODE|JSON_HEX_TAG); ?>;
const LABELS = <?php echo json_encode(LABELS, JSON_UNESCAPED_UNICODE|JSON_HEX_TAG); ?>;

const $ = s => document.querySelector(s);
const state = { q:'', cat:'all', dir:'all', sort:'newest', view:'list' };
let deepResults = null, searchToken = 0, openSet = new Set();

function topDir(p){ const i = p.indexOf('/'); return i === -1 ? '' : p.slice(0, i); }
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function hsize(b){ if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(b<104857?0:1)+' KB'; if(b<1073741824) return (b/1048576).toFixed(1)+' MB'; return (b/1073741824).toFixed(2)+' GB'; }
function relTime(ts){ const s=Date.now()/1000-ts; if(s<45) return 'gerade eben'; const m=s/60; if(m<60) return 'vor '+Math.floor(m)+' Min.'; const h=m/60; if(h<24) return 'vor '+Math.floor(h)+' Std.'; const d=h/24; if(d<7) return 'vor '+Math.floor(d)+' T.'; const w=d/7; if(w<5) return 'vor '+Math.floor(w)+' Wo.'; const mo=d/30.4; if(mo<12) return 'vor '+Math.floor(mo)+' Mon.'; return 'vor '+(d/365).toFixed(1)+' J.'; }
function fullTime(ts){ return new Date(ts*1000).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'}); }
function mark(text, q){
  if(!text) return '';
  if(!q) return esc(text);
  const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
  return text.split(re).map((p,i)=> i%2 ? '<mark>'+esc(p)+'</mark>' : esc(p)).join('');
}
function displayTitle(it){ return it.title || it.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' '); }

function matchesQ(it, q){
  const s = q.toLowerCase();
  if(it.name.toLowerCase().includes(s)) return true;
  if(it.title && it.title.toLowerCase().includes(s)) return true;
  if(it.headings && it.headings.some(h => h.toLowerCase().includes(s))) return true;
  return false;
}

function currentItems(){
  const deep = state.q.length >= 2 && deepResults !== null;
  let base = deep ? deepResults : DATA;
  if(!deep){
    if(state.q) base = base.filter(it => matchesQ(it, state.q));
  }
  if(state.cat !== 'all') base = base.filter(it => it.cat === state.cat);
  if(state.dir !== 'all') base = base.filter(it => topDir(it.path) === state.dir);
  return sortItems(base);
}

function sortItems(arr){
  const a = arr.slice();
  let key = state.sort;
  if(state.q.length >= 2 && (key === 'newest' || key === 'relevance')) key = 'relevance';
  const by = {
    newest:(x,y)=> (y.mtime-x.mtime) || x.path.localeCompare(y.path),
    oldest:(x,y)=> (x.mtime-y.mtime) || x.path.localeCompare(y.path),
    name:(x,y)=> x.name.localeCompare(y.name,'de',{sensitivity:'base'}),
    name_desc:(x,y)=> y.name.localeCompare(x.name,'de',{sensitivity:'base'}),
    size_desc:(x,y)=> (y.size-x.size) || x.path.localeCompare(y.path),
    size_asc:(x,y)=> (x.size-y.size) || x.path.localeCompare(y.path),
    cat:(x,y)=> (x.label||'').localeCompare(y.label||'','de') || x.name.localeCompare(y.name,'de'),
    relevance:(x,y)=> ((y.matches||0)-(x.matches||0)) || (y.mtime-x.mtime) || x.path.localeCompare(y.path),
  };
  return a.sort(by[key] || by.newest);
}

function badge(it){
  return '<span class="badge" style="background:'+it.color+'22;color:'+it.color+';border:1px solid '+it.color+'44">'+it.icon+' '+esc(it.label)+'</span>';
}
function extChip(it){ return it.ext ? '<span class="extchip">.'+esc(it.ext)+'</span>' : ''; }
function dirChip(it){ const d = topDir(it.path); return d ? '<span style="color:var(--mut2)">📁 '+esc(d)+'</span>' : ''; }
function matchPill(it){ return (it.matches ? '<span class="matchpill">🎯 '+it.matches+(it.matches===1?' Treffer':' Treffer')+'</span>' : ''); }

function inlinesnip(it){
  if(!it.snippets || !it.snippets.length) return '';
  const s = it.snippets[0];
  return '<div class="inlinesnip">'+(s.line?'<span class="ln">Z.&nbsp;'+s.line+'</span> ':'')+mark(s.text, state.q)+'</div>';
}
function detailHTML(it){
  let h = '';
  if(it.snippet) h += '<div class="snip">'+esc(it.snippet)+'</div>';
  if(it.headings && it.headings.length) h += '<ul class="heads">'+it.headings.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
  if(it.snippets && it.snippets.length) h += '<div class="snips">'+it.snippets.map(s=>'<div class="s">'+(s.line?'<span class="ln">Z.&nbsp;'+s.line+'</span>':'')+mark(s.text, state.q)+'</div>').join('')+'</div>';
  if(!h) h = '<div class="snip" style="color:var(--mut2)">Kein lesbarer Inhalt (binäre Datei).</div>';
  return h;
}

function rowHTML(it){
  const open = openSet.has(it.path);
  const t = displayTitle(it);
  const nm = it.path;
  return '<div class="row" data-path="'+esc(it.path)+'">'
    + '<div class="ico">'+it.icon+'</div>'
    + '<div class="c">'
      + '<div class="l1"><a class="title" href="'+esc(it.path)+'" target="_blank" rel="noopener">'+esc(t)+'</a>'
      + '<span class="nm mono">'+esc(nm)+'</span>'+matchPill(it)+'</div>'
      + '<div class="l2">'+badge(it)+extChip(it)+dirChip(it)+'<span>·</span><span>'+hsize(it.size)+'</span><span>·</span><span>'+relTime(it.mtime)+'</span></div>'
      + inlinesnip(it)
    + '</div>'
    + '<div class="right"><span class="t" title="'+esc(fullTime(it.mtime))+'">'+fullTime(it.mtime).split(' ')[0]+'</span>'
    + '<a class="open" href="'+esc(it.path)+'" target="_blank" rel="noopener" title="Öffnen">↗</a>'
    + '<button class="chev'+(open?' open':'')+'" title="Überschriften / Details">▾</button></div>'
    + '<div class="detail'+(open?' open':'')+'">'+detailHTML(it)+'</div>'
  + '</div>';
}

function cardHTML(it){
  const open = openSet.has(it.path);
  const t = displayTitle(it);
  const thumb = it.cat === 'image'
    ? '<img loading="lazy" src="'+esc(it.path)+'" alt="">'
    : '<div class="bigico" style="background:'+it.color+'1f;border-radius:50%;width:84px;height:84px;display:flex;align-items:center;justify-content:center">'+it.icon+'</div>';
  const h3 = (it.headings && it.headings.length) ? '<div class="heads3">'+it.headings.slice(0,3).map(x=>'<span>› '+esc(x)+'</span>').join('')+'</div>' : '';
  return '<div class="card" data-path="'+esc(it.path)+'">'
    + '<div class="thumb">'+thumb+'</div>'
    + '<div class="body">'
      + '<a class="title" href="'+esc(it.path)+'" target="_blank" rel="noopener">'+esc(t)+'</a>'
      + '<div class="nm mono">'+esc(it.path)+'</div>'
      + h3
      + '<div class="meta">'+badge(it)+extChip(it)+'<span>'+hsize(it.size)+'</span><span>·</span><span title="'+esc(fullTime(it.mtime))+'">'+relTime(it.mtime)+'</span>'+matchPill(it)+'</div>'
    + '</div>'
    + '<div class="detail'+(open?' open':'')+'" style="display:'+(open?'block':'none')+'">'+detailHTML(it)+'</div>'
  + '</div>';
}

function renderStats(){
  const total = DATA.length;
  const size = DATA.reduce((a,b)=>a+b.size,0);
  const dirs = new Set(DATA.map(it=>topDir(it.path))).size;
  const cats = new Set(DATA.map(it=>it.cat)).size;
  const newest = DATA[0];
  $('#stats').innerHTML =
    '<div class="stat"><div class="k">Dateien</div><div class="v">'+total+'</div><div class="s">'+dirs+' Ordner</div></div>'
    + '<div class="stat"><div class="k">Gesamtgröße</div><div class="v">'+hsize(size)+'</div><div class="s">'+cats+' Dateitypen</div></div>'
    + '<div class="stat"><div class="k">Zuletzt bearbeitet</div><div class="v" style="font-size:15px;padding-top:4px">'+esc(displayTitle(newest))+'</div><div class="s mono">'+esc(newest.path)+'</div></div>'
    + '<div class="stat"><div class="k">Alter</div><div class="v" style="font-size:15px;padding-top:4px">'+relTime(newest.mtime)+'</div><div class="s mono" title="'+esc(fullTime(newest.mtime))+'">'+fullTime(newest.mtime)+'</div></div>';
  $('#ftotal').textContent = total;
}

function renderRecent(){
  const top = DATA.slice(0,5);
  $('#recent').innerHTML = '<span style="color:var(--mut2);font-size:12px;align-self:center;margin-right:2px">🔥 Vor kurzem:</span>'
    + top.map(it=>'<a class="rl" href="'+esc(it.path)+'" target="_blank" rel="noopener" title="'+esc(fullTime(it.mtime))+'"><span>'+it.icon+'</span> <b>'+esc(displayTitle(it))+'</b> <span class="rt">'+relTime(it.mtime)+'</span></a>').join('');
}

function renderTypebar(){
  const counts = {};
  DATA.forEach(it=>{ counts[it.cat]=(counts[it.cat]||0)+1; });
  const total = DATA.length || 1;
  $('#typebar').innerHTML = CAT_ORDER.filter(c=>counts[c]).map(c=>
    '<div class="seg'+(state.cat===c?' active':'')+'" data-cat="'+c+'" title="'+LABELS[c]+': '+counts[c]+'" style="flex:'+(counts[c]/total)+';background:'+COLORS[c]+'"></div>'
  ).join('');
  $('#chips').innerHTML =
    '<span class="chip-f'+(state.cat==='all'?' active':'')+'" data-cat="all" style="'+(state.cat==='all'?'background:var(--tx);': '')+'">Alle <span class="n">'+DATA.length+'</span></span>'
    + CAT_ORDER.filter(c=>counts[c]).map(c=>{
      const act = state.cat===c;
      return '<span class="chip-f'+(act?' active':'')+'" data-cat="'+c+'" style="'+(act?'background:'+COLORS[c]+';border-color:'+COLORS[c]+';':'')+'">'+ICONS[c]+' '+LABELS[c]+' <span class="n">'+counts[c]+'</span></span>';
    }).join('');
}

function renderDirs(){
  const dirs = [...new Set(DATA.map(it=>topDir(it.path)))].filter(d=>d).sort((a,b)=>a.localeCompare(b,'de'));
  const cur = state.dir;
  $('#dir').innerHTML = '<option value="all">📁 Alle Ordner</option>' + dirs.map(d=>'<option value="'+esc(d)+'"'+(d===cur?' selected':'')+'>'+esc(d)+'</option>').join('');
}

function renderView(arr){
  const el = $('#results');
  if(arr.length === 0){
    el.innerHTML = ''; el.hidden = true; $('#empty').hidden = false; $('#emptyq').textContent = state.q || state.cat;
    return;
  }
  $('#empty').hidden = true; el.hidden = false;
  el.className = 'results ' + state.view;
  if(state.view === 'list'){
    el.innerHTML = arr.map(rowHTML).join('');
  } else if(state.view === 'grid'){
    el.innerHTML = '<div class="grid">' + arr.map(cardHTML).join('') + '</div>';
  } else {
    const groups = {};
    arr.forEach(it=>{ const d = topDir(it.path) || '🏠 (Wurzel)'; (groups[d]=groups[d]||[]).push(it); });
    const keys = Object.keys(groups).sort((a,b)=> a.startsWith('🏠')?-1 : b.startsWith('🏠')?1 : a.localeCompare(b,'de'));
    el.innerHTML = keys.map(d=>{
      const list = groups[d];
      const sz = list.reduce((a,b)=>a+b.size,0);
      return '<div class="sec"><h3 data-fold="'+esc(d)+'">📁 '+esc(d)+' <span class="n">'+list.length+' Dateien · '+hsize(sz)+'</span><span class="fold">▾</span></h3>'
        + '<div class="secbody">'+list.map(rowHTML).join('')+'</div></div>';
    }).join('');
  }
  const deep = state.q.length>=2 && deepResults!==null;
  $('#count').innerHTML = 'Zeige <b>'+arr.length+'</b> von <b>'+DATA.length+'</b>' + (deep ? ' · Volltext: <b>'+deepResults.length+'</b> Dateien' : '');
}

function render(){
  renderStats(); renderRecent(); renderTypebar(); renderDirs();
  renderView(currentItems());
  $('#q').value = state.q;
  $('#clear').style.display = state.q ? 'block' : 'none';
  $('#sort').value = state.sort;
  document.querySelectorAll('#views .vbtn').forEach(b=>b.classList.toggle('active', b.dataset.v===state.view));
}

function persist(){
  const h = '#cat='+state.cat+'&dir='+state.dir+'&sort='+state.sort+'&view='+state.view;
  const s = state.q ? '?q='+encodeURIComponent(state.q) : '';
  try{ history.replaceState(null,'', s + h); }catch(e){}
}

let deb = null;
function onSearch(v){
  state.q = v.trim();
  persist();
  if(state.q.length >= 2){
    render();
    clearTimeout(deb);
    deb = setTimeout(()=>deepSearch(state.q), 260);
  } else {
    deepResults = null;
    render();
  }
}

function deepSearch(q){
  const token = ++searchToken;
  const sw = $('#sw'); sw.classList.add('searching');
  fetch('index.php?api=1&q='+encodeURIComponent(q), {headers:{'Accept':'application/json'}})
    .then(r=>r.json())
    .then(j=>{
      if(token !== searchToken) return;
      deepResults = j.files || [];
      render();
    })
    .catch(()=>{ if(token===searchToken){ deepResults = null; } })
    .finally(()=>{ if(token===searchToken) sw.classList.remove('searching'); });
}

function exportCSV(arr){
  const rows = [['path','title','ext','type','size_bytes','modified'],
    ...arr.map(it=>[it.path, it.title||'', it.ext, it.label, it.size, new Date(it.mtime*1000).toISOString()])];
  const csv = rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'index_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click(); URL.revokeObjectURL(a.href);
}

function loadState(){
  const sp = new URLSearchParams(location.search);
  const hash = {};
  if(location.hash){ new URLSearchParams(location.hash.slice(1)).forEach((v,k)=>hash[k]=v); }
  state.q = (sp.get('q') || hash.q || '').trim();
  state.cat = hash.cat || 'all';
  state.dir = hash.dir || 'all';
  state.sort = hash.sort || 'newest';
  state.view = hash.view || 'list';
}

function wire(){
  $('#q').addEventListener('input', e=>onSearch(e.target.value));
  $('#clear').addEventListener('click', ()=>{ onSearch(''); $('#q').focus(); });
  $('#sort').addEventListener('change', e=>{ state.sort = e.target.value; persist(); render(); });
  $('#dir').addEventListener('change', e=>{ state.dir = e.target.value; persist(); render(); });
  $('#views').addEventListener('click', e=>{ const b=e.target.closest('.vbtn'); if(!b) return; state.view=b.dataset.v; persist(); render(); });
  $('#export').addEventListener('click', ()=>exportCSV(currentItems()));
  $('#rescan').addEventListener('click', ()=>location.reload());

  document.addEventListener('click', e=>{
    const seg = e.target.closest('.typebar .seg, .chip-f');
    if(seg){ state.cat = seg.dataset.cat; persist(); render(); return; }
    const fold = e.target.closest('.sec>h3[data-fold]');
    if(fold){ fold.parentElement.classList.toggle('collapsed'); return; }
    const chev = e.target.closest('.chev');
    if(chev){ const row = chev.closest('[data-path]'); const p = row.dataset.path;
      if(openSet.has(p)) openSet.delete(p); else openSet.add(p);
      render(); return; }
    const card = e.target.closest('.card');
    if(card && !e.target.closest('a') && !e.target.closest('.chev')){
      const p = card.dataset.path;
      if(openSet.has(p)) openSet.delete(p); else openSet.add(p);
      render(); return; }
    const row = e.target.closest('.row');
    if(row && !e.target.closest('a') && !e.target.closest('.chev')){
      const p = row.dataset.path;
      if(openSet.has(p)) openSet.delete(p); else openSet.add(p);
      render(); return; }
  });

  document.addEventListener('keydown', e=>{
    if(e.key === '/' && document.activeElement !== $('#q')){ e.preventDefault(); $('#q').focus(); }
    else if(e.key === 'Escape'){ if(document.activeElement === $('#q')){ onSearch(''); } else onSearch(''); $('#q').blur(); }
  });
}

loadState();
wire();
render();
if(state.q.length >= 2) deepSearch(state.q);
</script>
</body>
</html>
