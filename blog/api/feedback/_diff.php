<?php
/**
 * Generates a (single-file) unified diff in the format expected by
 * `git apply`. Minimal, dependency-free implementation.
 */
function feedback_make_unified_diff(string $old, string $new, string $filename): string {
	$oldLines = preg_split('/\r\n|\r|\n/', $old);
	$newLines = preg_split('/\r\n|\r|\n/', $new);

	$hunkStart = 0;
	$oldCount = count($oldLines);
	$newCount = count($newLines);

	$hunks = [];
	$i = 0; $j = 0;
	while ($i < $oldCount || $j < $newCount) {
		while ($i < $oldCount && $j < $newCount && $oldLines[$i] === $newLines[$j]) { $i++; $j++; }
		if ($i >= $oldCount && $j >= $newCount) break;

		$hunkOldStart = $i;
		$hunkNewStart = $j;
		$oldHunk = [];
		$newHunk = [];
		while ($i < $oldCount && ($j >= $newCount || $oldLines[$i] !== $newLines[$j])) {
			$oldHunk[] = '-' . $oldLines[$i];
			$i++;
			if (count($oldHunk) > 2 && $j < $newCount && $oldLines[$i] === $newLines[$j]) break;
		}
		while ($j < $newCount && ($i >= $oldCount || $oldLines[$i] !== $newLines[$j])) {
			$newHunk[] = '+' . $newLines[$j];
			$j++;
			if (count($newHunk) > 2 && $i < $oldCount && $oldLines[$i] === $newLines[$j]) break;
		}

		if (!$oldHunk && !$newHunk) break;

		$hunks[] = [
			'oldStart' => $hunkOldStart + 1,
			'oldCount' => count($oldHunk),
			'newStart' => $hunkNewStart + 1,
			'newCount' => count($newHunk),
			'old'      => $oldHunk,
			'new'      => $newHunk,
		];
	}

	if (!$hunks) return '';

	$out = "--- a/$filename\n";
	$out .= "+++ b/$filename\n";
	foreach ($hunks as $h) {
		$out .= "@@ -{$h['oldStart']},{$h['oldCount']} +{$h['newStart']},{$h['newCount']} @@\n";
		foreach ($h['old'] as $l) $out .= $l . "\n";
		foreach ($h['new'] as $l) $out .= $l . "\n";
	}
	return $out;
}
