'use strict';

let fs = require('fs');
let path = require('path');
let gulp = require('gulp');
let sass = require('gulp-sass');
let bourbon = require('node-bourbon');
let sourcemaps = require('gulp-sourcemaps');
let cssmin = require('gulp-cssmin');
let rename = require('gulp-rename');
let plumber = require('gulp-plumber');
let notify  = require('gulp-notify');
let uglify = require('gulp-uglify');
let ejs = require('gulp-ejs');
let gulpFilter = require('gulp-filter');
let bower = require('main-bower-files');
let concat = require("gulp-concat");
let less = require('gulp-less');
let imagemin = require('gulp-imagemin');
let browserSync = require('browser-sync').create();
let pngquant = require('imagemin-pngquant');
let mozjpeg = require('imagemin-mozjpeg');
let babel = require("gulp-babel");
let i18n = require("i18n");
let runSequence = require('run-sequence');
let browserify = require('browserify');
let babelify = require('babelify');
let source = require('vinyl-source-stream');
let buffer = require('vinyl-buffer');
let rimraf = require('rimraf');
let autoprefixer = require('gulp-autoprefixer');

const distPath = "dest/";
const baseURL = "www.y-modify.org";
const protocol = "http";

const locales = {
  id: ['en', 'ja'],
  name: ['English', '日本語']
};

i18n.configure({
    locales: locales.id,
    directory: __dirname + '/locales'
});

gulp.task('browser-sync', function() {
  browserSync.init({
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
    .pipe(gulp.dest(distPath+'/images'));
});

gulp.task('sass', function(){
  return gulp.src('sass/style.scss')
  .pipe(plumber({
    errorHandler: notify.onError("Sass error: <%= error.message %>")
  }))
  .pipe(sourcemaps.init())
  .pipe(sass({includePaths: bourbon.with('css')}))
  .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
  .pipe(sourcemaps.write())
  .pipe(cssmin())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest(distPath+'/css'));
});

gulp.task('fonts', function() {
  return gulp.src(['bower_components/font-awesome/fonts/**/*', 'fonts/**/*'])
  .pipe(gulp.dest(distPath+'/fonts'))
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
    .pipe(gulp.dest(distPath+'/js'));
});

gulp.task('ejs', () => {
  const HISTORY = JSON.parse(fs.readFileSync('yamax/history.json', 'utf8'));
  const srcs = ['**/*.ejs', '!' + 'dest/**/*.ejs', '!' + '**/_*.ejs', '!' + 'alllang/**/*.ejs', '!' + 'node_modules/**/*.ejs'];
  let config = {
    history: HISTORY,
    t: (msg) => {
      return i18n.__(msg);
    },
    locale: "",
    locales: locales,
    baseURL: baseURL,
    twitter: "@ymodify314",
    sitename: "Y-modify",
    bannerURL: "",//`http://blog.y-modify.org/${locales.id[index]}2017/03/02/10000views/`,
    bannerMessage: "banner-thanks",
    protocol: protocol,
    absolutePath: (filename) => {
      return filename.split(path.basename(__dirname))[filename.split(path.basename(__dirname)).length - 1].replace('.ejs','.php').replace('index.php', '');
    },
    relativePath: (absPath) => {
      return '../'.repeat([absPath.split('/').length - 2]);
    }
  };

  (function ep(index){
    new Promise(function(resolve, reject) {
      console.log(`${locales.name[index]}'s translation has started`);
      config.locale = locales.id[index];
      config.bannerURL = `http://blog.y-modify.org/${locales.id[index]}/2017/03/02/10000views/`;
      i18n.setLocale(locales.id[index]);
      gulp.src(srcs)
      .pipe(ejs(config, {"ext": ".php"})).on('error', (m) => {
        console.log(m);
        notify.onError("ejs error: <%= m %>");
        reject();
      })
      .pipe(gulp.dest(`${distPath}/${locales.id[index]}`))
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

gulp.task('alllang:ejs', function() {
  return gulp.src(['alllang/**/*.ejs', '!' + 'alllang/**/_*.ejs'])
  .pipe(ejs({
              locale: "en",
              baseURL: baseURL,
              twitter: "@ymodify314",
              sitename: "Y-modify",
              locales: locales,
              protocol: protocol,
              absolutePath: (filename) => {
                return filename.split(path.basename(__dirname))[filename.split(path.basename(__dirname)).length - 1].replace('.ejs','.php').replace('index.php', '');
              },
              relativePath: (absPath) => {
                return '../'.repeat([absPath.split('/').length - 2]);
              }
            }, {"ext": ".php"}))
  .pipe(gulp.dest(distPath));
});

gulp.task('alllang:all', () => {
  return gulp.src(['alllang/**/*', 'alllang/**/.*', '!' + 'alllang/**/*.ejs'])
  .pipe(gulp.dest(distPath));
});

gulp.task('alllang', ['alllang:ejs', 'alllang:all']);

gulp.task('imagecopy', function() {
  return gulp.src(['images/**/*'])
  .pipe(gulp.dest(distPath+'/images'));
});

gulp.task('clean', function (cb) {
  rimraf(distPath, cb);
});

gulp.task('process', ['fonts', 'imagemin', 'sass', 'js', 'ejs', 'alllang']);

gulp.task('watch' ,['browser-sync'] ,function(){
    gulp.watch('sass/**/*.scss', ['sass']);
    gulp.watch(['js/**/*.js', '!' + 'js/**/_*.js'], ['js']);
    gulp.watch(['**/*.ejs', '!' + 'node_modules/**/*.ejs','!' + 'alllang/**/*.ejs', 'locales/*.json'], ['ejs']);
    gulp.watch(['alllang/**/*.ejs', '!' + 'alllang/**/_*.ejs'], ['alllang']);
    gulp.watch(['fonts/**/*', 'bower_components/font-awesome/fonts/**/*'], ['fonts']);
    gulp.watch(['images/**/*'], ['imagecopy']);
    gulp.watch(distPath+'/**/*', ['browser-reload']);
});

gulp.task('default', ['process']);
