const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  label: {
    required: true,
    trim: true,
    type: String
  },
  url: {
    required: true,
    trim: true,
    type: String
  }
});

const Site = mongoose.model('Site', siteSchema);

module.exports = {Site};