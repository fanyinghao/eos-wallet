#!/usr/bin/env node
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');

function getBranch() {
  return new Promise(function(fulfill, reject) {
    exec("git branch | grep '*'", function(err, stdout, stderr) {
      if (err) reject(err);
      var name = stdout.replace('* ', '').replace('\n', '');
      fulfill(name);
    });
  });
}

function getCommit() {
  return new Promise(function(fulfill, reject) {
    exec('git rev-parse HEAD', function(err, stdout, stderr) {
      if (err) reject(err);
      var commitName = stdout.replace('* ', '').replace('\n', '');
      fulfill(commitName);
    });
  });
}

var result = {};
console.log('path : ' + __dirname);

getBranch()
  .then(function(_branch) {
    result.branch = _branch;
  })
  .then(getCommit)
  .then(function(_commit) {
    result.commit = _commit;
  })
  .then(function() {
    var fileContent = JSON.stringify(result, null, 2);
    console.log(fileContent);

    var pathToFile = __dirname + '/../private/version.json';
    console.log('path normalized: ' + path.normalize(pathToFile));
    if (fs.existsSync(pathToFile)) {
      fs.writeFile(pathToFile, fileContent, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('The file was saved!');
        }
      });
    } else {
      console.log('Cannot find file : ' + pathToFile);
    }
  });
