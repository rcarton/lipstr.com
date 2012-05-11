from apiclient.discovery import build
from django.conf import settings
from django.contrib import auth
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, redirect
from google_api.models import FlowModel, CredentialsModel
from lists.forms import SignupForm
from lists.views import create_account, error500, error400
from oauth2client.client import OAuth2WebServerFlow, FlowExchangeError
from oauth2client.django_orm import Storage
import httplib2
import logging
import os
import random
import string

STEP2_URI = settings.GOOGLE_API_CALLBACK_URI


def get_session(request):
    # We want to save this session to reuse the session key after the user has authorized
    request.session.modified = True
    
    return HttpResponse("session set.", content_type="text/plain")

def index(request):
    #storage = Storage(CredentialsModel, 'id', request.user, 'credential')
    #credential = storage.get()
    
    credential = None
    if credential is None or credential.invalid == True:
        flow = OAuth2WebServerFlow(
            client_id=settings.GOOGLE_API_CLIENT_ID,
            client_secret=settings.GOOGLE_API_CLIENT_SECRET,
            access_type='online',
            scope='https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            user_agent='lipstr-api/1.0',
            )

        authorize_url = flow.step1_get_authorize_url(STEP2_URI)
        
        try:
            f = FlowModel.objects.get(id=request.session.session_key)
            f.flow = flow
        except FlowModel.DoesNotExist:
            # Save the flow
            f = FlowModel(id=request.session.session_key, flow=flow)
        f.save()
        
        return HttpResponseRedirect(authorize_url)
    
def oauth2callback(request):
    
    try:
        f = FlowModel.objects.get(id=request.session.session_key)
        credential = f.flow.step2_exchange(request.REQUEST)
    except FlowModel.DoesNotExist:
        return error400(request, 'We could not sign you in, make sure you are not using an outdated link/bookmark.')
    except FlowExchangeError:
        f.delete()
        return error400(request, 'We could not sign you in, make sure you are not using an outdated link/bookmark.')
    
    #storage = Storage(CredentialsModel, 'id', request.user, 'credential')
    #storage.put(credential)
    
    # Remove the flow model
    f.delete()
    
    # Get the infos
    http = httplib2.Http()
    http = credential.authorize(http)
    service = build("oauth2", "v2", http=http)
                       
    infos = service.userinfo().get().execute()
    
    # If not verified email, do not authenticate
    if not infos.get('verified_email', False):
        return redirect('login')
    
    signup = {}
    if infos.get('given_name'): signup['firstname'] = infos.get('given_name') 
    signup['username'] = infos.get('email') 
    signup['email'] = infos.get('email') 
    
    # TODO: avatar
    #signup['avatar'] = infos.get('picture') 
    
    # If the user does not exist: create it
    try:
        user = User.objects.get(username=signup['email'])
    except User.DoesNotExist:
        user = None
    
    if not user :
        # Random 8 characters password
        signup['password'] = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        
        errors = create_account(SignupForm(signup))
        if errors: 
            return error500(request, 'There was an error signing you in, please try again later.')
           
        user = User.objects.get(username=signup['email'])
    
    # It is necessary to set the backend (done by 'authenticate' under normal circumstances)
    user.backend = 'django.contrib.auth.backends.ModelBackend'
    
    # login
    auth.login(request, user)

    return HttpResponseRedirect("/")

