
function login() {
	
    $.ajax(LOGIN_URL, {
        data: $('#loginform').serialize(),
        type: 'POST', 
        contentType: 'application/json',
        success: function(data) {
        	if(data.errors != undefined) {
        		// Error case
        		handleErrorForm($('#loginform'), data.errors, 'down')
        	} else {
        		// login successful
        		window.location.href = data.next
        	}
        },
        error: function(data, status) {
        	console.log('There was an error during the login.');
        }
    });
	
	return false;
}

function gmail() {
	
	// The user must have a session before he leaves for the google login/approval page
    $.ajax(SESSION_URL, {
        type: 'GET', 
        success: function(data) {
    		window.location.href = GMAIL_URL;
        },
        error: function(data, status) {
        	console.log('There was an error during the login.');
        }
    });
}



$(document).ready(function() {
	
	var oLogin = $("#loginform")[0];
	oLogin.onsubmit = login;
	
	$("#loginform").find('input').focus(function() {$('.form-error').fadeOut();});
});