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
  status: {
    type: String,
    enum: ['draft', 'recruiting', 'active', 'completed', 'canceled'],
    default: 'draft'
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

    children.push(_.cloneDeep(d.toObject()));
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

leagueSchema.methods.updateDivision = function (divisionId, data, newParent, index) {
  const division = this.findDivision(divisionId);

  if (newParent) {
    const parent = division.parent();
    newParent = newParent || this._id;
  
    const copy = _.cloneDeep(division.toObject());
  
    for (const prop in data) {
      if (data.hasOwnProperty(prop)) {
        copy[prop] = data[prop];
      }
    }
  
    if (!parent._id.equals(mongoose.Types.ObjectId(newParent))) {
      division.remove();
  
      if (this._id.equals(mongoose.Types.ObjectId(newParent))) {
        // check if index is provided, position
        if (typeof index === 'number') {
          this.divisions.splice(index, 0, copy);
        } else {
          this.divisions.push(copy);
        }
      } else {
        const result = this.findParentInChildren(division.divisions, newParent);
        
        if (result) {
          parent.divisions.push(...copy.divisions);
          copy.divisions.length = 0;
        }
        
        const match = this.findDivision(newParent);
  
        // check if index is provided, position
        if (typeof index === 'number') {
          match.divisions.splice(index, 0, copy);
        } else {
          match.divisions.push(copy);
        }
      }
    } else {
      // check if index is provided, position
      if ((typeof index === 'number') && (index < parent.divisions.length)) {
        const newDivisions = [];
        
        parent.divisions.forEach((d, i) => {
          if (index === i) { newDivisions.push(copy); }
          if (!d._id.equals(mongoose.Types.ObjectId(copy._id))) { 
            newDivisions.push(_.cloneDeep(d));
          }
        });
        
        parent.divisions = newDivisions;
      } else {
        division.remove();
        parent.divisions.push(copy);
      }
    }
  } else {
    for (const prop in data) {
      if (data.hasOwnProperty(prop)) {
        division[prop] = data[prop];
      }
    }
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

leagueSchema.methods.addTeamToDivision = function (divisionId, teamId, index) {
  const team = this.teams.id(teamId);
  if (!team) throw new Error('No team found.');

  const division = this.findDivision(divisionId);
  if (!division) throw new Error('No Division found.');

  this.removeTeamFromDivisions(teamId);

  if (typeof index === 'number') {
    division.teams.splice(index, 0, team);
  } else {
    division.teams.push(team);
  }
}

leagueSchema.methods.removeTeamFromDivisions = function (teamId, elements) {
  const divisions = elements || this.divisions;

  // for each division
  for (let i = 0; i < divisions.length; i++) {
    const d = divisions[i];
    
    // search teams
    if (d.teams.length > 0) {
      for (let x = 0; x < d.teams.length; x++) {
        const t = d.teams[x];
        
        if (t._id.equals(mongoose.Types.ObjectId(teamId))) { t.remove(); }
      }
    }

    // if sub-division exist, do same thing
    if (d.divisions.length > 0) { this.removeTeamFromDivisions(teamId, d.divisions); }
  }
}

leagueSchema.methods.moveTeam = function (teamId, index) {
  const team = this.teams.id(teamId);

  // insert team, remove old team
  this.teams.splice(index, 0, _.cloneDeep(team.toObject()));

  this.teams.forEach((t, i) => {
    if (t.equals(mongoose.Types.ObjectId(teamId)) && !t.isNew) {
      this.teams.splice(i, 1);
    }
  });
}

const Division = mongoose.model('Division', DivisionSchema);
const League = mongoose.model('League', leagueSchema);

module.exports = {Division, League};