const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {Place} = require('../models/place');

router.get('/', async (req, res) => {
  try {
    const places = await Place.find();
    res.send(places);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res) => {
  const {
    name,
    address
  } = req.body;

  try {
    const place = new Place({ name, address });
    await place.save();
    res.send(place);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const place = await Place.findById(id);
    res.send(place);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const {
    name,
    address
  } = req.body;


  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const place = await Place.findById(id);

    if (!place) {
      const err = new Error('Place not found.');
      err.status = 404;
      throw err;
    }

    place.name = name;
    place.address = address;
    await place.save();
    res.send(place);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    await Place.findByIdAndDelete(id);
    res.send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;