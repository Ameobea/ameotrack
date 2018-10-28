'use strict';

const crypto = require('crypto');

const conf = require('./conf.js');
const helpers = require('./dbFunctions/helpers.js');
const bcrypt = require('bcrypt-nodejs');

const dbq = exports;

dbq.doDelete = (shortname, password, callback) => {
  if (!password === conf.password) {
    callback('Invalid password!');
  }

  helpers.dbConnect(connection => {
    helpers.deleteRowByShortname(shortname, connection, result => {
      callback(
        result === true
          ? 'Successfully deleted file!'
          : "Error deleting file; either it doesn't exist or another error occured."
      );

      connection.end(
        err => err && console.error('Error while closing MySQL Connection!')
      );
    });
  });
};

dbq.deleteIfOneTimeView = shortname =>
  helpers.dbConnect(connection => {
    const queryString =
      'SELECT `one_time` FROM `hostedFiles` WHERE `shortname` = ?';
    connection.query(queryString, [shortname], (err, oneTime) => {
      if (oneTime[0] && oneTime[0].one_time) {
        dbq.doDelete(shortname, conf.password, () => {
          console.log('One time view file successfully deleted.');
        });
      }

      connection.end();
    });
  });

dbq.logFileAccess = (image_code, ip, country_code, user_agent) => {
  helpers.dbConnect(connection => {
    if (!ip) {
      ip = null;
    }
    if (!country_code) {
      country_code = null;
    }
    if (!user_agent) {
      user_agent = null;
    }
    if (!conf.bannedIps.includes(ip)) {
      const values = { image_code, ip, country_code, user_agent };

      connection.query(
        'INSERT INTO `hostedFiles_access` SET ?',
        values,
        (err, result) => {
          if (err) {
            console.log('Error inserting access data into database.');
            console.log(err);
          }
          connection.end();
        }
      );
    }
  });
};

dbq.startFileUpload = (
  _ext,
  hash,
  expiry,
  size,
  password,
  source,
  callback
) => {
  if (password !== conf.password) {
    return;
  }

  const { ext, dotOrNaw } = _ext
    ? { dotOrNaw: '.', ext: _ext }
    : { dotOrNaw: '', ext: '' };

  helpers.dbConnect(connection => {
    // Unique identifier for new file rows, allowing for concurrent uploads
    const res = Math.random() + Math.random() + Math.random();
    const query = 'SELECT * FROM `hostedFiles` WHERE `hash` = ?';
    connection.query(query, [hash], (err, existingFile) => {
      // Make sure no files with same hash already exist
      if (err) {
        console.log('error checking for duplicate hashes in files table.');
        console.log(err);
      } else {
        if (existingFile[0]) {
          return callback(existingFile, connection, dotOrNaw, res);
        }

        // Insert placeholder row
        let expiryD = null;
        if (expiry != -1) {
          expiryD = new Date();
          expiryD.setTime(expiryD.getTime() + expiry * 86400000);
        }

        const values = {
          shortname: res,
          extension: ext,
          hash,
          path: 'TEMP',
          size,
          expiry: expiryD,
          source,
        };
        connection.query(
          'INSERT INTO `hostedFiles` SET ?',
          values,
          (err, result) => {
            if (err) {
              console.log('error inserting placeholder into files database.');
              return console.err(err.stack);
            }

            // Get the id of the placeholder row
            connection.query(
              'SELECT * FROM `hostedFiles` WHERE `shortname` = ?',
              [res],
              (err, placeholder) => {
                callback(placeholder, connection, dotOrNaw, res);
              }
            );
          }
        );
      }
    });
  });
};

dbq.uploadFile = ({ oneTime = false, secret = false }) => (
  extension,
  hash,
  expiry,
  size,
  password,
  source,
  cb
) =>
  dbq.startFileUpload(
    extension,
    hash,
    expiry,
    size,
    password,
    source,
    (placeholder, connection, dorOrNaw, res) => {
      const shortName = secret ? hash : placeholder[0].id.toString(36);
      const dotOrNaw = extension ? '.' : '';
      const path = './uploads/'.concat(shortName, dotOrNaw, extension);
      const values = {
        shortname: shortName,
        path,
        one_time: oneTime ? 1 : 0,
      };

      connection.query(
        `UPDATE \`hostedFiles\` SET ? WHERE \`shortname\` = ${res};`,
        values,
        (err, res) => {
          connection.destroy();
          if (err) {
            console.log('error updating the new row in the database');
            console.log(err.stack);
          } else {
            // Return the filename of the newly uploaded file to the upload route
            cb(shortName.concat(dotOrNaw, extension), path);
          }
        }
      );
    }
  );

