const fs = require('fs');

const express = require('express');
const router = express.Router();
const multer = require('multer');

const dbq = require('../helpers/dbQuery.js');
const conf = require('../helpers/conf.js');

router.use(
  multer({
    dest: './temp/',
    limits: {
      fileSize: 1505000000, //Max file size 1505MB
    },
    onFileSizeLimit: file => {
      //Delete partially written files that exceed the maximum file size
      console.log('Max file size exceeded!');
      fs.unlink('./' + file.path);
    },
  })
);

router.get('/upload', (req, res, next) =>
  res.send('Yeah, this is the right place.  Now try a POST!')
);

router.post('/upload', (req, res, next) => {
  if (req.body.password !== conf.password) {
    return res.send('Invalid password!');
  }

  const uploadedFile = req.files.file;
  if (!uploadedFile) {
    return res.send('No files was supplied;');
  }

  const uploadDate = new Date(req.body.dateOverride);
  dbq.saveJournal(uploadedFile, uploadDate, req.body.encrypt, res.send);
});

module.exports = router;
