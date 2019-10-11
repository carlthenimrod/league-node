const db = require('mongoose');
const config = require('./config');

db.connect(config.db, { 
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  useNewUrlParser: true
});

module.export = {db};