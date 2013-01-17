	
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

var COLUMNWIDTH = 360;
var GUTTERWIDTH = 20;

function cleanOldLists() {
	for (var id in localStorage) {
		if (id.substr(0, 15) == "masonry-layout-") {
			var boardid = id.substr(15);
			var found = false;
			for (var i in BOARDS) { if (BOARDS[i] == boardid) { found = true; break; }}
			if (!found) { localStorage.removeItem("masonry-layout-" + boardid); }
		}
	}
}

function getCurrentBoard() {
	if (TaskListViewModel.instance) {
		return TaskListViewModel.instance.currentBoard();
	}
	
	return BOARDS[0];
}

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
	
	var options = {
					  itemSelector: 'li.list',
					  columnWidth: COLUMNWIDTH,
					  gutterWidth: GUTTERWIDTH,
					  isFitWidth: true
				  };
	
	// Use a previously saved layout if there is one
	//if (Modernizr.localstorage && Modernizr.applicationcache && localStorage['masonry-layout'] != undefined) {
	if (localStorage['masonry-layout-'+getCurrentBoard()] != undefined) {
		options['layout'] = $.parseJSON(localStorage['masonry-layout-'+getCurrentBoard()]);
	}
	
	$('#list-container > ul').masonry(options);
}

function saveMasonry() {
	$('#list-container > ul').masonry('saveLayout', getCurrentBoard()); 
}
function reloadMasonry() {
	var options = {};
	if (localStorage['masonry-layout-'+getCurrentBoard()] != undefined) {
		options['layout'] = $.parseJSON(localStorage['masonry-layout-'+getCurrentBoard()]);
	}
	$('#list-container > ul').masonry(options);
	$('#list-container > ul').masonry('reload'); 
	$('#list-container > ul').masonry('saveLayout', getCurrentBoard()); 
}

/**
 * action types:
 * 	- add_task
 *  - rem_task
 *  - edit_item
 *  - add_list
 *  - rem_list 
 *  - edit_list
 *  - add_board
 *  - edit_board
 *  - rem_board
 * 
 */
