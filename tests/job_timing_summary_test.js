"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const summarize = require("./job_timing_summary.js");

const tmp_dir = fs.mkdtempSync(path.join(os.tmpdir(), "asanai-timing-"));
const valid_path = path.join(tmp_dir, "valid.json");
const broken_path = path.join(tmp_dir, "broken.json");

fs.writeFileSync(valid_path, JSON.stringify([
	{ os: "windows-latest", browser: "firefox", exit_code: 0, duration_seconds: 65, skipped: false },
	{ os: "windows-latest", browser: "chrome", exit_code: 1, duration_seconds: 0, skipped: true }
]), "utf8");
fs.writeFileSync(broken_path, "{not json", "utf8");

assert.strictEqual(summarize.read_timings_file(valid_path).length, 2, "reads a timing array");
assert.strictEqual(summarize.read_timings_file(broken_path), null, "rejects broken JSON");
assert.strictEqual(summarize.read_timings_file(path.join(tmp_dir, "missing.json")), null, "rejects a missing file");
assert.strictEqual(summarize.read_timings_file(""), null, "rejects an empty path");

(async function () {
	let info = null;
	await summarize.write_browser_summary({
		core: {
			info: function (message) { info = message; },
			warning: function (message) { throw new Error(message); },
			summary: { addRaw: function () { return { write: async function () {} }; } }
		},
		os: "windows-latest",
		file: broken_path
	});
	assert.ok(info && info.indexOf("No valid browser timings") !== -1, "reports a missing/invalid timing file");

	let summary = null;
	await summarize.write_browser_summary({
		core: {
			info: function () {},
			warning: function (message) { throw new Error(message); },
			summary: { addRaw: function (text) { return { write: async function () { summary = text; } }; } }
		},
		os: "windows-latest",
		file: valid_path
	});
	assert.ok(summary && summary.indexOf("## Browser timings: windows-latest") !== -1, "writes the summary heading");
	assert.ok(summary.indexOf("| firefox | Success | 1:05 |") !== -1, "writes the firefox row");
	assert.ok(summary.indexOf("| chrome | Skipped | — |") !== -1, "marks skipped browsers");

	let warning = null;
	await summarize.write_browser_summary({
		core: {
			info: function () {},
			warning: function (message) { warning = message; },
			summary: { addRaw: function () { return { write: async function () { throw new Error("summary unavailable"); } }; } }
		},
		os: "windows-latest",
		file: valid_path
	});
	assert.ok(warning && warning.indexOf("summary unavailable") !== -1, "does not throw when writing the summary fails");

	fs.rmSync(tmp_dir, { recursive: true, force: true });
	console.log("job_timing_summary_test: OK");
})().catch(function (error) {
	console.error(error);
	fs.rmSync(tmp_dir, { recursive: true, force: true });
	process.exit(1);
});
