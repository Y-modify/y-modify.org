'use strict';

const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const sass = require('gulp-sass');
const bourbon = require('node-bourbon');
const sourcemaps = require('gulp-sourcemaps');
const cssmin = require('gulp-cssmin');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const notify  = require('gulp-notify');
const uglify = require('gulp-uglify');
const ejs = require('gulp-ejs');
const gulpFilter = require('gulp-filter');
const bower = require('main-bower-files');
const concat = require("gulp-concat");
const less = require('gulp-less');
const imagemin = require('gulp-imagemin');
const imageResize = require('gulp-image-resize');
const browserSync = require('browser-sync').create();
const pngquant = require('imagemin-pngquant');
const mozjpeg = require('imagemin-mozjpeg');
const babel = require("gulp-babel");
const i18n = require("i18n");
const runSequence = require('run-sequence');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const rimraf = require('rimraf');
const autoprefixer = require('gulp-autoprefixer');
const sitemap = require('gulp-sitemap');
const ftp = require('vinyl-ftp');

const distPath = "dest/";
const baseURL = "www.y-modify.org";
const protocol = "https";

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
  gulp.src(['images/**/*.jpg', 'images/**/*.png'])
    .pipe(imageResize({
      width : 1200,
      height : 1000,
    }))
    .pipe(imagemin([
         pngquant({
           quality: '80-90',
           speed: 1,
           floyd: 0
         }),
         mozjpeg({
           quality: 80,
           progressive: true
         }),
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
    t: msg => i18n.__(msg),
    locale: "",
    locales: locales,
    baseURL: baseURL,
    twitter: "@ymodify314",
    sitename: "Y-modify",
    enbanner: false,
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

gulp.task('sitemap', ()=>{
  return gulp.src(locales.id.map((element)=>distPath+element+"/**/*.php").concat(["!"+distPath+"**/error/**/*.php"]), {
        read: false
    })
    .pipe(sitemap({
        siteUrl: protocol+'://'+baseURL
    }))
    .pipe(gulp.dest(distPath));
});

gulp.task('imagecopy', function() {
  return gulp.src(['images/**/*', '!images/**/*.jpg'])
  .pipe(gulp.dest(distPath+'/images'));
});

gulp.task('deploy', () => {
  let config = JSON.parse(fs.readFileSync("ftp.json", 'utf8'));
  config.log = console.log;

  // デプロイ先ディレクトリ
  let remoteDest = '/home/y-modify/www/';

  let conn = ftp.create(config);
  return gulp.src([distPath+'**/*','!'+distPath+'**/.DS_Store'], {buffer: false, dot: true})
    .pipe(conn.newerOrDifferentSize(remoteDest))
    .pipe(conn.dest(remoteDest));
});

gulp.task('clean', function (cb) {
  rimraf(distPath, cb);
});

gulp.task('process', ['fonts', 'imagecopy', 'imagemin', 'sass', 'js', 'ejs', 'alllang']);

gulp.task('watch' , function(){
    gulp.watch('sass/**/*.scss', ['sass']);
    gulp.watch(['js/**/*.js', '!' + 'js/**/_*.js'], ['js']);
    gulp.watch(['**/*.ejs', '!' + 'node_modules/**/*.ejs','!' + 'alllang/**/*.ejs', 'locales/*.json'], ['ejs']);
    gulp.watch(['alllang/**/*.ejs', '!' + 'alllang/**/_*.ejs'], ['alllang']);
    gulp.watch(['fonts/**/*', 'bower_components/font-awesome/fonts/**/*'], ['fonts']);
    gulp.watch(['images/**/*'], ['imagecopy']);
    gulp.watch(distPath+'/**/*', ['browser-reload']);
});

gulp.task('default', ['process']);
