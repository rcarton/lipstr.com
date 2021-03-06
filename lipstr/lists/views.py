from django.contrib import auth
from django.contrib.auth import authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect, HttpResponseServerError, \
    HttpResponse, HttpResponseBadRequest, HttpResponseNotFound
from django.shortcuts import render_to_response, redirect
from django.template.context import RequestContext
from django.utils import simplejson
from lists.actions import process_actions
from lists.forms import SignupForm, PreferencesForm
from lists.models import List, Board

@login_required
def home(request):
    """Home page."""
    
    # Get the user boards
    boards = request.user.get_profile().boards
    
    return render_to_response('home.html', RequestContext(request, {'boards': boards}))


def login(request):
    """Login page."""
    
    next = request.GET.get('next', '')
    
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(username=username, password=password)
        
        if user is not None:
            next = next or '/'
            auth.login(request, user)
            
            # Clean the removed lists
            #user.get_profile().clean_lists()
            
            return HttpResponse(content_type='application/json', content=simplejson.dumps({'next': next or '/'}))
        else:
            try:
                User.objects.get(username=username)
                return HttpResponse(content_type='application/json', content=simplejson.dumps({'errors': {'password': 'Wrong password.'}}))
            except User.DoesNotExist:  
                return HttpResponse(content_type='application/json', content=simplejson.dumps({'errors': {'username': 'User not found.'}}))
    else:
        if request.user.is_authenticated():
            return redirect(next or '/')
        
        return render_to_response('login.html', RequestContext(request, {'next': next}))

def disconnect(request):
    logout(request)
    return redirect('login')

@login_required
def actions(request):
    """Updates the lists with the actions."""
    
    if request.method == 'POST':
        json_data = simplejson.loads(request.raw_post_data)
        try:
            actions = json_data['actions']
        except KeyError:
            return HttpResponseServerError("Malformed data!")
        
        modified_l, id_replacements  = process_actions(actions, request.user)
        
        lists_to_return = [l.to_obj() for l in modified_l.itervalues()]
        
        # Add tmp_id_replacement for new lists -> to replace the temporary ids in the DOM list
        for tmp_id, new_id in id_replacements:
            for l in lists_to_return:
                if l['id'] == new_id:
                    l['tmp_id_replacement'] = tmp_id;
                
        return HttpResponse(content_type='application/json', content=simplejson.dumps(lists_to_return))
    

@login_required
def list(request):
    """Returns the lists of the user."""
    
    #TODO: anonymous user
    
    # Get the lists to retrieve
    l = request.GET.get('l', None)
    
    if l:
        lists = [li.to_obj() for li in List.get_lists_for_user(request.user) and li.id in l]
    else:
        # Get the board to retrieve
        b = request.GET.get('b', None)
        
        lists = [l.to_obj() for l in List.get_lists_for_user(request.user, b)]
    
    
    
    return HttpResponse(content_type='application/json', content=simplejson.dumps(lists))

    
def signup(request):
    
    next = request.GET.get('next', '/')
    
    # Form has been submitted
    if request.method == 'POST': # If the form has been submitted...
        form = SignupForm(request.POST) # A form bound to the POST data
        if not form.is_valid():
            return HttpResponse(content_type='application/json', content=simplejson.dumps({'errors': form.errors}))
        else:
            
            # Create the account
            errors = create_account(form)
            if errors: return HttpResponse(content_type='application/json', content=simplejson.dumps({'errors': errors}))
            
            # Authenticate the user
            user = authenticate(username=form['email'].value(), password=form['password'].value())
            auth.login(request, user)
            
            return HttpResponse(content_type='application/json', content=simplejson.dumps({'next': next}))
    
    
    # Display the regular page
    return render_to_response('signup.html', RequestContext(request, {}))
    
def create_account(signup_form):
    """ Create Account
    
    signup_form:
     - email
     - password
     - firstname
    
    """
    
    # User exists
    try:
        if User.objects.get(username=signup_form['email'].value()):
            return {'email': 'You already have an account.'}
    except User.DoesNotExist:
        pass
    
    user = User()
    user.username = signup_form['email'].value()
    user.email = signup_form['email'].value()
    user.set_password(signup_form['password'].value())
    
    if signup_form['firstname'].value(): user.first_name = signup_form['firstname'].value()
        
    user.save()
    
    profile = user.get_profile()
    if signup_form['icon']: 
        profile.icon = signup_form['icon'].value()
    
    # Create the default board
    b = Board()
    b.creator = user
    b.title = 'home'
    b.id = 'home'
    profile.boards.append(b)
    profile.save()
        
    return {}

@login_required
def preferences(request):
    
    if request.method == 'POST': # If the form has been submitted...
        form = PreferencesForm(request.POST) # A form bound to the POST data
        if not form.is_valid():
            return render_to_response('preferences.html', RequestContext(request, {'errors': simplejson.dumps(form.errors)}))
        
        # Save the changes
        user = request.user
        userprofile = user.get_profile()
        must_save = {'user': False, 'userprofile': False}
        
        # display name
        ndisplayname = form['displayname'].value().strip()
        if ndisplayname and ndisplayname != user.first_name:
            user.first_name = ndisplayname
            must_save['user'] = True
            
        #password
        if form['oldpassword'].value() and form['newpassword'].value(): 
            user.set_password(form['newpassword'].value())
            must_save['user'] = True
            
        #icon
        if form['icon'].value() != userprofile.get_icon_url():
            userprofile.icon = form['icon'].value()
            must_save['userprofile'] = True
        
        if must_save['user']: user.save()
        if must_save['userprofile']: userprofile.save()
        
        return redirect('/')
        
    return render_to_response('preferences.html', RequestContext(request, {}))
    
    



def error404(request):
    raise Exception()
    return render_to_response('404.html', RequestContext(request, {}))

def error500(request, message=None):
    return render_to_response('500.html', RequestContext(request, {'message': message}))
def error400(request, message=None):
    return render_to_response('400.html', RequestContext(request, {'message': message}))

