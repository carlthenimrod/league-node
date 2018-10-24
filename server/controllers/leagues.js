const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {League} = require('../models/league');

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
    const leagues = await League.findById(id);
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

module.exports = router;