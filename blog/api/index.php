<?php
/**
 * /blog/api/index.php — redirect any directory hit to the feedback admin.
 * Path-relative so it works under any mountpoint.
 */
header('Location: feedback/admin/panel.php', true, 302);
exit;
