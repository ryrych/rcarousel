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
				self._configure(false);
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
			var self = this,
				structure = self.structure;

			if (hardcoded) {
				self._setStructure();
				structure.hardcoded = true;
			} else {
				self._createStructure();
				self.load();
				structure.hardcoded = false;
			}
			self._setCarouselWidth();
			self._setCarouselHeight();
			// TODO ujednolicić
			self._setEventHandlers("next");
			self._setEventHandlers("prev");
			self._setStep();
		},
		_createNewElement: function(image, dir) {
			// create new LI element with IMG inside it
			var self = this,
				structure = self.structure,
				_li = $("<li></li>");

			$(_li).append(image);
			if (dir === "prev") {
				$(structure.list).prepend(_li);
			} else {
				$(_li).appendTo(structure.list);
			}
			// change UL width to fit newly created elements
			self._setInnerWidth();
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
		load: function(obj) {
			var self = this,
				structure = self.structure,
				options = self.options;

			// check object validity
			if (obj) {
				self._checkOptionsValidity({remote: obj});
			}

			_object = obj || {};
			_path = _object.path || options.remote.path;
			_format = _object.format || options.remote.format;

			// remove old LI elements before populating
			$(structure.list).empty()

			// now elements are not hardcoded
			structure.hardcoded = false;

			// load a file
			if (_format === "json") {
				$.getJSON(_path, function(data) {
					$.each(data.paths, function(i, item) {
						// store path to a file
						structure.paths.push(item);
					});
					// now load new items
					self._loadElements(0);
				});

			} else if (_format === "xml") {
				$.get(_path, function(data) {
					_nodes = $(data).find("path");
					$.each(_nodes, function(i, item) {
						structure.paths.push($(item).text());
					});
					self._loadElements(0);
				});
			}
		},
		_loadElement: function (path) {
			var _image = new Image(),
				_loadWatch;

			_image.src = path;

			function _watch() {
				if (_image.complete) {
					clearInterval(_loadWatch);
				}
			}
			_loadWatch = setInterval(_watch, 100);
			return _image;
		},
		_loadElements: function(start, end) {
			var self = this,
				options = self.options,
				structure = self.structure,
				i, _howMany, _start, _end, _dir;

			// from which element to start
			_start = start || 0;
			_end = end || options.mode.visible - 1;
			_howMany = Math.abs(_end - _start);
			_dir = _end - _start > 0 ? "next" : "prev";

			console.log("zaczynam od: " + _start);
			console.log("end wynosi: " + _end);
			if (_dir === "next") {
				for (i = _start; i <= _end; i++) {
					self._createNewElement(self._loadElement(structure.paths[i]), _dir);
				}
				// remember the last loaded element
				structure.lastFirstElement = _start;
				structure.lastEndElement = _end;
				console.log("zakończyłem na: " + structure.lastEndElement);
			} else {
				for (i = _start; i >= _end; i--) {
					self._createNewElement(self._loadElement(structure.paths[i]), _dir);
				}
				structure.lastEndElement = _end === 0 ? 1 : end + 1;
				structure.lastFirstElement = i + 1;
			}


		},
		next: function() {
			var	self = this,
				structure = self.structure,
				options = self.options,
				_step = options.mode.step ? options.mode.step : options.mode.visible;

			if (structure.hardcoded) {
				if (structure.currentStep < structure.innerWidth) {
					structure.currentStep += structure.step;
					$(structure.wrapper).scrollLeft(structure.currentStep);
				}
			} else {
				if (structure.lastEndElement < structure.paths.length - 1) {
					++structure.lastEndElement;
					self._loadElements(structure.lastEndElement, structure.lastEndElement + _step - 1);
					$(structure.wrapper).scrollLeft(structure.step * 2);
					self._removeOldElements(0);
					$(structure.wrapper).scrollLeft(0);
				}
			}
		},
		prev: function() {
			var	self = this,
				structure = self.structure,
				options = self.options,
				_step = options.mode.step ? options.mode.step : options.mode.visible;

			if (structure.hardcoded) {
				if (structure.currentStep > 0) {
					structure.currentStep -= structure.currentStep;
					$(structure.wrapper).scrollLeft(structure.currentStep);
				}
			} else {
				if (structure.lastFirstElement > 0) {
					--structure.lastFirstElement;
					self._loadElements(structure.lastFirstElement, structure.lastFirstElement - _step + 1);
					$(structure.wrapper).scrollLeft(0);
					self._removeOldElements(_step)
				}
			}
		},
		_removeOldElements: function(start) {
			// remove 'step' elements
			var self = this,
				structure = self.structure,
				options = self.options,
				i, _step, _whichRemove, _arr, _len;

			_step = !_step ? options.mode.visible : options.mode.step;
			_whichRemove = start > 0 ? "last" : "first"

			for (i = start; i < start + _step; i++) {
				if (_whichRemove === "first") {
					$("li", structure.list).eq(0).remove();
				} else {
					_arr = $("li", structure.list);
					_len = $(_arr).length;
					$(_arr).eq(_len - 1).remove();
				}
			}
		},
		_setInnerWidth: function() {
			// recalculate UL's width to fit all elements
			// in case of fixed mode with hardcoded elements it's simple:
			// all elements are known for the beginning so only count them and multiply by common width
			var self = this,
				structure = self.structure,
				options = self.options,
				_sum = 0,
				_counter, _innerWidth, _lis;

			_counter = $("li", structure.list).length;
			if (structure.hardcoded) {
				if (options.mode.name === "fixed") {
					// set the width
					_innerWidth = _counter * options.mode.width;
					$(structure.list).width(_innerWidth);
					// save UL width for navigation purposes
					structure.innerWidth = _innerWidth;
				} else if (options.mode.name === "variable") {
					// we must to compute width of all single elements cuz their width is different
					_lis = $("li", structure.list);
					$.each(_lis, function(i, el) {
						_sum += $(el).width();
					});
					_innerWidth = _sum;
					structure.innerWidth = _innerWidth;
					$(structure.list).width(_innerWidth);
				}
			}
			else {
				if (options.mode.name === "fixed") {
					_innerWidth = _counter * options.mode.width;
					$(structure.list).width(_innerWidth);
					structure.innerWidth = _innerWidth;
				}
			}

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

					if (value.remote) {
						options.remote.path = value.remote.path;
						options.remote.format = value.remote.format;
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

			_newWidth = _visible  && options.mode.name === "fixed" ? _visible * _width : _width;
			// set carousel width and disable overflow: auto
			$(structure.wrapper).css({
				width: _newWidth,
				overflow: "hidden"
			});
			// change UL width
			self._setInnerWidth();


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
			navigation: {},
			paths: [],
			lastFirstElement: 0,
			lastEndElement: 0
		}
	});
} (jQuery));