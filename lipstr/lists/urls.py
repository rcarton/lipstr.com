from django.conf.urls.defaults import patterns, url


urlpatterns = patterns('lists.views',
    url(r'^login$', 'login', name='login'),
    url(r'^signup$', 'signup', name='signup'),
    url(r'^logout$', 'disconnect', name='disconnect'),
    url(r'^list$', 'list', name='list'),
    url(r'^actions$', 'actions', name='actions'),
    url(r'^404$', 'error404', name='error404'),
)

