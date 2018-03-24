const express = require('express');
const router = express.Router();

const ws = require('nodejs-websocket');

router.get('/', function(req, res, next) {
  const socket = ws.connect('ws://ip.ameobea.me:7507/');

  socket.on('error', function(err) {
    console.log('Tracker socket error: ');
    console.log(err);
  });

  socket.on('connect', function() {
    socket.sendText(JSON.stringify(req.query), function() {
      socket.close();
    });
  });

  res.send(JSON.stringify({ status: 'Event submitted successfully.' }));
});

module.exports = router;
