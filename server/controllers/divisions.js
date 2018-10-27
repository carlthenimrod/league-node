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

module.exports = router;