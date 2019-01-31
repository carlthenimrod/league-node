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
  permits: [{ name: String }]
});

const Place = mongoose.model('Place', placeSchema);

module.exports = {Place};