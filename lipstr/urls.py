from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',

    url(r'^$', 'lists.views.home', name='home'),
    url('^oauth2callback$', 'google_api.views.oauth2callback', name='oauth2callback'),
    url('^oauth2$', 'google_api.views.index', name='oauth2'),
    url('^session$', 'google_api.views.get_session', name='session'),
    url(r'^lost-password/$', 
        'django.contrib.auth.views.password_reset', 
        { 'template_name': 'lost_password.html', 'from_email': 'noreply@lipstr.com'}, name='lost_password'),
    url(r'^lost-password-done/$', 'django.contrib.auth.views.password_reset_done', {'template_name': 'lost_password_done.html'}, name='lost_password_done'),
    url(r'^lost-password-confirm/(?P<uidb64>[0-9A-Za-z]+)-(?P<token>.+)/$', 
        'django.contrib.auth.views.password_reset_confirm', {'template_name': 'lost_password_reset_confirm.html', 'post_reset_redirect' : '/' }),
    url(r'^', include('lipstr.lists.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    #url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    #url(r'^admin/', include(admin.site.urls)),
)
