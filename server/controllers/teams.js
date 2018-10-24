const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {Team} = require('../models/team');

router.get('/', async (req, res) => {
  try {
    const teams = await Team.find().populate('division');
    res.send(teams);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/', async (req, res) => {
  const team = new Team({
    name: req.body.name,
    division: req.body.division
  });

  try {
    await team.save();
    res.send(team);
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
    const {name, division} = req.body;
    const team = await Team.findByIdAndUpdate(id, {
      name,
      division
    }, {
      new: true
    });
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