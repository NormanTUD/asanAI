"use strict";

function parse_job_name (name) {
	if (name === "smoke-tests") {
		return { os: "ubuntu-latest", browser: "static checks", mode: "—" };
	}

	if (name.startsWith("playwright (")) {
		return { os: name.slice("playwright (".length, -1), browser: "chromium + firefox", mode: "full" };
	}

	const parts = name.split(" / ");
	if (parts.length === 3) {
		return { os: parts[1], browser: parts[0], mode: parts[2] };
	}

	return { os: "—", browser: name, mode: "—" };
}

function format_duration (started_at, completed_at) {
	if (!started_at) return "—";

	const start = Date.parse(started_at);
	const end = completed_at ? Date.parse(completed_at) : Date.now();

	if (!isFinite(start) || !isFinite(end) || end < start) return "—";

	const seconds = Math.round((end - start) / 1000);
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const rest = seconds % 60;

	if (hours > 0) {
		return hours + ":" + String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
	}

	return minutes + ":" + String(rest).padStart(2, "0");
}

function format_status (status) {
	const text = String(status || "unknown").replace(/_/g, " ");
	return text.charAt(0).toUpperCase() + text.slice(1);
}

function os_rank (os) {
	if (os.startsWith("ubuntu")) return 0;
	if (os.startsWith("windows")) return 1;
	if (os.startsWith("macos")) return 2;
	return 3;
}

function build_summary (jobs, run) {
	const rows = jobs
		.filter(function (job) {
			return job.name !== "cancel-on-failure" && job.name !== "run-summary" && job.name !== "tag-version";
		})
		.map(function (job) {
			const parsed = parse_job_name(job.name);

			return {
				os: parsed.os,
				browser: parsed.browser,
				mode: parsed.mode,
				status: format_status(job.conclusion || job.status),
				duration: format_duration(job.started_at, job.completed_at),
				url: job.html_url
			};
		});

	rows.sort(function (a, b) {
		return os_rank(a.os) - os_rank(b.os) || a.os.localeCompare(b.os) || a.browser.localeCompare(b.browser);
	});

	const lines = ["## Job timings", ""];

	if (run && run.html_url) {
		const label = run.head_sha ? run.head_sha.slice(0, 8) : String(run.id);
		lines.push("Run: [" + label + "](" + run.html_url + ")");
		lines.push("");
	}

	lines.push("| OS | Browser | Mode | Status | Duration |");
	lines.push("| --- | --- | --- | --- | ---: |");

	rows.forEach(function (row) {
		const browser = row.url ? "[" + row.browser + "](" + row.url + ")" : row.browser;
		lines.push("| " + row.os + " | " + browser + " | " + row.mode + " | " + row.status + " | " + row.duration + " |");
	});

	const starts = jobs.map(function (job) { return Date.parse(job.started_at); }).filter(isFinite);
	const ends = jobs.map(function (job) {
		return job.completed_at ? Date.parse(job.completed_at) : Date.now();
	}).filter(isFinite);

	if (starts.length && ends.length) {
		lines.push("");
		lines.push("**Wall time:** " + format_duration(new Date(Math.min.apply(null, starts)).toISOString(), new Date(Math.max.apply(null, ends)).toISOString()));
	}

	return lines.join("\n") + "\n";
}

async function write_run_summary ({ github, context, core }) {
	const { data } = await github.rest.actions.listJobsForWorkflowRun({
		owner: context.repo.owner,
		repo: context.repo.repo,
		run_id: context.runId,
		per_page: 100
	});

	const run = {
		id: context.runId,
		head_sha: context.sha,
		html_url: (process.env.GITHUB_SERVER_URL || context.serverUrl || "https://github.com") + "/" + context.repo.owner + "/" + context.repo.repo + "/actions/runs/" + context.runId
	};

	await core.summary.addRaw(build_summary(data.jobs, run)).write();
}

module.exports = { parse_job_name, format_duration, format_status, build_summary, write_run_summary };
