$(function() {
	var $border_color = "#efefef";
	var $grid_color = "#ddd";
	var $default_black = "#666";
	var $primary = "#575348";
	var $secondary = "#8FBB6C";
	var $orange = "#F38733";


	// Tooltip
	$('a').tooltip();

	// Popover
	$('button').popover();

	// Tabs
	$('#myTab a:last').tab('show');

	//Collapse
	$('#myCollapsible').collapse({
	  toggle: false
	});

	$('.disabled').on('click', function() {
		return false;
	});

	/*Blink Fields*/
	$('.field').on('focus blur', function(event) {

		if(event.type === 'focus' && this.value === this.defaultValue) {
			this.value = '';
		} else if(event.type === 'blur' && this.value === '') {
			this.value = this.defaultValue;
		}

	});

	/*Consult page custom select*/
	$('.custom-select .select').on('change', function() {
		var $val = $(this).parent().find('.custom-select-val');
		var thisVal = this.value;

		$val.text(thisVal);
	});

	/*Open consultant info on Consult page*/
	$('.dd-toggle').on('click', function(e) {
		e.preventDefault();

		$(this).parent().toggleClass('dd-open');
	});

	/*Close consultant info on Consult page*/
	$('.dd-list a').on('click', function(e) {
		e.preventDefault();

		$(this).parent().addClass('current').siblings('.current').removeClass('current').end().parents('.dd-availability:eq(0)').addClass('dd-filled').removeClass('dd-open');
	});

	/*Consultant info accordion*/
	$('dd .link-more').on('click', function(e) {
		e.preventDefault();

		var $link = $(this);
		var $parent = $link.parent();

		$parent.toggleClass('show-more');

		if($parent.hasClass('show-more')) {
			$link.text('-');
		} else {
			$link.text('+');
		}
	});

	/*Consultant info fees*/
	$('.link-textplus').on('click', function(e) {
		e.preventDefault();

		var $panel = $(this).parents('.consulting-panel:eq(0)');

		$panel.find('.form-submitter').slideDown(500);

		$panel.find('.practitioner-booking').slideUp(500);
	});

	/*Consultant info fees*/
	$('.link-liveconsult').on('click', function(e) {
		e.preventDefault();

		var $panel = $(this).parents('.consulting-panel:eq(0)');

		$panel.find('.form-submitter').slideUp(500);

		$panel.find('.practitioner-booking').slideDown(500);
	});

	/*Popups call out*/
	$('.popup-link').on('click', function(e) {
		e.preventDefault();

		var popupHref = $(this).attr('href');

		loadPopup(popupHref);
	});

	$('.patients-accordions .panel-heading a').on('click', function(event) {
		$(this).closest('.panel-heading').toggleClass('expanded');
		$(this).closest('.panel').siblings().find('.panel-heading.expanded').removeClass('expanded');
	});

	/*Macintosh fixes*/
	if(navigator.userAgent.indexOf('Macintosh') != -1) {
		$('.consulting-head h2').addClass('macfix');
		$('.custom-select').addClass('macfix');
	}

	/*Consultant info expand*/
	$('.slide-content .link-expand')
		.on('click', function(e) {
			e.preventDefault();

			if(!$('.consulting-panel:animated').length) {
				var $link = $(this);
				var $slide = $link.parents('.slide:eq(0)');
				var $titleHeader = $('.consulting-head h2');
				var panelId = '#' + $link.attr('data-expand');
				var slideTitle = $(panelId).attr('data-title');

				var $nextPanel = $(panelId);
				var $currentPanel = $('.consulting-panel.current');

				$titleHeader.text(slideTitle);

				if(!$slide.hasClass('slide-expanded')) {
					$slide.addClass('slide-expanded').siblings('.slide-expanded').removeClass('slide-expanded');

					setTimeout(function() {
						showPanel($currentPanel, $nextPanel);
					}, 300);
				} else {
					setTimeout(function() {
						$slide.removeClass('slide-expanded');
					}, 600);

					$nextPanel = $('.consulting-panel:eq(0)');

					hidePanel($currentPanel, $nextPanel);
				}
			}

		});

	/*Consultant info calendar call out and set up*/
	if($('.inline-calendar').length) {
		$.datepicker._selectDate = function(id, dateStr) {
			var $cal = $(id);
			var selectedDate = dateStr.split('/')[1];

			selectedDate = Number(selectedDate) - 1;

			var $td = $cal.find('td:not(.ui-datepicker-other-month):eq(' + selectedDate + ')');

			if($td.hasClass('is-available')) {
				if($td.find('.ui-state-active').length === 0) {
					$cal.find('.ui-state-active').removeClass('ui-state-active');
				}

				$td.find('a').addClass('ui-state-active');
			}
		};

		$('.inline-calendar').each(function() {
			var $cal = $(this);
			var availabilityURL = $cal.parents('.consulting-panel:eq(0)').attr('data-availability');
			var currentMonth;
			var calTimeout = null;

			$.ajax({
				url: availabilityURL,
				type: 'GET',
				dataType: 'json',
				success: function(data) {
					var availability = data.availability;

					$cal.datepicker({
						dayNamesMin: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
						onChangeMonthYear: function(year, month, inst) {
							if(calTimeout !== null) {
								clearTimeout(calTimeout);
								calTimeout = null;
							}

							currentMonth = month - 1;

							calTimeout = setTimeout(function() {
								applyAvailability($cal, availability, currentMonth);
							}, 50);
						},
						onSelect: function(dateText, inst) {
							if(calTimeout !== null) {
								clearTimeout(calTimeout);
								calTimeout = null;
							}

							calTimeout = setTimeout(function() {
								applyAvailability($cal, availability, currentMonth);
							}, 50);
						}
					});

					currentMonth = Number($cal.find('td[data-month]:eq(0)').attr('data-month'));

					applyAvailability($cal, availability, currentMonth);

					$cal.on('mousedown', 'td.available', function(e) {
						
						$cal.find('.ui-state-active').removeClass('ui-state-active');

						$(this).find('a').addClass('ui-state-active');
					})
				}
			});
			
		});
	}

	/*Time picker call out for Consultant info*/	
	if($('.inline-timepicker').length) {
		$('.inline-timepicker').each(function() {
			var $timepicker = $(this);

			buildTimepicker($timepicker);
		});
	}

	/*Consultants slider call out and settings*/
	if($('.consulting-slider').length) {
		var $consultingSlider = $('.consulting-slider .slides');

		$consultingSlider.carouFredSel({
			direction: 'up',
			auto: false,
			scroll: {
				items: 1,
				onBefore: function(data) {
					
					if($('.slide-expanded').length) {
						var $firstSlide = $(data.items.visible[0]);
						var $lastSlide = $(data.items.visible[3]);
						var $contentBox = $('.consulting-panels');
						
						if($firstSlide.hasClass('slide-expanded')) {
							$contentBox.removeClass('rounded-bottom');
							$contentBox.addClass('rounded-top');
						} else if($lastSlide.hasClass('slide-expanded')) {
							$contentBox.removeClass('rounded-top');
							$contentBox.addClass('rounded-bottom');
						} else {
							$contentBox.removeClass('rounded-top').removeClass('rounded-bottom');
						}
					}
				}
			},
			prev: $('.slider-prev'),
			next: $('.slider-next'),
			onCreate: function() {
				$('.slide-content .link-expand').on('click', function(e) {
					e.preventDefault();

					var $parent = $(this).parents('.slide:eq(0)');
					var $contentBox = $('.consulting-panels');

					if($parent.index() === 0) {
						$contentBox.removeClass('rounded-bottom');
						$contentBox.addClass('rounded-top');
					} else if($parent.index() === 3) {
						$contentBox.removeClass('rounded-top');
						$contentBox.addClass('rounded-bottom');
					} else {
						$contentBox.removeClass('rounded-top').removeClass('rounded-bottom');
					}
				});
			}
		});
	};

	/*Blink fields for the search on Consultant page */
	$(".search-field").on("focusin focusout", function(event) {
		var $field = $(this);
		var original_val = $field.prop("defaultValue");

		if (event.type === "focusin" && $field.val() === original_val) {
			$field.val("");
		} else if (event.type === "focusout" && $field.val() === "") {
			$field.val(original_val);
		}
	});

	/*Accordion functionality For the Accordions on page Live Consult(Patient description)*/
	$(".accordion-head h3, .accordion-head h4").on("click", "a", function(e) {
		var $clicked_link = $(this);

		$clicked_link
			.closest(".accordion-head")
			.siblings(".accordion-body")
			.stop(true, true)
			.slideToggle("slow");

		$clicked_link.toggleClass("clicked");

		//for accordion functionality on page patient-history.html
		var popup_actions = $('.popup-hover-remover');
		if(popup_actions.length){
			var $clicked_link_id = '#' + $clicked_link.closest(".accordion-head").parent().attr('id');

			popup_actions.each(function() {
				if($(this).attr('href') === $clicked_link_id) {
					$(this).toggleClass("clicked");
				};
			});
		};
		
		e.preventDefault();
	})

	/*Page patient-history.html injures functionality*/
	var $injures = $('.accordions-history > .accordion');
	$('.btn-has-dropdown').hover(function(){
		if(!$('.popup-hover-remover').hasClass("clicked")) {
			$('.care-popup-body-map').addClass('care-popup-body-map-open');			
		};
	});

	$('.popup-hover-remover').on('click', function(phr){
		var href = $(this).attr('href');
		var related_accordion = $injures.filter(href).children('.accordion-head').find('a');

		phr.preventDefault();

		$('.care-popup-body-map').removeClass('care-popup-body-map-open');

		if(!related_accordion.hasClass("clicked")) {
			related_accordion
					.closest(".accordion-head")
					.siblings(".accordion-body")
					.stop(true, true)
					.slideToggle("slow");

			related_accordion.toggleClass("clicked");	
			$(this).toggleClass("clicked");
		};

	});

	// call the scrollpane
	if( $('.scrollpane').length ){
		var paneAPI = $('.scrollpane').jScrollPane({
			autoReinitialise: true,
			animateScroll: true
		}).data('jsp');

		$('.widget-info-actions a.btn-prev, .consult-summary-body-actions a.btn-prev').on('click', function(){
			paneAPI.scrollBy(0, -40);
			return false;
		})

		$('.widget-info-actions a.btn-next, .consult-summary-body-actions a.btn-next').on('click', function(){
			paneAPI.scrollBy(0, 40);
			return false;
		})
	}

	/*Colorbox popup call out for image popups on page Live consult*/
	$(".colorbox-trigger").colorbox({
		left: "55%"
	});

	/*Colorbox popup call out for image popups on page patient-consult-images-gallery.html*/
	$(".gallery-colorbox-trigger").colorbox({
		top: 289,
		left: "26%"
	});

	/*iCheck plugin call out for radio buttons and checkboxes*/
	$('.checkbox input, .radio input').iCheck({
	  cursor: true
	});

	/*Custom check boxes and radio buttons without iCheck plugin*/
	custom_checkbox_radiobutton(document);

	/*Patient Consult Steps page custom select*/
	$(".custom-select2").select2({
	    minimumResultsForSearch: -1
	});

	/*This function is making two or more elements with the same height*/
	$.fn.equalizeHeight = function() {
		var maxHeight = 0, itemHeight;
	 
		for (var i = 0; i < this.length; i++) {
			itemHeight = $(this[i]).height();
			if (maxHeight < itemHeight) {
				maxHeight = itemHeight;
			}
		}
	 
		return this.height(maxHeight);
	}

	/*equalizeHeight function call out(for .section-aside and .section-content on Patient Consult Steps page)*/	 
	$(".height-equilized").equalizeHeight();

	/*CarouFredSell plugin call out for the slider on page patient-consult-images-gallery-slider.html*/
	$(".slider-photos .slides").carouFredSel({
		items: 1,
		scroll: {
			duration: 1000
		},
		prev: ".slider-photos-prev",
		next: ".slider-photos-next"
	});

/*CarouFredSell plugin call out for the slider on page patient-consult-store.html*/
	$(".widget-recommended-slides").carouFredSel({
		items: 1,
		scroll: {
			duration: 1000
		},
		prev: ".widget-recommended-slider-prev",
		next: ".widget-recommended-slider-next"
	});
	
	// human body 
	var $bodyMap = $('.body-map');
	
	$bodyMap.find('.btn-reverse').on('click', function(e){
		e.preventDefault();
		
		$(this).closest('.body-map').find('.human').toggleClass('human-flipped')
	});
	
	$bodyMap.find('.human-wrap').panzoom({
        $zoomIn: $bodyMap.find(".btn-plus"),
        $zoomOut: $bodyMap.find(".btn-minus"),
        onChange: function (e){
        	
        	var $this = $(this);
        	
        	setTimeout(function(){
        		
        		$this[0].style.display='none';
        		$this[0].offsetHeight;
        		$this[0].style.display='block';
	        
        	},500)
        	
        }
      });

	var $docDash = $('.provider-doc-blocks');

	if($docDash.length > 0) {
		var todayWidgetOptions = {
			today: new Date(),
			todayContainer: '.ico-provider-calendar',
			widgetContainer: '.widget-today',
			updateTimeout: 1, //minutes
			updateSource: 'json/today.json'
		};

		new TodayWidget(todayWidgetOptions);

		var $practiceTabLinks = $('.practice-tabs-nav a');
		var $practiceTabs = $('.practice-tab');

		$practiceTabLinks.eq(0).parent().addClass('current');
		$practiceTabs.eq(0).addClass('current');

		$practiceTabLinks
			.on('click', function(e) {
				e.preventDefault();

				var $parent = $(this).parent()
				var idx = $parent.index();

				$parent.addClass('current').siblings('.current').removeClass('current');
				$practiceTabs.eq(idx).addClass('current').siblings('.current').removeClass('current');
			});
	}

	var $timers = $('.pending-appointment-timer, .pending-timer');

	if($timers.length > 0) {
		$timers.each(function() {
			var $timer = $(this);

			new CountDown({
				container: $timer[0],
				endTime: $timer.data('time')
			});
		})
	};

	var $pendingTimers = $('.duration-timer');

	if($pendingTimers.length) {
		$pendingTimers.each(function() {
			var $pendingTimer = $(this);

			new CountDown({
				container: $pendingTimer[0],
				endTime: $pendingTimer.data('time'),
				startTime: $pendingTimer.data('start')
			});
		});
	}

	var $patientVideo = $('.patient-video-container');
	var $patientVideoLinks = $('.video-nav').find('a');

	$patientVideoLinks
		.on('click', function(e) {
			e.preventDefault();

			var $link = $(this);

			if($link.hasClass('link-show-rect')) {
				$patientVideo.addClass('show-rect').removeClass('show-circle');
			} else {
				$patientVideo.addClass('show-circle').removeClass('show-rect');
			}
		});

	var $patientTabs = $('.patient-tab');
	var $patientTabsNav = $('.patient-tabs-nav').find('a');

	if($patientTabs.length > 0 && $('.patient-tab.current').length === 0) {
		$patientTabs.eq(0).addClass('current');
		$patientTabsNav.eq(0).parent().addClass('current');
	}

	$patientTabsNav
		.on('click', function(e) {
			e.preventDefault();

			var $parent = $(this).parent();
			var idx = $parent.index();

			$parent.addClass('current').siblings('.current').removeClass('current');
			$patientTabs.eq(idx).addClass('current').siblings('.current').removeClass('current');
		});

	var $accordionHeadings = $('.patient-accordion-head a');

	$accordionHeadings
		.on('click', function(e) {
			e.preventDefault();

			var $link = $(this);
			var $parent = $link.parents('.patient-accordion-item:eq(0)');
			var $body = $parent.find('.patient-accordion-body');

			$parent.siblings('.open').removeClass('open').find('.patient-accordion-body').slideUp(300).end().find('.patient-accordion-head a span').text('+');

			if($body.is(':animated') === false) {
				if($link.find('span').text() === '+') {
					$link.find('span').text('-');
				} else {
					$link.find('span').text('+');
				}
				$parent.toggleClass('open');
				$body.slideToggle(300);
			}
		})
	
});

