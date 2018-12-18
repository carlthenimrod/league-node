const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {Notice} = require('../models/notice');

router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find().sort('-createdAt').populate('item');
    res.send(notices);
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
    await Notice.findByIdAndDelete(id);
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;