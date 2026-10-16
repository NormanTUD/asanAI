<?php
/**
 * index.php — redirect any directory hit to the admin panel.
 * Uses a path-relative redirect so it works regardless of mountpoint
 * (e.g. /blog/api/feedback/admin/ vs /asanai/blog/api/feedback/admin/).
 */
header('Location: panel.php', true, 302);
exit;
