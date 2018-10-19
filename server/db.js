const db = require('mongoose');

db.connect(process.env.DB_HOST, { useNewUrlParser: true });

module.export = {db};