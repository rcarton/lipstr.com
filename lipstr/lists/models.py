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
    def get_lists_for_user(cls, user, board_id=None):
        userprofile = user.get_profile()
        
        b = None
        
        # if no board name is specified, get the first
        if board_id == None:
            if len(userprofile.boards) == 0:
                b = Board()
                b.creator = user
                b.title = 'home'
                userprofile.boards.append(b)
                userprofile.save()
            else:
                b = userprofile.boards[0]
        else:
            for tmp_board in userprofile.boards:
                if tmp_board.id == board_id:
                    b = tmp_board
        
        if b == None:
            raise Board.DoesNotExist()
        
        return List.objects.filter(id__in=b.lists)
    
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

class Board(models.Model):
    title = models.CharField(max_length=50)
    creator = models.ForeignKey(User)
    lists = ListField(models.ForeignKey(List))
    
    @classmethod
    def migrate_users_to_board(cls):
        """Not needed anymore, it was to move the lists to boards."""
        
        # For each user, move the lists to a new board called 'home'
        for u in User.objects.all():
            print 'migrating %s..' % u
            userprofile = u.get_profile()
            
            if len(userprofile.boards) > 0: continue
            
            board = Board()
            board.creator = u
            board.title = 'home'
            board.lists = userprofile.lists
            
            userprofile.boards.append(board)
            userprofile.save()
    
    def save(self):
        raise RuntimeError('this model should not be saved, save the user profile.')
        
             
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
    icon = models.CharField(max_length=250, default='', null=True)
    boards = ListField(EmbeddedModelField('Board'))
    
    # Deprecated do not use - will be removed once the migration is done for all users
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
    
    def get_board(self, board_id):
        for b in self.boards:
            if b.id == board_id: return b
        raise Board.DoesNotExist()
    
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)
