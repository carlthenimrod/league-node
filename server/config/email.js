const nodemailer = require('nodemailer');
const Email = require('email-templates');
const path = require('path');

const config = require('./config');

const getTransporter = async () => {
  // create transporter for testing
  if (!config.email.host) {
    const account = await nodemailer.createTestAccount();

    if (account) {
      return nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass
        }
      });
    }
  } else {
    return nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }
};

const mailer = {
  send: async (template, options, data = {}) => {
    const transporter = await getTransporter(),
          to = (typeof options === 'string') ? options : options.to

    if (transporter) {
      try {
        const email = new Email({
          message: {
            from: options.from || config.email.default
          },
          preview: {
            app: 'chrome'
          },
          send: false,
          transport: transporter,
          views: {
            options: {
              extension: 'hbs'
            },
            root: path.join(__dirname, '../emails')
          }
        });

        const send = await email.send({
          template,
          message: { to },
          locals: {...data}
        });

        if (send) { console.log(send); }
      } catch (e) {
        return console.log(e);
      }
    }
  }
};

module.exports = mailer;