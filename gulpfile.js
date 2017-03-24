'use strict';

var fs = require('fs');
var gulp = require('gulp');
var sass = require('gulp-sass');
var bourbon = require('node-bourbon');
var sourcemaps = require('gulp-sourcemaps');
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var notify  = require('gulp-notify');
var uglify = require('gulp-uglify');
var ejs = require('gulp-ejs');
var gulpFilter = require('gulp-filter');
var bower = require('main-bower-files');
var concat = require("gulp-concat");
var less = require('gulp-less');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var browserSync = require('browser-sync');
var babel = require("gulp-babel");
var i18n = require("i18n");

var locales = ['en', 'ja'];

i18n.configure({
    locales: locales,
    directory: __dirname + '/locales'
});

gulp.task('browser-sync', function() {
  browserSync.init(null, {
    proxy: "localhost:80"
  });
});

gulp.task('browser-reload', function() {
  browserSync.reload();
});

gulp.task('imagemin', function() {
  gulp.src(['images/icons/**/*'])
        .pipe(gulp.dest('dest/images/icons'));
  gulp.src('images/*.png')
        .pipe(imagemin({
          progressive: true,
          use: [pngquant({quality: '60-80', speed: 1})]
        }))
        .pipe(gulp.dest('dest/images'));
  gulp.src(['images/**/*.jpg', 'images/**/*.svg', 'images/**/*.gif'])
        .pipe(imagemin())
        .pipe(gulp.dest('dest/images'));
});

gulp.task('sass', function(){
    gulp.src('sass/**/*.scss')
    .pipe(plumber({
      errorHandler: notify.onError("Sass error: <%= error.message %>")
    }))
    .pipe(sourcemaps.init())
    .pipe(sass({includePaths: bourbon.with('css')}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('css'));
});

gulp.task('bowerCSSpre', function() {
  var cssFilter = gulpFilter(['**/*.css', '!bower_components/font-awesome/**/*.css'], {restore: true});
  var lessFilter = gulpFilter('**/*.less', {restore: true});
  gulp.src(bower({
    paths: {
      bowerJson: 'bower.json'
    }
  }))
  .pipe(plumber({
    errorHandler: notify.onError("bowerCSS error: <%= error.message %>")
  }))
  .pipe(cssFilter)
  .pipe(rename({
    prefix: '_',
    extname: '.css'
  }))
  .pipe(gulp.dest('css'))
  .pipe(cssFilter.restore)
  .pipe(lessFilter)
  .pipe(less())
  .pipe(rename({
    prefix: '_',
    extname: '.css'
  }))
  .pipe(gulp.dest('css'))
  .pipe(lessFilter.restore);
});

gulp.task('bowerCSS', ['bowerCSSpre'] ,function() {
  gulp.src('css/_*.css')
  .pipe(concat('bundle.css'))
  .pipe(gulp.dest('css'));
});

gulp.task('bowerJS', function() {
  var jsFilter = gulpFilter(['**/*.js', '!bower_components/html5shiv/**/*.js'], {restore: true});
  gulp.src(['bower_components/jquery/dist/jquery.js'].concat(bower({
    paths: {
      bowerJson: 'bower.json'
    }
  })))
  .pipe(plumber({
    errorHandler: notify.onError("bowerJS error: <%= error.message %>")
  }))
  .pipe(jsFilter)
  .pipe(concat('bundle.js'))
  .pipe(gulp.dest('js'))
  .pipe(jsFilter.restore);
});

gulp.task('bower', ['bowerCSS', 'bowerJS']);

gulp.task('fonts', function() {
  gulp.src(['bower_components/font-awesome/fonts/**/*', 'fonts/**/*'])
  .pipe(gulp.dest('dest/fonts'))
});

gulp.task('cssmin', ['sass', 'bowerCSS'], function () {
  gulp.src(['css/*.css', '!' + 'css/_*.css'])
  .pipe(plumber({
    errorHandler: notify.onError("css-minify error: <%= error.message %>")
  }))
  .pipe(cssmin())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('dest/css'));
});

gulp.task('jsmin', () => {
    gulp.src(['js/**/*.js', '!' + 'js/**/_*.js'])
    .pipe(plumber({
      errorHandler: notify.onError("js-babelify and minify error: <%= error.message %>")
    }))
    .pipe(babel({
            presets: ['es2015']
        }))
    .pipe(uglify({preserveComments: 'some'}))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('dest/js'));
});

gulp.task('ejs', () => {
    const HISTORY = JSON.parse(fs.readFileSync('yamax/history.json', 'utf8'));
    const srcs = ['**/*.ejs', '!' + '**/_*.ejs', '!' + 'alllang/**/*.ejs', '!' + 'node_modules/**/*.ejs'];
    let config = {
      history: HISTORY,
      t: (msg) => {
        return i18n.__(msg);
      },
      locale: ""
    };

    (function ep(index){
      new Promise(function(resolve, reject) {
        config.locale = locales[index];
        i18n.setLocale(locales[index]);
        gulp.src(srcs)
        .pipe(ejs(config, {"ext": ".php"})).on('error', (m) => {
          notify.onError("ejs error: <%= m %>");
        })
        .pipe(gulp.dest(`dest/${locales[index]}`))
        .on('end', resolve);
      }).then(() => {
        if(index+1 < locales.length)
          ep(index+1);
      });
    }(0));
});

gulp.task('alllang', function() {
  gulp.src(['alllang/**/*.ejs', '!' + 'alllang/**/_*.ejs'])
  .pipe(ejs({}, {"ext": ".php"}))
  .pipe(gulp.dest('dest'));
});

gulp.task('process', ['sass', 'cssmin', 'jsmin', 'fonts', 'ejs', 'alllang']);

gulp.task('watch' ,['browser-sync'] ,function(){
    gulp.watch('sass/**/*.scss', ['sass']);
    gulp.watch(['css/**/*.css', '!' + 'css/**/_*.css'], ['cssmin']);
    gulp.watch(['js/**/*.js', '!' + 'js/**/_*.js'], ['jsmin']);
    gulp.watch(['**/*.ejs', '!' + 'node_modules/**/*.ejs','!' + 'alllang/**/*.ejs', 'locales/*.json'], ['ejs']);
    gulp.watch(['alllang/**/*.ejs', '!' + 'alllang/**/_*.ejs'], ['alllang']);
    gulp.watch(['fonts/**/*', 'bower_components/font-awesome/fonts/**/*'], ['fonts']);
    gulp.watch('bower.json', ['bower']);
    gulp.watch('dest/**/*', ['browser-reload']);
});

gulp.task('default', ['process', 'watch']);
