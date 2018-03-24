var express = require('express');
var router = express.Router();
var multer = require('multer');

var dbq = require('../helpers/dbQuery.js');

router.use(multer());

router.get('/', (req, res, next) =>
  res.send('Yeah, this is the right place.  Now try a POST!')
);

router.post('/', (req, res, next) => {
  if (!req.body.shortname) {
    return res.send('No shortname supplied!');
  }

  dbq.doDelete(req.body.shortname, req.body.password, res.send);
});

module.exports = router;
