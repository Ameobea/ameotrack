var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var hasher = require('hash-files');

var dbq = require('../helpers/dbQuery.js');

router.use(multer({
  dest: './uploads/',
  limits: {
    fileSize: 15050000000 //Max file size 15,050MB
  },
  onFileSizeLimit: function(file) { //Delete partially written files that exceed the maximum file size
    console.log('Max file size exceeded!');
    fs.unlink('./' + file.path);
  }
}));

router.get('/', function(req, res, next) {
  res.render("manual-upload");
});

router.post('/', function(req, res) {
  var muhFile = req.files.file;
  if(typeof muhFile === 'undefined') {
    res.send('No file was supplied;');
    return;
  }
  var spl = req.files.file.name.split('.');
  hasher({files: ['./uploads/'.concat(muhFile.name)]}, function(error, hash) {
    var expiry = req.body.expiry;
    if(typeof expiry === 'undefined') {
      expiry = -1;
    }
    if(req.body.oneTime){
      dbq.doOneViewFileUpload(spl[1], hash, expiry, muhFile.size, req.body.password, function(shortName, path){
        if(shortName !== 'Invalid password!' && typeof shortName !== 'undefined'){
          fs.rename('./uploads/'.concat(muhFile.name), path, function(err){
            if(err){
              console.log('error renaming file!');
              console.log(err);
            }
          });
        }
        res.send('https://ameo.link/u/ot/'.concat(shortName));
      })
    }else if(req.body.secret){
      dbq.doSecretFileUpload(spl[1], hash, expiry, muhFile.size, req.body.password, function(shortName, path){
        if(shortName !== 'Invalid password!' && typeof shortName !== 'undefined'){
          fs.rename('./uploads/'.concat(muhFile.name), path, function(err){
            if(err){
              console.log('error renaming file!');
              console.log(err);
            }
          });
        }
        res.send('https://ameo.link/u/'.concat(shortName));
      })
    }else{
      dbq.doFileUpload(spl[1], hash, expiry, muhFile.size, req.body.password, function(shortName, path){
        if(shortName !== 'Invalid password!' && typeof shortName !== 'undefined'){
          fs.rename('./uploads/'.concat(muhFile.name), path, function(err){
            if(err){
              console.log('error renaming file!');
              console.log(err);
            }
          });
        }
        res.send('https://ameo.link/u/'.concat(shortName));
      });
    }
  });
});

module.exports = router;
