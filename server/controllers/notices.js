const router = require('express').Router();

const {Notice} = require('../models/notice');

router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find().populate('item');
    res.send(notices);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;