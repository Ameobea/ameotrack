"use strict";
/*jslint node: true */
var crypto = require("crypto");

var conf = require('./conf.js');
var helpers = require('./dbFunctions/helpers.js');
var bcrypt = require("bcrypt-nodejs");

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
      var query = "SELECT * FROM `hostedFiles` WHERE `hash` = '".concat(hash, "'");
      connection.query(query, function(err, existingFile){ //make sure no files with same hash already exist
        if(err){
          console.log("error checking for duplicate hashes in files table.");
          console.log(err);
        }else{
          if(typeof existingFile[0] != 'undefined'){
            connection.destroy();
            callback(existingFile);
          }else{ //insert placeholder row
            var expiryD = null;
            if(expiry != -1){
              expiryD = new Date();
              expiryD.setTime(expiryD.getTime()+(expiry*86400000));
            }
            var path="TEMP";
            var query = "".concat("INSERT INTO `hostedFiles` (shortname, extension, hash, path, size, expiry) VALUES(",
                connection.escape(res), ", ", connection.escape(ext), ", ", connection.escape(hash), ", ",
                connection.escape(path),", ",size,", ",connection.escape(expiryD),");");
            connection.query(query, function(err, result){
              if(err){
                console.log("error inserting placeholder into files database.");
                console.err(err.stack);
              }else{ //get the id of the placeholder row
                connection.query("SELECT * FROM `hostedFiles` WHERE `shortname` = ".concat(res, ";"), function(err, placeholder){
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
};

dbq.doSecretFileUpload = (ext, hash, expiry, size, password, callback)=>{
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
};

dbq.checkExpiredFiles = callback=>{
  helpers.dbConnect(connection=>{
    connection.query('SELECT `shortname` FROM `hostedFiles` WHERE `expiry` < NOW();', function(err, result){
      connection.destroy();
      callback(result);
    });
  });
};

dbq.saveJournal = (muhFile, uploadDate, encrypt, callback)=>{
  helpers.dbConnect(connection=>{
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

dbq.getBin = (shortname, callback)=>{
  helpers.dbConnect(conn=>{
    conn.query("SELECT * FROM `bins` WHERE `shortname` = ?;", [shortname], (err, res)=>{
      callback(null, res[0]);
    });
  });
};

dbq.saveBin = (shortname, password, text, callback)=>{
  helpers.dbConnect(conn=>{
    conn.query("SELECT * FROM `bins` WHERE `shortname` = ?;", [shortname], (err, res)=>{
      if(shortname == ""){
        var sha256 = crypto.createHash("sha256").update(text).digest("hex");
        dbq.startFileUpload("ameobin", sha256, -1, text.length, conf.password, (placeholder, _connection, dotOrNaw, __shortname)=>{
          shortname = placeholder[0].id.toString(36);
          conn.query("UPDATE `hostedFiles` SET `shortname` = ? WHERE `shortname` = ?;", [shortname, placeholder[0].shortname], function(err, res){
            bcrypt.hash(password, null, null, (err, hashedPass)=>{
              conn.query("INSERT INTO `bins` (text, shortname, password) VALUES(?, ?, ?);", [text, shortname, hashedPass], (err, res)=>{
                callback(null, {shortname: shortname, text: text});
              });
            });
          });
        });
      }else{
        bcrypt.compare(password, res[0].password, (err, goodHash)=>{
          if(goodHash){
            conn.query("UPDATE `bins` SET `text` = ? WHERE `shortname` = ?;", [text, shortname], (err, res)=>{});
            callback(null, {shortname: shortname, text: text});
          }
          callback(null, {shortname: shortname, text: res[0].text});
        });
      }
    });
  });
};