// doctor dashboard calendar module
var TodayWidget = function(options) {
	var _wgt = this;

	this.today = options.today;
	this.todayContainer = options.todayContainer;
	this.widgetContainer = options.widgetContainer;
	this.updateTimeout = options.updateTimeout * 60 * 1000;
	this.updateSource = options.updateSource;
	this.$dateText = $(this.widgetContainer).find('.widget-today-date');
	this.$timeText = $(this.widgetContainer).find('.widget-today-time');
	this.$timelineContainer = $(this.widgetContainer).find('.widget-today-timeline');
	this.$hoursContainer = $(this.widgetContainer).find('.widget-today-hours');
	this.$hours = this.$hoursContainer.find('.widget-today-hour');
	this.$itemTemplate = $('<span class="widget-today-item" />');
	this.currentData = null;
	this.interval = null;

	TodayWidget.prototype.setTheDate = function() {
		var _wgt = this;
		var now = new Date();

		var theDate = (now.getMonth() + 1) + '.' + zeroPad(now.getDate()) + '.' + ((now.getYear() + 1900) % 1000);

		_wgt.$dateText.text(theDate);
	};

	TodayWidget.prototype.getData = function() {
		var _wgt = this;

		$.ajax({
			url: _wgt.updateSource,
			type: 'GET',
			dataType: 'json',
			success: function(data) {
				_wgt.currentData = data.events;

				_wgt.updateData();
			},
			error: function(data) {
				console.log('Calendar data not found!');
			}
		})
	};

	TodayWidget.prototype.updateData = function() {
		var _wgt = this;
		var now = new Date();

		if(now.getHours() >= 8 && now.getHours() < 19) {
			$(_wgt.widgetContainer).removeClass('nighttime').addClass('daytime');
		} else {
			$(_wgt.widgetContainer).removeClass('daytime').addClass('nighttime');
		}

		var theTime = (now.getHours() % 12) + ':' + zeroPad(now.getMinutes());
		var theTimeSuffix = 'am';

		if(now.getHours() >= 12) {
			theTimeSuffix = 'pm';
		}

		theTime+=theTimeSuffix;

		_wgt.$timeText.text(theTime);

		_wgt.$hours.find('.widget-today-item').remove();

		var data = _wgt.currentData;

		for(var i = 0; i < data.length; i++) {
			var dataItem = data[i];
			var $item = _wgt.$itemTemplate.clone();
			var itemTime = dataItem['time'].split(':');
			var itemHour = parseInt(itemTime[0], 10);
			var itemMinutes = parseInt(itemTime[1], 10);
			var itemLeft = (60 / itemMinutes) * 47;
			var itemContainerIdx = itemHour - 1;

			if(itemHour === 0) {
				itemContainerIdx = 23;
			}

			var $itemContainer = _wgt.$hours.eq(itemContainerIdx);

			$item
				.addClass(dataItem['type'])
				.css({
					left: itemLeft
				});

			$itemContainer.append($item);

			var currentHour = now.getHours();
			var currentPos = 0 - (currentHour * 47) + 7;

			_wgt.$hours
				.css({
					left: currentPos
				});
		}

	};

	TodayWidget.prototype.setToday = function() {
		$(_wgt.todayContainer).text(_wgt.today.getDate());
	};

	TodayWidget.prototype.init = function() {
		_wgt.setToday();
		_wgt.setTheDate();

		_wgt.getData();

		_wgt.interval = setInterval(function() {
			_wgt.getData();
		}, _wgt.updateTimeout);
	};

	this.init();

	return TodayWidget;
};

