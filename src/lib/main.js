// ToDo
// loggedin = false -> change icon to show that, maybe also a notification
// refreshbutton in settings for user to apply new settings
// -> do not save my data, just login
// maybe update button icon like the download button icon
// check the clipboard for links and display a notification
// use about:pyload page for built-in webinterface
// Implement some kind of extra button for existing Click'n'Load buttons

// globals
var loggedin = false;
var loginfrompanel = false;
var iscontextmenu = false; // Is the context menu displayed (for loggedin)
var iscaptchawaiting = false;

// requirements
var request = require("sdk/request").Request; // Sending posts for API
var tabs = require("sdk/tabs");
var tmr = require('sdk/timers');

// Read prefs
var preferences = require("sdk/simple-prefs").prefs;

// Check login or do the login, else change button behavior to login

if (preferences.username != "" && preferences.password != "" && (/.+?:\d+/.test(preferences.address) || /[\d\w\.-]+/.test(preferences.address))) {
	api_login();
} else if (preferences.sessionid != "" && preferences.username != "" && preferences.password == "" && (/.+?:\d+/.test(preferences.address) || /[\d\w\.-]+/.test(preferences.address))) {
	api_call("getServerVersion");
} else {
	loggedin = false;
}

// ------------------------------------------
// Pyload API
// ------------------------------------------
function api_login(password) {
	password = password || preferences.password;
	
	if (preferences.ssl) {
		var url = "https://" + preferences.address + "/api/login";
	} else {
		var url = "http://" + preferences.address + "/api/login";
	}
	request({
		url: url,
		content: { username: preferences.username, password: password },
		onComplete: function(response) {
										if (/"[\d\w]+"/.test(response.text)) {
											// set login done
											preferences.sessionid = response.text.substr(1, response.text.length - 2);
											loggedin = true;
											tmr.setTimeout(checkCaptcha, 420);
											// console.log("Login successful");
											// console.log(preferences.sessionid);
										} else {
											// set login required
											loggedin = false;
											// console.log("Login failed");
											// console.log(response.text);
										}
										loginpanelresponse();}
		}).post();
}
function api_call(name, parameters) {
	parameters = parameters || { session: preferences.sessionid };
	parameters.session = preferences.sessionid;
	if (preferences.ssl) {
		var url = "https://" + preferences.address + "/api/" + name;
	} else {
		var url = "http://" + preferences.address + "/api/" + name;
	}
	request({
		url: url,
		content: parameters,
		onComplete: function(response) { api_response(response, name); }
		}).post();
}
function api_response(response, name) {
	// response here
	// console.log(name + ": " + response.text);
	switch (name) {
		case "getServerVersion":
			// test, if the sessionid is still usable
			if (/"[\d\.]+"/.test(response.text)) {
				loggedin = true;
			} else {
				loggedin = false;
			}
			// console.log(response.text);
			break;
		case "freeSpace":
			// console.log(response.text);
			break;
		case "checkOnlineStatus":
			// console.log(response.text);
			break;
		case "isCaptchaWaiting":
			if (response.text == "true") {
				iscaptchawaiting = true;
				api_call("getCaptchaTask");
				// console.log("Captcha is waiting");
			} else {
				if (iscaptchawaiting) {
					iscaptchawaiting = false;
					pyload_button.badge = 0;
					pyload_button.badgeColor = "#00BBBB";
				}
			}
			break;
		case "getCaptchaTask":
			captcha_panel.port.emit("CaptchaWaiting", response.json);
			pyload_button.badge = "!!";
			pyload_button.badgeColor = "#FF4444";
			// console.log(response.text);
			break;
		case "setCaptchaResult":
			console.log("Captcha submition response: " + response.text);
			break;
	}
}

function checkCaptcha() {
	api_call("isCaptchaWaiting");
	tmr.setTimeout(function(){ checkCaptcha(); }, preferences.captchatime * 1000);
}

// ------------------------------------------
// Interface
// ------------------------------------------

var data = require("sdk/self").data;

var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");

var pyload_button = ToggleButton({
	id: "pyload-button",
	label: "Show Pyload",
	icon: {
		"16": "./icon-16.png",
		"32": "./icon-32.png",
		"64": "./icon-64.png"
	},
	onChange: handleChange,
	// badge only if active to show that
	badge: 0, // to remove, set to ""
	badgeColor: "#00BBBB" // "#9EAB80"
	// badgeColor: "#FF4444"//"#00AAAA"
	// active downloads: #00BBBB captcha waiting: #FF4444
});

var pyload_panel = panels.Panel({
	contentURL: data.url("panels/login.html"),
	// contentScriptFile: data.url("panel/login.js"),
	width: 400,
	height: 600,
	// contextMenu: true,
	onHide: handleHide
});

var addlinks_panel = panels.Panel({
	contentURL: data.url("panels/addlinks.html"),
	width: 600,
	height: 400,
	onHide: addlinks
});

