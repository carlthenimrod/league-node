const router = require('express').Router();

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

module.exports = router;