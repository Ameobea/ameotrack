const helpers = require('./helpers.js');

const f_analytics = exports;

f_analytics.get_most_accessed = (n, cb) => {
  helpers.dbConnect(connection => {
    const countQuery =
      'SELECT `image_code`, COUNT(*) AS amount FROM `hostedFiles_access` GROUP BY `image_code` ORDER BY amount DESC;';
    connection.query(countQuery, (err, result1) => {
      const add_extensions = (i, data, callback1) => {
        const query =
          'SELECT `extension` FROM `hostedFiles` WHERE `shortname` = ?';
        connection.query(query, [data[i].image_code], (err, result2) => {
          data[i].extension = result2[0] ? result2[0].extension : 'DEL';

          if (data.length > i + 1) {
            add_extensions(i + 1, data, callback1);
          } else {
            callback1(data);
          }

          connection.end(err =>
            console.error('Error while closing MySQL Connection!')
          );
        });
      };

      add_extensions(0, result1, cb);
    });
  });
};
