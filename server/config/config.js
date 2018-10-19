require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT) || 3000
};

module.exports = config;