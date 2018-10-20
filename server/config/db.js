const db = require('mongoose');
const config = require('./config');

db.connect(config.db, { 
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true
});

module.export = {db};