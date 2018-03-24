const express = require('express');
const router = express.Router();

const dbq = require('../helpers/dbQuery.js');

router.get('/', (req, res, next) => {
  res.render('bin_view', { text: '', filename: 'file.txt', back: '.' });
});

router.post('/', (req, res, next) => {
  dbq.saveBin(
    '',
    req.body.password,
    req.body.text,
    req.body.filename,
    req.body.secret,
    (err, dbRes) => {
      if (err) {
        res.render('error');
      } else {
        res.render('redirect', {
          url: './bin/' + dbRes.shortname,
          filename: 'file.txt',
        });
      }
    }
  );
});

router.get('/:shortname', (req, res, next) => {
  dbq.getBin(req.params.shortname, (err, dbRes) => {
    if (dbRes) {
      res.render('bin_view', {
        text: dbRes.text,
        filename: dbRes.filename,
        back: '..',
      });
    } else {
      res.render('no_bin');
    }
  });
});

router.post('/:shortname', (req, res, next) => {
  dbq.saveBin(
    req.params.shortname,
    req.body.password,
    req.body.text,
    req.body.filename,
    req.body.secret,
    (err, dbRes) => {
      if (err) {
        res.render('bin_wrongPass');
      } else {
        res.render('bin_view', {
          text: dbRes.text,
          filename: dbRes.filename,
          back: '..',
        });
      }
    }
  );
});

module.exports = router;
