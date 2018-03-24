const express = require('express');
const router = express.Router();

const dbq = require('../helpers/dbQuery.js');
const conf = require('../helpers/conf');

router.get('/', (req, res, next) => {
  if (req.query.password == conf.fAnalyticsPwd) {
    res.render('manager', {
      title: 'Ameotrack Image Manager',
      pass: conf.fAnalyticsPwd,
    });
  } else {
    res.render('wrong_password');
  }
});

router.get('/get', (req, res, next) => {
  if (req.query.password !== conf.fAnalyticsPwd) {
    return res.render('wrong_password');
  }

  dbq
    .list_images(req.query.start, req.query.end)
    .then(urls => res.send(urls))
    // dbq didn't like our start/end or some kind of db error
    .catch(() => res.render('error'));
});

module.exports = router;
