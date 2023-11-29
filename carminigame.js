"use strict";

var highScore = 0
function initializeGameObjects() {
	const game = $("<div id='game' style='overflow:hidden; z-index:0; position: absolute; width: 100%; height: 1000px; background-color: rgba(40,140,40,0.5)';></div>")
	const scoreboard = $("<div id='scoreboard' style='z-index:15; position: absolute; left: 1000px; background-color: rgba(150,110,95,0.9); font-size: larger'>Score: 0</div>"); 
	const scoreMsg = $("<div id='scoreMsg' style='z-index:15; position: absolute; top: 420px; width: 200px; left: 400px; background-color: rgb(200,200,20); font-size: larger; text-align: center'></div>");
	const start = $("<div id='start' onclick='restart()' style='z-index:20; position: absolute; top: 400px; left: 400px; background-color: lightgreen; border: none; font-size: larger; width: 200px; text-align: center;';>Start Game</div>");
	const gameArea = $("<div id='gameArea' style='overflow:hidden; z-index:1; position: absolute; width: 1000px; height: 1000px; background-color: grey';></div>");
	const player = $("<canvas id='player' style='z-index:10; position: absolute; left: 450px; bottom: 10px; width: 96px; height: 198px;'></canvas>");
	var obstacle = $("<canvas class='obstacle' style='z-index:10; position: absolute; top: -200px; width: 96px; height: 198px;'></canvas>");
	$("body").append(game)
	$("#game").append(scoreboard);
	$("#game").append(scoreMsg);
	$("#game").append(gameArea);
	$("#gameArea").append(player);
	$("#game").append(start);
	const audi = new Image();
	audi.src="vehicles/AudiCut.png"
	audi.onload = function() {
		var context = player.get(0).getContext("2d");
		context.drawImage(audi,0,0,300,150)
	}
	const viper = new Image();
	viper.src="vehicles/Black_viperCut.png"
	var obstacles = []
	for(var i=0;i<=3;i++) {
		obstacles = obstacles.concat(obstacle.clone());
	}
	viper.onload = function() {
		for(currentObstacle in obstacles) {
			currObstacle = obstacles[currentObstacle]
			initPos = calcNewObstaclePos()
			currObstacle.css({ left: initPos })
			$("#gameArea").append(currObstacle);
			var context = currObstacle.get(0).getContext("2d");
			context.drawImage(viper,0,0,300,150)
		}
	}
	initializeMarkings()
}
function changePlayerPos(x) {
	player = $("#player")
	if(x < $("#gameArea").width() - player.width()) {
		player.css({
			left: x + 'px',
		});
	}

}
function l(msg) {
	console.log(msg)
}
function updateScoreboard(score) {
	$("#scoreboard").text("Highscore: " + highScore + "\nScore: " + score)
}
function restart() {
	$(document).on('mousemove', function(event) {
		var mouseX = event.pageX
		changePlayerPos(mouseX)
	});
	var obstacles = $(".obstacle") 
	$.each(obstacles,function(key,obstacle) {
		pos = Math.floor(Math.random() * -5) * 200
		$(obstacle).css({ top: pos+'px' })
	});
	play(0)
}
function reset(score) {
	$(document).unbind('mousemove')
	$("#start").fadeIn()
	if(score > highScore) {
		highScore = score
	}
	$("#scoreMsg").text("You reached "+score+" points.")
	$("#scoreMsg").fadeIn()
	score = 0
	updateScoreboard(score)
}
function calcNewObstaclePos() {
	return Math.floor(Math.random() * 10) * 100
}
function moveObstacle(obstacle, score, speed=5) {
	pos = obstacle.position().top+speed
	gameArea = $("#gameArea")
	if(pos < gameArea.height()) {
		obstacle.css({ top: pos + 'px' })  
	}
	else {
		pos = -200
		obstacle.css({ top: pos + 'px' })  
		score += 10
		updateScoreboard(score)
		posLeft = calcNewObstaclePos() 
		if(posLeft < gameArea.width() - obstacle.width() && posLeft > 0) {
			obstacle.css({ left: posLeft + 'px' })  
		}
	}
	return score
}
function moveObstacles(score) {
	obstacles = $(".obstacle")
	$.each(obstacles,function(key,obstacle) {
		score = moveObstacle($(obstacle), score)
	})
	return score
}
function moveMarkings(speed=5) {
	markings = $(".marking")
	$.each(markings, function(key,marking) {
		marking = $(marking)
		mPos = marking.position().top + speed
		marking.css({ top: mPos + 'px', left: '500px' })
		if(mPos > $("#gameArea").height()) {
			marking.css({ top: '0px'})
		}
	})
}
function initializeMarkings() {
	const roadMarking = $("<canvas class='marking' style='z-index:2; position: absolute; top: 10px; width: 8px; height: 50px; background-color: white';></canvas>");
	var markings = []
	for(var j=0;j<=12;j++) {
		markings = markings.concat(roadMarking.clone())
	}
	const distance = 100
	for(var currentMarking in markings) {
		var marking = markings[currentMarking]
		$("#gameArea").append(marking)
		if(currentMarking) {
			var mDistance = distance * currentMarking
			marking.css({ top: mDistance + 'px', left: '500px' })
		}
	}
}
function checkForCollisions() {
	var player = $("#player")
	var obstacles = $(".obstacle")
	var result = false
	$.each(obstacles, function(key, obstacle) {
		currObstacle = $(obstacle)
		pPos = player.position()
		oPos = currObstacle.position()
		if(pPos.left < oPos.left && pPos.left+player.width() > oPos.left &&
			pPos.top < oPos.top+currObstacle.height() && pPos.top+player.height() > oPos.top) {
			result = true
		} else if(pPos.left+player.width() > oPos.left+currObstacle.width() && 
			pPos.left < oPos.left+currObstacle.width() && pPos.top < oPos.top+currObstacle.height() &&
			pPos.top+player.height() > oPos.top) {
			result = true
		}
	});
	return result
}
function play(score) {
	$("#start").fadeOut()
	$("#scoreMsg").fadeOut()
	moveMarkings(7)
	score = moveObstacles(score)
	if(checkForCollisions()) {
		reset(score)
		return
	}
	window.requestAnimationFrame(function() {
		play(score)
	});
}
