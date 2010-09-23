(function ($) {
	$.widget("ui.rcarousel", {
		_create: function () {
			var self = this,
				structure = self.structure,
				_root = $(this.element);

			// if options were default there should be no problem
			// check if user set options before init: $('element').rcarousel({with: "foo", visible: 3});
			// in above example exception will be thrown bacause 'with' should be a number!
			self._checkOptionsValidity(self.options);

			// check if structure is hardcoded and valid
			if ($(_root).children().length > 0) {
				if ($(_root).children("div.wrapper:first-child").length === 0) {
					throw new Error("Structure should have contained DIV.wrapper");
				} else if ($(_root).children("div.wrapper:first-child").find("ul > li").length < 1) {
					// there is DIV element inside element rcarousel is invoked on; check if it contains
					// UL and at least one LI element
					throw new Error("Inside DIV.wrapper you should have placed UL element with at least one LI element");
				}
				// everything is OK
				self._setStructure();
				// if everyting is OK set new width
				self._setCarouselWidth();

			} else if ($(_root).children().length === 0) {
				// structure hasn't been created yet - create it
				self._createStructure();
				self._setCarouselWidth();
			}
		},
		_checkOptionsValidity: function(options) {
			var	self = this,
				_key, _value;

			// for every element in options object check its validity
			for (_key in options) {
				_value = options[_key];
				switch (_key) {
					case "width":
						if (isNaN(_value)) {
							throw new Error("Value of visible option should be a number!");
						}
						break;

					case "visible":
						if (isNaN(_value)) {
							throw new Error("Value of visible option should be a number!");
						}
						break;
				}
			}
		},
		_createStructure: function() {
			var	self = this,
				structure = self.structure,
				_carousel = $(this.element),
				_wrapper;

			_wrapper = $("<div class='wrapper'></div>")
				.appendTo(_carousel);
			structure.wrapper = _wrapper;

			$("<ul><li><a href='#'><img src='images/a.png' /></a></li> <li><a href='#'><img src='images/b.png' /></a></li> <li><a href='#'><img src='images/c.png' /></a></li></ul>")
				.appendTo(_wrapper);

			$(_carousel).appendTo("body");
		},
		_setOption: function(key, value) {
			var self = this,
				options = self.options;

			switch (key) {
				case "visible":
					self._checkOptionsValidity({visible: value});
					options.visible = value;
					self._setCarouselWidth({visible: value});
					break;

				case "width":
					self._checkOptionsValidity({width: value});
					self.options.width = value;
					self._setCarouselWidth({width: value});
					break;
			}
			$.Widget.prototype._setOption.apply(this, arguments);

		},
		_setStructure: function() {
			var self = this,
				_root = $(this.element),
				structure = self.structure;

			structure.wrapper = $("div.wrapper", _root);
		},
		_setCarouselWidth: function(obj) {
			var self = this,
				options = self.options,
				structure = self.structure,
				_width, _newWidth, _visible, _object;

			_object = obj || {};
			_width = _object.width || options.width;
			_visible = _object.visible || options.visible;

			_newWidth = _visible ? _visible * _width : _width;
			// set carousel width and disable overflow: auto
			$(structure.wrapper).css({
				width: _newWidth,
				overflow: "hidden"
			});
		},
		options: {
			visible: 3,
			width: 200
		},
		structure: {}
	});
} (jQuery));