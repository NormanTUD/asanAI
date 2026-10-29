<?php
/* Rebuild the search cache and print the extracted blocks as JSON.
 *
 * Used by tools/build_semantic_index.py so the semantic index sees exactly the
 * same chunks as the lexical search. Run from anywhere; paths are anchored to
 * this file. Writes .search_cache.json as a side effect.
 */

require_once __DIR__ . '/../search_lib.php';

$dir = dirname(__DIR__);
$exclude = search_excludes();
$pages = buildIndex($dir, $exclude, true);

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
	'key' => searchCacheKey($dir, $exclude),
	'sourceHash' => searchSourceHash($dir, $exclude),
	'pages' => $pages,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
