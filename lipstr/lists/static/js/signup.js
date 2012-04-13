
function signup() {
	
    $.ajax(SIGNUP_URL, {
        data: $('#signup').serialize(),
        type: 'POST', 
        contentType: 'application/json',
        success: function(data) {
        	if(data.errors != undefined) {
        		// Error case
        		handleErrorForm($('#signup'), data.errors)
        	} else {
        		// Registraiton successful
        		window.location.href = data.next
        	}
        },
        error: function(data, status) {
        	console.log('There was an error during the sign up.');
        }
    });
	
	return false;
}



$(document).ready(function() {
	
	var oSignup = $("#signup")[0];
	
	oSignup.onsubmit = signup;
	
});