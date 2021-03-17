const gulp = require('gulp');
const cssnano = require('cssnano');
const stylus = require('gulp-stylus');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const banner = require('gulp-banner');
const pkg = require('./package.json');

const bannerTemplate =
  '/**!\n' +
  ' * <%= pkg.name %> <%= pkg.version %>\n' +
  ' * <%= pkg.description %>\n' +
  ' * <%= pkg.homepage %>\n' +
  ' *\n' +
  ' * Copyright © 2021-' +
  new Date().getFullYear() +
  ' <%= pkg.author.name %>\n' +
  '*/\n\n';

const plugins = [
  {
    reduceIdents: false,
    discardDuplicates: true,
    discardComments: {
      removeAll: true
    },
    autoprefixer: {
      add: true,
      cascade: false
    },
    zindex: false
  }
];

const build = () =>
  gulp
    .src('./src/style/styles.styl')
    .pipe(stylus({ 'include css': true, 'disable cache': true }))
    .pipe(rename('styles.css'))
    .pipe(sourcemaps.init())
    .pipe(postcss([cssnano(plugins)]))
    .pipe(
      banner(bannerTemplate, {
        pkg: pkg
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/'));

gulp.task('default', build);
