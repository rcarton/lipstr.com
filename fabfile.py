from fabric.api import *
import datetime, os

APPNAME = 'lipstr.com'
VERSION = datetime.datetime.now().strftime('%Y%m%d_%H%M')
FILENAME = '%s_%s.tar.gz' % (APPNAME, VERSION)

APPROOT = '/home/lipstr/lipstr.com'
DEVROOT = os.path.dirname(os.path.abspath(__file__))
DJANGOROOT = os.path.join(APPROOT, 'lipstr')

# the user to use for the remote commands
env.user = 'lipstr'
# the servers where the commands are executed
env.hosts = ['lipstr.com']

env.activate = 'source '+ os.path.join(APPROOT, 'bin/activate')
env.deploy_user = 'lipstr'


def up():
    pack()
    deploy()
    #update_manifest()
    collect_static()
    restart()
    clean()




def pack():
    # create a new source distribution as tarball
    with cd(DEVROOT):
        local('mkdir -p dist')
        local('tar -czf %s/dist/%s $(git ls-files)' % (DEVROOT, FILENAME), capture=False)

def deploy():
    
    # upload the source tarball to the temporary folder on the server
    with cd(DEVROOT):
        put('%s/dist/%s' % (DEVROOT, FILENAME), '/tmp/%s' % FILENAME)
        
    # create a place where we can unzip the tarball, then enter
    # that directory and unzip it
    run('rm -rf /tmp/%s && mkdir /tmp/%s' % (APPNAME, APPNAME))
    with cd('/tmp/%s' % APPNAME):
        run('tar xzf /tmp/%s' % FILENAME)
        run('cp -r /tmp/%s/* %s' % (APPNAME, APPROOT))

def update_manifest():
    run('sed -i "s/{{date}}/%s/" %s/list/static/cache.manifest' % (VERSION, APPROOT))
        
def collect_static():
    with cd(DJANGOROOT):
        with settings(warn_only=True):
            virtualenv("python manage.py collectstatic --noinput")
            
def restart():
    """Restart gunicorn."""
    with settings(warn_only=True):    
        run('kill -HUP $(cat %s/gunicorn.pid)' % APPROOT)

def stop():
    """Stops gunicorn."""
    
def clean():
    # now that all is set up, delete the folder again
    run('rm -rf /tmp/%s /tmp/%s' % (APPNAME, FILENAME))


def backup():
    backup_folder = 'backup_%s_%s' % (APPNAME, VERSION)
    run('mkdir -p /tmp/' + backup_folder)
    with cd('/tmp/%s' % backup_folder):
        run('rm -rf dump')
        run('mongodump -d lipstr')
        run('tar -czf %s_%s.tar.gz dump' % (APPNAME, VERSION))


# TOOLS 
def virtualenv(command):
    run(env.activate + ' && ' + command)
    
    
