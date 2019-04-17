const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {League, Division} = require('../models/league');
const {Site} = require('../models/site');
const {Team} = require('../models/team');
const {Game} = require('../models/game');
const availability = require('../helpers/availability');

router.get('/', async (req, res) => {
  try {
    const leagues = await League.find();
    res.send(leagues);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    throw err;
  }

  try {
    const league = await League.findById(id);
    res.send(league);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res) => {
  const league = new League({
    name: req.body.name,
    description: req.body.description,
    start: req.body.start,
    end: req.body.end
  });

  try {
    await league.updateSites(req.body.sites);
    await league.save();
    res.send(league);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    const {name, description, sites} = req.body;
    const league = await League.findById(id);
    league.name = name;
    league.description = description;
    await league.updateSites(sites);
    await league.save();
    res.send(league);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    res.status(404).send();
  }

  try {
    await Site.updateMany({}, { $pull: { leagues: { _id: id } } });
    await League.findByIdAndDelete(id);
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/:id/divisions', async (req, res) => {
  const id = req.params.id;
  const {
    name,
    parent
  } = req.body;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    const league = await League.findById(id);
    if (!league) res.status(404).send();

    const division = new Division({name});

    league.addDivision(division, parent);
    await league.save();
    res.send(division);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.put('/:id/divisions/:divisionId', async (req, res) => {
  const id = req.params.id;
  const divisionId = req.params.divisionId;
  const {
    name,
    parent,
    index
  } = req.body;
  
  if (!ObjectID.isValid(id) || !ObjectID.isValid(divisionId)) {
    return res.status(404).send();
  }

  try {
    const league = await League.findById(id);
    if (!league) res.status(404).send();

    league.updateDivision(divisionId, {name}, parent, index);
    await league.save();
    res.send(league.divisions);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/:id/divisions/:divisionId', async (req, res) => {
  const id = req.params.id,
        divisionId = req.params.divisionId;

  if (!ObjectID.isValid(id) || !ObjectID.isValid(divisionId)) {
    return res.status(404).send();
  }

  try {
    const league = await League.findById(id);
    if (!league) res.status(404).send();

    league.removeDivision(divisionId);
    await league.save();
    res.send(league.divisions);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/:id/teams', async (req, res) => {
  let team;
  const id = req.params.id;
  const {
    _id: teamId,
    name
  } = req.body;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    if (teamId) {
      team = await Team.findById(teamId);
      if (!team) res.status(404).send();
    } else {
      team = await Team.create({name});
    }

    const league = await League.findById(id);
    league.teams.push(team);
    await league.save();

    res.send(team);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.put('/:id/teams/:teamId', async (req, res) => {
  const {
    id,
    teamId
  } = req.params;

  const index = req.body.index;

  if (!ObjectID.isValid(id) || !ObjectID.isValid(teamId)) {
    return res.status(404).send();
  }

  try {
    const league = await League.findById(id);
    league.moveTeam(teamId, index);

    await league.save();

    res.send(league.teams);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/:id/teams/:teamId', async (req, res) => {
  const {
    id,
    teamId
  } = req.params;

  if (!ObjectID.isValid(id) && !ObjectID.isValid(teamId)) {
    res.status(404).send();
  }

  try {
    const league = await League.findById(id);
    league.removeTeamFromDivisions(teamId);
    league.teams.id(teamId).remove();
    await league.save();
    res.send(league);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/:id/divisions/:divisionId/teams/:teamId', async (req, res) => {
  const {
    id,
    divisionId,
    teamId
  } = req.params;
  const index = req.body.index;

  if (!ObjectID.isValid(id) && !ObjectID.isValid(divisionId) && !ObjectID.isValid(teamId)) {
    res.status(404).send();
  }

  try {
    const league = await League.findById(id);
    league.addTeamToDivision(divisionId, teamId, index);
    await league.save();
    res.send(league.divisions);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/:id/schedule', async (req, res) => {
  const id = req.params.id;
  const options = {...req.body};

  if (!ObjectID.isValid(id)) { res.status(404).send(); }

  try {
    const league = await League.findById(id);
    league.generateSchedule(options);

    await league.save();
    res.send(league.schedule);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/:id/schedule', async (req, res) => {
  const id = req.params.id;
  const options = {...req.body};

  if (!ObjectID.isValid(id)) { res.status(404).send(); }

  try {
    const league = await League.findById(id);
    league.schedule = [];

    await league.save();
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/:id/schedule/add', async (req, res) => {
  const id = req.params.id;
  const label = req.body.label;

  if (!ObjectID.isValid(id)) { res.status(404).send(); }

  try {
    const league = await League.findById(id);
    const group = {
      _id: ObjectID(),
      label,
      games: []
    };

    league.schedule.push(group);

    await league.save();
    res.send(group);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.put('/:id/schedule/:groupId', async (req, res) => {
  const {id, groupId} = req.params;
  const label = req.body.label;

  if (!ObjectID.isValid(id) || !ObjectID.isValid(groupId)) { res.status(404).send(); }

  try {
    const league = await League.findById(id);
    const group = league.schedule.id(groupId);
    group.label = label;

    await league.save();
    res.send(group);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/:id/schedule/:groupId', async (req, res) => {
  const {id, groupId} = req.params;

  if (!ObjectID.isValid(id) || !ObjectID.isValid(groupId)) { res.status(404).send(); }

  try {
    const league = await League.findById(id);
    const group = league.schedule.id(groupId);
    group.remove();

    await league.save();
    res.send(group);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/:id/schedule/:groupId/games', async (req, res, next) => {
  const {id, groupId} = req.params;
  const {home, away, start, time, place} = req.body;

  if (!ObjectID.isValid(id) || !ObjectID.isValid(groupId)) { 
    const err = new Error('Invalid ID');
    err.status = 404;
    throw err;
  }

  try {
    const league = await League.findById(id);
    const group = league.schedule.id(groupId);
    const game = new Game({
      home,
      away,
      start,
      time,
      place
    });

    group.games.push(game);
    await league.save();
    res.send(league.schedule);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/schedule/:groupId/games/:gameId', async (req, res, next) => {
  const {id, groupId, gameId} = req.params;
  const {home, away, start, time, place} = req.body;

  if (!ObjectID.isValid(id) || !ObjectID.isValid(groupId) || !ObjectID.isValid(gameId)) { 
    const err = new Error('Invalid ID');
    err.status = 404;
    throw err;
  }

  try {
    const league = await League.findById(id);
    const group = league.schedule.id(groupId);
    const game = group.games.id(gameId);

    // update data
    game.home = home;
    game.away = away;
    game.start = start;
    game.time = time;
    game.place = place;

    // if place selected, check if available and save
    if (place && place._id) { await availability.check(game); }

    await league.save();

    res.send(league.schedule);
  } catch (e) {
    next(e);
  }
});

module.exports = router;