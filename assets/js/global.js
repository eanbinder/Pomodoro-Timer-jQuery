jQuery.noConflict();
pom = {
	// Whether the timer is currently paused
	isPaused: true,
	// Whether to override break/session length and just use 6 and 8 seconds respectively
	isTestMode: false,
	// Break and session length
	breakLength: 5,
	sessionLength: 25,
	// Whether current period is a break
	isBreak: false,
	// Time remaining when pause is clicked: Reset to 0 when session or break length changes
	pauseTime: 0,
	// Whether errors showing for session/break
	showSessionError: false,
	showBreakError: false, 
	// Whether to start a new session/break or continue with the paused one
	fromPause: false,
	
	// Current period modified (i.e. break length modified during break or session length modified during session)
	currentLengthModified: false,
	init: function() {
		/*
		CLEANED UP COPY
		Objective: Build a CodePen.io app 
		that is functionally similar to this:
		https://codepen.io/FreeCodeCamp/full/aNyxXR/.
		
		User Story: I can start a 25 minute pomodoro, 
			and the timer will go off once 25 minutes 
			has elapsed.
		
		User Story: I can reset the clock for my next
		pomodoro.
		
		User Story: I can customize the length of 
		each pomodoro.
		
		Used this tutorial to learn how to make a timer
		with setInterval: https://www.sitepoint.com/build-javascript-countdown-timer-no-dependencies/
		*/
		// Stepper field event handlers
		pom.stepperInit();
		// Get session/break length from fields (browser may have cached user-entered values)
		pom.breakLength = jQuery("#brkNum").val();
		pom.sessionLength = jQuery("#ssnNum").val();
		
		/* If either field changes, keep value within a
		certain range and set sT and bT
		
		If you change either field after initially starting the timer,
		the change will take effect either when the next period starts,
		or after pausing and restarting the timer; whichever comes first */
		
		// Timer event handlers and defaults
		pom.timer.init();
		
		// Audio control init		
		pom.audioInit();
		
		

	},
	
	
	/* 
		pom.audioInit
		
		Event handler and initial value for mute audio field
	*/
	audioInit: function() {
		// Mute audio field
		var toggle = jQuery('#mute-audio');
		// Get value set on page load
		pom.isMuted = toggle.prop('checked');
		// Toggle value on change
		toggle.off('change').change(pom.toggleAudio);
		
		jQuery('.beep').off('click').click(function(){
			pom.timer.playAudio(true);
		});
	},
	// Whether the audio is muted (based on the field state)
	isMuted: false,
	showProgress: true,
	/* 
		pom.toggleAudio
		
		Updates the muted state (called when user changes the field)
	*/
	toggleAudio: function(event) {
		// Mute audio field
		var toggle = jQuery(event.target).closest("input");
		// If checked, it's muted so we can just set it to the value of that property
		pom.isMuted = toggle.prop('checked');
	},
	/* 
		pom.timer
		
		Holds properties and functions related to the timer itself
	*/
	timer: {
		// ID returned by setInterval when starting the timer
		intervalID: 0,
		// jQ object of the #time element containing the countdown
		clock: {},
		
		
		// The total length of the current session or break (in ms)
		totalTime: 0,
		
		// Time to end this session or break (date object)
		endTime: 0,
		/* 
			pom.timer.init
			
			Event handlers for timer buttons (play/pause and clear)
		*/
		init: function() {
			pom.timer.clock = jQuery('#count');
			//pom.timer.totalTime = pom.timer.getTotal();
			// Play/pause button click
			jQuery(	"#play").off('click').click(pom.timer.toggle);
			
			// Clear button click			
			jQuery('#clear').off('click').click(pom.timer.clear);				
			
			// Show progress bar field
			jQuery("#show-progress").off('change').change(pom.timer.checkProgressField);	
			pom.showProgress = jQuery("#show-progress").prop('checked');	
			pom.timer.toggleProgress();
		},
		/*
			pom.timer.toggleProgress
			
			Called when progress bar field clicked to show and hide progress
		 */
		checkProgressField: function(event) {
			var field = jQuery(event.target).closest('input');
			
			pom.showProgress = field.prop('checked');
			pom.timer.toggleProgress();
		},
		/* 
			pom.timer.toggleProgress
			
			Checks value of global pom.showProgress and shows/hides progress bar
		*/
		toggleProgress: function() {
			var progressContainer = jQuery('#perc');
			if (pom.showProgress) {
				progressContainer.removeClass('hide');
			} else {
				progressContainer.addClass('hide');
			}
		},
		
		
		/* 
			pom.timer.clear
			
			When clear button clicked, stop and clear timer
		*/
		clear: function(event) {
			// Stop the timer
			pom.timer.stop();
			// Change play/pause button text
			jQuery('#play').html('Start timer');
			// Clear visible countdown
			jQuery("#timelabel, #count").html('');
			// Hide the clear button since there's nothing to clear
			jQuery('#clear').removeClass('show');
			
			pom.timer.setProgress(0);
		},
		/* 
			pom.timer.setProgress
			
			Set progress bar text and width
			
			@param: percent: percentage of time passed
		*/
		setProgress: function(percent) {
			var percentText = Math.floor(percent) + '%',
				// If 0, clear text
				progressText = (percent > 0) ? percentText + ' of time passed' : '';
			// Set text	and bar width
			jQuery("#progress-text").html(progressText);
			jQuery("#bar").css('width', percentText);
		},
		/* 
			pom.timer.toggle
			
			Callback for click on play/pause button. Starts or pauses timer
		*/
		toggle: function(event) {
			// Button clicked (can only be one button but this is safer if there's ever a functionality change)
			var button = jQuery(event.target).closest('button'),
				// Text for play/pause button
				buttonText = (pom.isPaused) ? 'Pause timer' : 'Start timer';
			// Change play/pause button text
			button.html(buttonText);
			
			//Click play: Start timer
			if (pom.isPaused){
			
				// Update globals for whether this is paused//time to end this session or break
				pom.isPaused = false;
				pom.timer.endTime = pom.timer.getEndTime();
				// Update total amount of time counting to
				pom.timer.updateTotal();
				// Start timer
				pom.timer.start();
				// Show clear button
				jQuery('#clear').addClass('show');
			// Click pause: pause timer	
			} else {
				
				// If the length of the period (session or break) the timer is in has changed since this period started
				// use the updated period length when resuming instead of resuming from pause
				pom.fromPause = (pom.currentLengthModified) ? false : true;
				// Stop timer
				pom.timer.stop();
				
			}
			// Reset
			pom.currentLengthModified = false;
		},
		/* 
			pom.timer.stop
			
			Sets paused state to true and stops timer function
		*/
		stop: function() {
			// Timer is paused
			pom.isPaused = true;
			
			// Stop updating the timer
			clearInterval(pom.timer.intervalID);
			
			
		},
		
		/* 
			pom.timer.playAudio()
			
			Plays audio (only if user hasn't muted it or bypassMute is true)
			
			@param: bypassMute (boolean): whether to play audio regardless of user setting (used for audio test button)
		*/
		
		playAudio: function(bypassMute) {
			bypassMute = (bypassMute === undefined) ? false : bypassMute;
			// Audio isn't muted
			if (!pom.isMuted || bypassMute) {
				// Play a short beep
				jQuery('#beep')[0].play();
			}
			
		},
		/* 
			pom.timer.start()
			
			Starts timer 
		*/
		start: function() {
			// Update the timer with the default value
			pom.timer.update();
			// Count down to the end of the session (or break): Save ID returned by setInterval so we can clear it later
			pom.timer.intervalID = setInterval(function(){pom.timer.update();},1000);
			

		},
		/* 
			pom.timer.update()
			
			Updates timer from globals set
		*/
		update: function(){
			
/*
			var t = 0;
			if (pom.timer.endTime === 0){
				t = 0; 
			} else {
*/
				t = pom.timer.getRemaining(pom.timer.endTime);
				//console.log(end);
			
				// Total time left in mS
				var f = t.total;
				//f is milliseconds remaining
				//console.log("totalTime: " + pom.timer.totalTime);
				//b is the percentage time elapsed
				var percentageTimeElapsed = ((pom.timer.totalTime - f)/pom.timer.totalTime) * 100,
					hours = ('0' + t.hours + ':').slice(-2),
					minutes = ('0' + t.minutes + ':').slice(1),
					seconds = ('0' + t.seconds).slice(-2);
				//Update countdown
				pom.timer.clock.html(hours + minutes + seconds);

				
				
				//Set current time remaining in ms 
				pom.pauseTime = f;
				// Update Progress bar
				pom.timer.setProgress(percentageTimeElapsed);
				
				
				
				
				if(t.total <= 0){
					//console.log('switch');
					
					//Clock shows 0 and then stops
					
					clearInterval(pom.intervalID);
					// If current period was modified (break length changed during break): Reset
					pom.currentLengthModified = false;
					pom.isBreak = !pom.isBreak;
					pom.timer.updateTotal();
					//toggle boolean status
					pom.timer.endTime = pom.timer.getEndTime();
					pom.timer.update();
				} else if (t.total <= 1000) {
					pom.timer.playAudio();
				}
// 			} 
			
				
		},
		//Returns total time being counted to in ms
		updateTotal: function(){
			// Default: Use total time last set
			var num = pom.timer.totalTime;
			// This session/break should resume from pause
			if (pom.fromPause){
				//console.log('fromPause');
				// When this period ends, need to reset total time (going from session to break or vice versa)
				pom.fromPause = false;
				
			// Going to a new session or break or starting timer after length of current period has been modified	
			} else {
				
				if (!pom.isBreak){
					num = pom.sessionLength * 60000;
					// Test mode: just do 8 second session
					if (pom.isTestMode) {
						num = 8000;
					}
					
				} else {
					num = pom.breakLength * 60000;
					// Test mode: just do 6 second break
					if (pom.isTestMode) {
						num = 6000;
					}
				 	
				}
			}
			
			//return num; 
			pom.timer.totalTime = num;
		},
				
		getEndTime: function(){
		//Determines what time the countdown will end
		//based on fromPause and isBreak
			var text;
			var end;
			if (pom.fromPause){
				console.log('fromPause');
				// Use the time left when the user paused to get the new end time
				end = pom.timer.getNewTime(pom.pauseTime);
				pom.fromPause = false;
			} else {
				if (!pom.isBreak){
					text = "Session";
					
					// Get a date object representing a session length in the future
					end = pom.timer.addMinutes(pom.sessionLength);
					// Test mode: just do 8 second session
					if (pom.isTestMode) {
						end = pom.timer.addSeconds(8);
					}
					
				} else {
					text = "Break";
					
					// Get a date object representing a session length in the future
					end = pom.timer.addMinutes(pom.breakLength);
					// Test mode: just do 6 second break
					if (pom.isTestMode) {
						end = pom.timer.addSeconds(6);
					}
				}
			}
			// Label session or break
			jQuery(	"#timelabel").text(text);
			
			return end;
		},
		/* 
			pom.timer.getRemaining()
			
			Gets time left on timer
			
			@param: end: date object representing the time the current session or break will end
			
			@return: object containing time left: total ms, hours, minutes, and seconds
		*/
		getRemaining: function(end){
	
		 	// New date
			var d = new Date(),
				// End date and current date in mS
				endDate = end.getTime(),
				curDate = d.getTime(),
				// Time left in mS
				totalTimeLeft = endDate - curDate,
				// Get seconds, minutes, and hours left
				seconds = Math.floor( (totalTimeLeft/1000) % 60),
				minutes = Math.floor( (totalTimeLeft/1000/60) % 60),
				hours = Math.floor( (totalTimeLeft/(1000*60*60)) % 24);
			
		
			 
			return {
				'total' : totalTimeLeft,
				'hours' : hours,
				'minutes': minutes,
				'seconds' : seconds,
			}; 
		},
		/* 
			pom.addMinutes
			
			Adds the given number of minutes to the current date and returns that date object (representing m minutes from now)
			
			@param: m (number): How many minutes in the future
		*/
		addMinutes: function(m){
			//adds minutes m to get an end Date
			 var potato = new Date();
			 return new Date(potato.getTime() + (m * 60000));
		},
		/* 
			pom.timer.addSeconds
			
			Adds the given number of seconds to the current date and returns that date object (representing s seconds from now)
			
			@param: s (number): How many seconds in the future
		*/
		addSeconds: function(s){
			/* adds seconds s to date: Used during
			testing so I don't have to sit through
			a full minute, keeping it around in case
			I need it later*/
			var owl = new Date();
			return new Date(owl.getTime() +(s* 1000));
		},
		/* 
			pom.timer.getNewTime
			
			@param: t (number) time in mS to add to the current date
			@return: Date object representing t milliseconds from now
		*/
		getNewTime: function(t){
			
		
			var q = new Date();
		 // console.log("gettime: " + q.getTime());
			return new Date(q.getTime()+ t);
			
		}



		
	},
	/* 
		pom.stepperInit
		
		Event handlers for stepper controls
	*/
	stepperInit: function() {
		jQuery(	"#ssnNum").change(function(){
		
			var sessionUpdates = pom.numberChange(false);
			pom.showSessionError = sessionUpdates.showError;
			pom.sessionLength = sessionUpdates.newValue;
		
		});
		
		jQuery(	"#brkNum").change(function(){
			var breakUpdates = pom.numberChange(true);
			pom.showBreakError = breakUpdates.showError;
			pom.breakLength = breakUpdates.newValue;
		
		});
			
		/*Increment/decrement value of each field when
		+/- buttons are clicked */
		// Separate event handlers so we don't need to check class every time a button is clicked
		jQuery(	".minus").click(function(event) {
			pom.stepButton(event, false);
			
		});
		
		jQuery(	".plus").click(function(event){
			pom.stepButton(event, true);
		});
	},
	/* 
		pom.numberChange
		
		Called when session or break number field changed
		
		@param: isBreak (boolean): whether the field changed is the break length
		@return: an object with the following properties:
			• newValue: The new value of the field (user-entered, or corrected if they entere something invalid)
				Corresponds to new session or break length
			• showError: Whether error for this field is showing
	*/
	numberChange: function(isBreak) {
		// Variables default to those used for session
		// Field that was changed
		var field = jQuery("#ssnNum"),
			// Max value allowed 
			maxValue = 120,
			// Whether error is currently showing
			showError = pom.showSessionError,
			errorID = 'sTxt',
			// Error HTML element
			error = jQuery(	"#sTxt"),
			// Whether a session is in progress
			inProgress = !pom.isBreak;
		// Break field changed
		if (isBreak) {
			field = jQuery("#brkNum");
			maxValue = 60;
			showError = pom.showBreakError;
			errorID = "bTxt";
			// Whether a break is in progress
			inProgress = pom.isBreak;
		}
		
		// Field value
		var value = field.val(),
			error = jQuery('#' + errorID);
		console.log(value);
		// Invalid number (too big or too small)
		if (value > maxValue || value < 1) {
			error.fadeIn("slow");
			showError = true;
			field.attr('aria-describedby', errorID);
			
		}
		// Bigger than max value: set to max	
		if (value > maxValue) {
			
			field.val(maxValue);
			value = maxValue;
		// 0 or less: set to 1	
		} else if (value < 1 ){
				field.val(1);
				value = 1;
		// No error currently but error showing		
		} else if (showError) {
			// Hide error
			error.fadeOut("slow");
			showError = false;
			field.removeAttr('aria-describedby');

		}
		// Session edited during session or break edited during break
		if (inProgress) {
			
			// Reset time remaining at pause to restart session
			pom.pauseTime = 0;
			// Treat as if not started from pause
			pom.fromPause = false;
			// Period we're currently in has been modified
			pom.currentLengthModified = true;
		}
		// Return values to set for globals
		return {showError: showError, newValue: value};
		
		
	},
	/* 
		pom.stepButton
		
		Step button when clicked
		
		Input: event (from event handler), isIncrement (boolean): whether increment button was clicked
		
		@todo: Possibly change this to hold onto each time field value globally and update
			every time it changes so we don't have to get the value when incrementing/decrementing
			
			But then we'd need to either use different event handlers for each stepper or check which one was modified
			so it's probably not worth it
	*/
	stepButton: function(event, isIncrement) {
		// Get the time field to change
		var timeField = jQuery(event.target).closest('.length-control').find('.time'),
			// Time currently in the field
			time = timeField.val(),
			// 
			newTime = (isIncrement) ? time++ : time--;
		// Update field and trigger change	(fix this maybe to call the button instead)
		timeField.val(time).change();
	}
}
jQuery(document).ready(function(){
	pom.init();
});