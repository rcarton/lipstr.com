
function signup() {
	
    $.ajax(SIGNUP_URL, {
        data: $('#signup').serialize(),
        type: 'POST', 
        contentType: 'application/json',
        success: function(data) {
        	if(data.errors != undefined) {
        		// Error case
        		handleErrorForm(data.errors)
        	} else {
        		// Registraiton successful
        		// TODO
        	}
        },
        error: function(data, status) {
        	console.log('There was an error during the sign up.');
        }
    });
	
	return false;
}

function handleErrorForm(errors) {
	
	// Clean the errors
	$('.signup-error').remove();
	
	// For each of the field with an error display it
	var errorDiv;
	var errorMsg;
	var jErrorField;
	
	for (var errorField in errors) {
		errorMsg = errors[errorField];
		jErrorField= $('#' + errorField);
		
		errorDiv = document.createElement('div');
		errorDiv.setAttribute('class', 'signup-error');
		errorDiv.setAttribute('id', errorField + '-error');
		
		// Edit the text
		while(errorDiv.childNodes.length >= 1) errorDiv.removeChild(errorDiv.firstChild);
		errorDiv.appendChild(errorDiv.ownerDocument.createTextNode(errorMsg));
		
		// Position it
		errorDiv.style.left = jErrorField.position().left + jErrorField.width() + 'px'; 
		errorDiv.style.top = jErrorField.position().top + 'px'; 
		
		$('#signup').append(errorDiv);
		
		$(errorDiv).effect('bounce', { times: 2, distance: 5, direction: 'left' }, 300);
	}
	
	
}


$(document).ready(function() {
	
	var oSignup = $("#signup")[0];
	
	oSignup.onsubmit = signup;
	
});