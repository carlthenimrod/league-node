const express = require('express');

const config = require('./config/config');

const app = express();

app.get('/', (req, res) => {
  res.send({
    test: 'test'
  });
});

app.listen(config.port);