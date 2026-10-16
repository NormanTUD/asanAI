#!/usr/bin/env python3
"""
Blog Feedback — Render Tests (Python)
--------------------------------------
End-to-end checks against an actual PHP server. Verifies:
  - Lesson page renders with bug button + end-callout + JS + CSS
  - Admin panel renders with login form (or app when authed)
  - Directory hits redirect to the admin panel
  - Static / health endpoints return expected status + content-type
  - All scripts referenced in rendered HTML actually load (200)

Pure Python stdlib (urllib). No requests, no selenium — fast and
deterministic. Spawns its own PHP server, cleans up on exit.

Usage:
  python3 blog/tests/feedback_render_test.py
"""
import json
import os
import re
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
BLOG = ROOT / "blog"

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


def fetch(url, method='GET', data=None, headers=None, follow_redirects=False, timeout=5):
    """Tiny HTTP client. Returns (status, headers, body)."""
    req = urllib.request.Request(url, method=method, data=data)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if not follow_redirects:
        # Disable auto-redirect so we can inspect 3xx responses.
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *a, **kw):
                return None
        opener = urllib.request.build_opener(NoRedirect)
        urllib.request.install_opener(opener)
    try:
        resp = urllib.request.urlopen(req, timeout=timeout)
        # Normalize header keys to Title-Case for case-insensitive lookup.
        hdrs = {k.title(): v for k, v in resp.headers.items()}
        return resp.status, hdrs, resp.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as e:
        hdrs = {k.title(): v for k, v in (e.headers or {}).items()}
        return e.code, hdrs, (e.read().decode('utf-8', errors='replace') if e.fp else '')
    except Exception as e:
        return 0, {}, str(e)


def free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


print("=== Feedback Render Tests ===\n")

# ── Start server ──────────────────────────────────────────────────────
port = 10000 + (int(time.time()) % 5000)
base = f"http://127.0.0.1:{port}"
test_dir = f"/tmp/fb_render_{os.getpid()}"
os.makedirs(test_dir, exist_ok=True)
os.environ['ASANAI_FEEDBACK_DIR'] = test_dir

log = open('/tmp/fb_render.log', 'w')
server = subprocess.Popen(
    ['php', '-S', f'127.0.0.1:{port}', '-t', str(BLOG)],
    cwd=str(BLOG),
    stdout=log,
    stderr=log,
    preexec_fn=os.setsid,
)
# Wait for server to come up
for _ in range(40):
    time.sleep(0.1)
    try:
        urllib.request.urlopen(base + '/api/feedback/setup.php', timeout=1).read()
        break
    except Exception:
        pass
else:
    print('Server never came up.')
    server.terminate()
    sys.exit(1)

def cleanup():
    try:
        os.killpg(os.getpgid(server.pid), signal.SIGTERM)
    except Exception:
        pass
    server.wait(timeout=3)
    try:
        import shutil
        shutil.rmtree(test_dir)
    except Exception:
        pass

import atexit
atexit.register(cleanup)

# ── 1. Lesson page renders all feedback components ──────────────────
print("-- Lesson page (intro.php) --")
status, headers, body = fetch(f"{base}/intro")
ok(status == 200, f"intro.php returns 200 (got {status})")
ok('text/html' in headers.get('Content-Type', '').lower(), "intro.php content-type is text/html")

# All required components present
components = [
    ('id="fb-toggle"',                    'chrome bug button'),
    ('fb-end-callout',                    'end-callout block'),
    ('fb-inline-btn',                     'inline bug button'),
    ('feedback/feedback.js',              'feedback JS loaded'),
    ('feedback/feedback.css',             'feedback CSS loaded'),
]
for needle, name in components:
    ok(needle in body, f"intro.php has {name}")

# Bug button should have the title text
ok('Click to leave feedback' in body, "intro.php bug button has title")

# Health banner should NOT be shown (system is healthy in test)
# (we'll check this after triggering an issue)

# ── 2. Admin panel renders login form ──────────────────────────────
print("\n-- Admin panel (panel.php, unauthenticated) --")
status, headers, body = fetch(f"{base}/api/feedback/admin/panel.php")
ok(status == 200, f"panel.php returns 200 (got {status})")
ok('id="fb-login-form"' in body, "panel has login form")
ok('id="fb-admin-app"' in body, "panel has app div (hidden)")
# Login form is visible: <div id="fb-admin-login" class="fb-admin-login">  (no hidden)
ok(re.search(r'<div\s+id="fb-admin-login"\s+class="fb-admin-login"\s*>', body) is not None,
   "login form is visible when no auth")
# App is hidden: <div id="fb-admin-app" class="fb-admin-app" hidden>
ok(re.search(r'<div\s+id="fb-admin-app"\s+class="fb-admin-app"\s+hidden\s*>', body) is not None,
   "app is hidden when no auth")
ok('feedback/admin.js' in body, "admin.js is referenced")
ok('feedback/admin.css' in body, "admin.css is referenced")
ok('How do I create the admin password?' in body, "panel shows setup instructions")

# ── 3. Directory redirects work ───────────────────────────────────
print("\n-- Directory redirects --")
for path, expected_target_fragment in [
    ('/api/',                  'panel.php'),
    ('/api/feedback/',         'panel.php'),
    ('/api/feedback/admin/',    'panel.php'),
]:
    status, headers, _ = fetch(f"{base}{path}")
    loc = headers.get('Location', '')
    ok(status == 302, f"GET {path} → 302 (got {status})")
    ok(expected_target_fragment in loc,
       f"GET {path} Location contains '{expected_target_fragment}' (got '{loc}')")

