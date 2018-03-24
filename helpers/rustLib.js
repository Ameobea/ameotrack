const ffi = require('ffi');
const path = require('path');

const { Success, Failure } = require('funfix');

const library_name = path.resolve(__dirname, '../rust/target/release/librust');
const api = ffi.Library(library_name, {
  parse_english_date_string: ['int', ['string']],
});

module.exports = {
  /**
   * Attempts to parse a date string like "Tomrrow at 5PM" into a Unix Timestamp.
   */
  parseDateString: dateString => {
    console.log(`Parsing date string: ${dateString}`);
    const res = api.parse_english_date_string(dateString);
    return res === 0 ? Failure() : Success(res);
  },
};
