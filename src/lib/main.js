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

// requirements
var request = require("sdk/request").Request; // Sending posts for API

// Read prefs
var preferences = require("sdk/simple-prefs").prefs;

// Check login or do the login, else change button behavior to login

if (preferences.username != "" && preferences.password != "" && (/.+?:\d+/.test(preferences.adress) || /[\d\w\.-]+/.test(preferences.adress))) {
	api_login();
} else {
	loggedin = false;
}

// ------------------------------------------
// Pyload API
// ------------------------------------------
function api_login(password) {
	password = password || preferences.password;
	
	if (preferences.ssl) {
		var url = "https://" + preferences.adress + "/api/login";
	} else {
		var url = "http://" + preferences.adress + "/api/login";
	}
	request({
		url: url,
		content: { username: preferences.username, password: password },
		onComplete: function(response) {
										if (/"[\d\w]+"/.test(response.text)) {
											// set login done
											preferences.sessionid = response.text;
											loggedin = true;
											// console.log("Login successful");
											// console.log(preferences.sessionid);
										} else {
											// set login required
											loggedin = false;
											// console.log("Login failed");
											// console.log(response.text);
										}
										panelresponse();}
		}).post();
}
function api_call(name, parameters) {
	parameters.session = preferences.sessionid;
	if (preferences.ssl) {
		var url = "https://" + preferences.adress + "/api/" + name;
	} else {
		var url = "http://" + preferences.adress + "/api/" + name;
	}
	request({
		url: url,
		content: parameters,
		onComplete: function(name, response) { api_response(name, response); }
		}).post();
}
function api_response(name, response) {
	// response here
	console.log(name + ": " + response);
	switch ("name") {
		case "getServerVersion":
			console.log(response);
			break;
		case "freeSpace":
			console.log(response);
			break;
		case "checkOnlineStatus":
			console.log(response);
	}
}

// ------------------------------------------
// Interface
// ------------------------------------------

var data = require("sdk/self").data;
var tabs = require("sdk/tabs");

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

function handleChange(state) {
	if (state.checked) {
		if (loggedin) {
			// Download panel/webinterface/built-in interface
			if (preferences.buttonopt == "P") {
				pyload_panel.contentURL = data.url("panels/panel.html");
				pyload_panel.resize(400, 600);
				pyload_panel.show({ position: pyload_button });
			} else if (preferences.buttonopt == "I") { // webinterface
				// planned: reuse existing tab
				if (preferences.ssl) {
					tabs.open("https://" + preferences.adress + "/");
					pyload_button.state('window', {checked: false});
				} else {
					tabs.open("http://" + preferences.adress + "/");
					pyload_button.state('window', {checked: false});
				}
			} else { // built-in interface (coming soon) ("B")
				tabs.open(data.url("webinterface/index.html"));
				pyload_button.state('window', {checked: false});
			}
		} else {
			// pyload_panel.contentURL = data.url("panel/login.html"); // when this line is present, giving preferences over is broken :(
			pyload_panel.resize(300, 400);
			pyload_panel.show({ position: pyload_button });
			pyload_panel.port.emit("show", { username: preferences.username, password: preferences.password, savepw: preferences.savepw, adress: preferences.adress, ssl: preferences.ssl });
		}
	}
}

function handleHide() {
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
	preferences.adress = logindata.adress;
	loginfrompanel = true;
	api_login(logindata.password);
	// wait for the result (calling panelresponse();)
});
function panelresponse() {
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
    console.log(selectionText);
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
    console.log(selectionText);
  }
});
