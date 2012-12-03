

/**
 * Drag and drop a list onto a different place on the board or move to a new board
 * @param obj
 * @param model
 * @param list
 */
function ListDND(obj, model, list) {
	var self = this;
	var lists = $('li.list');
	var listitems = $('ul.list-inner li');
	
	self.model = model;
	self.list = list;
	self.obj = $(obj).closest('li.list');
	self.$masonry = $('#list-container > ul');
	self.instance = $.data(self.$masonry[0], 'masonry');
	
	// Offsets for drag and drop
	self.mouseOffsetX = 0;
	self.mouseOffsetY = 0;
	
	// Column where the block to move is
	self.originCol =  Math.max(0, Math.floor(($(obj).offset().left-self.obj.parent().offset().left)/self.instance.columnWidth))
	self.destinationCol = -1;
	self.destinationPos = -1;
	
	// boards
	self.boards = $('#board-list li');
	self.boardover = null;
	self.onNavBar = false;
	
	self.drag = function() {
		
		// Remove the object from the groupBlocks
		self.removeFromColBricks();
		
		// Board drop
		self.boards.not('.active').on('mouseenter.ListDND', function(e) {
			self.boardover = e.currentTarget; 
			$(self.boardover).find('a').addClass('board-drop');
			self.obj.find('.board-icon').addClass('board-over');
		});
		
		self.boards.not('.active').on('mouseleave.ListDND', function(e) {
			$(self.boardover).find('a').removeClass('board-drop');
			self.boardover = null; 
			self.obj.find('.board-icon').removeClass('board-over');
		});
		
		$('.navbar').on('mouseenter.ListDND', function(e) { self.obj.addClass('dragged-over-navbar'); self.onNavBar = true; });
		$('.navbar').on('mouseleave.ListDND', function(e) { self.obj.removeClass('dragged-over-navbar'); self.onNavBar = false; });
		
		self.createBoardIcon();
		
		$(document).on('mousemove.ListDND', function(e) {
			// Show the placeholder only if the cursor is not over the navbar
			if (!self.onNavBar) {
				self.showPlaceholder(e);
			}
			self.followPointer(e); 
		});
		
		$(document).on('mouseup.ListDND', self.drop);	
		
		$(self.obj).addClass('dragged');
	};
	
	self.drop = function(e) {
		
		
		if (self.boardover) {
			// Move the list from the current board to the new one
			var boardId = $(self.boardover).find('a').attr('data-board-id');
			
			// Add to the new board
			self.model.moveList(self.list, boardId);
			
			self.clear();
		} else {
			// Add it at the right place and save the board layout (nothing to save server side)
			self.clear();
			self.instance.colBricks[self.destinationCol].splice(self.destinationPos, 0, self.obj);
			
			$('#list-container > ul').masonry('saveLayout', getCurrentBoard()); 
			$('#list-container > ul').masonry('reload'); 
		}
		
	};
	
	self.clear = function() {
		
		$(document).off('mousemove.ListDND mouseup.ListDND');
		$('.navbar').off('mouseenter.ListDND mouseleave.ListDND');
		self.boards.not('.active').find('a').off('mouseenter.ListDND mouseleave.ListDND').removeClass('board-drop');
		self.obj.find('.board-icon').remove();
		self.obj.removeClass('dragged-over-navbar');
		
		// Remove the placeholder and replace all the blocks
		$('.after-placeholder').each(function() {
			$(this).removeClass('after-placeholder');
			$(this).css('top', $(this).position().top - $('#block-placeholder').outerHeight(true) + 'px');
		});
		$('#block-placeholder').remove();
		$(self.obj).css('z-index', 100);
		$(self.obj).removeClass('dragged');
	};
	
	self.followPointer = function(e) {
		self.mouseOffsetX = self.mouseOffsetX || $(self.obj).position().left - e.pageX;
		self.mouseOffsetY = self.mouseOffsetY || $(self.obj).position().top - e.pageY;
		
		//console.log('top: '+ $(self.obj).position().top + 'mouse: ' + e.pageY + 'offset: ' + self.mouseOffsetY);
		
		$(self.obj).css('left', e.pageX + self.mouseOffsetX + 'px');
		$(self.obj).css('top', e.pageY + self.mouseOffsetY + 'px')
		$(self.obj).css('z-index', 206);	
	};
	
	self.removeFromColBricks = function() {
		var i=0, len = self.instance.colBricks[self.originCol].length;
		for (; i<len; i++) {
			if (self.instance.colBricks[self.originCol][i].attr('data-id') == $(self.obj).attr('data-id')) break;
		}
		if (i < self.instance.colBricks[self.originCol].length) self.instance.colBricks[self.originCol].splice(i, 1);
	};
	
	/**
	 * this is for the icon to drop a list on a board name
	 */
	self.createBoardIcon = function(e) {
		
		var icon = document.createElement('div');
		var $icon = $(icon);
		
		$icon.addClass('board-icon');
		
		self.obj.append($icon);
		
		var adjustToPointer = function(e) {
			var mx = e.pageX - $(self.obj).offset().left + 15;
			var my = e.pageY - $(self.obj).offset().top + 3;
			
			//console.log('top: '+ $(self.obj).position().top + 'mouse: ' + e.pageY + 'offset: ' + self.mouseOffsetY);
			
			$icon.css('left', mx + 'px');
			//$icon.css('top', '5px');
			$icon.css('top',  my + 'px')
		};
		
		$(document).one('mousemove.ListDND.boardIcon', adjustToPointer);
	};
	
	self.showPlaceholder = function(event) {
		
		var obj = self.$masonry[0];
		var $obj = $(obj);
		
		//var mason = self.instance
		//var mason = $.data(self.$masonry[0], 'masonry');
		var mason = self.instance;
		if (!mason) return;
		
		var x = event.pageX;
		var y = event.pageY;

		var col = Math.max(0, Math.floor((x - $obj.offset().left)/mason.columnWidth));
		col = Math.min(mason.cols - 1, col);
			
		// Placeholder coordinates
		var phX = $obj.offset().left + col * mason.columnWidth;
		var phY = $obj.offset().top;
		
		var i, len;
		for (i=0, len=mason.colBricks[col].length; i<len; i++) {
			var block = mason.colBricks[col][i];
			
			// If the placeholder has to be before this block, break
			if (y < (block.offset().top + block.height()/2)) break;
			
			phY = block.offset().top + block.height();
		}
		self.destinationCol = col;
		self.destinationPos = i;
		
		var $ph = $('#block-placeholder');
		
		$ph.height($(self.obj).height() - 4);
		
		if (!$ph.length) {
			// Create the placeholder
			var ph = document.createElement('div');
			ph.setAttribute('id', 'block-placeholder');
			$(document.body).append(ph);
			
			$ph = $(ph);
		}
		
		var phHeight = $ph.outerHeight(true);

		// Update the placeholder if the position has changed.
		if ($ph.position().top != phY || $ph.position().left != phX) {
			$('#block-placeholder').css('top', phY + 'px').css('left', phX + 'px');
			$('.after-placeholder').each(function() {
				$(this).removeClass('after-placeholder');
				$(this).css('top', $(this).position().top - phHeight - 8 + 'px');
			});
			
			// Update the blocks after the placeholder (re-using i and len here)
			for (; i<len; i++) {
				var block = mason.colBricks[col][i];
				
				if (!block.hasClass('after-placeholder')) {
					block.css('top', block.position().top + phHeight + 8 + 'px');
					block.addClass('after-placeholder');
				}
			}
		}
	};
}

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
		lists.on('mouseenter.taskDND', function(e) { self.listover = e.currentTarget; });
		lists.on('mouseleave.taskDND', function(e) { self.listover = null; });
		
		// Same for items, but we have to add a mouseup handler event
		listitems.on('mouseenter.taskDND mousemove.taskDND', function(e) {
			if(!$(this).hasClass('dndover')) $(this).addClass('dndover');
			self.itemover = e.currentTarget;
			
			// We have to attach it to list items (again) because mouseup is attached by 
			// robertclick, and prevented from bubbling (TODO: THIS LINE MAY BE DEPRECATED).
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
		
		
	};
	
	self.mousemove = function(e) {
		$(self.node).css('left', e.pageX + mouseOffsetX + 'px');
		$(self.node).css('top', e.pageY + mouseOffsetY + 'px');
	};
	
	/**
	 * Reset everything
	 */
	self.clear = function (e) {
		$(document).off('mousemove.TaskDND mouseup.TaskDND');
		lists.off('mouseenter.taskDND mouseleave.taskDND');
		listitems.off('mouseenter.taskDND mouseleave.taskDND mouseup.taskDND');
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
		self.node.style.zIndex = 500; 
		
		// If if ever want to drag the element under the cursor, this should prevent the dragged div
		// from preventing to 'see' what's underneath the cursor.
		//pointer-events:none;
		
		$(document.body).append(self.node);
	};
}