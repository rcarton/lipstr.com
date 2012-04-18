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
        'listId': <list id>
    }

"""
from lists.models import Item, List




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
    
    return l
    
def rem_task(action, user):
    """
    Removes a task.
    
    {
        'type': 'rem_task',
        'listId': <list temporary id>,
        'what': <item>
    }
    """
    
    l = List.objects.get(id=action['listId'])
    l.remove_item(action['what']['id'])
    l.save()
    
    return l


def add_list(action, user):
    """
    Adds a list.
    
    {
        'type': 'add_list',
        'listId': <list temporary id>,
        'what': <list>
    }
    
    When a list is created on client side, a temporary id is generated (to allow
    the creation of tasks relative to this list, especially if offline).
    
    This temporary id must be replaced by the new id used in the database.
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
    
    return l;


def rem_list(action, user):
    """
    Removes the list from the database.
    
    {
        'type': 'rem_list',
        'listId': <list id>
    }
    """
    
    try:
        l = List.objects.get(id=action['listId'])
        l.delete()
        
        # Add the list to the user's lists
        userprofile = user.get_profile()
        userprofile.lists.remove(action['listId'])
        userprofile.save()
    except:
        # the list doesn't exist.
        pass
    

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
    tmp_id_to_new_ids = []  # [(<tmp id>, <new id>), ..]
    
    while actions:
        
        #TODO: verify that the user is allowed to modify that list
        
        action = actions.pop(0)
        returned_list = process.get(action['type'])(action, user)
        
        # If there's a return value
        if returned_list: modified_lists.add(returned_list)
        
        if action['type'] == 'add_list':
            # Change the temporary id to the new id in all the remaining actions
            for x in actions: 
                if x.get('listId') == action['listId']: 
                    x['listId'] = returned_list.id
            tmp_id_to_new_ids.append((action['listId'], returned_list.id))
    
    return modified_lists, tmp_id_to_new_ids
        