var gulp = require('gulp'),
	concat = require('gulp-concat'),
	cssBeautify = require('gulp-cssbeautify'),
	notify = require('gulp-notify'),
	sass = require('gulp-sass'),
	mmq = require('gulp-merge-media-queries'),
	scssPaths = ['assets/scss/**/*.scss'],
	cssDest = ['assets/css'];

function compileSCSS() {
	return gulp.src(scssPaths)
		.pipe(sass({sourceComments: true}).on('error', sass.logError))
		.pipe(concat('screen.css'))
		.pipe(mmq())
		.pipe(cssBeautify())
		.pipe(gulp.dest(cssDest))
		.pipe(notify('SCSS processed'));
}
	
gulp.watch(scssPaths, gulp.parallel(compileSCSS));
exports.default = gulp.parallel(compileSCSS);