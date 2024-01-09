(function(window, $) {
	var sisComboBox = function(elem, options) {
		this.$elem = $(elem);
		this.options = options;
		this.init();
	};

	sisComboBox.prototype = {
		config: null,
		cache: null,
		loaderParams: null,

		defaults : {
			baseItem 	: null
		},

		init : function() {
			this.config = $.extend({}, this.defaults, this.options);
			this.cache = [];

			var $elem = this.$elem;

			if (this.config.remoteKey) {
				$elem.attr("data-remote-key", this.config.remoteKey);
			}

			$elem.attr("data-initialized", "false");

			$elem.empty();

			if (this.config.baseItem != null) {
				$elem.append("<option value='" + this.config.baseItem.value + "'>-----</option>");
			}
			$elem.prop("disabled", true);

			return this;
		},

		load: function(params) {
			var self = this;
			var $elem = self.$elem;

			params = $.extend({}, {
				select		: null,
				dataParams	: {},
				onSuccess	: function(){},
				onComplete	: function(){}
			}, params);

			this._setLoaderParams(params);

			var depends = $elem.attr("data-depends");

			var reqParams = {};
			if (depends) {
				$(depends).each(function() {
					if ($elem !== $(this)) {
						var _key = $(this).attr("data-remote-key");
						params.dataParams[_key] = ($(this).is("select") ? $(":selected", this) : $(this)).val();
					}
				});
			}

			if ($elem.attr("data-initialized") == "true") {
				params.select = null;
			} else {
				$elem.attr("data-initialized", "true");
			}

			//console.log("[sisComboBox.load][url] " + this.config.url);

			var cacheKey = $elem.attr("id");
			$.each(params.dataParams, function(key,value) {
				cacheKey += "-" + value;
			});

			if (self.cache[cacheKey]) {
				var data = self.cache[cacheKey];
				self._build(data, params);

				if (typeof $elem.selectmenu === "function") $elem.selectmenu("refresh", true);

			} else {
				$.runner = (!$.runner) ? 1 : $.runner + 1;
				$.ajax({
					url : this.config.url,
					data: params.dataParams,
					success : function(json) {
						if (!$.xhrCheckData(json)) return false;
						self.cache[cacheKey] = json;
						self._build(json, params);
						params.onSuccess(self, json);
					},
					complete: function(xhr, status) {
						params.onComplete(self, xhr, status);
						$.runner --;

						if (typeof $elem.selectmenu === "function") $elem.selectmenu("refresh", true);
					}
				});
			}


			return this;

		},


		_setLoaderParams: function(params) {
			this.loaderParams = params;
		},

		reset: function() {
			var $elem = this.$elem;

			$elem.attr("data-initialized", "false");
			if (!$elem.attr("data-depends")) {
				this.load(this.loaderParams);
			}
		},

		_build: function(json, params) {
			var self = this;
			var $elem = self.$elem;

			var dataset = [];
			if ($.isArray(json)) {
				if ($.isArray(json[0])) {
					/* [["","--"],["code-1","1 code"],["code-3","3 code"]] */
					dataset = json;
				} else {
					/* [{"":"--"},{"code-1":"1 code"},{"code-3":"3 code"}] */
					dataset = $.map(json, function(value) {
						return $.map(value, function(value, index) {
							return [[index, value]];
						});
					});
				}
			} else {
				/* {"":"--","code-1":"1 code","code-3":"3 code"} */
				for (var index in json) {
					if (json.hasOwnProperty(index)) {
						dataset.push([index, json[index]]);
					}
				}
			}

			$elem.empty();
			if (self.config.baseItem != null) {
				$elem.append("<option value='" + self.config.baseItem.value + "'>" + self.config.baseItem.name + "</option>");
			}
			$elem.append(self._getItems(dataset, params.select));
			$elem.prop("disabled", false);

			if (params.select) {
				$elem.trigger("change");
			}
		},

		_getItems: function (dataset, select) {
			var items = [];
			var idx = 0;
			var self = this;

			$(dataset).each( function() {
				var data = dataset[idx];
				var selected = (select == data[0]) ? " selected='selected'" : "";
				items[idx] = "<option value='" + data[0] + "'" + selected +">" + data[1] + "</option>";
				idx++;
			});

			return items;
		},


		setChain: function(params) {
			var self = this;
			var $elem = this.$elem;

			params = $.extend({}, {
				parent		: null,
				depends		: null,
				select		: null,
				onSuccess	: function(){}
			}, params);

			if ($elem.attr("data-initialized") == "true") {
				this.init();
			}

			if (params.depends) {
				$elem.attr("data-depends", params.depends);
			}

			if (params.parent) {
				var parent = params.parent;
				var $parent = parent.getEl();

				$parent.unbind("change");
				$parent.bind("change", function() {
					$elem.empty();
					if (self.config.baseItem != null) {
						$elem.append("<option value='" + self.config.baseItem.value + "'>-----</option>");
					}
					$elem.trigger("change");
					if (typeof $elem.selectmenu === "function") {
						console.log("test");
						$elem.selectmenu().selectmenu("refresh", true);
					}
					$elem.prop("disabled", true);

					if (parent.config.baseItem) {
						var topVal = parent.config.baseItem.value;
						var curVal = $(":selected", $parent).val();
						if (!curVal || curVal == topVal) {
							return;
						}
					}

					var stopChained = $parent.attr("data-stopchained");
					if (stopChained == "true") {
						return;
					}

					var loaderParams = {
						select: null,
						onSuccess: function() {
							params.onSuccess();
						}
					};

					if (params.select) {
						loaderParams.select = params.select;
					}

					$elem.empty();
					self.load(loaderParams);
				});

			}

			return this;

		},

		stopChained: function(val) {
			var self = this;
			var $elem = this.$elem;

			$elem.attr("data-stopchained", (val == true) ? "true" : "false");
			$elem.trigger("change");

			return this;
		},

		getId: function() {
			return this.$elem.attr('id');
		},

		getEl: function() {
			return this.$elem;
		}
	}

	sisComboBox.defaults = sisComboBox.prototype.defaults;

	window.sisComboBox = sisComboBox;

})(window, jQuery);