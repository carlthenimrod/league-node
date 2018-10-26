const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  parent: mongoose.Schema.Types.ObjectId
});

const Division = mongoose.model('Division', DivisionSchema);

module.exports = {Division};