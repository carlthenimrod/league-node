const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {League, Division} = require('../models/league');
const {Team} = require('../models/team');

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
    return res.status(404).send();
  }

  try {
    const league = await League.findById(id);
    res.send(league);
  } catch (e) {
    res.status(400).send(e);
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
    const {name, description} = req.body;
    const league = await League.findByIdAndUpdate(id, {
      name,
      description
    }, {
      new: true
    });
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

    const division = league.updateDivision(divisionId, {name}, parent, index);
    await league.save();
    res.send(division);
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
    res.send();
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
      team = new Team({name});
      await team.save();
    }

    const league = await League.findById(id);
    league.teams.push(team);
    await league.save();

    res.send(team);
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
    league.teams.id(teamId).remove();
    await league.save();
    res.send();
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

  if (!ObjectID.isValid(id) && !ObjectID.isValid(divisionId) && !ObjectID.isValid(teamId)) {
    res.status(404).send();
  }

  try {
    const league = await League.findById(id);
    const team = league.addTeamToDivision(id, divisionId, teamId);
    await league.save();
    res.send(team);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;