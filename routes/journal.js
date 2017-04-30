const express = require('express');
const router = express.Router();
const multer = require('multer');

const dbq = require('../helpers/dbQuery.js');
const conf = require('../helpers/conf.js');

router.use(multer({
  dest: './temp/',
  limits: {
    fileSize: 1505000000 //Max file size 1505MB
  },
  onFileSizeLimit: function(file) { //Delete partially written files that exceed the maximum file size
    console.log('Max file size exceeded!');
    fs.unlink('./' + file.path);
  }
}));

router.get('/upload', function(req, res, next) {
  res.send('Yeah, this is the right place.  Now try a POST!');
});

router.post('/upload', function(req, res, next) {
  if(req.body.password == conf.password){
    var muhFile = req.files.file;
    if(typeof muhFile === 'undefined') {
      res.send('No files was supplied;');
      return;
    }

    if(typeof req.body.dateOverride != 'undefined'){ //should be in format Wed, 09 Aug 1995 00:00:00 GMT
      var uploadDate = new Date(Date.parse(req.body.dateOverride));
    }else{
      var uploadDate = new Date(Date.now());
    }

    dbq.saveJournal(muhFile, uploadDate, req.body.encrypt, function(status){
      res.send(status);
    });
  }else{
    res.send('Invalid password!');
  }
});

module.exports = router;
