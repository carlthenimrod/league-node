const express = require('express');
const cors = require('cors');
const path = require('path');
const sgMail = require('@sendgrid/mail');

const config = require('./config/config');
const router = require('./config/router');

require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join('server/public')));

app.use('/', router);

console.log('test');

sgMail.setApiKey('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');
const msg = {
  to: 'test@example.com',
  from: 'test@example.com',
  subject: 'Sending with Twilio SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
};
sgMail.send(msg);

const server = app.listen(config.port);
const io = require('./config/socket').init(server);