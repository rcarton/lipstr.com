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
        'listId': <list id>,
        'boardId': <board id>
    }

"""
from lists.models import Item, List, Board

class ActionDoesNotExist(Exception): pass

#Permissions
class InsufficientPermissions(Exception): pass
def verify_permission(list_, user, permission='w'):
    if not list_.has_perm(user): 
        raise InsufficientPermissions

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
    item.description = action['what'].get('description', '')
    item.id = action['what']['id']
    item.position = action['what']['position']
    
    l = List.objects.get(id=action['listId'])
    verify_permission(l, user)
    
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
    verify_permission(l, user)
    
    l.remove_item(action['what']['id'])
    l.save()
    
    return l


def add_list(action, user):
    """
    Adds a list.
    
    {
        'type': 'add_list',
        'listId': <list temporary id>,
        'boardId': <board id>,
        'what': <list>
    }
    
    When a list is created on client side, a temporary id is generated (to allow
    the creation of tasks relative to this list, especially if offline).
    
    This temporary id must be replaced by the new id used in the database.
    """
    
    userprofile = user.get_profile()
    
    board = userprofile.get_board(action['boardId'])
    
    # Create the list
    l = List()
    l.title = action['what']['title']
    l.color = action['what']['color']
    l.creator = user
    l.save()
    
    # Add the list to the user's lists
    
    board.lists.append(l.id)
    userprofile.save()
    
    return l;


def rem_list(action, user):
    """
    Removes the list from the database.
    
    {
        'type': 'rem_list',
        'listId': <list id>
        'boardId': <board id>
    }
    """
    
    try:
        l = List.objects.get(id=action['listId'])
        verify_permission(l, user)
        l.delete()
        
        # Add the list to the user's lists
        userprofile = user.get_profile()
        board = userprofile.get_board(action['boardId'])
        board.lists.remove(action['listId'])
        userprofile.save()
    except:
        # the list or the board doesn't exist.
        pass
    
def edit_list(action, user):
    """
    Removes the list from the database.
    
    {
        'type': 'rename_list',
        'listId': <list id>
        'what': {
                    <attribute>: <value>
                }
    }
    """
    
    editable_attributes = ('title', 'color')
    
    l = List.objects.get(id=action['listId'])
    verify_permission(l, user)
        
    for key, value in action['what'].iteritems():
        if key in editable_attributes:
            l.__setattr__(key, value)
    l.save()
    
    return l

def edit_item(action, user):
    """
    Edits an item.
    {
        'type': 'edit_item',
        'listId': <list id>
        'what': {
                    id: <item id>,
                    <attribute>: <value>
                }
    }
    """
    def get_item(items, id):
        for item in items:
            if item.id == id:
                return item 
        raise Item.DoesNotExist()
                
    l = List.objects.get(id=action.get('listId', None))
    verify_permission(l, user)
    
    editable_attributes = ('position', 'description', 'crossed')
    
    try:
        item = get_item(l.items, action['what']['id'])
    except:
        raise Item.DoesNotExist
    
    for key, value in action['what'].iteritems():
        if key == 'id': continue
        elif key in editable_attributes:
            item.__setattr__(key, value)
    l.save()
    
    return l



def add_board(action, user):
    """
    Adds a board.
    
    {
        'type': 'add_board',
        'boardId': <board id>
    }
    
    """
    
    userprofile = user.get_profile()
    
    board = Board()
    board.title = action['what']['title']
    board.id = action['what']['id']
    userprofile.boards.append(board)
    userprofile.save()
    
    return board;

def rem_board(action, user):
    """
    Adds a board.
    
    {
        'type': 'rem_board',
        'what': {
                    id: <board id>
                }
    }
    
    """
    
    userprofile = user.get_profile()
    


    try:
        board = userprofile.get_board(action['boardId'])
        userprofile.boards.remove(board)
        userprofile.save()
    except Board.DoesNotExist:
        return


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
               'edit_list': edit_list,
               'edit_item': edit_item,
               'add_board': add_board,
               }
    
    #TODO: handle errors
    modified_lists = dict()
    tmp_id_to_new_ids = []  # [(<tmp id>, <new id>), ..]
    
    while actions:
        
        action = actions.pop(0)
        
        try:
            fn = process.get(action['type'])
            if not fn: raise ActionDoesNotExist  # the demanded action does not exist
            
            returned_list = fn(action, user)
        except (InsufficientPermissions, ActionDoesNotExist, List.DoesNotExist, Item.DoesNotExist):
            # Cannot modify this list
            # Add errors in the response
            continue
        
        # If there's a return value
        if returned_list: modified_lists[returned_list.id] = returned_list
        
        if action['type'] == 'add_list':
            # Change the temporary id to the new id in all the remaining actions
            for x in actions: 
                if x.get('listId') == action['listId']: 
                    x['listId'] = returned_list.id
            tmp_id_to_new_ids.append((action['listId'], returned_list.id))
    
    return modified_lists, tmp_id_to_new_ids
        