var express = require('express');
var router = express.Router();

var dbq = require("../helpers/dbQuery");
var analytics = require('../helpers/dbFunctions/f_analytics');
var conf = require("../helpers/conf")

router.get("/", function(req, res, next) {
  if(req.query.password == conf.fAnalyticsPwd){
    analytics.get_most_accessed(25, function(most_viewed){
      res.render('f_analytics', {most_viewed: most_viewed});
    });
  }else{
    res.render('wrong_password');
  }
});

module.exports = router;
