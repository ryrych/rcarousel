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
				// if everyting is OK set new width & height
				self._setCarouselWidth();
				self._setCarouselHeight();

			} else if ($(_root).children().length === 0) {
				// structure hasn't been created yet - create it
				self._createStructure();
				self.populate();
				self._setCarouselWidth();
				self._setCarouselHeight();
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

					case "height":
						if (isNaN(_value) || typeof _value !== "number") {
							throw new Error("height should be a number!");
						}
						break;

					case "visible":
						if (isNaN(_value)) {
							throw new Error("Value of visible option should be a number!");
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
				}
			}
		},
		_createStructure: function() {
			var	self = this,
				structure = self.structure,
				_carousel = $(this.element),
				_wrapper, _list;

			_wrapper = $("<div class='wrapper'></div>")
				.appendTo(_carousel);
			structure.wrapper = _wrapper;

			_list = $("<ul></ul>")
				.appendTo(_wrapper);
			structure.list = _list;

			$(_carousel).appendTo("body");
		},
		populate: function(obj) {
			// populate carousel with elements
			// 'path' is a path to local or remote file
			// only xml and json formats are valid
			// populate removes old elements when called in a row
			var self = this,
				structure = self.structure,
				options = self.options,
				_lists = "",
				_object, _path, _nodes, _format;

			// if populate is used as a public method
			// check options validity
			if (obj) {
				self._checkOptionsValidity({remote: obj});
			}

			_object = obj || {};
			_path = _object.path || options.remote.path;
			_format = _object.format || options.remote.format;

			// remove old LI elements before populating
			$(structure.list).empty()

			// ...and populate with new ones
			// if used format is 'json' parse file under 'path'
			if (_format === "json") {
				$.getJSON(_path, function(data) {
					$.each(data.paths, function(i, item) {
						_lists += "<li><a href='#'><img src=";
						_lists += "'" + item + "'";
						_lists += "/></a></li>";
					});
					// populate the list
					$(structure.list).append(_lists);
				});

			} else if (_format === "xml") {
				$.get(_path, function(data) {
					_nodes = $(data).find("path");
					$.each(_nodes, function(i, item) {
						_lists += "<li><a href='#'><img src=";
						_lists += "'" + $(item).text() + "'";
						_lists += "/></a></li>";
					});
					$(structure.list).append(_lists);
				});
			}
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
			structure.list = $("ul", structure.wrapper);
		},
		_setCarouselHeight: function(h) {
			var self = this,
				options = self.options,
				structure = self.structure,
				_height;

			_height = h || options.height;
			$(structure.wrapper).height(_height);
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
			height: 300,
			visible: null,
			width: 500
		},
		structure: {}
	});
} (jQuery));