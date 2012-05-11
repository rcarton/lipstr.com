from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',

    url(r'^$', 'lists.views.home', name='home'),
    url('^oauth2callback$', 'google_api.views.oauth2callback', name='oauth2callback'),
    url('^oauth2$', 'google_api.views.index', name='oauth2'),
    url('^session$', 'google_api.views.get_session', name='session'),
    
    
    url(r'^', include('lipstr.lists.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    #url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    #url(r'^admin/', include(admin.site.urls)),
)
