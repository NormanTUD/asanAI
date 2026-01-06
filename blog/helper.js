function log(id, msg) {
	const con = document.getElementById(id + '-console');
	const time = new Date().toLocaleTimeString().split(' ')[0];
	con.innerHTML = `[${time}] ${msg}<br>` + con.innerHTML;
}

function warn(id, msg) {
	const con = document.getElementById(id + '-console');
	const time = new Date().toLocaleTimeString().split(' ')[0];
	con.innerHTML = `[${time}] &#9888; <span class='warning-msg'>${msg}</span><br>` + con.innerHTML;
}
