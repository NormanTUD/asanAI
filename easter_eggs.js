"use strict";

function show_snow () {
	var duration = 15 * 1000;
	var animationEnd = Date.now() + duration;
	var skew = 1;

	(function frame() {
		var timeLeft = animationEnd - Date.now();
		var ticks = Math.max(200, 500 * (timeLeft / duration));
		skew = Math.max(0.8, skew - 0.001);

		confetti({
			particleCount: 1,
			startVelocity: 0,
			ticks: ticks,
			origin: {
				x: Math.random(),
				// since particles fall down, skew start toward the top
				y: (Math.random() * skew) - 0.2
			},
			colors: ["#ffffff"],
			shapes: ["circle"],
			gravity: randomInRange(0.4, 0.6),
			scalar: randomInRange(0.4, 1),
			drift: randomInRange(-0.4, 0.4)
		});

		if (timeLeft > 0) {
			requestAnimationFrame(frame);
		}
	}());
}

function randomInRange(min, max) {
	return Math.random() * (max - min) + min;
}

function confetti_a () {
	confetti({
		particleCount: 100,
		spread: 70,
		origin: { y: 0.6 }
	});
}

function confetti_b () {
	confetti({
		angle: randomInRange(55, 125),
		spread: randomInRange(50, 70),
		particleCount: randomInRange(50, 100),
		origin: { y: 0.6 }
	});
}

function confetti_c() {
	var count = 200;
	var defaults = {
		origin: { y: 0.7 }
	};

	function confetti_fire(particleRatio, opts) {
		confetti(Object.assign({}, defaults, opts, {
			particleCount: Math.floor(count * particleRatio)
		}));
	}

	confetti_fire(0.25, {
		spread: 26,
		startVelocity: 55,
	});
	confetti_fire(0.2, {
		spread: 60,
	});
	confetti_fire(0.35, {
		spread: 100,
		decay: 0.91,
		scalar: 0.8
	});
	confetti_fire(0.1, {
		spread: 120,
		startVelocity: 25,
		decay: 0.92,
		scalar: 1.2
	});
	confetti_fire(0.1, {
		spread: 120,
		startVelocity: 45,
	});
}

function confetti_d () {
	var defaults = {
		spread: 360,
		ticks: 50,
		gravity: 0,
		decay: 0.94,
		startVelocity: 30,
		shapes: ["star"],
		colors: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"]
	};

	function shoot() {
		confetti({
			...defaults,
			particleCount: 40,
			scalar: 1.2,
			shapes: ["star"]
		});

		confetti({
			...defaults,
			particleCount: 10,
			scalar: 0.75,
			shapes: ["circle"]
		});
	}

	setTimeout(shoot, 0);
	setTimeout(shoot, 100);
	setTimeout(shoot, 200);
}

async function confetti_e () {
	$(".fireworks-container").show();
	in_fireworks = true;
	var fw = new Fireworks(document.querySelector(".fireworks-container"));
	fw.start();
	await delay(10000);
	fw.stop();
	in_fireworks = false;
	$(".fireworks-container").html("").hide();
}

function _confetti () {
	const confettiFunctions = [confetti_a, confetti_b, confetti_c, confetti_d, confetti_e];
	const randomIndex = Math.floor(Math.random() * confettiFunctions.length);
	const randomConfettiFunction = confettiFunctions[randomIndex];

	try {
		randomConfettiFunction();
	} catch (error) {
		wrn(`Error executing ${randomConfettiFunction.name}: ${error}`);
	}
}

function _next(value, multiple) {
	return Math.ceil(value / multiple) * multiple;
}

async function easter_egg_fireworks (force=0) {
	if(in_fireworks) {
		return;
	}

	fireworks_counter++;

	if(force || fireworks_counter) {
		if(fireworks_counter % 10 == 0) {
			_confetti();
		}
	}

	log(`${fireworks_counter}/${_next(fireworks_counter, 10)}`);
}
