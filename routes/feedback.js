//! Used to send me emails from anywhere I have a feedback feature on my sites or applications

const express = require('express');
const router = express.Router();

const conf = require('../helpers/conf');
const { sendEmail } = require('../helpers/email');

/**
 * Required POST Parameters:
 * password: same as `conf.feedbackPassword`
 * appName: Name of the application for which feedback is being received
 * message: Message containing the content of the feedback that will be included in the email
 */
router.post('/', (req, res, next) => {
  if (req.body.password !== conf.feedbackPassword) {
    return res.render('wrong_password');
  }

  const data = {
    from: `AmeoTrack Feedback Sender <feedback@${conf.mailgunDomain}>`,
    to: conf.feedbackRecipient,
    subject: `${req.body.appName} Feedback`,
    text: `Email: ${req.body.email}\n\nMessage:\n${req.body.message}`,
  };

  sendEmail(data)
    .then(body => res.send(JSON.stringify(body)))
    .catch(({ err, body }) => {
      console.error(`Error while sending mail via Mailgun: ${err}`);
      res.send(body);
    });
});

module.exports = router;
