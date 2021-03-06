const express = require('express');
const cors = require('cors');

require('dotenv').config();

// const settingsRouter = require('./routes/settings');
const teachers = require('./routes/teachers');
const sites = require('./routes/sites');
const areas = require('./routes/areas');
const students = require('./routes/students');
const admins = require('./routes/admins');
const studentGroups = require('./routes/studentGroups');
const tlpUsers = require('./routes/tlpUsers');
const { authRouter } = require('./routes/auth'); // add verifyToken
const emailRouter = require('./routes/nodeMailer');

const app = express();

const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: `${process.env.FRONTEND_REACT_APP_HOST}:${process.env.FRONTEND_REACT_APP_PORT}`,
    credentials: true,
  }),
);
app.use(express.json()); // this gives us req.body

// Database Schema
// https://docs.google.com/document/d/11OQiiVDpT07Rk-jz0VY7yVKsAjqZC_97wewZR32cw6w/edit

app.use('/teachers', teachers);
app.use('/sites', sites);
app.use('/areas', areas);
app.use('/students', students);
app.use('/admins', admins);
app.use('/student-groups', studentGroups);
app.use('/tlp-users', tlpUsers);
app.use('/auth', authRouter);
app.use('/send-email', emailRouter);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
