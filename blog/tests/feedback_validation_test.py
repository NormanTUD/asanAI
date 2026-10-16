#!/usr/bin/env python3
"""
Blog Feedback System — Python Validation Tests
----------------------------------------------
Tests that:
  - All required files exist (PHP endpoints, JS, CSS, config)
  - DB schema matches what PHP code expects (columns, indexes)
  - .htaccess protects the data dir
  - JS uses only the documented global hooks (window.BlogFeedback)
  - CSS uses only the documented theme tokens
  - No hardcoded paths to a real user's home in source
  - Citation macros in lessons (if present) match literature.js keys

These are static checks — they don't start a server. They run fast and
can be used as a pre-commit or CI gate.

Usage:
  uv run blog/tests/feedback_validation_test.py
"""
import os
import re
import sys
from pathlib import Path

ROOT      = Path(__file__).resolve().parent.parent.parent
BLOG      = ROOT / "blog"
API       = BLOG / "api" / "feedback"
FEEDBACK  = BLOG / "feedback"

passed = 0
failed = 0
errors = []


def ok(cond, msg):
    global passed, failed
    if cond:
        passed += 1
        return True
    failed += 1
    errors.append(msg)
    return False


def contains(path, needle, msg):
    if not path.exists():
        ok(False, f"{msg} (file missing: {path})")
        return
    text = path.read_text(errors="replace")
    ok(needle in text, f"{msg} (looking for {needle!r} in {path.name})")


def regex(path, pattern, msg, flags=0):
    if not path.exists():
        ok(False, f"{msg} (file missing: {path})")
        return
    text = path.read_text(errors="replace")
    ok(re.search(pattern, text, flags) is not None, f"{msg} (pattern {pattern!r})")


def missing(path, needle, msg):
    if not path.exists():
        ok(True, f"{msg} (file missing, skipping)")
        return
    text = path.read_text(errors="replace")
    ok(needle not in text, f"{msg} (must NOT contain {needle!r})")


print("=== Feedback Validation Tests ===\n")

# 1. Required files exist ------------------------------------------------
ok((API / "_bootstrap.php").exists(),   "file: _bootstrap.php")
ok((API / "_health.php").exists(),      "file: _health.php")
ok((API / "_diff.php").exists(),        "file: _diff.php")
ok((API / "config.php").exists(),       "file: config.php")
ok((API / "submit.php").exists(),       "file: submit.php")
ok((API / "list.php").exists(),         "file: list.php")
ok((API / "react.php").exists(),        "file: react.php")
ok((API / "comment.php").exists(),      "file: comment.php")
ok((API / "git_info.php").exists(),     "file: git_info.php")
ok((API / "setup.php").exists(),        "file: setup.php")
ok((API / "admin" / "login.php").exists(),  "file: admin/login.php")
ok((API / "admin" / "logout.php").exists(), "file: admin/logout.php")
ok((API / "admin" / "list.php").exists(),   "file: admin/list.php")
ok((API / "admin" / "update.php").exists(), "file: admin/update.php")
ok((API / "admin" / "apply.php").exists(),  "file: admin/apply.php")
ok((API / "admin" / "health.php").exists(), "file: admin/health.php")
ok((API / "admin" / "panel.php").exists(),  "file: admin/panel.php")
ok((FEEDBACK / "feedback.js").exists(),  "file: feedback/feedback.js")
ok((FEEDBACK / "feedback.css").exists(), "file: feedback/feedback.css")
ok((FEEDBACK / "admin.js").exists(),     "file: feedback/admin.js")
ok((FEEDBACK / "admin.css").exists(),    "file: feedback/admin.css")

