;(function($, window, document, undefined) {
	var $doc = $(document);
	var $win = $(window);

	/*This function will fill datepicker with needed data*/
	function applyAvailability($cal, availability, month) {
		if ( availability[month].dates.length > 0 ) {
			for ( var i = 0; i < availability[month].dates.length; i++ ) {
				var thisDate = availability[month].dates[i];
				var $td = $cal.find('td:not(.ui-datepicker-other-month):eq(' + ( thisDate - 1 ) + ')');
				$td.addClass('is-available');
			}

			$cal.find('.ui-state-active').removeClass('ui-state-active');
		}
	};

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

		for ( var i = 0; i < times.length; i ++ ) {
			var time = times[i];
			var timeArray = time.match(/(\d{1,2}):(\d{2})(\w+)/);
			var $newSlide = $slide.clone();

			if ( i === 2 ) {
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
	};

	$doc.ready(function() {
		// Tabs
		// Init tabs - add classes
		$('.nav-tabs').each(function() {
			var $tabsNav = $(this);
			var tabs = $tabsNav.data('related-tabs');
		
			$tabsNav.find('li').eq(0).addClass('current');
			$(tabs).find('> .tab').eq(0).addClass('visible');
		});

		setTimeout(function() {
			$('#new-chat-message-field').focus();
		}, 500);
		
		// Toggle classes and switch tabs
		$('.nav-tabs li a').on('click', function(event) {
			event.preventDefault();
		
			var $tabTrigger = $(this).parent();
			var idx = $tabTrigger.index();
			var relatedTabs = $tabTrigger.closest('.nav-tabs').data('related-tabs');
			var $tab = $(relatedTabs).find('> .tab');
		
			if ( $tabTrigger.hasClass('current') ) {
				return;
			}
		
			$tabTrigger.addClass('current').siblings('li').removeClass('current');
			$tab.removeClass('visible').eq(idx).addClass('visible');
		});

		$('.panel-heading a').on('click', function(event) {
			$(this).closest('.panel-heading').toggleClass('collapsed');
			$(this).closest('.panel').siblings().find('.panel-heading.collapsed').removeClass('collapsed');
		});

		$('.form-triggers input[type="radio"]').on('change', function(event) {
			var $form = $(this).closest('form');

			if ( this.value == '1' ) {
				$form.addClass('show-form');
			} else {
				$form.removeClass('show-form');
			}
		});

		$('#carousel-consult-apps .app-entry a').on('click', function(event) {
			event.preventDefault();

			var $overview = $( $(this).attr('href') );

			$overview.addClass('visible').siblings().removeClass('visible');
		});

		$('.entry-overview .dismiss').on('click', function(event) {
			event.preventDefault();

			$(this).parent().removeClass('visible');
		});

		if ( $('.chat-listing').length ) {
			$('.chat-listing').jScrollPane({
				showArrows: false,
				verticalGutter: 0,
				horizontalGutter: 0,
				autoReinitialize: true,
				verticalDragMaxHeight: 7,
				horizontalDragMaxWidth: 7
			});

			$('.chat-entry .expander').on('click', function(event) {
				event.preventDefault();

				$(this).closest('.chat-entry').toggleClass('expanded');

				$('.chat-listing').data('jsp').reinitialise();
			});
		}

		// Scrolling inside provider tabs
		$('.scrolling-arrows a').on('click', function(event) {
			event.preventDefault();

			var $scrollButton = $(this);
			var $container = $scrollButton.closest('.workspace-box').find('> .box-accordion > .tabs > .tab.visible');
			var currentScrollTop = $container.offset().top + $container.scrollTop();

			if ( $scrollButton.hasClass('scroll-up') ) {
				$container.animate({
					scrollTop: - currentScrollTop + 50
				}, 500, 'swing');
			} else {
				$container.animate({
					scrollTop: currentScrollTop - 50
				}, 500, 'swing');
			}

			currentScrollTop = $container.offset().top;
		})

		/*Consultant info calendar call out and set up*/
		if ( $('.inline-calendar').length ) {
			$.datepicker._selectDate = function(id, dateStr) {
				var $cal = $(id);
				var selectedDate = dateStr.split('/')[1];

				selectedDate = Number(selectedDate) - 1;

				var $td = $cal.find('td:not(.ui-datepicker-other-month):eq(' + selectedDate + ')');

				if ( $td.hasClass('is-available') ) {
					if ( $td.find('.ui-state-active').length === 0 ) {
						$cal.find('.ui-state-active').removeClass('ui-state-active');
					}

					$td.find('a').addClass('ui-state-active');
				}
			};

			$('.inline-calendar').each(function() {
				var $cal = $(this);
				var availabilityURL = $cal.parent().attr('data-availability');
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
								if ( calTimeout !== null ) {
									clearTimeout(calTimeout);
									calTimeout = null;
								}

								currentMonth = month - 1;

								calTimeout = setTimeout(function() {
									applyAvailability($cal, availability, currentMonth);
								}, 50);
							},
							onSelect: function(dateText, inst) {
								if( calTimeout !== null ) {
									clearTimeout(calTimeout);
									calTimeout = null;
								}

								calTimeout = setTimeout(function() {
									applyAvailability($cal, availability, currentMonth);
								}, 50);
							}
						});

						currentMonth = Number( $cal.find('td[data-month]:eq(0)').attr('data-month') );

						applyAvailability($cal, availability, currentMonth);

						$cal.on('mousedown', 'td.available', function(e) {
							$cal.find('.ui-state-active').removeClass('ui-state-active');

							$(this).find('a').addClass('ui-state-active');
						});
					}
				});
			});
		}

		/*Time picker call out for Consultant info*/	
		if ( $('.inline-timepicker').length ) {
			$('.inline-timepicker').each(function() {
				var $timepicker = $(this);

				buildTimepicker($timepicker);
			});
		}

		var $todayWidget = $('.widget-today');

		if ( $todayWidget.length > 0 ) {
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

		if ( $timers.length > 0 ) {
			$timers.each(function() {
				var $timer = $(this);

				new CountDown({
					container: $timer[0],
					endTime: $timer.data('time')
				});
			});
		};

		var $pendingTimers = $('.duration-timer');

		if ( $pendingTimers.length ) {
			$pendingTimers.each(function() {
				var $pendingTimer = $(this);

				new CountDown({
					container: $pendingTimer[0],
					endTime: $pendingTimer.data('time'),
					startTime: $pendingTimer.data('start')
				});
			});
		}

		var $consultForms = $('.consult-form');
		var $panels = $('.tab-consult .panel');

		if($consultForms.length) {
			var $addLinks = $('.add-entry');

			$addLinks
				.on('click', function(e) {
					e.preventDefault();

					var $link = $(this);
					var $parent = $link.parents('form:eq(0)');
					
					if($parent.find('.field-single').length) {
						var $field = $parent.find('.field:last').clone();

						$field.val('');

						$parent.find('.field:last').after($field);
					} else {
						var $entry = $parent.find('.form-entries li:last').clone();

						$entry.find('.field').each(function() {
							$(this).val('');
						});

						$parent.find('.form-entries').append($entry);
					}
				});

			$consultForms
				.on('submit', function(e) {
					e.preventDefault();

					var $form = $(this);
					var $panel = $form.parents('.panel:eq(0)');
					var $summary = $('<span />');
					var summaryValue = '';

					if($panel.find('.panel-title a span').length) {
						$summary = $panel.find('.panel-title a span');
					} else {
						$panel.find('.panel-title a').append($summary);
						$summary = $panel.find('.panel-title a span');
					}

					if($form.find('.field-single').length) {
						var $fields = $form.find('.field');
						var iterator = 0;

						$fields
							.each(function() {
								var $field = $(this);
								if($field.val().length > 0) {
									var fieldText = $(this).val();

									if(iterator > 0) {
										summaryValue += '; ';
									}

									summaryValue += fieldText;

									iterator++;
								}
							});
					}

					if($form.find('.form-triggers').length) {
						var $tabForms = $panel.find('.show-form');
						var iterator = 0;

						$tabForms
							.each(function() {
								var $tabForm = $(this);
								var $tabEntries = $tabForm.find('.form-entries li');

								$tabEntries
									.each(function() {
										var $tabEntry = $(this);
										var $fields = $tabEntry.find('.field');
										var fieldVals = [];

										if(iterator > 0) {
											summaryValue += '; ';
										}

										$fields.each(function() {
											var $field = $(this);
											var fieldText = $field.val();

											if(fieldText.length > 0) {
												fieldVals.push(fieldText);
											}
										});

										fieldVals = fieldVals.join(' ');

										if(fieldVals.length > 0) {
											summaryValue += fieldVals;

											iterator++;
										}
									});
							});
					}

					if($form.find('.practitioner-booking').length) {
						var $options = $form.find('.follow-triggers input:radio');
						var $checkedOption = $form.find('.follow-triggers input:radio:checked');
						var $calendar = $form.find('.inline-calendar');
						var $timepicker = $form.find('.inline-timepicker');

						if($checkedOption.length && $checkedOption.val().toLowerCase() === 'none') {
							summaryValue = $checkedOption.val();
						} else if($checkedOption.length) {
							var date = $calendar.datepicker('getDate');
							var $time = $timepicker.find('.timepicker-slide-active');
							var month = date.toString().split(' ')[1];
							var day = date.getDate();
							var year = date.getYear() + 1900;
							var hour = $time.find('.hour').text();
							var minutes = $time.find('.minutes').text();
							var suffix = $time.find('.suffix').text();
							var followUpType = $checkedOption.val();

							summaryValue = month + ' ' + day + ', ' + year + ', ' + hour + ':' + minutes + suffix + ' ' + followUpType.toUpperCase();
						}
					}

					$summary.text(summaryValue);

					if(summaryValue.length > 0) {
						$panel.addClass('panel-done');

						$panel.find('.panel-heading a').trigger('click');

						if($panel.next('.panel').length) {
							$panel.next().find('.panel-heading a').trigger('click');
						}

						var $donePanels = $('.panel-done');

						if($donePanels.length === $panels.length) {
							$('.tab-consult h4 .button').addClass('active');
						}
					}
				});

			var $appChecks = $('.app-entry input:checkbox');

			$appChecks
				.on('change', function() {
					var $appCheck = $(this);
					var $form = $appCheck.parents('form:eq(0)');
					var $panel = $form.parents('.panel:eq(0)');
					var $summary = $('<span />');
					var summaryValue = '';
					var $checkedApps = $form.find('.app-entry input:checked');
					var iterator = 0;

					if($panel.find('.panel-title a span').length) {
						$summary = $panel.find('.panel-title a span');
					} else {
						$panel.find('.panel-title a').append($summary);
						$summary = $panel.find('.panel-title a span');
					}

					$checkedApps
						.each(function() {
							var $checkbox = $(this);

							if(iterator > 0) {
								summaryValue += '; ';
							}

							summaryValue += $checkbox.val();

							iterator++;
						});

					$summary.text(summaryValue);

					$panel.addClass('panel-done');

					var $donePanels = $('.panel-done');

					if($donePanels.length === $panels.length) {
						$('.tab-consult h4 .button').addClass('active');
					}
				});
		}
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
			});
		};

		TodayWidget.prototype.updateData = function() {
			var _wgt = this;
			var now = new Date();

			if ( now.getHours() >= 8 && now.getHours() < 19 ) {
				$(_wgt.widgetContainer).removeClass('nighttime').addClass('daytime');
			} else {
				$(_wgt.widgetContainer).removeClass('daytime').addClass('nighttime');
			}

			var theTime = (now.getHours() % 12) + ':' + zeroPad(now.getMinutes());
			var theTimeSuffix = 'am';

			if ( now.getHours() >= 12 ) {
				theTimeSuffix = 'pm';
			}

			theTime += theTimeSuffix;

			_wgt.$timeText.text(theTime);

			_wgt.$hours.find('.widget-today-item').remove();

			var data = _wgt.currentData;

			for ( var i = 0; i < data.length; i++ ) {
				var dataItem = data[i];
				var $item = _wgt.$itemTemplate.clone();
				var itemTime = dataItem['time'].split(':');
				var itemHour = parseInt(itemTime[0], 10);
				var itemMinutes = parseInt(itemTime[1], 10);
				var itemLeft = (60 / itemMinutes) * 47;
				var itemContainerIdx = itemHour - 1;

				if ( itemHour === 0 ) {
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
				var currentMinutes = now.getMinutes();
				var currentPos = 0 - (currentHour * 47) - (47/60*currentMinutes) + 24;

				_wgt.$hoursContainer
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

		if ( typeof options.startTime !== 'undefined' ) {
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

			if ( typeof _count.startTime !== 'undefined' && _count.started === false ) {
				diff = _count.endTime.getTime() - _count.startTime.getTime();
			}

			var seconds = Math.floor((diff / 1000) % 60);
			var minutes = Math.floor((diff / 1000 / 60) % 60);
			var hours = Math.floor(diff / 1000 / 60 / 60);

			if ( hours <= 0 ) {
				_count.$hours.parent().addClass('digits-hidden');

				if ( minutes <= 15 ) {
					_count.$container.addClass('soon');
				}

				if ( minutes <= 0 ) {
					_count.$minutes.parent().addClass('digits-hidden');

					if ( seconds <= 0 ) {
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

			if ( typeof _count.startTime !== 'undefined' && _count.currentTime < _count.endTime.getTime() ) {
				var delay = _count.startTime.getTime() - _count.currentTime;

				if ( delay < 0 ) {
					delay = 0;
				}

				setTimeout(function() {
					_count.started = true;
					_count.currentTime = new Date().getTime();
					_count.decrement();
				}, delay);
			} else if ( _count.currentTime < _count.endTime.getTime() ) {
				_count.started = true;
				_count.decrement();
			}
		};

		this.init();

		return CountDown;
	};

	var zeroPad = function(input) {
		var result = input;

		if ( result < 10 ) {
			result = '0' + result;
		}

		return result;
	};
})(jQuery, window, document);
