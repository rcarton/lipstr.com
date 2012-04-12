	
/**
 * 	list.js
 * 	author: Remi Carton
 *  http://troebr.net
 *  
 *  
 *  appCache storage:
 *  <APPLICATION_NAME>:
 *  	{
 *  		list: [list of <tasklist>],
 *  		actions: []
 *  	}
 *  
 *  tasklist:
 *  {
 *  	id: <id>,
 *  	title: <title>,
 *  	items: [list of <task>],
 *  	[tmp_id_replacement: <tmp id to replace>] 
 *  }
 *  
 *  task: 
 *  {
 *  	id: '<id>',
 *  	description: '<description>',
 *  	position:	'<position>'
 *  }
 *  
 */


var APPLICATION_NAME = "lipstr.com";

var DEBUG_OFFLINE = false; 


function Menu() {
	var self = this;
	self.newListText = ko.observable();
	self.obj = $('#menu');
	
	self.createList = function() {
		if (!self.newListText.length) {
			console.log('Error, the list name cannot be empty');
		}
	}
	
	self.open = function() {
		self.obj.show();
	}
	
	self.close = function() {
		self.obj.hide();
	}
	
}

function isOnline() {
	var res = (!DEBUG_OFFLINE) && navigator.onLine;
	if (!res) console.log('browser offline');
	
	return res;
}

/**
 * action types:
 * 	- add_task
 *  - rem_task
 *  - add_list
 *  - rem_list 
 * 
 * @param type
 * @param task
 */
function Action(type, what, listId) {
	var self = this;
	self.type = type;
	self.what = what
	self.listId = listId
	
	self.toObj = function() {
		return {type: self.type, what: self.what, listId: self.listId};
	}
	self.toJSON = function() {
		return ko.toJSON(self.toObj());
	}
}
/**
 * Builders
 */
// add_task {type: 'add_task', what: <task>}
Action.getAddTaskAction = function(task, listId) { return new Action('add_task', task.toObj(), listId); }

// rem_task {type: 'rem_task', what: <task>}
Action.getRemTaskAction = function(task, listId) { return new Action('rem_task', task.toObj(), listId); }

// add_list {type: 'add_list', what: <tasklist>
Action.getAddTaskListAction = function(tasklist) { return new Action('add_list', tasklist.toObj(), tasklist.id); }

//rem_list {type: 'rem_list', what: <tasklist>
Action.getRemListAction = function(list) { return new Action('rem_list', {}, list.id); }

function Task(id, description, position) {
	var self = this;
	self.id = id;
	self.description = description;
	self.position = position;
	
	self.editItem = function () {
		// Not implemented!		
		console.log("editItem(): Not implemented, I'm such a slacker.");
	} 
	
	self.toObj = function() {
		return {id: self.id, description: self.description, position: self.position};
	}
	self.toJSON = function() {
		return ko.toJSON(self.toObj());		
	}
}

function TaskList(data) {
	
	// Data
	var self = this;
	self.items = ko.observableArray([]);
	self.newTaskText = ko.observable();
	self.id = data.id;
	self.title = data.title;
	
	for (var t in data.items)
		self.items.push(new Task(data.items[t].id, data.items[t].description));
	
	
	// Operations 
    self.addTask = function() {
    	var task = new Task(getRandomId(), self.newTaskText(), getUnixTimestamp());
        self.newTaskText("");
        self.items.push(task);
        return task;
    };
    
    self.remTask = function(ptask) {
    	self.items.remove(function(task) { return task.id == ptask.id; });
    }
    
    self.toObj = function() {
    	return { id: self.id, title: self.title, list: $.map(self.items(), function(item) { return item.toObj(); }) };
    }
    self.toJSON = function() {
    	return ko.toJSON(self.toObj());
    }
    
    self.focus = function() {
    	$('[data-id=' + self.id + '] .add-task').focus();
    }
    
}
/**
 * Creates a TaskList
 */
TaskList.getTaskList = function(title) {
	var data = {id: 'tmp_' + getRandomId(), title: title, items: new Array()};
	return new TaskList(data);
}
TaskList.focusLast = function() {
	$('.add-task').last().focus();
}


