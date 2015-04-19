var username = document.getElementById("username");
var password = document.getElementById("password");
var savepw = document.getElementById("savepw");
var adress = document.getElementById("adress");
var ssl = document.getElementById("ssl");
var loginbutton = document.getElementById("login");

function login() {
	addon.port.emit("login_entered", { username: username.value, password: password.value, savepw: savepw.checked, adress: adress.value, ssl: ssl.checked });
	if (!savepw.checked) { password.value = ""; }
	// do a loading thing until login is accepted or return to login
}

// Interaction with the addon, listening to events

addon.port.on("show", function onShow(logindata) {
	var datacomplete = true;
	if (logindata.adress != "") {
		adress.value = logindata.adress;
	} else {
		adress.focus();
		datacomplete = false;
	}
	if (logindata.password != "") {
		password.value = logindata.password;
	} else {
		password.focus();
		datacomplete = false;
	}
	if (logindata.username != "") {
		username.value = logindata.username;
	} else {
		username.focus();
		datacomplete = false;
	}
	if (logindata.ssl) {
		ssl.checked = logindata.ssl;
	}
	if (logindata.savepw) {
		savepw.checked = logindata.savepw;
	}
	if (datacomplete) {
		loginbutton.focus();
	}
	// Focus what is empty else focus button
});
addon.port.on("loginfailed", function onLoginFailed(errorcode) {
	loginbutton.innerHTML = "Login failed | Try again";
});