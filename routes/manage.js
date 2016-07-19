var express = require("express");
var router = express.Router();

var dbq = require("../helpers/dbQuery.js");
var conf= require("../helpers/conf");

router.get("/", (req, res, next)=>{
  if(req.query.password == conf.fAnalyticsPwd){
    res.render("manager", {title: "Ameotrack Image Manager", pass:conf.fAnalyticsPwd});
  }else{
    res.render("wrong_password");
  }
});

router.get("/get", (req, res, next)=>{
  if(req.query.password == conf.fAnalyticsPwd){
    dbq.list_images(req.query.start, req.query.end).then(urls=>{
      res.send(urls);
    }, ()=>{ // dbq didn't like our start/end or some kind of db error
      res.render("error");
    });
  }else{
    res.render("wrong_password");
  }
});

module.exports = router;
