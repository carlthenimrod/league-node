const mongoose = require('mongoose');

const {Team} = require('./team');

const DivisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }
});

DivisionSchema.add({ divisions: [DivisionSchema] });

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  divisions: [DivisionSchema],
  teams: [Team.schema],
  start: Date,
  end: Date
});

function addToDivisions (divisions, division, parent) {
  for (let i = 0; i < divisions.length; i++) {
    if (divisions[i]._id.equals(mongoose.Types.ObjectId(parent))) {
      divisions[i].divisions.push(division);
      return true;
    }

    if (divisions[i].divisions.length > 0) {
      if (addToDivisions(divisions[i].divisions, division, parent)) return true;
    }
  }
}

leagueSchema.methods.addDivision = function (division, parent) {
  if (parent) {
    if (!addToDivisions(this.divisions, division, parent)) {
      throw new Error('Parent not found.');
    }
  } else {
    this.divisions.push(division);
  }
}

leagueSchema.methods.updateDivision = function (data, parent) {

}

function returnSubDivisions (divisions) {
  let children = [];

  for (let i = 0; i < divisions.length; i++) {
    const division = divisions[i];

    if (division.divisions.length > 0) {
      children.push(...returnSubDivisions(division.divisions));
    }

    children.push(division);

    divisions.splice(i, 1);
  }

  return children;
}

function removeFromDivisions (divisions, divisionId) {
  let children = [];

  if (divisions.length > 0) {
    for (let i = 0; i < divisions.length; i++) {
      const division = divisions[i];

      if (division.divisions.length > 0) {
        removeFromDivisions(division.divisions, divisionId);
      }

      if (division._id.equals(mongoose.Types.ObjectId(divisionId))) {
        if (division.divisions.length > 0) {
          children.push(...returnSubDivisions(division.divisions));
        }

        if (division.divisions.length > 0) {
          children.push(...division.divisions);
        }

        divisions.splice(i, 1);
      }
    }
  }

  return children;
}

leagueSchema.methods.removeDivision = function (divisionId) {
  this.divisions.push(...removeFromDivisions(this.divisions, divisionId));
}

const Division = mongoose.model('Division', DivisionSchema);
const League = mongoose.model('League', leagueSchema);

module.exports = {Division, League};