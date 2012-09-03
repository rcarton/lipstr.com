
function editTask() {
	console.log('edit task');
}

function taskDone() {
	console.log('task done');
}

function dragStart(e) {
	/*console.log('drag start');
	
	e.toggleClass('dragged');
	
	// Start following the mouse
	*/
	
};

ko.bindingHandlers.taskClick = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel) {

			var click = valueAccessor().click || function() {};
			var dblclick = valueAccessor().dblclick|| function() {};
			var longclick = valueAccessor().longclick || function() {};
			var dragclick = valueAccessor().dragclick || function() {};
			var rightclick = valueAccessor().rightclick || function() {};
			var middleclick = valueAccessor().middleclick || function() {};

			$(element).robertClick({
		    	click: click,
		    	dblclick: dblclick,
		    	longclick: longclick,
		    	dragclick: dragclick,
		    	rightclick: rightclick,
		    	middleclick: middleclick
			});
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			// This will be called once when the binding is first applied to an element,
			// and again whenever the associated observable changes value.
			// Update the DOM element based on the supplied values here.
		}	
};

ko.bindingHandlers.enableBootstrapDropdown = {
		init:  function(element, valueAccessor, allBindingsAccessor, context) {
			$(element).dropdown();
		},
	    update: function(element, valueAccessor, allBindingAccessor, context) {
	    }  
	}