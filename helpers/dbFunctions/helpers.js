const fs = require('fs');
const { promisify } = require('util');

const mysql = require('mysql');

const conf = require('../conf.js');

const helpers = exports;

const existsAsync = promisify(fs.exists);

helpers.deleteRowByShortname = (shortname, connection, cb) => {
  connection.query(
    'SELECT `path` FROM `hostedFiles` WHERE `shortname` = ?',
    [shortname],
    (err, result1) => {
      if (!result1[0]) {
        // Row doesn't exist in table
        cb(false);
        return;
      }

      // Row does exist in table
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

  const errCb = err =>
    err &&
    setTimeout(() => {
      console.log('Error connecting to MySQL DB; retrying in 2 seconds.');
      helpers.dbConnect(cb);
    }, 2000);

  connection.on('error', errCb);
  connection.connect(errCb);

  cb(connection);
};

helpers.dbConnectPromise = () => new Promise((f, r) => helpers.dbConnect(f));

helpers.getOpenFilename = async (path, callback) => {
  const exists = await existsAsync(path);
  if (!exists) {
    return callback(path);
  }

  if (path.indexOf('_')) {
    const split = path.split('_');
    path = split[0].concat('_', parseInt(split[1]) + 1);
    helpers.getOpenFilename(path, callback);
  } else {
    path = path.concat('_1');
    helpers.getOpenFilename(path, callback);
  }
};

helpers.renameJournal = async (oldPath, newPath, uploadDate, callback) => {
  const yearFolderExists = await existsAsync(
    `./journals/${uploadDate.getFullYear()}/`
  );
  !yearFolderExists && fs.mkdirSync(`./journals/${uploadDate.getFullYear()}/`);

  const monthFolderPath = `./journals/${uploadDate.getFullYear()}/${uploadDate.getMonth() +
    1}/`;
  const monthFolderExists = await existsAsync(monthFolderPath);
  !monthFolderExists && fs.mkdirSync(monthFolderPath);

  const dayFolderPath = `./journals/${uploadDate.getFullYear()}/${uploadDate.getMonth() +
    1}/${uploadDate.getDate()}/`;
  const dayFolderExists = await existsAsync(dayFolderPath);
  !dayFolderExists && fs.mkdirSync(dayFolderPath);

  fs.rename(oldPath, newPath, callback);
};
