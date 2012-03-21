"""

Actions
=======

This class processes the actions received, actions are used to track 
user actions on the lists, and allow offline interactions.

They are transfered in order, and structured as a json object/dict.

Action structure:

    {
        'type':    <action type>,
        'what':    <action data>,
        ['listId': <list id>]
    }

"""


from models import *


def add_task(action, user):
    """
    Adds a task.
    
    {
        'type': 'add_task',
        'listId': <list temporary id>,
        'what': <item>
    }
    """
    item = Item()
    item.description = action['what']['description']
    item.id = action['what']['id']
    item.position = action['what']['position']
    
    l = List.objects.get(id=action['listId'])
    l.items.append(item)
    l.save()
    
def rem_task(action, user):
    raise NotImplementedError


def add_list(action, user):
    """
    Adds a list.
    
    {
        'type': 'add_list',
        'listId': <list temporary id>,
        'what': <list>
    }
    """
    
    # Create the list
    l = List()
    l.title = action['what']['title']
    l.creator = user
    l.save()
    
    # Add the list to the user's lists
    userprofile = user.get_profile()
    userprofile.lists.append(l.id)
    userprofile.save()
    
    return l.id;


def rem_list(action, user):
    raise NotImplementedError


def process_actions(actions, user):
    """
    Processes the actions.
    
    returns all the modified lists.
    """
    
    process = {
               'add_task': add_task,
               'rem_task': rem_task,
               'add_list': add_list,
               'rem_list': rem_list,
               }
    
    #TODO: handle errors
    modified_lists = set()
    while actions:
        action = actions.pop(0)
        ret = process.get(action['type'])(action, user)
        
        # If there's a return value
        if ret: modified_lists.add(ret)
        
        if action['type'] == 'add_list':
            # Change the temporary id to the new id in all the remaining actions
            for x in actions: 
                if x.get('listId') == action['listId']: 
                    x['listId'] = ret
    
        