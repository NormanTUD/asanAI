"use strict";

/*
 * Exact Vietoris–Rips persistence for H0 and H1 on a small point cloud.
 * The FFN TDA block uses it on the token states before and after the layer.
 * No DOM, no dependencies, so the transformer tests can load it directly.
 */
(function () {
	function distanceMatrix(points) {
		var n = points.length;
		var D = [];
		var maxDist = 0;
		for (var row = 0; row < n; row++) D.push(new Array(n).fill(0));
		for (var i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {
				var sum = 0;
				var len = Math.min(points[i].length, points[j].length);
				for (var k = 0; k < len; k++) {
					var d = (points[i][k] || 0) - (points[j][k] || 0);
					sum += d * d;
				}
				var dist = Math.sqrt(sum);
				D[i][j] = dist;
				D[j][i] = dist;
				if (dist > maxDist) maxDist = dist;
			}
		}
		return { matrix: D, maxDist: maxDist, n: n };
	}

	function symmetricDifference(a, b) {
		var out = [];
		var i = 0, j = 0;
		while (i < a.length && j < b.length) {
			if (a[i] < b[j]) out.push(a[i++]);
			else if (a[i] > b[j]) out.push(b[j++]);
			else { i++; j++; }
		}
		while (i < a.length) out.push(a[i++]);
		while (j < b.length) out.push(b[j++]);
		return out;
	}

	function simplexKey(verts) {
		return verts.join(",");
	}

	function persistence(points) {
		var n = (points || []).length;
		var dist = distanceMatrix(points || []);
		var scale = dist.maxDist || 1;
		var simplices = [];

		for (var i = 0; i < n; i++) {
			simplices.push({ dim: 0, verts: [i], val: 0 });
		}
		for (var i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {
				simplices.push({ dim: 1, verts: [i, j], val: dist.matrix[i][j] / scale });
			}
		}
		for (var i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {
				for (var k = j + 1; k < n; k++) {
					var val = Math.max(
						dist.matrix[i][j],
						dist.matrix[i][k],
						dist.matrix[j][k]
					) / scale;
					simplices.push({ dim: 2, verts: [i, j, k], val: val });
				}
			}
		}
		simplices.sort(function (a, b) {
			if (a.val !== b.val) return a.val - b.val;
			if (a.dim !== b.dim) return a.dim - b.dim;
			var ka = simplexKey(a.verts), kb = simplexKey(b.verts);
			return ka < kb ? -1 : ka > kb ? 1 : 0;
		});

		var vertexIndex = {};
		var edgeIndex = {};
		for (var s = 0; s < simplices.length; s++) {
			var simplex = simplices[s];
			if (simplex.dim === 0) vertexIndex[simplex.verts[0]] = s;
			else if (simplex.dim === 1) edgeIndex[simplexKey(simplex.verts)] = s;
		}

		var boundaries = [];
		for (var s = 0; s < simplices.length; s++) {
			var simplex = simplices[s];
			var boundary = [];
			if (simplex.dim === 1) {
				boundary.push(vertexIndex[simplex.verts[0]], vertexIndex[simplex.verts[1]]);
				boundary.sort(function (a, b) { return a - b; });
			} else if (simplex.dim === 2) {
				var a = simplex.verts[0], b = simplex.verts[1], c = simplex.verts[2];
				boundary.push(edgeIndex[a + "," + b], edgeIndex[a + "," + c], edgeIndex[b + "," + c]);
				boundary.sort(function (a, b) { return a - b; });
			}
			boundaries.push(boundary);
		}

		var reduced = new Array(simplices.length);
		var pivotOf = new Array(simplices.length).fill(-1);
		var zeroColumn = new Uint8Array(simplices.length);
		var pivotOwner = new Map();
		for (var j = 0; j < simplices.length; j++) {
			var col = boundaries[j].slice();
			while (col.length) {
				var low = col[col.length - 1];
				if (pivotOwner.has(low)) {
					col = symmetricDifference(col, reduced[pivotOwner.get(low)]);
				} else {
					pivotOwner.set(low, j);
					pivotOf[j] = low;
					break;
				}
			}
			reduced[j] = col;
			if (!col.length) zeroColumn[j] = 1;
		}

		var killedBy = new Array(simplices.length).fill(-1);
		for (var j = 0; j < simplices.length; j++) {
			if (pivotOf[j] >= 0) killedBy[pivotOf[j]] = j;
		}

		var h0 = [];
		var h1 = [];
		for (var i = 0; i < simplices.length; i++) {
			var simplex = simplices[i];
			if (simplex.dim === 0) {
				var death0 = killedBy[i] >= 0 ? simplices[killedBy[i]].val : Infinity;
				if (!isFinite(death0) || death0 - simplex.val > 1e-12) {
					h0.push({ dim: 0, birth: simplex.val, death: death0, verts: simplex.verts });
				}
			} else if (simplex.dim === 1 && zeroColumn[i]) {
				var death1 = killedBy[i] >= 0 ? simplices[killedBy[i]].val : Infinity;
				if (!isFinite(death1) || death1 - simplex.val > 1e-12) {
					h1.push({ dim: 1, birth: simplex.val, death: death1, verts: simplex.verts });
				}
			}
		}

		h0.sort(function (a, b) { return a.death - b.death || a.birth - b.birth; });
		h1.sort(function (a, b) { return a.birth - b.birth || a.death - b.death; });
		return {
			h0: h0,
			h1: h1,
			dist: dist.matrix,
			maxDist: dist.maxDist,
			scale: scale,
			n: n
		};
	}

	function bettiAt(intervals, epsilon) {
		var count = 0;
		for (var i = 0; i < intervals.length; i++) {
			var bar = intervals[i];
			if (bar.birth <= epsilon && (!isFinite(bar.death) || bar.death > epsilon)) count++;
		}
		return count;
	}

	window.TDAFFN = {
		distanceMatrix: distanceMatrix,
		persistence: persistence,
		bettiAt: bettiAt
	};
})();
