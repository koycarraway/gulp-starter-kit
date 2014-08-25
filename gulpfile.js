/*!
 * Static Site Starter Kit | https://github.com/kriasoft/static-site-starter
 * Copyright (c) Konstantin Tarkus, KriaSoft LLC. All rights reserved. See COPYRIGHT.txt
 */

'use strict';

// Include Gulp and other build automation tools and utilities
// See: https://github.com/gulpjs/gulp/blob/master/docs/API.md
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var merge = require('merge-stream');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var sass = require('gulp-ruby-sass');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var pagespeed = require('psi');
var argv = require('minimist')(process.argv.slice(2));

// Settings
var DEST = './build';                       // The build output folder
var RELEASE = !!argv.release;               // Minimize and optimize during a build?
var GOOGLE_ANALYTICS_ID = 'UA-XXXXX-X';     // https://www.google.com/analytics/web/
var AUTOPREFIXER_BROWSERS = [               // https://github.com/ai/autoprefixer
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
];

var src = {};
var watch = false;
var reload = browserSync.reload;
var pkgs = (function () {
    var temp = {};
    var map = function (source) {
        for (var key in source) {
            temp[key.replace(/[^a-z0-9]/gi, '')] = source[key].substring(1);
        }
    };
    map(require('./package.json').dependencies);
    map(require('./bower.json').dependencies);
    return temp;
}());

// The default task
gulp.task('default', ['serve']);

// Clean up
gulp.task('clean', del.bind(null, [DEST]));

// 3rd party libraries
gulp.task('vendor', function () {
  return merge(
    gulp.src('bower_components/jquery/dist/jquery.js')
      .pipe($.rename('jquery.min.js'))
      .pipe($.uglify())
      .pipe(gulp.dest(DEST + '/vendor/jquery-' + pkgs.jquery)),
    gulp.src('bower_components/modernizr/modernizr.js')
      .pipe($.rename('modernizr.min.js'))
      .pipe($.uglify())
      .pipe(gulp.dest(DEST + '/vendor/modernizr-' + pkgs.modernizr)),
    gulp.src('bower_components/restive/restive.js')
      .pipe($.rename('restive.min.js'))
      .pipe($.uglify())
      .pipe(gulp.dest(DEST + '/vendor/restive-' + pkgs.restive)),
    gulp.src('bower_components/picturefill/dist/picturefill.js')
      .pipe($.rename('picturefill.min.js'))
      .pipe($.uglify())
      .pipe(gulp.dest(DEST + '/vendor/picturefill-' + pkgs.picturefill))
  );
});

// // 3rd Party Libraries
// gulp.task('vendor', function () {
//     src.scripts = ['bower_components/jquery/dist/jquery.min.js', 'bower_components/modernizr/modernizr.js', 'bower_components/restive/restive.js', 'bower_components/picturefill/dist/picturefill.js'];
//     return gulp.src(src.scripts)
//         .pipe($.if(!RELEASE, $.sourcemaps.init()))
//         .pipe($.concat('vendor.js'))
//         .pipe($.if(RELEASE, $.uglify()))
//         .pipe($.if(!RELEASE, $.sourcemaps.write()))
//         .pipe(gulp.dest(DEST + '/scripts'))
//         .pipe($.if(watch, reload({stream: true})));
// });


// Static files
gulp.task('assets', function () {
    src.assets = 'assets/**';
    return gulp.src(src.assets)
        .pipe(gulp.dest(DEST))
        .pipe($.if(watch, reload({stream: true})));
});

