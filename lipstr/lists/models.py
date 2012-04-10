from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.utils import simplejson
from djangotoolbox.fields import ListField, EmbeddedModelField

class List(models.Model):
    """This is a generic list."""
    
    title = models.CharField(max_length=128)
    when = models.DateField(auto_now_add=True)
    creator = models.ForeignKey(User)
    items = ListField(EmbeddedModelField('Item'))
    
    def to_obj(self):
        return {
               'id': self.id,
               'title': self.title,
               'when': str(self.when),
               'creator': self.creator.id,
               'items': [item.to_obj() for item in self.items]
               }
    
    def to_json(self):
        return simplejson.dumps(self.to_obj())    
    
    @classmethod
    def get_lists_for_user(cls, user):
        userprofile = user.get_profile()
        return List.objects.filter(id__in=userprofile.lists)
    
    def remove_item(self, item_id):
        for i in xrange(len(self.items)):
            if self.items[i].id == item_id: 
                return self.items.pop(i)
        return None

class Item(models.Model):
    """This model should never be saved in a collection."""
    
    description = models.CharField(max_length=200)
    position = models.IntegerField()
    
    def to_obj(self):
        return {
                'id': self.id,
                'description': self.description,
                'position': self.position,
                }
        
    def save(self):
        raise RuntimeError('this model should not be saved.')
    
class UserProfile(models.Model):
    user = models.OneToOneField(User)
    lists = ListField(models.ForeignKey(List))

def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)
