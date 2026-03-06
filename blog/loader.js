async function loader_fn () {
	try {
		const loaders = window.__moduleLoaderQueue || [];
		const names = window.__moduleLoaderNames || [];

		// Build checklist UI — all items visible as pending immediately
		registerLoaderSections(names);

		// Force a paint so the user sees the full pending checklist
		await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

		let doneCount = 0;
		const total = loaders.length;

		// Wrap each loader in its own async task — they all start on the
		// next microtask, run concurrently, but each yields once before
		// starting so the browser can paint the "loading" indicators.
		const promises = loaders.map((loader, i) => {
			return new Promise(async (resolve) => {
				if (typeof loader !== 'function') {
					markLoaderSection(i, 'done');
					doneCount++;
					updateLoadingStatus(`Loaded ${doneCount}/${total} modules...`);
					resolve();
					return;
				}

				markLoaderSection(i, 'loading');

				// Yield once so the browser can paint this item as "loading"
				await new Promise(r => setTimeout(r, 0));

				try {
					const result = loader();
					if (result && typeof result.then === 'function') {
						await result;
					}
				} catch (err) {
					console.error(`Module loader ${i} (${names[i]}) failed:`, err);
				}

				markLoaderSection(i, 'done');
				doneCount++;
				updateLoadingStatus(`Loaded ${doneCount}/${total} modules...`);
				resolve();
			});
		});

		await Promise.all(promises);

		finalizeLoaderChecklist();

		_modulesLoaded = true;
		runPostLoad();

	} catch (error) {
		console.error("Module loading failed:", error);
		updateLoadingStatus(`Error loading modules. ${error}`);
	}
}
