

jQuery.reduce = function(arr, valueInitial, fnReduce)
{
	jQuery.each( arr, function(i, value)
	{
		valueInitial = fnReduce.apply(value, [valueInitial, i, value]);
	});
	return valueInitial;
}

function getParameterByName(name)
{
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}


/* Cookie functions from http://www.quirksmode.org/js/cookies.html */
function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

function getListsIdFromQuery() {
	var qs = getParameterByName(LIST_QUERY_PARAMETER);
	return qs?qs.split(' '):[]
}

/**
 * 
 * Returns a unix-like timestamp (seconds since epoch)
 * @returns
 */
function getUnixTimestamp() {
	return Math.round(new Date().getTime() / 1000);
}

function getRandomId() {
	var chars = "0123456789abcdefghiklmnopqrstuvwxyz";
	var string_length = 8;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}


jQuery(document).ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
});



/* ---- Forms ---- */
function handleErrorForm(jForm, errors, direction) {
	
	if (!direction) direction = 'left'
	
	// Clean the errors
	$('.form-error').remove();
	
	// For each of the field with an error display it
	var errorDiv;
	var errorMsg;
	var jErrorField;
	
	for (var errorField in errors) {
		errorMsg = errors[errorField];
		jErrorField= jForm.find('input[name="'+ errorField +'"]');
		
		errorDiv = document.createElement('div');
		errorDiv.setAttribute('class', 'form-error ' + direction);
		errorDiv.setAttribute('id', errorField + '-error');
		
		// Edit the text
		while(errorDiv.childNodes.length >= 1) errorDiv.removeChild(errorDiv.firstChild);
		errorDiv.appendChild(errorDiv.ownerDocument.createTextNode(errorMsg));
		
		// Position it
		
		if (direction == 'down') {
			/*errorDiv.style.left = jErrorField.position().left + jErrorField.width() + 'px';*/ 
			errorDiv.style.top = jErrorField.position().top - 30 + 'px'; 
		} else {
			errorDiv.style.left = jErrorField.position().left + jErrorField.width() + 'px'; 
			errorDiv.style.top = jErrorField.position().top + 'px'; 
		}

		
		jForm.append(errorDiv);
		
		$(errorDiv).effect('bounce', { times: 2, distance: 5, direction: direction }, 300);
	}
}


