const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {League} = require('../models/league');
const {Division} = require('../models/division');
const {Team} = require('../models/team');

router.get('/', async (req, res) => {
  try {
    const teams = await Team.find();
    res.send(teams);
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
      league.teams.findByIdAndUpdate(team._id, {name});
    }

    // if division, update
    if (division) {
      division.teams.findByIdAndUpdate(team._id, {name});
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

module.exports = router;