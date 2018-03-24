'use strict';

const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const schedule = require('node-schedule');
const ws = require('nodejs-websocket');
const http = require('http');
const bp = require('body-parser');

const routes = require('./routes/index');
const upload = require('./routes/upload');
const deleter = require('./routes/delete');
const manager = require('./routes/manage');
const oneTimePortal = require('./routes/oneTime');
const ameoBin = require('./routes/bin');
const feedback = require('./routes/feedback');

const journals = require('./routes/journal.js');
const file_analytics = require('./routes/f_analytics.js');
const tracker = require('./routes/tracker.js');
const broker = require('./routes/broker.js');
const dbq = require('./helpers/dbQuery.js');
const conf = require('./helpers/conf.js');

const app = express();

// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(cookieParser());
app.use(bp.json());
app.use(bp.urlencoded({ extended: false }));

app.use(function(req, res, next) {
  if (req.url.substr(-1) == '/' && req.url.length > 1) {
    res.redirect(301, '/u' + req.url.slice(0, -1));
  } else {
    next();
  }
});

app.get('/fireworks', function(req, res, next) {
  res.sendFile('index.html', { root: __dirname + '/public/fireworks/' });
  const get_path = `/t?type=event&category=ameotrack_fireworks&password=${
    conf.event_password
  }&data={}`;
  var req1 = http.request(
    { host: 'ip.ameobea.me', port: 3000, path: get_path },
    function(res) {
      /*console.log(res);*/
    }
  );
  req1.end();
  req1.on('connect', function(res, socket, head) {
    console.log('connected!');
  });
});
app.use(
  express.static(path.join(__dirname, 'public'), {
    redirect: false,
    index: 'index.html',
  })
);

app.use('/', routes);
app.use('/upload', upload);
app.use('/delete', deleter);
app.use('/manage', manager);
app.use('/j', journals);
app.use('/analytics', file_analytics);
app.use('/t', tracker);
app.use('/1broker', broker);
app.use('/ot', oneTimePortal);
app.use('/bin', ameoBin);
app.use('/feedback', feedback);

app.use(
  express.static(__dirname + '/uploads', {
    callback: function(req) {
      const get_path = `/t?type=event&category=ameotrack_image&password=${
        conf.event_password
      }&data={image-name:"`.concat(
        req.url.substring(1, req.url.length).split('.')[0],
        '"}'
      );
      var req1 = http.request(
        { host: 'ip.ameobea.me', port: 3000, path: get_path },
        function(res) {
          /*console.log(res);*/
        }
      );
      req1.end();
      req1.on('connect', function(res, socket, head) {
        console.log('connected!');
      });
      dbq.deleteIfOneTimeView(
        req.url.substring(1, req.url.length).split('.')[0]
      );
      dbq.logFileAccess(
        req.url.substring(1, req.url.length).split('.')[0],
        req.headers['x-forwarded-for'],
        req.headers['cf-ipcountry'],
        req.headers['user-agent']
      );
    },
  })
);

var socket_server = ws
  .createServer(function(conn) {
    socket_server.on('error', function(err) {
      console.log('Websocket server had some sort of error:');
      console.log(err);
    });
    conn.once('text', function(input) {
      try {
        input = JSON.parse(input);
        if (input.type && input.category && input.password && input.data) {
          if (input.password == conf.event_password) {
            socket_server.connections.forEach(function(connection) {
              connection.sendText(
                JSON.stringify({
                  type: 'event',
                  category: input.category,
                  data: input.data,
                })
              );
            });
          }
        }
      } catch (e) {
        console.log(e);
      }
    });
  })
  .listen(7507);

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err.stack);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});

app.use(function(req, res, next) {
  res.status(404).send('Resource not found');
});

schedule.scheduleJob('1 * * * * *', function() {
  dbq.checkExpiredFiles(function(rows) {
    if (typeof rows == 'undefined') {
      return;
    }
    for (var i = 0; i < rows.length; i++) {
      dbq.doDelete(rows[i].shortname, conf.password, function(status) {
        console.log(status);
      });
    }
  });
});

app.listen(3000, console.log('Ameotrack launched on port 3000'));
