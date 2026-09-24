<?php
declare(strict_types=1);

$ROOT = __DIR__;
$self = basename(__FILE__);
const IGNORE = ['mobile-prepend.php'];

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
    if ($base === $self || in_array($base, IGNORE, true)) continue;
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
  --bg:#070a11; --card:rgba(255,255,255,.045); --card2:rgba(255,255,255,.085);
  --line:rgba(255,255,255,.09); --line2:rgba(255,255,255,.16);
  --tx:#eaf0fa; --mut:#9aa7bd; --mut2:#5f6d84;
  --acc1:#5b8cff; --acc2:#b18cff; --mark:#ffcc33;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:var(--bg); color:var(--tx); min-height:100vh;
  font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,system-ui,sans-serif;
  -webkit-font-smoothing:antialiased; position:relative;
}
body::before,body::after{content:"";position:fixed;z-index:0;filter:blur(70px);opacity:.5;pointer-events:none}
body::before{width:520px;height:520px;left:-120px;top:-140px;background:radial-gradient(circle,rgba(91,140,255,.35),transparent 65%)}
body::after{width:560px;height:560px;right:-140px;top:-60px;background:radial-gradient(circle,rgba(177,140,255,.30),transparent 65%)}
.wrap{max-width:1240px;margin:0 auto;padding:34px 22px 90px;position:relative;z-index:1}
a{color:inherit;text-decoration:none}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
kbd{background:rgba(255,255,255,.08);border:1px solid var(--line2);border-bottom-width:2px;border-radius:6px;padding:1px 7px;font-size:11px;font-family:inherit;color:var(--mut)}
mark{background:rgba(255,204,51,.28);color:#ffe49a;border-radius:3px;padding:0 2px;box-shadow:0 0 0 1px rgba(255,204,51,.3)}
::selection{background:rgba(91,140,255,.4)}
::-webkit-scrollbar{width:11px;height:11px}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:20px;border:3px solid transparent;background-clip:content-box}
::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.28);background-clip:content-box}
@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}

/* Hero */
.hero{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:22px;animation:rise .5s ease both}
.kicker{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:var(--mut2);font-weight:700;margin-bottom:8px}
h1.h{font-size:40px;line-height:1.05;margin:0;font-weight:800;letter-spacing:-.025em}
h1.h .fname{background:linear-gradient(92deg,var(--acc1),var(--acc2) 70%);-webkit-background-clip:text;background-clip:text;color:transparent}
.tag{margin:10px 0 0;color:var(--mut);font-size:14.5px;max-width:52ch}
.scanpill{display:inline-flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:9px 15px;font-size:13px;color:var(--mut);white-space:nowrap}
.scanpill .dot{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 0 3px rgba(52,211,153,.2)}

