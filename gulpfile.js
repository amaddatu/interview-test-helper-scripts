// This configuration is OPTIONAL

// in order to use this file
// both gulp and gulp-sass and node-sass must be install globally
// "npm install -g node-sass gulp gulp-cli"
// type "gulp default" into the terminal
// CTRL + C / CMD + C to cancel

//please note that this configuration has to be restarted periodically due to bugs
//it doesn't always stop because your code is wrong. (It will simply crash due to race conditions with file locks.)
//simply restart if it does crash

// Rsync configuration
var gulp = require('gulp');
var rsync = require('gulp-rsync');
var wait = require('gulp-wait');
var fs = require('fs');
var path = require('path');

var localWebRoot = '../web';

// will not delete files
var rsyncFunction = function() { 
    return new Promise(function(resolve, reject) {
        console.log("got here");
        gulp.src(localWebRoot)
            .pipe(wait(500))
            .pipe(rsync({
                root: localWebRoot,
                destination: '~/web',
                username: 'magento',
                port: 6022,
                hostname: 'localhost',
                progress: true,
                incremental: true,
                recursive: true,
                clean: false,
                update: true,
                times: true,
                exclude: '.git/'
            }))
            .on('error', function(e){
                console.log(e);
                console.log("Caught Error");
                resolve();
            })
            .pipe(resolve());
    });
};

gulp.task('rsync', rsyncFunction);

gulp.task('watchAll', gulp.series(rsyncFunction, function(done) {
    gulp.watch([localWebRoot])
        .on('change', gulp.series(function(event, path){
            console.log("change");
            rsyncFunction().then(function(){
                console.log("done");
            });
        }))
        .on('unlink', gulp.series(function(event, path){
            console.log("unlink");
            rsyncFunction().then(function(){
                console.log("done");
            });
        }))
        .on('add', gulp.series(function(event, path){
            console.log("add");
            rsyncFunction().then(function(){
                console.log("done");
            });
        }));
}));

var rsyncWait = function(){
    return new Promise(function(resolve, reject){
        //using node_modules to ensure that the source directory is not locked
        gulp.src('node_modules')
            .pipe(wait(2000))
            .on('error', function(e){
                console.log(e);
                console.log("Caught Error");
                resolve();
            })
            .pipe(resolve());
    });
}

var rsyncWait2 = function(){
    //using node_modules to ensure that the source directory is not locked
    return gulp.src('node_modules')
        .pipe(wait(500))
        .on('error', function(e){
            console.log(e);
            console.log("Caught Error");
        });
}

var vendorFolder = localWebRoot + '/app/code/Amaddatu';
var destVendorFolder = vendorFolder;
destVendorFolder = destVendorFolder.replace(/^[(../)]+|[(../)]+$/gm, '');
destVendorFolder = '~/' + destVendorFolder;

// will delete files
var rsyncModuleFunction = function() { 
    return new Promise(function(resolve, reject) {
        
        gulp.src(vendorFolder)
            .pipe(wait(3000))
            .pipe(rsync({
                root: vendorFolder,
                destination: destVendorFolder,
                username: 'magento',
                port: 6022,
                hostname: 'localhost',
                progress: true,
                incremental: true,
                recursive: true,
                clean: true, //WILL DELETE FILES
                update: true,
                times: true,
                exclude: '.git/'
            }))
            .on('error', function(e){
                console.log(e);
                console.log("Caught Error");
                resolve();
            })
            .pipe(function(){
                resolve();
            }());
    });
};

var rsyncModuleFunction2 = function() { 
    return gulp.src(vendorFolder)
        .pipe(wait(1000))
        .pipe(rsync({
            root: vendorFolder,
            destination: destVendorFolder,
            username: 'magento',
            port: 6022,
            hostname: 'localhost',
            progress: true,
            incremental: true,
            recursive: true,
            clean: true, //WILL DELETE FILES
            update: true,
            times: true,
            exclude: '.git/'
        }))
        .on('error', function(e){
            console.log(e);
            console.log("Caught Error");
        });
};

gulp.task('rsyncModule', rsyncModuleFunction);

var listMyFilesStatsHelper = function(filepath, list_of_files, depth){
    return new Promise(function(resolve, reject) {
        fs.stat(filepath, function(err, stats){
            if(err){
                reject(err);
            }
            if(stats.isFile()){
                list_of_files.push(filepath);
                resolve(list_of_files);
            }
            else if(stats.isDirectory()){
                if(depth > 0){
                    listMyFiles(filepath, list_of_files, depth - 1)
                    .then( list_of_files => {
                        resolve(list_of_files);
                    });
                }
                else if(depth === 0){
                    list_of_files.push(filepath);
                    resolve(list_of_files);
                }
                else{
                    resolve(list_of_files);
                }
            }
            else{
                resolve(list_of_files);
            }
        });
    });
};
var recursiveFileLooper = function(files, startFolder, list_of_files, depth){
    return new Promise(function(resolve, reject){
        if(files.length <= 0){
            resolve(list_of_files);
        }
        var file = files.pop();
        var filepath = path.join(startFolder, file);
        if(file === '.git'){
            console.log("Found .git folder... skipping");
            recursiveFileLooper(files, startFolder, list_of_files, depth)
            .then( list_of_files => {
                resolve(list_of_files);
            });
        }
        else{
            console.log(filepath);
            listMyFilesStatsHelper(filepath, list_of_files, depth)
            .then( list_of_files => {
                return recursiveFileLooper(files, startFolder, list_of_files, depth);
            })
            .then( list_of_files => {
                resolve(list_of_files);
            });
        }
    });
};

var listMyFiles = function(startFolder, list_of_files, depth){

    return new Promise(function(resolve, reject) {
        fs.readdir(startFolder, (err, files) => {
            if(err){
                reject(err);
            }
            recursiveFileLooper(files, startFolder, list_of_files, depth)
            .then( list_of_files => {
                resolve(list_of_files);
            });
        });
    });
};

gulp.task('default', gulp.series(rsyncModuleFunction, function(done) {
    // defaultFailSafe()
    // .then( () => {
    //     done();
    // });
    // this will contain a list of level 1 directories and all level 0 and 1 files
    var list_of_files = [];
    listMyFiles(vendorFolder, list_of_files, 1)
    .then( list_of_files => {
        console.log(list_of_files);
        gulp.watch(list_of_files)
            .on('change', gulp.series(rsyncWait2, function(event, path){
                console.log("change");
                return rsyncModuleFunction2();
            }))
            // .on('unlink', gulp.series(rsyncWait2, function(event, path){
            //     console.log("unlink");
            //     return rsyncModuleFunction2();
            // }))
            .on('add', gulp.series(rsyncWait2, function(event, path){
                console.log("add");
                return rsyncModuleFunction2();
            }));
    });

    
}));