var months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

// countdown module
var CountDown = function(options) {
	var _count = this;

	this.container = options.container;
	this.$container = $(this.container);
	this.$hours = this.$container.find('.digits-hours strong');
	this.$minutes = this.$container.find('.digits-minutes strong');
	this.$seconds = this.$container.find('.digits-seconds strong');
	this.today = new Date();
	this.endTime = new Date(_count.today.getDate() + ' ' + months[_count.today.getMonth()] + ' ' + (_count.today.getYear() + 1900) + ' ' + options.endTime);
	this.soonThreshold = 15;
	this.currentTime = this.today.getTime();
	this.timeout = null;
	this.started = false;

	if(typeof options.startTime !== 'undefined') {
		_count.startTime = new Date(_count.today.getDate() + ' ' + months[_count.today.getMonth()] + ' ' + (_count.today.getYear() + 1900) + ' ' + options.startTime);
	}

	CountDown.prototype.decrement = function() {
		var _count = this;

		_count.timeout = setTimeout(function() {
			_count.currentTime = _count.currentTime + 1000;

			_count.setText();

			if(_count.currentTime < _count.endTime.getTime()) {
				_count.decrement();
			}
		}, 1000);
	};

	CountDown.prototype.setText = function() {
		var _count = this;
		var diff = _count.endTime.getTime() - _count.currentTime;

		if(typeof _count.startTime !== 'undefined' && _count.started === false) {
			diff = _count.endTime.getTime() - _count.startTime.getTime();
		}

		var seconds = Math.floor((diff / 1000) % 60);
		var minutes = Math.floor((diff / 1000 / 60) % 60);
		var hours = Math.floor(diff / 1000 / 60 / 60);

		if(hours <= 0) {
			_count.$hours.parent().addClass('digits-hidden');

			if(minutes <= 15) {
				_count.$container.addClass('soon');
			}

			if(minutes <= 0) {
				_count.$minutes.parent().addClass('digits-hidden');

				if(seconds <= 0) {
					_count.$seconds.parent().addClass('digits-hidden').parent().addClass('countdown-hidden');
				}
			}
		}

		_count.$hours.text( zeroPad(hours) );
		_count.$minutes.text( zeroPad(minutes) );
		_count.$seconds.text( zeroPad(seconds) );
	};

	CountDown.prototype.init = function() {
		var _count = this;

		_count.setText();

		if(typeof _count.startTime !== 'undefined' && _count.currentTime < _count.endTime.getTime()) {
			var delay = _count.startTime.getTime() - _count.currentTime;

			if(delay < 0) {
				delay = 0;
			}

			setTimeout(function() {
				_count.started = true;
				_count.currentTime = new Date().getTime();
				_count.decrement();
			}, delay);
		} else if(_count.currentTime < _count.endTime.getTime()) {
			_count.started = true;
			_count.decrement();
		}
	};

	this.init();


	return CountDown;
};

