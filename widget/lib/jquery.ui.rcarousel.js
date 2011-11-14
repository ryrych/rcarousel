(function ($) {
	$.widget("ui.rcarousel", {
		_create: function () {
			var data,
				$root = $( this.element ),
				_self = this,
				options = this.options;

			// if options were default there should be no problem
            // check if user set options before init: $('element').rcarousel({with: "foo", visible: 3});
            // in above example exception will be thrown bacause 'with' should be a number!
            this._checkOptionsValidity( this.options );

			// for every carousel create a data object and keeps it in the element
			this._createDataObject();
			data = $root.data( "data" );

			// create wrapper inside root element; this is needed for animating
			$root
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
				function() {
					_self.next();
				}
			);
			
			$( options.navigation.prev ).click(
				function() {
					_self.prev();
				}
			);			
			
			data.navigation.next = $( options.navigation.next );
			data.navigation.prev = $( options.navigation.prev );
			
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
				$content.prepend( jQueryElement.clone() );
			} else {
				$content.append( jQueryElement.clone() );
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
			
			// rebuild pages
			this._generatePages();
		},
		
		_autoMode: function (direction) {
			var self = this,
				options = self.options,
				data = $( this.element ).data( "data" );

			if (direction === "next") {
				data.autoModeInterval = setInterval(function () {
					self.next();
				}, options.auto.interval);
			} else {
				data.autoModeInterval = setInterval(function () {
					self.prev();
				}, options.auto.interval);
			}
		},
		
		_checkOptionsValidity: function (options) {
			var	self = this,
				_correctSteps = "",
				_key, _value, i;

			// for every element in options object check its validity
			for (_key in options) {
				_value = options[_key];
				switch (_key) {
				case "visible":
					// visible should be a integer positive number
					if (typeof _value !== "number" || _value <= 0 || (Math.ceil(_value) - _value > 0)) {
						throw new Error("visible should be defined as a positive integer number!");
					}
					break;

				case "step":
					if (_value && typeof _value !== "number" || _value <= 0) {
						throw new Error("step should be a positive number");
					} else {
						// for example for visible: 3 the following array of values for 'step' is valid
						// 3 <= step >= 1 by 1 ==> [1,2,3]
						if (_value < 1 || _value > options.visible) {
							// output correct values
							for (i = 1; i <= Math.floor(options.visible); i++) {
								_correctSteps += (i < Math.floor(_value)) ? i + ", " : i;
							}
							throw new Error("Only following mode.step values are correct: " + _correctSteps);
						}
					}
					break;

				case "width":
					// width & height is defined by default so you can omit them to some extent
					if (_value && (isNaN(_value) || typeof _value !== "number" || _value <= 0 || (Math.ceil(_value) - _value > 0))) {
						throw new Error("width should be a positive integer number!");
					}
					break;

				case "height":
					if (_value && (isNaN(_value) || typeof _value !== "number" || _value <= 0 || (Math.ceil(_value) - _value > 0))) {
						throw new Error("height should be a positive number!");
					}
					break;

				case "speed":
					if (!_value && _value !== 0) {
						throw new Error("speed should be defined as a number or a string");
					}

					if (typeof _value === "number" && _value < 0) {
						throw new Error("speed " + "should be a positive number");
					} else if (typeof _value === "string" && !(_value === "slow" || _value === "normal" || _value === "fast")) {
						throw new Error('Only "slow", "normal" and "fast" values are valid');
					}
					break;

				case "remote":
					if (!_value || !(typeof _value === "object")) {
						throw new Error("remote should be defined as object with path and format properties in it!");
					}

					if (!(typeof _value.path === "string")) {
						throw new Error("remote.path should be defined as string!");
					}

					if (!(typeof _value.format === "string")) {
						throw new Error("remote.format should be defined as a string!");
					} else if (!(_value.format === "json" || _value.format === "xml")) {
						throw new Error("remote.format: '" + _value.format + "' is not valid. Only remote.format: 'json' and remote.format: 'xml' are valid!");
					}
					break;

				case "navigation":
					if (!_value || typeof _value !== "object") {
						throw new Error("navigation should be defined as object with at least one of the properties: 'prev' or 'next' in it!");
					}

					if (_value.prev && typeof _value.prev !== "string") {
						throw new Error("navigation.prev should be defined as a string and points to '.class' or '#id' of an element");
					}

					if (_value.next && typeof _value.next !== "string") {
						throw new Error("navigation.next should be defined as a string and points to '.class' or '#id' of an element");
					}
					break;

				case "auto":
					if (typeof _value.direction !== "string") {
						throw new Error("direction should be defined as a string");
					}

					if (!(_value.direction === "next" || _value.direction === "prev")) {
						throw new Error("direction: only 'right' and 'left' values are valid");
					}

					if (isNaN(_value.interval) || typeof _value.interval !== "number" || _value.interval < 0 || (Math.ceil(_value.interval) - _value.interval > 0)) {
						throw new Error("interval should be a positive number!");
					}
					break;

				case "margin":
					if (isNaN(_value) || typeof _value !== "number" || _value < 0 || (Math.ceil(_value) - _value > 0)) {
						throw new Error("margin should be a positive number!");
					}
					break;
				}
			}
		},
		
		_createDataObject: function () {
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
					animated: false
				}
			);
		},
		
		_generatePages: function() {
			var self = this,
				options = this.options,
				data = $( this.element ).data( "data" ),
				_visible = options.visible,
				_pathsLen = data.paths.length;
				
			// having 10 elements: A, B, C, D, E, F, G, H, I, J the algorithm
			// creates 3 pages for ‘visible: 5’ and ‘step: 4’:
			// [ABCDE], [EFGHI], [FGHIJ]

			function _init() {
				// init creates the last page [FGHIJ] and remembers it

				data.pages = [];
				data.lastPage = [];
				data.pages[0] = [];

				// init last page
				for ( var i = _pathsLen - 1; i >= _pathsLen - _visible; i-- ) {
					data.lastPage.unshift( data.paths[i] );
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

			function _append( start, end, atIndex ) {
				var _index = atIndex || data.pages.length;

				if ( !atIndex ) {
					data.pages[_index] = [];
				}

				for ( var i = start; i < end; i++ ) {
					data.pages[_index].push( data.paths[i] );
				}
				return _index;
			}

			function _paginate() {
				var _isBeginning = true,
					_complement = false,
					_start = options.step,
					_end, _index, _oldFirstEl, _oldLastEl;

				// continue until you reach the last page
				// we start from the 2nd page (1st page has been already initiated)
				while ( !_islastPage(data.pages[data.pages.length - 1]) || _isBeginning ) {
					_isBeginning = false;

					_end = _start + _visible;

					// we cannot exceed _pathsLen
					if ( _end > _pathsLen ) {
						_end = _pathsLen;
					}
					
					// when we run ouf of elements (_end - _start < _visible) we must add the difference at the begining
					// in our example the 3rd page is [FGHIJ] and J element is added in the second step
					// first we add [FGHI] as old elements
					// we must assure that we have always ‘visible’ (5 in our example) elements
					if ( _end - _start < _visible ) {
						_complement = true;
					} else {
						_complement = false;
					}

					if ( _complement ) {
						
						// first add old elemets; for 3rd page it adds [FGHI…]
						// remember the page we add to (_index)
						_oldFirstEl = _start - ( _visible - (_end - _start) );
						_oldLastEl = _oldFirstEl + ( _visible - (_end - _start) );
						_index = _append( _oldFirstEl, _oldLastEl );
						
						// then add new elements; for 3th page it is J element:
						// [fghiJ]
						_append( _start, _end, _index );

					} else {
						
						// normal pages like [ABCDE], [EFGHI]
						_append( _start, _end );
						
						// next step
						_start += options.step;
					}
				}
			}

			// go!
			_init();
			_paginate();
		},
		
		getTotalPages: function () {
			var self = this,
				options = self.options,
				data = $( this.element ).data( "data" );

			return data.pages.length;
		},
		
		goToPage: function (page) {
			var	self = this,
				options = self.options,
				data = $( this.element ).data( "data" ),
				_by;

			if (!data.animated && page !== data.pageIndex) {
				data.animated = true;

				if (page > data.pages.length - 1) {
					page = data.pages.length - 1;
				} else if (page < 0) {
					page = 0;
				}
				data.pageIndex = page;

				_by = page - data.oldPageIndex;
				if (_by >= 0) {
					//move by n elements from current index
					self._goToNextPage(_by);
				} else {
					self._goToPrevPage(_by);
				}
				data.oldPageIndex = page;
			}
		},
		
		_loadElements: function (elements, direction) {
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
			var _page, _oldPage, _dist, _index, _animOpts, $lastEl, _unique, _pos,
				$root = $( this.element ),
				self = this,
				options = this.options,
				data = $( this.element ).data( "data" );

			// pick the page
			_index = data.oldPageIndex + by;
			
			// copy the page because we will modify it
			_page = data.pages[_index].slice( 0 );
			
			_oldPage = data.pages[data.oldPageIndex];

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

					if ( options.auto.enabled ) {
						// reset autoModeInterval so that auto scrolling could start anew
						clearInterval( data.autoModeInterval );
						self._autoMode( options.auto.direction );
					}

					// scrolling is finished, send an event
					self._trigger("pageLoaded", null, {page: _index});
				});
		},
		
		_goToNextPage: function( by ) {
			var _page, _oldPage, _dist, _index, _animOpts, $firstEl, _unique, _pos,
				$root = $( this.element ),
				options = this.options,
				data = $root.data( "data" );				
				self = this;

			// pick pages
			_index = data.oldPageIndex + by;	
			_page = data.pages[_index].slice( 0 );
			_oldPage = data.pages[data.oldPageIndex];			

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

					if ( options.auto.enabled ) {
						// reset autoModeInterval so that auto scrolling could start anew
						clearInterval( data.autoModeInterval );
						self._autoMode( options.auto.direction );
					}

					// scrolling is finished, send an event
					self._trigger( "pageLoaded", null, {page: _index});

			});
		},
		
		next: function () {
			var	options = this.options,
				data = $( this.element ).data( "data" );

			if ( !data.animated ) {
				data.animated = true;

				++data.pageIndex;
				
				if ( data.pageIndex > data.pages.length - 1 ) {
					data.pageIndex = 0;
				}

				// move by one element from current index
				this._goToNextPage( data.pageIndex - data.oldPageIndex );
				data.oldPageIndex = data.pageIndex;
			}
		},
		
		prev: function () {
			var	options = this.options,
				data = $( this.element ).data( "data" );

			if ( !data.animated ) {
				data.animated = true;

				--data.pageIndex;
				if ( data.pageIndex < 0 ) {
					data.pageIndex = data.pages.length - 1;
				}

				// move left by one element from current index
				this._goToPrevPage( data.pageIndex - data.oldPageIndex );
				data.oldPageIndex = data.pageIndex;
			}
		},
		
		_removeOldElements: function (position, length) {
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
				data = $root.data( "data" );
				
			$elements.each(
				function( i, el ) {
					$el = $( el );
					data.paths.push( $el );
					$el.remove();
				}
			);		
		},
		
		_setOption: function (key, value) {
			var self = this,
				options = self.options,
				data = $( this.element ).data( "data" ),
				_newOptions;

			switch (key) {
			case "step":
				self._checkOptionsValidity({step: value});
				self._setStep(value);
				self._generatePages();

				// remove old LI elements before populating
				$(data.list).empty();
				self._loadElements();
				// apply...
				$.Widget.prototype._setOption.apply(this, arguments);
				break;

			case "speed":
				self._checkOptionsValidity({speed: value});
				options.speed = value;
				$.Widget.prototype._setOption.apply(this, arguments);
				break;

			case "navigation":
				self._checkOptionsValidity({navigation: value});
				if (value.next) {
					self._setEventHandlers("next");
				}

				if (value.prev) {
					self._setEventHandlers("prev");
				}
				$.Widget.prototype._setOption.apply(this, arguments);
				break;

			case "auto":
				_newOptions = $.extend(options.auto, value);
				self._checkOptionsValidity({auto: _newOptions});

				if (options.auto.enabled) {
					self._autoMode(options.auto.direction);
				} else {
					clearInterval(data.autoModeInterval);
				}
			}

		},
		_setStep: function (s) {
			// calculate a step
			var self = this,
				options = self.options,
				data = $( this.element ).data( "data" ),
				_step;

			_step = s || options.step;

			options.step = _step;
			data.step = options.width * _step;
		},
		
		_setCarouselHeight: function () {
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
		
		_setCarouselWidth: function () {
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
				next: "#ui-rcarousel-next",
				prev: "#ui-rcarousel-prev"
			}
		}
	});
}(jQuery));