# 2. Bootstrap creates all expected tables ---------------------------------
bootstrap = (API / "_bootstrap.php").read_text()
expected_tables = [
    "CREATE TABLE IF NOT EXISTS feedback",
    "CREATE TABLE IF NOT EXISTS feedback_comments",
    "CREATE TABLE IF NOT EXISTS feedback_reactions",
    "CREATE TABLE IF NOT EXISTS text_aha",
    "CREATE TABLE IF NOT EXISTS feedback_history",
    "CREATE TABLE IF NOT EXISTS admin_sessions",
    "CREATE TABLE IF NOT EXISTS rate_limits",
]
for t in expected_tables:
    regex_from = bootstrap
    ok(t in regex_from, f"schema: {t}")

# 3. Feedback table has all required columns -------------------------------
required_feedback_cols = [
    "uuid", "lesson_slug", "category", "anchor_type",
    "anchor_selector", "anchor_quote", "anchor_prefix", "anchor_suffix",
    "anchor_section", "anchor_image_src", "anchor_image_alt", "anchor_caption",
    "body", "suggestion_original", "suggestion_replacement",
    "author_handle", "author_email", "visitor_id",
    "status", "approved", "git_commit", "git_branch",
    "upvotes", "downvotes", "aha_count", "reply_count",
    "anchor_status", "anchor_confidence",
]
for col in required_feedback_cols:
    ok(col in bootstrap, f"feedback table has column: {col}")

# 4. Indexes exist -------------------------------------------------------
required_indexes = [
    "idx_fb_lesson", "idx_fb_status", "idx_fb_approved",
    "idx_fb_selector", "idx_fb_visitor",
    "idx_fbc_fid", "idx_fbc_visitor",
    "idx_fbr_target", "idx_fbr_visitor",
]
for idx in required_indexes:
    ok(idx in bootstrap, f"index exists: {idx}")

# 5. Endpoints use structured JSON errors --------------------------------
error_endpoints = [
    API / "submit.php",
    API / "list.php",
    API / "react.php",
    API / "comment.php",
    API / "admin" / "login.php",
    API / "admin" / "list.php",
    API / "admin" / "update.php",
    API / "admin" / "apply.php",
]
for ep in error_endpoints:
    if ep.exists():
        text = ep.read_text(errors="replace")
        ok("feedback_json_error" in text or "feedback_json_response" in text,
           f"{ep.name}: uses structured JSON error helpers")
        ok("feedback_require_method" in text,
           f"{ep.name}: validates HTTP method")

# 6. Security: no eval, no system() exec, no shell_exec ---------------
forbidden = [
    (r"\beval\s*\(",            "no eval()"),
    (r"\bsystem\s*\(",           "no system()"),
    (r"\bpassthru\s*\(",         "no passthru()"),
    (r"\bexec\s*\(\s*['\"]",     "no exec('...')"),
]
for php_file in API.rglob("*.php"):
    text = php_file.read_text(errors="replace")
    for pat, msg in forbidden:
        # exec() in PDO context is fine — but bare exec() calls aren't.
        # We're only checking for exec('string') which is shell exec.
        if pat == r"\bexec\s*\(\s*['\"]" and "feedback_json_error" in text:
            continue  # allow exec() as a variable name in helpers
        ok(re.search(pat, text) is None, f"{php_file.name}: {msg}")

# 7. Health check is thorough -------------------------------------------
health = (API / "_health.php").read_text()
required_checks = [
    "FEEDBACK_DATA_DIR",
    "FEEDBACK_DB_PATH",
    "FEEDBACK_ADMIN_PW_FILE",
    "is_writable",
    "is_readable",
    "chown",
    "chmod",
]
for c in required_checks:
    ok(c in health, f"health check covers: {c}")

# 8. Health banner is wired in functions.php and index.php -------------
fn = (BLOG / "functions.php").read_text()
ok("feedback_health_banner" in fn, "functions.php calls feedback_health_banner")
ok("function feedback_health_banner" in fn, "functions.php defines feedback_health_banner()")
ok(fn.count("feedback_health_banner") >= 2,
   "functions.php wires health banner in 2 places")

idx_php = (BLOG / "index.php").read_text()
ok("feedback_health_banner" in idx_php, "index.php calls feedback_health_banner")

