const router = require('express').Router();

const leagues = require('../controllers/leagues');
const divisions = require('../controllers/divisions');
const teams = require('../controllers/teams');
const users = require('../controllers/users');

router.use('/leagues', leagues);
router.use('/divisions', divisions);
router.use('/teams', teams);
router.use('/users', users);

module.exports = router;