"use strict";

let sum = (arr) => arr.reduce((a,b)=>a+b);

let range = n => [...Array(n).keys()];

Array.prototype.last = function() { return this[this.length - 1]; };


