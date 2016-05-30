"use strict";
/*jslint node: true */

var conf = require('./conf.js');
var helpers = require('./dbFunctions/helpers.js');

var dbq = exports;

dbq.doDelete = function(shortname, password, callback){
  if(password == conf.password){
    helpers.dbConnect(function(connection){
      helpers.deleteRowByShortname(shortname, connection, function(result){
        if(result === true){
          callback("Successfully deleted file!");
        }else{
          callback("Error deleting file; either it doesn't exist or another error occured.");
        }
      });
    });
  }else{
    callback("Invalid password!");
  }
};

dbq.deleteIfOneTimeView = function(shortname){
  helpers.dbConnect(function(connection){
    var queryString = "SELECT `one_time` FROM `hostedFiles` WHERE `shortname` = ?";
    connection.query(queryString, [shortname], function(err, oneTime){
      if(oneTime[0]){
        if(oneTime[0].one_time){
          dbq.doDelete(shortname, conf.password, function(){
            console.log("One time view file successfully deleted.");
          });
        }
      }
    });
  });
};

dbq.logFileAccess = function(image_code, ip, country_code, user_agent){
  helpers.dbConnect(function(connection){
    if(!ip){ip = null;}
    if(!country_code){country_code = null;}
    if(!user_agent){user_agent = null;}
    if(conf.bannedIps.indexOf(ip) == -1){
      var query = "INSERT INTO `hostedFiles_access` (image_code, ip, country_code, user_agent) VALUES(".concat(connection.escape(image_code), ", ", connection.escape(ip), ", ", connection.escape(country_code), ", ", connection.escape(user_agent), ");");
      connection.query(query, function(err, result){
        if(err){
          console.log("Error inserting access data into database.");
          console.log(err);
        }
        connection.destroy();
      });
    }
  });
};

dbq.startFileUpload = function(ext, hash, expiry, size, password, callback){
  if(password === conf.password){
    var dotOrNaw = ".";
    if(typeof ext == 'undefined'){ //remove extension if none is provided
      ext = "";
      dotOrNaw = "";
    }
    helpers.dbConnect(function(connection){
      var res = Math.random()+Math.random()+Math.random(); //unique identifier for new file rows, allowing for concurrent uploads
      connection.query("SELECT `shortname`,`path` FROM `hostedFiles` WHERE `hash` = '".concat(hash, "'"), function(err, existingFile){ //make sure no files with same hash already exist
        if(err){
          console.log("error checking for duplicate hashes in files table.");
          console.log(err);
        }else{
          if(typeof existingFile[0] != 'undefined'){
            connection.destroy();
            callback(existingFile[0].shortname.concat(dotOrNaw,ext), existingFile[0].path);
          }else{ //insert placeholder row
            var expiryD = null;
            if(expiry != -1){
              expiryD = new Date();
              expiryD.setTime(expiryD.getTime()+(expiry*86400000));
            }
            var path="TEMP";
            connection.query("".concat("INSERT INTO `hostedFiles` (shortname, extension, hash, path, size, expiry) VALUES(", connection.escape(res), ", ", connection.escape(ext), ", ", connection.escape(hash), ", ", connection.escape(path),", ",size,", ",connection.escape(expiryD),");"), function(err, result){
              if(err){
                console.log("error inserting placeholder into files database.");
                console.err(err.stack);
              }else{ //get the id of the placeholder row
                connection.query("SELECT `id` FROM `hostedFiles` WHERE `shortname` = ".concat(res, ";"), function(err, placeholder){
                  callback(placeholder, connection, dotOrNaw, res);
                });
              }
            });
          }
        }
      });
    });
  }
};

dbq.doFileUpload = function(ext, hash, expiry, size, password, callback){
  dbq.startFileUpload(ext, hash, expiry, size, password, function(placeholder, connection, dotOrNaw, res){
    //update the placeholder row with the real data
    var shortName = placeholder[0].id.toString(36);
    var path = "./uploads/".concat(shortName,dotOrNaw,ext); //CHANGE IN FUTURE TO SUPPORT MULTIPLE UPLOAD DIRECTORIES IF NEED BE
    connection.query("UPDATE `hostedFiles` SET `shortname` = '".concat(shortName,"', `path` = ? WHERE `shortname` = ",res,";"), [path], function(err, res){
      connection.destroy();
      if(err){
        console.log("error updating the new row in the database");
        console.log(err.stack);
      }else{
        callback(shortName.concat(dotOrNaw,ext), path); //return the filename of the newly uploaded file to the upload route
      }
    });
  });
};

dbq.doOneViewFileUpload = function(ext, hash, expiry, size, password, callback){
  dbq.startFileUpload(ext, hash, expiry, size, password, function(placeholder, connection, dotOrNaw, res){
    var shortName = hash;
    var path = "./uploads/".concat(shortName,dotOrNaw,ext); //CHANGE IN FUTURE TO SUPPORT MULTIPLE UPLOAD DIRECTORIES IF NEED BE
    connection.query("UPDATE `hostedFiles` SET `one_time` = 1, `shortname` = '".concat(shortName,"', `path` = ? WHERE `shortname` = ",res,";"), [path], function(err, res){
      connection.destroy();
      if(err){
        console.log("error updating the new row in the database");
        console.log(err.stack);
      }else{
        callback(shortName.concat(dotOrNaw,ext), path); //return the filename of the newly uploaded file to the upload route
      }
    });
  });
}

dbq.doSecretFileUpload = function(ext, hash, expiry, size, password, callback){
  dbq.startFileUpload(ext, hash, expiry, size, password, function(placeholder, connection, dotOrNaw, res){
    var shortName = hash;
    var path = "./uploads/".concat(shortName,dotOrNaw,ext); //CHANGE IN FUTURE TO SUPPORT MULTIPLE UPLOAD DIRECTORIES IF NEED BE
    connection.query("UPDATE `hostedFiles` SET `shortname` = '".concat(shortName,"', `path` = ? WHERE `shortname` = ",res,";"), [path], function(err, res){
      connection.destroy();
      if(err){
        console.log("error updating the new row in the database");
        console.log(err.stack);
      }else{
        callback(shortName.concat(dotOrNaw,ext), path); //return the filename of the newly uploaded file to the upload route
      }
    });
  });
}

dbq.checkExpiredFiles = function(callback){
  helpers.dbConnect(function(connection){
    connection.query('SELECT `shortname` FROM `hostedFiles` WHERE `expiry` < NOW();', function(err, result){
      connection.destroy();
      callback(result);
    });
  });
};

dbq.saveJournal = function(muhFile, uploadDate, encrypt, callback){
  helpers.dbConnect(function(connection){
    console.log(uploadDate);
    var oldSavePath = "./journals/".concat(uploadDate.getFullYear(), "/", uploadDate.getMonth()+1, "/", uploadDate.getDate(), "/", uploadDate.getHours(), "-", uploadDate.getMinutes(), "-", uploadDate.getSeconds(), ".", muhFile.extension);
    helpers.getOpenFilename(oldSavePath, function(newSavePath){
      helpers.renameJournal(muhFile.path, newSavePath, uploadDate, function(){
        connection.query('INSERT INTO `journals` (path, writtenTime) VALUES(?, ?);', [newSavePath,String(uploadDate.getFullYear()).concat("-", uploadDate.getMonth()+1, "-", uploadDate.getDate(), " ", uploadDate.getHours(), ":", uploadDate.getMinutes(), ":", uploadDate.getSeconds())], function(err, result){
          connection.destroy();
          callback("Journal successfully uploaded!");
        });
      });
    });
  });
};
