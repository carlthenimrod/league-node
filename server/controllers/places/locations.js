const router = require('express').Router({ mergeParams: true });
const {ObjectID} = require('mongodb');

const {Place} = require('../../models/place');

router.post('/', async (req, res, next) => {
  const {id} = req.params;
  const {name} = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const place = await Place.findById(id);
    place.locations.push({ name });
    await place.save();
    res.send(place);
  } catch (e) {
    next(e);
  }
});