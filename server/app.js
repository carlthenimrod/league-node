const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config/config');
const router = require('./config/router');
const mailer = require('./config/email');

require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join('server/public')));

app.use('/', router);

console.log(process.env.NODE_ENV);

const server = app.listen(config.port);
require('./config/socket').init(server);