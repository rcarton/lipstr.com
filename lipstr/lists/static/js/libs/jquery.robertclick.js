/**
 *  -------------------------------------
 *	  Robertclick
 *  -------------------------------------
 *	github: https://github.com/rcarton/robertclick
 *  author: Rémi Carton	(http://troebr.net)
 *  
 *	Robertclick is a jquery click handler providing alternative click callbacks
 *  to the default javascript events, and noticeably:
 *  
 *   - the 'dblclick' does not trigger the click event
 *   - the 'longclick' is triggered after a given delay (default: 300ms)
 *	 - the 'dragclick' is triggered after a mouse displacement (default: 10px)
 *
 *  requirements:
 *   - jquery >= 1.7
 *   
 *   
 *  license: 
  
  MIT license
  Copyright (C) <year> <copyright holders>

  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify, 
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to 
  permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies
  or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
  PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
  FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
  OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
  DEALINGS IN THE SOFTWARE.

 */


(function($) {
	$.fn.robertClick = function(options) {
		
		var settings = $.extend( {
			// Options
			'longclick-duration': 300, // ms
			'dblclick-duration': 200,	// ms
			'dragclick-displacement': 10, // pixels
			
			// Callbacks
			'click': function(e) {},
			'dblclick': function(e) {},
			'longclick': function(e) {},
			'dragclick': function(e) {},
			'rightclick': function(e) {},
			'middleclick': function(e) {}
			
		    }, options);
		
		return this.each(function() {
			
			var click = function(e)     { clearAll(); settings['click'](e); };
			var dblclick = function(e)  { clearAll(); settings['dblclick'](e); };
			var longclick = function(e) { clearAll(); settings['longclick'](e); };
			var dragclick = function(e) { clearAll(); settings['dragclick'](e); };
			var rightclick = function(e) { clearAll(); settings['rightclick'](e); };
			var middleclick = function(e) { clearAll(); settings['middleclick'](e); };
			
			var clearAll = function () {
				$(document).off('mousemove.robertclick');
				window.clearTimeout(clickTimer);
				window.clearTimeout(longClickTimer);
				obj.clicks = 0;
			}; 
			
			var $this = $(this);
			var obj = $this[0];

			// Timers
			var clickTimer;
			var longClickTimer;
			
			var dragClickFired = false;
			
			// Disable normal clicks
			//$this.off('click dblclick dragstart');
			
			$this.on('mouseup.robertclick', function(e) { 
				
				if (dragClickFired) return;
				
				// Normal click
				var newTime = (new Date().getTime());
				var delayDown = newTime - obj.lastDown;
				
				// Disable mousemove
				$(document).off('mousemove.robertclick');
				
				if (delayDown < settings['longclick-duration']) {
					window.clearTimeout(longClickTimer);

					if (obj.clicks === 1 && (newTime - obj.lastUp) < settings['dblclick-duration']) {
						window.clearTimeout(clickTimer);
						obj.clicks = 0;
						dblclick(e);
					} else {
						obj.clicks = 1;
						clickTimer = window.setTimeout(function() { obj.clicks = 0; click(e); }, settings['dblclick-duration']);
					}
				}
				obj.lastUp = new Date().getTime();
				
				//return false;
			}).on('mousedown.robertclick', function(e){
				
				// right click
				if(e.button == 2) {
					clearAll();
					rightclick(e);
					return;
				}
				
				// scroll click
				if(e.button == 1) {
					clearAll();
					middleclick(e);
					return;
				}
				
				dragClickFired = false;
				
				longClickTimer = window.setTimeout(function() { 
					// Disable mousemove
					$this.off('mousemove.robertclick');
					longclick(e); 
				}, settings['longclick-duration']);
				
				obj.lastDown = new Date().getTime();
				obj.initMouseX = e.pageX;
				obj.initMouseY = e.pageY;
				
				$(document).on('mousemove.robertclick', function(e) {
						var distance = Math.sqrt(Math.pow(Math.abs(e.pageX - obj.initMouseX) + Math.abs(e.pageY - obj.initMouseY), 2));
						if (distance > settings['dragclick-displacement']) {
							dragClickFired = true;
							e.currentTarget = obj;
							dragclick(e);
						}
					});
				
				return false; 
			});

		});
		
	};
})(jQuery);