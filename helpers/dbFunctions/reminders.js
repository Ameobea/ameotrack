var mysql = require('mysql');
var fs = require('fs');

var conf = require('../conf.js');

var reminders = exports;

reminders.loadReminders = connection => {
  return new Promise((f, r) => {
    connection.query(
      `SELECT * FROM \`reminders\` WHERE \`unix_timestamp\` >= ${parseInt(
        new Date().getTime() / 1000
      )};`,
      (err, res) => {
        if (err || !res) {
          r(err);
        } else {
          f(res);
        }
      }
    );
  });
};
