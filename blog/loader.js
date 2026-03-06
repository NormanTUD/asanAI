async function loader_fn () {
	try {
		const loaders = window.__moduleLoaderQueue || [];
		const names = window.__moduleLoaderNames || [];

		registerLoaderSections(names);

		await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

		// Tight loop — no yields, no setTimeout, maximum speed
		for (let i = 0; i < loaders.length; i++) {
			if (typeof loaders[i] !== 'function') continue;
			try {
				const result = loaders[i]();
				if (result && typeof result.then === 'function') {
					await result;
				}
			} catch (err) {
				console.error(`Module loader ${i} (${names[i]}) failed:`, err);
			}
			markLoaderSection(i, 'done');
		}

		updateLoadingStatus(`Loaded ${loaders.length}/${loaders.length} modules.`);
		finalizeLoaderChecklist();

		_modulesLoaded = true;
		runPostLoad();

	} catch (error) {
		console.error("Module loading failed:", error);
		updateLoadingStatus(`Error loading modules. ${error}`);
	}
}
