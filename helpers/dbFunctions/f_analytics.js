var mysql = require('mysql');
var helpers = require('./helpers.js');

var conf = require('../conf.js');

var f_analytics = exports;

f_analytics.get_most_accessed = function(n, callback){
	helpers.dbConnect(function(connection){
		connection.query("SELECT `image_code`, COUNT(*) AS amount FROM `hostedFiles_access` GROUP BY `image_code` ORDER BY amount DESC;", function(err, result1) {
			function add_extensions(i, data, callback1) {
				query = "SELECT `extension` FROM `hostedFiles` WHERE `shortname` = ".concat(connection.escape(data[i].image_code),";");
				connection.query(query, function(err, result2) {
					if (typeof result2[0] !== 'undefined') {
						data[i].extension = result2[0].extension
					}else{
						data[i].extension = "DEL";
					}

					if(data.length > i+1) {
						add_extensions(i+1, data, callback1);
					} else {
						callback1(data);
					}

					connection.end(function(err) {console.error('Error while closing MySQL Connection!');});
				});
			}

			add_extensions(0, result1, function(data) {
				callback(data)
			});
		});
	});
}
