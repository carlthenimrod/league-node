require('dotenv').config();

const config = {
  baseUrl: process.env.EMAIL_FROM_DEFAULT || 'https://localhost:4200/',
  port: parseInt(process.env.PORT) || 3000,
  db: process.env.MONGODB_URI || 'mongodb://localhost:27017/league',
  accessToken: {
    secret: process.env.ACCESS_TOKEN_SECRET || 'random_string',
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '1h'
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET || 'random_string',
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'
  },
  email: {
    apiKey: process.env.EMAIL_API_KEY || false,
    fromDefault: process.env.EMAIL_FROM_DEFAULT || false,
  }
};

module.exports = config;