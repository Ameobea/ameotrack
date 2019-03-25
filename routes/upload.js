const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const hasher = require('hash-files');
const bodyParser = require('body-parser');

const dbq = require('../helpers/dbQuery.js');

router.get('/', (req, res, next) => {
  res.render('manual-upload');
});

const multerInstance = multer({
  storage: multer.diskStorage({}),
});

router.post('/', multerInstance.any(), (req, res) => {
  const muhFile = req.files.file || req.files[0];
  if (!muhFile) {
    return res.send('No file was supplied;');
  }

  const extension = muhFile.originalname.split('.')[1];
  const filePath = muhFile.path;
  hasher({ files: [filePath] }, (error, hash) => {
    const { expiry = -1, source = 'manual', oneTime, secret } = req.body;

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

    const args = [
      extension,
      hash,
      expiry,
      muhFile.size,
      req.body.password,
      source,
    ];

    dbq.uploadFile({ secret, oneTime })(...args, uploadCb);
  });
});

router.post('/v2', (req, res) => {
  console.log(req.headers);
  console.log(req.body);
});

module.exports = router;
