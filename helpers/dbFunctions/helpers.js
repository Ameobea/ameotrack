const mysql = require('mysql');
const fs = require('fs');

const conf = require('../conf.js');

const helpers = exports;

helpers.deleteRowByShortname = (shortname, connection, cb) => {
  connection.query(
    'SELECT `path` FROM `hostedFiles` WHERE `shortname` = ?',
    [shortname],
    (err, result1) => {
      if (!result1[0]) {
        //row doesn't exist in table
        cb(false);
        return;
      }

      //row does exist in table
      connection.query(
        'DELETE FROM `hostedFiles` WHERE `path` = ?',
        [result1[0].path],
        (err, result2) => {
          connection.destroy();

          if (result2.affectedRows > 0) {
            fs.unlink(result1[0].path, () => {
              cb(true);
            });
          } else {
            cb(false);
          }
        }
      );
    }
  );
};

helpers.dbConnect = cb => {
  const connection = mysql.createConnection({
    host: conf.dbHost,
    user: conf.dbUser,
    password: conf.dbPassword,
    database: conf.dbDatabase,
  });

  connection.on('error', err => {
    if (err) {
      setTimeout(helpers.dbConnect(cb), 2000);
    }
  });

  connection.connect(err => {
    if (err) {
      setTimeout(helpers.dbConnect(cb), 2000);
    }
  });

  cb(connection);
};

helpers.dbConnectPromise = () => new Promise((f, r) => helpers.dbConnect(f));

helpers.getOpenFilename = (path, callback) => {
  fs.exists(path, exists => {
    if (!exists) {
      return callback(path);
    }

    if (path.indexOf('_')) {
      var split = path.split('_');
      path = split[0].concat('_', parseInt(split[1]) + 1);
      helpers.getOpenFilename(path, callback);
    } else {
      path = path.concat('_1');
      helpers.getOpenFilename(path, callback);
    }
  });
};

helpers.renameJournal = function(oldPath, newPath, uploadDate, callback) {
  fs.exists(`./journals/${uploadDate.getFullYear()}/`, yearFolderExists => {
    if (!yearFolderExists) {
      fs.mkdirSync(`./journals/${uploadDate.getFullYear()}/`);
    }

    const monthFolderPath = `./journals/${uploadDate.getFullYear()}/${uploadDate.getMonth() +
      1}/`;
    fs.exists(monthFolderPath, monthFolderExists => {
      !monthFolderExists && fs.mkdirSync(monthFolderPath);

      const dayFolderPath = `./journals/${uploadDate.getFullYear()}/${uploadDate.getMonth() +
        1}/${uploadDate.getDate()}/`;
      fs.exists(dayFolderPath, dayFolderExists => {
        !dayFolderExists && fs.mkdirSync(dayFolderPath);

        fs.rename(oldPath, newPath, callback);
      });
    });
  });
};