/* Stats */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;animation:rise .5s ease .05s both}
.stat{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:15px 17px;position:relative;overflow:hidden;transition:transform .14s,background .14s,border-color .14s}
.stat::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(var(--acc1),var(--acc2));opacity:.5}
.stat:hover{transform:translateY(-2px);background:var(--card2);border-color:var(--line2)}
.stat .k{font-size:11.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;display:flex;gap:6px;align-items:center}
.stat .v{font-size:26px;font-weight:800;margin-top:6px;letter-spacing:-.02em}
.stat .s{font-size:12px;color:var(--mut2);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Recent */
.recent{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;align-items:center;animation:rise .5s ease .1s both}
.recent .rl{display:inline-flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:6px 8px 6px 12px;font-size:12.5px;color:var(--mut);transition:all .13s;cursor:pointer}
.recent .rl:hover{border-color:var(--acc1);color:var(--tx);background:var(--card2);transform:translateY(-1px)}
.recent .rl b{color:var(--tx);font-weight:600;max-width:26ch;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.recent .rl .rt{color:var(--mut2);font-size:11px;background:rgba(255,255,255,.05);padding:1px 7px;border-radius:999px}
.recent .lbl{color:var(--mut2);font-size:12px;font-weight:600;letter-spacing:.04em}

/* Search */
.searchhero{margin-bottom:14px;animation:rise .5s ease .14s both}
.sbox{position:relative;display:flex;align-items:center;background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:16px;padding:4px 8px 4px 4px;transition:border-color .14s,box-shadow .14s,background .14s}
.sbox:focus-within{border-color:var(--acc1);box-shadow:0 0 0 4px rgba(91,140,255,.16);background:rgba(255,255,255,.07)}
.sbox .go{display:flex;align-items:center;gap:9px;padding:12px 13px;color:var(--mut);cursor:pointer}
.sbox .go .mag{font-size:18px}
.sbox .spin{display:none;width:16px;height:16px;border:2px solid rgba(255,255,255,.2);border-top-color:var(--acc1);border-radius:50%;animation:spin .7s linear infinite}
.sbox.searching .go .mag{display:none}
.sbox.searching .go .spin{display:block}
input#q{flex:1;background:none;border:none;color:var(--tx);font-size:16px;padding:12px 4px;outline:none;font-family:inherit}
input#q::placeholder{color:var(--mut2)}
.sbox .shint{align-self:center;color:var(--mut2);margin-right:6px}
#clear{background:none;border:none;color:var(--mut);font-size:15px;cursor:pointer;padding:8px 11px;border-radius:10px;display:none}
#clear:hover{color:var(--tx);background:rgba(255,255,255,.08)}

/* Typebar */
.typebar{display:flex;height:12px;border-radius:999px;overflow:hidden;border:1px solid var(--line);margin-bottom:12px;background:rgba(255,255,255,.03);box-shadow:inset 0 1px 2px rgba(0,0,0,.4);animation:rise .5s ease .16s both}
.typebar .seg{height:100%;cursor:pointer;transition:filter .14s}
.typebar .seg:hover{filter:brightness(1.3)}
.typebar .seg.active{box-shadow:inset 0 0 0 2px #fff}

/* Controls */
.controls{position:sticky;top:0;z-index:30;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;
  padding:12px;margin:0 -12px 16px;background:rgba(7,10,17,.8);backdrop-filter:blur(14px);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.chips{display:flex;gap:8px;flex-wrap:wrap;flex:1 1 auto}
.chip-f{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--mut);font-size:13px;cursor:pointer;transition:all .13s;user-select:none}
.chip-f:hover{color:var(--tx);transform:translateY(-1px);border-color:var(--line2)}
.chip-f.active{color:#08101e;font-weight:700}
.chip-f .n{font-size:11px;opacity:.7;font-weight:700}
.ctrl{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
select,.vbtn,.ghost{background:var(--card);border:1px solid var(--line);color:var(--mut);border-radius:11px;padding:9px 12px;font-size:13px;cursor:pointer;transition:all .12s;font-family:inherit}
select:hover,.vbtn:hover,.ghost:hover{color:var(--tx);border-color:var(--line2)}
select:focus{outline:none;border-color:var(--acc1)}
.views{display:flex;gap:5px;background:var(--card);border:1px solid var(--line);border-radius:11px;padding:4px}
.views .vbtn{border:none;background:none;padding:7px 12px;border-radius:8px}
.views .vbtn.active{background:linear-gradient(92deg,var(--acc1),var(--acc2));color:#fff;font-weight:600}

/* Result bar */
.resultbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;min-height:22px}
#count{color:var(--mut);font-size:13px}
#count b{color:var(--tx)}
#count .deep{color:var(--mark)}

/* Wall (tiles) */
.wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:16px}
.tile{position:relative;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;cursor:pointer;
  transition:transform .16s,box-shadow .16s,border-color .16s;animation:rise .45s ease both}
.results.still .tile{animation:none}
.tile:hover{transform:translateY(-5px);border-color:var(--line2);box-shadow:0 22px 44px -20px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.05)}
.tile:focus-visible{outline:2px solid var(--acc1);outline-offset:2px}
.tile-media{position:relative;aspect-ratio:16/10;background:var(--g,linear-gradient(135deg,#334155,#64748b));display:flex;align-items:center;justify-content:center;overflow:hidden}
.tile-media::after{content:"";position:absolute;inset:0;background:radial-gradient(130% 85% at 50% -15%,rgba(255,255,255,.28),transparent 55%)}
.tile-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .45s ease}
.tile:hover .tile-media img{transform:scale(1.07)}
.tile-media .big{font-size:48px;z-index:1;filter:drop-shadow(0 6px 14px rgba(0,0,0,.45));transition:transform .3s}
.tile:hover .tile-media .big{transform:scale(1.12)}
.tile-cat{position:absolute;top:9px;left:9px;z-index:3;display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:rgba(8,12,20,.55);backdrop-filter:blur(6px);color:#fff;border:1px solid rgba(255,255,255,.18)}
.tile-open{position:absolute;top:9px;right:9px;z-index:3;font-size:14px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:9px;background:rgba(8,12,20,.55);backdrop-filter:blur(6px);color:#fff;border:1px solid rgba(255,255,255,.18);opacity:0;transform:translateY(-4px);transition:all .16s}
.tile:hover .tile-open{opacity:1;transform:none}
.tile-time{position:absolute;bottom:9px;right:9px;z-index:3;font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(8,12,20,.6);backdrop-filter:blur(6px);color:#dfe6f2;border:1px solid rgba(255,255,255,.14)}
.tile-body{padding:12px 14px 13px;display:flex;flex-direction:column;gap:6px;flex:1}
.tile-title{font-weight:680;font-size:15px;line-height:1.3;letter-spacing:-.01em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tile:hover .tile-title{background:linear-gradient(92deg,var(--acc1),var(--acc2));-webkit-background-clip:text;background-clip:text;color:transparent}
.tile-name{font-size:11.5px;color:var(--mut2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tile-peek{font-size:12px;color:var(--mut);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tile-peek.overs{color:var(--acc2);font-weight:600}
.tile-match{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--mark);background:rgba(255,204,51,.12);border:1px solid rgba(255,204,51,.32);border-radius:999px;padding:1px 9px;width:max-content}
.tile-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-size:11.5px;color:var(--mut2);margin-top:auto;padding-top:2px}
.tinfo{margin-left:auto;background:none;border:1px solid var(--line);color:var(--mut);width:24px;height:24px;border-radius:7px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:all .12s;flex:0 0 auto}
.tinfo:hover{color:var(--tx);border-color:var(--acc1)}
.tile-detail,.row-detail{display:none;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);font-size:13px;color:var(--mut)}
.tile.open .tile-detail,.row.open .row-detail{display:block;animation:rise .2s ease}

/* List */
.list{display:flex;flex-direction:column;gap:7px}
.row{display:flex;align-items:flex-start;gap:13px;padding:12px 14px;border:1px solid var(--line);border-radius:13px;background:var(--card);cursor:pointer;transition:background .12s,border-color .12s,transform .12s;animation:rise .35s ease both}
.results.still .row{animation:none}
.row:hover{background:var(--card2);border-color:var(--line2);transform:translateX(3px)}
.row .ico{font-size:20px;width:28px;text-align:center;flex:0 0 auto;margin-top:1px}
.row .c{flex:1 1 auto;min-width:0}
.row .l1{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.row .title{font-weight:650;font-size:15px}
.row:hover .title{background:linear-gradient(92deg,var(--acc1),var(--acc2));-webkit-background-clip:text;background-clip:text;color:transparent}
.row .nm{color:var(--mut2);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46ch}
.row .l2{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:5px;color:var(--mut2);font-size:12px}
.row .right{flex:0 0 auto;display:flex;align-items:center;gap:9px}
.row .t{color:var(--mut2);font-size:12px;white-space:nowrap}
.badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:2px 9px;border-radius:999px}
.extchip{font-size:11px;color:var(--mut2);border:1px solid var(--line);border-radius:6px;padding:1px 6px}
.matchpill{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--mark);background:rgba(255,204,51,.12);border:1px solid rgba(255,204,51,.32);border-radius:999px;padding:1px 8px}
.inlinesnip{margin-top:7px;font-size:12.5px;color:var(--mut);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.inlinesnip .ln,.snips .s .ln,.row-detail .ln{color:var(--acc1);font-size:11px;font-weight:700;margin-right:6px}

/* Folders */
.sec{margin-bottom:12px;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.02)}
.sec>h3{margin:0;padding:13px 17px;font-size:14px;font-weight:700;display:flex;align-items:center;gap:10px;cursor:pointer;background:var(--card);user-select:none;transition:background .12s}
.sec>h3:hover{background:var(--card2)}
.sec>h3 .n{color:var(--mut2);font-weight:500;font-size:12px}
.sec>h3 .fold{margin-left:auto;font-size:12px;color:var(--mut2);transition:transform .18s}
.sec.collapsed .fold{transform:rotate(-90deg)}
.sec.collapsed .secbody{display:none}
.sec .secbody{padding:9px}
.sec .list{gap:6px}
.sec .row{border-radius:10px}

/* detail heads + snips */
.heads{list-style:none;margin:0 0 10px;padding:0;columns:2;column-gap:24px}
.heads li{font-size:12.5px;color:var(--mut);padding:3px 0;break-inside:avoid;display:flex;gap:7px}
.heads li::before{content:"›";color:var(--acc1)}
.snips{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.snips .s{font-size:12.5px;color:var(--mut);background:rgba(255,255,255,.02);border:1px solid var(--line);border-left:3px solid var(--acc1);border-radius:9px;padding:7px 11px;line-height:1.5}

/* Empty */
.empty{text-align:center;padding:70px 20px;color:var(--mut)}
.empty .big{font-size:52px;margin-bottom:14px}
.empty p{color:var(--mut);font-size:15px;margin:6px 0}
.empty b{color:var(--tx)}
.empty .sugg{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:16px}
.empty .sugg span{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:13px;cursor:pointer;transition:all .12s}
.empty .sugg span:hover{border-color:var(--acc1);color:var(--tx)}

footer{margin-top:44px;padding-top:18px;border-top:1px solid var(--line);color:var(--mut2);font-size:12.5px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}

@media(max-width:760px){
  .stats{grid-template-columns:repeat(2,1fr)}
  h1.h{font-size:32px}
  .heads{columns:1}
  .wall{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
  .row .t{display:none}
}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<div class="wrap">
  <header class="hero">
    <div>
      <div class="kicker">Ordner-Kosmos · automatisch indexiert</div>
      <h1 class="h">🗂️ <span class="fname" id="fname"><?php echo $folderName; ?></span></h1>
      <p class="tag">Alles, was hier liegt — als Kachelwand. Neu abgelegte Dateien landen beim nächsten Blick von selbst hier. Durchsuchbar, sortierbar, übersichtlich.</p>
    </div>
    <div class="scanpill"><span class="dot"></span> gescannt <span id="scannow"></span></div>
  </header>

  <section class="stats" id="stats"></section>
  <section class="recent" id="recent"></section>

  <div class="searchhero">
    <div class="sbox" id="sw">
      <span class="go"><span class="mag">🔎</span><span class="spin"></span></span>
      <input id="q" type="search" placeholder="Durchsuche alles — Titel, Überschriften, Namen & Volltext …" autocomplete="off" spellcheck="false">
      <button id="clear" title="Leeren (Esc)">✕</button>
      <span class="shint"><kbd>/</kbd></span>
    </div>
  </div>

  <div class="typebar" id="typebar"></div>

  <div class="controls" id="controls">
    <div class="chips" id="chips"></div>
    <div class="ctrl">
      <select id="dir" title="Ordner filtern"></select>
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
      <div class="views" id="views">
        <button data-v="tiles" class="vbtn">▦ Kacheln</button>
        <button data-v="list" class="vbtn">☰ Liste</button>
        <button data-v="folders" class="vbtn">🗀 Ordner</button>
      </div>
      <button id="export" class="ghost" title="Aktuelle Ansicht als CSV">⬇ CSV</button>
      <button id="rescan" class="ghost" title="Neu scannen (lädt neue Dateien)">↻</button>
    </div>
  </div>

  <div class="resultbar"><span id="count"></span></div>

  <main class="results" id="results"></main>
  <div class="empty" id="empty" hidden>
    <div class="big">🕵️</div>
    <p>Kein Treffer für <b id="emptyq"></b>.</p>
    <p>Probier's kürzer — oder gleich eins davon:</p>
    <div class="sugg">
      <span data-sq="garben">garben</span>
      <span data-sq="attention">attention</span>
      <span data-sq="topology">topology</span>
      <span data-sq="embedding">embedding</span>
    </div>
  </div>

  <footer>
    <span><span id="ftotal"></span> Dateien · ohne Datenbank, ohne Bau­schritt — jeder Aufruf scannt neu, neue Dateien erscheinen automatisch.</span>
    <span><kbd>/</kbd> suchen · <kbd>Esc</kbd> leeren · <kbd>↻</kbd> neu scannen · Klick = öffnen · ⓘ = Details</span>
  </footer>
</div>
<script>
const DATA = <?php echo $dataJson; ?>;
const CAT_ORDER = ['html','image','code','data','text','doc','archive','binary','other'];
const ICONS  = <?php echo json_encode(ICONS, JSON_UNESCAPED_UNICODE|JSON_HEX_TAG); ?>;
const COLORS = <?php echo json_encode(COLORS, JSON_UNESCAPED_UNICODE|JSON_HEX_TAG); ?>;
const LABELS = <?php echo json_encode(LABELS, JSON_UNESCAPED_UNICODE|JSON_HEX_TAG); ?>;
const TILE_GRAD = {
  html:'linear-gradient(135deg,#1e3a8a,#3b82f6)',
  code:'linear-gradient(135deg,#065f46,#10b981)',
  data:'linear-gradient(135deg,#5b21b6,#8b5cf6)',
  text:'linear-gradient(135deg,#0c4a6e,#0ea5e9)',
  doc:'linear-gradient(135deg,#831843,#ec4899)',
  archive:'linear-gradient(135deg,#334155,#64748b)',
  binary:'linear-gradient(135deg,#111827,#334155)',
  other:'linear-gradient(135deg,#334155,#64748b)'
};

const $ = s => document.querySelector(s);
const state = { q:'', cat:'all', dir:'all', sort:'newest', view:'tiles' };
let deepResults = null, searchToken = 0, firstRender = true, openSet = new Set();

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
function openPath(p){ const a=document.createElement('a'); a.href=p; a.target='_blank'; a.rel='noopener'; document.body.appendChild(a); a.click(); a.remove(); }

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
  if(!deep && state.q) base = base.filter(it => matchesQ(it, state.q));
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

function badge(it){ return '<span class="badge" style="background:'+it.color+'22;color:'+it.color+';border:1px solid '+it.color+'44">'+it.icon+' '+esc(it.label)+'</span>'; }
function extChip(it){ return it.ext ? '<span class="extchip">.'+esc(it.ext)+'</span>' : ''; }
function matchPill(it){ return it.matches ? '<span class="matchpill">🎯 '+it.matches+'</span>' : ''; }
function detailHTML(it){
  let h = '';
  if(it.snippet) h += '<div style="margin-bottom:10px">'+esc(it.snippet)+'</div>';
  if(it.headings && it.headings.length) h += '<ul class="heads">'+it.headings.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
  if(it.snippets && it.snippets.length) h += '<div class="snips">'+it.snippets.map(s=>'<div class="s">'+(s.line?'<span class="ln">Z.&nbsp;'+s.line+'</span>':'')+mark(s.text, state.q)+'</div>').join('')+'</div>';
  if(!h) h = '<div style="color:var(--mut2)">Kein lesbarer Inhalt (binäre Datei).</div>';
  return h;
}
function peekHTML(it){
  if(it.snippets && it.snippets.length) return '<div class="tile-peek">'+mark(it.snippets[0].text, state.q)+'</div>';
  if(it.headings && it.headings.length) return '<div class="tile-peek overs">› '+esc(it.headings[0])+'</div>';
  if(it.snippet) return '<div class="tile-peek">'+esc(it.snippet)+'</div>';
  return '';
}

function tileHTML(it, i, anim){
  const open = openSet.has(it.path);
  const media = it.cat === 'image'
    ? '<img loading="lazy" src="'+esc(it.path)+'" alt="">'
    : '<span class="big">'+it.icon+'</span>';
  const grad = TILE_GRAD[it.cat] || TILE_GRAD.other;
  const delay = anim ? 'animation-delay:'+((i % 24) * 16)+'ms;' : '';
  const d = topDir(it.path);
  return '<div class="tile'+(open?' open':'')+'" data-path="'+esc(it.path)+'" style="--g:'+grad+';'+delay+'">'
    + '<div class="tile-media">'+media
      + '<span class="tile-cat" style="color:'+it.color+'">'+it.icon+' '+esc(it.label)+'</span>'
      + '<span class="tile-open" title="Öffnen">↗</span>'
      + '<span class="tile-time" title="'+esc(fullTime(it.mtime))+'">'+relTime(it.mtime)+'</span>'
    + '</div>'
    + '<div class="tile-body">'
      + '<div class="tile-title">'+esc(displayTitle(it))+'</div>'
      + '<div class="tile-name mono">'+esc(it.path)+'</div>'
      + peekHTML(it)
      + (it.matches ? '<span class="tile-match">🎯 '+it.matches+' Treffer</span>' : '')
      + '<div class="tile-meta"><span>'+hsize(it.size)+'</span>'+(d?'<span>·</span><span>📁 '+esc(d)+'</span>':'')
        + '<button class="tinfo" title="Überschriften & Details">ⓘ</button></div>'
    + '</div>'
    + '<div class="tile-detail">'+detailHTML(it)+'</div>'
  + '</div>';
}

function rowHTML(it){
  const open = openSet.has(it.path);
  const d = topDir(it.path);
  const inl = (it.snippets && it.snippets.length) ? '<div class="inlinesnip">'+(it.snippets[0].line?'<span class="ln">Z.&nbsp;'+it.snippets[0].line+'</span>':'')+mark(it.snippets[0].text, state.q)+'</div>' : '';
  return '<div class="row'+(open?' open':'')+'" data-path="'+esc(it.path)+'">'
    + '<div class="ico">'+it.icon+'</div>'
    + '<div class="c">'
      + '<div class="l1"><span class="title">'+esc(displayTitle(it))+'</span><span class="nm mono">'+esc(it.path)+'</span>'+matchPill(it)+'</div>'
      + '<div class="l2">'+badge(it)+extChip(it)+(d?'<span>📁 '+esc(d)+'</span>':'')+'<span>·</span><span>'+hsize(it.size)+'</span><span>·</span><span title="'+esc(fullTime(it.mtime))+'">'+relTime(it.mtime)+'</span></div>'
      + inl
    + '</div>'
    + '<div class="right"><button class="tinfo" title="Überschriften & Details">ⓘ</button></div>'
    + '<div class="row-detail">'+detailHTML(it)+'</div>'
  + '</div>';
}

function renderStats(){
  const total = DATA.length;
  const size = DATA.reduce((a,b)=>a+b.size,0);
  const dirs = new Set(DATA.map(it=>topDir(it.path))).size;
  const cats = new Set(DATA.map(it=>it.cat)).size;
  const newest = DATA[0];
  const cc = {}; DATA.forEach(it=>{ cc[it.cat]=(cc[it.cat]||0)+1; });
  const topCat = Object.keys(cc).sort((a,b)=>cc[b]-cc[a])[0];
  const card = (i,k,v,s)=>'<div class="stat"><div class="k">'+i+' '+k+'</div><div class="v">'+v+'</div><div class="s" title="'+esc(s)+'">'+esc(s)+'</div></div>';
  $('#stats').innerHTML =
    card('📄','Dateien',total, dirs+' Ordner')
    + card('💾','Größe',hsize(size), 'Ø '+hsize(total?Math.round(size/total):0)+' / Datei')
    + card('🏷️','Typen',cats, 'häufigster: '+ICONS[topCat]+' '+LABELS[topCat]+' ('+cc[topCat]+')')
    + card('🕒','Zuletzt',relTime(newest.mtime), displayTitle(newest));
  $('#ftotal').textContent = total;
}

function renderRecent(){
  const top = DATA.slice(0,6);
  $('#recent').innerHTML = '<span class="lbl">🔥 Vor kurzem</span>'
    + top.map(it=>'<a class="rl" href="'+esc(it.path)+'" target="_blank" rel="noopener" title="'+esc(fullTime(it.mtime))+'">'+it.icon+' <b>'+esc(displayTitle(it))+'</b> <span class="rt">'+relTime(it.mtime)+'</span></a>').join('');
}

function renderTypebar(){
  const counts = {}; DATA.forEach(it=>{ counts[it.cat]=(counts[it.cat]||0)+1; });
  const total = DATA.length || 1;
  $('#typebar').innerHTML = CAT_ORDER.filter(c=>counts[c]).map(c=>
    '<div class="seg'+(state.cat===c?' active':'')+'" data-cat="'+c+'" title="'+LABELS[c]+': '+counts[c]+'" style="flex:'+(counts[c]/total)+';background:'+COLORS[c]+'"></div>'
  ).join('');
}
function renderChips(){
  const counts = {}; DATA.forEach(it=>{ counts[it.cat]=(counts[it.cat]||0)+1; });
  $('#chips').innerHTML =
    '<span class="chip-f'+(state.cat==='all'?' active':'')+'" data-cat="all" style="'+(state.cat==='all'?'background:var(--tx);border-color:var(--tx);':'')+'">✦ Alle <span class="n">'+DATA.length+'</span></span>'
    + CAT_ORDER.filter(c=>counts[c]).map(c=>{
      const act = state.cat===c;
      return '<span class="chip-f'+(act?' active':'')+'" data-cat="'+c+'" style="'+(act?'background:'+COLORS[c]+';border-color:'+COLORS[c]+';':'')+'">'+ICONS[c]+' '+LABELS[c]+' <span class="n">'+counts[c]+'</span></span>';
    }).join('');
}
function renderDirs(){
  const dirs = [...new Set(DATA.map(it=>topDir(it.path)))].filter(d=>d).sort((a,b)=>a.localeCompare(b,'de'));
  $('#dir').innerHTML = '<option value="all">📁 Alle Ordner</option>' + dirs.map(d=>'<option value="'+esc(d)+'"'+(d===state.dir?' selected':'')+'>'+esc(d)+'</option>').join('');
}

function renderView(arr){
  const el = $('#results');
  el.classList.toggle('still', !firstRender);
  if(arr.length === 0){
    el.innerHTML=''; $('#empty').hidden=false; $('#emptyq').textContent = state.q || state.cat || '–';
    return;
  }
  $('#empty').hidden = true;
  if(state.view === 'list'){
    el.innerHTML = '<div class="list">' + arr.map(rowHTML).join('') + '</div>';
  } else if(state.view === 'folders'){
    const groups = {};
    arr.forEach(it=>{ const d = topDir(it.path) || '🏠 Wurzel'; (groups[d]=groups[d]||[]).push(it); });
    const keys = Object.keys(groups).sort((a,b)=> a.startsWith('🏠')?-1 : b.startsWith('🏠')?1 : a.localeCompare(b,'de'));
    el.innerHTML = keys.map(d=>{
      const list = groups[d]; const sz = list.reduce((a,b)=>a+b.size,0);
      return '<div class="sec"><h3>📁 '+esc(d)+' <span class="n">'+list.length+' · '+hsize(sz)+'</span><span class="fold">▾</span></h3>'
        + '<div class="secbody"><div class="list">'+list.map(rowHTML).join('')+'</div></div></div>';
    }).join('');
  } else {
    el.innerHTML = '<div class="wall">' + arr.map((it,i)=>tileHTML(it,i,firstRender)).join('') + '</div>';
  }
  const deep = state.q.length>=2 && deepResults!==null;
  let c = 'Zeige <b>'+arr.length+'</b> von <b>'+DATA.length+'</b>';
  if(deep){ const m = deepResults.reduce((a,b)=>a+(b.matches||0),0); c += ' · <span class="deep">Volltext: <b>'+deepResults.length+'</b> Dateien · <b>'+m+'</b> Treffer</span>'; }
  $('#count').innerHTML = c;
}

function render(){
  renderStats(); renderRecent(); renderTypebar(); renderChips(); renderDirs();
  renderView(currentItems());
  firstRender = false;
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
  $('#sw').classList.add('searching');
  fetch('index.php?api=1&q='+encodeURIComponent(q), {headers:{'Accept':'application/json'}})
    .then(r=>r.json())
    .then(j=>{ if(token===searchToken){ deepResults = j.files || []; render(); } })
    .catch(()=>{ if(token===searchToken) deepResults = null; })
    .finally(()=>{ if(token===searchToken) $('#sw').classList.remove('searching'); });
}

function exportCSV(arr){
  const rows = [['path','title','ext','type','size_bytes','modified'],
    ...arr.map(it=>[it.path, it.title||'', it.ext, it.label, it.size, new Date(it.mtime*1000).toISOString()])];
  const csv = rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'index_'+new Date().toISOString().slice(0,10)+'.csv'; a.click(); URL.revokeObjectURL(a.href);
}

function loadState(){
  const sp = new URLSearchParams(location.search);
  const hash = {};
  if(location.hash){ new URLSearchParams(location.hash.slice(1)).forEach((v,k)=>hash[k]=v); }
  state.q = (sp.get('q') || hash.q || '').trim();
  state.cat = hash.cat || 'all';
  state.dir = hash.dir || 'all';
  state.sort = hash.sort || 'newest';
  state.view = hash.view || 'tiles';
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
    const sq = e.target.closest('.sugg span[data-sq]');
    if(sq){ $('#q').value = sq.dataset.sq; onSearch(sq.dataset.sq); return; }
    const fold = e.target.closest('.sec>h3');
    if(fold){ fold.parentElement.classList.toggle('collapsed'); return; }
    const el = e.target.closest('#results [data-path]');
    if(!el) return;
    if(e.target.closest('.tinfo')){ toggleDetail(el.dataset.path); return; }
    openPath(el.dataset.path);
  });

  document.addEventListener('keydown', e=>{
    if(e.key === '/' && document.activeElement !== $('#q')){ e.preventDefault(); $('#q').focus(); }
    else if(e.key === 'Escape'){ onSearch(''); $('#q').blur(); }
  });
}
function toggleDetail(path){
  const el = document.querySelector('#results [data-path="'+CSS.escape(path)+'"]');
  if(!el) return;
  if(openSet.has(path)){ openSet.delete(path); el.classList.remove('open'); }
  else { openSet.add(path); el.classList.add('open'); }
}

loadState();
$('#scannow').textContent = new Date().toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'});
wire();
render();
if(state.q.length >= 2) deepSearch(state.q);
</script>
</body>
</html>
