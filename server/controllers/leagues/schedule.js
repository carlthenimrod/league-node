const router = require('express').Router({ mergeParams: true });
const {ObjectID} = require('mongodb');

const {League} = require('../../models/league');
const {Game} = require('../../models/game');
const availability = require('../../helpers/availability');

router.post('/', async (req, res, next) => {
  const id = req.params.id;
  const options = {...req.body};

  try {
    if (!ObjectID.isValid(id)) { 
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const league = await League.findById(id);
    league.generateSchedule(options);

    await league.save();
    res.send(league.schedule);
  } catch (e) {
    next(e);
  }
});

router.delete('/', async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!ObjectID.isValid(id)) { 
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const league = await League.findById(id);
    league.schedule = [];

    await league.save();
    res.send();
  } catch (e) {
    next(e);
  }
});

router.post('/:id/schedule/add', async (req, res, next) => {
  const id = req.params.id;
  const label = req.body.label;

  try {
    if (!ObjectID.isValid(id)) { 
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

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
    next(e);
  }
});

router.put('/:id/schedule/:groupId', async (req, res, next) => {
  const {id, groupId} = req.params;
  const label = req.body.label;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(groupId)) { 
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const league = await League.findById(id);
    const group = league.schedule.id(groupId);
    group.label = label;

    await league.save();
    res.send(group);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/schedule/:groupId', async (req, res, next) => {
  const {id, groupId} = req.params;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(groupId)) { 
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const league = await League.findById(id);
    const group = league.schedule.id(groupId);
    group.remove();

    await league.save();
    res.send(group);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/schedule/:groupId/games', async (req, res, next) => {
  const {id, groupId} = req.params;
  const {home, away, start, time, place} = req.body;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(groupId)) { 
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

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

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(groupId) || !ObjectID.isValid(gameId)) { 
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

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