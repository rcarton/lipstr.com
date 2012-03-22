
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
			//var pressTimer;
			var longClickduration = 400;
			var dbClickduration = 200;
			var obj = $(element)[0];
			var clickTimer;
			var longClickTimer;

			var click = valueAccessor().click || function() {};
			var dbClick = valueAccessor().dbClick|| function() {};
			var longClick = valueAccessor().longClick || function() {};

			$(element).mouseup(function() { 
				// Normal click
				var newTime = (new Date().getTime());
				var delayDown = newTime - obj.lastDown;

				if (delayDown < longClickduration) {
					window.clearTimeout(longClickTimer);

					if (obj.clicks === 1 && (newTime - obj.lastUp) < dbClickduration) {
						window.clearTimeout(clickTimer);
						obj.clicks = 0;
						dbClick();
					} else {
						obj.clicks = 1;
						clickTimer = window.setTimeout(function() { obj.clicks = 0; click(); }, dbClickduration);
					}
				}
				obj.lastUp = new Date().getTime();

				return false;
			}).mousedown(function(){
				// Set timeout, longclick
				longClickTimer = window.setTimeout(function() { longClick($(element)); }, longClickduration);
				obj.lastDown = new Date().getTime();

				return false; 
			});
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			// This will be called once when the binding is first applied to an element,
			// and again whenever the associated observable changes value.
			// Update the DOM element based on the supplied values here.
		}
};