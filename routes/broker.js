var express = require('express');
var router = express.Router();
var oneBroker = require('1broker');

var conf = require('../helpers/conf.js');
var broker_utils = require('../helpers/broker_util.js');

var broker = new oneBroker(conf.broker_key);

router.get('/current_invested_value', function(req, res, next) {
  broker.positionList(function(a, b, c) {
    if (b) {
      //console.log(b);
      var profit = 0;
      for (var i = 0; i < b.length; i++) {
        profit += parseFloat(b[i].value);
      }
      res.send(
        '<html><body><table><tr><td>' +
          Math.round(profit.toString() * 10000) / 10000 +
          '</td></tr></table></html>'
      );
    }
  });
});

router.get('/bitcoin_price', function(req, res, next) {
  broker.marketQuotes('BTCUSD', function(a, b, c) {
    res.send(
      '<html><body><table><tr><td>' + b[0].bid + '</td></tr></table></html>'
    );
  });
});

router.get('/test', function(req, res, next) {
  console.log(broker_utils.update_symbol('GOOG'));
  res.send('test');
});

module.exports = router;
