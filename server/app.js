const express = require('express');
const cors = require('cors');

const config = require('./config/config');
const router = require('./config/router');

require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', router);

app.listen(config.port);