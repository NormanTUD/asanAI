<?php
/**
 * index.php — redirect any directory hit to the admin panel.
 * Path-relative: works under any mountpoint.
 */
header('Location: admin/panel.php', true, 302);
exit;
