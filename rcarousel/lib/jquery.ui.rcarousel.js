(function ($) {
	$.widget("ui.rcarousel", {
		_create: function () {
			var self = this,
				structure = self.structure,
				options = self.options,
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
				self._configure(true);
			} else if ($(_root).children().length === 0) {
				// structure hasn't been created yet - create it
				options._configure(false);
			}
		},
		_checkOptionsValidity: function(options) {
			var	self = this,
				_correctSteps = "",
				_key, _value, i, _lastCorrectStep;

			// for every element in options object check its validity
			for (_key in options) {
				_value = options[_key];
				switch (_key) {
					case "mode":
						if (_value.name !== "fixed" && _value.name !== "variable") {
							throw new Error("Only mode.name: 'fixed' and mode.name: 'variable' are valid");
						} else if (_value.name === "fixed") {
							// default 'step' for 'fixed' mode will probably be invalid
							// 'step' for 'fixed' mode is optional so can be reseted to null
							if (_value.step === _value.defaultStep) {
								_value.step = null;
							} else if (_value.step && typeof _value.step !== "number" || _value.step <= 0) {
								throw new Error("mode.step should be a positive number");
							} else {
								// step exists and is not default value
								// for example for visible: 3.5 the following array of values for 'step' is valid
								// 3.5 <= step >= 1 by 1 ==> [1,2,3,3.5]
								if (_value.step < 1 || _value.step > _value.visible) {
									// output correct values
									for (i = 1; i<= Math.floor(_value.visible); i++) {
										_correctSteps += (i < Math.floor(_value.visible)) ? i + ", " : i;
									}
									// last correct value e.g 3.5
									_lastCorrectStep = (Math.ceil(_value.visible) - _value.visible === 0) ? "" : _value.visible;
									_correctSteps += _lastCorrectStep;

									throw new Error("Only following mode.step values are correct: " + _correctSteps);
								}
							}

							if (typeof _value.visible !== "number" || _value.visible <= 0) {
								throw new Error("mode.visible should be defined as a positive number!");
							}
						} else {
							if (_value.step && typeof _value.step !== "number" || _value.step <= 0) {
								throw new Error("mode.step should be a positive number");
							}
						}
						// width & height is defined by default so you can omit them to some extent
						if (_value.width && (isNaN(_value.width) || typeof _value.width !== "number" || _value.width <= 0)) {
							throw new Error("mode.width should be a positive number!");
						}

						if (_value.height && (isNaN(_value.height) || typeof _value.height !== "number" || _value.height <= 0)) {
							throw new Error("mode.height should be a positive number!");
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
							throw new Error("navigation should be defined as object with 'prev' and 'next' properties in it!");
						}

						if (_value.prev && typeof _value.prev !== "string") {
							throw new Error("navigation.prev should be defined as a string and points to '.class' or '#id' of an element");
						} else if (_value.next && typeof _value.next !== "string") {
							throw new Error("navigation.next should be defined as a string and points to '.class' or '#id' of an element");
						}
						break;
				}
			}
		},
		_configure: function(hardcoded) {
			// configuration depends on if carousel was hardcoded or not
			var self = this;

			if (hardcoded) {
				self._setStructure();
			} else {
				self._createStructure();
				self.populate();
			}
			self._setCarouselWidth();
			self._setCarouselHeight();
			// TODO ujednolicić
			self._setEventHandlers("next");
			self._setEventHandlers("prev");
			self._setStep();
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
		next: function() {
			var	self = this,
				structure = self.structure;

			structure.currentStep += structure.step;
			$(structure.wrapper).scrollLeft(structure.currentStep);
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
		prev: function() {
			var	self = this,
				structure = self.structure;

			structure.currentStep -= structure.step;
			$(structure.wrapper).scrollLeft(structure.currentStep);
		},
		_setOption: function(key, value) {
			var self = this,
				structure = self.structure;
				options = self.options;

			switch (key) {
				case "mode":
					self._checkOptionsValidity({mode: value});
					if (value.name) {
						options.mode.name = value.name;
					}

					if (value.visible || value.visible === null) {
						options.mode.visible = value.visible;
					}

					if (value.width) {
						options.mode.width = value.width;
						self._setCarouselWidth({width: value.width, visible: value.visible});
					}

					if (value.height) {
						options.mode.height = value.height;
						self._setCarouselHeight({height: value.height});
					}

					if (value.step) {
						self._setStep(value.step);
					}
					break;

				case "navigation":
					self._checkOptionsValidity({navigation: value});
					if (value.next) {
						options.navigation.next = $(value.next);
						self._setEventHandlers("next");
					}

					if (value.prev) {
						options.navigation.prev = $(value.prev);
						self._setEventHandlers("prev");
					}
					break;
			}
			$.Widget.prototype._setOption.apply(this, arguments);

		},
		_setStep: function(s) {
			// calculate a step
			// the step for carousel with fixed mode except set 'step' is
			// amount of visible elements times element's width
			// for 'fixed' mode with set 'step': width * step
			var self = this,
				structure = self.structure,
				options = self.options,
				_mode, _step;

			_mode = options.mode;
			_step = s || _mode.step

			// initial step for calculation purposes
			structure.currentStep = 0;

			if (_mode.name === "fixed") {
				if (!_step) {
					structure.step = _mode.visible * _mode.width;
				} else {
					structure.step = _mode.width * _mode.step;
				}
			} else {
				structure.step = _step;
			}
		},
		_setStructure: function() {
			var self = this,
				_root = $(this.element),
				options = self.options,
				structure = self.structure;

			// wrapper holds UL with LIs
			structure.wrapper = $("div.wrapper", _root);
			structure.list = $("ul", structure.wrapper);

			// save basic navigation
			structure.navigation.next = $(options.navigation.next);
			structure.navigation.prev = $(options.navigation.prev);
		},
		_setCarouselHeight: function(h) {
			var self = this,
				options = self.options,
				structure = self.structure,
				_height;

			_height = h || options.mode.height;
			$(structure.wrapper).height(_height);
		},
		_setCarouselWidth: function(obj) {
			var self = this,
				options = self.options,
				structure = self.structure,
				_width, _newWidth, _visible, _object;

			_object = obj || {};
			_width = _object.width || options.mode.width;
			_visible = _object.visible || options.mode.visible;

			_newWidth = _visible ? _visible * _width : _width;
			// set carousel width and disable overflow: auto
			$(structure.wrapper).css({
				width: _newWidth,
				overflow: "hidden"
			});
		},
		_setEventHandlers: function(action) {
			// basic navigation: next and previous item
			var self = this,
				options = self.options;

			if (action === "next") {
				$(options.navigation.next).click(function() {
					self.next();
				});
			}

			if (action === "prev") {
				$(options.navigation.prev).click(function() {
					self.prev();
				});
			}
		},
		options: {
			mode: {
				name: "variable",
				width: 500,
				height: 300,
				step: 30,
				// should not be changed!
				defaultStep: 30,
				visible: null
			},
			navigation: {
				next: ".carouselNext",
				prev: ".carouselPrev"
			}
		},
		structure: {
			navigation: {}
		}
	});
} (jQuery));