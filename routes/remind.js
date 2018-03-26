const express = require('express');
const { Try } = require('funfix');
const R = require('ramda');

const router = express.Router();

const { parseDateString } = require('../helpers/rustLib');
const { createReminder } = require('../helpers/schedule');

const preprocessDateString = R.pipe(
  s => s.toLowerCase(),
  R.replace(/ (at)|(around)|(in)/, ''),
  R.replace(/midnight/, '12am'),
  R.replace(/morning/, '10am'),
  R.replace(/afternoon/, '3PM'),
  R.replace(/evening/, '6pm'),
  R.replace(/night/, '10pm')
);

router.get('/', (req, res) => {
  const { dateString, message } = req.query;
  if (!dateString) {
    return res.json({ success: false, reason: 'No date string provided!' });
  } else if (!message) {
    return res.json({ success: false, reason: 'No message provided!' });
  }

  // First try to parse normally
  const parseResult = Try.of(() => {
    const timestamp = new Date(dateString).getTime();
    if (isNaN(timestamp)) {
      throw new Error();
    } else {
      return timestamp / 1000;
    }
  }).recoverWith(() => {
    return parseDateString(preprocessDateString(dateString));
  });

  const serializedResponse = parseResult
    .map(timestamp => {
      createReminder(timestamp, message);
      return {
        success: true,
        timestamp,
        message: 'Reminder successfully scheduled!',
      };
    })
    .getOrElse({
      success: false,
      reason: 'Unable to parse provided date string',
    });

  res.json(serializedResponse);
});

module.exports = router;
