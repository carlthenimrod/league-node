const path = require('path');
const ejs = require('ejs');
const sgMail = require('@sendgrid/mail');

const config = require('./config');

// set API key
if (config.email.apiKey) {
  sgMail.setApiKey(config.email.apiKey);
}

// send email
const send = async (template, options, data = {}) => {
  try {
    // get to/from email address to be used
    const to = (typeof options === 'string') ? options : options.to;
    const from = options.from || config.email.fromDefault;
    
    // create path to template
    const templatePath = path.join(__dirname, '../emails/', template, '/');
    const ejsOptions = { async: true };

    // render files
    const subject = await ejs.renderFile(templatePath + 'subject.ejs', data, ejsOptions);
    const text = await ejs.renderFile(templatePath + 'text.ejs', data, ejsOptions);
    const html = await ejs.renderFile(templatePath + 'html.ejs', data, ejsOptions);

    // if we have API key, send email
    if (config.email.apiKey) {
      // create message
      const msg = {
        to,
        from,
        subject,
        text,
        html
      };
    
      // send email
      sgMail.send(msg);
    }
  } catch (e) {
    console.log(e.toString());
  }
};

module.exports = { send };