var zeroPad = function(input) {
	var result = input;

	if(result < 10) {
		result = '0' + result;
	}

	return result;
}

/*This function will fill datepicker with needed data*/
function applyAvailability($cal, availability, month) {

	if(availability[month].dates.length > 0) {

		for( var i = 0; i < availability[month].dates.length; i++ ) {

			var thisDate = availability[month].dates[i];

			var $td = $cal.find('td:not(.ui-datepicker-other-month):eq(' + ( thisDate - 1 ) + ')');

			$td.addClass('is-available');

		}

		$cal.find('.ui-state-active').removeClass('ui-state-active');

	}

}

/*This function will create time picker(used on Consult page)*/
function buildTimepicker($container) {
	var $input = $container.find('input[type="hidden"]');
	var times = $input.attr('data-available').split(', ');
	var $slide = $('<div class="timepicker-slide"><span class="hour" /><span class="minutes" /><span class="suffix" /></div>');
	var $sliderPrev = $container.find('.timepicker-prev');
	var $sliderNext = $container.find('.timepicker-next');
	var $slideContainer;

	$container.find('.timepicker-slider').append('<div class="timepicker-slides" />');

	$slideContainer = $container.find('.timepicker-slides');

	for( var i = 0; i < times.length; i ++ ) {
		var time = times[i];
		var timeArray = time.match(/(\d{1,2}):(\d{2})(\w+)/);
		var $newSlide = $slide.clone();

		if(i === 2) {
			$newSlide.addClass('timepicker-slide-active');
		}

		$newSlide.attr('data-time', time);
		$newSlide.find('.hour').text(timeArray[1]);
		$newSlide.find('.minutes').text(timeArray[2]);
		$newSlide.find('.suffix').text(timeArray[3]);

		$slideContainer.append($newSlide);

	}

	$slideContainer.carouFredSel({
		direction: 'up',
		auto: false,
		items: {
			visible: 5,
			height: 24
		},
		scroll: {
			items: 1,
			duration: 300,
			onBefore: function(data) {
				var direction = data.scroll.direction;
				var $current = $slideContainer.find('.timepicker-slide-active');
				var currentVal;

				var $next = $(data.items.visible[2]);

				$next.addClass('timepicker-slide-active');
				currentVal = $next.attr('data-time');

				$current.removeClass('timepicker-slide-active');

				$input.val(currentVal);
			}
		},
		onCreate: function() {
			var currentVal = $slideContainer.find('.timepicker-slide-active').attr('data-time');

			$input.val(currentVal);

			$slideContainer.on('click', '.timepicker-slide', function() {
				var thisIdx = $(this).index();

				$slideContainer.trigger('slideTo', [this, -2]);
			});
		},
		prev: $sliderPrev,
		next: $sliderNext
	});
	
}

