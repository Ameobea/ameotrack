var conf = require('../helpers/conf.js');
var https = require('https');

var oneBroker =  require('1broker');
var broker = new oneBroker(conf.broker_key);

var broker_util = exports;

broker_util.update_symbol = function(symbol){
	//https.get("https://1broker.com/ajax/getchartdata.php?symbol="+symbol+"&type=raw&nocache="+(Math.random()*100000000000000000).toString(), function(res){
	https.get("https://google.com", function(res){
		var data= "";
		console.log("statusCode: ", res.statusCode);
		console.log("headers: ", res.headers);
		res.on("data", function(chunk){
			data += chunk;
		});
		res.on("end", function(){
			console.log("test",data);
		});
	}).on("error", function(e){
		console.log(e);
	});
}

/*
	&type=raw: 
		Definition: As close to secondly as possible.  
		Range: 1 Day

	&type=10minutely:
		Definition: 10 minutes
		Range: 1 Month

	&type=daily:
		Definition: 1 Day
		Range: Indeterminate
*/