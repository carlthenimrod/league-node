const express = require('express');
const cors = require('cors');
const path = require('path');
const util = require('util');

const config = require('./config/config');
const router = require('./config/router');

require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join('server/public')));

app.use('/', router);

const server = app.listen(config.port);

const io = require('./config/socket')(server);
require('./helpers/notification-handler')(io);