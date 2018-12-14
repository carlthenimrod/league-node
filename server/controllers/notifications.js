const router = require('express').Router();

const {League} = require('../models/league');
const {Team} = require('../models/team');
const {User} = require('../models/user');

router.get('/', async (req, res) => {
  try {
    const notifications = {
      leagues: [],
      teams: [],
      users: []
    };

    const teams = await Team.find({ status: 'new' }, 'name status');
    const users = await User.find({ status: 'new' }, 'name status');
    
    if (teams) { notifications.teams = teams; }
    if (users) { notifications.users = users; }

    res.send(notifications);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;