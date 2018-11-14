const mongoose = require('mongoose');
const _ = require('lodash');

const {Team} = require('./team');

const DivisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  teams: [Team.schema]
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

leagueSchema.methods.findParentInChildren = function (divisions, id) {
  for (let i = 0; i < divisions.length; i++) {
    const d = divisions[i];

    if (d._id.equals(mongoose.Types.ObjectId(id))) return true;

    if (d.divisions.length > 0) {
      const result = this.findParentInChildren(d.divisions, id);
      if (result) return true;
    }
  }

  return false;
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

  const copy = _.cloneDeep(division.toObject());
  division.remove();

  for (const prop in data) {
    if (data.hasOwnProperty(prop)) {
      copy[prop] = data[prop];
    }
  }

  if (!parent._id.equals(mongoose.Types.ObjectId(newParent))) {

    if (this._id.equals(mongoose.Types.ObjectId(newParent))) {
      this.divisions.push(copy);
    } else {
      const result = this.findParentInChildren(division.divisions, newParent);
      
      if (result) {
        this.divisions.push(...copy.divisions);
        copy.divisions.length = 0;
      }
      
      const match = this.findDivision(newParent);
      match.divisions.push(copy);
    }
  } else {
    parent.divisions.push(copy);

    return copy;
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

leagueSchema.methods.addTeamToDivision = function (id, divisionId, teamId) {
  const team = this.teams.id(teamId);
  if (!team) throw new Error('No team found.');

  const division = this.findDivision(divisionId);
  if (!division) throw new Error('No Division found.');

  division.teams.push(team);

  return team;
}

const Division = mongoose.model('Division', DivisionSchema);
const League = mongoose.model('League', leagueSchema);

module.exports = {Division, League};