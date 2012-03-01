/*
 * Feach 0.1
 * Feature management plus OO plus jQuery
 * https://github.com/averyvery/feach
 *
 * Copyright 2012, Doug Avery
 * Dual licensed under the MIT and GPL licenses.
 * Uses the same license as jQuery, see:
 * http://jquery.org/license
 *
 * Should be compressed with http://jscompress.com/
 */

(function(document, window, $){

	'use strict';
	
	$.feach = $.fn.feach = function(name){
		var is_elem = $.feach.Feature.prototype._isElement(this),
			return_data,
			already_defined = $.feach.features[name] !== undefined;
		if(is_elem){
			return_data = $.feach.Feature.prototype._getInst(this, name);
		} else {
			return_data = already_defined ? $.feach.features[name] : $.feach.new(name);
		}
		return return_data;
	};

	$.feach.new = function(name){
		var feature = new $.feach.Feature(name);
		$.feach.features[name] = feature;
		return feature;
	};

	$.feach.features = {};

	$.feach.Feature = function(name){
		this.name = this.name || name;
		this.def = this.def || function(){};
		this.instances = this.instances || [];
	};

	$.feach.Feature.prototype = {

		define : function(obj){
			this.def.prototype = new $.feach.Base();
			$.extend(this.def.prototype, obj);
			$.feach.features[this.name] = this;
			return this;
		},

		aug : function(obj){
			$.extend(this.def.prototype, obj);
			return this;
		},

		each : function(callback){
			var args = Array.prototype.slice.call(arguments, 1);
			$.each(this.instances, function(){
				var callback_to_execute = typeof callback === 'string' ? this[callback] : callback;
				callback_to_execute.apply(this, args);
			});
			return this;
		},

		// based on http://ejohn.org/blog/simple-javascript-inheritance/
		extend : function(parent_name){
			if($.feach.features[parent_name]){
				var fn_test = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/,
					parent = $.feach.features[parent_name].def.prototype || function(){}.prototype,
					child = this.def.prototype;
				for (var key in parent) {
					var is_new_prop = child[key] === undefined,
						is_existing_fn = 
							!is_new_prop
							&& $.isFunction(parent[key]) 
							&& $.isFunction(child[key])
							&& fn_test.test(child[key]),
						super_wrapper = (function(key, fn){
							return function() {
								var tmp = this._super;
								this._super = parent[key];
								var ret = fn.apply(this, arguments);        
								this._super = tmp;
								return ret;
							};
						})(key, child[key]);
					child[key] = is_new_prop ? parent[key] : child[key];
					child[key] = is_existing_fn ? super_wrapper : child[key];
				}
			}
			return this;
		},

		get : function(){
			var $elems = $();
			for(var i = 0; i < this.instances.length; i++){
				var inst = this.instances[i];
				$elems = $elems.add(inst.$elem);
			}
			return $elems;
		},

		make : function(){
			var self = this,
				selector = self._overload(self._isSelector, arguments) || self.def.prototype.selector || 'body',
				$context = self._overload($.isArray, arguments),
				config = self._overload($.isPlainObject, arguments) || {},
				$elems = $(selector, $context);
			$elems.each(function(index){  
				self.instantiate(this, index, config);
			});
			return this;
		},

		instantiate : function(elem, index, config){
			var inst = new this.def();
			$.extend(inst, this.dynamic, {
				index : index,
				$elem : $(elem),
				options : $.extend(
					{}, 
					inst.defaults, 
					config, 
					$(elem).data()
				)
			});
			inst.feature = this;
			this._store(inst);
			inst.init && inst.init();
		},

		destroy : function(destroy_instances, destroy_elems){
			destroy_instances && this.each('_destroy', destroy_elems);
			delete $.feach.features[this.name];
		},

		_store : function(inst){
			this.instances.push(inst);
			inst.$elem.data('inst' + this.name, inst);
		},

		_isSelector : function(arg){
			return typeof arg === 'string';
		},

		_overload : function(method, raw_args){
			var args = Array.prototype.slice.call(raw_args, 0),
				return_data = undefined;
			for(var i = 0; i < args.length; i++){
				if(method(args[i])){
					return_data = args[i];
				}
			}
			return return_data;
		},

		// http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
		_isElement : function(obj) {
			var obj_to_test = obj[0] || obj;
			try {
				return obj_to_test instanceof HTMLElement;
			}
			catch(e){
				return (typeof obj_to_test === "object") &&
					(obj_to_test.nodeType === 1) && (typeof obj_to_test.style === "object") &&
					(typeof obj_to_test.ownerDocument ==="object");
			}
		},

		_getInst : function(elem, name){
			var data = $(elem).data(),
				return_data; 
			if(name){
				return_data = data['inst' + name];
			} else {
				for(var key in data){
					if(key.match(/^inst[A-Z]/)){
						return_data = data[key]; 
						break;
					}
				}
			}
			return return_data;
		}

	};

	$.feach.makeAll = function(){
		var args = Array.prototype.slice.call(arguments, 0);
		for(var name in $.feach.features){
			var self = $.feach.features[name];
			self.make.apply(self, args);
		}
		return $.feach.features;
	},

	$.feach.Base = function(){};

	$.feach.Base.prototype = {

		_cacheDom : function(obj, prefix){
			obj = obj || this.dom_selectors || {};
			prefix = prefix || this.dom_selector_prefix || '';
			for(var key in obj){
				this['$' + key] = $(prefix + obj[key], this.$elem);
			}
		},

		_destroy : function(remove_elem){
			var index = this._instIndex();
			this.tearDown && this.tearDown();
			remove_elem && this.$elem.remove();
			index !== undefined 
				&& this.feature 
				&& this.feature.instances 
				&& this.feature.instances.splice(index, 1);
		}, 

		_instIndex : function(){
			var index;
			for(var i = 0; i < this.feature.instances.length; i++){
				if (this === this.feature.instances[i]){
					index = i;
				}
			}
			return index;
		}

	};

})(document, window, jQuery);
