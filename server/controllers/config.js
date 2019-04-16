const router = require('express').Router();
const Config = require('../models/config');

router.get('/', async (req, res, next) => {
  try {
    const config = await Config.findOne();
    res.send(config);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  const {multi} = req.body;

  try {
    const config = new Config({ multi });
    await config.save();
    res.send(config);
  } catch (e) {
    next(e);
  }
});

module.exports = router;