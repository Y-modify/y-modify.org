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
var mozjpeg = require('imagemin-mozjpeg');
var babel = require("gulp-babel");
var i18n = require("i18n");
var runSequence = require('run-sequence');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var locales = {
  id: ['en', 'ja'],
  name: ['English', '日本語']
};

i18n.configure({
    locales: locales.id,
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
  gulp.src('images/**/*')
    .pipe(imagemin([
         pngquant({
           quality: '65-80',
           speed: 1,
           floyd: 0
         }),
         mozjpeg({
           quality: 85,
           progressive: true
         }),
         imagemin.svgo(),
         imagemin.optipng(),
         imagemin.gifsicle()
       ]
    ))
    .pipe(gulp.dest('dest/images'));
});

gulp.task('sass', function(){
  return gulp.src('sass/style.scss')
  .pipe(plumber({
    errorHandler: notify.onError("Sass error: <%= error.message %>")
  }))
  .pipe(sourcemaps.init())
  .pipe(sass({includePaths: bourbon.with('css')}))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('css'));
});

gulp.task('fonts', function() {
  return gulp.src(['bower_components/font-awesome/fonts/**/*', 'fonts/**/*'])
  .pipe(gulp.dest('dest/fonts'))
});

gulp.task('cssmin', function () {
  return gulp.src(['css/*.css', '!' + 'css/_*.css'])
  .pipe(plumber({
    errorHandler: notify.onError("css-minify error: <%= error.message %>")
  }))
  .pipe(cssmin())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('dest/css'));
});

gulp.task('css', () => {
  return runSequence(
    'sass',
    'cssmin'
  );
});

gulp.task('js', () => {
  return browserify('js/script.js', { debug: true })
    .transform("debowerify")
    .transform("babelify", {
      presets: ["es2015"],
      compact: false
    })
    .on("error", function (err) { notify.onError("js-babelify error: <%= err.message %>") })
    .bundle()
    .pipe(source('script.js'))
    .pipe(buffer())
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
    locale: "",
    locales: locales
  };

  (function ep(index){
    new Promise(function(resolve, reject) {
      console.log(`${locales.name[index]}'s translation has started`);
      config.locale = locales.id[index];
      i18n.setLocale(locales.id[index]);
      gulp.src(srcs)
      .pipe(ejs(config, {"ext": ".php"})).on('error', (m) => {
        console.log(m);
        notify.onError("ejs error: <%= m %>");
        reject();
      })
      .pipe(gulp.dest(`dest/${locales.id[index]}`))
      .on('end', () => {
        resolve();
        console.log(`${locales.name[index]}'s translation has done`);
      });
    }).then(() => {
      if(index+1 < locales.id.length)
        ep(index+1);
    });
  }(0));
});

gulp.task('alllang', function() {
  return gulp.src(['alllang/**/*.ejs', '!' + 'alllang/**/_*.ejs'])
  .pipe(ejs({
              locale: "en",
              locales: locales
            }, {"ext": ".php"}))
  .pipe(gulp.dest('dest'));
});

gulp.task('imagecopy', function() {
  return gulp.src(['images/**/*'])
  .pipe(gulp.dest('dest/images'));
});

gulp.task('process', ['fonts', 'imagecopy', 'css', 'js', 'ejs', 'alllang']);

gulp.task('watch' ,['browser-sync'] ,function(){
    gulp.watch('sass/**/*.scss', ['css']);
    gulp.watch(['js/**/*.js', '!' + 'js/**/_*.js'], ['js']);
    gulp.watch(['**/*.ejs', '!' + 'node_modules/**/*.ejs','!' + 'alllang/**/*.ejs', 'locales/*.json'], ['ejs']);
    gulp.watch(['alllang/**/*.ejs', '!' + 'alllang/**/_*.ejs'], ['alllang']);
    gulp.watch(['fonts/**/*', 'bower_components/font-awesome/fonts/**/*'], ['fonts']);
    gulp.watch(['images/**/*'], ['imagecopy']);
    gulp.watch('dest/**/*', ['browser-reload']);
});

gulp.task('default', ['process', 'watch']);
