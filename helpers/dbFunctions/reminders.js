const reminders = exports;

reminders.loadReminders = connection =>
  new Promise((f, r) =>
    connection.query(
      'SELECT * FROM `reminders` WHERE `unix_timestamp` >= ?',
      [parseInt(new Date().getTime() / 1000)],
      (err, res) => {
        if (err || !res) {
          r(err);
        } else {
          f(res);
        }
      }
    )
  );

reminders.setReminder = (connection, unix_timestamp, message) =>
  new Promise((f, r) =>
    connection.query(
      'INSERT INTO `reminders` SET ?',
      { unix_timestamp, message },
      (err, res) => {
        if (err || !res) {
          r(err);
        } else {
          f(res);
        }
      }
    )
  );