function TaskListViewModel(id) {
	
	// Data
	var self = this;
	self.tasklists = ko.observableArray([]);
	self.actions = new Array();
	self.menu = ko.observable();
	
	// Methods
	
	self.hasAppCache = function() { return (Modernizr.localstorage && Modernizr.applicationcache && localStorage[APPLICATION_NAME] != undefined); }
    
	self.addTaskList = function(title) {
		var tl = TaskList.getTaskList(title);
		self.tasklists.push(tl);
		self.actions.push(Action.getAddTaskListAction(tl).toObj());
		
		// Clear the field
		$('#add-list-input').val('');
		
		
		
		if (isOnline()) {
    		self.synchronizeLists(function() { tl.focus(); });
    	} else {
    		self.saveLocal();
    		tl.focus();
    	}
	}
	
	self.remList = function(list) {
		
		// Confirmation
		if (!confirm("Are you sure you want to remove the list '" + list.title + "'?")) return;
		
		self.tasklists.remove(list);
		self.actions.push(Action.getRemListAction(list).toObj());
		
		if (isOnline()) {
    		self.synchronizeLists();
    	} else {
    		self.saveLocal();
    	}
	}
	
	self.addTask = function(tasklist) {
    	var task = tasklist.addTask();
    	self.actions.push(Action.getAddTaskAction(task, tasklist.id).toObj());
    	
    	if (isOnline()) {
    		self.synchronizeLists(tasklist.focus);
    	} else {
    		self.saveLocal();
    	}
    	
    };
    
	self.remTask = function(tasklist, task) {
    	tasklist.remTask(task);
    	self.actions.push(Action.getRemTaskAction(task, tasklist.id).toObj());
    	
    	if (isOnline()) {
    		self.synchronizeLists();
    	} else {
    		self.saveLocal();
    	}
    	
    };
    
    self.saveLocal = function() {
    	console.log('Saving to appCache');
    	if (!Modernizr.localstorage || !Modernizr.applicationcache ) { return false; }
    	localStorage[APPLICATION_NAME] = self.toJSON();
        return true;
    }
    
    self.toJSON = function() {
    	// Ok that's not very readable, but it makes a nice json array called data out of the tasklists.
    	return ko.toJSON({ 
    			items: $.map(self.tasklists(), function(item) { return item.toObj(); }),
    			actions: self.actions
    	});
    }   
    
    self.init = function() {
		
    	// Get the unprocessed actions
    	if (self.hasAppCache()) {
    		self.actions = $.parseJSON(localStorage[APPLICATION_NAME])['actions'] || [];
    	}
    	
    	// Set the menu
    	self.menu(new Menu());
    	
    	if (isOnline()) {
    		// If online, synchronize
    		self.synchronizeLists();
    		
    	} else {
    		// If offline, get the data from local storage
    		if (self.hasAppCache()) {
    			console.log("retrieving lists from appCache");
    			var tl = $.parseJSON(localStorage[APPLICATION_NAME])['list'];
    			for (var i in tl) {
    				self.tasklists.push(new TaskList(tl[i]));
    			}
    		}
    	}
    	
    }

    /**
     * Get all the lists from the server
     */
	self.getLists = function(callback) {
		
		console.log("Retrieving list");
		
    	// Retrieve the latest list of tasklists from the server
		$.get('/list', {}, function(data){ 
			self.updateListsFromResponse(data, callback);
			
			// Focus
			// TaskList.focusLast();
			
			if (callback) callback();
			
		});	
	};
    
    /**
     * For every list in the appCache, see if there is an action log,
     * and upload it to the server, then get the updated lists
     */ 
    self.synchronizeLists = function(callback) {	
    	
    	console.log('Synchronizing lists');
    	
		if (self.actions.length > 0) {
			
            $.ajax("/actions", {
                data: ko.toJSON({actions: self.actions}),
                type: 'POST', contentType: "application/json",
                success: function(data) {

                	// Clean up the actions
                	self.actions = [];
                	
    				self.updateListsFromResponse(data, callback);
                },
                error: function(data, status) {
                	console.log('Error while synchronizing list: ' + status);
                }
            }); 
    	} else {
    		self.getLists(callback);
    	}
		
		// Save the brand new model
		
    }
    
    /**
     * Update the existing lists, add the new one.
     */
    self.updateListsFromResponse = function(response, callback) {
		for (var i in response) {
			
			var found = false;
			for (var tl in self.tasklists()) {
				
				// Tmp id replacement
				if (self.tasklists()[tl]['id'] == response[i]['tmp_id_replacement']) {
					self.tasklists()[tl]['id'] = response[i]['id'];
				}
				
				// Replace the list
				if (self.tasklists()[tl]['id'] == response[i]['id']) {
					self.tasklists.replace(self.tasklists()[tl], new TaskList(response[i]));
					found = true;
					break;
				}
			}
			
			// This list isn't in the model
			if (found == false) {
				self.tasklists.push(new TaskList(response[i]));
			}
		}
		
		// save it
		self.saveLocal();
		
		// Call the callback
		if (callback) callback();
    }
    
	self.init();
}


ko.applyBindings(new TaskListViewModel());



