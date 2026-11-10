/* Node smoke test for quests.js — the XP economy and the Flow Surge.
 * Run with:  node tests/quests_test.js
 *
 * Verifies:
 *   • the public XP API still awards once per key (no double-counting)
 *   • demo engagement fills the Flow meter and lights a booster at the goal
 *   • the booster doubles XP while it burns and expires afterwards
 *   • a refill can light a second surge; the surge count is persisted
 *   • feeding while a surge is active is a no-op (no infinite stacking)
 */

'use strict';

global.window = global;

const store = {};
global.localStorage = {
	getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
	setItem: function (k, v) { store[k] = String(v); },
	removeItem: function (k) { delete store[k]; }
};

global.CustomEvent = function (name, init) { this.type = name; this.detail = init && init.detail; };
global.dispatchEvent = function () {};
global.addEventListener = function () {};

global.document = {
	readyState: 'loading',             // keeps start() off the load path
	hidden: false,
	body: null,                        // buildUI() bails out: no visual DOM needed
	documentElement: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
	getElementById: function () { return null; },
	addEventListener: function () {},
	dispatchEvent: function () {}
};

global.requestAnimationFrame = function (cb) { cb(0); return 0; };
global.cancelAnimationFrame = function () {};
global.performance = { now: function () { return Date.now(); } };

// The module queues a 4 s "intro quiet" timer, a 60 ms save debounce and a
// 320 ms award-replay poll. Run only the save debounce so the test exits
// promptly and no replay loop keeps Node alive.
const realSetTimeout = global.setTimeout;
global.setTimeout = function (fn, ms) {
	if (ms >= 300) return 0;
	return realSetTimeout(fn, ms);
};

require('../modules/quests.js');

var pass = 0, fail = 0;
function check(cond, msg) {
	if (cond) { pass++; }
	else { fail++; console.log('  FAIL: ' + msg); }
}
function xpOf() { return Q.summary().xp; }

const Q = global.window.MNQuest;
check(typeof Q === 'object', 'MNQuest is exposed');
check(typeof Q.xp === 'function', 'xp() is a function');
check(typeof Q.flow === 'function', 'flow() is a function');
check(typeof Q.feedFlow === 'function', 'feedFlow() is a function');

/* ── base economy unchanged ─────────────────────────────────── */
check(Q.flow().progress === 0, 'a fresh flow meter starts empty');
check(Q.flow().active === false, 'a fresh flow meter is inactive');
check(Q.flow().mult === 1, 'no multiplier without a surge');

check(Q.xp(10, '· test award') === true, 'xp() awards once');
check(xpOf() === 10, 'base award adds exactly 10 XP (got ' + xpOf() + ')');
check(Q.xp(10, '· same key', 'unit-key') === true, 'a keyed award succeeds the first time');
check(Q.xp(10, '· same key', 'unit-key') === false, 'a keyed award never fires twice');
check(xpOf() === 20, 'the duplicate key added nothing (got ' + xpOf() + ')');

/* ── flow meter ─────────────────────────────────────────────── */
let f = Q.feedFlow(20);
check(f.progress === 20 && f.active === false, 'feedFlow adds progress but does not pre-fire (got ' + f.progress + ')');
f = Q.feedFlow(20);
check(f.active === true, 'reaching the goal lights the surge');
check(f.progress === 0, 'the meter resets when the surge starts');
check(f.mult === 2, 'the surge doubles XP');
check(f.total === 1, 'one surge is recorded');
check(f.remaining > 0 && f.remaining <= 120000, 'the surge has a positive countdown');

/* ── multiplier while active ────────────────────────────────── */
check(Q.xp(10, '· boosted award') === true, 'award during a surge succeeds');
check(xpOf() === 40, 'a 10 XP award is doubled to 20 (got ' + xpOf() + ')');

check(Q.xp(5, '· boosted key', 'surge-key') === true, 'a keyed award during a surge succeeds');
check(xpOf() === 50, 'the keyed 5 XP award is doubled to 10 (got ' + xpOf() + ')');
check(Q.xp(5, '· boosted key', 'surge-key') === false, 'the key still prevents a second award');
check(xpOf() === 50, 'the blocked key added nothing (got ' + xpOf() + ')');

/* ── feeding while active never stacks ──────────────────────── */
f = Q.feedFlow(30);
check(f.active === true && f.progress === 0, 'feeding during a surge is a no-op');
check(f.total === 1, 'feeding during a surge does not add another surge');

/* ── expiry ─────────────────────────────────────────────────── */
const realNow = Date.now;
Date.now = function () { return realNow() + 10 * 60 * 1000; };
check(Q.flow().active === false, 'the surge expires after its two minutes');
check(Q.xp(10, '· after the surge') === true, 'awards keep working after the surge');
check(xpOf() === 60, 'an expired surge no longer doubles XP (got ' + xpOf() + ')');

/* ── a second surge and persistence (clock stays in the future so the
      first surge really is over) ─────────────────────────────── */
f = Q.feedFlow(30);
check(f.active === true && f.total === 2, 'a refilled meter lights a second surge');

realSetTimeout(function () {
	Date.now = realNow;
	const saved = JSON.parse(store.mn_quest_v1 || '{}');
	check(saved.xp === 60, 'XP is persisted (got ' + saved.xp + ')');
	check(saved.boosts === 2, 'the surge count is persisted (got ' + saved.boosts + ')');
	check(typeof saved.boostUntil === 'number' && saved.boostUntil > 0, 'the surge deadline is persisted');
	check(saved.flow === 0, 'the meter stays empty after a surge');

	console.log(pass + ' passed, ' + fail + ' failed');
	if (fail) process.exit(1);
}, 140);
