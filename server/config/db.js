const db = require('mongoose');

db.connect(process.env.DB_HOST, { 
  useFindAndModify: false,
  useNewUrlParser: true
});

module.export = {db};