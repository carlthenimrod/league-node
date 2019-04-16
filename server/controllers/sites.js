const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {Site} = require('../models/site');

router.get('/', async (req, res, next) => {
  try {
    const sites = await Site.find();
    res.send(sites);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async(req, res, next) => {
  const id = req.params.id;
  const {label, url} = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const site = await Site.findById(id);
    res.send(site);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  const {label, url} = req.body;

  try {
    const site = new Site({ label, url });
    await site.save();
    res.send(site);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async(req, res, next) => {
  const id = req.params.id;
  const {label, url} = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const site = await Site.findById(id);
    site.label = label;
    site.url = url;
    await site.save();
    res.send(site);
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

    await Site.findByIdAndDelete(id);
    res.send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;