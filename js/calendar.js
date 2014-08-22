;(function($) {

	$(document).ready(function() {

		$('.timeline').each(function() {
			new Timeline(this, {
				totalMinutes  : 1440,
				rangeSelector : '.timeline-range'
			});
		});

	});

})(jQuery);


var Timeline = (function($) {

	function Timeline(element, settings) {

		this.element = element;

		this.settings = settings;

		this.pxRatio = 0;

		this.ranges = {};

		this.init();

	};

	Timeline.prototype.init = function() {

		this.setPxRatio();

		this.collectRanges();

		this.initRanges();

		this.bind();
	};

	Timeline.prototype.initRanges = function() {
		for (var key in this.ranges) {
			this.ranges[key].draggable = new Draggable(this.ranges[key].element, {
				handleSelector: '.timeline-selection-handle'
			});

			this.updateRangeView(key);
		};
	};

	Timeline.prototype.bind = function() {
		for (var key in this.ranges) {
			this.bindRange(key);
		};
	};

	Timeline.prototype.bindRange = function(range) {
		var that = this;

		this.ranges[range].draggable.on('move', function(data) {


			that.setRangeValue(range, data.handle.getAttribute('data-handle-type'), data.move.relative.x / that.pxRatio);
		});
	};

	Timeline.prototype.collectRanges = function() {
		var that = this;

		$(this.element).find(this.settings.rangeSelector).each(function() {
			var rangeType = this.getAttribute('data-range-type');
			that.ranges[rangeType] = {
				element : this,
				start   : this.getAttribute('data-range-start'),
				end     : this.getAttribute('data-range-end')
			};
		});
	};

	Timeline.prototype.setPxRatio = function() {
		this.pxRatio = $(this.element).width() / this.settings.totalMinutes;
	};

	Timeline.prototype.setRangeValue = function(range, type /*start or end*/, value) {
		value = Math.min(Math.max(0, value), this.settings.totalMinutes);

		if(type === 'start') {
			value = Math.min(value, this.ranges[range].end);
		} else {
			value = Math.max(value, this.ranges[range].start);
		}

		this.ranges[range][type] = value;

		this.updateRangeView(range);
	};

	Timeline.prototype.updateRangeView = function(range) {
		var r = this.ranges[range];
		var left = r.start * this.pxRatio;
		var width = (r.end - r.start) * this.pxRatio;

		r.element.style.left = left + 'px';
		r.element.style.width = width + 'px';
	};


	return Timeline;

})(jQuery);


var Draggable = (function($) {

	function Draggable(element, settings) {

		this.element = element;

		this.settings = settings;

		this.dragging = false;

		this.activeHandle = null;

		this.parentCoords = {
			x: 0,
			y: 0
		};

		this.initialCoords = {
			x: 0,
			y: 0
		};

		this.bind();
	};

	Draggable.prototype = new EventEmitter();

	Draggable.prototype.bind = function() {
		var that = this;

		var $elements = ('handleSelector' in this.settings) ? $(this.element).find(this.settings.handleSelector) : $(this.element);

		$elements.on('mousedown.draggable', function(event) {

			that.activeHandle = this;

			that.start(event.clientX, event.clientY);

			$(window)
				.off('.draggable')
				.on('mouseup.draggable', function() {
					that.stop(event.clientX, event.clientY);
				})
				.on('mousemove.draggable', function(event) {
					// this prevents the selection
					event.preventDefault();

					that.move(event.clientX, event.clientY);
				});
		});

	};

	Draggable.prototype.unbind = function(full) {

		$(window).off('.draggable');

		if(full) {
			var $elements = 'handleSelector' in this.settings ? $(this.element).find(this.settings.handleSelector) : $(this.element);

			$elements.off('mousedown.draggable');
		};
	};

	Draggable.prototype.setInitialCoords = function(x, y) {
		this.initialCoords = {
			x: x,
			y: y
		};
	};

	Draggable.prototype.setParentCoords = function(x, y) {
		this.parentCoords = {
			x: $(this.element).parent().offset().left,
			y: $(this.element).parent().offset().top
		};
	};

	Draggable.prototype.start = function(x, y) {
		this.setParentCoords();
		this.setInitialCoords(x, y);

		this.notify('start');
	};

	Draggable.prototype.move = function(x, y) {

		this.notify('move', {
			handle: this.activeHandle,
			move: {
				relative: {	
					x: x - this.parentCoords.x,
					y: y - this.parentCoords.y
				},
				displacement: {
					x: this.initialCoords.x - x,
					y: this.initialCoords.y - y
				}
			}
		});
	};

	Draggable.prototype.stop = function(x, y) {
		this.unbind();

		this.notify('end');
	};

	Draggable.prototype.notify = function(type, data) {
		this.trigger(type, [data])
	};

	return Draggable;

})(jQuery);