const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors');
const path = require('path');

const config = require('./config/config');
const router = require('./config/router');

require('./config/db');

const app = express();
expressWs(app);

app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join('server/public')));

app.use('/', router);

app.listen(config.port);