var captcha_panel = panels.Panel({
	contentURL: data.url("panels/captcha.html"),
	width: 350,
	height: 150,
	onHide: abortcaptcha
});
	

function handleChange(state) {
	if (state.checked) {
		if (loggedin) {
			var url = "";
			// Is a captcha waiting? Else use normal button function
			if (iscaptchawaiting) {
				captcha_panel.show({ position: pyload_button });
			} else {
			// Download panel/webinterface/built-in interface
<<<<<<< HEAD
				if (preferences.buttonopt == "P") {
					pyload_panel.contentURL = data.url("panels/panel.html");
					pyload_panel.resize(400, 600);
					pyload_panel.show({ position: pyload_button });
				} else if (preferences.buttonopt == "I") { // webinterface
					if (preferences.ssl) {
						url = "https://" + preferences.address + "/";
						pyload_button.state('window', {checked: false});
					} else {
						url = "http://" + preferences.address + "/";
						pyload_button.state('window', {checked: false});
					}
				} else { // built-in interface (coming soon) ("B")
					url = data.url("webinterface/index.html");
=======
			if (preferences.buttonopt == "P") {
				pyload_panel.contentURL = data.url("panels/panel.html");
				pyload_panel.resize(400, 600);
				pyload_panel.show({ position: pyload_button });
			} else if (preferences.buttonopt == "I") { // webinterface
				if (preferences.ssl) {
					url = "https://" + preferences.address + "/";
					pyload_button.state('window', {checked: false});
				} else {
					url = "http://" + preferences.address + "/";
>>>>>>> origin/master
					pyload_button.state('window', {checked: false});
				}
			}
			// If url is set, open a tab
			if (url != "") {
				// Not perfect reusing, may be improved
				for (let tab of tabs) {
					if (RegExp(url).test(tab.url)) {
						tab.activate();
						return 1;
					}
					if (/about:newtab/.test(tab.url)) {
						tab.activate();
						tab.url = url;
						return 1;
					}
				}
				tabs.open(url);
			}
		} else {
			// pyload_panel.contentURL = data.url("panel/login.html"); // when this line is present, giving preferences over is broken :(
			pyload_panel.resize(300, 400);
			pyload_panel.show({ position: pyload_button });
			pyload_panel.port.emit("show", { username: preferences.username, password: preferences.password, savepw: preferences.savepw, address: preferences.address, ssl: preferences.ssl });
		}
	}
}

function handleHide() {
	pyload_button.state('window', {checked: false});
}
function addlinks() {
	console.log("adding links");
}
function abortcaptcha() {
	console.log("captcha aborted");
	pyload_button.state('window', {checked: false});
}

// Content interaction

pyload_panel.port.on("login_entered", function (logindata) {
	preferences.ssl = logindata.ssl;
	preferences.savepw = logindata.savepw;
	
	preferences.username = logindata.username;
	if (logindata.savepw) {
		preferences.password = logindata.password;
	} else {
		preferences.password = "";
	}
	preferences.address = logindata.address;
	loginfrompanel = true;
	api_login(logindata.password);
	// wait for the result (calling loginpanelresponse();)
});
captcha_panel.port.on("sendcaptcha", function (solution) {
	api_call("setCaptchaResult", { tid: solution.tid, result: solution.result });
	console.log("Sending captcha solution: " + solution.result);
	iscaptchawaiting = false;
	pyload_button.badge = 0;
	pyload_button.badgeColor = "#00BBBB";
	captcha_panel.hide();
});
function loginpanelresponse() {
	if (loginfrompanel) {
		if (loggedin) {
			if (preferences.buttonopt == "P") {
				// Change the panel and NOT hide it
				pyload_panel.contentURL = data.url("panels/panel.html");
				pyload_panel.resize(400, 600);
			} else {
				pyload_panel.hide();
				handleHide();
			}
			console.log(logindata);
		} else {
			// call back to the panel
			pyload_panel.port.emit("loginfailed", "bla");
			console.log("repeat login");
		}
	}
	loginfrompanel = false;
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

// ------------------------------------------
// Context Menu
// ------------------------------------------


var self = require("sdk/self");

var contextMenu = require("sdk/context-menu");
var menuItem = contextMenu.Item({
  label: "Alalyse Selection",
  context: contextMenu.SelectionContext(),
  contentScript: 'self.on("click", function () {' +
                 '  var text = window.getSelection().toString();' +
                 '  self.postMessage(text);' +
                 '});',
  image: self.data.url("icon-16.png"),
  onMessage: function (selectionText) {
    addlinks_panel.show();
  }
});

var cm = require("sdk/context-menu");
cm.Item({
  label: "Add to Pyload",
  context: cm.SelectorContext("a[href]"),
  contentScript: 'self.on("click", function () {' +
                 '  var text = window.getSelection().toString();' +
                 '  self.postMessage(text);' +
                 '});',
  image: self.data.url("icon-16.png"),
  onMessage: function (selectionText) {
    addlinks_panel.show();
  }
});
