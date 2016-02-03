/*global $
loginResponseSuccess
loginResponseError
*/
	
function CheckIfLoginRetryNeeded(response) {
	return false;
}

function DoLogin(username, password, callcenterId) {
	inConcert.InconcertAuth.login("", username + "@" + callcenterId, password, function(result, data){
		loginResponseSuccess(result, data);
	});
}
