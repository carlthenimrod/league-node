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
  },
  email: {
    apiKey: process.env.SENDGRID_API_KEY || false,
    host: process.env.EMAIL_HOST || false,
    port: process.env.EMAIL_PORT || false,
    user: process.env.EMAIL_USERNAME || false,
    pass: process.env.EMAIL_PASSWORD || false,
    secure: (process.env.EMAIL_SECURE.toLocaleLowerCase() === 'true') || false,
    default: process.env.EMAIL_FROM_DEFAULT || false
  }
};

module.exports = config;