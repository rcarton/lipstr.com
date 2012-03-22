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
    
    # ---- helpers ----
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
        
        list = actions.add_list(action, user)    # Returns the id
        return list
    
    def add_task(self, list, description=None, id=None):
        """Adds a task to the given list."""
        from utils import get_random_string
        
        id = id or get_random_string(8)
        description = description or 'this is my task description'
        position = int(time.time()) # we use a timestamp in the js (for now)
        
        action = {
                  'type': 'add_task',
                  'listId': list.id,
                  'what': {
                           'id': id,
                           'description': description,
                           'position': position,
                           },
                  }
        
        actions.add_task(action, self.get_user())
        return id
    
    # ----
    
    
    
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
        
        list = actions.add_list(action, user)
        self.assertEquals(list.title, title)
        
    def test_add_task(self):      
        list = self.create_list()
        
        description = 'this is my task description'
        taskid = 'abcdefgh'
        position = int(time.time()) # we use a timestamp in the js (for now)
        
        action = {
                  'type': 'add_task',
                  'listId': list.id,
                  'what': {
                           'id': taskid,
                           'description': description,
                           'position': position,
                           },
                  }
        actions.add_task(action, self.get_user())
        list = List.objects.get(id=list.id)
        self.assertEqual(len(list.items), 1)
    
    def test_rem_task(self):
        list = self.create_list()
        taskid = self.add_task(list, description='coucoulol')
        list = List.objects.get(id=list.id)
        self.assertEqual(1, len(list.items))
        
        action = {
          'type': 'rem_task',
          'listId': list.id,
          'what': {
                   'id': taskid,
                   },
          }
        
        actions.rem_task(action, self.get_user())
        list = List.objects.get(id=list.id)
        self.assertEqual(0, len(list.items))
        
    def test_process_actions_create_list(self):
        pass


        