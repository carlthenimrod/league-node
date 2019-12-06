const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {loggedIn, isAdmin} = require('../../middleware/auth');
const {League} = require('../../models/league');

router.get('/', isAdmin, async (req, res, next) => {
  try {
    const leagues = await League.find();
    res.send(leagues);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', loggedIn, async (req, res, next) => {
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

router.post('/', isAdmin, async (req, res, next) => {
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
    next(e);
  }
});

router.put('/:id', isAdmin, async (req, res, next) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    throw err;
  }

  try {
    const {name, description} = req.body;
    const league = await League.findById(id);
    league.name = name;
    league.description = description;
    await league.save();
    res.send(league);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', isAdmin, async (req, res, next) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    throw err;
  }

  try {
    await League.findByIdAndDelete(id);
    res.send();
  } catch (e) {
    next(e);
  }
});

router.use('/:id/divisions', isAdmin, require('./divisions'));
router.use('/:id/teams', isAdmin, require('./teams'));
router.use('/:id/schedule', isAdmin, require('./schedule'));

module.exports = router;