<?php
/**
 * Blog Feedback — Health Check
 * ----------------------------
 * Inspects every file the feedback system touches and returns a list
 * of issues with severity, message, and the exact chmod/chown command
 * to fix it. The list is rendered as a banner on every page so the
 * site operator notices the moment something breaks.
 *
 * This file does NOT open the SQLite DB and does NOT mutate state —
 * safe to call on every page load.
 */

require_once(__DIR__ . '/config.php');

function feedback_check_setup(): array {
	$issues  = [];
	$user    = 'apache';
	if (function_exists('posix_geteuid') && function_exists('posix_getpwuid')) {
		$info = posix_getpwuid(posix_geteuid());
		if ($info && isset($info['name'])) $user = $info['name'];
	} else {
		$user = get_current_user() ?: $user;
	}
	$group  = 'apache';
	if (function_exists('posix_getegid') && function_exists('posix_getgrgid')) {
		$g = posix_getgrgid(posix_getegid());
		if ($g && isset($g['name'])) $group = $g['name'];
	}

	$push = function (string $severity, string $path, string $what, string $fix, string $note = '') use (&$issues) {
		$issues[] = [
			'severity' => $severity,
			'path'     => $path,
			'what'     => $what,
			'fix'      => $fix,
			'note'     => $note,
		];
	};

	// 1. Data directory ----------------------------------------------------
	$dir = FEEDBACK_DATA_DIR;
	if (!is_dir($dir)) {
		@mkdir($dir, 0775, true);
	}
	if (!is_dir($dir)) {
		$push('critical', $dir,
			'Data directory does not exist and could not be created.',
			"sudo mkdir -p $dir && sudo chown $user:$group $dir && sudo chmod 775 $dir",
			'Without this directory, the SQLite database cannot be created or opened.');
		return $issues;
	}
	if (!is_readable($dir)) {
		$push('critical', $dir,
			'Data directory is not readable.',
			"sudo chmod 755 $dir && sudo chown $user:$group $dir",
			'');
		return $issues;
	}
	if (!is_writable($dir)) {
		$perms = @substr(sprintf('%o', @fileperms($dir)), -4) ?: '????';
		$own   = '?';
		if (function_exists('posix_getpwuid')) {
			$i = @posix_getpwuid(@fileowner($dir));
			if ($i && isset($i['name'])) $own = $i['name'];
		}
		$push('critical', $dir,
			"Data directory is not writable by '$user' (owner=$own, perms=$perms).",
			"sudo chown -R $user:$group $dir && sudo chmod -R u+rwX,g+rwX $dir",
			'Fix this first — every other feedback feature depends on it.');
		return $issues;
	}

	// 2. SQLite file -------------------------------------------------------
	$db = FEEDBACK_DB_PATH;
	if (!file_exists($db)) {
		@touch($db);
		@chmod($db, 0664);
	}
	if (!file_exists($db)) {
		$push('critical', $db,
			'SQLite file cannot be created.',
			"sudo touch $db && sudo chown $user:$group $db && sudo chmod 664 $db",
			'Usually caused by a non-writable parent directory.');
	} elseif (!is_writable($db) || !is_readable($db)) {
		$perms = @substr(sprintf('%o', @fileperms($db)), -4) ?: '????';
		$own   = '?';
		if (function_exists('posix_getpwuid')) {
			$i = @posix_getpwuid(@fileowner($db));
			if ($i && isset($i['name'])) $own = $i['name'];
		}
		$push('critical', $db,
			"SQLite file is not readable+writable by '$user' (owner=$own, perms=$perms).",
			"sudo chown $user:$group $db && sudo chmod 664 $db",
			'Run the command, then refresh — the page will recover automatically.');
	}

	// 3. Patches directory -------------------------------------------------
	$pd = FEEDBACK_PATCHES_DIR;
	if (!is_dir($pd)) {
		@mkdir($pd, 0775, true);
	}
	if (is_dir($pd) && !is_writable($pd)) {
		$push('warning', $pd,
			"Patches directory is not writable — 'Copy as patch' won't work.",
			"sudo chown $user:$group $pd && sudo chmod 775 $pd",
			'Non-critical — the rest of the feedback system still works.');
	}

	// 4. Admin password file ----------------------------------------------
	$pw = FEEDBACK_ADMIN_PW_FILE;
	if (!file_exists($pw)) {
		$push('warning', $pw,
			'Admin password hash file is missing — admin panel will refuse to start.',
			"php -r \"echo password_hash('YourSecretPassword', PASSWORD_BCRYPT);\" > $pw && chmod 440 $pw",
			'Public feedback still works; only the admin login is locked.');
	} elseif (!is_readable($pw)) {
		$push('warning', $pw,
			'Admin password hash file is not readable.',
			"sudo chown $user $pw && sudo chmod 440 $pw",
			'');
	}

	return $issues;
}

function feedback_setup_run(): array {
	$log = [];
	$user = function_exists('posix_geteuid') && function_exists('posix_getpwuid')
		? (posix_getpwuid(posix_geteuid())['name'] ?? 'apache')
		: 'apache';

	$dir = FEEDBACK_DATA_DIR;
	if (!is_dir($dir)) {
		if (@mkdir($dir, 0775, true)) $log[] = "created $dir";
		else $log[] = "ERROR: could not create $dir — run: sudo mkdir -p $dir && sudo chown $user $dir";
	}
	if (is_dir($dir) && !is_writable($dir)) {
		$log[] = "ERROR: $dir not writable — run: sudo chown $user $dir && sudo chmod 775 $dir";
	}

	$db = FEEDBACK_DB_PATH;
	if (!file_exists($db)) {
		@touch($db);
		@chmod($db, 0664);
		if (file_exists($db)) $log[] = "created $db";
	}

	$pd = FEEDBACK_PATCHES_DIR;
	if (!is_dir($pd)) {
		@mkdir($pd, 0775, true);
		if (is_dir($pd)) $log[] = "created $pd";
	}

	$pw = FEEDBACK_ADMIN_PW_FILE;
	if (!file_exists($pw)) {
		$log[] = "NOTE: admin password file missing at $pw — set it up via the admin panel.";
	}

	return $log;
}
