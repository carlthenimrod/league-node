const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {League, Division} = require('../../models/league');
const {Team} = require('../../models/team');
const {User} = require('../../models/user');

router.get('/', async (req, res, next) => {
  try {
    const teams = await Team.find();
    res.send(teams);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    let team = await Team.findById(id)
      .populate('roster.user')
      .populate('pending')
      .populate('leagues', 'name schedule teams divisions')
      .populate('feed.from', 'name email img');
      
    team = Team.formatRoster(team);
    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  let league,
      division;

  const {
    leagueId, 
    divisionId,
    name,
    status
  } = req.body;

  // if leagueId provided, check if valid and exists
  if (leagueId) {
    if (ObjectID.isValid(leagueId)) {
      league = await League.findById(leagueId);
      if (!league) res.status(404).send();
    } else {
      res.status(404).send();
    }
  }

  // if divisionId provided, check if valid and exists
  if (divisionId) {
    if (ObjectID.isValid(divisionId)) {
      division = await Division.findById(divisionId);
      if (!division) res.status(404).send();
    } else {
      res.status(404).send();
    }
  }

  try {
    // create save team
    const team = new Team({name, status});
    await team.save();

    // if league, save
    if (league) {
      league.teams.push(team);
      await league.save();
    }

    // if division, save
    if (division) {
      division.teams.push(team);
      await division.save();
    }

    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  let league,
      division;

  const id = req.params.id;
  const {
    leagueId, 
    divisionId,
    name,
    status
  } = req.body;
  
  if (!ObjectID.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    throw err;
  }

  // if leagueId provided, check if valid and exists
  if (leagueId) {
    if (ObjectID.isValid(leagueId)) {
      league = await League.findById(leagueId);
      if (!league) res.status(404).send();
    } else {
      res.status(404).send();
    }
  }

  // if divisionId provided, check if valid and exists
  if (divisionId) {
    if (ObjectID.isValid(divisionId)) {
      division = await Division.findById(divisionId);
      if (!division) res.status(404).send();
    } else {
      res.status(404).send();
    }
  }

  try {
    const team = await Team.findById(id);

    if (team) {
      team.name = name;
      team.status = status;

      await team.save();
    }

    // if league, update
    if (league) {
      await league.teams.findByIdAndUpdate(team._id, {name, status});
    }

    // if division, update
    if (division) {
      await division.teams.findByIdAndUpdate(team._id, {name, status});
    }

    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    throw err;
  }

  try {
    await Team.findByIdAndDelete(id);
    res.send();
  } catch (e) {
    next(e);
  }
});

router.post('/:id/users', async (req, res, next) => {
  const id = req.params.id;
  const {
    userId,
    name,
    roles
  } = req.body;
  let user;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('ID not found.');
      err.status = 404;
      throw err;
    }

    // check if user exists already
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        const err = new Error('User not found.');
        err.status = 404;
        throw err;
      }
    } else { // create new
      user = new User({name});
    }

    const team = await Team.findById(id).populate('roster.user');
    if (!team) {
      const err = new Error('Team not found.');
      err.status = 404;
      throw err;
    }

    // remove user if exists already
    if (userId) { 
      for (let i = 0; i < team.roster.length; i++) {5
        const u = team.roster[i].user;

        if (u._id.equals(ObjectID(user._id))) { 
          team.roster.splice(i, 1); 
        }
      }
    }

    user.addTeam(team);
    await user.save();

    team.roster.push({user, roles});

    await team.save();

    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/users/:userId', async (req, res, next) => {
  const {id, userId} = req.params;
  const {roles} = req.body;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(userId)) {
      const err = new Error('ID not found.');
      err.status = 404;
      throw err;
    }

    // find team
    const team = await Team.findById(id).populate('roster.user');
    if (!team) {
      const err = new Error('Team not found.');
      err.status = 404;
      throw err;
    }
    
    for (let i = 0; i < team.roster.length; i++) {
      const u = team.roster[i].user;

      if (u._id.equals(ObjectID(userId))) {
        team.roster[i].roles = roles;
      }
    }

    await team.save();

    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/users/:userId', async (req, res, next) => {
  const {id, userId} = req.params;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(userId)) {
      const err = new Error('ID not found.');
      err.status = 404;
      throw err;
    }

    const team = await Team.findById(id).populate('roster.user');
    if (!team) {
      const err = new Error('Team not found.');
      err.status = 404;
      throw err;
    }

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }
    
    for (let i = 0; i < team.roster.length; i++) {5
      const u = team.roster[i].user;

      if (u._id.equals(ObjectID(userId))) {
        team.roster.splice(i, 1);
      }
    }

    user.removeTeam(team._id);
    await user.save();

    await team.save();

    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/invite', async (req, res, next) => {
  const id = req.params.id;
  const userId = req.body._id;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 400;
      throw err;
    }

    const team = await Team.findById(id);
    if (!team.pending) { team.pending = []; }

    if (team.pending.indexOf(userId) !== -1) {
      const err = new Error('User already invited');
      err.status = 400;
      throw err;
    }
    
    if (!team) {
      const err = new Error('Team not found');
      err.status = 404;
      throw err;
    }

    if (userId) {
      if (!ObjectID.isValid(userId)) {
        const err = new Error('Invalid ID');
        err.status = 400;
        throw err;
      }

      const user = await User.findById(userId);
    
      if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }

      team.pending.push(userId);
      await team.save();
    }

    res.send(user);
  } catch (e) {
    next(e);
  }
});

module.exports = router;