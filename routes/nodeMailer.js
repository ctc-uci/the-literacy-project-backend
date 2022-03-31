const express = require('express');

const emailRouter = express();
const transporter = require('../transporter');

emailRouter.use(express.json());

emailRouter.post('/', async (req, res) => {
  try {
    const { email, htmlMessage } = req.body;

    const mail = {
      from: `${process.env.REACT_APP_EMAIL_FIRST_NAME} ${process.env.REACT_APP_EMAIL_LAST_NAME} ${process.env.REACT_APP_EMAIL_USERNAME}`,
      to: email,
      subject: 'Set Up TLP Account',
      html: htmlMessage,
    };

    await transporter.sendMail(mail);

    return res.status(200).send('Email sent');
  } catch (err) {
    return res.status(400).send(err.message);
  }
});

module.exports = emailRouter;
