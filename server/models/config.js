const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  multi: { 
    type: Boolean, 
    default: false
  }
}, {
  collection: 'config',
  capped: { size: 1024, max: 1 }
});

const Config = mongoose.model('Config', configSchema);

module.exports = Config;