/*This function expands the panels with Consultants info*/
function showPanel($currentPanel, $nextPanel) {
	$currentPanel.animate({
		opacity: 0
	}, {
		duration: 300,
		easing: 'linear',
		complete: function() {
			$currentPanel.attr('style', '');
			$currentPanel.find('.practitioner-info h2, .practitioner-info h4, .practitioner-photo, .practitioner-detail, .form-submitter, .practitioner-booking').attr('style', '');
			$currentPanel.find('.dd-availability-visible').removeClass('dd-availability-visible');
		}
	});

	$nextPanel.addClass('entering').animate({
		width: 646
	}, {
		duration: 300,
		easing: 'linear',
		complete: function() {
			$nextPanel.addClass('current').removeClass('entering');
			$currentPanel.removeClass('current');

			$nextPanel.find('.practitioner-info h2, .practitioner-info h4, .practitioner-photo').fadeIn(600, function() {
				$nextPanel.find('.practitioner-detail').fadeIn(600, function() {
					$nextPanel.find('.dd-availability').addClass('dd-availability-visible');
				});
			});
		}
	});
}

/*This function hide the panels with Consultants info*/
function hidePanel($currentPanel, $nextPanel) {
	$currentPanel.find('.practitioner-info h2, .practitioner-info h4, .practitioner-photo, .practitioner-detail, .form-submitter, .practitioner-booking').fadeOut(300);
	$currentPanel.find('.dd-availability-visible').removeClass('dd-availability-visible')

	$currentPanel.removeClass('current').delay(300).animate({
		width: 0
	}, {
		duration: 300,
		easing: 'linear',
		complete: function() {

		}
	});

	$nextPanel.addClass('current').fadeIn(500);
}

