const conf = require('./conf');
const mailgun = require('mailgun-js')({
  apiKey: conf.mailgunKey,
  domain: conf.mailgunDomain,
});

exports.sendEmail = (args, cb) =>
  new Promise((f, r) =>
    mailgun.messages().send(args, (err, body) => {
      if (err) {
        r({ err, body });
      } else {
        f(body);
      }
    })
  );
