const schedule = require('node-schedule');

const dbq = require('../helpers/dbQuery');
const reminders = require('../helpers/dbFunctions/reminders');
const dbHelpers = require('../helpers/dbFunctions/helpers');

const sendReminder = message => {
  console.log(`Sending reminder: ${message}`);
  // TODO
};

exports.init = async () => {
  // Delete expired files every minute
  schedule.scheduleJob('1 * * * * *', () => {
    dbq.checkExpiredFiles(rows => {
      if (!rows) {
        return;
      }

      rows.forEach(({ shortname }) => {
        dbq.doDelete(shortname, conf.password, console.log);
      });
    });
  });

  // Schedule reminders
  const conn = await dbHelpers.dbConnectPromise();
  var loadedReminders;
  try {
    loadedReminders = await reminders.loadReminders(conn);
  } catch (e) {
    return console.error(`Error loading reminders from database: ${err}`);
  }

  loadedReminders.length > 0 &&
    console.log(
      `Scheduling ${loadedReminders.length} reminder${
        loadedReminders.length > 1 ? s : ''
      }...`
    );

  loadedReminders.forEach(({ unix_timestamp, message }) => {
    schedule.scheduleJob(new Date(unix_timestamp * 1000), () =>
      sendReminder(message)
    );
  });
};
