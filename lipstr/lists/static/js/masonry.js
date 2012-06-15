
/**
 * jQuery Masonry v2.1.05
 * A dynamic layout plugin for jQuery
 * The flip-side of CSS Floats
 * http://masonry.desandro.com
 *
 * Licensed under the MIT license.
 * Copyright 2012 David DeSandro
 */

/*jshint browser: true, curly: true, eqeqeq: true, forin: false, immed: false, newcap: true, noempty: true, strict: true, undef: true */
/*global jQuery: false */

(function( window, $, undefined ){

  'use strict';

  /*
   * smartresize: debounced resize event for jQuery
   *
   * latest version and complete README available on Github:
   * https://github.com/louisremi/jquery.smartresize.js
   *
   * Copyright 2011 @louis_remi
   * Licensed under the MIT license.
   */

  var $event = $.event,
      resizeTimeout;

  $event.special.smartresize = {
    setup: function() {
      $(this).bind( "resize", $event.special.smartresize.handler );
    },
    teardown: function() {
      $(this).unbind( "resize", $event.special.smartresize.handler );
    },
    handler: function( event, execAsap ) {
      // Save the context
      var context = this,
          args = arguments;

      // set correct event type
      event.type = "smartresize";

      if ( resizeTimeout ) { clearTimeout( resizeTimeout ); }
      resizeTimeout = setTimeout(function() {
        $.event.handle.apply( context, args );
      }, execAsap === "execAsap"? 0 : 100 );
    }
  };

  $.fn.smartresize = function( fn ) {
    return fn ? this.bind( "smartresize", fn ) : this.trigger( "smartresize", ["execAsap"] );
  };



// ========================= Masonry ===============================


  // our "Widget" object constructor
  $.Mason = function( options, element ){
    this.element = $( element );

    this._create( options );
    this._init();
  };

  $.Mason.settings = {
    isResizable: true,
    isAnimated: false,
    animationOptions: {
      queue: false,
      duration: 500
    },
    gutterWidth: 0,
    isRTL: false,
    isFitWidth: false,
    containerStyle: {
      position: 'relative'
    },
	maxColumns: 0,
	layout: {}
  };

  $.Mason.prototype = {

    _filterFindBricks: function( $elems ) {
      var selector = this.options.itemSelector;
      // if there is a selector
      // filter/find appropriate item elements
      return !selector ? $elems : $elems.filter( selector ).add( $elems.find( selector ) );
    },

    _getBricks: function( $elems ) {
      var $bricks = this._filterFindBricks( $elems )
        .css({ position: 'absolute' })
        .addClass('masonry-brick');
      return $bricks;
    },
    
    // sets up widget
    _create : function( options ) {
      
      this.options = $.extend( true, {}, $.Mason.settings, options );
      this.styleQueue = [];

      // get original styles in case we re-apply them in .destroy()
      var elemStyle = this.element[0].style;
      this.originalStyle = {
        // get height
        height: elemStyle.height || ''
      };
	  
      // get other styles that will be overwritten
      var containerStyle = this.options.containerStyle;
      for ( var prop in containerStyle ) {
        this.originalStyle[ prop ] = elemStyle[ prop ] || '';
      }

      this.element.css( containerStyle );

      this.horizontalDirection = this.options.isRTL ? 'right' : 'left';

      this.offset = {
        x: parseInt( this.element.css( 'padding-' + this.horizontalDirection ), 10 ),
        y: parseInt( this.element.css( 'padding-top' ), 10 )
      };
      
      this.isFluid = this.options.columnWidth && typeof this.options.columnWidth === 'function';

      // add masonry class first time around
      var instance = this;
      setTimeout( function() {
        instance.element.addClass('masonry');
      }, 0 );
      
      // bind resize method
      if ( this.options.isResizable ) {
        $(window).bind( 'smartresize.masonry', function() { 
          instance.resize();
        });
      }


      // need to get bricks
      this.reloadItems();

    },
  
    // _init fires when instance is first created
    // and when instance is triggered again -> $el.masonry();
    _init : function( callback ) {
      this._getColumns();
      this._reLayout( callback );
    },

    option: function( key, value ){
      // set options AFTER initialization:
      // signature: $('#foo').bar({ cool:false });
      if ( $.isPlainObject( key ) ){
        this.options = $.extend(true, this.options, key);
      } 
    },
    
    // ====================== General Layout ======================

    // used on collection of atoms (should be filtered, and sorted before )
    // accepts atoms-to-be-laid-out to start with
    layout : function( $bricks, callback ) {
	  
	  var $bricksNotInLayout = new Array();
	  
	  if (this.options.layout[this.cols] != undefined) {
		
	    var layoutCol = this.options.layout[this.cols];
		var $bricksInLayout = new Array(this.cols);
		for (var i=0; i<this.cols; i++) $bricksInLayout[i] = new Array();
		
	    // sort elements by column and position
		for (var i=0, len = $bricks.length; i < len; i++) {
		  var layoutObj = layoutCol[$($bricks[i]).attr('data-masonry-id')];
		  
		  if (layoutObj != undefined) {
		    var col = parseInt(layoutObj['col']);
			$bricks[i]['masonry_pos'] = parseInt(layoutObj['pos']);
		    if (col >= 0
			  && col < this.cols) {
			  $bricksInLayout[col].push($bricks[i]);
		    } else {
		  	  $bricksNotInLayout.push($bricks[i]);
		    }
		  } else {
			  $bricksNotInLayout.push($bricks[i]);
		  }
		}
		
		var sortLayoutBricks = function(a, b) {
			var d = b['masonry_pos'] - a['masonry_pos'];
			if (d == 0) return 0;
			if (d < 0) return 1;
			if (d > 0) return -1;
		}
		
		// sort each column for the bricks in the parametered layout
		for (var i in $bricksInLayout) {
			$bricksInLayout[i] = toSortedArray($bricksInLayout[i], sortLayoutBricks);
		}
		
		// place them
		for (var col in $bricksInLayout) {
			for (var i=0, len = $bricksInLayout[col].length; i < len; i++) {
				this._placeBrick($bricksInLayout[col][i], parseInt(col));
			}		
		}
	  
	  } else {
		$bricksNotInLayout = $bricks;
	  }
	  
      // place the rest of the bricks
      for (var i=0, len = $bricksNotInLayout.length; i < len; i++) {
        this._placeBrick( $bricksNotInLayout[i] );
      }
      
      // set the size of the container
      var containerSize = {};
      containerSize.height = Math.max.apply( Math, this.colYs );
      if ( this.options.isFitWidth ) {
        var unusedCols = 0;
        i = this.cols;
        // count unused columns
        while ( --i ) {
          if ( this.colYs[i] !== 0 ) {
            break;
          }
          unusedCols++;
        }
        // fit container to columns that have been used;
        containerSize.width = (this.cols - unusedCols) * this.columnWidth - this.options.gutterWidth;
      }
      this.styleQueue.push({ $el: this.element, style: containerSize });

      // are we animating the layout arrangement?
      // use plugin-ish syntax for css or animate
      var styleFn = !this.isLaidOut ? 'css' : (
            this.options.isAnimated ? 'animate' : 'css'
          ),
          animOpts = this.options.animationOptions;

      // process styleQueue
      var obj;
      for (i=0, len = this.styleQueue.length; i < len; i++) {
        obj = this.styleQueue[i];
        obj.$el[ styleFn ]( obj.style, animOpts );
      }

      // clear out queue for next time
      this.styleQueue = [];

      // provide $elems as context for the callback
      if ( callback ) {
        callback.call( $bricks );
      }
      
      this.isLaidOut = true;
    },
	
	
    // calculates number of columns
    // i.e. this.columnWidth = 200
    _getColumns : function() {
      var container = this.options.isFitWidth ? this.element.parent() : this.element,
          containerWidth = container.width();

                         // use fluid columnWidth function if there
      this.columnWidth = this.isFluid ? this.options.columnWidth( containerWidth ) :
                    // if not, how about the explicitly set option?
                    this.options.columnWidth ||
                    // or use the size of the first item
                    this.$bricks.outerWidth(true) ||
                    // if there's no items, use size of container
                    containerWidth;

      this.columnWidth += this.options.gutterWidth;

      this.cols = Math.floor( ( containerWidth + this.options.gutterWidth ) / this.columnWidth );
      this.cols = Math.max( this.cols, 1 );
	  if ( this.options.maxColumns > 0 ) {
	    this.cols = Math.min( this.cols, this.options.maxColumns );
	  }
    },

    // layout logic
    _placeBrick: function( brick, col ) {
		
      var $brick = $(brick),
          colSpan, groupCount, groupY, groupColY, j;

      //how many columns does this brick span
	  
	  if (col === undefined) {
        colSpan = Math.ceil( $brick.outerWidth(true) / this.columnWidth );
        colSpan = Math.min( colSpan, this.cols );
	  } else {
		colSpan = 1;
	  }
	  
      if ( colSpan === 1 ) {
        // if brick spans only one column, just like singleMode
        groupY = this.colYs;
      } else {
        // brick spans more than one column
        // how many different places could this brick fit horizontally
        groupCount = this.cols + 1 - colSpan;
        groupY = [];

        // for each group potential horizontal position
        for ( j=0; j < groupCount; j++ ) {
          // make an array of colY values for that one group
          groupColY = this.colYs.slice( j, j+colSpan );
          // and get the max value of the array
          groupY[j] = Math.max.apply( Math, groupColY );
        }

      }
	  
	  var minimumY, shortCol, len;
	  if (col != undefined) {
	    shortCol = col;
		minimumY = groupY[col];
		len = this.cols;
	  } else {
		  // get the minimum Y value from the columns
		  minimumY = Math.min.apply( Math, groupY ),
		  shortCol = 0;
		  
		  // Find index of short column, the first from the left
		  for (var i=0, len = groupY.length; i < len; i++) {
			if ( groupY[i] === minimumY ) {
			  shortCol = i;
			  break;
			}
		  }
	  }
	  
      // position the brick
      var position = {
        top: minimumY + this.offset.y
      };
      // position.left or position.right
      position[ this.horizontalDirection ] = this.columnWidth * shortCol + this.offset.x;
      this.styleQueue.push({ $el: $brick, style: position });
	  
	  // colBricks is this.$bricks but sorted by column.
	  this.colBricks[shortCol].push($brick);
	  
      // apply setHeight to necessary columns
      var setHeight = minimumY + $brick.outerHeight(true),
          setSpan = this.cols + 1 - len;
      for ( i=0; i < setSpan; i++ ) {
        this.colYs[ shortCol + i ] = setHeight;
      }

    },
    
    
    resize: function() {
      var prevColCount = this.cols;
      // get updated colCount
      this._getColumns();
      if ( this.isFluid || this.cols !== prevColCount ) {
        // if column count has changed, trigger new layout
        this._reLayout();
      }
    },
    
    
    _reLayout : function( callback ) {
      // reset columns
      var i = 0;
      this.colYs = [];
	  this.colBricks = [];
      for (; i<this.cols; i++) {
        this.colYs.push( 0 );
        this.colBricks.push(new Array());
      }
	  
      // apply layout logic to all bricks
      this.layout( this.$bricks, callback );
    },
    
    // ====================== Convenience methods ======================
    
    // goes through all children again and gets bricks in proper order
    reloadItems : function() {
      this.$bricks = this._getBricks( this.element.children() );
    },
    
    
    reload : function( callback ) {
      this.reloadItems();
      this._init( callback );
    },
	
	// refreshes the layout without changing the current columns
	reloadColumns : function( callback ) {
		this.colYs = [];
		for (var i=0; i<this.cols; i++) {
			this.colYs.push( 0 );
		}
		for (var col=0; col<this.cols; col++) {
			var colBricksCopy = this.colBricks[col].slice(0);
			this.colBricks[col] = [];
			for (var i=0, len = colBricksCopy.length; i < len; i++) {
				this._placeBrick(colBricksCopy[i], col);
			}
		}
		
		//after layout move this in a function :|
		// set the size of the container
		var containerSize = {}, i;
		containerSize.height = Math.max.apply( Math, this.colYs );
		if ( this.options.isFitWidth ) {
			var unusedCols = 0;
			i = this.cols;
			// count unused columns
			while ( --i ) {
			  if ( this.colYs[i] !== 0 ) {
				break;
			  }
			  unusedCols++;
			}
			// fit container to columns that have been used;
			containerSize.width = (this.cols - unusedCols) * this.columnWidth - this.options.gutterWidth;
		}
		this.styleQueue.push({ $el: this.element, style: containerSize });

		// are we animating the layout arrangement?
		// use plugin-ish syntax for css or animate
		var styleFn = !this.isLaidOut ? 'css' : (
			this.options.isAnimated ? 'animate' : 'css'
		  ),
		  animOpts = this.options.animationOptions;

		// process styleQueue
		var obj;
		for (i=0, len = this.styleQueue.length; i < len; i++) {
			obj = this.styleQueue[i];
			obj.$el[ styleFn ]( obj.style, animOpts );
		}

		// clear out queue for next time
		this.styleQueue = [];

		// provide $elems as context for the callback
		if ( callback ) {
			callback.call( $bricks );
		}

		this.isLaidOut = true;
	},
    
	saveLayout : function() {
    	if (!Modernizr.localstorage || !Modernizr.applicationcache ) { if (callback) callback(); return false; }
    	
    	var o = this.options.layout;
    	var position = 0;
    	o[this.cols] = {}; 
    	
    	for (var col=0; col<this.cols; col++) {
			var colBricksCopy = this.colBricks[col].slice(0);
			for (var i=0, len = colBricksCopy.length; i < len; i++) {
				position += 1000;
				o[this.cols][colBricksCopy[i].attr('data-masonry-id')] = {pos: position, col: col};
			}
		}
    	
    	//console.log(o);
    	
    	localStorage['masonry-layout'] = ko.toJSON(o);	
	},
	
    // convienence method for working with Infinite Scroll
    appended : function( $content, isAnimatedFromBottom, callback ) {
      if ( isAnimatedFromBottom ) {
        // set new stuff to the bottom
        this._filterFindBricks( $content ).css({ top: this.element.height() });
        var instance = this;
        setTimeout( function(){
          instance._appended( $content, callback );
        }, 1 );
      } else {
        this._appended( $content, callback );
      }
    },
    
    _appended : function( $content, callback ) {
      var $newBricks = this._getBricks( $content );
      // add new bricks to brick pool
      this.$bricks = this.$bricks.add( $newBricks );
      this.layout( $newBricks, callback );
    },
    
    // removes elements from Masonry widget
    remove : function( $content ) {
      this.$bricks = this.$bricks.not( $content );
      $content.remove();
    },
    
    // destroys widget, returns elements and container back (close) to original style
    destroy : function() {

      this.$bricks
        .removeClass('masonry-brick')
        .each(function(){
          this.style.position = '';
          this.style.top = '';
          this.style.left = '';
        });
      
      // re-apply saved container styles
      var elemStyle = this.element[0].style;
      for ( var prop in this.originalStyle ) {
        elemStyle[ prop ] = this.originalStyle[ prop ];
      }

      this.element
        .unbind('.masonry')
        .removeClass('masonry')
        .removeData('masonry');
      
      $(window).unbind('.masonry');

    }
    
  };
  
  
  // ======================= imagesLoaded Plugin ===============================
  /*!
   * jQuery imagesLoaded plugin v1.1.0
   * http://github.com/desandro/imagesloaded
   *
   * MIT License. by Paul Irish et al.
   */


  // $('#my-container').imagesLoaded(myFunction)
  // or
  // $('img').imagesLoaded(myFunction)

  // execute a callback when all images have loaded.
  // needed because .load() doesn't work on cached images

  // callback function gets image collection as argument
  //  `this` is the container

  $.fn.imagesLoaded = function( callback ) {
    var $this = this,
        $images = $this.find('img').add( $this.filter('img') ),
        len = $images.length,
        blank = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
        loaded = [];

    function triggerCallback() {
      callback.call( $this, $images );
    }

    function imgLoaded( event ) {
      var img = event.target;
      if ( img.src !== blank && $.inArray( img, loaded ) === -1 ){
        loaded.push( img );
        if ( --len <= 0 ){
          setTimeout( triggerCallback );
          $images.unbind( '.imagesLoaded', imgLoaded );
        }
      }
    }

    // if no images, trigger immediately
    if ( !len ) {
      triggerCallback();
    }

    $images.bind( 'load.imagesLoaded error.imagesLoaded',  imgLoaded ).each( function() {
      // cached images don't fire load sometimes, so we reset src.
      var src = this.src;
      // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
      // data uri bypasses webkit log warning (thx doug jones)
      this.src = blank;
      this.src = src;
    });

    return $this;
  };


  // helper function for logging errors
  // $.error breaks jQuery chaining
  var logError = function( message ) {
    if ( window.console ) {
      window.console.error( message );
    }
  };
  
  // =======================  Plugin bridge  ===============================
  // leverages data method to either create or return $.Mason constructor
  // A bit from jQuery UI
  //   https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.widget.js
  // A bit from jcarousel 
  //   https://github.com/jsor/jcarousel/blob/master/lib/jquery.jcarousel.js

  $.fn.masonry = function( options ) {
    if ( typeof options === 'string' ) {
      // call method
      var args = Array.prototype.slice.call( arguments, 1 );

      this.each(function(){
        var instance = $.data( this, 'masonry' );
        if ( !instance ) {
          logError( "cannot call methods on masonry prior to initialization; " +
            "attempted to call method '" + options + "'" );
          return;
        }
        if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
          logError( "no such method '" + options + "' for masonry instance" );
          return;
        }
        // apply method
        instance[ options ].apply( instance, args );
      });
    } else {
      this.each(function() {
        var instance = $.data( this, 'masonry' );
        if ( instance ) {
          // apply options & init
          instance.option( options || {} );
          instance._init();
        } else {
          // initialize new instance
          $.data( this, 'masonry', new $.Mason( options, this ) );
          
          var self = this
          // DEBUG
          $(document).mousemove(function(e) { getColumnUnderPointer(self, e); } );
        }
      });
    }
    return this;
  };

})( window, jQuery );



function getColumnUnderPointer(obj, event) {
	
	var $obj = $(obj);
	
	var mason = $.data(obj, 'masonry');
	if (!mason) return;
	
	var x = event.pageX;
	var y = event.pageY;

	var col = Math.max(0, Math.floor((x - $obj.offset().left)/mason.columnWidth));
	
	// Placeholder coordinates
	var phX = $obj.offset().left + col * mason.columnWidth;
	var phY = $obj.offset().top;
	
	var i, len;
	for (i=0, len=mason.colBricks[col].length; i<len; i++) {
		var block = mason.colBricks[col][i];
		
		// If the placeholder has to be before this block, break
		if (y < (block.offset().top + block.height()/2)) break;
		
		phY = block.offset().top + block.height() + 10;
	}
	
	var $ph = $('#block-placeholder');
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
			$(this).css('top', $(this).position().top - phHeight + 'px');
		});
		
		// Update the blocks after the placeholder (re-using i and len here)
		for (; i<len; i++) {
			var block = mason.colBricks[col][i];
			
			if (!block.hasClass('after-placeholder')) {
				block.css('top', block.position().top + phHeight + 'px');
				block.addClass('after-placeholder');
			}
		}
		
	}
	
	
}
