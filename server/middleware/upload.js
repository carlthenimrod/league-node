const multer = require('multer');
const ProfileStorage = require('../config/storage');

module.exports = multer({ storage: ProfileStorage() }).single('img');