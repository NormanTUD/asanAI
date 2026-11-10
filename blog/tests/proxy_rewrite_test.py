#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests"]
# ///
"""
Regression tests for the blog reverse proxy's URL rewriting.

Pages in subdirectories (for example blog/tenminutes/) use relative URLs such
as `assets/site.js` and `../temml.min.js`. The proxy must resolve those against
the requested page, otherwise it asks the remote server for the wrong path or
produces a target containing `..` that its own validation rejects.

Starts a throw-away remote document root and a proxy server, then checks the
rewritten HTML and fetches the rewritten assets through the proxy.

Usage:
    uv run blog/tests/proxy_rewrite_test.py
"""

from __future__ import annotations

import os
import socket
import subprocess
import tempfile
import time
from pathlib import Path

import requests


ROOT = Path(__file__).resolve().parent.parent
failures = 0
checks = 0


def check(condition: bool, label: str, detail: str = "") -> None:
	global failures, checks
	checks += 1
	if condition:
		print(f"ok   {label}")
		return
	failures += 1
	print(f"FAIL {label}" + (f" — {detail}" if detail else ""))


def free_port() -> int:
	with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
		sock.bind(("127.0.0.1", 0))
		return int(sock.getsockname()[1])


def wait_for(url: str, session: requests.Session, timeout: float = 15.0) -> None:
	deadline = time.time() + timeout
	last = ""
	while time.time() < deadline:
		try:
			response = session.get(url, timeout=5)
			if response.status_code < 500:
				return
			last = f"HTTP {response.status_code}"
		except requests.RequestException as exc:
			last = str(exc)
		time.sleep(0.2)
	raise RuntimeError(f"server not ready: {last}")


def main() -> int:
	with tempfile.TemporaryDirectory(prefix="asanai-proxy-rewrite-") as tmp:
		remote_root = Path(tmp)
		page_dir = remote_root / "blog" / "tenminutes"
		asset_dir = page_dir / "assets"
		asset_dir.mkdir(parents=True)
		(asset_dir / "site.js").write_text("window.__proxyAsset = 'site.js';\n", encoding="utf-8")
		(asset_dir / "site.css").write_text("body { color: #123456; }\n", encoding="utf-8")
		(asset_dir / "abs.js").write_text("window.__proxyAsset = 'abs.js';\n", encoding="utf-8")
		(page_dir / "uri.php").write_text("<?php echo $_SERVER['REQUEST_URI'];", encoding="utf-8")
		(remote_root / "blog" / "temml.min.js").write_text("window.__proxyAsset = 'temml';\n", encoding="utf-8")
		(remote_root / "blog" / "Temml-Local.min.css").write_text(".temml { color: #123456; }\n", encoding="utf-8")

		remote_port = free_port()
		remote_base = f"http://127.0.0.1:{remote_port}/blog/"
		page = f"""<!doctype html>
<html lang="en">
<head>
	<link rel="stylesheet" href="assets/site.css">
	<link rel="stylesheet" href="../Temml-Local.min.css">
</head>
<body>
	<a href="../index.html">up</a>
	<script src="../temml.min.js"></script>
	<script src="assets/site.js?v=7"></script>
	<script src="{remote_base}tenminutes/assets/abs.js"></script>
</body>
</html>
"""
		(page_dir / "page.html").write_text(page, encoding="utf-8")

		proxy_port = free_port()
		proxy_url = f"http://127.0.0.1:{proxy_port}/asanai_blog_proxy.php"
		proxy_env = os.environ.copy()
		proxy_env["ASANAI_BLOG_PROXY_REMOTE"] = remote_base

		remote = subprocess.Popen(
			["php", "-S", f"127.0.0.1:{remote_port}", "-t", str(remote_root)],
			stdout=subprocess.DEVNULL,
			stderr=subprocess.DEVNULL,
		)
		proxy = subprocess.Popen(
			["php", "-S", f"127.0.0.1:{proxy_port}", "-t", str(ROOT)],
			env=proxy_env,
			stdout=subprocess.DEVNULL,
			stderr=subprocess.DEVNULL,
		)
		session = requests.Session()
		try:
			wait_for(f"{proxy_url}?tenminutes/page.html", session)
			page_response = session.get(f"{proxy_url}?tenminutes/page.html", timeout=15)
			check(page_response.status_code == 200, "subdirectory page through proxy", str(page_response.status_code))
			headers = {name.lower(): value for name, value in page_response.headers.items()}
			check("frame-ancestors *" in headers.get("content-security-policy", ""), "proxy allows embedding via CSP")
			check("x-frame-options" not in headers, "proxy drops X-Frame-Options")
			text = page_response.text
			expected = [
				'href="/asanai_blog_proxy.php?tenminutes/assets/site.css"',
				'href="/asanai_blog_proxy.php?Temml-Local.min.css"',
				'src="/asanai_blog_proxy.php?tenminutes/assets/site.js?v=7"',
				'src="/asanai_blog_proxy.php?temml.min.js"',
				'src="/asanai_blog_proxy.php?tenminutes/assets/abs.js"',
				'href="/asanai_blog_proxy.php?index.html"',
			]
			for fragment in expected:
				check(fragment in text, f"rewrote {fragment}", text)
			check("?../" not in text, "no unresolved parent segment in proxy targets")

			for target in ("tenminutes%2Furi.php", "tenminutes%2Furi.php="):
				response = session.get(f"{proxy_url}?{target}", timeout=15)
				text = response.text
				check(
					response.status_code == 200 and "/blog/tenminutes/uri.php" in text
					and "%2f" not in text.lower() and not text.rstrip().endswith("="),
					f"encoded path {target} reaches the decoded remote path",
					f"{response.status_code} {text!r}",
				)

			for asset in (
				"tenminutes/assets/site.js?v=7",
				"tenminutes/assets/site.css",
				"temml.min.js",
				"Temml-Local.min.css",
				"tenminutes/assets/abs.js",
			):
				response = session.get(f"{proxy_url}?{asset}", timeout=15)
				content_type = response.headers.get("content-type", "").lower()
				check(
					response.status_code == 200 and "text/html" not in content_type,
					f"proxied asset {asset.split('?')[0]}",
					f"{response.status_code} {content_type}",
				)
		finally:
			session.close()
			for proc in (proxy, remote):
				proc.terminate()
				try:
					proc.wait(timeout=5)
				except subprocess.TimeoutExpired:
					proc.kill()

	print()
	print(f"{checks} checks, {failures} failure(s)")
	return 0 if failures == 0 else 1


if __name__ == "__main__":
	raise SystemExit(main())
