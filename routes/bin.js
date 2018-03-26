const path = require('path');

const express = require('express');
const router = express.Router();
const showdown = require('showdown');

const dbq = require('../helpers/dbQuery.js');

router.get('/', (req, res, next) =>
  res.render('bin_view', { text: '', filename: 'file.txt', back: '.' })
);

router.post('/', (req, res, next) => {
  dbq.saveBin(
    '',
    req.body.password,
    req.body.text,
    req.body.filename,
    req.body.secret,
    (err, dbRes) => {
      if (err) {
        return res.render('error');
      }

      res.render('redirect', {
        url: './bin/' + dbRes.shortname,
        filename: 'file.txt',
      });
    }
  );
});

router.get('/:shortname', (req, res, next) => {
  dbq.getBin(req.params.shortname, (err, dbRes) => {
    if (!dbRes) {
      return res.render('no_bin');
    }

    res.render('bin_view', {
      text: dbRes.text,
      filename: dbRes.filename,
      back: '..',
    });
  });
});

router.post('/:shortname', (req, res, next) => {
  dbq.saveBin(
    req.params.shortname,
    req.body.password,
    req.body.text,
    req.body.filename,
    req.body.secret,
    (err, dbRes) => {
      if (err) {
        return res.render('bin_wrongPass');
      }

      res.render('bin_view', {
        text: dbRes.text,
        filename: dbRes.filename,
        back: '..',
      });
    }
  );
});

const getBinRenderer = (ext, text) =>
  ({
    '.md': {
      templateName: 'bin_render_markdown',
      args: {
        rendered: (() => {
          const converter = new showdown.Converter();
          converter.setFlavor('github');
          converter.setOption('strikethrough', true);
          return converter.makeHtml(text);
        })(),
      },
    },
    '.html': {
      templateName: 'bin_render_html',
      args: {
        content: text,
      },
    },
  }[ext]);

router.get('/:shortname/rendered', (req, res, next) => {
  dbq.getBin(req.params.shortname, (err, dbRes) => {
    if (!dbRes) {
      return res.render('no_bin');
    }

    const extension = path.extname(dbRes.filename);
    const renderer = getBinRenderer(extension, dbRes.text);
    if (!renderer) {
      // Fall back to dumping raw text if no renderer available
      res.set({ 'Content-Type': 'text/plain' });
      res.send(dbRes.text);
    } else {
      res.render(renderer.templateName, renderer.args);
    }
  });
});

module.exports = router;
