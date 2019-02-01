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

router.post('/:id/locations', async (req, res) => {
  const id = req.params.id;
  const {name} = req.body;

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

    place.locations.push({ name });
    await place.save();
    res.send(place);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/locations/:locationId', async (req, res) => {
  const {id, locationId} = req.params;
  const {name} = req.body;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(locationId)) {
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

    const location = place.locations.id(locationId);

    if (!location) {
      const err = new Error('Location not found');
      err.status = 404;
      throw err;
    }

    location.name = name;
    await place.save();
    res.send(place);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/locations/:locationId', async (req, res) => {
  const {id, locationId} = req.params;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(locationId)) {
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

    place.locations.id(locationId).remove();
    await place.save();
    res.send();
  } catch (e) {
    next(e);
  }
});

router.post('/:id/permits', async (req, res) => {
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