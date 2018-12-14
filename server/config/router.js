const router = require('express').Router();

const leagues = require('../controllers/leagues');
const teams = require('../controllers/teams');
const users = require('../controllers/users');
const notifications = require('../controllers/notifications');

router.use('/leagues', leagues);
router.use('/teams', teams);
router.use('/users', users);
router.use('/notifications', notifications);

module.exports = router;