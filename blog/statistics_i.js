// Loader for "Statistics I — Distributions and Inference".
//
// All interactive lab implementations live in statistics.js. statistics_i.php
// loads it directly via <script src="statistics.js"></script>; this loader is
// registered by js() into the module loader queue and only re-bootstraps the
// module, so it can run on its own or as part of the combined course page.

async function loadStatisticsIModule() {
	if (typeof updateLoadingStatus === 'function') {
		updateLoadingStatus("Loading section about Statistics I...");
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
