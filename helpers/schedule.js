const schedule = require('node-schedule');
const axios = require('axios');

const conf = require('../helpers/conf');
const dbq = require('../helpers/dbQuery');
const remindersDb = require('../helpers/dbFunctions/reminders');
const dbHelpers = require('../helpers/dbFunctions/helpers');
const { sendEmail } = require('../helpers/email');

const sendReminder = (message) =>
  sendEmail({
    to: conf.feedbackRecipient,
    from: `AmeoTrack Reminders <reminders@${conf.mailgunDomain}>`,
    subject: `REMINDER: message`,
    text: message,
  });

/**
 * Registers a reminder with `node-schedule`
 */
const registerReminder = ({ unix_timestamp, message }) =>
  schedule.scheduleJob(new Date(unix_timestamp * 1000), () =>
    sendReminder(message)
  );
exports.registerReminder = registerReminder;

exports.init = async () => {
  // Delete expired files every minute
  schedule.scheduleJob('1 * * * * *', () => {
    dbq.checkExpiredFiles((rows) => {
      if (!rows) {
        return;
      }

      rows.forEach(async ({ shortname, extension }) => {
        dbq.doDelete(shortname, conf.password, console.log);

        // Delete from BunnyCDN external storage as well
        const fileName = extension ? `${shortname}.${extension}` : shortname;
        const fileUrl = `https://storage.bunnycdn.com/${conf.storageZoneName}/${fileName}`;

        for (let i = 0; i < 20; i += 1) {
          try {
            await axios.delete(fileUrl, {
              headers: { AccessKey: conf.accessKey },
            });
            console.log(`Deleted ${fileName} from external storage.`);
            break;
          } catch (error) {
            console.error(
              `Error deleting file ${fileName} to external storage:`,
              { message: error.message, fileUrl }
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      });
    });
  });

  // Schedule reminders
  const conn = await dbHelpers.dbConnectPromise();
  let loadedReminders;
  try {
    loadedReminders = await remindersDb.loadReminders(conn);
  } catch (err) {
    return console.error(`Error loading reminders from database: ${err}`);
  }

  loadedReminders.length > 0 &&
    console.log(
      `Scheduling ${loadedReminders.length} reminder${
        loadedReminders.length > 1 ? 's' : ''
      }...`
    );

  loadedReminders.forEach(registerReminder);
};

exports.createReminder = async (unix_timestamp, message) => {
  const conn = await dbHelpers.dbConnectPromise();
  await remindersDb.setReminder(conn, unix_timestamp, message);
  registerReminder({ unix_timestamp, message });
};
