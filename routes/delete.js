var express = require('express');
var router = express.Router();
var multer = require('multer');

var dbq = require('../helpers/dbQuery.js');

router.use(multer());

router.get('/', function(req, res, next) {
	res.send('Yeah, this is the right place.  Now try a POST!');
});

router.post('/', function(req, res, next) {
	if(typeof req.body.shortname === "undefined") {
		res.send("No shortname supplied!");
		return;
	}
	dbq.doDelete(req.body.shortname, req.body.password, function(status) {
		res.send(status);
	});
});

module.exports = router;
