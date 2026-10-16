"use strict";

/* ═══════════════════════════════════════════════════════════════════
   BlogFeedbackAdmin — admin panel logic
   ═══════════════════════════════════════════════════════════════════ */

(function () {
	// Two base paths: FEEDBACK_API for public endpoints (list.php etc.)
	// and ADMIN_API for admin-only endpoints (login, list, update, apply).
	const here = location.pathname;
	const m = here.match(/^(.*?\/api\/feedback)/);
	const FEEDBACK_API = m ? m[1] : '/blog/api/feedback';
	const ADMIN_API    = FEEDBACK_API + '/admin';
	// Backwards-compat aliases for the rest of the file.
	const API_BASE     = ADMIN_API;
	const PUB_API      = FEEDBACK_API;

	const state = {
		data: null,
		filters: { status: '', category: '', approved: '', lesson: '', q: '', sort: 'new' },
	};

	const $  = (s, r) => (r || document).querySelector(s);
	const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
	const escHtml = s => String(s == null ? '' : s)
		.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	const escAttr = s => escHtml(s);
	const relTime = iso => {
		if (!iso) return '';
		const t = new Date(iso.replace(' ', 'T') + 'Z').getTime();
		if (isNaN(t)) return '';
		const s = Math.round((Date.now() - t) / 1000);
		if (s < 60)     return 'just now';
		if (s < 3600)   return Math.round(s / 60) + 'm ago';
		if (s < 86400)  return Math.round(s / 3600) + 'h ago';
		if (s < 2592000) return Math.round(s / 86400) + 'd ago';
		const d = new Date(t);
		return d.toISOString().slice(0, 10);
	};

function login(password) {
	return fetch(PUB_API.replace(/\/admin$/, '') + '/admin/login.php', {
		method: 'POST', credentials: 'same-origin',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({ password }),
	}).then(r => {
		const ct = r.headers.get('Content-Type') || '';
		if (!ct.includes('application/json')) {
			return r.text().then(t => ({ ok: false, j: { error: 'Server returned non-JSON: ' + t.slice(0, 100) } }));
		}
		return r.json().then(j => ({ ok: r.ok, j }));
	}).catch(e => ({
		ok: false,
		j: { error: 'Network error: ' + (e.message || e) + ' — try a hard reload (Ctrl+Shift+R).' }
	}));
}

	/* ─────────────────────────────────────────────────────────────────
	   Network helpers — every response is parsed safely, so an empty
	   body or non-JSON never crashes the admin with a SyntaxError.
	   ───────────────────────────────────────────────────────────────── */
	async function safeJson(r) {
		const text = await r.text();
		if (!text) return { ok: r.ok, status: r.status, j: null, empty: true };
		const ct = (r.headers.get('Content-Type') || '').toLowerCase();
		if (ct.indexOf('application/json') < 0) {
			return { ok: r.ok, status: r.status, j: null,
				error: 'Server returned non-JSON (status ' + r.status + '): ' + text.slice(0, 200) };
		}
		try { return { ok: r.ok, status: r.status, j: JSON.parse(text) }; }
		catch (_) {
			return { ok: r.ok, status: r.status, j: null,
				error: 'Server returned invalid JSON: ' + text.slice(0, 200) };
		}
	}

	function loadList() {
		const f = state.filters;
		const q = new URLSearchParams();
		if (f.status)   q.set('status', f.status);
		if (f.category) q.set('category', f.category);
		if (f.approved) q.set('approved', f.approved);
		if (f.lesson)   q.set('lesson', f.lesson);
		if (f.q)        q.set('q', f.q);
		if (f.sort)     q.set('sort', f.sort);
		return fetch(API_BASE + '/list.php?' + q.toString(), { credentials: 'same-origin' })
			.then(safeJson)
			.then(({ ok, status, j, error }) => {
				if (error || !ok) {
					console.error('[loadList] failed:', error || ('HTTP ' + status));
					showError(error || ('HTTP ' + status));
					return;
				}
				state.data = j;
				render();
			});
	}

	function showError(msg) {
		const wrap = $('#fb-admin-list');
		if (!wrap) { alert('Feedback admin error: ' + msg); return; }
		wrap.innerHTML = '<div class="fb-admin-error">' +
			'<strong>⚠ Could not load admin data.</strong><br>' +
			escHtml(msg) + '<br>' +
			'<small>Check the browser dev-tools network tab for the failing request.</small>' +
			'</div>';
	}

	/* Network helpers (safeJson, adminAction, adminApply) live at the top
	   of this IIFE so every helper below can use them. */

	function adminAction(action, id, extra) {
		return fetch(API_BASE + '/update.php', {
			method: 'POST', credentials: 'same-origin',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(Object.assign({ action, id }, extra || {})),
		}).then(safeJson).then(({ ok, status, j, error }) => {
			if (error) {
				console.error('[adminAction]', action, id, 'failed:', error);
				return { ok: false, error, status };
			}
			if (!ok) {
				const msg = (j && j.error) ? j.error : ('HTTP ' + status);
				console.error('[adminAction]', action, id, 'rejected:', msg);
				return { ok: false, error: msg, status, j };
			}
			return { ok: true, j, status };
		});
	}

	function adminApply(id) {
		return fetch(API_BASE + '/apply.php', {
			method: 'POST', credentials: 'same-origin',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({ id }),
		}).then(safeJson).then(({ ok, status, j, error }) => {
			if (error) return { ok: false, error, status };
			if (!ok)   return { ok: false, error: (j && j.error) || ('HTTP ' + status), status, j };
			return { ok: true, j, status };
		});
	}

	function render() {
		if (!state.data) return;
		const s = state.data.stats || {};
		const stats = $('#fb-admin-stats');
		stats.innerHTML = [
			'<span class="fb-stat">total ' + (s.total || 0) + '</span>',
			'<span class="fb-stat is-pending">pending ' + (s.pending || 0) + '</span>',
			'<span class="fb-stat is-open">open ' + (s.open || 0) + '</span>',
			'<span class="fb-stat">progress ' + (s.in_progress || 0) + '</span>',
			'<span class="fb-stat is-resolved">resolved ' + (s.resolved || 0) + '</span>',
			'<span class="fb-stat">wontfix ' + (s.wontfix || 0) + '</span>',
			'<span class="fb-stat">git ' + escHtml(((state.data.git || {}).commit || '').slice(0, 7)) + '</span>',
		].join('');

		const ahaOl = $('#fb-aha-list');
		if (!state.data.top_aha.length) {
			ahaOl.innerHTML = `
				<li class="fb-side-empty">
					<div class="fb-side-empty-icon">★</div>
					<div class="fb-side-empty-text">
						<b>No aha marks yet</b>
						<small>Visitors in bug mode can click <b>★ Aha</b> on any passage they found illuminating.</small>
					</div>
				</li>`;
		} else {
			ahaOl.innerHTML = state.data.top_aha.map(a => {
				const txt = (a.anchor_prefix ? '…' + escHtml(a.anchor_prefix.slice(-30)) : '')
					+ ' <b>' + escHtml((a.anchor_quote || '').slice(0, 60)) + '</b> '
					+ (a.anchor_suffix ? escHtml(a.anchor_suffix.slice(0, 30)) + '…' : '');
				return '<li data-lesson="' + escAttr(a.lesson_slug) + '" data-quote="' + escAttr(a.quote || '') + '">'
					+ '<span class="fb-aha-c">' + (a.total || 0) + '</span> '
					+ txt + ' · <i>' + escHtml(a.lesson_slug) + '</i></li>';
			}).join('');
			ahaOl.querySelectorAll('li[data-quote]').forEach(li => {
				li.addEventListener('click', () => {
					const lesson = li.dataset.lesson;
					if (lesson) {
						// Open the lesson in a new tab using a path that works
						// under any mountpoint (the .htaccess at the docroot
						// rewrites /blog/... to /asanai/blog/... if needed).
						const base = (window.location.pathname.indexOf('/blog/') >= 0 ? '/blog/' : '/asanai/blog/');
						window.open(base + lesson, '_blank');
					}
				});
			});
		}

		const lessonOl = $('#fb-lesson-list');
		if (!state.data.by_lesson.length) {
			lessonOl.innerHTML = `
				<li class="fb-side-empty">
					<div class="fb-side-empty-icon">🐛</div>
					<div class="fb-side-empty-text">
						<b>No feedback yet</b>
						<small>Visitors can submit feedback via the 🐛 button on every lesson page.</small>
					</div>
				</li>`;
		} else {
			lessonOl.innerHTML = state.data.by_lesson.map(l => {
				return '<li data-lesson="' + escAttr(l.lesson_slug) + '">'
					+ '<b>' + escHtml(l.lesson_slug) + '</b> · ' + (l.c || 0) + ' total, '
					+ (l.pending_c || 0) + ' pending, '
					+ (l.open_c || 0) + ' open'
					+ ' <span style="opacity:0.5">· last ' + escHtml((l.last_at || '').slice(0, 10)) + '</span></li>';
			}).join('');
			lessonOl.querySelectorAll('li').forEach(li => {
				li.addEventListener('click', () => {
					$('#fb-f-lesson').value = li.dataset.lesson;
					state.filters.lesson = li.dataset.lesson;
					loadList();
				});
			});
		}

		const list = $('#fb-admin-list');
		if (!state.data.feedback.length) {
			list.innerHTML = '<div class="fb-empty">No feedback matches your filters.</div>';
			return;
		}
		list.innerHTML = state.data.feedback.map(it => renderItem(it)).join('');
		bindItemEvents(list);
	}

	function renderItem(it) {
		const pending = !it.approved;
		const cls = ['fb-item'];
		if (pending)            cls.push('is-pending');
		if (it.status === 'resolved') cls.push('is-resolved');
		if (it.status === 'wontfix')  cls.push('is-wontfix');
		if (it.anchor.status === 'orphan') cls.push('is-orphan');

		const quote = it.anchor.quote ? `<div class="fb-item-quote">"${escHtml(it.anchor.quote.slice(0, 320))}"</div>` : '';
		const sug = (it.anchor_type === 'suggestion' && it.suggestion_original) ? `
			<div class="fb-item-suggestion">
				<div class="fb-item-suggestion-old">${escHtml(it.suggestion_original.slice(0, 320))}</div>
				<div class="fb-item-suggestion-new">${escHtml((it.suggestion_replacement || '').slice(0, 320))}</div>
			</div>` : '';
		const author = `
			<div class="fb-item-author">
				<span><b>handle:</b> ${it.author_handle ? escHtml(it.author_handle) : '<i>anonymous</i>'}</span>
				${it.author_email ? `<span><b>email:</b> <a href="mailto:${escAttr(it.author_email)}">${escHtml(it.author_email)}</a></span>` : ''}
				<span><b>lesson:</b> <a href="../${escAttr(it.lesson)}" target="_blank">${escHtml(it.lesson)}</a></span>
				<span><b>git:</b> ${escHtml(((it.git_commit || '').slice(0, 7)) || 'n/a')}${it.git_commit ? ` <a href="${ADMIN_API}/at_commit.php?id=${it.id}" target="_blank" class="fb-at-commit" title="See original anchor context at this commit">🔍 at-commit</a>` : ''}</span>
				<span><b>anchor:</b> ${escHtml(it.anchor.status)} (${(it.anchor.confidence * 100).toFixed(0)}%)</span>
				${it.page_url ? `<span><b>page:</b> ${escHtml((it.page_url || '').slice(0, 60))}</span>` : ''}
			</div>`;
		const comments = (it.comments || []).map(c => `
			<div class="fb-comment ${c.is_admin ? 'is-admin' : ''} ${c.is_resolve ? 'is-resolve' : ''}">
				<span class="fb-c-author">${escHtml(c.handle || (c.is_admin ? 'admin' : 'user'))}</span>
				<span class="fb-c-meta">${escHtml(relTime(c.created_at))}</span>
				<span class="fb-c-body">${escHtml(c.body)}</span>
			</div>`).join('');
		const voteBadge = (it.upvotes || it.downvotes)
			? `<div class="fb-item-votes"><span>▲ ${it.upvotes || 0}</span><span>▼ ${it.downvotes || 0}</span><span>★ ${it.aha_count || 0}</span></div>`
			: '';

		const actions = [];
		if (!it.approved)         actions.push(`<button data-act="approve">✓ Approve</button>`);
		if (it.approved)          actions.push(`<button data-act="unapprove">Hide</button>`);
		if (it.status !== 'in_progress') actions.push(`<button data-act="status" data-status="in_progress">→ In progress</button>`);
		if (it.status !== 'resolved')    actions.push(`<button class="success" data-act="resolve">✓ Resolve</button>`);
		if (it.status === 'resolved')    actions.push(`<button data-act="unresolve">↺ Reopen</button>`);
		if (it.status !== 'wontfix')     actions.push(`<button data-act="status" data-status="wontfix">✗ Won't fix</button>`);
		if (it.status !== 'spam')        actions.push(`<button data-act="status" data-status="spam" title="Soft-delete: hide from public but keep in DB for audit">🚫 Spam</button>`);
		if (it.status === 'spam')        actions.push(`<button data-act="status" data-status="open" title="Restore to public view">↺ Unspam</button>`);
		if (it.anchor_type === 'suggestion' && it.suggestion_original && it.suggestion_replacement) {
			actions.push(`<button class="primary" data-act="apply">⚙ Copy as patch</button>`);
		}
		actions.push(`<button class="danger" data-act="delete" data-confirm="1" title="Hard-delete: removes this item from the database. There is no undo.">🗑 Delete…</button>`);

		return `
			<div class="${cls.join(' ')}" data-id="${it.id}">
				<div class="fb-item-head">
					<span class="fb-item-cat" data-cat="${escAttr(it.category)}">${escHtml(it.category)}</span>
					<span class="fb-item-status" data-status="${escAttr(it.status)}">${escHtml(it.status)}${pending ? ' · pending' : ''}</span>
					<span class="fb-item-meta">#${it.id} · ${escHtml(relTime(it.created_at))} · ${(it.anchor_type || 'text')}</span>
				</div>
				${quote}
				${sug}
				<div class="fb-item-body">${escHtml(it.body)}</div>
				${voteBadge}
				${author}
				<div class="fb-item-actions">${actions.join('')}</div>
				<div class="fb-comments">
					${comments}
					<form class="fb-comment-form">
						<input type="text" placeholder="Reply (visible to all readers)…">
						<button type="submit">Reply</button>
					</form>
				</div>
			</div>`;
	}

	function bindItemEvents(root) {
		root.querySelectorAll('.fb-item').forEach(item => {
			const id = +item.dataset.id;
			item.querySelectorAll('[data-act]').forEach(btn => {
				btn.addEventListener('click', e => {
					e.preventDefault();
					const act = btn.dataset.act;
					const stat = btn.dataset.status;
					// Inline two-click confirmation for destructive actions.
					// First click: button labels itself "Click again to confirm"
					// within a 4-second window. Second click fires.
					if (btn.dataset.confirm === '1' && btn.dataset.armed !== '1') {
						armForConfirm(btn);
						return;
					}
					if (act === 'resolve') {
						const note = prompt('Resolution note (optional, shown publicly):', '');
						if (note === null) return;
						adminAction('resolve', id, { status_note: note }).then(loadList);
					} else if (act === 'apply') {
						adminApply(id).then(j => {
							if (!j.ok) { alert(j.error || 'Patch generation failed.'); return; }
							showPatchModal(j);
						}).catch(e => alert('Network error: ' + e.message));
					} else if (act === 'delete') {
						adminAction('delete', id).then(res => {
							if (!res.ok) {
								alert('Delete failed: ' + (res.error || ('HTTP ' + res.status)));
								return;
							}
							loadList();
						});
					} else if (act === 'status') {
						adminAction('status', id, { status: stat }).then(loadList);
					} else {
						adminAction(act, id).then(loadList);
					}
				});
			});
			const form = item.querySelector('.fb-comment-form');
			form.addEventListener('submit', e => {
				e.preventDefault();
				const body = form.querySelector('input').value.trim();
				if (!body) return;
				form.querySelector('input').value = '';
				adminAction('reply', id, { body }).then(loadList);
			});
		});
	}

	/* Inline two-click confirm. First click labels the button "Click again
	   to confirm" within a 4-second window. Second click fires; timeout
	   reverts the label. This is faster + less jarring than a modal
	   confirm() and impossible to fat-finger through. */
	const ARM_TIMEOUT = 4000;
	function armForConfirm(btn) {
		const original = btn.dataset.originalLabel || btn.textContent;
		btn.dataset.originalLabel = original;
		btn.dataset.armed = '1';
		btn.classList.add('is-armed');
		btn.textContent = '⚠ Click again to ' + original.replace(/^[^\w]+/, '');
		clearTimeout(btn._armTimer);
		btn._armTimer = setTimeout(() => {
			btn.classList.remove('is-armed');
			btn.dataset.armed = '';
			btn.textContent = original;
		}, ARM_TIMEOUT);
	}

	function showPatchModal(j) {
		const modal = document.createElement('div');
		modal.className = 'fb-patch-modal';
		modal.innerHTML = `
			<div class="fb-patch-inner">
				<h2>Patch for ${escHtml(j.lesson)} / ${escHtml(j.file)}</h2>
				${j.matches > 1 ? `<p class="fb-patch-warn">⚠ Original text appears ${j.matches} times — patch applies to ALL of them. Review carefully before running <code>git apply</code>.</p>` : ''}
				<p style="font-size:12px;color:var(--fb-a-text-2);margin:0 0 6px">
					Patches are also saved to <code>feedback_data/patches/${escHtml(j.patch_file)}</code>.
					Apply with:<br>
					<code style="display:block;margin-top:4px;padding:6px 10px;background:var(--fb-a-bg);border-radius:4px">cd /home/norman/websites/asanai &amp;&amp; git apply blog/feedback_data/patches/${escHtml(j.patch_file)}</code>
				</p>
				<pre>${escHtml(j.patch)}</pre>
				<div class="fb-patch-actions">
					<button id="fb-patch-copy">📋 Copy</button>
					<button id="fb-patch-download">⬇ Download .patch</button>
					<button class="primary" id="fb-patch-close">Close</button>
				</div>
			</div>`;
		document.body.appendChild(modal);
		modal.querySelector('#fb-patch-close').addEventListener('click', () => modal.remove());
		modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
		modal.querySelector('#fb-patch-copy').addEventListener('click', () => {
			navigator.clipboard.writeText(j.patch).then(() => {
				modal.querySelector('#fb-patch-copy').textContent = '✓ Copied!';
				setTimeout(() => { modal.querySelector('#fb-patch-copy').textContent = '📋 Copy'; }, 1500);
			}).catch(() => alert('Copy failed — please select manually.'));
		});
		modal.querySelector('#fb-patch-download').addEventListener('click', () => {
			const blob = new Blob([j.patch], { type: 'text/x-diff' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = j.patch_file;
			a.click();
			URL.revokeObjectURL(url);
		});
	}

	function exportJSON() {
		if (!state.data) return;
		const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'feedback-export-' + new Date().toISOString().slice(0, 10) + '.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	function bindFilters() {
		$('#fb-f-apply').addEventListener('click', () => {
			state.filters = {
				status:   $('#fb-f-status').value,
				category: $('#fb-f-cat').value,
				approved: $('#fb-f-approved').value,
				lesson:   $('#fb-f-lesson').value.trim(),
				q:        $('#fb-f-q').value.trim(),
				sort:     $('#fb-f-sort').value,
			};
			loadList();
		});
		$$('.fb-admin-filters input, .fb-admin-filters select').forEach(el => {
			el.addEventListener('keydown', e => {
				if (e.key === 'Enter') { e.preventDefault(); $('#fb-f-apply').click(); }
			});
		});
		$('#fb-export').addEventListener('click', exportJSON);
		$('#fb-logout').addEventListener('click', () => {
			fetch(PUB_API + '/admin/logout.php', { method: 'POST', credentials: 'same-origin' })
				.then(() => location.reload());
		});
	}

	function bindLogin() {
		const form = $('#fb-login-form');
		form.addEventListener('submit', e => {
			e.preventDefault();
			const pw = $('#fb-login-form input').value;
			$('#fb-login-err').hidden = true;
			const btn = form.querySelector('button');
			if (btn) btn.disabled = true;
			login(pw).then(({ ok, j }) => {
				if (btn) btn.disabled = false;
				if (ok) {
					// Reload so server-side rendering picks up the new cookie.
					// Falls back to JS-only switch if reload is blocked.
					try {
						location.reload();
					} catch (_) {
						$('#fb-admin-login').hidden = true;
						$('#fb-admin-app').hidden = false;
						bindFilters();
						loadList();
					}
				} else {
					showLoginError(j);
				}
			});
		});
	}

	function showLoginError(j) {
		const err = $('#fb-login-err');
		const messages = {
			1: 'Wrong password. Try again, or set up a new password below.',
			2: 'Please enter a password.',
			3: 'Admin password file is missing. Run the setup command below.',
			4: 'Admin password file is not readable by the web server. Run the chmod command below.',
			5: 'Admin password file is empty. Run the setup command below.',
		};
		const code = j && j.code ? j.code : 1;
		const title = messages[code] || (j && j.error) || 'Login failed.';
		if (j && j.install_command) {
			err.innerHTML = '<b>' + escHtml(j.error || title) + '</b><br><br><b>Setup:</b><br><pre style="margin-top:6px">' + escHtml(j.install_command) + '</pre>' + (j.note ? '<br><small>' + escHtml(j.note) + '</small>' : '');
			err.style.maxHeight = '420px';
		} else {
			err.innerHTML = '<b>' + escHtml(title) + '</b>';
			err.style.maxHeight = '';
		}
		err.hidden = false;
	}

	function init() {
		bindLogin();
		fetch(API_BASE + '/list.php', { credentials: 'same-origin' })
			.then(r => {
				if (r.status === 401) return null;
				return r.json();
			})
			.then(j => {
				if (j) {
					$('#fb-admin-login').hidden = true;
					$('#fb-admin-app').hidden = false;
					state.data = j;
					bindFilters();
					render();
				}
			})
			.catch(() => {});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
