from django.contrib import auth
from django.contrib.auth import authenticate, logout
from django.http import HttpResponseRedirect, HttpResponseServerError, \
    HttpResponse
from django.shortcuts import render_to_response, redirect
from django.template.context import RequestContext
from django.utils import simplejson
from lists.actions import process_actions
from lists.models import List


def home(request):
    """Home page."""
    
    # If user is not authenticated, redirect to authentication 
    
    # else render his lists
    return render_to_response('home.html', RequestContext(request, {}))


def login(request):
    """Login page."""
    
    next = request.GET.get('next', '')
    
    if request.user.is_authenticated():
        return redirect(next or '/')
    
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(username=username, password=password)
        if user is not None:
            next = next or '/'
            auth.login(request, user)
            return redirect(next)
    else:
        return render_to_response('login.html', RequestContext(request, {'next': next}))

def disconnect(request):
    logout(request)
    return redirect('/')


def actions(request):
    """Updates the lists with the actions."""
    
    if request.method == 'POST':
        json_data = simplejson.loads(request.raw_post_data)
        try:
            actions = json_data['actions']
        except KeyError:
            return HttpResponseServerError("Malformed data!")
        
        modified_l, id_replacements  = process_actions(actions, request.user)
        
        lists_to_return = [l.to_obj() for l in modified_l]
        
        # Add tmp_id_replacement for new lists -> to replace the temporary ids in the DOM list
        for tmp_id, new_id in id_replacements:
            for l in lists_to_return:
                if l['id'] == new_id:
                    l['tmp_id_replacement'] = tmp_id;
                
        return HttpResponse(content_type='application/json', content=simplejson.dumps(lists_to_return))
    


def list(request):
    """Returns the lists of the user."""
    
    #TODO: anonymous user
    
    # Get the lists to retrieve
    l = request.GET.get('l', None)
    
    if l:
        lists = [li.to_obj() for li in List.get_lists_for_user(request.user) and li.id in l]
    else:
        lists = [l.to_obj() for l in List.get_lists_for_user(request.user)]
    
    return HttpResponse(content_type='application/json', content=simplejson.dumps(lists))
    
    
    
    