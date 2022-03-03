const express = require('express');
const cors = require('cors');

require('dotenv').config();

const loginRouter = require('./routes/login');
// const dashboardRouter = require('./routes/dashboard');
// const settingsRouter = require('./routes/settings');
const teachersRouter = require('./routes/teachers');
const sites = require('./routes/sites');
const areas = require('./routes/areas');
const students = require('./routes/students');
const admin = require('./routes/admin');

const app = express();

const PORT = process.env.PORT || 3001;

// Causes a CORS (Access-Control-Allow-Credentials) error when frontend tries to fetch from backend
app.use(
  cors({
    origin: `${process.env.FRONTEND_REACT_APP_HOST}:${process.env.FRONTEND_REACT_APP_PORT}`,
    credentials: true,
  }),
);

app.use(express.json()); // this gives us req.body

// Database Schema
// https://docs.google.com/document/d/11OQiiVDpT07Rk-jz0VY7yVKsAjqZC_97wewZR32cw6w/edit

app.use('/login', loginRouter);
app.use('/teachers', teachersRouter);
app.use('/sites', sites);
app.use('/areas', areas);
app.use('/students', students);
app.use('/admin', admin);
// school district
// schools

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
