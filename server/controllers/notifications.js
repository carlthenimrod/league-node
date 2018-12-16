const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {Notification} = require('../models/notification');
const {League} = require('../models/league');
const {Team} = require('../models/team');
const {User} = require('../models/user');

router.get('/', async (req, res) => {
  try {

    const notifications = await Notification.find().populate('item');

    res.send(notifications);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;