// Loader for "Statistics II — Inference and Information".
//
// All interactive lab implementations live in statistics.js. statistics_i.php
// loads it via <script src="statistics.js"></script> on the combined course
// page; when this chapter is opened standalone, statistics.js is injected on
// demand. Only one statistics.js instance is ever evaluated (guarded by
// window.__statisticsModuleLoaded), and a single loadStatisticsModule() call
// lazily registers every lab present in the page.

async function loadStatisticsIIModule() {
	if (typeof updateLoadingStatus === 'function') {
		updateLoadingStatus("Loading section about Statistics II...");
	}

	await _statEnsureStatisticsJs();

	if (window.__statisticsModuleLoaded) return Promise.resolve();
	window.__statisticsModuleLoaded = true;

	await loadStatisticsModule();
	return Promise.resolve();
}

async function _statEnsureStatisticsJs() {
	if (typeof loadStatisticsModule === 'function') return;
	await new Promise((resolve) => {
		const script = document.createElement('script');
		script.src = 'statistics.js';
		script.onload = () => resolve();
		script.onerror = () => resolve();
		document.head.appendChild(script);
	});
}
