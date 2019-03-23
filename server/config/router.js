const router = require('express').Router();

const auth = require('../controllers/auth');
const leagues = require('../controllers/leagues');
const teams = require('../controllers/teams');
const users = require('../controllers/users');
const places = require('../controllers/places');
const notices = require('../controllers/notices');

router.use('/auth', auth);
router.use('/leagues', leagues);
router.use('/notices', notices);
router.use('/teams', teams);
router.use('/users', users);
router.use('/places', places);

router.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

router.use((error, req, res, next) => {
  res.status(error.status || 500).send({
    error: {
      message: error.message
    }
  });
});

module.exports = router;