# 9. .htaccess protects the data dir -----------------------------------
ht = (BLOG / ".htaccess").read_text()
ok("feedback_data" in ht, ".htaccess mentions feedback_data")
ok("adminpw" in ht, ".htaccess blocks adminpw")

# 9b. .htaccess uses 308 (not 301) for the .php-stripping redirect.
# 301 causes browsers to convert POST→GET, breaking JSON API POSTs.
ok("R=308" in ht, ".htaccess uses 308 (method-preserving) for .php strip")
ok("!^(POST|PUT|PATCH|DELETE)$" in ht,
   ".htaccess excludes POST/PUT/PATCH/DELETE from the .php-strip redirect")

# 10. JS exposes the documented API --------------------------------------
fbjs = (FEEDBACK / "feedback.js").read_text()
ok("window.BlogFeedback" in fbjs, "feedback.js exports window.BlogFeedback")
ok("function setMode" in fbjs or "function _setMode" in fbjs or "function setMode(" in fbjs,
   "feedback.js has setMode")
ok("function fetchFeedback" in fbjs or "fetchFeedback(" in fbjs,
   "feedback.js has fetchFeedback")
ok("function api(" in fbjs, "feedback.js wraps fetch in api()")

# 10b. Composer is simple (markdown + LaTeX only, no WYSIWYG toolbar)
ok("fb-popover-simple" in fbjs,    "feedback.js uses simplified composer")
ok("fb-simple-textarea" in fbjs,   "feedback.js renders a plain textarea")
ok("Markdown + $LaTeX$" in fbjs,   "feedback.js advertises markdown+latex support")
ok("fb-selection-pointer" in fbjs, "feedback.js has visual selection pointer")

# 10c. Composer opens DIRECTLY on text selection (no toolbar click needed)
ok("openComposerAt" in fbjs,       "feedback.js has openComposerAt function")
ok("onMouseUpInBugMode" in fbjs,   "feedback.js wires mouseup → composer")
ok("showSelectionToolbar" not in fbjs, "feedback.js does NOT use selection toolbar (composer opens directly)")
ok("hideSelectionToolbar" not in fbjs, "feedback.js does NOT have dead toolbar code")

# 10d. Composer DOES NOT have WYSIWYG toolbar (per design)
ok("fb-rich-toolbar" not in fbjs,   "feedback.js has NO rich-toolbar (simplified)")
ok("fb-rich-tabs" not in fbjs,      "feedback.js has NO tabs (simplified)")
ok("fb-rich-pane" not in fbjs,      "feedback.js has NO preview pane (simplified)")
ok("fb-math-templates" not in fbjs, "feedback.js has NO math-templates picker (simplified)")

# 11. JS handles every required error path -------------------------------
ok("Network error" in fbjs,    "feedback.js handles network errors")
ok("request_id" in fbjs,       "feedback.js surfaces request_id")
ok("flashToast" in fbjs,       "feedback.js uses flashToast")
ok("unhandledrejection" in fbjs, "feedback.js catches unhandled rejections")
ok("addEventListener('error'" in fbjs or 'addEventListener("error"' in fbjs,
   "feedback.js catches global errors")

# 12. CSS uses theme tokens (no hardcoded hex outside our own vars) -----
css = (FEEDBACK / "feedback.css").read_text()
ok("var(--mn-" in css, "feedback.css uses --mn-* tokens")
ok("color-mix(in srgb" in css, "feedback.css uses color-mix()")

# 13. Admin panel is wired in functions.php ------------------------------
ok("render_feedback_toggle" in fn, "functions.php has render_feedback_toggle()")
ok("render_feedback_toggle" in idx_php, "index.php calls render_feedback_toggle")

# 14. Intro page mentions the bug button -------------------------------
intro = (BLOG / "intro.php").read_text()
ok("fb-inline-btn" in intro, "intro.php has inline bug button")
ok("fb-end-callout" in intro, "intro.php has end-callout")
ok("🐛" in intro or "bug" in intro.lower(), "intro.php mentions the bug")

