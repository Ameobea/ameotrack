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
    onFileSizeLimit: file => {
      // Delete partially written files that exceed the maximum file size
      console.log('Max file size exceeded!');
      fs.unlink('./' + file.path);
    },
  })
);

router.get('/', (req, res, next) => {
  res.render('manual-upload');
});

router.post('/', (req, res) => {
  const muhFile = req.files.file;
  if (!muhFile) {
    return res.send('No file was supplied;');
  }

  const extension = req.files.file.name.split('.')[1];
  const filePath = './uploads/'.concat(muhFile.name);
  hasher({ files: [filePath] }, (error, hash) => {
    const { expiry = -1, source = 'manual', oneTime, secret } = req.body;

    const args = [
      extension,
      hash,
      expiry,
      muhFile.size,
      req.body.password,
      source,
    ];

    const uploadCb = (shortName, newPath) => {
      if (
        shortName !== 'Invalid password!' &&
        typeof shortName !== 'undefined'
      ) {
        fs.rename(filePath, newPath, err => {
          if (err) {
            console.log('error renaming file!');
            console.log(err);
          }
        });
      }

      res.send(`https://ameo.link/u/${oneTime ? 'ot/' : ''}${shortName}`);
    };

    dbq.uploadFile({ secret, oneTime })(...args, uploadCb);
  });
});

module.exports = router;
