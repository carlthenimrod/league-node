const router = require('express').Router({ mergeParams: true });
const {ObjectID} = require('mongodb');

const {League} = require('../../models/league');
const {Team} = require('../../models/team');

router.post('/', async (req, res, next) => {
  let team;
  const id = req.params.id;
  const {
    _id: teamId,
    name
  } = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    if (teamId) {
      if (!ObjectID.isValid(teamId)) {
        const err = new Error('Invalid ID');
        err.status = 404;
        throw err;
      }

      team = await Team.findById(teamId);

      if (!team) {
        const err = new Error('Team Not Found');
        err.status = 404;
        throw err;
      }
    } else {
      team = await Team.create({ name });
    }

    const league = await League.findById(id);
    league.teams.push(team);
    await league.save();

    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.put('/:teamId', async (req, res, next) => {
  const {
    id,
    teamId
  } = req.params;

  const index = req.body.index;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(teamId)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }
    
    const league = await League.findById(id);
    league.moveTeam(teamId, index);

    await league.save();

    res.send(league.teams);
  } catch (e) {
    next(e);
  }
});

router.delete('/:teamId', async (req, res, next) => {
  const {
    id,
    teamId
  } = req.params;

  try {
    if (!ObjectID.isValid(id) && !ObjectID.isValid(teamId)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const league = await League.findById(id);
    league.removeTeamFromDivisions(teamId);
    league.teams.id(teamId).remove();
    await league.save();
    res.send(league);
  } catch (e) {
    next(e);
  }
});

module.exports = router;