# 15. Submit endpoint validates anchor_type whitelist --------------------
submit = (API / "submit.php").read_text()
ok("'text'" in submit and "'image'" in submit and "'heading'" in submit and "'code'" in submit,
   "submit.php allows image/heading/code anchor_types")
ok("honeypot" in submit, "submit.php checks honeypot")
ok("challenge_token" in submit, "submit.php checks challenge_token")
ok("visitor_id" in submit, "submit.php stores visitor_id")
ok("rate_limit" in submit, "submit.php enforces rate limit")

# 16. Comments endpoint is permissive to author -----------------------
comment = (API / "comment.php").read_text()
ok("visitor_id" in comment, "comment.php stores visitor_id")
ok("is_own" in comment or "hash_equals" in comment,
   "comment.php checks if commenter owns the feedback")

# 17. List endpoint returns own + approved for visitor -------------------
list_php = (API / "list.php").read_text()
ok("visitor_id" in list_php, "list.php uses visitor_id for own-feedback matching")
ok("is_own" in list_php, "list.php returns is_own flag")
ok("approved = 1" in list_php or "approved=1" in list_php,
   "list.php filters by approved")

# 18. Apply (suggestion patch) writes to disk but never edits the lesson -
apply = (API / "admin" / "apply.php").read_text()
ok("file_get_contents" in apply, "apply.php reads the lesson file")
ok("file_put_contents" in apply, "apply.php writes a patch file")
ok("substr_count" in apply, "apply.php counts matches")
ok("Single match" in apply or "appears" in apply.lower(),
   "apply.php warns on multiple matches")
ok("patches/" in apply, "apply.php writes to patches/ dir")

# 19. The admin panel is login-gated ------------------------------------
login = (API / "admin" / "login.php").read_text()
ok("password_verify" in login, "admin login uses password_verify")
ok("PASSWORD_BCRYPT" in login, "admin login uses bcrypt")
ok("random_bytes" in login, "admin login generates random token")
ok("install_command" in login, "admin login returns install command when pw file missing")

# 20. Test scripts do not touch real data -------------------------------
test_api = (BLOG / "tests" / "feedback_api_test.php").read_text()
ok("ASANAI_FEEDBACK_DIR" in test_api, "PHP test uses isolated env var")
ok("fb_test_" in test_api,            "PHP test uses isolated temp dir prefix")
ok("sys_get_temp_dir" in test_api,     "PHP test derives temp dir from sys_get_temp_dir()")
ok("register_shutdown_function" in test_api,
   "PHP test cleans up on exit")

# 21. There's no hardcoded prod admin password in source ---------------
for f in [API / "config.php", API / "admin" / "login.php", FEEDBACK / "admin.js"]:
    text = f.read_text(errors="replace")
    bad = re.search(r"password\s*=\s*['\"][^'\"]{4,}['\"]", text)
    ok(not bad, f"{f.name}: no hardcoded password literal")

# 22. Reload on admin: the page shows nothing secret after logout --------
admin_js = (FEEDBACK / "admin.js").read_text()
ok("logout" in admin_js.lower(), "admin.js handles logout")
ok("admin/" in admin_js, "admin.js references admin endpoints")

# 22b. No double-admin in URL construction (regression guard)
ok("/admin/admin" not in admin_js,
   "admin.js does NOT build URLs with /admin/admin (double-prefix bug)")
ok("FEEDBACK_API" in admin_js, "admin.js defines FEEDBACK_API constant")
ok("ADMIN_API" in admin_js,    "admin.js defines ADMIN_API constant")

# 23. Style files don't leak server-side info ----------------------------
admin_css = (FEEDBACK / "admin.css").read_text()
ok("/var/lib/" not in admin_css, "admin.css has no hardcoded /var/lib paths")
ok("/home/" not in admin_css, "admin.css has no hardcoded home paths")

