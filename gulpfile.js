var util = require('util');
var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var stylish = require('gulp-jscs-stylish');
var argv = require('yargs').argv;
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');

var allFiles = ['src/**/*.js', 'gulpfile.js', 'test/**/*.js'];
var testFiles = ['test/**/*-test.js'];

gulp.task('staticAnalysis', ['lint', 'jscs']);

gulp.task('lint', function() {
    return gulp.src(allFiles)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('jscs', function() {
    return gulp.src(allFiles)
        .pipe(jscs())
        .on('error', gulpUtil.noop)
        .pipe(stylish.combineWithHintResults())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('fixjscs', function() {
    var fs = require('fs');
    var tmp = JSON.parse(fs.readFileSync('./.jscsrc', 'utf8'));
    console.log('tmp -> ' + require('util').inspect(tmp, {depth: null, colors: true}));
    tmp.fix = true;
    return gulp.src(allFiles, {base: './'})
        .pipe(jscs(tmp))
        .pipe(gulp.dest('./'));
});

gulp.task('unitTest', function() {
    if (argv.testGrep === undefined) {
        console.log('To limit number tests run you can specify gulp unitTest --testGrep [limiter]');
    }

    return gulp.src(testFiles)
            .pipe(mocha({
                reporter: 'spec',
                ui: 'bdd',
                timeout: 10000,
                grep: (argv.testGrep !== undefined) ? argv.testGrep : ''
            }))
            .once('error', function() {
                // gehred added this console log, because when there is a runtime error the tests
                // just abort at that spot. It is nice to get information. The whole handler was added
                // because examples of using mocha in gulp said that when mocha does not close correctly
                // on timeouts the gulp task would never end.

                console.log('Error Information -> ' + util.inspect(arguments, {depth: 2, colors: true}));
                process.exit(1);
            });
});

gulp.task('utestcov', function(cb) {
    var coverageDirectory = './coverage';
    gulp.src('src/**/*.js')
      .pipe(istanbul({'includeUntested': true})) // Covering files
      .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function() {
        gulp.src(testFiles)
          .pipe(mocha())
          .pipe(istanbul.writeReports({dir: coverageDirectory})) // Creating the reports after tests ran
          .on('end', cb);
    });
});
