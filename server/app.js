const express = require('express');

const config = require('./config');
const router = require('./router');

require('./db');

const app = express();

app.use('/', router);

app.listen(config.port);