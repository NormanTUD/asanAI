"use strict";

let sum = (arr) => arr.reduce((a,b)=>a+b);

let range = n => [...Array(n).keys()];

let rand = (min, max) => Math.random() * (max - min) + min;

Array.prototype.last = function() { return this[this.length - 1]; };

function flatten(array) {
	const result = [];
	const stack = [...array];
	let i = 0;
	while (i < stack.length) {
		const item = stack[i++];
		if (Array.isArray(item)) {
			stack.splice(i - 1, 1, ...item); // replace current with its contents
			i--; // stay at same index to process new elements
		} else {
			result.push(item);
		}
	}
	return result;
}
