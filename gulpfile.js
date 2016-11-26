const gulp = require('gulp')
    , sass = require('gulp-sass')
    , csso = require('gulp-csso')
    , gutil = require('gulp-util')
    , merge = require('merge-stream')
    , clean  = require('gulp-clean')
    , rigger = require('gulp-rigger')
    , concat = require('gulp-concat')
    , notify = require('gulp-notify')
    , rename = require("gulp-rename")
    , uglify = require('gulp-uglify')
    , connect = require('gulp-connect')
    , ghPages = require('gulp-gh-pages')
    , imagemin = require('gulp-imagemin')
    , sourcemaps = require('gulp-sourcemaps')
    , minifyHTML = require('gulp-minify-html')
    , spritesmith = require('gulp.spritesmith')
    , autoprefixer = require('gulp-autoprefixer')
    , browserSync = require('browser-sync').create()
    ;

gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "./"
        },
        port: "7777"
    });

    gulp.watch(['./**/*.html']).on('change', browserSync.reload);
    gulp.watch('./js/**/*.js').on('change', browserSync.reload);

    gulp.watch([
        './templates/**/*.html', 
        '!./templates/examples/*', 
        './pages/**/*.tmpl.html'
    ], ['template']);

    gulp.watch('./sass/**/*', ['sass']);
});

gulp.task('sass', function () {
    gulp.src(['./sass/**/*.scss', './sass/**/*.sass'])
        .pipe(sourcemaps.init())
        .pipe(
            sass({
                outputStyle: 'expanded'
            })
            .on('error', gutil.log)
        )
        .on('error', notify.onError())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./css/'))
        .pipe(browserSync.stream());
});

gulp.task('template', function () {
    gulp.src('./pages/**/*.tmpl.html')
        .pipe(rigger().on('error', gutil.log))
        .on('error', notify.onError())
        .pipe(rename(function (path) {
            path.basename = path.basename.split('.')[0];
            path.extname = ".html"
        }).on('error', gutil.log))
        .pipe(gulp.dest('pages/'))
});

// compress svg, png, jpeg
gulp.task('minify:img', function () {
    return gulp.src(['./images/**/*', '!./images/sprite/*'])
        .pipe(imagemin().on('error', gutil.log))
        .pipe(gulp.dest('./public/images/'));
});

gulp.task('minify:css', function () {
    gulp.src('./css/**/*.css')
        .pipe(autoprefixer({
            browsers: ['last 30 versions'],
            cascade: false
        }))
        .pipe(csso())
        .pipe(gulp.dest('./public/css/'));
});

gulp.task('minify:js', function () {
    gulp.src('./js/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('./public/js/'));
});

gulp.task('minify:html', function () {
    var opts = {
        conditionals: true,
        spare: true
    };

    gulp.src(['./index.html'])
        .pipe(minifyHTML(opts))
        .pipe(gulp.dest('./public/'));

    return gulp.src(['./pages/**/*.html', '!./**/*.tmpl.html'])
        .pipe(minifyHTML(opts))
        .pipe(gulp.dest('./public/pages/'));
});

//видалити папку public
gulp.task('clean', function() {
    return gulp.src('./public', { read: false }).pipe(clean());
});

gulp.task('sprite', function () {
    var spriteData = gulp.src('images/sprite/*.png').pipe(
        spritesmith({
            imgName: 'sprite.png',
            cssName: '_icon-mixin.scss',
            retinaImgName: 'sprite@2x.png',
            retinaSrcFilter: ['images/sprite/*@2x.png'],
            cssVarMap: function (sprite) {
                sprite.name = 'icon-' + sprite.name;
            }
        })
    );

    var imgStream = spriteData.img.pipe(gulp.dest('images/'));
    var cssStream = spriteData.css.pipe(gulp.dest('sass/'));

    return merge(imgStream, cssStream);
});

// публікація на gh-pages
gulp.task('deploy', function() {
    return gulp.src('./public/**/*').pipe(ghPages());
});

gulp.task('default', ['server', 'sass', 'template']);
gulp.task('production', ['minify:html', 'minify:css', 'minify:js', 'minify:img']);
