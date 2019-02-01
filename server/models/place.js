const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  address: {
    street: {type: String, trim: true},
    city: {type: String, trim: true},
    state: {type: String, trim: true},
    postal: {type: String, trim: true}
  },
  locations: [{ name: String }],
  permits: [{ 
    label: String,
    slots: [{
      start: Date,
      end: Date
    }]
  }]
});

const Place = mongoose.model('Place', placeSchema);

module.exports = {Place};