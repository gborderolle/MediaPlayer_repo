/*jslint evil:true nomen:false regexp: false*/
/*global $, jQuery, window, inConcert, escape */

/*
Authentication
*/

// Create an inConcert object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.inConcert) {
    this.inConcert = {};
}


(function () {

	//constructor
	function Authenticator() {
		this.m_loginToken = null;
		this.m_applicationName = "agent";
		this.m_sessionId = null;
		this.m_user = null;
		this.m_password = null;
		this.m_urlBase = "/inconcert/apps/";
	}

	//Logs out the current user invalidating the cookied token
	Authenticator.prototype.logout = function(callback) {
		var url = this.m_urlBase + "agent/login/logout/";
		inConcert.invoke({
			type: 'POST',
			async: false,
			url: url,
			data: JSON.stringify({}),
			//dataType: "json",
			contentType: "application/json",
			success: function() {
				if(typeof(callback) === "function") {
					callback(true);
				}
			},
			error : function() {
				if(typeof(callback) === "function") {
					callback(false);
				}
			}
		});
	};

	//Starts login handshaking process
	Authenticator.prototype.login = function(domain, user, password, callbackFn) {
		var self = this;
		self.m_user = user;
		self.m_password = password;
		self.m_callbackFn = callbackFn;
		self.m_urlBase = domain + "/inconcert/apps/";
		var url = self.m_urlBase + "agent/login/getToken/";
		inConcert.invoke({
			url: url,
			dataType: "json",
			contentType: "application/json",
			success: function(response) {
				self.m_loginToken = response.loginToken;
				self.loginUser();
			},
			error: function(response, error) {
				self.loginError(response, self);
			}
		});
	};

	Authenticator.prototype.changePassword = function(user, oldPassword, newPassword, callback) {
		if(!user.match(inConcert.app.idAtVCCRegExp)) {
			//invalid user non alfa
			callback({code: -100});
			return;
		}
		var username = RegExp.$1;
		var callcenterId = RegExp.$2.trim();
		if(callcenterId.length === 0) {
			//invalid user syntax must be user@domain
			callback({code: -200});
			return;
		}

		var url = this.m_urlBase + "login/changepassword/user";
		var request = {
			userName: username,
			virtualContactCenter: callcenterId,
			currentPassword: oldPassword,
			newPassword: newPassword
		};
		inConcert.invoke({
			url: url,
			type: 'post',
			data: JSON.stringify(request),
			dataType: "json",
			contentType: "json",
			success: function(data) {
				var result = {
					code: data.status === true ? 0 : -1,
					message: data.message
				};
				callback(result, data);
			},
			error: function(response, error) {
				callback(response, error);
			}
		});
	};

	//Using a valid token and session ID tries to validate user using specified id and password
	Authenticator.prototype.loginUser = function() {
		var self = this;
		if(!self.m_user.match(/(.+)@([^@]+)$/)) {
			//invalid user non alfa
			self.loginError({status: -100});
			return;
		}
		var username = RegExp.$1;
		var callcenterId = RegExp.$2.trim();
		if(callcenterId.length === 0) {
			//invalid user syntax must be user@domain
			self.loginError({status: -200});
			return;
		}
		var textToEncode = username.toLowerCase() + self.m_password;
		var hash = inConcert.Utils.md5( inConcert.Utils.md5(textToEncode) + self.m_loginToken);

		var params = "hash=" + hash + "&username=" + escape(username) + "&loginToken=" + self.m_loginToken +
			"&callcenter=" + callcenterId + "&app=" + escape(self.m_applicationName);

		var url = self.m_urlBase + "agent/login/authenticate/";
		inConcert.invoke({
			url: url,
			type: 'post',
			data: params,
			dataType: "json",
			contentType: "application/x-www-form-urlencoded",
			success: function(data) {
				self.authToken = data.authToken;
				if (self.m_callbackFn) {
					var result = {
						code: data.status === true ? 0 : -1,
						message: data.message
					};
					self.m_callbackFn(result, data);
				}
			},
			error: function(response, error) {
				self.loginError(response, self);
			}
		});
	};

	//Handles every server-related login error and propagates the result to the requester
	//TODO hay que mover estos handler de lugar
	Authenticator.prototype.loginError = function(response, auth) {
		var result = {};
		var self = this;
		result.code = response.status;
		switch (response.status) {
			case -100:
			case -200:
				result.message = inConcert.i18n.getString("Unknown user, please specify your user as user@domain");
				break;

			case 12007:
				result.message = inConcert.i18n.getString("Unable to communicate with server, please verify server name.");
				break;

			case 12029:
			case 0: //firefox esta enviando status cero en la desconexion
				result.message = inConcert.i18n.getString("Unable to communicate with server, please check your network connection");
				break;

			case 500: //los server errors, well...
				result.message = inConcert.i18n.getString("An error has ocurred, please try again in a few minutes.");
				break;

			case 403: //o me pisaron el login o reiniciaron el web server
				result.message = inConcert.i18n.getString("Your credentials are no longer valid, please login again");
				break;

			case 200:
				result.code = 0;
				result.message = "";
				break;

			default:
				result.message = "Server error " + (response.status || "");
				//jQuery.stringFormat(inConcert.i18n.getString("Server error {0}, please contact us at support@inconcertcc.com"), response.status);
		}

		if (self.m_callbackFn) {
			self.m_callbackFn(result);
		}
	};

	//Define functions and objects in the namespace in case they don't already exist
	if (typeof inConcert.InconcertAuth !== 'object') {
		inConcert.InconcertAuth = new Authenticator();
	}

}());

