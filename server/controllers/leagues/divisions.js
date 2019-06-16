const router = require('express').Router({ mergeParams: true });
const {ObjectID} = require('mongodb');

const {League, Division} = require('../../models/league');

router.post('/', async (req, res, next) => {
  const id = req.params.id;
  const {
    name,
    parent
  } = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const league = await League.findById(id);
    if (!league) {
      const err = new Error('League Not Found');
      err.status = 404;
      throw err;
    }

    const division = new Division({name});

    league.addDivision(division, parent);
    await league.save();
    res.send(division);
  } catch (e) {
    next(e);
  }
});

router.put('/:divisionId', async (req, res, next) => {
  const id = req.params.id;
  const divisionId = req.params.divisionId;
  const {
    name,
    parent,
    index
  } = req.body;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(divisionId)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const league = await League.findById(id);
    if (!league) {
      const err = new Error('League Not Found');
      err.status = 404;
      throw err;
    }

    league.updateDivision(divisionId, {name}, parent, index);
    await league.save();
    res.send(league.divisions);
  } catch (e) {
    next(e);
  }
});

router.delete('/:divisionId', async (req, res, next) => {
  const id = req.params.id,
        divisionId = req.params.divisionId;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(divisionId)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const league = await League.findById(id);
    if (!league) {
      const err = new Error('League Not Found');
      err.status = 404;
      throw err;
    }

    league.removeDivision(divisionId);
    await league.save();
    res.send(league.divisions);
  } catch (e) {
    next(e);
  }
});

router.post('/:divisionId/teams/:teamId', async (req, res, next) => {
  const {
    id,
    divisionId,
    teamId
  } = req.params;
  const index = req.body.index;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(divisionId) || !ObjectID.isValid(teamId)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const league = await League.findById(id);
    if (!league) {
      const err = new Error('League Not Found');
      err.status = 404;
      throw err;
    }

    league.addTeamToDivision(divisionId, teamId, index);
    await league.save();
    res.send(league.divisions);
  } catch (e) {
    next(e);
  }
});

module.exports = router;