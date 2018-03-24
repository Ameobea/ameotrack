const express = require('express');
const router = express.Router();

const analytics = require('../helpers/dbFunctions/f_analytics');
const conf = require('../helpers/conf');

router.get('/', (req, res, next) => {
  if (req.query.password !== conf.fAnalyticsPwd) {
    return res.render('wrong_password');
  }

  analytics.get_most_accessed(25, most_viewed => {
    res.render('f_analytics', { most_viewed: most_viewed });
  });
});

module.exports = router;
