(function ($) {
	$.widget("ui.rcarousel", {
		_create: function() {
			var data,
				$root = $( this.element ),
				_self = this,
				options = this.options;

			// if options were default there should be no problem
            // check if user set options before init: $('element').rcarousel({with: "foo", visible: 3});
            // in above example exception will be thrown because 'with' should be a number!
            this._checkOptionsValidity( this.options );

			// for every carousel create a data object and keeps it in the element
			this._createDataObject();
			data = $root.data( "data" );

			// create wrapper inside root element; this is needed for animating
			$root
				.addClass( "ui-carousel" )
				.children()
				.wrapAll( "<div class='wrapper'></div>" );
			
			// save all children of root element in ‘paths’ array
			this._saveElements();

			// make pages using paginate algorithm
			this._generatePages();		
			
			this._loadElements();
				
			this._setCarouselWidth();
			this._setCarouselHeight();
			
			// handle default event handlers
			$( options.navigation.next ).click(
				function( event ) {
					_self.next();
					event.preventDefault();
				}
			);
			
			$( options.navigation.prev ).click(
				function( event ) {
					_self.prev();
					event.preventDefault();
				}
			);			
			
			data.navigation.next = $( options.navigation.next );
			data.navigation.prev = $( options.navigation.prev );
			
			// stop on hover feature
			$root.hover(
				function() {
					if ( options.auto.enabled ) {
						clearInterval( data.interval );
						data.hoveredOver = true;
					}
				},
				function() {
					if ( options.auto.enabled ) {
						data.hoveredOver = false;
						_self._autoMode( options.auto.direction );
					}
				}
			);
			
			this._setStep();
			
			// if auto mode is enabled run it
			if ( options.auto.enabled ) {
				this._autoMode( options.auto.direction );
			}
			
			// broadcast event
			this._trigger( "start" );
		},
		
		_addElement: function( jQueryElement, direction ) {
			var $root = $( this.element ),
				$content = $root.find( "div.wrapper" ),
				options = this.options;

			jQueryElement
				.width( options.width )
				.height( options.height );
				
			if ( options.orientation === "horizontal" ) {
				$( jQueryElement ).css( "marginRight", options.margin );
			} else {
				$( jQueryElement ).css({
					marginBottom: options.margin,
					"float": "none"
				});
			}
			
			if ( direction === "prev" ) {
				
				// clone event handlers and data as well
				$content.prepend( jQueryElement.clone(true, true) );
			} else {
				$content.append( jQueryElement.clone(true, true) );
			}			
		},
		
		append: function( jqElements ) {
			var $root = $( this.element ),
				data = $root.data( "data" );
				
			// add new elements
			jqElements.each(
				function( i, el ) {
					data.paths.push( $(el) );
				}
			);
			
			data.oldPage = data.pages[data.oldPageIndex].slice(0);
			data.appended = true;
			
			// rebuild pages
			this._generatePages();
		},
		
		_autoMode: function( direction ) {
			var options = this.options,
				data = $( this.element ).data( "data" );

			if ( direction === "next" ) {
				data.interval = setTimeout( $.proxy(this.next, this), options.auto.interval );
			} else {
				data.interval = setTimeout( $.proxy(this.prev, this), options.auto.interval );
			}
		},
		
		_checkOptionsValidity: function( options ) {
			var i,
				self = this,
				_correctSteps = "";
			
			// for every element in options object check its validity
			$.each(options,
				function( key, value ) {

					switch ( key ) {
						case "visible":
							// visible should be a positive integer
							if ( !value || typeof value !== "number" || value <= 0 || (Math.ceil(value) - value > 0) ) {
								throw new Error( "visible should be defined as a positive integer" );
							}
							break;
	
						case "step":
							if ( !value || typeof value !== "number" || value <= 0 || (Math.ceil(value) - value > 0) ) {
								throw new Error( "step should be defined as a positive integer" );
							} else if ( value > self.options.visible )  {
								// for example for visible: 3 the following array of values for 'step' is valid
								// 3 <= step >= 1 by 1 ==> [1,2,3]
								// output correct values
								for ( i = 1; i <= Math.floor(options.visible); i++ ) {
									_correctSteps += ( i < Math.floor(value) ) ? i + ", " : i;
								}
								
								throw new Error( "Only following step values are correct: " + _correctSteps );
							}
							break;
	
						case "width":
							// width & height is defined by default so you can omit them to some extent
							if ( !value || typeof value !== "number" || value <= 0 || Math.ceil(value) - value > 0 ) {
								throw new Error( "width should be defined as a positive integer" );
							}
							break;
		
						case "height":
							if ( !value || typeof value !== "number" || value <= 0 || Math.ceil(value) - value > 0 ) {
								throw new Error("height should be defined as a positive integer");
							}
							break;
		
						case "speed":
							if ( !value && value !== 0 ) {
								throw new Error("speed should be defined as a number or a string");
							}
		
							if ( typeof value === "number" && value < 0 ) {
								throw new Error( "speed should be a positive number" );
							} else if ( typeof value === "string" && !(value === "slow" || value === "normal" || value === "fast") ) {
								throw new Error( 'Only "slow", "normal" and "fast" values are valid' );
							}
							break;
		
						case "navigation":
							if ( !value || $.isPlainObject(value) === false ) {
								throw new Error( "navigation should be defined as an object with at least one of the properties: 'prev' or 'next' in it");
							}
		
							if ( value.prev && typeof value.prev !== "string" ) {
								throw new Error( "navigation.prev should be defined as a string and point to '.class' or '#id' of an element" );
							}
		
							if ( value.next && typeof value.next !== "string" ) {
								throw new Error(" navigation.next should be defined as a string and point to '.class' or '#id' of an element" );
							}
							break;
		
						case "auto":
							if ( typeof value.direction !== "string" ) {
								throw new Error( "direction should be defined as a string" );
							}
		
							if ( !(value.direction === "next" || value.direction === "prev") ) {
								throw new Error( "direction: only 'right' and 'left' values are valid" );
							}
		
							if ( isNaN(value.interval) || typeof value.interval !== "number" || value.interval < 0 || Math.ceil(value.interval) - value.interval > 0 ) {
								throw new Error( "interval should be a positive number" );
							}
							break;
		
						case "margin":
							if ( isNaN(value) || typeof value !== "number" || value < 0 || Math.ceil(value) - value > 0 ) {
								throw new Error( "margin should be a positive number" );
							}
							break;
					}
				}
			);
		},
		
		_createDataObject: function() {
			var $root = $( this.element );

			$root.data("data",
				{
					paths: [],
					pathsLen: 0,
					pages: [],
					lastPage: [],
					oldPageIndex: 0,
					pageIndex: 0,
					navigation: {},
					animated: false,
					appended: false,
					hoveredOver: false
				}
			);
		},
		
		_generatePages: function() {
			var self = this,
				options = this.options,
				data = $( this.element ).data( "data" ),
				_visible = options.visible,
				_step = options.step,
				_pathsLen = data.paths.length;
			
			// when the seamless option is not used:
			// having 10 elements: A, B, C, D, E, F, G, H, I, J the algorithm
			// creates 3 pages for ‘visible: 5’ and ‘step: 4’:
			// [ABCDE], [EFGHI], [FGHIJ]
			
			// when the seamless option is used:
			// having 6 elements: A, B, C, D, E, F the algorithm
			// creates 6 pages for 'visible: 1' and 'step: 1':
			// [ABCDE], [BCDEF], [CDEFA], [DEFAB], [EFABC], [FABCD]
			// be sure to test performance, because this can increase your
			// memory usage in some cases
			// for example, 10 elements ([A..J]) with 'visible: 4' and 'step: 3'
			// will generate 10 pages:
			// [ABCD], [DEFG] … [HIJA]
			
			// please note that example comments below refer to
			// the page set that is created when the seamless option
			// is disabled, unless otherwise noted
						
			function _init() {
				// init creates the last page [FGHIJ] and remembers it
				data.pages = [];
				data.lastPage = [];
				data.pages[0] = [];

				if ( options.seamless.enabled ) {		
					for ( var i = _visible - (_step + 1); i >= -_step; i-- ) { 
						data.lastPage.unshift( data.paths[((_pathsLen + i) % _pathsLen)] );
					}			
				} else {
					for ( var i = _pathsLen - 1; i >= _pathsLen - _visible; i-- ) {
						data.lastPage.unshift( data.paths[i] );
					}
				}
								
				// and first page
				for ( var i = 0; i < _visible; i++ ) {
					data.pages[0][data.pages[0].length] = data.paths[i];
				}				
			}

			function _islastPage( page ) {
				var _isLast = false;
				
				for ( var i = 0; i < data.lastPage.length; i++ ) {
					if ( data.lastPage[i].get(0) === page[i].get(0) ) {
						_isLast = true;
					} else {
						_isLast = false;
						break;
					}
				}
				
				return _isLast;
			}
			
			function _paginate(seamless) {
				var _isBeginning = true,
				_start = 0,
				_index;
							
				while ( !_islastPage(data.pages[data.pages.length - 1]) || _isBeginning ) {						
					_isBeginning = false;
													
					_index = data.pages.length;		
					data.pages[_index] = [];
					
					_start += _step;
					
					if ( options.seamless.enabled || (data.pages.length * _visible) < _pathsLen ) {
						// when the seamless option is enabled, we will eventually create the last page in this loop  
		            	for ( var i = _start; i < _start + _visible; i++ ) {
		            		data.pages[_index].push( data.paths[i % ( _pathsLen )] );
		            	}
		            } else {
		            	// otherwise, we can get a quicker match if we recognize when we are about to create a page that 
						// starts over on the first element (like [FGABC]) and instead create a page containing
						// the highest possible _visible-length collection of elements (ends with the last element)		
		            	for ( var i = _visible; i > 0; i-- ) {
		            		data.pages[_index].push( data.paths[_pathsLen - i] );
		            	}
		            }
				}
			}

			// go!
			_init();
			_paginate();
		},
		

		
		getCurrentPage: function() {
			var data = $( this.element ).data( "data" );
			return data.pageIndex + 1;
		},
		
		getTotalPages: function() {
			var data = $( this.element ).data( "data" );
			
			// we create extra pages to enable seamless scrolling
			// this breaks demos like 'gotopage' and 'lightbox'
			// to keep seamless scrolling, we'll only return the
			// count of pages before we start repeating elements
			// and round down to cut off partials
			if ( !this.options.seamless.honestPageCount ) {
				return Math.floor(data.paths.length / this.options.visible);
			} else {
				return data.pages.length;
			}		
		},
		
		goToPage: function( page ) {
			var	_by,
				data = $( this.element ).data( "data" );

			if ( !data.animated && page !== data.pageIndex ) {
				data.animated = true;

				if ( page > data.pages.length - 1 ) {
					page = data.pages.length - 1;
				} else if ( page < 0 ) {
					page = 0;
				}
				
				data.pageIndex = page;
				_by = page - data.oldPageIndex;
				
				if ( _by >= 0 ) {
					//move by n elements from current index
					this._goToNextPage( _by );
				} else {
					this._goToPrevPage( _by );
				}
				
				data.oldPageIndex = page;
			}
		},
		
		_loadElements: function(elements, direction) {
			var options = this.options,
				data = $( this.element ).data( "data" ),
				_dir = direction || "next",
				_elem = elements || data.pages[options.startAtPage],
				_start = 0,
				_end = _elem.length;

			if ( _dir === "next" ) {
				for ( var i = _start; i < _end; i++ ) {
					this._addElement( _elem[i], _dir );
				}
			} else {
				for ( var i = _end - 1; i >= _start; i-- ) {
					this._addElement( _elem[i], _dir );
				}
			}
		},
		
		_goToPrevPage: function( by ) {
			var _page, _oldPage, _dist, _index, _animOpts, $lastEl, _unique, _pos, _theSame,
				$root = $( this.element ),
				self = this,
				options = this.options,
				data = $( this.element ).data( "data" );

			// pick pages
			if ( data.appended ) {
				_oldPage = data.oldPage;
			} else {				
				_oldPage = data.pages[data.oldPageIndex];
			}
			
			_index = data.oldPageIndex + by;			
			_page = data.pages[_index].slice( 0 );

			// For example, the first time widget was initiated there were 5
			// elements: A, B, C, D, E and 3 pages for visible 2 and step 2:
			// AB, CD, DE. Then a user loaded next 5 elements so there were
			// 10 already: A, B, C, D, E, F, G, H, I, J and 5 pages:
			// AB, CD, EF, GH and IJ. If the other elemets were loaded when
			// CD page was shown (from 5 elements) ‘_theSame’ is true because
			// we compare the same
			// pages, that is, the 2nd page from 5 elements and the 2nd from
			// 10 elements. Thus what we do next is to decrement the index and
			// loads the first page from 10 elements.			
			$( _page ).each(
				function( i, el ) {
					if ( el.get(0) === $(_oldPage[i]).get(0) ) {
						_theSame = true;
					} else {
						_theSame = false;
					}
				}
			);
			
			if ( data.appended && _theSame ) {
				if ( data.pageIndex === 0 ) {
					_index = data.pageIndex = data.pages.length - 1;
				} else {
					_index = --data.pageIndex;
				}
				
				_page = data.pages[_index].slice( 0 );
			}			

			// check if last element from _page appears in _oldPage
			// for [ABCDFGHIJ] elements there are 3 pages for ‘visible’ = 6 and
			// ‘step’ = 2: [ABCDEF], [CDEFGH] and [EFGHIJ]; going from the 3rd
			// to the 2nd page we only loads 2 elements: [CD] because all
			// remaining were loaded already
			$lastEl = _page[_page.length - 1].get( 0 );
			for ( var i = _oldPage.length - 1; i >= 0; i-- ) {
				if ( $lastEl === $(_oldPage[i]).get(0) ) {
					_unique = false;
					_pos = i;
					break;
				} else {
					_unique = true;
				}
			}

			if ( !_unique ) {
				while ( _pos >= 0 ) {
					if ( _page[_page.length - 1].get(0) === _oldPage[_pos].get(0) ) {
						// this element is unique
						_page.pop();
					}
					--_pos;
				}
			}			

			// load new elements
			self._loadElements( _page, "prev" );

			// calculate the distance
			_dist = options.width * _page.length + ( options.margin * _page.length );

			if (options.orientation === "horizontal") {
				_animOpts = {scrollLeft: 0};
				$root.scrollLeft( _dist );
			} else {
				_animOpts = {scrollTop: 0};
				$root.scrollTop( _dist );
			}

			$root
				.animate(_animOpts, options.speed, function () {
					self._removeOldElements( "last", _page.length );
					data.animated = false;

					if ( !data.hoveredOver && options.auto.enabled ) {
						// if autoMode is on and you change page manually
						clearInterval( data.interval );
						
						self._autoMode( options.auto.direction );
					}

					// scrolling is finished, send an event
					self._trigger("pageLoaded", null, {page: _index});
				});
				
			// reset to default
			data.appended = false;				
		},
		
		_goToNextPage: function( by ) {
			var _page, _oldPage, _dist, _index, _animOpts, $firstEl, _unique, _pos, _theSame,
				$root = $( this.element ),
				options = this.options,
				data = $root.data( "data" ),				
				self = this;

			// pick pages
			if ( data.appended ) {
				_oldPage = data.oldPage;
			} else {				
				_oldPage = data.pages[data.oldPageIndex];
			}
			
			_index = data.oldPageIndex + by;			
			_page = data.pages[_index].slice( 0 );
			
			// For example, the first time widget was initiated there were 5
			// elements: A, B, C, D, E and 2 pages for visible 4 and step 3:
			// ABCD and BCDE. Then a user loaded next 5 elements so there were
			// 10 already: A, B, C, D, E, F, G, H, I, J and 3 pages:
			// ABCD, DEFG and GHIJ. If the other elemets were loaded when
			// ABCD page was shown (from 5 elements) ‘_theSame’ is true because
			// we compare the same
			// pages, that is, the first pages from 5 elements and the first from
			// 10 elements. Thus what we do next is to increment the index and
			// loads the second page from 10 elements.
			$( _page ).each(
				function( i, el ) {
					if ( el.get(0) === $(_oldPage[i]).get(0) ) {
						_theSame = true;
					} else {
						_theSame = false;
					}
				}
			);
	
			if ( data.appended && _theSame ) {
				_page = data.pages[++data.pageIndex].slice( 0 );
			}

			// check if 1st element from _page appears in _oldPage
			// for [ABCDFGHIJ] elements there are 3 pages for ‘visible’ = 6 and
			// ‘step’ = 2: [ABCDEF], [CDEFGH] and [EFGHIJ]; going from the 2nd
			// to the 3rd page we only loads 2 elements: [IJ] because all
			// remaining were loaded already
			$firstEl = _page[0].get( 0 );
			for ( var i = 0; i < _page.length; i++) {
				if ( $firstEl === $(_oldPage[i]).get(0) ) {
					_unique = false;
					_pos = i;
					break;
				} else {
					_unique = true;
				}
			}

			if ( !_unique ) {
				while ( _pos < _oldPage.length ) {
					if ( _page[0].get(0) === _oldPage[_pos].get(0) ) {
						_page.shift();
					}
					++_pos;
				}
			}
			
			// load new elements			
			this._loadElements( _page, "next" );

			// calculate the distance
			_dist = options.width * _page.length + ( options.margin * _page.length );
			
			if ( options.orientation === "horizontal" ) {
				_animOpts = {scrollLeft: "+=" + _dist};
			} else {
				_animOpts = {scrollTop: "+=" + _dist};
			}
			
			$root
				.animate(_animOpts, options.speed, function() {
					self._removeOldElements( "first", _page.length );
					
					if ( options.orientation === "horizontal" ) {
						$root.scrollLeft( 0 );
					} else {
						$root.scrollTop( 0 );
					}
					
					data.animated = false;

					if ( !data.hoveredOver && options.auto.enabled ) {
						// if autoMode is on and you change page manually
						clearInterval( data.interval );
						
						self._autoMode( options.auto.direction );
					}

					// scrolling is finished, send an event
					self._trigger( "pageLoaded", null, {page: _index});

			});
				
			// reset to default
			data.appended = false;
		},
		
		next: function() {
			var	options = this.options,
				data = $( this.element ).data( "data" );

			if ( !data.animated ) {
				data.animated = true;
				
				if ( !data.appended  ) {
					++data.pageIndex;
				}				
				
				if ( data.pageIndex > data.pages.length - 1 ) {
					data.pageIndex = 0;
				}

				// move by one element from current index
				this._goToNextPage( data.pageIndex - data.oldPageIndex );
				data.oldPageIndex = data.pageIndex;
			}
		},
		
		prev: function() {
			var	options = this.options,
				data = $( this.element ).data( "data" );

			if ( !data.animated ) {
				data.animated = true;

				if ( !data.appended ) {
					--data.pageIndex;
				}
				
				if ( data.pageIndex < 0 ) {
					data.pageIndex = data.pages.length - 1;
				}

				// move left by one element from current index
				this._goToPrevPage( data.pageIndex - data.oldPageIndex );
				data.oldPageIndex = data.pageIndex;
			}
		},
		
		_removeOldElements: function(position, length) {
			// remove 'step' elements
			var	$root = $( this.element );

			for ( var i = 0; i < length; i++ ) {
				if ( position === "first" ) {
					$root
						.find( "div.wrapper" )
							.children()
							.first()
							.remove();
				} else {
					$root
						.find( "div.wrapper" )
							.children()
							.last()
							.remove();
				}
			}
		},
		
		_saveElements: function() {
			var $el,
				$root = $( this.element ),
				$elements = $root.find( "div.wrapper" ).children(),
				data = $root.data( "data" );
				
			$elements.each(
				function( i, el ) {
					$el = $( el );
					
					// keep element’s data and events
					data.paths.push( $el.clone(true, true) );
					$el.remove();
				}
			);		
		},
		
		_setOption: function( key, value ) {
			var _newOptions,
				options = this.options,
				data = $( this.element ).data( "data" );

			switch (key) {
				case "speed":
					this._checkOptionsValidity({speed: value});
					options.speed = value;
					$.Widget.prototype._setOption.apply( this, arguments );
					break;
	
				case "auto":
					_newOptions = $.extend( options.auto, value );
					this._checkOptionsValidity({auto: _newOptions});
	
					if ( options.auto.enabled ) {
						this._autoMode( options.auto.direction );
					}
				}

		},
		
		_setStep: function(s) {
			// calculate a step
			var _step,
				options = this.options,
				data = $( this.element ).data( "data" );

			_step = s || options.step;

			options.step = _step;
			data.step = options.width * _step;
		},
		
		_setCarouselHeight: function() {
			var _newHeight,
				$root = $( this.element ),
				data = $( this.element ).data( "data" ),			
				options = this.options;

			if ( options.orientation === "vertical" ) {
				_newHeight = options.visible * options.height + options.margin * (options.visible - 1);
			} else {
				_newHeight = options.height;
			}

			$root.height(_newHeight);
		},
		
		_setCarouselWidth: function() {
			var _newWidth,
				$root = $( this.element ),
				options = this.options,
				data = $( this.element ).data( "data" );

			if ( options.orientation === "horizontal" ) {
				_newWidth = options.visible * options.width + options.margin * (options.visible - 1);
			} else {
				_newWidth = options.width;
			}

			// set carousel width and disable overflow: auto
			$root.css({
				width: _newWidth,
				overflow: "hidden"
			});
		},
		
		options: {
			visible: 3,
			step: 3,
			width: 100,
			height: 100,
			speed: 1000,
			margin: 0,
			orientation: "horizontal",
			auto: {
				enabled: false,
				direction: "next",
				interval: 5000
			},
			startAtPage: 0,
			navigation: {
				next: "#ui-carousel-next",
				prev: "#ui-carousel-prev"
			},
			seamless: {
				enabled: true,
				honestPageCount: false
			}
		}
	});
}(jQuery));