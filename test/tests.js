(function(){

	"use strict";

	describe('Feach Core', function(){

		beforeEach(function () {
			$.feach.features = {};
		});

		/* @group $.feach methods */

			describe('$.feach', function(){

				it('creates new Feature when given a unique name', function(){
					var feature = $.feach('Foo');
					expect(feature instanceof $.feach.Feature).toEqual(true);
				});

				it('assigns new Feature a name when passed name', function(){
					var feature = $.feach('Foo');
					expect(feature.name).toEqual('Foo');
				});

				it('stores feature if feature doesn\'t exist and name is set', function(){
					var feat = $.feach('Poop');
					expect($.feach.features.Poop).toEqual(feat);
				});

				it('returns existing feature when passed an existing name', function(){
					$.feach.features.Bar = true;
					var feat = $.feach('Bar');
					expect(feat).toEqual(true);
				});

				it('creates unnamed Feature when passed nothing', function(){
					var feature = $.feach();
					expect(feature.name).toEqual(undefined);
				});

				it('returns the results of _getInst when chained from a DOM element', function(){
					var $elem = $('<div class="foo"></div>');
					spyOn($.feach.Feature.prototype, '_getInst').andReturn('foo');
					expect($elem.feach()).toEqual('foo');
				});

			});
			
			describe('$.feach.makeAll', function(){

				it('runs .make() all Features', function(){
					var Foo = $.feach('Foo');
					var Bar = $.feach('Bar');
					spyOn(Foo, 'make');
					spyOn(Bar, 'make');
					$.feach.makeAll();
					expect(Foo.make).toHaveBeenCalled();
					expect(Bar.make).toHaveBeenCalled();
				});

				it('applies all arguments to .make()', function(){
					var Foo = $.feach('Foo');
					var Bar = $.feach('Bar');
					spyOn(Foo, 'make');
					spyOn(Bar, 'make');
					$.feach.makeAll('foo', 'bar');
					expect(Foo.make.mostRecentCall.args).toEqual(['foo', 'bar']);
					expect(Bar.make.mostRecentCall.args).toEqual(['foo', 'bar']);
				});

				it('returns Features', function(){
					var Foo = $.feach('Foo');
					var Bar = $.feach('Bar');
					var feat = $.feach.makeAll();
					expect(feat).toEqual($.feach.features);
				});

			});

		/* @end */

		/* @group Feature core */

			describe('Feature.define', function(){

				it('creates prototype when passed obj', function(){
					var feat = $.feach().define({foo : 'bar'});
					expect(feat.def.prototype.foo).toEqual('bar');
				});

				it('creates base prototype when passed nothing', function(){
					var feat = $.feach().define();
					expect(feat.def.prototype).toEqual($.feach.Base.prototype);
				});

				it('stores feature in $.feach.features', function(){
					var feat = $.feach('Foo');
					$.feach.features.Foo = undefined;
					feat.define('Foo');
					expect($.feach.features.Foo).toEqual(feat);
				});

				it('returns Feature', function(){
					var feat = $.feach();
					expect(feat.define()).toEqual(feat);
				});

				it('creates features that are augmentable after the fact', function(){
					var instance = $.feach('Foo').define({'foo' : 'bar'}).make().instances[0];
					expect(instance.foo).toEqual('bar');
					$.feach('Foo').aug({'foo' : 'not bar'});
					expect(instance.foo).toEqual('not bar');
				});

				it('creates features can be augmented after the fact by a change in the BASE class', function(){
					var instance = $.feach('Foo').define().make().instances[0];
					expect(instance.foo).toEqual(undefined);
					$.feach.Base.prototype.foo = 'bar';
					expect(instance.foo).toEqual('bar');
				});

			});

			describe('Feature.aug', function(){

				it('extends def prototype', function(){
					var feat = $.feach();
					expect(feat.def.prototype.foo).toEqual(undefined);
					feat.aug({foo : 'bar'});
					expect(feat.def.prototype.foo).toEqual('bar');
				});

				it('returns Feature', function(){
					var feat = $.feach();
					expect(feat.aug()).toEqual(feat);
				});

			});

			describe('Feature.extend', function(){

				it('adds properties to prototype from "parent"', function(){
					var Foo = $.feach('Foo').define({prop : true});
					var Bar = $.feach('Bar').define()
					Bar.extend('Foo');
					expect(Bar.def.prototype.prop).toEqual(true);
				});

				it('doesn\'t overwrite properties from parent', function(){
					var Foo = $.feach('Foo').define({prop : true});
					var Bar = $.feach('Bar').define({prop : false})
					Bar.extend('Foo');
					expect(Bar.def.prototype.prop).toEqual(false);
				});

				it('stores parent function as _super', function(){
					var Foo = $.feach('Foo').define({prop : true, foo : function(){ return this.prop; }});
					var Bar = $.feach('Bar').define({foo : function(){ return this._super() }}).extend('Foo');
					var inst = Bar.make().instances[0];
					expect(inst.foo()).toEqual(true);
				});

				it('returns Feature', function(){
					var feat = $.feach('Bar').define().extend('Foo');
					expect(feat).toEqual($.feach.features.Bar);
				});

			});

			describe('Feature.get', function(){

				it('return all DOM elements', function(){
					$('<cite></cite><cite></cite><cite></cite>').appendTo('body');
					var feat = $.feach('Foo').make('cite');
					expect(feat.get().length).toEqual(3);
				});

			});

			describe('Feature.destroy', function(){

				it('removes feature from $.feach.features', function(){
					var feat = $.feach('Foo');
					expect($.feach.features.Foo === undefined).toEqual(false);
					feat.destroy();
					expect($.feach.features.Foo === undefined).toEqual(true);
				});

				it('calls destroy on all instances if passed true', function(){
					var feat = $.feach('Foo');
					feat.instances[0] = {_destroy : function(){}};
					feat.instances[1] = {_destroy : function(){}};
					spyOn(feat.instances[0], '_destroy');
					spyOn(feat.instances[1], '_destroy');
					feat.destroy(true);
					expect(feat.instances[0]._destroy).toHaveBeenCalled();
					expect(feat.instances[1]._destroy).toHaveBeenCalled();
				});

			});

		/* @end */

		/* @group Feature internals */
			
			describe('Feature._store', function(){

				it('stores instance in a Feature\'s instance array', function(){
					var feat = $.feach('Foo');
					var inst = {$elem : $('body')};
					feat._store(inst);
					expect(feat.instances[0]).toEqual(inst);
				});

				it('stores instance on the DOM element', function(){
					var feat = $.feach('Foo');
					var inst = {$elem : $('body')};
					feat._store(inst);
					expect($('body').data('instFoo')).toEqual(inst);
				});

			});

			describe('Feature._isSelector', function(){

				it('returns true on strings', function(){
					expect($.feach.Feature.prototype._isSelector('foo')).toEqual(true);
				});

				it('returns false on all other types', function(){
					expect($.feach.Feature.prototype._isSelector(['foo'])).toEqual(false);
					expect($.feach.Feature.prototype._isSelector({})).toEqual(false);
					expect($.feach.Feature.prototype._isSelector(function(){})).toEqual(false);
				});

			});

			describe('Feature._overload', function(){

				it('returns first argument that matches passed method', function(){
					var isFoo = function(arg){
						return arg === 'foo';
					};
					expect($.feach.Feature.prototype._overload(isFoo, ['foo', 'bar', {}])).toEqual('foo');
				});

				it('returns undefined when no matches occur', function(){
					var isFoo = function(arg){
						return arg === 'foo';
					};
					expect($.feach.Feature.prototype._overload(isFoo, ['bar', {}])).toEqual(undefined);
				});

			});

			describe('Feature._isElement', function(){

				it('returns true when passed an element', function(){
					var elem = $('<div></div>')[0];
					expect($.feach.Feature.prototype._isElement(elem)).toEqual(true);
				});

				it('returns true when passed an array of elements', function(){
					var $elem = $('<div></div><div></div>');
					expect($.feach.Feature.prototype._isElement($elem)).toEqual(true);
				});

				it('returns false when passed string, array, object', function(){
					expect($.feach.Feature.prototype._isElement('string')).toEqual(false);
					expect($.feach.Feature.prototype._isElement([])).toEqual(false);
					expect($.feach.Feature.prototype._isElement({})).toEqual(false);
				});

			});

			describe('Feature._getInst', function(){

				it('returns first inst- data attribute set, when chained from a DOM element', function(){
					var $elem = $('<div class="foo"></div>');
					$elem.data('instA', true);
					$elem.data('instB', false);
					$elem.data('instC', false);
					expect($elem.feach('A')).toEqual(true);
				});

				it('returns specific inst- data attribute when chained from a DOM element and passed a name', function(){
					var $elem = $('<div class="foo"></div>');
					$elem.data('instA', false);
					$elem.data('instB', true);
					$elem.data('instC', false);
					expect($elem.feach('B')).toEqual(true);
				});

			});

		/* @end */
		
	});

	describe('Default Base class', function(){

		var foo, Foo;

		beforeEach(function () {
			Foo = $.feach.Base;
			foo = new Foo();
			foo.$elem = $('<div></div>');
			foo.feature = {instances : []};
		});

		/* @group Base core */

			describe('Base._cacheDom', function(){

				it('stores matching DOM elements that are descendants of $elem', function(){
					foo.$elem.append('<p></p>').append('<cite></cite>');
					foo._cacheDom({
						p : 'p',
						cite : 'cite'
					});
					expect(foo.$p[0].nodeName).toEqual('P');
					expect(foo.$cite[0].nodeName).toEqual('CITE')
				});

				it('finds elements that begin with a prefix', function(){
					foo.$elem.append('<p class="foo-p"></p>').append('<cite class="foo-cite"></cite>');
					foo._cacheDom({
						p : 'p',
						cite : 'cite'
					}, '.foo-');
					expect(foo.$p[0].nodeName).toEqual('P');
					expect(foo.$cite[0].nodeName).toEqual('CITE')
				});

			});

			describe('Base._destroy', function(){

				it('removes instance from instance list', function(){
					spyOn(foo, '_instIndex').andReturn(2);
					foo.feature.instances = ['a', 'b', 'c', 'd']; 
					foo._destroy();
					expect(foo.feature.instances).toEqual(['a', 'b', 'd']);
				});

				it('calls inst.tearDown if available', function(){
					var fired;
					foo.tearDown = function(){
						fired = true;
					};
					foo._destroy();
					expect(fired).toEqual(true);
				});

				it('removes DOM element when passed true', function(){
					foo.$elem = $('<div id="test"></div>');
					foo.$elem.appendTo('body');
					expect($('#test').length).toEqual(1);
					foo._destroy(true);
					expect($('#test').length).toEqual(0);
				});

			});

		/* @end */

		/* @group Base internals */

			describe('Base._instIndex', function(){

				it('retrieves the index of an instance in the Feature.instances', function(){
					Foo.instances = [
						foo = new Foo(),
						foo = new Foo(),
						foo = new Foo(),
						foo = new Foo(),
						foo = new Foo()
					];
					for(var i = 0; i < Foo.instances.length; i++){
						Foo.instances[i].feature = Foo;
						expect(Foo.instances[i]._instIndex()).toEqual(i);
					}
				});

				it('returns undefined if instance is not found', function(){
					Foo.instances = [
						foo = new Foo(),
						foo = new Foo(),
						foo = new Foo(),
						foo = new Foo(),
						foo = new Foo()
					];
					var newInst = new Foo();
					newInst.feature = Foo;
					expect(newInst._instIndex()).toEqual(undefined);
				});

			});

		/* @end */

	});

	jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
	jasmine.getEnv().execute();

})();

