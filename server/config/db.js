const db = require('mongoose');

db.connect(process.env.MONGODB_URI, { 
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true
});

module.export = {db};