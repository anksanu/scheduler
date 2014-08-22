;(function(window, document, jQuery, undefined) {
	var $win = $(window);
	var $doc = $(document);
	var $html;

	$doc.ready(function() {
		$html = $('html');

		var animationOpened = false;

		$win
			.on('load', function() {
				$html.addClass('loaded');
			});

		var $weekdayLinks = $('.weekdays a');
		var $weekdaySubHead = $('.weekdays-subhead');
		var $weekdaysContainer = $('#weekday-rows');
		var $weekdayForm = $('.form-work-hours');

		// create a weekday row for each link
		$weekdayLinks
			.each(function() {
				var $weekdayLink = $(this);
				var $weekdayLinkParent = $weekdayLink.parent();
				var weekdayRow = new Weekday($weekdayLink, $weekdaysContainer);

				// when clicking the link, create/remove the selected weekday
				$weekdayLink
					.on('click', function(e) {
						e.preventDefault();

						$weekdayLinkParent.toggleClass('selected');

						var isSelected = $weekdayLinkParent.hasClass('selected');

						$weekdayLink.trigger('weekday.selected', isSelected);

						if($('.weekday-row.selected').length) {
							$weekdayForm.slideDown(300);
							$weekdaySubHead.slideDown(300);
						} else {
							$weekdayForm.slideUp(300);
							$weekdaySubHead.slideUp(300);
						}

						if(animationOpened === false) {
							animationOpened = true;

							// open animation popup on first weekday click
							popupUI.open('#schedule-animation');
						}
					});
			});

		var $monthlyCalendar = $('#calendar-monthly');
		var calSchedule = {
			period: 12,
			weekdays: [
				{
					weekday: 1,
					data: [
						{
							type: 'work',
							start: 8,
							end: 15.5
						},
						{
							type: 'break',
							start: 12,
							end: 13.5
						},
						{
							type: 'work',
							start: 16,
							end: 17
						}
					]
				},
				{
					weekday: 2,
					data: [
						{
							type: 'work',
							start: 8,
							end: 15.5
						},
						{
							type: 'break',
							start: 12,
							end: 13.5
						}
					]
				},
				{
					weekday: 4,
					data: [
						{
							type: 'work',
							start: 8,
							end: 15.5
						},
						{
							type: 'break',
							start: 12,
							end: 13.5
						}
					]
				}
			]
		};

		if($monthlyCalendar.length) {
			var calendarUI = new CalendarUI($monthlyCalendar, calSchedule);

			$.datepicker._selectDate = function(id, dateStr) {
				var $cal = $(id);
				var date = dateStr.split('/');
				var $target = $cal.find('td a:contains(' + parseInt( date[1], 10 ) + '):eq(0)');

				$cal.find('.ui-state-highlight').removeClass('ui-state-highlight');
				$cal.find('.ui-state-active').removeClass('ui-state-active');

				$target.addClass('ui-state-highlight ui-state-active');

				var today = new Date();
				var selectedDay = new Date(dateStr);

				calendarUI.updateHeader();

				calendarUI.updateWeekday();
			}
		}

		var $popups = $('.popup');

		if($popups.length) {

			var popupUI = new PopupUI({
				$overlay: $('.popup-overlay'),
				popupVisible: 'popup-visible',
				overlayVisible: 'popup-overlay-visible'
			});

			$doc
				.on('mouseenter', '.weekday-row-actions a', function() {
					var $link = $(this);
					var cookieName = $link.attr('data-cookie');

					if(readCookie(cookieName) === null) {
						popupUI.open('#' + cookieName, true, $link);
					}
				});

			var $cookieCreators = $('.checkbox-cookie');

			if($cookieCreators.length > 0) {
				$cookieCreators
					.on('change', function() {
						var $check = $(this);
						var cookieName = $check.data('createcookie');

						if($check.is(':checked')) {
							createCookie(cookieName, true, 9999);
							popupUI.close();
						}
					});
			}

		}
	});

	var CalendarUI = function($calendar, schedule) {
		this.$calendar = $calendar;
		this.schedule = schedule;
		this.$months = $('.calendar-months');
		this.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
		this.weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		this.$dayText = $('.calendar-day-text');
		this.$timeText = $('.calendar-day-time');
		this.$hoursText = $('.calendar-day-hours').find('span:eq(0)');

		this.$slider = $('.calendar-months-slider')
		this.$sliderHandle = $('.calendar-months-slider-handle');

		this.scheduleStart = null;
		this.scheduleEnd = null;
		this.scheduleDays = [];
		this.tickerInterval = null;
		this.tickerTimeout = null;

		this.monthsPerList = 6;

		this.totalMonths = 18;

		this.monthsPage = 0;

		this.monthPages = this.totalMonths / this.monthsPerList;

		this.init();
	};

	CalendarUI.prototype.build = function() {
		var _cal = this;

		this.$calendar
			.datepicker({
				dayNamesMin: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
				minDate: new Date(),
				onChangeMonthYear: function(year, month, inst) {
					setTimeout(function() {
						_cal.applySchedule();
					}, 50);

					_cal.updateHeader();

					_cal.updateWeekday();
				}
			});

		var currentMonth = new Date().getMonth();
		var year = new Date().getYear() + 1900;
		
		var $temp = $('<div />');
		
		var $monthLi = $('<li><a href="#" /></li>');

		for (var i = 0; i < this.monthPages; i++) {
			var $holder = $('<ul />');
			
			for(var j = 0; j < this.monthsPerList; j++) {
				var $month = $monthLi.clone();
				var monthText = this.months[currentMonth];

				if(currentMonth > 11) {
					currentMonth = 0;
					year = year + 1;

					monthText = this.months[currentMonth] + '<small>' + year + '</small>';
				}

				$month.find('a')
					.attr('data-year', year)
					.attr('data-month', currentMonth)
					.html(monthText);

				$holder.append($month);

				currentMonth++;
			};

			$temp.append($holder);
		};

		this.$months.html($temp.html());
	};

	CalendarUI.prototype.prepareSchedule = function() {
		this.scheduleStart = new Date();
		this.scheduleEnd = new Date(this.scheduleStart.getTime() + (this.schedule.period * 30 * 24 * 60 * 60 * 1000));

		var weekdays = this.schedule.weekdays;

		for(var weekday in weekdays) {
			var weekdayIdx = weekdays[weekday].weekday;

			this.scheduleDays.push(weekdayIdx);
		}

		this.applySchedule();

		this.updateHeader();
	};

	CalendarUI.prototype.applySchedule = function() {
		var _cal = this;

		var currentDate = this.$calendar.datepicker('getDate');

		if(currentDate < this.scheduleEnd) {
			this.$calendar.find('tr').each(function() {
				var $tr = $(this);

				for(var i = 0; i < _cal.scheduleDays.length; i++) {
					var $td = $tr.find('td:eq(' + _cal.scheduleDays[i] + ')');

					$td.addClass('scheduled');
				}
			});
		}
	};

	CalendarUI.prototype.updateHeader = function() {
		var _cal = this;

		var today = new Date();
		var calDate = this.$calendar.datepicker('getDate');
		var dateText, timeText;

		if(today.getYear() === calDate.getYear() && today.getMonth() === calDate.getMonth() && today.getDate() === calDate.getDate()) {
			dateText = 'Today';

			this.prepareTicker();
		} else {
			dateText = this.months[calDate.getMonth()] + ' ' + calDate.getDate();
			timeText = calDate.getYear() + 1900;

			this.$timeText.text(timeText);

			this.stopTicker();
		}

		this.$dayText.text(dateText);
	};

	CalendarUI.prototype.prepareTicker = function() {
		var _cal = this;
		var now = new Date();
		var firstDelay = (60 - now.getSeconds() - 1) * 1000;

		this.updateTime();

		this.tickerTimeout = setTimeout(function() {
			_cal.startTicker();
		}, firstDelay);
	};

	CalendarUI.prototype.startTicker = function() {
		var _cal = this;

		_cal.updateTime();

		_cal.tickerInterval = setInterval(function() {
			_cal.updateTime();
		}, 60 * 1000);
	};

	CalendarUI.prototype.updateTime = function() {
		var now = new Date();
		var suffix = 'am';
		var currentHour = now.getHours();
		var currentMinute = now.getMinutes();
		var firstDelay = (60 - now.getSeconds()) * 1000;

		if(currentHour > 12) {
			suffix = 'pm';
		}

		currentHour = currentHour % 12;

		if(currentHour === 0) {
			currentHour = 12;
		}

		var timeStr = currentHour + ':' + zeroPad(currentMinute, 2) + suffix;

		this.$timeText.text(timeStr);
	};

	CalendarUI.prototype.stopTicker = function() {
		var _cal = this;

		clearTimeout(_cal.tickerTimeout);
		clearInterval(_cal.tickerInterval);
	};

	CalendarUI.prototype.updateWeekday = function() {
		var _cal = this;

		_cal.removeWeekday();

		var now = new Date();
		var selectedDay = _cal.$calendar.datepicker('getDate');
		var $trigger = _cal.$calendar.find('.ui-state-active');
		var $container = $('.calendar-day-row');
		var weekdayIdx = $trigger.parent().index();
		var weekdayName = _cal.weekdays[weekdayIdx];
		var isToday, scheduleData;

		$trigger.data('day', weekdayName);

		for(var weekday in _cal.schedule.weekdays) {
			var currentWeekday = _cal.schedule.weekdays[weekday];
			var currentWeekdayIdx = currentWeekday.weekday;

			if(weekdayIdx === currentWeekdayIdx) {
				scheduleData = currentWeekday.data;
				break;
			}
		}

		if(now.getYear() === selectedDay.getYear() && now.getMonth() === selectedDay.getMonth() && now.getDate() === selectedDay.getDate()) {
			isToday = true;
		} else {
			isToday = false;
		}

		new Weekday($trigger, $container, isToday, scheduleData);
	};

	CalendarUI.prototype.removeWeekday = function() {
		if($('.weekday-row').length) {
			$('.weekday-row').trigger('removeDay');
		}
	}

	CalendarUI.prototype.bindEvents = function() {
		var _cal = this;

		this.$monthLinks = this.$months.find('a');

		this.$monthLinks
			.on('click', function(e) {
				e.preventDefault();

				var $link = $(this);
				var targetDate = new Date((parseInt($link.attr('data-month'), 10) + 1) + '/01/' + $link.attr('data-year'));
				var currentDate = _cal.$calendar.datepicker('getDate');

				if((targetDate.getMonth() === currentDate.getMonth() && targetDate.getYear() === currentDate.getYear()) === false) {
					_cal.$calendar.datepicker('setDate', targetDate);
				}
			});
	};

	CalendarUI.prototype.initSlider = function() {
		var that = this;
		var sliderWidth = this.$slider.width();
		var stepsWidth = sliderWidth / this.monthPages;

		this.$sliderHandle
			.on('vmousedown', function() {

				$(document).on('vmousemove.monthSlider', function(event) {
					that.setMonthsPage(parseInt((event.clientX - that.$slider.offset().left) / stepsWidth));

				}).one('vmouseup.monthSlider', function(event) {
					event.stopPropagation();

					$(document).off('vmousemove.monthSlider');
				});
			});

		this.$slider
			.on('vmouseup', function(event) {
				that.setMonthsPage(parseInt((event.clientX - that.$slider.offset().left) / stepsWidth));
			});
	};

	CalendarUI.prototype.setMonthsPage = function(page) {
		page = Math.max(Math.min(page, this.monthPages - 1), 0);

		if(this.monthsPage === page) {
			return;
		};

		this.monthsPage = page;

		this.$months.css('margin-left', 60 * this.monthsPage * -1);

		this.$sliderHandle.css('left', this.$slider.width() / (this.monthPages - 1) * this.monthsPage);


	};

	CalendarUI.prototype.init = function() {
		this.build();

		this.initSlider();

		this.bindEvents();

		this.prepareSchedule();

		this.updateWeekday();
	};

	var PopupUI = function(options) {
		var _pop = this;

		this.$overlay = options.$overlay;
		this.popupVisible = options.popupVisible;
		this.overlayVisible = options.overlayVisible;

		PopupUI.prototype.bindEvents = function() {
			this.$overlay
				.on('click', function() {
					_pop.close();
				});
		};

		PopupUI.prototype.init = function() {
			this.bindEvents();
		};

		this.init();
	};

	PopupUI.prototype.open = function(popupID, alignToTrigger, $trigger) {
		var _pop = this;

		_pop.close();

		var $popup = $(popupID);
		var posY;
		var posX = '50%';

		if($popup.length) {

			if(alignToTrigger === true) {
				posY = $trigger.offset().top - 8;
				posX = $trigger.offset().left - ($win.width() / 2) - $popup.outerWidth() + 40;

				$popup.css({
					marginLeft: posX
				})
			} else {
				posY = $win.scrollTop() + ($win.height() - $popup.outerHeight())/2;

				if(posY < 50) {
					posY = 50;
				}
			}

			$popup.css({
				top: posY
			});

			$popup.addClass(_pop.popupVisible);

			_pop.$overlay.addClass(_pop.overlayVisible);
		} else {
			console.log('popup not found');
		}
	};

	PopupUI.prototype.close = function() {
		var _pop = this;

		$('.popup-visible').removeClass(_pop.popupVisible).attr('style', '');
		_pop.$overlay.removeClass(_pop.overlayVisible);
	};

	function createCookie(name,value,days) {
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else var expires = "";
		document.cookie = name+"="+value+expires+"; path=/";
	}

	function readCookie(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	}

	function eraseCookie(name) {
		createCookie(name,"",-1);
	}

	var Weekday = function($triggerLink, $container, isToday, initialRanges) {
		this.$trigger = $triggerLink;
		this.$container = $container;
		this.dayName = this.$trigger.data('day');
		this.ranges = [];
		this.$hours = null;
		this.$ranges = null;
		this.$btnAddHours = null;
		this.$btnAddBreak = null;
		this.$btnRemove = null;
		this.$buttons = null;
		this.$weekday = null;
		this.ratio = null;

		this.$template = $('<div class="weekday-row">\n<h3 class="weekday-row-title" />\n' + 
						   '<div class="weekday-row-actions">\n<a href="#" class="link-add-time" data-cookie="work-hours-tip">+</a>\n' +
						   '<a href="#" class="link-add-break" data-cookie="break-hours-tip">x</a>\n<a href="#" class="link-remove-time" data-cookie="remove-hours-tip">-</a>\n' + 
						   '</div>\n<div class="weekday-row-ranges" />\n<div class="weekday-row-hours">\n' +
						   '<ul />\n</div>\n</div>');

		this.$hourTemplate = $('<li />');
		this.$hourTextTemplate = $('<span class="weekday-row-hour-text" />');
		this.$moonTemplate = $('<i class="ico-moon" />');

		this.$weekdayHeader = null;
		this.$weekdayWorkHours = null;

		Weekday.prototype.build = function() {
			var _day = this;

			var $weekday = this.$template.clone();
			var $weekdayHead = $weekday.find('.weekday-row-title');
			var startHour = 12;

			_day.$hours = $weekday.find('.weekday-row-hours ul');

			// add sections for every hour
			for(var i = 0; i < 25; i++) {
				var $hour = _day.$hourTemplate.clone();

				if(i === 0 || i % 3 === 0) {
					var $hourText = _day.$hourTextTemplate.clone();

					$hourText.text(startHour);

					$hour.append($hourText);

					if(startHour === 12) {
						if(i === 12) {
							$hourText.html(startHour + '<small>noon</small>');
						} else {
							var $moon = _day.$moonTemplate.clone();

							$hour.append($moon);
						}

						startHour = 0;
					}

					startHour += 3;
				}

				_day.$hours.append($hour);
			}

			$weekdayHead.html(_day.dayName + ' <strong /> <span>available live hours</span>');

			_day.$weekday = $weekday;
			_day.$btnAddHours = $weekday.find('.link-add-time');
			_day.$btnAddBreak = $weekday.find('.link-add-break');
			_day.$btnRemove = $weekday.find('.link-remove-time');
			_day.$ranges = _day.$weekday.find('.weekday-row-ranges');
			_day.$buttons = _day.$weekday.find('.weekday-row-actions a');
			_day.$weekdayHeader = _day.$weekday.find('.weekday-row-title');
			_day.$weekdayWorkHours = _day.$weekdayHeader.find('strong');

			// append weekday row to container
			_day.$container.append($weekday);

			_day.ratio = _day.$ranges.width() / (24 * 60);

			if(isToday) {
				$weekday.addClass('is-today');

				$weekday.find('.weekday-row-hours').append('<div class="current-hour-marker" style="width: ' + _day.ratio * (new Date().getHours() * 60 + new Date().getMinutes()) + 'px;" />')
			};
		};

		Weekday.prototype.addRange = function(options) {
			var _day = this;

			if(typeof options.startHour === 'undefined') {
				options.startHour = 11;
				options.endHour = 12;
			}

			var newRange = new Draggable({
				$weekday: _day.$weekday,
				rangeType: options.rangeType,
				startHour: options.startHour,
				endHour: options.endHour
			});

			_day.ranges.push(newRange);

			newRange.setIdx(_day.ranges.length - 1);

			if(typeof initialRanges !== 'undefined') {
				_day.ranges[_day.ranges.length - 1].unfocusRange();
			}
		};

		Weekday.prototype.addRanges = function(rangesArray) {
			var _day = this;

			for(var i = 0; i < rangesArray.length; i++) {
				var currentRange = rangesArray[i];

				var options = {
					rangeType: currentRange.type,
					startHour: currentRange.start,
					endHour: currentRange.end
				}

				_day.addRange(options);
			}
		};

		Weekday.prototype.removeRange = function(rangeId) {
			var _day = this;

			_day.ranges[rangeId].removeRange();
		};

		Weekday.prototype.removeRanges = function() {
			var _day = this;

			for(var i = 0; i < this.ranges.length; i++) {
				_day.ranges[i].removeRange();
			}
		};

		Weekday.prototype.bindEvents = function() {
			var _day = this;

			_day.$trigger
				.on('weekday.selected', function(event, isSelected) {
					if(isSelected === true) {
						_day.$weekday.addClass('selected');

						_day.addRange({
							rangeType: 'work'
						});
					} else {
						_day.$weekday.removeClass('selected');

						_day.removeRanges();
					}
				});

			_day.$buttons
				.on('click', function(e) {
					e.preventDefault();

					var $btn = $(this);

					$btn.toggleClass('active').siblings('.active').removeClass('active');
				});

			_day.$ranges
				.on('click', function(e) {
					var $target = $(e.target);

					if(_day.$btnAddHours.hasClass('active')) {
						var rangeType = 'work';
						var startHour = Math.floor((e.pageX - _day.$ranges.offset().left) / _day.ratio / 60);
						var endHour = startHour + 1;

						_day.addRange({
							rangeType: rangeType,
							startHour: startHour,
							endHour: endHour
						});

						_day.$btnAddHours.removeClass('active');
					} else if(_day.$btnAddBreak.hasClass('active')) {
						var rangeType = 'break';
						var startHour = Math.floor((e.pageX - _day.$ranges.offset().left) / _day.ratio / 60);
						var endHour = startHour + 1;

						_day.addRange({
							rangeType: rangeType,
							startHour: startHour,
							endHour: endHour
						});

						_day.$btnAddBreak.removeClass('active');
					} else if(_day.$btnRemove.hasClass('active') && ($target.parents('.weekday-range').length || $target.hasClass('weekday-range'))) {
						var clickedRangeIdx = $target.parents('.weekday-range:eq(0)').data('idx');

						if(clickedRangeIdx === null) {
							clickedRangeIdx = $target.data('idx');
						}

						_day.ranges[clickedRangeIdx].removeRange();

						_day.$btnRemove.removeClass('active');
					}
				});

			_day.$weekday
				.on('updateTime', function() {
					var workHours = 0;
					var workStart;
					var workEnd;
					var dataArray = {
						work: [],
						breaks: []
					};

					var $workRanges = _day.$ranges.find('.weekday-range-work');

					$workRanges.each(function() {
						var $workRange = $(this);
						var data = $workRange.data('rangeDetails');

						var interval = new TimeInterval(
							data.start,
							data.end
						);

						dataArray.work.push(interval);
					});

					var $workBreaks = _day.$ranges.find('.weekday-range-break');

					$workBreaks.each(function() {
						var $workBreak = $(this);
						var data = $workBreak.data('rangeDetails');
						
						var interval = new TimeInterval(
							data.start,
							data.end
						)

						dataArray.breaks.push(interval);
					});

					workHours = _day.calculateWorkHours(dataArray);

					workHours = floatToHoursStr(workHours);

					_day.$weekdayWorkHours.text(workHours);

					if(workHours <= 0) {
						_day.$weekdayHeader.removeClass('weekday-row-title-visible');
					} else {
						_day.$weekdayHeader.addClass('weekday-row-title-visible');
					}

					if($('.calendar-day-hours span').length) {
						$('.calendar-day-hours span').text(workHours);
					}
				})
				.on('removeDay', function() {
					_day.$weekday.remove();
				});

		};

		Weekday.prototype.calculateWorkHours = function(data) {
			var _day = this;

			var workHours = data.work;
			var breakHours = data.breaks;

			var workTime = 0;

			workHours = reduce(workHours);
			breakHours = reduce(breakHours);

			for(var i = 0; i < workHours.length; i++) {
				var workHour = workHours[i];

				workTime += (workHour.end - workHour.start);

				for(var j = 0; j < breakHours.length; j++) {
					var breakHour = breakHours[j];

					if(breakHour.intercepts(workHour)) {
						if(breakHour.start <= workHour.start && breakHour.end <= workHour.end) {
							var diff = breakHour.end - workHour.start;

							workTime -= diff;
						}

						if(breakHour.end >= workHour.end && breakHour.start >= workHour.start) {
							var diff = workHour.end - breakHour.start;

							workTime -= diff;
						}

						if(breakHour.start > workHour.start && breakHour.end < workHour.end) {
							var diff = breakHour.end - breakHour.start;

							workTime -= diff;
						}
					}
				};
			}

			return workTime;
		};

		Weekday.prototype.init = function() {
			var _day = this;

			_day.build();

			_day.bindEvents();

			if(typeof initialRanges !== 'undefined') {
				_day.addRanges(initialRanges);
			} else {
				_day.addRange({
					rangeType: 'work'
				});

				if($('.calendar-day-hours span').length) {
					$('.calendar-day-hours span').text(0);
				}
			}
		};

		this.init();

		return Weekday;
	};

	var TimeInterval = function(start, end) {
		this.start = start;
		this.end = end;
	};

	TimeInterval.prototype.intercepts = function(otherInterval) {
		
		if (otherInterval.start <= this.start && this.start <= otherInterval.end) {
			return true;
		}

		if (otherInterval.start <= this.end && this.end <= otherInterval.end) {
			return true;
		}

		return false;
	};

	TimeInterval.prototype.merge = function(otherInterval) {
		this.start = Math.min(this.start, otherInterval.start);
		this.end = Math.max(this.end, otherInterval.end);
	};

	/* 
		recursively reduces set of multiple, potentially
		intercepting ranges to a set of non-intercepting ranges
	*/
	var reduce = function(intervals) {
		for (var i = 0; i < intervals.length; i++) {
			for (var j = i + 1; j < intervals.length; j++) {
				if (intervals[i].intercepts(intervals[j])) {
					intervals[i].merge(intervals[j]);
					intervals.splice(j, 1);

					return reduce(intervals);
				}
			}
		}
		return intervals;
	};

	var floatToHoursStr = function(hours) {
		var hour = Math.floor(hours);
		var mins = Math.round( 60 * (hours % 1) / 10 ) * 10;
		var result = hour;

		if(mins > 0) {
			result = result + ':' + zeroPad(mins, 2);
		}

		return result;
	};

	var Draggable = function(options) {
		this.$weekday = options.$weekday;
		this.$container = this.$weekday.find('.weekday-row-ranges');
		this.$hoursTitle = this.$weekday.find('.weekday-row-title');
		this.$hoursText = this.$hoursTitle.find('strong');
		this.rangeType = options.rangeType;
		this.startHour = options.startHour;
		this.endHour = options.endHour;
		this.dragging = false;

		this.$template = $('<div class="weekday-range weekday-range-' + this.rangeType + '" />');
		this.$handleTemplate = $('<div class="weekday-range-handle">\n' + 
								 '<span class="weekday-range-text"></span>\n</div>');

		this.$range = null;
		this.$handles = null;

		this.min = 0;
		this.max = this.$container.width();

		this.currentStart = null;
		this.currentEnd = null;
		this.ratio = null;

		this.init();
	};

	Draggable.prototype.build = function() {
		var _range = this;

		var $newRange = this.$template.clone();
		var $startHandle = this.$handleTemplate.clone();
		var $endHandle = this.$handleTemplate.clone();

		$startHandle.data('type', 'start');
		$endHandle.data('type', 'end');

		$newRange.append($startHandle);
		$newRange.append($endHandle);

		_range.$range = $newRange;
		_range.$handles = _range.$range.find('.weekday-range-handle');

		_range.$container.append($newRange);

		_range.minToPxRatio();

		_range.move();
	};

	Draggable.prototype.bindEvents = function() {
		var _range = this;

		_range.$handles
			.on('vmousedown', function(e) {
				e.preventDefault();

				_range.dragging = true;

				var $handle = $(this);
				var handleType = $handle.data('type');

				var startHour = _range.startHour;
				var endHour = _range.endHour;

				var startPos = _range.$range.position().left;
				var startWid = _range.$range.width();

				var startX = e.pageX;

				_range.$container
					.on('vmousemove', function(e) {
						e.preventDefault();

						var newPos, newWid;

						if(handleType === 'start') {
							newPos = startPos + (e.pageX - startX);
							newWid = startWid - newPos + startPos;

							if(newWid >= 14) {
								_range.startHour = parseFloat( (newPos / _range.ratio / 60).toFixed(1) );

								if(_range.startHour < 0) {
									_range.startHour = 0;
								}

								_range.move();
							} else {
								_range.dragging = false;

								_range.$container
									.off('vmousemove');
							}
						} else if(handleType === 'end') {
							newWid = startWid + (e.pageX - startX);

							if(newWid >= 14) {
								_range.endHour = parseFloat( ((newWid + startPos) / _range.ratio / 60).toFixed(1) );

								if(_range.endHour > 24) {
									_range.endHour = 24;
								}

								_range.move();
							} else {
								_range.dragging = false;

								_range.$container
									.off('vmousemove');
							}
						} else {
							_range.dragging = false;

							_range.$container
								.off('vmousemove');

							return false;
						}
					});
			})
			.on('vmouseup', function(e) {
				e.preventDefault();

				_range.$container
					.off('vmousemove');

				_range.dragging = false;
			});

		_range.$range
			.on('vmousedown', function(e) {
				if(_range.$weekday.find('.link-remove-time.active').length === 0) {
					e.preventDefault();
				
					_range.focusRange();
				}
			});

		_range.$container
			.on('mouseleave', function(e) {
				if(_range.dragging === true) {
					_range.dragging = false;

					_range.$container
						.off('vmousemove');
				}
			})

		_range.$weekday
			.on('vmouseup', function(e) {
				var $target = $(e.target);

				if($target.parents('.weekday-range').length === 0) {
					_range.unfocusRange();
				}
			})
	};

	Draggable.prototype.move = function() {
		var _range = this;

		var startHour = _range.startHour;
		var endHour = _range.endHour;

		_range.$range
			.data('rangeDetails', {
				start: startHour,
				end: endHour,
				duration: endHour - startHour
			});

		var posX = startHour * 60 * _range.ratio;
		var wid = (endHour - startHour) * 60 * _range.ratio;

		if(posX < _range.min) {
			posX = _range.min;
		}

		if(posX + wid > _range.max) {
			wid = _range.max - posX;
		}

		_range.$range
			.css({
				width: wid,
				left: posX
			});

		_range.updateHoursText();
	};

	Draggable.prototype.updateHoursText = function() {
		var _range = this;

		var startHourText = Math.floor(_range.startHour) % 12;

		if(startHourText === 0) {
			startHourText = 12;
		}

		var startMinutes = Math.round( 60 * (_range.startHour % 1) / 10 ) * 10;
		var startHandleText = startHourText + ':' + zeroPad(startMinutes, 2);

		var endHourText = Math.floor(_range.endHour) % 12;

		if(endHourText === 0) {
			endHourText = 12;
		}

		var endMinutes = Math.round( 60 * (_range.endHour % 1) / 10) * 10;
		var endHandleText = endHourText + ':' + zeroPad(endMinutes, 2);

		_range.$handles
			.each(function() {
				var $handle = $(this);

				if($handle.data('type') === 'start') {
					$handle.find('.weekday-range-text').text(startHandleText);
				} else {
					$handle.find('.weekday-range-text').text(endHandleText);
				}
			});
	};

	Draggable.prototype.minToPxRatio = function() {
		var _range = this;

		_range.ratio = _range.$container.width() / (24 * 60);
	};

	Draggable.prototype.removeRange = function() {
		var _range = this;

		_range.$range.remove();

		_range.unfocusRange();
	};

	Draggable.prototype.focusRange = function() {
		var _range = this;

		_range.$range.addClass('weekday-range-focus').siblings().removeClass('weekday-range-focus');
	};

	Draggable.prototype.unfocusRange = function() {
		var _range = this;

		_range.$range.removeClass('weekday-range-focus');

		_range.$weekday.trigger('updateTime');
	};

	Draggable.prototype.setIdx = function(idx) {
		var _range = this;

		_range.$range.data('idx', idx);
	};

	Draggable.prototype.init = function() {
		var _range = this;

		_range.build();

		_range.bindEvents();

		_range.focusRange();
	};

	var zeroPad = function(num, leading) {
		var numStr = '' + num;
		var numLength = numStr.length;

		if(numStr.length < leading) {
			for(var i = 0; i < leading - numLength; i++ ) {
				numStr = '0' + numStr;
			}
		}

		return numStr;
	};

})(window, document, jQuery);