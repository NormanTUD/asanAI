# RAG service security notes

Scope: the public `ask.php` proxy, the browser chat (`rag_chat.js`), the local
Python service (`server.py`), and the read-only admin view `/questions`.
This is a threat checklist, not a claim that no bug exists.

## Trust boundaries

- The browser is untrusted. The Python service is bound to `127.0.0.1`; the only
  public entry is `ask.php`.
- `ask.php` is untrusted input → JSON validation → local service.
- The service reads only the committed/generated index and writes only the
  answer cache and query log under `/var/lib/asanai-rag`.
- The model and retrieved passages are not trusted HTML; the browser escapes
  everything it renders.
- The admin uses the same `mnstats` password/session as `/stats`; `/questions`
  is read-only.

## Checklist

| # | Angle | Mitigation |
|---|---|---|
| 1 | SQL injection in cache keys | Parameterized SQLite statements; keys are SHA-256 hashes |
| 2 | SQL injection in query log | Parameterized statements; no user text in SQL |
| 3 | SQL injection in admin filters | Prepared statements for every filter; ranges/page are integers |
| 4 | XSS in model answers | HTML-escaped first; only a small Markdown allowlist |
| 5 | XSS through Markdown links | Only relative/same-origin links; `javascript:`, `data:` and external URLs blocked |
| 6 | XSS through citation/source URLs | Client and admin sanitize source URLs; escaping on every attribute |
| 7 | XSS through error/status text | Fixed messages; user data escaped before insertion |
| 8 | XSS through persisted localStorage | Only structured text/sources are stored and re-escaped on restore |
| 9 | Prototype pollution via `source.id` | Source map uses `Object.create(null)` |
| 10 | Prompt injection in the question | Passages and question are data; no tools/secrets; system rules say ignore instructions |
| 11 | Prompt injection in history | History is folded into plain text, never into message roles |
| 12 | Data exfiltration through the model | No tools, no external network from the worker; only local Ollama |
| 13 | SSRF | Service URL is fixed by env; no user-supplied fetch URLs |
| 14 | Path traversal via job id | Job ids are hex, max 64 chars; unknown ids return 404 |
| 15 | Path traversal via DB/model paths | Paths come from env/install, never from HTTP input |
| 16 | Command injection | The service runs no shell; the builder/install use fixed commands and quoted args |
| 17 | Oversized HTTP body | PHP reads at most 32 KB; service rejects >32 KB |
| 18 | Oversized question | UI `maxlength`, PHP and service both cap at 2000 chars |
| 19 | Oversized/abused history | Last 6 turns, each content capped at 2000 chars |
| 20 | Malformed JSON | JSON decode failure → 400, no exception leak |
| 21 | Non-object JSON / non-string fields | Rejected or normalized before use |
| 22 | Deeply nested JSON | Body cap; decoder failures → 400 |
| 23 | Rate-limit bypass via blocked requests | Blocked requests are rate-limited too |
| 24 | Log flooding | Rate limit + queue cap + 180-day retention |
| 25 | Queue exhaustion | Max 20 pending jobs; overflow → 429 |
| 26 | Connection/slow-client abuse | Service is loopback-only; PHP has connect/response timeouts |
| 27 | ReDoS | All regexes are simple; no nested/ambiguous quantifiers |
| 28 | Memory growth | Rate map pruned at 5,000 IPs; finished jobs cleaned after 1 h |
| 29 | Cache collision abuse | SHA-256 cache keys; only public course answers are cached |
| 30 | SQLite lock/corruption | WAL, busy timeouts, all cache/log errors caught |
| 31 | Q&A database privacy | Outside webroot, `0640`, no IPs or identities, blocked questions redacted |
| 32 | Information leak via `/health` | Public `ask.php?health=1` returns only `{ok: bool}` |
| 33 | Internal errors exposed | Clients see `generation_failed`; details stay in the admin query log |
| 34 | XSS in `/questions` source links | `q_safe_url()` plus HTML escaping |
| 35 | Admin auth/CSRF | Reuses stats session/password; page is read-only (no writes) |
| 36 | Clickjacking | `/questions` sends `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` |
| 37 | CSRF against `/ask` | No credentials are accepted; JSON requests are same-origin; resource use is rate-limited |
| 38 | IP spoofing | PHP uses `REMOTE_ADDR`; `X-Forwarded-For` only when explicitly trusted; service is loopback-only |
| 39 | Accidental public bind | Service warns if `ASANAI_RAG_HOST` is not loopback |
| 40 | Hateful/irrelevant output | Safety pre-filter, strict prompt, redacted log, client-side no HTML execution |
| 41 | Supply chain | Official Ollama installer, PyPI packages, vendored model; no CDN at runtime |
| 42 | Token-limit/hang abuse | 512-token budget, 200 s client job cap, one worker at a time |

## Residual risks

- A 1.5B model can still be prompt-injected into poor *content* (not code or
  data access). It has no tools, secrets or other users' context.
- `fastembed`, `numpy`, Ollama and the model downloads are supply-chain
  dependencies installed by an administrator; pin versions/hashes if that
  matters to you.
- The admin page trusts the administrator's browser and server filesystem.
- The semantic cache can serve a similar answer to a different reader; answers
  are public course text, but extremely sensitive question wording should not be
  used in a public deployment.

## Verify

```bash
curl -sS 'http://127.0.0.1:8090/health' | jq
curl -sS 'http://localhost/asanai/blog/ask.php?health=1' | jq
ls -l /var/lib/asanai-rag
uv run blog/tests/rag_server_test.py
node blog/tests/rag_chat_test.js
```
