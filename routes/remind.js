const express = require('express');
const { Try } = require('funfix');
const R = require('ramda');

const router = express.Router();

const { parseDateString } = require('../helpers/rustLib');

const preprocessDateString = R.pipe(
  s => s.toLowerCase(),
  R.replace(/ (at)|(around)/, ''),
  R.replace(/midnight/, '12am'),
  R.replace(/morning/, '10am'),
  R.replace(/evening/, '6pm'),
  R.replace(/night/, '10pm')
);

router.get('/', (req, res) => {
  const dateString = req.query.string;

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
    .map(timestamp => ({ success: true, timestamp }))
    .getOrElse({ success: false });

  res.json(serializedResponse);
});

module.exports = router;
