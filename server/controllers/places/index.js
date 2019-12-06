const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {Place} = require('../../models/place');

router.get('/', async (req, res, next) => {
  try {
    const places = await Place.find();
    res.send(places);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

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

router.post('/', async (req, res, next) => {
  const {
    label,
    address,
    locations
  } = req.body;

  try {
    const place = new Place({ label, address, locations });
    await place.save();
    res.send(place);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const {label, address, locations} = req.body;

    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const place = await Place.findById(id);
    place.label = label;
    place.address = address;
    place.locations = locations;
    await place.save();

    res.send(place);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
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

router.post('/:id/permits', async (req, res, next) => {
  const id = req.params.id;
  const {label, slots} = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const place = await Place.findById(id);

    if (!place) {
      const err = new Error('Place not found');
      err.status = 404;
      throw err;
    }

    place.permits.push({ label, slots });
    await place.save();
    res.send(place);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/permits/:permitId', async (req, res) => {
  const {id, permitId} = req.params;
  const {label, slots} = req.body;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(permitId)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const place = await Place.findById(id);

    if (!place) {
      const err = new Error('Place not found');
      err.status = 404;
      throw err;
    }

    const permit = place.permits.id(permitId);

    if (!permit) {
      const err = new Error('Permit not found');
      err.status = 404;
      throw err;
    }

    permit.label = label;
    permit.slots = slots;
    await place.save();
    res.send(place);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/permits/:permitId', async (req, res) => {
  const {id, permitId} = req.params;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(permitId)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const place = await Place.findById(id);

    if (!place) {
      const err = new Error('Place not found');
      err.status = 404;
      throw err;
    }

    place.permits.id(permitId).remove();
    await place.save();
    res.send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;