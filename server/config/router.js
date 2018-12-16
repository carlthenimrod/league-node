const router = require('express').Router();

const leagues = require('../controllers/leagues');
const teams = require('../controllers/teams');
const users = require('../controllers/users');
const notices = require('../controllers/notices');

router.use('/leagues', leagues);
router.use('/teams', teams);
router.use('/users', users);
router.use('/notices', notices);

module.exports = router;