/*Custom check boxes and radio buttons without iCheck plugin*/
function custom_checkbox_radiobutton(on_element){
	var checkedClass = 'custom-input-checked';
	var disabledClass = 'custom-input-disabled';
	var inputSelector = $(on_element).find('.custom-checkbox input, .custom-radio input');
	
	$(inputSelector)
		.each(function() {
			var input = this;
			
			$(input)
				.parent()
				.toggleClass(checkedClass, input.checked);
		})
		.on('change', function() {
			var input = this;

			if(input.type === 'radio') {
				var name = input.name;
 
				$(input.ownerDocument)
					.find('[name=' + name + ']')
					.each(function() {
 
						var radioInput = this;
 
						$(radioInput)
							.parent()
							.toggleClass(checkedClass, radioInput.checked);
					});
			} else { 
				$(input)
					.parent()
					.toggleClass(checkedClass, input.checked);
			};
		})
		.on('disable', function() {
			var input = this;
			
			input.disabled = true;
			
			$(input)
				.parent()
				.addClass(disabledClass);
		})
		.on('enable', function() {
			var input = this;
 
			input.disabled = false;
 
			$(input)
				.parent()
				.removeClass(disabledClass);
	});
}

/*This function create popups*/
function loadPopup(href) {
	var $win = $(window);

	$('.care-popup-overlay').addClass('care-popup-overlay-visible');

	$.ajax({
		url: href,
		type: 'GET',
		success: function(data) {
			$('body').append(data);

			var $popup = $('.care-popup');

			//If there is a checkbox in the popup
			custom_checkbox_radiobutton('.care-popup');
			
			if( $('.form-response-row').length){
				$('.custom-checkbox').on('click', 'label', function(){
					$(this).closest('.form-response-row').toggleClass('response-row-checked');
				});
			};

			$popup.css({ opacity: 0, display: 'block' });

			if($popup.hasClass('widget-popup')) {
				var popupY = $('.top-bar').outerHeight() + $('.header-bar').outerHeight() + $('.consulting-head').outerHeight() + $('.section-store-head').outerHeight() + 117;
			} else {
				var popupY = ( ( $win.height() - $popup.outerHeight() ) / 2 ) + $win.scrollTop();
			};


			$popup.attr('style', '').css({ top: popupY }).fadeIn(500);

			$popup.one('click', '.link-close', function(e) {
				e.preventDefault();

				$popup.fadeOut(300, function() {
					$popup.remove();
				});

				$('.care-popup-overlay').removeClass('care-popup-overlay-visible');
			});

			$(".widget-popup-slider .slides").carouFredSel({
				items: 1,
				scroll: {
					duration: 1000
				},
				prev: ".slider-prev",
				next: ".slider-next"
			});
		},
		error: function() {
			alert('Not found');

			$('.care-popup-overlay').removeClass('care-popup-overlay-visible');
		}
	})
}