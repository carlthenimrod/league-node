const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {League} = require('../models/league');
const {Division} = require('../models/division');

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

router.post('/:id/divisions', async (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    res.status(404).send();
  }

  if (req.body.parent && !ObjectID.isValid(req.body.parent)) {
    res.status(404).send();
  }

  try {
    const league = await League.findById(id);
    if (!league) res.status(404).send();

    const division = new Division({
      name: req.body.name,
      parent: req.body.parent
    });
    league.divisions.push(division);

    await league.save();

    res.send(division);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.put('/:id/divisions/:divisionId', async (req, res) => {
  const id = req.params.id;
  const divisionId = req.params.divisionId;
  
  if (!ObjectID.isValid(id) || !ObjectID.isValid(divisionId)) {
    return res.status(404).send();
  }

  try {
    const league = await League.findById(id);
    const division = league.divisions.id(divisionId);
    
    const {name, parent} = req.body;
    division.name = name;
    division.parent = parent;

    await league.save();

    res.send(division);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;