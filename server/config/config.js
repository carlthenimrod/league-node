require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT) || 3000,
  db: process.env.MONGODB_URI || 'mongodb://localhost:27017/league',
  accessToken: {
    secret: process.env.ACCESS_TOKEN_SECRET || 'random_string',
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '1h'
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET || 'random_string',
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'
  }
};

module.exports = config;