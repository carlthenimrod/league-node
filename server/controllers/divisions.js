const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {Division} = require('../models/division');

router.get('/', async (req, res) => {
  try {
    const divisions = await Division.find();
    res.send(divisions);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/', async (req, res) => {
  const division = new Division({
    name: req.body.name
  });

  try {
    await division.save();
    res.send(division);
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
    const {name} = req.body;
    const division = await Division.findByIdAndUpdate(id, {
      name
    }, {
      new: true
    });
    res.send(division);
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
    await Division.findByIdAndDelete(id);
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;