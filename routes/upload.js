const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const mv = require('mv');
const axios = require('axios');
const path = require('path');

const conf = require('../helpers/conf.js');
const { storageZoneName, accessKey } = conf;

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

  const spl = muhFile.originalname.split('.');
  const extension = muhFile.originalname.split('.')[spl.length - 1];
  const filePath = muhFile.path;

  const shasum = crypto.createHash('sha1');
  const stream = fs.ReadStream(filePath);
  stream.on('data', (data) => shasum.update(data));
  stream.on('end', () => {
    const hash = shasum.digest('hex');
    const { expiry = -1, source = 'manual', oneTime, secret } = req.body;

    const uploadCb = async (shortName, newPath) => {
      if (
        shortName !== 'Invalid password!' &&
        typeof shortName !== 'undefined'
      ) {
        mv(filePath, newPath, async (err) => {
          if (err) {
            console.log('error renaming file!');
            console.log(err);
          } else {
            // Upload the file to external storage
            const fileBuffer = fs.readFileSync(newPath);
            const fileUrl = `https://storage.bunnycdn.com/${storageZoneName}/${shortName}`;

            try {
              await axios.put(fileUrl, fileBuffer, {
                headers: {
                  AccessKey: accessKey,
                  'content-type': 'application/octet-stream',
                },
              });
            } catch (error) {
              console.error(
                'Error uploading to external storage:',
                error.message
              );
            }
          }
        });
      }

      res.send(`https://i.ameo.link/${shortName}`);
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

