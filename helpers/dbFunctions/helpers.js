var mysql = require('mysql');
var fs = require('fs');

var conf = require('../conf.js');

var helpers = exports;

helpers.deleteRowByShortname = function(shortname, connection, callback) {
  connection.query(
    'SELECT `path` FROM `hostedFiles` WHERE `shortname` = ?',
    [shortname],
    function(err, result1) {
      if (typeof result1[0] != 'undefined') {
        //row does exist in table
        connection.query(
          'DELETE FROM `hostedFiles` WHERE `path` = ?',
          [result1[0].path],
          function(err, result2) {
            connection.destroy();
            if (result2.affectedRows > 0) {
              fs.unlink(result1[0].path, function() {
                callback(true);
              });
            } else {
              callback(false);
            }
          }
        );
      } else {
        //row doesn't exist in table
        callback(false);
      }
    }
  );
};

helpers.dbConnect = function(callback) {
  var connection = mysql.createConnection({
    host: conf.dbHost,
    user: conf.dbUser,
    password: conf.dbPassword,
    database: conf.dbDatabase,
  });

  connection.on('error', function(err) {
    if (err) {
      setTimeout(helpers.dbConnect(callback), 2000);
    }
  });

  connection.connect(function(err) {
    if (err) {
      setTimeout(helpers.dbConnect(callback), 2000);
    }
  });

  callback(connection);
};

helpers.getOpenFilename = function(path, callback) {
  fs.exists(path, function(exists) {
    if (exists) {
      if (path.indexOf('_')) {
        var split = path.split('_');
        path = split[0].concat('_', parseInt(split[1]) + 1);
        helpers.getOpenFilename(path, callback);
      } else {
        path = path.concat('_1');
        helpers.getOpenFilename(path, callback);
      }
    } else {
      callback(path);
    }
  });
};

helpers.renameJournal = function(oldPath, newPath, uploadDate, callback) {
  fs.exists('./journals/'.concat(uploadDate.getFullYear(), '/'), function(
    yearFolderExists
  ) {
    if (!yearFolderExists) {
      fs.mkdirSync('./journals/'.concat(uploadDate.getFullYear(), '/'));
    }
    fs.exists(
      './journals/'.concat(
        uploadDate.getFullYear(),
        '/',
        uploadDate.getMonth() + 1,
        '/'
      ),
      function(monthFolderExists) {
        if (!monthFolderExists) {
          fs.mkdirSync(
            './journals/'.concat(
              uploadDate.getFullYear(),
              '/',
              uploadDate.getMonth() + 1,
              '/'
            )
          );
        }
        fs.exists(
          './journals/'.concat(
            uploadDate.getFullYear(),
            '/',
            uploadDate.getMonth() + 1,
            '/',
            uploadDate.getDate(),
            '/'
          ),
          function(dayFolderExists) {
            if (!dayFolderExists) {
              fs.mkdirSync(
                './journals/'.concat(
                  uploadDate.getFullYear(),
                  '/',
                  uploadDate.getMonth() + 1,
                  '/',
                  uploadDate.getDate(),
                  '/'
                )
              );
            }
            fs.rename(oldPath, newPath, callback);
          }
        );
      }
    );
  });
};