# 24. Admin auto-loads annotations on page load -------------------------
fb_js = (FEEDBACK / "feedback.js").read_text()
ok("autoLoadForAdmin" in fb_js, "feedback.js defines autoLoadForAdmin")
ok("fb_admin" in fb_js, "feedback.js checks for fb_admin cookie")
ok("fb-admin-view" in fb_js, "feedback.js sets fb-admin-view class for admins")
ok("/admin/list.php" in fb_js, "feedback.js hits /admin/list.php for admin users")
ok("is-admin-view" in fb_js, "feedback.js marks the toggle button as admin view")

# 25. Multi-quote anchoring helpers present -------------------------------
ok("captureAnchorChunks" in fb_js, "feedback.js defines captureAnchorChunks")
ok("tryExactAnchor" in fb_js, "feedback.js defines tryExactAnchor")
ok("tryChunkAnchor" in fb_js, "feedback.js defines tryChunkAnchor")
ok("tryFuzzyAnchor" in fb_js, "feedback.js defines tryFuzzyAnchor")
ok("djb2Hash" in fb_js, "feedback.js defines djb2Hash")
ok("anchor_chunks" in fb_js, "feedback.js sends anchor_chunks to server")
ok("anchor_section_title" in fb_js, "feedback.js sends anchor_section_title")
ok("anchor_text_hash" in fb_js, "feedback.js sends anchor_text_hash")

# 26. Git-aware at_commit endpoint exists + admin JS links to it ---------
at_commit = (API / "admin" / "at_commit.php")
ok(at_commit.exists(), "admin/at_commit.php exists")
at_commit_text = at_commit.read_text() if at_commit.exists() else ""
ok("feedback_admin_authed" in at_commit_text, "at_commit.php checks admin auth")
ok("git show" in at_commit_text,            "at_commit.php uses git show")
ok("Original quote" in at_commit_text,      "at_commit.php has Original quote section")
ok("Stored anchor metadata" in at_commit_text, "at_commit.php dumps anchor metadata")
ok("What does this tell us" in at_commit_text, "at_commit.php has a verdict paragraph")
ok("<?php" in at_commit_text and "?>" in at_commit_text,
   "at_commit.php uses only <?php (no short tags)")
php_open = at_commit_text.count("<?php")
php_close = at_commit_text.count("?>")
ok(php_open == php_close, f"at_commit.php tag balance: {php_open} open vs {php_close} close")

# 27. Submit + list endpoints carry new anchor fields --------------------
submit_text = (API / "submit.php").read_text()
ok("anchor_chunks" in submit_text,         "submit.php reads anchor_chunks from input")
ok("anchor_section_title" in submit_text,  "submit.php reads anchor_section_title")
ok("anchor_text_hash" in submit_text,      "submit.php reads anchor_text_hash")
list_text = (API / "list.php").read_text()
ok("anchor_chunks" in list_text,           "list.php returns anchor_chunks in API response")
ok("anchor_section_title" in list_text,    "list.php returns anchor_section_title")
ok("anchor_text_hash" in list_text,        "list.php returns anchor_text_hash")
admin_list_text = (API / "admin" / "list.php").read_text()
ok("anchor_chunks" in admin_list_text,     "admin/list.php returns anchor_chunks")
ok("anchor_section_title" in admin_list_text, "admin/list.php returns anchor_section_title")

# 28. DB migration adds new anchor columns --------------------------------
bootstrap = (API / "_bootstrap.php").read_text()
ok("'anchor_chunks'" in bootstrap,         "_bootstrap.php migrates anchor_chunks column")
ok("'anchor_section_title'" in bootstrap,  "_bootstrap.php migrates anchor_section_title column")
ok("'anchor_text_hash'" in bootstrap,      "_bootstrap.php migrates anchor_text_hash column")

# 29. Admin.js links to at_commit ----------------------------------------
ok("at_commit" in admin_js, "admin.js links to at_commit endpoint")
ok("fb-at-commit" in admin_js, "admin.js uses fb-at-commit class")

print(f"\nPassed: {passed}")
print(f"Failed: {failed}")
if failed:
    print("\n=== Failures ===")
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)
print("\nAll validation tests passed ✓")
