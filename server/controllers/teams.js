const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {League, Division} = require('../models/league');
const {Team} = require('../models/team');
const {User} = require('../models/user');

router.get('/', async (req, res) => {
  try {
    const teams = await Team.find();
    res.send(teams);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    const team = await Team.findById(id);
    res.send(team);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/', async (req, res) => {
  let league,
      division;

  const {
    leagueId, 
    divisionId,
    name
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
    const team = new Team({name});
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
    res.status(400).send(e);
  }
});

router.put('/:id', async (req, res) => {
  let league,
      division;

  const id = req.params.id;
  const {
    leagueId, 
    divisionId,
    name
  } = req.body;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
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
    const team = await Team.findByIdAndUpdate(id, {name}, {new: true});

    // if league, update
    if (league) {
      await league.teams.findByIdAndUpdate(team._id, {name});
    }

    // if division, update
    if (division) {
      await division.teams.findByIdAndUpdate(team._id, {name});
    }

    res.send(team);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    await Team.findByIdAndDelete(id);
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/:id/users', async (req, res) => {
  const id = req.params.id;
  const {
    userId,
    name,
    roles
  } = req.body;
  let user;

  if (!ObjectID.isValid(id)) { return res.status(404).send(); }

  try {
    // check if user exists already
    if (userId) {
      user = await User.findById(userId);
      if (!user) { res.status(404).send(); }
    } else { // create new
      user = new User({name});
    }

    // find team
    const team = await Team.findById(id);
    if (!team) { res.status(404).send(); }

    // save new user, if new
    if (userId) { 
      // remove user if exists
      for (let i = 0; i < team.roster.length; i++) {5
        const u = team.roster[i].user;

        if (u._id.equals(ObjectID(user._id))) { u.remove(); }
      }
    } else {
      user.save(); 
    }

    team.roster.push({user, roles});

    await team.save();

    res.send(team);
  } catch (e) {
    return res.status(400).send(e);
  }
});

router.put('/:id/users/:userId', async (req, res) => {
  const {id, userId} = req.params;
  const {roles} = req.body;

  if (!ObjectID.isValid(id)) { return res.status(404).send(); }
  if (!ObjectID.isValid(userId)) { return res.status(404).send(); }

  try {
    // find team
    const team = await Team.findById(id);
    if (!team) { res.status(404).send(); }
    
    for (let i = 0; i < team.roster.length; i++) {5
      const u = team.roster[i].user;

      if (u._id.equals(ObjectID(userId))) {
        team.roster[i].roles = roles;
      }
    }

    await team.save();

    res.send(team);
  } catch (e) {
    return res.status(400).send(e);
  }
});

router.delete('/:id/users/:userId', async (req, res) => {
  const {id, userId} = req.params;

  if (!ObjectID.isValid(id)) { return res.status(404).send(); }
  if (!ObjectID.isValid(userId)) { return res.status(404).send(); }

  try {
    const team = await Team.findById(id);
    if (!team) { res.status(404).send(); }
    
    for (let i = 0; i < team.roster.length; i++) {5
      const u = team.roster[i].user;

      if (u._id.equals(ObjectID(userId))) {
        team.roster.splice(i, 1);
      }
    }

    await team.save();

    res.send(team);
  } catch (e) {
    return res.status(400).send(e);
  }
});

module.exports = router;