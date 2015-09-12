// generated on 2015-09-05 using generator-gulp-webapp 1.0.3
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import runSequence from 'run-sequence';
import cp from 'child_process';

import source from 'vinyl-source-stream';
import babelify from 'babelify';
import browserify from 'browserify';

import compression from 'compression'; // for gzip compression for browserSync server


const clientDir = 'client';
const serverDir = 'server';
const devDir = '.tmp';
const buildDir = 'dist';

const src = {};

/**
 * This is the list of npm modules for production, that should be bundle into vendor.js instead of index.js
 */
const dependencies = [
  'underscore'
];

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

// bundle es6 client scripts
gulp.task('scripts:client', () => {
  return browserify([`${clientDir}/scripts/client.js`], {debug: true}) // debug: true adds inline source maps
    .external(dependencies)
    .transform(babelify)
    .bundle()
    .pipe(source('index.js')) // must have different name, to not overlap the same script from original source during dev and build
    .pipe(gulp.dest(`${devDir}/${clientDir}/scripts`));
});

// bundle vendor libs from npm
gulp.task('scripts:vendor:client', () => {
  return browserify()
    .require(dependencies)
    .bundle()
    .pipe(source('vendor.js'))
    .pipe($.streamify($.uglify({ mangle: false })))
    .pipe(gulp.dest(`${devDir}/${clientDir}/scripts`));
});

// compile server side scripts for dev mode
gulp.task('scripts:server:dev', function () {
  return gulp.src('server/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(`${devDir}/${serverDir}`));
});

//compile server side scripts for production
gulp.task('scripts:server:build', function () {
  return gulp.src('server/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(`${buildDir}/${serverDir}`));
});

gulp.task('styles', () => {
  return gulp.src(`${clientDir}/styles/*.scss`)
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['last 15 version']}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(`${devDir}/${clientDir}/styles`))
    .pipe(reload({stream: true}));
});

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe(reload({stream: true, once: true}))
      .pipe($.eslint(options))
      .pipe($.eslint.format())
      .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
  };
}
const testLintOptions = {
  env: {
    mocha: true
  }
};

gulp.task('lint', lint(`${clientDir}/scripts/**/*.js`));
gulp.task('lint:server', lint(`${serverDir}/**/*.js`));
gulp.task('lint:test', lint('test/spec/**/*.js', testLintOptions));

// prepare htmls for dev mode (to make them available for server side)
gulp.task('html:dev', () => {
  return gulp.src([
    `${clientDir}/**/*.html`
  ]).pipe(gulp.dest(`${devDir}/${clientDir}`))
});

// build html files from client (usually partials) using useref, and bundle all client resources (css, js).
gulp.task('html:build', ['styles', 'scripts:vendor:client', 'scripts:client'], () => {
  const assets = $.useref.assets({searchPath: [`${devDir}/${clientDir}`, `${clientDir}`, '.']});

  return gulp.src([`${clientDir}/*.html`])
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.minifyCss({compatibility: '*'})))
    .pipe($.rev())
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest(`${buildDir}/${clientDir}`));
});

gulp.task('images', () => {
  return gulp.src(`${clientDir}/images/**/*`)
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function (err) {
      console.log(err);
      this.end();
    })))
    .pipe(gulp.dest(`${buildDir}/${clientDir}/images`));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')({
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  }).concat(`${clientDir}/fonts/**/*`))
    .pipe(gulp.dest(`${devDir}/${clientDir}/fonts`))
    .pipe(gulp.dest(`${buildDir}/${clientDir}/fonts`));
});

gulp.task('extras:client:build', () => {
  return gulp.src([
    `${clientDir}/*.*`,
    `!${clientDir}/*.html`
  ], {
    dot: true
  }).pipe(gulp.dest(`${buildDir}/${clientDir}`));
});

// prepare everything except js from server side for dev mode
gulp.task('extras:server:dev', () => {
  return gulp.src([
    `${serverDir}/**/*.*`,
    `!${serverDir}/**/*.js`
  ], {
    dot: true
  }).pipe(gulp.dest(`${devDir}/${serverDir}`));
});

// build all except js from server side for production
gulp.task('extras:server:build', () => {
  return gulp.src([
    `${serverDir}/**/*.*`,
    `!${serverDir}/**/*.js`
  ], {
    dot: true
  }).pipe(gulp.dest(`${buildDir}/${serverDir}`));
});

// Launch a Node.js/Express server
gulp.task('express:dev', ['scripts:server:dev', 'extras:server:dev', 'html:dev'], (cb) => {
  src.server = [
    'bin/www',
    `${devDir}/${serverDir}/**/*`,
    `${devDir}/${clientDir}/**/*.html` // this is part of the server side in fact
  ];

  let started = false;

  var server = (function startup() {
    const newEnv = process.env;
    newEnv.NODE_ENV = 'development'; // Add DEVELOPER mode
    var child = cp.fork('bin/www', {
      env: newEnv
    });
    child.once('message', function(message) {
      if (message.match(/^online$/)) {
        if (browserSync) {
          browserSync.reload();
        }
        if (!started) {
          started = true;
          gulp.watch(src.server, function() {
            $.util.log('Restarting development server.');
            server.kill('SIGTERM');
            server = startup();
          });
          cb();
        }
      }
    });
    return child;
  })();

  process.on('exit', function() {
    server.kill('SIGTERM');
  });
});

// Launch BrowserSync development server
gulp.task('serve', ['styles', 'scripts:vendor:client', 'scripts:client', 'fonts', 'express:dev'], function(cb) {
  //var browserSync = require('browser-sync');

  browserSync({
    logPrefix: 'Sync',
    notify: false,
    // Run as an https by setting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    https: false,
    // Informs browser-sync to proxy our Express app which would run
    // at the following location
    proxy: {
      target: 'localhost:3000',
      middleware: compression()
    }
  }, cb);

  process.on('exit', function() {
    browserSync.exit();
  });

  gulp.watch([
    `${clientDir}/images/**/*`,
    `${devDir}/${clientDir}/fonts/**/*`
  ]).on('change', reload);

  gulp.watch(`${serverDir}/**/*.js`, ['scripts:server:dev']);
  gulp.watch([
    `${serverDir}/**/*`,
    `!${serverDir}/**/*.js`
  ], ['extras:server:dev']);
  gulp.watch(`${clientDir}/**/*.html`, ['html:dev']);

  gulp.watch(`${clientDir}/styles/**/*.scss`, ['styles']);
  gulp.watch(`${clientDir}/scripts/**/*.js`, ['scripts:client', reload]);
  gulp.watch(`${clientDir}/fonts/**/*`, ['fonts']);
});

gulp.task('serve:test', () => {
  browserSync({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('test/spec/**/*.js').on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

gulp.task('clean', del.bind(null, [`${devDir}`, `${buildDir}`]));

gulp.task('build', ['lint', 'lint:server', 'html:build', 'images', 'fonts', 'extras:client:build', 'scripts:server:build', 'extras:server:build'], () => {
  return gulp.src(`${buildDir}/${clientDir}/**/*`).pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});
