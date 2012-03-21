"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from lists import actions
from lists.models import *
from django.contrib.auth.models import User
import time



class ListTest(TestCase):
    
    def setUp(self):
        pass
    
class ActionTest(TestCase):
    
    usertest = None
    
    # helpers
    def get_user(self):
        if not ActionTest.usertest:
            ActionTest.usertest = User()
            ActionTest.usertest.username = 'test'
            ActionTest.usertest.set_password('test')
            ActionTest.usertest.save()
        return ActionTest.usertest
        
        
    def create_list(self, user=None):
        """Creates a list and returns the _id of that list."""
        
        user = user or self.get_user()
        
        title = 'title'
        action = {
                  'listId': 'tmp_id',
                  'type': 'add_task',
                  'what': {
                           'title': title
                           }
                  }
        
        ret = actions.add_list(action, user)    # Returns the id
        return ret
    
    def test_create_list(self):
        user = self.get_user()
        title = 'title'
        action = {
                  'listId': 'tmp_id',
                  'type': 'add_task',
                  'what': {
                           'title': title
                           }
                  }
        #import pdb; pdb.set_trace()
        ret = actions.add_list(action, user)
        self.assertTrue(ret)
        self.assertEquals(List.objects.get(id=ret).title, title)
        
    def test_add_task(self):      
        listId = self.create_list()
        
        description = 'this is my task description'
        id = 'abcdefgh'
        position = int(time.time()) # we use a timestamp in the js (for now)
        
        action = {
                  'type': 'add_task',
                  'listId': listId,
                  'what': {
                           'id': id,
                           'description': description,
                           'position': position,
                           },
                  }
        
        actions.add_task(action, self.get_user())
        l = List.objects.get(id=listId)
        
        self.assertEqual(len(l.items), 1)
        
    def test_process_actions_create_list(self):
        pass


        