// Images
gulp.task('images', function () {
    src.images = 'images/**';
    return gulp.src(src.images)
        .pipe($.cache($.imagemin({
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest(DEST + '/images'))
        .pipe($.if(watch, reload({stream: true})));
});

// Fonts
gulp.task('fonts', function () {
    return gulp.src('./fonts/**')
        .pipe(gulp.dest(DEST + '/fonts'));
});

// HTML pages
gulp.task('pages', function () {
    src.pages = ['pages/**/*', 'layouts/**/*', 'partials/**/*'];
    return gulp.src(src.pages[0])
        .pipe($.if('*.hbs', $.assemble({
            data: { pkgs: pkgs },
            partials: 'partials/**/*.hbs',
            layout: 'default',
            layoutext: '.hbs',
            layoutdir: 'layouts'
        })))
        .pipe($.if(RELEASE, $.htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            minifyJS: true, minifyCSS: true
        })))
        .pipe($.replace('UA-XXXXX-X', GOOGLE_ANALYTICS_ID))
        .pipe(gulp.dest(DEST))
        .pipe($.if(watch, reload({stream: true})));
});

// SASS style sheets
gulp.task('styles', function () {
  src.styles = './styles/**/*.scss';
  return gulp.src('./styles/**/*.scss')
    .pipe($.if(!RELEASE, $.sourcemaps.init()))
    .pipe(plumber({
      errorHandler: notify.onError("Error: <%= error.message %>")
    }))
    .pipe(sass({
      compass: true,
      bundleExec: false,
      sourcemap: false,
      sourcemapPath: 'styles'
    }))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe($.csscomb())
    .pipe(RELEASE ? $.cssmin() : $.util.noop())
    // .pipe($.rename('main.css'))
    .pipe($.if(!RELEASE, $.sourcemaps.write()))
    .pipe(gulp.dest(DEST + '/styles'))
    .pipe($.if(watch, reload({stream: true})));
});

// JavaScript
gulp.task('scripts', function () {
    src.scripts = ['scripts/plugins.js', 'scripts/main.js'];
    return gulp.src(src.scripts)
        .pipe($.if(!RELEASE, $.sourcemaps.init()))
        .pipe($.concat('bundle.js'))
        .pipe($.if(RELEASE, $.uglify()))
        .pipe($.if(!RELEASE, $.sourcemaps.write()))
        .pipe(gulp.dest(DEST + '/scripts'))
        .pipe($.if(watch, reload({stream: true})));
});

// Build
gulp.task('build', ['clean'], function (cb) {
    runSequence(['vendor', 'assets', 'images', 'fonts', 'pages', 'styles', 'scripts'], cb);
});

// Run BrowserSync
gulp.task('serve', ['build'], function () {
    browserSync({
        notify: false,
        server: { baseDir: [DEST] }
    });

    gulp.watch(src.assets, ['assets']);
    gulp.watch(src.images, ['images']);
    gulp.watch(src.pages, ['pages']);
    gulp.watch(src.styles, ['styles']);
    gulp.watch(src.scripts, ['scripts']);
    watch = true;
});

// Publish to Amazon S3 / CloudFront
gulp.task('deploy', function () {
    var awspublish = require('gulp-awspublish');
    var aws = {
        "key": process.env.AWS_KEY,
        "secret": process.env.AWS_SECRET,
        "bucket": 'XXXXXXXX',
        "region": 'us-standard',
        "distributionId": 'XXXXXXXX'
    };
    var publisher = awspublish.create(aws);
    var headers = {
        'Cache-Control': 'max-age=315360000, no-transform, public'
    };

    return gulp.src('build/**')
        .pipe($.if('**/robots.txt', !argv.production ? $.replace('Disallow:', 'Disallow: /') : $.util.noop()))
        // Add a revisioned suffix to the filename for each static asset
        .pipe($.revAll({
            ignore: [
                /^\/apple-touch-icon-precomposed.png$/g,
                /^\/browserconfig.xml$/g,
                /^\/crossdomain.xml$/g,
                /^\/error.html$/g,
                /^\/humans.txt$/g,
                /^\/robots.txt$/g
            ]
        }))
        // Gzip, set Content-Encoding headers
        .pipe(awspublish.gzip())
        // Publisher will add Content-Length, Content-Type and headers specified above
        // If not specified it will set x-amz-acl to public-read by default
        .pipe(publisher.publish(headers))
        // Create a cache file to speed up consecutive uploads
        .pipe(publisher.cache())
        // Print upload updates to console
        .pipe(awspublish.reporter())
        // Updates the Default Root Object of a CloudFront distribution
        .pipe($.cloudfront(aws));
});

// Run PageSpeed Insights
// Update `url` below to the public URL for your site
gulp.task('pagespeed', pagespeed.bind(null, {
    // By default, we use the PageSpeed Insights free (no API key) tier.
    // You can use a Google Developer API key if you have one.
    // See http://goo.gl/RkN0vE for info key: 'YOUR_API_KEY'
    url: 'https://example.com',
    strategy: 'mobile'
}));
