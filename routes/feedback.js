//! Used to send me emails from anywhere I have a feedback feature on my sites or applications

const express = require('express');
const router = express.Router();

const conf = require('../helpers/conf');
const mailgun = require('mailgun-js')({apiKey: conf.mailgunKey, domain: conf.mailgunDomain});

/**
 * Required POST Parameters:
 * password: same as `conf.feedbackPassword`
 * appName: Name of the application for which feedback is being received
 * message: Message containing the content of the feedback that will be included in the email
 */
router.post('/', (req, res, next) => {
  console.log(req.body);
  if(req.body.password == conf.feedbackPassword) {
    const data = {
      from: `AmeoTrack Feedback Sender <feedback@${conf.mailgunDomain}>`,
      to: conf.feedbackRecipient,
      subject: `${req.body.appName} Feedback`,
      text: req.body.message,
      html: req.body.message,
    };

    mailgun.messages().send(data, (err, body) => {
      res.send(JSON.stringify(body));
    });
  } else {
    res.render('wrong_password');
  }
});

module.exports = router;
