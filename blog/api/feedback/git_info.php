<?php
/**
 * GET /api/feedback/git_info.php
 *   Public — returns the current git commit, branch and dirty flag.
 *   Useful for the page UI to show "your feedback was filed under
 *   commit abc1234" and to detect drift on re-load.
 */
require_once(__DIR__ . '/_bootstrap.php');
feedback_require_method('GET');
feedback_json_response(feedback_git_info());
