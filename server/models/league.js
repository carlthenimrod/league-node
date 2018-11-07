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

leagueSchema.methods.findDivision = function (id, elements) {
  const divisions = elements || this.divisions;
  
  for (let i = 0; i < divisions.length; i++) {
    const d = divisions[i];

    if (d._id.equals(mongoose.Types.ObjectId(id))) {
      return d;
    }

    if (d.divisions.length > 0) {
      const match = this.findDivision(id, d.divisions);
      if (match) return match;
    }
  }
}

leagueSchema.methods.findAndRemoveDivisions = function (elements) {
  const divisions = elements || this.divisions,
        children = [];

  for (let i = 0; i < divisions.length; i++) {
    const d = divisions[i];

    if (d.divisions.length > 0) {
      children.push(...findAndRemoveDivisions(d.divisions));
    }

    children.push({...d.toObject()});
  }

  divisions.length = 0;
  
  return children;
}

leagueSchema.methods.addDivision = function (division, parent) {
  if (parent) {
    const match = this.findDivision(parent);
    if (match) match.divisions.push(division);
  } else {
    this.divisions.push(division);
  }
}

leagueSchema.methods.updateDivision = function (divisionId, data, newParent) {
  const division = this.findDivision(divisionId);
  const parent = division.parent();
  newParent = newParent || this._id;

  if (!parent._id.equals(mongoose.Types.ObjectId(newParent))) {

    if (division.divisions.length > 0) {
      const divisions = this.findAndRemoveDivisions(division.divisions);
      this.divisions.push(...divisions);
    }

    const copy = {...division.toObject()};

    for (const prop in data) {
      if (data.hasOwnProperty(prop)) {
        copy[prop] = data[prop];
      }
    }

    if (this._id.equals(mongoose.Types.ObjectId(newParent))) {
      this.divisions.push(copy);
    } else {
      const match = this.findDivision(newParent);
      match.divisions.push(copy);
    }

    division.remove();

    return copy;
  } else {
    division.set(data);

    return division;
  }
}

leagueSchema.methods.removeDivision = function (divisionId) {
  const match = this.findDivision(divisionId);
  if (!match) throw new Error('No division found.');

  if (match.divisions.length > 0) {
    const divisions = this.findAndRemoveDivisions(match.divisions);
    this.divisions.push(...divisions);
  }

  match.remove();
}

const Division = mongoose.model('Division', DivisionSchema);
const League = mongoose.model('League', leagueSchema);

module.exports = {Division, League};