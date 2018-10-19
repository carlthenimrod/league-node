const db = require('mongoose');

db.connect(process.env.MONGODB_URI, { 
  useFindAndModify: false,
  useNewUrlParser: true
});

module.export = {db};