function Action(type, what, listId, boardId) {
	var self = this;
	self.type = type;
	self.what = what
	self.listId = listId
	self.boardId = boardId?boardId:TaskListViewModel.instance.currentBoard();
	
	self.toObj = function() {
		return {type: self.type, what: self.what, listId: self.listId, boardId: self.boardId};
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

//edit_item {type: 'edit_item', what: {<attribute>: <new value>}}
Action.getEditItemAction = function(item, listId, attributes) { 
	var o = {};
	o['id'] = item.id;
	for (k in attributes) {
		o[k] = attributes[k];
	}
	return new Action('edit_item', o, listId); 
}

// add_list {type: 'add_list', what: <tasklist>}
Action.getAddTaskListAction = function(tasklist) { return new Action('add_list', tasklist.toObj(), tasklist.id); }

//move_list {type: 'move_list', what: <boardId>}
Action.getMoveListAction = function(list, boardId) { return new Action('move_list', { newBoardId: boardId }, list.id); }

//rem_list {type: 'rem_list', what: <tasklist>}
Action.getRemListAction = function(list) { return new Action('rem_list', {}, list.id); }

//edit_list {type: 'edit_list', what: {<attribute>: <new value>}}
Action.getEditListAction = function(list, attributes) { 
	var o = {};
	for (k in attributes) {
		o[k] = attributes[k];
	}
		
	return new Action('edit_list', o, list.id); 
}

//add_board {type: 'add_board', what: {<attribute>: <new value>}}
Action.getAddBoardAction = function(id, title) { return new Action('add_board', {id: id, title: title}); }
Action.getRemBoardAction = function(id) { return new Action('rem_board', {}, '', id); }
Action.getEditBoardAction = function(board, attributes) { 
	var o = {};
	for (k in attributes) {
		o[k] = attributes[k];
	}
		
	return new Action('edit_board', o, '', board.id); 
}


function Task(id, description, position, crossed) {
	var self = this;
	self.id = id;
	self.description = ko.observable(description);
	self.position = position;
	self.crossed = ko.observable(crossed)
	
    self.editItem = function(tasklist) {
    	var editItemDiv = $('#item-edit');
    	// Display modal mask
    	var mask = showMask();
    	
    	var discard = function() { $(mask).off('click.editItem'); hideMask(); editItemDiv.hide(); }
    	
    	// Triggered when save is clicked
    	var saveFn = function() { 
    		if (self.description() != editItemDiv.find('[data-property="description"]').val()) {
    			self.description(editItemDiv.find('[data-property="description"]').val());
    		}
    		
    		TaskListViewModel.instance.actions.push(Action.getEditItemAction(self, tasklist.id, { description: self.description }).toObj());
			TaskListViewModel.instance.synchronizeOrSave();
			
    		discard(); 
    	}
    	
    	var cancelFn = function() { discard(); }
    	
    	// When the mask is clicked discard the edit list window
    	$(mask).on('click.editItem', discard);
    	
    	editItemDiv.find('[data-property="description"]').val(self.description());
    	
    	editItemDiv.on('keyup.editItem', function(event){
    	    if(event.keyCode == 13){
    	    	editItemDiv.find('input[value="save"]').trigger('click');
    	    }
    	});
    	
    	editItemDiv.find('input[value="save"]').off('click.editItem').on('click.editItem', saveFn);
    	editItemDiv.find('input[value="cancel"]').off('click.editItem').on('click.editItem', cancelFn);
    	
    	editItemDiv.attr('data-itemId', self.id);
    	editItemDiv.show();	
    	editItemDiv.find('[data-property="description"]').focus();
    }
	
    self.editAttribute = function(tasklist, attr, newValue) {
    	
    	if (typeof self[attr] === 'function') { self[attr](newValue); } 	// observable
    	else if (typeof self[attr] === 'undefined') { return; } 		// undefined
    	else { self[attr] = newValue; } 								// normal attribute
    	
    	var o = {};
    	o[attr] = newValue;
    	TaskListViewModel.instance.actions.push(Action.getEditItemAction(self, tasklist.id, o).toObj());
		TaskListViewModel.instance.synchronizeOrSave(true);
    } 
    
	self.toObj = function() {
		return {id: self.id, description: self.description(), position: self.position, crossed: self.crossed()};
	}
	self.toJSON = function() {
		return ko.toJSON(self.toObj());		
	}
}
Task.clone = function (task) {
	return new Task(getRandomId(), task.description(), task.position, task.crossed());
}

/**
 * An Item is a Task, same thing, but I'm renaming Task to Item.
 */
function TaskList(data) {
	
	// Data
	var self = this;
	self.items = ko.observableArray([]);
	self.newTaskText = ko.observable();
	self.id = data.id;
	self.title = ko.observable(data.title);
	self.color = ko.observable((data.color == undefined)?'#ffffff':data.color);
	self.collapse = ko.observable((data.collapse == undefined)?false:data.collapse);
	
	
	for (var t in data.items)
		self.items.push(new Task(data.items[t].id, data.items[t].description, data.items[t].position, data.items[t].crossed));
	
	// Utils
	
	// Returns undefined if not found
	self.getItemFromId = function(itemId) {
		for (var i in self.items()) {
			if (self.items()[i]['id'] == itemId) {
				return self.items()[i];
			}
		}
		return undefined;
	};
	
	// Operations 
    self.addTask = function() {
    	var task = new Task(getRandomId(), self.newTaskText(), getUnixTimestamp(), false);
        self.newTaskText("");
        self.items.push(task);
        return task;
    };
    
    self.addCustomTask = function(task) {
    	var i = 0;
    	var found = false;
    	//find the index of the first item with a bigger position score
    	for(i in self.items()) {
    		if (self.items()[i]['position'] > task['position']) {
    			found = true;
    			break;
    		}
    	}
    	
    	if (found) {
    		//insert task at the right position
    		self.items.splice(i, 0, task);    		
    	} else {
    		self.items.push(task);
    	}
    	
    	return task;
    }
    
    self.remTask = function(ptask) {
    	self.items.remove(function(task) { return task.id == ptask.id; });
    };
    
    self.sort = function() {
    	self.items.sort(function(left, right) { 
    		return left.position == right.position ? 0 : (left.position < right.position ? -1 : 1);
		});
    };
    
    /**
     * Collapses or uncollapses the list
     */
    self.toggleCollapse = function() {
    	self.collapse(!self.collapse());
		TaskListViewModel.instance.actions.push(Action.getEditListAction(self, {collapse: self.collapse()}).toObj());
		TaskListViewModel.instance.synchronizeOrSave();
    };
    
    self.editList = function() {
    	var editListDiv = $('#list-edit');
    	// Display modal mask
    	var mask = showMask();
    	
    	var discard = function() { $(mask).off('click.editList'); hideMask(); editListDiv.hide(); }
    	
    	// Triggered when save is clicked
    	var saveFn = function() { 
    		var changed = {};
    		var somethingHasChanged = false;
    		editListDiv.find('input[data-property]').each(function() {
    			var oldValue = self[$(this).attr("data-property")].call();
    			var newValue = $(this).val()
    			if (oldValue != newValue) {
    				changed[$(this).attr("data-property")] = newValue;
    				
    				// Change the value in the current object		
    				if (typeof self[$(this).attr("data-property")] === 'function') { self[$(this).attr("data-property")](newValue); } 	// observable
    		    	else if (typeof self[$(this).attr("data-property")] === 'undefined') { return; } 		// undefined
    		    	else { self[$(this).attr("data-property")] = newValue; } 								// normal attribute
    				
    				somethingHasChanged = true;
    			}
    		});
    		
    		if (somethingHasChanged) {
    			TaskListViewModel.instance.actions.push(Action.getEditListAction(self, changed).toObj());
    			TaskListViewModel.instance.synchronizeOrSave();
    		}
    		discard(); 
    	}
    	
    	var cancelFn = function() { discard(); }
    	
    	// When the mask is clicked discard the edit list window
    	$(mask).on('click.editList', discard);
    	
    	editListDiv.find('[data-property="title"]').val(self.title());
    	
    	// TODO: fix spectrum(?) bug: when the color is #000000 everything breaks.
    	// Color picker
    	editListDiv.find('[data-property="color"]').spectrum({
    		color: self.color(),
    		chooseText: 'ok'
    	}).val(self.color());
    	
    	editListDiv.off('keyup.editList').on('keyup.editList', function(event){
    	    if(event.keyCode == 13){
    	    	editListDiv.find('input[value="save"]').trigger('click');
    	    }
    	});
    	
    	editListDiv.find('input[value="save"]').off('click.editList').on('click.editList', saveFn);
    	editListDiv.find('input[value="cancel"]').off('click.editList').on('click.editList', cancelFn);
    	
    	editListDiv.attr('data-listId', self.id);
    	editListDiv.show();	
    };
    
    self.toggleLiMenu = function(data, e) {
    	
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
    	
    	var jList = $('ul.list-inner[data-id="' + data.id + '"]');
    	
    	var hideList = function() {
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
    	};
    	
    	// Mask the list if it is not collapsed only
    	if (!self.collapse()) { hideList(); }

    };
    
    self.toObj = function() {
    	return { id: self.id, title: self.title, color: self.color, list: $.map(self.items(), function(item) { return item.toObj(); }) };
    };
    self.toJSON = function() {
    	return ko.toJSON(self.toObj());
    };
    
    self.focus = function() {
    	$('[data-id=' + self.id + '] .add-task').focus();
    };
    
}
/**
 * Creates a TaskList
 */
TaskList.getTaskList = function(title) {
	var data = {id: 'tmp_' + getRandomId(), title: title, color: getRandomColor(), items: new Array()};
	return new TaskList(data);
};
TaskList.focusLast = function() {
	$('.add-task').last().focus();
};
TaskList.cleanMenu = function(jObj) { jObj.find('.mask').remove(); jObj.find('.li-menu-dropdown').hide(); };


function Board(id, title) {
	var self = this;
	self.id = id;
	self.title = ko.observable(title);
	
	self.titleDisplayed = ko.computed(function() {
        return self.title() + '<b class=\"caret\"></b>';
    }, this);
	
	self.renameBoard = function() {
		var value = prompt('Give a new name to your board');
    	
    	// Error cases
    	if (value == null || value == '') return;
    	
    	self.title(value);
    	
    	var tlm = TaskListViewModel.instance;
		tlm.actions.push(Action.getEditBoardAction(self, {title: self.title()}).toObj());
		tlm.synchronizeOrSave();

	}
	
	self.deleteBoard = function() { 
		// Confirmation
		if (!confirm("Are you sure you want to remove the board '" + self.title() + "'?")) return;
		var tlm = TaskListViewModel.instance;
		
		// If it's the last board don't remove it (todo: default thing to display when there is no board?)
		if (tlm.boards().length == 1) {
			alert("You can't remove your last board (yet, I need to put something in place).");
			return;
		}
		
		// Remove from the list of boards
		tlm.boards.remove(self);
		
		tlm.actions.push(Action.getRemBoardAction(self.id).toObj());

		// Select the first board
		tlm.switchBoard(tlm.boards()[0].id);
		
		// TODO: find out why the lists aren't updated
	}

}

Board.addBoard = function() {
	var title = prompt('Give a title to your board');
	
	// Error cases
	if (title == null || title == '') return;
	
	var id = getRandomId();
	var board = new Board(id, title);
	
	var tlm = TaskListViewModel.instance;
	tlm.actions.push(Action.getAddBoardAction(id, title).toObj());
	
	tlm.boards.push(board);
	
	// switchBoard synchronizes, no need to call it again
	tlm.switchBoard(board.id);
}



function TaskListViewModel(id) {
	
	// Data
	var self = this;
	self.tasklists = ko.observableArray([]);
	self.actions = new Array();
	self.menu = ko.observable();
	self.currentBoard = ko.observable();
	self.boards = ko.observableArray([]);
	
	var delayedSynchronizeTimer;
	
	initMasonry();
	
	
	// Methods
	self.hasAppCache = function() { return (Modernizr.localstorage && Modernizr.applicationcache && localStorage[APPLICATION_NAME] != undefined); }
	//self.hasAppCache = function() { return (localStorage[APPLICATION_NAME] != undefined); }
	
    
	self.addTaskList = function() {
		
		var value = prompt('Give a title to your list');
    	
    	// Error cases
    	if (value == null || value == '') return;
    	
		var tl = TaskList.getTaskList(value);
		self.tasklists.push(tl);
		self.actions.push(Action.getAddTaskListAction(tl, self.currentBoard()).toObj());

		if (isOnline()) {
    		self.synchronizeLists(function() { tl.focus(); });
    	} else {
    		self.saveLocal();
    		tl.focus();
    	}
	};
	
	/**
	 * Moves a list to a new board
	 */
	self.moveList = function(list, boardId) {
		console.log('moving list ' + list.id + ' to board' + boardId);
		
		self.tasklists.remove(list);
		self.actions.push(Action.getMoveListAction(list, boardId).toObj());
		
		self.synchronizeOrSave();
	};
	
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
	
	self.addTask = function(tasklist, task) {
		
		// do not add empty tasks
		if (!tasklist.newTaskText()) return;
    	if (!task) task = tasklist.addTask();
    	
    	self.actions.push(Action.getAddTaskAction(task, tasklist.id).toObj());
    	
    	if (isOnline()) {
    		self.synchronizeLists(function() { tasklist.focus(); });
    	} else {
    		self.saveLocal();
    	}
    	
    };
    
    //TODO: remove != done
	self.remTask = function(tasklist, task) {
    	tasklist.remTask(task);
    	self.actions.push(Action.getRemTaskAction(task, tasklist.id).toObj());
    	
    	if (isOnline()) {
    		self.synchronizeLists();
    	} else {
    		self.saveLocal();
    	}
    	
    };
    
    self.synchronizeOrSave = function(delay, callback) {
    	
    	if (isOnline()) {
    		if (delay) self.delayedSynchronizeLists(callback);
    		else self.synchronizeLists(callback);
    	} else {
    		self.saveLocal(callback);
    		reloadMasonry();
    	}
    }
    
    self.saveLocal = function(callback) {
    	console.log('Saving to appCache');
    	//if (!Modernizr.localstorage || !Modernizr.applicationcache ) { if (callback) callback(); return false; }
    	localStorage[APPLICATION_NAME] = self.toJSON();
    	if (callback) callback();
        return true;
    }
    
    // Returns the local TaskList from the id, undefined if not found
    self.getLocalListFromId = function(listId) {
    	
    	for (var i in self.tasklists()) {
    		if (self.tasklists()[i]['id'] == listId) {
    			return self.tasklists()[i];
    		}
    	}
    	return undefined;
    }
    
    self.moveItem = function(item, originList, destList, position) {
    	
    	if (!position) position = getUnixTimestamp();
    	
    	if (originList != destList) {
        	// Create item
        	var newItem = Task.clone(item);
        	newItem.position = position;
        	
        	// Insert item in the list
        	destList.addCustomTask(newItem);
        	self.actions.push(Action.getAddTaskAction(newItem, destList.id).toObj());
        	
        	// Remove origin item
        	originList.remTask(item);
        	self.actions.push(Action.getRemTaskAction(item, originList.id).toObj());
    	} else {
    		
    		// Moving the item in the same list, edit position
    		item.position = position;
    		self.actions.push(Action.getEditItemAction(item, originList.id, {position: position}).toObj());
    		
    		// Sort the list in place
    		originList.sort();
    	}

    	
    	// Save
    	self.synchronizeOrSave();
    }
    
    self.switchBoard = function(boardId) {
    	self.currentBoard(boardId);
    	self.tasklists.removeAll();
    	self.synchronizeLists();
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
		var data = {};
		if (self.currentBoard()) data['b'] = self.currentBoard();
		
    	// Retrieve the latest list of tasklists from the server
		$.get('/list', data, function(data){ 
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
                	reloadMasonry();
                }
            }); 
    	} else {
    		self.getLists(callback);
    	}
		
		// Save the brand new model
		
    }
    
    /**
     * Delayed synchronize lists: groups events before synchronizing
     */
    self.delayedSynchronizeLists = function(callback) {
    	
    	if (delayedSynchronizeTimer) {
			window.clearTimeout(delayedSynchronizeTimer);
    	}
    	
    	delayedSynchronizeTimer = window.setTimeout(function() { 
				self.synchronizeLists(callback);
			}, 500);
    	
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

//knockoutjs magic
TaskListViewModel.instance = new TaskListViewModel();
ko.applyBindings(TaskListViewModel.instance);


$(document).ready(function() {
	cleanOldLists();
});

