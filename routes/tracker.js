var express = require('express');
var router = express.Router();

var ws = require("nodejs-websocket");

var dbq = require('../helpers/dbQuery.js');
var conf = require('../helpers/conf.js');

router.get('/', function(req, res, next) {
  var socket = ws.connect("ws://ip.ameobea.me:7507/");
  socket.on("error", function(err){
    console.log("Tracker socket error: ");
    console.log(err);
  })
  socket.on("connect", function(){
    socket.sendText(JSON.stringify(req.query), function(){
      socket.close();
    });
  })
  res.send(JSON.stringify({status: "Event submitted successfully."}));
});

module.exports = router;
