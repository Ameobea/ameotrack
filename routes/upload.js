const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const hasher = require('hash-files');

const dbq = require('../helpers/dbQuery.js');

router.use(
  multer({
    dest: './uploads/',
    limits: {
      fileSize: 2e10, // Max file size 20GB
    },
    onFileSizeLimit: function(file) {
      // Delete partially written files that exceed the maximum file size
      console.log('Max file size exceeded!');
      fs.unlink('./' + file.path);
    },
  })
);

router.get('/', function(req, res, next) {
  res.render('manual-upload');
});

router.post('/', function(req, res) {
  var muhFile = req.files.file;
  if (typeof muhFile === 'undefined') {
    res.send('No file was supplied;');
    return;
  }
  var spl = req.files.file.name.split('.');
  hasher({ files: ['./uploads/'.concat(muhFile.name)] }, function(error, hash) {
    var expiry = req.body.expiry;
    var source = req.body.source || 'manual';
    if (typeof expiry === 'undefined') {
      expiry = -1;
    }
    if (req.body.oneTime) {
      dbq.doOneViewFileUpload(
        spl[1],
        hash,
        expiry,
        muhFile.size,
        req.body.password,
        source,
        function(shortName, path) {
          if (
            shortName !== 'Invalid password!' &&
            typeof shortName !== 'undefined'
          ) {
            fs.rename('./uploads/'.concat(muhFile.name), path, function(err) {
              if (err) {
                console.log('error renaming file!');
                console.log(err);
              }
            });
          }
          res.send('https://ameo.link/u/ot/'.concat(shortName));
        }
      );
    } else if (req.body.secret) {
      dbq.doSecretFileUpload(
        spl[1],
        hash,
        expiry,
        muhFile.size,
        req.body.password,
        source,
        function(shortName, path) {
          if (
            shortName !== 'Invalid password!' &&
            typeof shortName !== 'undefined'
          ) {
            fs.rename('./uploads/'.concat(muhFile.name), path, function(err) {
              if (err) {
                console.log('error renaming file!');
                console.log(err);
              }
            });
          }
          res.send('https://ameo.link/u/'.concat(shortName));
        }
      );
    } else {
      dbq.doFileUpload(
        spl[1],
        hash,
        expiry,
        muhFile.size,
        req.body.password,
        source,
        function(shortName, path) {
          if (
            shortName !== 'Invalid password!' &&
            typeof shortName !== 'undefined'
          ) {
            fs.rename('./uploads/'.concat(muhFile.name), path, function(err) {
              if (err) {
                console.log('error renaming file!');
                console.log(err);
              }
            });
          }
          res.send('https://ameo.link/u/'.concat(shortName));
        }
      );
    }
  });
});

module.exports = router;
