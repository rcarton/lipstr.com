

function TaskDND(obj, model, list, item) {
	
	var self = this;
	var mouseOffsetX = 10;
	var mouseOffsetY = 5;
	var lists = $('li.list');
	var listitems = $('ul.list-inner li');
	
	// Knockoutjs objects
	self.model = model;
	self.item = item;
	self.list = list;
	
	// Mouseover these elements
	self.listover = null;
	self.itemover = null;
	
	self.obj = obj;
	self.jobj = $(obj);
		
	self.drag = function(){
		
		// Create the flying object
		self.createTaskNode();
		
		$(document).on('mouseup.TaskDND', self.drop);
		$(document).on('mousemove.TaskDND', self.mousemove);
		
		// Store the list if we are over one.
		lists.on('mouseover.taskDND', function(e) { self.listover = e.currentTarget; });
		lists.on('mouseleave.taskDND', function(e) { self.listover = null; });
		
		// Same for items, but we have to add a mouseup handler event
		listitems.on('mouseover.taskDND mousemove.taskDND', function(e) {
			if(!$(this).hasClass('dndover')) $(this).addClass('dndover');
			self.itemover = e.currentTarget;
			
			// We have to attach it to list items (again) because mouseup is attached by 
			// robertclick, and prevented from bubbling
			$(this).on('mouseup.taskDND', function(e) { 
				self.drop(); 
			});
			
			// I need to bind mousemove once for the case when the dragclick event
			// starts on another item, the mouseover is not fired for that item until
			// we reenter it. Mousemove is used for that first item and then unbound everywhere.
			listitems.off('mousemove.taskDND');
		});
		

		listitems.on('mouseleave.taskDND', function(e) {
			$(this).removeClass('dndover');
			$(this).off('mouseup.taskDND');
			self.itemover = null;
		});

	}
	
	self.drop = function(e) {
		
		var listSelectedId, itemSelectedId;
		var position = getUnixTimestamp();
		
		// Clear all the event handlers
		self.clear();
		
		// Handle the drop business
		if (self.itemover != null) {
			var jItemObj = $(self.itemover);
			itemSelectedId = jItemObj.attr('data-id');
			listSelectedId = (self.listover != null)?$(self.listover).attr('data-id'):jItemObj.parent().attr('data-id');
			
			// Drop in place
			if (itemSelectedId == self.item.id && listSelectedId == self.list.id) { return; }
			
		} else if (self.listover) {
			listSelectedId = $(self.listover).attr('data-id');
		} else {
			console.log('invalid drop');
			return;
		}
		
		// Get the destination list
		var destListModel = self.model.getLocalListFromId(listSelectedId);
		if (destListModel == undefined) { console.log('destination list not found, invalid drop'); return; }
		
		
		if (itemSelectedId) {
			var destItemModel = destListModel.getItemFromId(itemSelectedId);
			if (destItemModel == undefined) { console.log('destination item not found'); }
			else {
				position = destItemModel['position'] - 1;
			}
			
		} 
		
		self.model.moveItem(self.item, self.list, destListModel, position);
		
		
	}
	
	self.mousemove = function(e) {
		$(self.node).css('left', e.pageX + mouseOffsetX + 'px');
		$(self.node).css('top', e.pageY + mouseOffsetY + 'px');
	}
	
	/**
	 * Reset everything
	 */
	self.clear = function (e) {
		$(document).off('mousemove.TaskDND mouseup.TaskDND');
		lists.off('mouseover.taskDND mouseleave.taskDND');
		listitems.off('mouseover.taskDND mouseleave.taskDND mouseup.taskDND');
		$('.dndover').removeClass('dndover');
		$(self.node).remove();
	}
	
	self.createTaskNode = function() {
		
		self.node = document.createElement('div');
		self.node.innerHtml = self.obj.innerHtml;
		self.node.appendChild(self.node.ownerDocument.createTextNode(self.jobj.text()));
		
		// style
		self.node.style.backgroundColor = 'white';
		self.node.style.position = 'absolute';
		self.node.style.width = self.jobj.width() + 'px';
		self.node.style.height = self.jobj.height() + 'px';
		self.node.style.lineHeight = '13px';
		self.node.style.fontSize = '11px';
		self.node.style.opacity = '0.7';		
		self.node.style.padding = self.jobj.css('padding');		
		self.node.style.left = self.jobj.offset().left + 'px'; 
		self.node.style.top = self.jobj.offset().top + 'px'; 
		
		// If if ever want to drag the element under the cursor, this should prevent the dragged div
		// from preventing to 'see' what's underneath the cursor.
		//pointer-events:none;
		
		$(document.body).append(self.node);
	}
	
	
	
};