const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
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
const remind = require('./routes/remind');
const journals = require('./routes/journal');
const file_analytics = require('./routes/f_analytics');
const tracker = require('./routes/tracker');

const dbq = require('./helpers/dbQuery');
const conf = require('./helpers/conf');
const schedule = require('./helpers/schedule');

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

app.use((req, res, next) => {
  if (req.url.substr(-1) == '/' && req.url.length > 1) {
    res.redirect(301, '/u' + req.url.slice(0, -1));
  } else {
    next();
  }
});

app.get('/fireworks', (req, res, next) => {
  res.sendFile('index.html', { root: __dirname + '/public/fireworks/' });
  const get_path = `/t?type=event&category=ameotrack_fireworks&password=${
    conf.event_password
  }&data={}`;

  http.request({ host: 'ameo.link', port: 3000, path: get_path }).end();
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
app.use('/ot', oneTimePortal);
app.use('/bin', ameoBin);
app.use('/feedback', feedback);
app.use('/remind', remind);

app.use('/*', (req, res, next) => {
  const fileStem = req.originalUrl
    .substring(1, req.originalUrl.length)
    .split('.')[0];

  setTimeout(() => {
    const get_path = `/t?type=event&category=ameotrack_image&password=${
      conf.event_password
    }&data={image-name:"`.concat(fileStem, '"}');

    const req1 = http.request({
      host: 'ameo.link',
      port: 3000,
      path: get_path,
    });
    req1.end();

    dbq.deleteIfOneTimeView(fileStem);
    dbq.logFileAccess(
      fileStem,
      req.headers['x-forwarded-for'],
      req.headers['cf-ipcountry'],
      req.headers['user-agent']
    );
  });

  next();
});
app.use(express.static(__dirname + '/uploads'));

const socket_server = ws
  .createServer(conn => {
    conn.once('text', input => {
      try {
        input = JSON.parse(input);

        if (
          input.type &&
          input.category &&
          input.password &&
          input.data &&
          input.password == conf.event_password
        ) {
          socket_server.connections.forEach(connection =>
            connection.sendText(
              JSON.stringify({
                type: 'event',
                category: input.category,
                data: input.data,
              })
            )
          );
        }
      } catch (e) {
        console.log(e);
      }
    });
  })
  .listen(7507);

socket_server.on('error', err => {
  console.log('Websocket server had some sort of error:');
  console.log(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
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
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});

app.use((req, res, next) => {
  res.status(404).send('Resource not found');
});

app.listen(3000, () => {
  console.log('Ameotrack launched on port 3000');
  schedule.init();
});