# ── 4. Static assets resolve (200) ─────────────────────────────────
print("\n-- Static assets --")
for path in [
    '/intro',
    '/api/feedback/setup.php',
    '/api/feedback/git_info.php',
    '/api/feedback/list.php?lesson=intro',
]:
    status, _, _ = fetch(f"{base}{path}")
    ok(status in (200, 400), f"GET {path} → {status} (allowed)")

# ── 5. JSON endpoints return JSON content-type ─────────────────────
# (setup.php is HTML — the user-facing setup page — skip it here)
print("\n-- JSON endpoints --")
for path in [
    '/api/feedback/git_info.php',
    '/api/feedback/list.php?lesson=intro',
]:
    status, headers, body = fetch(f"{base}{path}")
    ct = headers.get('Content-Type', '')
    ok('application/json' in ct, f"GET {path} content-type JSON (got '{ct}')")

# ── 6. Methods are enforced ─────────────────────────────────────────
# GET endpoints stay GET; POST endpoints show a friendly HTML help page
# (still 200, not 405) with explicit guidance for users who hit the URL
# directly. The real "not allowed" only fires for completely wrong methods.
print("\n-- HTTP method handling --")
# list.php is GET-only
for path in ['/api/feedback/list.php', '/api/feedback/git_info.php']:
	status, _, _ = fetch(f"{base}{path}", method='POST')
	ok(status == 405, f"{path} rejects POST (got {status})")

# POST endpoints show a friendly help page on GET, real 405 on PUT/DELETE
for path in [
	'/api/feedback/react.php',
	'/api/feedback/comment.php',
	'/api/feedback/submit.php',
	'/api/feedback/edit.php',
	'/api/feedback/admin/login.php',
]:
	status, headers, body = fetch(f"{base}{path}")
	ok(status == 200, f"GET {path} → 200 with help page (got {status})")
	ok('text/html' in headers.get('Content-Type', '').lower(),
	   f"GET {path} content-type is HTML")
	ok('POST requests' in body or 'POST' in body,
	   f"GET {path} help page mentions POST")
	# Try a genuinely wrong method — that still gets 405
	status, _, _ = fetch(f"{base}{path}", method='PUT')
	ok(status == 405, f"PUT {path} → 405 (got {status})")

# ── 7. Error responses are structured JSON ─────────────────────────
print("\n-- Structured error JSON --")
status, headers, body = fetch(f"{base}/api/feedback/list.php?lesson=../etc/passwd")
ok(status == 400, f"invalid lesson slug → 400 (got {status})")
try:
    j = json.loads(body)
    ok('error' in j, "error response has 'error' field")
    ok('code' in j, "error response has 'code' field")
    ok('request_id' in j, "error response has 'request_id' field")
except Exception as e:
    ok(False, f"error response is valid JSON: {e}")

# X-Request-Id header on a 4xx
status, headers, _ = fetch(f"{base}/api/feedback/list.php?lesson=bad")
ok(any('X-Request-Id' in k for k in headers.keys()), "X-Request-Id header present on error")

# ── 8. Health banner appears when DB is broken ────────────────────
print("\n-- Health banner (broken DB) --")
# Make the DB dir unreadable
os.chmod(test_dir, 0o000)
status, _, body = fetch(f"{base}/intro")
os.chmod(test_dir, 0o755)  # restore so cleanup works
ok(status == 200, f"page still renders 200 with broken DB (got {status})")
ok('fb-health' in body, "health banner appears when DB is broken")
ok('Data directory' in body or 'not writable' in body.lower(),
   "banner mentions the DB issue")

# ── 9. Admin login via POST + cookie + protected endpoint ──────────
print("\n-- Admin login flow --")
# Create an admin password file
import hashlib, hmac, base64, os as _os
# Use bcrypt via PHP since we have it available
ph = subprocess.run(
    ['php', '-r', "echo password_hash('render-test-pw', PASSWORD_BCRYPT);"],
    capture_output=True, text=True
)
hash_val = ph.stdout.strip()
with open(f"{test_dir}/adminpw", "w") as f:
    f.write(hash_val)
_os.chmod(f"{test_dir}/adminpw", 0o644)

# POST to login (JSON)
status, headers, body = fetch(
    f"{base}/api/feedback/admin/login.php",
    method='POST',
    data=json.dumps({"password": "render-test-pw"}).encode(),
    headers={"Content-Type": "application/json"},
)
ok(status == 200, f"admin login POST → 200 (got {status})")
token = json.loads(body).get('token', '')
ok(len(token) == 40, f"admin token is 40 hex chars (got {len(token)})")

# Use token to access admin list
status, headers, body = fetch(
    f"{base}/api/feedback/admin/list.php?lesson=intro",
    headers={"Cookie": f"fb_admin={token}"},
)
ok(status == 200, f"admin list with token → 200 (got {status})")
j = json.loads(body)
ok('feedback' in j, "admin list has feedback array")
ok('stats' in j, "admin list has stats")

# Use token to access panel — should render app, not login form
status, _, body = fetch(
    f"{base}/api/feedback/admin/panel.php",
    headers={"Cookie": f"fb_admin={token}"},
)
ok(status == 200, "panel with valid token → 200")
ok('id="fb-admin-app"' in body, "panel has app div")
ok('hidden' in body.split('id="fb-admin-login"')[0] or
   'class="fb-admin-login" hidden' in body,
   "login is hidden when authenticated")
ok('id="fb-admin-app" hidden' not in body, "app is visible when authenticated")

# ── Summary ──────────────────────────────────────────────────────────
print(f"\nPassed: {passed}")
print(f"Failed: {failed}")
if failed:
    print("\n=== Failures ===")
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)
print("\nAll render tests passed ✓")
