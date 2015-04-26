var currentcaptcha;
function sendcaptcha() {
	// if not empty, else prompt
	// filter "resultType":"textual"
	var solution = document.getElementById("solution").value;
	addon.port.emit("sendcaptcha", { tid: currentcaptcha.tid, result: '"' + solution + '"' });
}

addon.port.on("CaptchaWaiting", function onCaptchaWaiting(captcha) {
	currentcaptcha = captcha;
	document.getElementById("captcha").setAttribute("src", "data:image/" + captcha.type + ";base64," + captcha.data);
});