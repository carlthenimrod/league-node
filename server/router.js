const router = require('express').Router();

const divisions = require('./controllers/divisions');

router.use('/divisions', divisions);

module.exports = router;