/*global $ escape cookies window
CheckIfLoginRetryNeeded
DoLogin

*/

//little hack for IE
if (!String.prototype.trim) {
	String.prototype.trim = function() {
		return $.trim(this);
	};
}

////////////////////////////////////////////////////////////////////
/// Retorna el offset de un elemento en forma portable (IE, Mozilla)
function getElementOffset(elem, property) {
	var p = elem;
	var offset = 0;
	while(p) {
		offset += p[property];
		p = p.offsetParent;
	}
	return offset;
}

////////////////////////////////////////////////////////////////
///
function OnFieldKeyDown(field, evt) {
	var keycode;
	if(window.event) {
		keycode = window.event.keyCode;
	}
	else if (evt) {
		keycode = evt.which;
	}
	else {
		return true;
	}

	// escape o tab los ignoro
	if(keycode === 27 || keycode === 12) {
		return true;
	}

	if (keycode === 13) {
		$("#submitButton").click();
		return true;
	}

	var needed = document.getElementById(field.name + "_needed");
	if(needed) {
		document.body.removeChild(needed);
		field.style.backgroundColor = "";
	}
}

/**
Callback called if a login attempt was succesfull
*/
function loginResponseSuccess(response) {
	$(".formFieldWrong").each(function(){
		$(this).removeClass("formFieldWrong");
	});

	if (!response) {
		$("#loginStatus").show().find("div").text("Error accessing server. Please try again later");
		$("#submitButton").removeClass("loginFormButton-ds").addClass("loginFormButton")[0].disabled = false;
		$(".loginWaitingMessage > div").text("").parent().hide();
		return;
	}
	else if(response.code !== 0) {
		if(CheckIfLoginRetryNeeded(response)) {
			var button = $("form[name='formLogin']").find("#submitButton");
			button[0].disabled = false;	// we need to enable the button before trying to login again, else it will ignore us
			button.click();
			return;
		}
		$("#submitButton").removeClass("loginFormButton-ds").addClass("loginFormButton")[0].disabled = false;
		$(".loginWaitingMessage > div").text("").parent().hide();
		$("#loginStatus div").text(response.message).parent().show();

		$("#username").next("img").show();

		var elementToSelect;
		if(response.failCause === "wrongUsername") {
			elementToSelect = $(document.forms.formLogin.elements.username);
		}
		else if(response.failCause === "wrongPassword") {
			elementToSelect = $(document.forms.formLogin.elements.password);
		}
		else if(response.failCause === "virtualCallcenterNotEnabled") {
			elementToSelect = $(document.forms.formLogin.elements.username);
		}
		if(elementToSelect) {
			elementToSelect.addClass("formFieldWrong").focus();
			elementToSelect.select();
		}
	}
	else {
		sessionStorage.loggedFromForm = true
		var newLocation = document.location.toString().replace("login/", "");
		if (newLocation + "login/" == document.location.toString()) {
			//if we are located at the login page, move to the home page
			document.location = newLocation;
		}
		else {
			//simply refresh
			document.location.reload();
		}
	}
}

/**
Callback called if a login attempt failed.
*/
function loginResponseError(response) {
	$(".loginWaitingMessage > div").text("").parent().hide();
	$("#submitButton").removeClass("loginFormButton-ds").addClass("loginFormButton")[0].disabled = false;

	$("#loginStatus").show().find("div").text(response.responseText);

	if(response.status === 403) {
		//alert(document.location);
		//document.location = "/inconcert/login/formato";
	}
}


$(document).ready(function() {
	
	//removes potential garbage from previous session
	sessionStorage.removeItem("loggedFromForm");
	sessionStorage.removeItem("alreadyInitialized");

	$(".requiredField").bind("keypress", function(event) {
		return OnFieldKeyDown(this, event);
	});

	$(".requiredField:first").focus();

	$("#submitButton").bind("click", function() {
		$("#loginStatus").hide();
		if($("#submitButton")[0].disabled) {
			return false;
		}

		// borro el mensaje anterior, de haberlo
		$("#loginStatus").hide();
		$(".errorIcon").hide();

		if ($("#username").val().trim() === "") {
			$("#username").next("img").show();
			$("#loginStatus div").text("Field is required").parent().show();
			return false;
		}

		if ($("#password").val() === "") {
			$("#password").next("img").show();
			$("#loginStatus div").text("Field is required").parent().show();
			return false;
		}

		var username = $("#username").val().trim();
		if (username === "admin") {
			username += "@system"; //user admin is assumed to be in system vcc
		}
		var userAndVcc = username.split("@");
		if (userAndVcc.length !== 2) {
			$("#username").next("img").show();
			$("#loginStatus div").text("Username must include only one '@'").parent().show();
			return false;
		}

		var username = userAndVcc[0];
		var callcenterId = userAndVcc[1];

		var password = $("#password").val()

		$("#submitButton").removeClass("loginFormButton").addClass("loginFormButton-ds")[0].disabled = true;
		$(".loginWaitingMessage > div").text("Logging in").parent().show();
		DoLogin(username, password, callcenterId);
		return false;
	});
});