const router = require('express').Router();

const {Division} = require('../models/division');

router.get('/', async (req, res) => {

  const divisions = await Division.find();

  res.send(divisions);
});

module.exports = router;