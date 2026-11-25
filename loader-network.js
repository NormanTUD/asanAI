"use strict";

window.LoaderNetwork = {
	attach: function (canvasOrContainer, opts) {
		if (!window.OrganicNetwork) return null;

		let canvas = canvasOrContainer;
		if (canvasOrContainer && canvasOrContainer.tagName !== 'CANVAS') {
			canvas = canvasOrContainer.querySelector('canvas');
			if (!canvas) {
				canvas = document.createElement('canvas');
				canvas.setAttribute('aria-hidden', 'true');
				canvasOrContainer.insertBefore(canvas, canvasOrContainer.firstChild);
			}
		}
		if (!canvas) return null;

		const merged = Object.assign({
			color: function () {
				if (window.is_dark_mode === true) return [165, 180, 252];
				if (window.is_dark_mode === false) return [99, 102, 241];
				if (document.body && document.body.classList.contains('darkmode')) return [165, 180, 252];
				if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return [165, 180, 252];
				return [99, 102, 241];
			}
		}, opts || {});

		return window.OrganicNetwork.create(canvas, merged);
	},

	destroy: function (net) {
		if (net && typeof net.destroy === 'function') net.destroy();
	}
};
