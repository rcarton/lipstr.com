	
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

function initMasonry() {
	$('#list-container > ul').masonry({
		  itemSelector: 'li.list',
		  columnWidth: 360,
		  gutterWidth: 20,
		  isFitWidth: true
	});
}

function reloadMasonry() { 
	$('#list-container > ul').masonry('reload'); 
}

/**
 * action types:
 * 	- add_task
 *  - rem_task
 *  - add_list
 *  - rem_list 
 *  - edit_list
 * 
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

// add_list {type: 'add_list', what: <tasklist>}
Action.getAddTaskListAction = function(tasklist) { return new Action('add_list', tasklist.toObj(), tasklist.id); }

//rem_list {type: 'rem_list', what: <tasklist>}
Action.getRemListAction = function(list) { return new Action('rem_list', {}, list.id); }

//rename_list {type: 'edit_list', what: {title: <new title>}}
Action.getEditListAction = function(list, attribute, value) { 
	var o = {}; o[attribute] = value;
	return new Action('edit_list', o, list.id); 
}

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
	self.title = ko.observable(data.title);
	self.color = ko.observable((data.color == undefined)?'#ffffff':data.color);
	
	
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
    	return { id: self.id, title: self.title, color: self.color, list: $.map(self.items(), function(item) { return item.toObj(); }) };
    }
    self.toJSON = function() {
    	return ko.toJSON(self.toObj());
    }
    
    self.focus = function() {
    	console.log('Giving focus to '+ '[data-id=' + self.id + '] .add-task');
    	$('[data-id=' + self.id + '] .add-task').focus();
    }
    
}
/**
 * Creates a TaskList
 */
TaskList.getTaskList = function(title) {
	var data = {id: 'tmp_' + getRandomId(), title: title, color: getRandomColor(), items: new Array()};
	return new TaskList(data);
}
TaskList.focusLast = function() {
	$('.add-task').last().focus();
}
TaskList.cleanMenu = function(jObj) { jObj.find('.mask').remove(); jObj.find('.li-menu-dropdown').hide(); }
TaskList.toggleLiMenu = function(data, e) {
	
	var jTarget = $(e.currentTarget);
	var jParent = jTarget.parents('.li-wrapper');
	var menu = jTarget.find('ul');
	
	// Clean other menus
	TaskList.cleanMenu($('.li-wrapper').not(jParent));
	
	if (menu.css('display') == 'block') {
		TaskList.cleanMenu(jParent);
		return;
	}
	
	// Toggle the dropdown menu
	menu.toggle();
	e.stopPropagation();
	
	var jList = $('ul.list[data-id="' + data.id + '"]');
	// Hide the list
	var mask = document.createElement('div');
	mask.setAttribute('class', 'mask');
	mask.style.position = 'absolute';
	mask.style.top = jList.position().top + 'px';
	mask.style.left = jList.position().left + 'px';
	mask.style.width = jList.width() + 'px';
	mask.style.height = jList.height() + 'px';
	mask.style.background = 'rgba(255,255,255, 0.85)';
	mask.style.display = 'none';
	
	$(mask).css('z-index', '1');
	jParent.append(mask);
	$(mask).fadeIn(200);
}



function TaskListViewModel(id) {
	
	// Data
	var self = this;
	self.tasklists = ko.observableArray([]);
	self.actions = new Array();
	self.menu = ko.observable();
	
	initMasonry();
	
	// Methods
	self.hasAppCache = function() { return (Modernizr.localstorage && Modernizr.applicationcache && localStorage[APPLICATION_NAME] != undefined); }
    
	self.addTaskList = function() {
		
		value = prompt('Give a title to your list');
    	
    	// Error cases
    	if (value == null || value == '') return;
    	
		var tl = TaskList.getTaskList(value);
		self.tasklists.push(tl);
		self.actions.push(Action.getAddTaskListAction(tl).toObj());
		
		// Clear the field

		if (isOnline()) {
    		self.synchronizeLists(function() { tl.focus(); });
    	} else {
    		self.saveLocal();
    		tl.focus();
    	}
	}
	
	self.remList = function(list) {
		
		// Confirmation
		if (!confirm("Are you sure you want to remove the list '" + list.title() + "'?")) return;
		
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
    		self.synchronizeLists(function() { tasklist.focus(); });
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
    
    self.renameList = function(tasklist) {
    	value = prompt('Rename this list', tasklist.title());
    	
    	// Error cases
    	if (value == null || value == '') return;
    	
    	tasklist.title(value);
    	self.actions.push(Action.getEditListAction(tasklist, 'title', value).toObj());
    }
    
    self.changeListColor = function(tasklist, color) {
    	tasklist.color(color);
    	self.actions.push(Action.getEditListAction(tasklist, 'color', tasklist.color).toObj());
    	self.synchronizeOrSave()
    }
    
    self.synchronizeOrSave = function(callback) {
    	if (isOnline()) {
    		self.synchronizeLists(callback);
    	} else {
    		self.saveLocal(callback);
    	}
    }
    
    self.saveLocal = function(callback) {
    	console.log('Saving to appCache');
    	if (!Modernizr.localstorage || !Modernizr.applicationcache ) { if (callback) callback(); return false; }
    	localStorage[APPLICATION_NAME] = self.toJSON();
    	if (callback) callback();
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
		
		// Reload masonry
		reloadMasonry();
		
		// Call the callback
		if (callback) callback();
    }
    
    
	self.init();
}

// Disable the cache
$.ajaxSetup({ cache:false });

// knockoutjs magic
ko.applyBindings(new TaskListViewModel());




$(document).ready(function() {
	
	var menudd = $('#menu-dropdown');
	
	// menu
	$('#username').click(function(e) {
		if (!menudd.hasClass('active')) menudd.addClass('active');
		else { menudd.removeClass('active'); }
		e.stopPropagation();
	});
	
	
	$(document).click(function() {
		menudd.removeClass('active');
		
		// remove li-menu-dropdown and mask
		$('.li-menu-dropdown').hide();
		$('.mask').remove();
		
	});
	
});



