/**
 * MEH gulp
 */

// 'use strict';

var fs = require('graceful-fs');
var path = require('path');
var gulp = require('gulp');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var gulpLoadPlugins = require('gulp-load-plugins');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var svgmin = require('gulp-svgmin');
var postcss = require('gulp-postcss');
var babel = require('gulp-babel');
var oldie = require('oldie');
var autoPrefixer = require('autoprefixer');
var sourcemaps = require('gulp-sourcemaps');

var atImport = require("postcss-import");
var pcMixins = require("postcss-mixins");
var pcColor = require('postcss-color-function');
var pcVars = require("postcss-advanced-variables");
var pcNested = require("postcss-nested");
var pcMedia = require("postcss-custom-media");
var pcProperties = require("postcss-custom-properties");
var pcFlex = require('postcss-flexibility');
var pcSvg = require('postcss-inline-svg');
var pcNoDups = require('postcss-discard-duplicates');
var syntax = require('postcss-scss');
var stylefmt = require('gulp-stylefmt');

var $ = gulpLoadPlugins();
var reload = browserSync.reload;

var SASS_PATHS = [
	'src/motion-ui/src',
	'src/styles'
];

var AUTOPREFIXER_BROWSERS = [
	'ie >= 10',
	'ie_mob >= 10',
	'last 2 ff versions',
	'last 2 chrome versions',
	'last 2 edge versions',
	'last 2 safari versions',
	'last 2 opera versions',
	'ios >= 7',
	'android >= 4.4',
	'bb >= 10'
];

var PRECSS_PLUGINS = [
	atImport,
	pcMixins,
	pcProperties,
	pcVars,
	pcColor,
	pcMedia,
	pcNested,
	pcSvg({
		path: './images/icons'
	})
];

var POSTCSS_PLUGINS = [
	atImport,
	autoPrefixer({
		browsers: AUTOPREFIXER_BROWSERS
	})
];

var POSTCSS_IE = [
	autoPrefixer({
		browsers: ['IE 8', 'IE 9']
	}),
	pcFlex,
	oldie
];

var SOURCESJS = [
	// ** Mine ** //
	'src/scripts/main.babel.js'
];

// ***** Development tasks ****** //
// Lint JavaScript
gulp.task('lint', function() {
	gulp.src('src/scripts/*.js')
		.pipe(xo())
});

// ***** Production build tasks ****** //
// Optimize images
gulp.task('images', function() {
	gulp.src('src/images/**/*.svg')
		.pipe(svgmin({
			plugins: [{
				cleanupIDs: true
			}, {
				removeTitle: true
			}, {
				removeAttrs: {
					attrs: '(fill|stroke)'
				}
			}, {
				addClassesToSVGElement: {
					className: 'v-icon'
				}
			}, {
				removeUselessStrokeAndFill: true
			}, {
				cleanupNumericValues: {
					floatPrecision: 2
				}
			}, {
				removeNonInheritableGroupAttrs: true
			}, {
				removeDimensions: true
			}]
		}))
		.pipe(gulp.dest('images'))
		.pipe($.size({
			title: 'images'
		}))
});

// Compile and Automatically Prefix Stylesheets (production)
gulp.task('presass', function() {
	gulp.src('src/styles/postCSS/index.css')
		.pipe($.if('*.css', postcss(PRECSS_PLUGINS, {
			syntax: syntax
		})))
		.pipe($.concat('_postcss.scss'))
		.pipe(gulp.dest('src/styles/'))
});

gulp.task('styles', function() {
	gulp.src('src/styles/style.scss')
		// Generate Source Maps
		.pipe(sourcemaps.init())
		.pipe($.sass({
			includePaths: SASS_PATHS,
			precision: 10,
			onError: console.error.bind(console, 'Sass error:')
		}))
		.pipe(gulp.dest('.tmp'))
		.pipe($.concat('style.css'))
		.pipe(postcss(POSTCSS_PLUGINS))
		.pipe(stylefmt())
		.pipe(gulp.dest('./'))
		.pipe($.if('*.css', $.cssnano()))
		.pipe($.concat('style.min.css'))
		.pipe($.size({
			title: 'styles'
		}))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest('./'))
});

gulp.task('oldie', function() {
	gulp.src('.tmp/style.css')
		.pipe(postcss(POSTCSS_IE))
		.pipe($.concat('oldie.css'))
		.pipe(gulp.dest('css'))
		.pipe($.if('*.css', $.cssnano()))
		.pipe($.concat('oldie.min.css'))
		.pipe(gulp.dest('css'))
});

// Concatenate And Minify JavaScript
gulp.task('scripts', function() {
	gulp.src(SOURCESJS)
		.pipe(sourcemaps.init())
		.pipe(babel({
			"presets": ["es2015"],
			"only": [
				"src/scripts/main.babel.js"
			]
		}))
		.pipe($.concat('main.js'))
		.pipe(gulp.dest('js'))
		.pipe($.concat('main.min.js'))
		.pipe($.uglify())
		.pipe($.size({
			title: 'scripts'
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('js'))
});

/**
 * Defines the list of resources to watch for changes.
 */
// Build and serve the output
gulp.task('serve', ['scripts', 'styles'], function() {
	browserSync.init({
		// proxy: "local.wordpress.dev"
		// proxy: "local.wordpress-trunk.dev"
		proxy: 'rcdoc.dev'
			// proxy: "127.0.0.1:8080/wordpress/"
	});

	gulp.watch(['*/**/*.php'], reload);
	gulp.watch(['src/**/*.{scss,css}'], ['styles', reload]);
	gulp.watch(['src/**/*.js'], ['lint', 'scripts']);
	gulp.watch(['src/images/**/*'], reload);
});

// Build production files, the default task
gulp.task('default', function(cb) {
	runSequence('images', ['presass', 'styles'], 'oldie', 'scripts', cb);
});
