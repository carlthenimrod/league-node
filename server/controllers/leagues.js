const router = require('express').Router();

const {League} = require('../models/league');

router.get('/', async (req, res) => {
  try {
    const leagues = await League.find();
    res.send(leagues);
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

module.exports = router;