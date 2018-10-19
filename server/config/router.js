const router = require('express').Router();

const divisions = require('../controllers/divisions');
const teams = require('../controllers/teams');

router.use('/divisions', divisions);
router.use('/teams', teams);

module.exports = router;