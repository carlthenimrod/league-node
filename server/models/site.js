const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  label: {
    required: true,
    trim: true,
    type: String
  },
  url: {
    trim: true,
    type: String
  },
  leagues: [{
    _id: mongoose.Types.ObjectId,
    name: String
  }]
});

const Site = mongoose.model('Site', siteSchema);

module.exports = {Site};