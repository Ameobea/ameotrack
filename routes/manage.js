var express = require('express');
var router = express.Router();

var dbq = require('../helpers/dbQuery.js');

router.get('/', function(req, res, next){
	res.render('manager', { title: 'Ameotrack Image Manager' });
});

module.exports = router;
