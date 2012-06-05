from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.utils import simplejson
from djangotoolbox.fields import ListField, EmbeddedModelField
import hashlib
import urllib

class List(models.Model):
    """This is a generic list."""
    
    title = models.CharField(max_length=128)
    color = models.CharField(max_length=6)      # color: 'ffffff' for white
    when = models.DateField(auto_now_add=True)
    creator = models.ForeignKey(User)
    items = ListField(EmbeddedModelField('Item'))
    
    def to_obj(self):
        return {
               'id': self.id,
               'title': self.title,
               'color': self.color,
               'when': str(self.when),
               'creator': self.creator.id,
               'items': sorted([item.to_obj() for item in self.items], key= lambda item: item['position'])
               }
    
    def to_json(self):
        return simplejson.dumps(self.to_obj())    
    
    @classmethod
    def get_lists_for_user(cls, user):
        userprofile = user.get_profile()
        lists = List.objects.filter(id__in=userprofile.lists)
        
        ## Uncomment if I implement shared lists
        # Remove non existing lists (removed ones)
        #if len(lists) < len(userprofile.lists):
        #    
        #    found = set([l.id for l in lists])
        #    listed = set(userprofile.lists)
        #   
        #   difference = (listed - found)
        #   if len(difference): 
        #       for l in difference:
        #           userprofile.lists.remove(l)
        #       userprofile.save()
            
        return lists
    
    def remove_item(self, item_id):
        for i in xrange(len(self.items)):
            if self.items[i].id == item_id: 
                return self.items.pop(i)
        return None
    
    def has_perm(self, user, permission='w'):
        """
        Returns true if the user has the permission.
        
        Permissions: a > w > r (author/all > write > read).
        Write implies read. 
        """
        
        #TODO: r&a permission
        return (self.creator == user)
    
    
class Item(models.Model):
    """This model should never be saved in a collection."""
    
    description = models.CharField(max_length=200)
    position = models.IntegerField()
    crossed = models.BooleanField(default=False)
    
    def to_obj(self):
        return {
                'id': self.id,
                'description': self.description,
                'position': self.position,
                'crossed': self.crossed,
                }
        
    def save(self):
        raise RuntimeError('this model should not be saved.')
    
class UserProfile(models.Model):
    user = models.OneToOneField(User)
    icon = models.CharField(max_length=250, default='')
    lists = ListField(models.ForeignKey(List))
    
    def get_icon_url(self):
        email = self.user.email
        
        default = "http://lipstr.com/static/img/default_profile.png"
        size = 22
        
        if self.icon:
            icon_url = self.icon
        else:
            icon_url = "http://www.gravatar.com/avatar/" + hashlib.md5(email.lower()).hexdigest() + "?"
            icon_url += urllib.urlencode({'d':default, 's':str(size)})

        return icon_url
    
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)
