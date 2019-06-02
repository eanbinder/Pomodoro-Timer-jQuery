# Pomodoro-Timer-jQuery
Pomodoro timer built with jQuery

This is a refactored and updated version of an older codepen I had.

Audio from [pan14 on Freesound](https://freesound.org/people/pan14/sounds/263133/).

## Accessiblility

Both number inputs have aria-live="assertive" will result in the value being announced twice when the user edits the field directly. This is not ideal, but I wasn't sure what else to do. (Ideas are welcome!)

When I looked for recommendations for how to handle I learned that [increment/decrement buttons are necessary for screen readers on touch devices](https://webaim.org/discussion/mail_thread?thread=9067). I couldn't find a way to make the updated field value available to screen readers without direct edits to the input being announced twice or using some kind of redundant text on the page. I may try out redundant text some time and see if I can hide it sufficiently when not in use.

When I get a chance I also want to look into best practices for timers and making the updated state (started/paused/cleared) available to screen readers after a user clicks a start/pause/clear button.