dbq.checkExpiredFiles = callback => {
  helpers.dbConnect(connection => {
    connection.query(
      'SELECT `shortname` FROM `hostedFiles` WHERE `expiry` < NOW();',
      (err, result) => {
        connection.end();
        callback(result);
      }
    );
  });
};

dbq.saveJournal = (muhFile, uploadDate, encrypt, callback) => {
  helpers.dbConnect(connection => {
    const oldSavePath = `./journals/${uploadDate.getFullYear()}/${uploadDate.getMonth()}/${uploadDate.getDate()}/${uploadDate.getHours()}-${uploadDate.getMinutes()}-${uploadDate.getSeconds()}.${
      muhFile.extension
    }`;

    helpers.getOpenFilename(oldSavePath, newSavePath => {
      helpers.renameJournal(muhFile.path, newSavePath, uploadDate, () => {
        connection.query(
          'INSERT INTO `journals` (path, writtenTime) VALUES(?, ?);',
          [
            newSavePath,
            `${uploadDate.getFullYear()}-${uploadDate.getMonth()}-${uploadDate.getDate()} ${uploadDate.getHours()}:${uploadDate.getMinutes()}:${uploadDate.getSeconds()}`,
          ],
          (err, result) => {
            connection.destroy();
            callback('Journal successfully uploaded!');
          }
        );
      });
    });
  });
};

dbq.getBin = (shortname, callback) => {
  helpers.dbConnect(conn => {
    conn.query(
      'SELECT * FROM `bins` WHERE `shortname` = ?;',
      [shortname],
      (err, res) => {
        callback(null, res[0]);
      }
    );
  });
};

dbq.saveBin = (shortname, password, text, filename, secret, cb) => {
  helpers.dbConnect(conn => {
    conn.query(
      'SELECT * FROM `bins` WHERE `shortname` = ?;',
      [shortname],
      (err, existing) => {
        if (shortname == '') {
          const sha256 = crypto
            .createHash('sha256')
            .update(text)
            .digest('hex');

          dbq.startFileUpload(
            'ameobin',
            sha256,
            -1,
            text.length,
            conf.password,
            'ameobin',
            (placeholder, _connection, dotOrNaw, __shortname) => {
              if (secret == undefined) {
                shortname = placeholder[0].id.toString(36);
              } else {
                shortname = placeholder[0].hash;
              }

              conn.query(
                'UPDATE `hostedFiles` SET `shortname` = ? WHERE `shortname` = ?;',
                [shortname, placeholder[0].shortname],
                (err, _res) => {
                  bcrypt.hash(password, null, null, (err, hashedPass) => {
                    conn.query(
                      'INSERT INTO `bins` (text, shortname, password, filename) VALUES(?, ?, ?, ?);',
                      [text, shortname, hashedPass, filename],
                      (err, __res) => {
                        cb(null, { shortname: shortname, text: text });
                      }
                    );
                  });
                }
              );
            }
          );
        } else {
          bcrypt.compare(password, existing[0].password, (err, goodHash) => {
            if (!goodHash) {
              return cb(null, {
                shortname,
                text: existing[0].text,
                filename: existing[0].filename,
              });
            }

            conn.query(
              'UPDATE `bins` SET `text` = ?, `filename` = ? WHERE `shortname` = ?;',
              [text, filename, shortname]
            );
            cb(null, { shortname, text, filename });
          });
        }
      }
    );
  });
};

dbq.list_images = (start, end) =>
  new Promise((f, r) => {
    const startIndex = parseInt(start);
    const endIndex = parseInt(end);
    if (!(end - startIndex <= 24 && endIndex - startIndex >= 0)) {
      return r();
    }

    const query =
      'SELECT * FROM `hostedFiles` WHERE 1 ORDER BY `uploadTime` DESC LIMIT ?,?;';
    helpers.dbConnect(conn => {
      conn.query(query, [startIndex, endIndex], (err, res) => {
        if (err) {
          console.log(err);
          conn.end();
          return r();
        }

        let urls = '[';
        for (let i = 0; i < res.length; i++) {
          urls += `"https://ameo.link/u/${res[i].shortname}.${
            res[i].extension
          }/", `;
        }
        f(urls + ']');

        conn.end();
      });
    });
  });
