"use strict";

let nWise = (n, array) => {
	var iterators = Array(n).fill().map(() => array[Symbol.iterator]());
	iterators.forEach((it, index) => Array(index).fill().forEach(() => it.next()));
	return Array(array.length - n + 1).fill().map(() => (iterators.map(it => it.next().value)));
};

let pairWise = (array) => nWise(2, array);

let sum = (arr) => arr.reduce((a,b)=>a+b);

let range = n => [...Array(n).keys()];

let rand = (min, max) => Math.random() * (max - min) + min;

Array.prototype.last = function() { return this[this.length - 1]; };

function flatten(array) {
	return array.reduce(function(flat, toFlatten) {
		if (Array.isArray(toFlatten)) {
			return flat.concat(flatten(toFlatten));
		} else {
			return flat.concat(toFlatten);
		}
	}, []);
}
