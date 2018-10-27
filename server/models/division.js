const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  divisions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Division' 
  }]
});

const Division = mongoose.model('Division', DivisionSchema);

module.exports = {Division};