var express = require('express');
var router = express.Router();

router.get('/:file', (req, res, next)=>{
  res.render('secret_portal', {filename: req.params.file});
});

module.exports = router;
